import { BadRequestException, Injectable, NotFoundException } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectRepository } from "@nestjs/typeorm";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import Stripe from "stripe";
import { Repository } from "typeorm";
import { SubscriptionStatus, MembershipStatus } from "../../common/enums";
import { Membership } from "../identity/entities/membership.entity";
import { Org } from "../identity/entities/org.entity";
import { BillingCustomer } from "./entities/billing-customer.entity";
import { BillingSubscription } from "./entities/billing-subscription.entity";

type PlanKey = "monthly" | "yearly";

@Injectable()
export class BillingService {
  private readonly stripe: Stripe;

  constructor(
    @InjectPinoLogger(BillingService.name)
    private readonly logger: PinoLogger,
    @InjectRepository(BillingCustomer)
    private readonly billingCustomerRepo: Repository<BillingCustomer>,
    @InjectRepository(BillingSubscription)
    private readonly billingSubscriptionRepo: Repository<BillingSubscription>,
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Org)
    private readonly orgRepo: Repository<Org>,
    private readonly config: ConfigService,
  ) {
    const secretKey = this.config.get<string>("STRIPE_SECRET_KEY");
    if (!secretKey) {
      throw new Error("STRIPE_SECRET_KEY is not configured");
    }
    this.stripe = new Stripe(secretKey);
  }

  private getPriceId(plan: PlanKey) {
    const key =
      plan === "yearly"
        ? "STRIPE_PRICE_YEARLY"
        : plan === "monthly"
          ? "STRIPE_PRICE_MONTHLY"
          : undefined;
    if (!key) {
      throw new BadRequestException("Invalid billing plan");
    }
    const priceId = this.config.get<string>(key);
    if (!priceId) {
      throw new BadRequestException(`Missing Stripe price for ${plan}`);
    }
    return priceId;
  }

  private getPlanFromPriceId(priceId?: string | null) {
    if (!priceId) {
      return null;
    }
    const monthly = this.config.get<string>("STRIPE_PRICE_MONTHLY");
    const yearly = this.config.get<string>("STRIPE_PRICE_YEARLY");
    if (priceId === monthly) return "monthly";
    if (priceId === yearly) return "yearly";
    return "custom";
  }

  private getFrontendBaseUrl() {
    return (
      this.config.get<string>("FRONTEND_URL") ||
      this.config.get<string>("APP_URL") ||
      "http://localhost:3000"
    );
  }

  private async ensureOrg(orgId?: string) {
    if (!orgId) {
      throw new BadRequestException("Missing org context");
    }
    const org = await this.orgRepo.findOne({ where: { id: orgId } });
    if (!org) {
      throw new NotFoundException("Organization not found");
    }
    return org;
  }

  private async countSeats(orgId: string) {
    const count = await this.membershipRepo.count({
      where: { orgId, status: MembershipStatus.Active },
    });
    return Math.max(count, 1);
  }

  private async ensureCustomer(orgId: string, orgName: string) {
    const existing = await this.billingCustomerRepo.findOne({ where: { orgId } });
    if (existing?.customerId) {
      return existing.customerId;
    }

    const customer = await this.stripe.customers.create({
      name: orgName,
      metadata: { orgId },
    });

    const record = this.billingCustomerRepo.create({
      orgId,
      customerId: customer.id,
      provider: "stripe",
    });
    await this.billingCustomerRepo.save(record);

    return customer.id;
  }

  private async upsertSubscriptionFromStripe(
    orgId: string,
    customerId: string,
    subscription: Stripe.Subscription,
  ) {
    const item = subscription.items.data[0];
    if (!item?.price?.id) {
      this.logger.warn(`Stripe subscription missing items for org ${orgId}`);
      return;
    }

    const existing = await this.billingSubscriptionRepo.findOne({ where: { orgId } });
    const mappedStatus = this.mapStripeStatus(subscription.status);
    const convertedAt =
      mappedStatus === SubscriptionStatus.Active &&
      existing?.trialConvertedAt == null &&
      existing?.trialEnd != null
        ? new Date()
        : undefined;

    const data: Partial<BillingSubscription> = {
      orgId,
      provider: "stripe",
      customerId,
      subscriptionId: subscription.id,
      subscriptionItemId: item.id,
      status: mappedStatus,
      priceId: item.price.id,
      quantity: item.quantity ?? 1,
      currentPeriodStart: subscription.current_period_start
        ? new Date(subscription.current_period_start * 1000)
        : null,
      currentPeriodEnd: subscription.current_period_end
        ? new Date(subscription.current_period_end * 1000)
        : null,
      trialStart: subscription.trial_start
        ? new Date(subscription.trial_start * 1000)
        : (existing?.trialStart ?? null),
      trialEnd: subscription.trial_end ? new Date(subscription.trial_end * 1000) : null,
      cancelAtPeriodEnd: subscription.cancel_at_period_end ?? false,
      trialConvertedAt: convertedAt,
    };

    const entity = this.billingSubscriptionRepo.create({
      id: existing?.id,
      ...data,
    });
    await this.billingSubscriptionRepo.save(entity);
  }

  private mapStripeStatus(status?: string | null) {
    switch (status) {
      case "trialing":
        return SubscriptionStatus.Trialing;
      case "active":
        return SubscriptionStatus.Active;
      case "past_due":
        return SubscriptionStatus.PastDue;
      case "incomplete":
        return SubscriptionStatus.Incomplete;
      case "unpaid":
      case "canceled":
      case "incomplete_expired":
      case "paused":
        return SubscriptionStatus.Canceled;
      default:
        return SubscriptionStatus.Incomplete;
    }
  }

  async createCheckoutSession(_userId: string, orgId: string | undefined, plan: PlanKey) {
    const org = await this.ensureOrg(orgId);
    const priceId = this.getPriceId(plan);
    const seatCount = await this.countSeats(org.id);

    const existing = await this.billingSubscriptionRepo.findOne({ where: { orgId: org.id } });
    if (existing) {
      const blocked = [SubscriptionStatus.Active, SubscriptionStatus.PastDue];
      if (blocked.includes(existing.status)) {
        throw new BadRequestException("Subscription already active");
      }
    }

    const customerId = await this.ensureCustomer(org.id, org.name);
    const now = new Date();
    const trialEnd =
      existing?.status === SubscriptionStatus.Trialing &&
      existing.trialEnd &&
      existing.trialEnd > now
        ? existing.trialEnd
        : null;
    const baseUrl = this.getFrontendBaseUrl();
    const successUrl =
      this.config.get<string>("STRIPE_SUCCESS_URL") ||
      `${baseUrl.replace(/\/$/, "")}/dashboard/billing?success=1&session_id={CHECKOUT_SESSION_ID}`;
    const cancelUrl =
      this.config.get<string>("STRIPE_CANCEL_URL") ||
      `${baseUrl.replace(/\/$/, "")}/dashboard/billing?canceled=1`;

    const session = await this.stripe.checkout.sessions.create({
      mode: "subscription",
      customer: customerId,
      line_items: [{ price: priceId, quantity: seatCount }],
      subscription_data: {
        trial_end: trialEnd ? Math.floor(trialEnd.getTime() / 1000) : undefined,
        metadata: { orgId: org.id },
      },
      client_reference_id: org.id,
      success_url: successUrl,
      cancel_url: cancelUrl,
      metadata: { orgId: org.id },
    });

    if (!session.url) {
      throw new BadRequestException("Stripe session did not return a URL");
    }

    if (existing) {
      await this.billingSubscriptionRepo.update(
        { orgId: org.id },
        {
          priceId,
          quantity: seatCount,
          customerId,
          status:
            existing.status === SubscriptionStatus.TrialExpired
              ? SubscriptionStatus.Incomplete
              : existing.status,
        },
      );
    }

    return { url: session.url };
  }

  async completeCheckoutSession(_userId: string, orgId: string | undefined, sessionId: string) {
    const org = await this.ensureOrg(orgId);
    if (!sessionId) {
      throw new BadRequestException("Missing checkout session id");
    }

    const session = await this.stripe.checkout.sessions.retrieve(sessionId, {
      expand: ["subscription", "customer"],
    });
    if (session.mode !== "subscription") {
      throw new BadRequestException("Checkout session is not subscription mode");
    }

    const sessionOrgId = session.metadata?.orgId ?? session.client_reference_id;
    if (sessionOrgId && sessionOrgId !== org.id) {
      throw new BadRequestException("Checkout session does not match org");
    }

    const customerId =
      typeof session.customer === "string" ? session.customer : session.customer?.id;
    if (!customerId) {
      throw new BadRequestException("Checkout session missing customer id");
    }

    const billingCustomer = this.billingCustomerRepo.create({
      orgId: org.id,
      customerId,
      provider: "stripe",
    });
    await this.billingCustomerRepo.save(billingCustomer);

    const subscription =
      typeof session.subscription === "string"
        ? await this.stripe.subscriptions.retrieve(session.subscription)
        : session.subscription;
    if (!subscription) {
      return { ok: true };
    }

    await this.upsertSubscriptionFromStripe(org.id, customerId, subscription);
    return { ok: true };
  }

  async createPortalSession(_userId: string, orgId: string | undefined) {
    const org = await this.ensureOrg(orgId);
    const customer = await this.billingCustomerRepo.findOne({ where: { orgId: org.id } });
    if (!customer?.customerId) {
      throw new NotFoundException("Billing customer not found");
    }

    const baseUrl = this.getFrontendBaseUrl();
    const returnUrl =
      this.config.get<string>("STRIPE_PORTAL_RETURN_URL") ||
      `${baseUrl.replace(/\/$/, "")}/dashboard/billing`;

    const session = await this.stripe.billingPortal.sessions.create({
      customer: customer.customerId,
      return_url: returnUrl,
    });

    return { url: session.url };
  }

  async getStatus(_userId: string, orgId: string | undefined) {
    const org = await this.ensureOrg(orgId);
    const seatCount = await this.countSeats(org.id);
    let subscription = await this.billingSubscriptionRepo.findOne({ where: { orgId: org.id } });

    if (
      subscription?.status === SubscriptionStatus.Trialing &&
      subscription.trialEnd &&
      subscription.trialEnd < new Date()
    ) {
      await this.billingSubscriptionRepo.update(
        { orgId: org.id },
        { status: SubscriptionStatus.TrialExpired, endedAt: new Date() },
      );
      subscription = await this.billingSubscriptionRepo.findOne({ where: { orgId: org.id } });
    }

    if (subscription) {
      try {
        await this.syncSeatCount(org.id, seatCount, subscription);
      } catch {
        this.logger.warn(`Failed to sync seats for org ${org.id}`);
      }
    }

    return {
      orgId: org.id,
      seatCount,
      subscription: subscription
        ? {
            status: subscription.status,
            priceId: subscription.priceId,
            quantity: subscription.quantity,
            currentPeriodStart: subscription.currentPeriodStart,
            currentPeriodEnd: subscription.currentPeriodEnd,
            trialStart: subscription.trialStart,
            trialEnd: subscription.trialEnd,
            cancelAtPeriodEnd: subscription.cancelAtPeriodEnd,
            plan: this.getPlanFromPriceId(subscription.priceId),
          }
        : null,
    };
  }

  async syncSeatCount(orgId: string, seatCount?: number, subscriptionRecord?: BillingSubscription) {
    const subscription =
      subscriptionRecord || (await this.billingSubscriptionRepo.findOne({ where: { orgId } }));
    if (!subscription) {
      return { synced: false, reason: "no_subscription" };
    }

    const syncable = [SubscriptionStatus.Active, SubscriptionStatus.Trialing];
    if (!syncable.includes(subscription.status)) {
      return { synced: false, reason: "inactive" };
    }
    if (!subscription.subscriptionId) {
      return { synced: false, reason: "no_stripe_subscription" };
    }

    const desiredSeats = Math.max(
      typeof seatCount === "number" ? seatCount : await this.countSeats(orgId),
      1,
    );

    let subscriptionItemId = subscription.subscriptionItemId;
    let currentQuantity = subscription.quantity;
    if (!subscriptionItemId) {
      const stripeSub = await this.stripe.subscriptions.retrieve(subscription.subscriptionId);
      const item = stripeSub.items.data[0];
      if (!item) {
        return { synced: false, reason: "missing_item" };
      }
      subscriptionItemId = item.id;
      currentQuantity = item.quantity ?? currentQuantity;
      await this.billingSubscriptionRepo.update(
        { orgId },
        {
          subscriptionItemId,
          status: this.mapStripeStatus(stripeSub.status),
          priceId: item.price?.id ?? subscription.priceId,
          quantity: currentQuantity,
          currentPeriodStart: stripeSub.current_period_start
            ? new Date(stripeSub.current_period_start * 1000)
            : null,
          currentPeriodEnd: stripeSub.current_period_end
            ? new Date(stripeSub.current_period_end * 1000)
            : null,
          trialEnd: stripeSub.trial_end ? new Date(stripeSub.trial_end * 1000) : null,
          cancelAtPeriodEnd: stripeSub.cancel_at_period_end ?? false,
        },
      );
    }

    if (currentQuantity !== desiredSeats && subscriptionItemId) {
      await this.stripe.subscriptionItems.update(subscriptionItemId, {
        quantity: desiredSeats,
      });
      await this.billingSubscriptionRepo.update({ orgId }, { quantity: desiredSeats });
      return { synced: true };
    }

    return { synced: false, reason: "no_change" };
  }

  async handleWebhook(payload: Buffer, signature?: string | string[]) {
    const webhookSecret = this.config.get<string>("STRIPE_WEBHOOK_SECRET");
    if (!webhookSecret) {
      throw new BadRequestException("Stripe webhook secret is not configured");
    }

    const sigHeader = Array.isArray(signature) ? signature[0] : signature;
    if (!sigHeader) {
      throw new BadRequestException("Missing Stripe signature");
    }

    const rawPayload = Buffer.isBuffer(payload) ? payload : Buffer.from(JSON.stringify(payload));
    let event: Stripe.Event;
    try {
      event = this.stripe.webhooks.constructEvent(rawPayload, sigHeader, webhookSecret);
    } catch {
      throw new BadRequestException("Invalid Stripe webhook signature");
    }

    if (event.type === "checkout.session.completed") {
      const session = event.data.object as Stripe.Checkout.Session;
      if (session.mode !== "subscription") {
        return { received: true };
      }

      const orgId = session.metadata?.orgId ?? session.client_reference_id;
      const customerId =
        typeof session.customer === "string" ? session.customer : session.customer?.id;
      const subscriptionId =
        typeof session.subscription === "string" ? session.subscription : session.subscription?.id;

      if (!orgId || !customerId) {
        this.logger.warn(
          `Checkout session missing org/customer: orgId=${orgId}, customerId=${customerId}`,
        );
        return { received: true };
      }

      await this.billingCustomerRepo.save(
        this.billingCustomerRepo.create({
          orgId,
          customerId,
          provider: "stripe",
        }),
      );

      if (subscriptionId) {
        try {
          const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
          await this.upsertSubscriptionFromStripe(orgId, customerId, subscription);
        } catch (error: unknown) {
          const message = error instanceof Error ? error.message : String(error);
          this.logger.error(`Failed to fetch subscription ${subscriptionId}: ${message}`);
        }
      }

      this.logger.info({ orgId }, "Checkout completed");
      return { received: true };
    }

    if (event.type === "invoice.payment_succeeded") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

      if (!subscriptionId) {
        return { received: true };
      }

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const orgId = subscription.metadata?.orgId;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
      if (!orgId || !customerId) {
        this.logger.warn(`Invoice paid missing org metadata for subscription ${subscriptionId}`);
        return { received: true };
      }

      await this.billingCustomerRepo.save(
        this.billingCustomerRepo.create({
          orgId,
          customerId,
          provider: "stripe",
        }),
      );
      await this.upsertSubscriptionFromStripe(orgId, customerId, subscription);
      this.logger.info({ orgId, subscriptionId }, "Invoice paid");
      return { received: true };
    }

    if (event.type === "invoice.payment_failed") {
      const invoice = event.data.object as Stripe.Invoice;
      const subscriptionId =
        typeof invoice.subscription === "string" ? invoice.subscription : invoice.subscription?.id;

      if (!subscriptionId) {
        return { received: true };
      }

      const subscription = await this.stripe.subscriptions.retrieve(subscriptionId);
      const orgId = subscription.metadata?.orgId;
      if (!orgId) {
        this.logger.warn(`Invoice failed missing org metadata for subscription ${subscriptionId}`);
        return { received: true };
      }

      await this.billingSubscriptionRepo.update({ orgId }, { status: SubscriptionStatus.PastDue });
      this.logger.warn(`Payment failed for org ${orgId}, subscription ${subscriptionId}`);
      return { received: true };
    }

    if (
      event.type === "customer.subscription.created" ||
      event.type === "customer.subscription.updated" ||
      event.type === "customer.subscription.deleted"
    ) {
      const subscription = event.data.object as Stripe.Subscription;
      const customerId =
        typeof subscription.customer === "string"
          ? subscription.customer
          : subscription.customer?.id;
      if (!customerId) {
        this.logger.warn("Stripe webhook missing customer id");
        return { received: true };
      }

      let orgId = subscription.metadata?.orgId;
      if (!orgId) {
        const customer = await this.stripe.customers.retrieve(customerId);
        if (!customer || (customer as Stripe.DeletedCustomer).deleted) {
          this.logger.warn(`Stripe customer ${customerId} not found for webhook`);
          return { received: true };
        }
        orgId = (customer as Stripe.Customer).metadata?.orgId;
      }

      if (!orgId) {
        this.logger.warn(`Stripe webhook missing org metadata for customer ${customerId}`);
        return { received: true };
      }

      await this.billingCustomerRepo.save(
        this.billingCustomerRepo.create({
          orgId,
          customerId,
          provider: "stripe",
        }),
      );

      const item = subscription.items.data[0];
      if (!item?.price?.id) {
        this.logger.warn(`Stripe webhook missing subscription items for org ${orgId}`);
        return { received: true };
      }

      await this.upsertSubscriptionFromStripe(orgId, customerId, subscription);
    }

    return { received: true };
  }
}
