import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { ServicesService } from "../../booking/services/services.service";
import { StaffServicesService } from "../../booking/services/staff-services.service";
import { StaffAvailabilityService } from "../../booking/services/staff-availability.service";
import { BookingsService } from "../../booking/services/bookings.service";
import type { ToolResult, ToolExecutionContext } from "./tool-result.type";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

const ISO_DATE_RE = /^\d{4}-\d{2}-\d{2}$/;

const WEEKDAY_INDEX: Record<string, number> = {
  sunday: 0,
  monday: 1,
  tuesday: 2,
  wednesday: 3,
  thursday: 4,
  friday: 5,
  saturday: 6,
};

const WEEKDAY_RE =
  /^(?:next\s+|this\s+)?(sunday|monday|tuesday|wednesday|thursday|friday|saturday)$/;

@Injectable()
export class ChatToolExecutor {
  constructor(
    @InjectPinoLogger(ChatToolExecutor.name)
    private readonly logger: PinoLogger,
    private readonly servicesService: ServicesService,
    private readonly staffServicesService: StaffServicesService,
    private readonly staffAvailabilityService: StaffAvailabilityService,
    private readonly bookingsService: BookingsService,
  ) {}

  async execute(
    toolCallId: string,
    functionName: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext,
  ): Promise<ToolResult> {
    const startedAtMs = Date.now();
    this.logger.info(
      {
        toolCallId,
        functionName,
        orgId: context.orgId,
        argKeys: Object.keys(args),
      },
      "Tool execution started",
    );
    try {
      const result = await this.dispatch(functionName, args, context);
      this.logger.info(
        {
          toolCallId,
          functionName,
          orgId: context.orgId,
          durationMs: Date.now() - startedAtMs,
          resultSize: JSON.stringify(result).length,
        },
        "Tool execution completed",
      );
      return { toolCallId, functionName, result: JSON.stringify(result) };
    } catch (error) {
      const message = error instanceof Error ? error.message : String(error);
      this.logger.error({ err: error, functionName, args }, "Tool execution failed");
      return {
        toolCallId,
        functionName,
        result: JSON.stringify({ error: message }),
      };
    }
  }

  private async dispatch(
    functionName: string,
    args: Record<string, unknown>,
    context: ToolExecutionContext,
  ): Promise<unknown> {
    const { orgId } = context;

    switch (functionName) {
      case "list_services":
        return this.handleListServices(orgId);

      case "get_staff_for_service":
        return this.handleGetStaffForService(orgId, args.service_id as string);

      case "get_available_slots":
        return this.handleGetAvailableSlots(
          orgId,
          args.staff_id as string,
          args.date as string,
          args.duration_minutes as number,
          context,
        );

      case "get_working_hours":
        return this.handleGetWorkingHours(orgId, args.staff_id as string | undefined);

      case "create_booking":
        return this.handleCreateBooking(
          orgId,
          {
            staffId: args.staff_id as string,
            serviceId: args.service_id as string,
            startTime: args.start_time as string,
            clientName: args.client_name as string,
            notes: args.notes as string | undefined,
          },
          context,
        );

      default:
        return { error: `Unknown function: ${functionName}` };
    }
  }

  private async handleListServices(orgId: string) {
    const services = await this.servicesService.findAll(orgId);
    return services.map((s) => ({
      id: s.id,
      name: s.name,
      description: s.description,
      durationMinutes: s.durationMinutes,
      price: Number(s.price),
    }));
  }

  private async handleGetStaffForService(orgId: string, serviceId: string) {
    const memberships = await this.staffServicesService.getStaffForService(orgId, serviceId);
    const staff = memberships.map((m) => ({
      staffId: m.userId,
      name: m.user?.name ?? m.user?.email ?? "Staff",
      email: m.user?.email,
    }));

    if (staff.length === 0) {
      return {
        staff,
        note: "No staff are assigned to this service yet.",
      };
    }

    return { staff };
  }

  private async handleGetAvailableSlots(
    orgId: string,
    staffId: string,
    date: string,
    durationMinutes: number,
    context: ToolExecutionContext,
  ) {
    const resolvedDate = this.resolveDate(date, context);
    if (!resolvedDate) {
      return {
        error: `Could not resolve date: "${date}". The date may be in the past. Do NOT compute dates yourself — pass the user's phrase exactly (e.g. "today", "tomorrow", "next monday").`,
      };
    }

    const slots = await this.staffAvailabilityService.getAvailableSlots(
      orgId,
      staffId,
      resolvedDate,
      durationMinutes,
    );

    const parsed = this.parseIsoDateAsUtc(resolvedDate);
    const dayName = Number.isFinite(parsed.getTime())
      ? (DAY_NAMES[parsed.getUTCDay()] ?? null)
      : null;

    const tz = context.timeZone ?? "UTC";

    return {
      date: resolvedDate,
      dayName,
      timeZone: tz,
      slots: slots.map((s) => ({
        start: s.startTime,
        end: s.endTime,
        startLocal: this.formatTimeInTz(s.startTime, tz),
        endLocal: this.formatTimeInTz(s.endTime, tz),
      })),
    };
  }

  private resolveDate(input: string, context: ToolExecutionContext): string | null {
    if (!input || typeof input !== "string") {
      return null;
    }

    const trimmed = input.trim();

    // Already YYYY-MM-DD — validate and reject if in the past
    if (ISO_DATE_RE.test(trimmed)) {
      const parsed = this.parseIsoDateAsUtc(trimmed);
      if (!Number.isFinite(parsed.getTime())) {
        return null;
      }
      const tz = context.timeZone ?? "UTC";
      const todayIso = this.formatDateInTz(tz);
      if (trimmed < todayIso) {
        this.logger.warn(
          { input: trimmed, today: todayIso },
          "LLM sent a past date — rejecting so it retries with a relative phrase",
        );
        return null;
      }
      return trimmed;
    }

    const tz = context.timeZone ?? "UTC";
    const todayIso = this.formatDateInTz(tz);
    const today = this.parseIsoDateAsUtc(todayIso);
    const normalized = trimmed.toLowerCase();

    if (normalized === "today") {
      return todayIso;
    }

    if (normalized === "tomorrow") {
      return this.formatDateUtc(this.addDays(today, 1));
    }

    // "monday", "next tuesday", "this friday", etc.
    const weekdayMatch = normalized.match(WEEKDAY_RE);
    if (weekdayMatch) {
      const targetDay = WEEKDAY_INDEX[weekdayMatch[1]];
      const currentDay = today.getUTCDay();
      let delta = (targetDay - currentDay + 7) % 7;
      // "tuesday" on a Tuesday → next week, not today
      if (delta === 0) {
        delta = 7;
      }
      return this.formatDateUtc(this.addDays(today, delta));
    }

    this.logger.warn({ input }, "Unresolvable date received from LLM");
    return null;
  }

  private formatDateInTz(timeZone: string): string {
    const parts = new Intl.DateTimeFormat("en-CA", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(new Date());

    const year = parts.find((p) => p.type === "year")?.value ?? "1970";
    const month = parts.find((p) => p.type === "month")?.value ?? "01";
    const day = parts.find((p) => p.type === "day")?.value ?? "01";

    return `${year}-${month}-${day}`;
  }

  private formatTimeInTz(isoString: string, timeZone: string): string {
    const date = new Date(isoString);
    return new Intl.DateTimeFormat("en-US", {
      timeZone,
      hour: "numeric",
      minute: "2-digit",
      hour12: true,
    }).format(date);
  }

  private addDays(date: Date, days: number): Date {
    return new Date(date.getTime() + days * 86_400_000);
  }

  private parseIsoDateAsUtc(isoDate: string): Date {
    return new Date(`${isoDate}T00:00:00.000Z`);
  }

  private formatDateUtc(date: Date): string {
    const y = date.getUTCFullYear();
    const m = String(date.getUTCMonth() + 1).padStart(2, "0");
    const d = String(date.getUTCDate()).padStart(2, "0");
    return `${y}-${m}-${d}`;
  }

  private async handleGetWorkingHours(orgId: string, staffId?: string) {
    const records = await this.staffAvailabilityService.getWorkingHours(orgId, staffId);

    return records.map((r) => ({
      staffId: r.staffId ?? staffId ?? null,
      staffName: "Staff",
      dayOfWeek: r.dayOfWeek,
      dayName: DAY_NAMES[r.dayOfWeek] ?? String(r.dayOfWeek),
      startTime: r.startTime,
      endTime: r.endTime,
      isAvailable: r.isAvailable,
    }));
  }

  private async handleCreateBooking(
    orgId: string,
    params: {
      staffId: string;
      serviceId: string;
      startTime: string;
      clientName: string;
      notes?: string;
    },
    context: ToolExecutionContext,
  ) {
    const booking = await this.bookingsService.create(orgId, {
      staffId: params.staffId,
      serviceId: params.serviceId,
      startTime: params.startTime,
      clientName: params.clientName,
      notes: params.notes,
      source: context.source?.trim() || "sms",
    });

    return {
      bookingId: booking.id,
      staffName: booking.staff?.name ?? null,
      serviceName: booking.service?.name ?? null,
      startTime: booking.startTime,
      endTime: booking.endTime,
      status: booking.status,
      clientName: booking.clientName,
    };
  }
}
