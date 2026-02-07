import { Injectable } from "@nestjs/common";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import { isValid, parseISO } from "date-fns";
import { ServicesService } from "../../booking/services/services.service";
import { StaffServicesService } from "../../booking/services/staff-services.service";
import { StaffAvailabilityService } from "../../booking/services/staff-availability.service";
import { BookingsService } from "../../booking/services/bookings.service";
import type { ToolResult, ToolExecutionContext } from "./tool-result.type";

const DAY_NAMES = ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"];

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
      const message = error instanceof Error ? error.message : "Unknown error occurred";
      this.logger.error({ err: message, functionName, args }, "Tool execution failed");
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
        return this.handleCreateBooking(orgId, {
          staffId: args.staff_id as string,
          serviceId: args.service_id as string,
          startTime: args.start_time as string,
          clientName: args.client_name as string,
          notes: args.notes as string | undefined,
        });

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
    return memberships.map((m) => ({
      staffId: m.userId,
      name: m.user?.name ?? m.user?.email ?? "Staff",
      email: m.user?.email,
    }));
  }

  private async handleGetAvailableSlots(
    orgId: string,
    staffId: string,
    date: string,
    durationMinutes: number,
    context: ToolExecutionContext,
  ) {
    const resolvedDate = this.resolveRelativeDate(date, context);
    const slots = await this.staffAvailabilityService.getAvailableSlots(
      orgId,
      staffId,
      resolvedDate,
      durationMinutes,
    );
    return slots.map((s) => ({
      start: s.startTime,
      end: s.endTime,
    }));
  }

  private resolveRelativeDate(input: string, context: ToolExecutionContext): string {
    if (!input || typeof input !== "string") {
      return input;
    }

    const normalized = input.trim().toLowerCase();
    const baseIso =
      context.today ||
      (context.timeZone
        ? this.buildDateIsoInTimeZone(context.timeZone)
        : this.buildDateIsoInTimeZone("UTC"));

    if (this.isIsoDate(normalized)) {
      return normalized;
    }

    if (normalized === "today") {
      return baseIso;
    }

    if (normalized === "tomorrow") {
      return this.addDaysToIsoDate(baseIso, 1);
    }

    if (normalized === "yesterday") {
      return this.addDaysToIsoDate(baseIso, -1);
    }

    const weekdayMatch = normalized.match(
      /^(next|this)?\s*(monday|tuesday|wednesday|thursday|friday|saturday|sunday)$/,
    );

    if (weekdayMatch) {
      const qualifier = weekdayMatch[1];
      const weekday = weekdayMatch[2];
      const targetDay = this.weekdayToIndex(weekday);
      const baseDate = this.buildUtcDateFromIso(baseIso);

      if (targetDay === null || !baseDate) {
        return input;
      }

      const currentDay = baseDate.getUTCDay();
      let delta = (targetDay - currentDay + 7) % 7;

      if (qualifier === "next") {
        delta = delta === 0 ? 7 : delta;
      }

      return this.addDaysToIsoDate(baseIso, delta);
    }

    const inDaysMatch = normalized.match(/^in\s+(\d{1,3})\s+days?$/);
    if (inDaysMatch) {
      const delta = Number(inDaysMatch[1]);
      if (Number.isFinite(delta) && delta >= 0) {
        return this.addDaysToIsoDate(baseIso, delta);
      }
    }

    return input;
  }

  private addDaysToIsoDate(isoDate: string, deltaDays: number): string {
    const [year, month, day] = isoDate.split("-").map((value) => Number(value));
    if (!year || !month || !day) {
      return isoDate;
    }
    const utcDate = new Date(Date.UTC(year, month - 1, day + deltaDays));
    return utcDate.toISOString().slice(0, 10);
  }

  private buildUtcDateFromIso(isoDate: string): Date | null {
    if (!this.isIsoDate(isoDate)) {
      return null;
    }
    const [year, month, day] = isoDate.split("-").map((value) => Number(value));
    return new Date(Date.UTC(year, month - 1, day));
  }

  private buildDateIsoInTimeZone(timeZone: string): string {
    const now = new Date();
    const parts = new Intl.DateTimeFormat("en-US", {
      timeZone,
      year: "numeric",
      month: "2-digit",
      day: "2-digit",
    }).formatToParts(now);

    const year = parts.find((p) => p.type === "year")?.value ?? "1970";
    const month = parts.find((p) => p.type === "month")?.value ?? "01";
    const day = parts.find((p) => p.type === "day")?.value ?? "01";

    return `${year}-${month}-${day}`;
  }

  private isIsoDate(value: string): boolean {
    if (!/^\d{4}-\d{2}-\d{2}$/.test(value)) {
      return false;
    }
    const parsed = parseISO(value);
    return isValid(parsed);
  }

  private weekdayToIndex(weekday: string): number | null {
    switch (weekday) {
      case "sunday":
        return 0;
      case "monday":
        return 1;
      case "tuesday":
        return 2;
      case "wednesday":
        return 3;
      case "thursday":
        return 4;
      case "friday":
        return 5;
      case "saturday":
        return 6;
      default:
        return null;
    }
  }

  private async handleGetWorkingHours(orgId: string, staffId?: string) {
    const records = staffId
      ? await this.staffAvailabilityService.findByStaff(orgId, staffId)
      : await this.staffAvailabilityService.findAll(orgId);

    return records.map((r) => ({
      staffId: r.userId,
      staffName: r.user?.name ?? r.user?.email ?? "Staff",
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
  ) {
    const booking = await this.bookingsService.create(orgId, {
      staffId: params.staffId,
      serviceId: params.serviceId,
      startTime: params.startTime,
      clientName: params.clientName,
      notes: params.notes,
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
