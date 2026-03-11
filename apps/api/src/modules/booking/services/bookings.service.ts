import { Injectable, NotFoundException, BadRequestException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Booking } from "../entities/booking.entity";
import { Service } from "../entities/service.entity";
import { CreateBookingDto, UpdateBookingDto, CheckAvailabilityDto } from "../dto/booking.dto";
import { BookingStatus, MembershipStatus } from "../../../common/enums";
import { Org } from "../../identity/entities/org.entity";
import { Membership } from "../../identity/entities/membership.entity";
import { Notification } from "../../notification/entities/notification.entity";
import { NotificationService } from "../../notification/notification.service";
import { isValidTimeZone, parseIncomingDateTimeAsOrgTime } from "../helpers/date-time.helper";
import { NotificationsService } from "../../notifications/notifications.service";

export interface ListBookingsOptions {
  orgId: string;
  staffId?: string;
  clientId?: string;
  status?: BookingStatus;
  startDate?: Date;
  endDate?: Date;
  page?: number;
  limit?: number;
}

export interface PaginatedBookings {
  items: Booking[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class BookingsService {
  constructor(
    @InjectRepository(Booking)
    private readonly bookingRepository: Repository<Booking>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Org)
    private readonly orgRepository: Repository<Org>,
    private readonly notificationsService: NotificationsService,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
    @InjectRepository(Notification)
    private readonly notificationRepository: Repository<Notification>,
    private readonly notificationService: NotificationService,
  ) {}

  async create(orgId: string, dto: CreateBookingDto): Promise<Booking> {
    // Get service to calculate end time
    const service = await this.serviceRepository.findOne({
      where: { id: dto.serviceId, orgId },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const orgTimeZone = await this.getOrgTimeZone(orgId);
    const startTime = parseIncomingDateTimeAsOrgTime(dto.startTime, orgTimeZone);
    const endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);

    // Check for conflicts
    const hasConflict = await this.checkConflict(orgId, dto.staffId, startTime, endTime);

    if (hasConflict) {
      throw new BadRequestException("This time slot is already booked");
    }

    const booking = this.bookingRepository.create({
      orgId,
      clientId: dto.clientId ?? null,
      clientName: dto.clientName ?? null,
      staffId: dto.staffId,
      serviceId: dto.serviceId,
      startTime,
      endTime,
      status: BookingStatus.Scheduled,
      notes: dto.notes ?? null,
      source: dto.source?.trim() || "dashboard",
    });

    const saved = await this.bookingRepository.save(booking);
    const createdBooking = await this.findById(saved.id, orgId);
    await this.notificationsService.queueBookingCreated(createdBooking, orgTimeZone);

    if (saved.source === "sms") {
      await this.createSmsBookingNotifications(createdBooking, orgTimeZone);
    }

    return createdBooking;
  }

  async findAll(options: ListBookingsOptions): Promise<PaginatedBookings> {
    const { orgId, staffId, clientId, status, startDate, endDate, page = 1, limit = 20 } = options;

    const queryBuilder = this.bookingRepository
      .createQueryBuilder("booking")
      .leftJoinAndSelect("booking.client", "client")
      .leftJoinAndSelect("booking.staff", "staff")
      .leftJoinAndSelect("booking.service", "service")
      .where("booking.orgId = :orgId", { orgId });

    if (staffId) {
      queryBuilder.andWhere("booking.staffId = :staffId", { staffId });
    }

    if (clientId) {
      queryBuilder.andWhere("booking.clientId = :clientId", { clientId });
    }

    if (status) {
      queryBuilder.andWhere("booking.status = :status", { status });
    }

    if (startDate) {
      queryBuilder.andWhere("booking.startTime >= :startDate", { startDate });
    }

    if (endDate) {
      queryBuilder.andWhere("booking.endTime <= :endDate", { endDate });
    }

    const [items, total] = await queryBuilder
      .orderBy("booking.startTime", "ASC")
      .skip((page - 1) * limit)
      .take(limit)
      .getManyAndCount();

    return {
      items,
      total,
      page,
      limit,
      totalPages: Math.ceil(total / limit),
    };
  }

  async findForCalendar(
    orgId: string,
    startDate: Date,
    endDate: Date,
    staffId?: string,
  ): Promise<Booking[]> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder("booking")
      .leftJoinAndSelect("booking.client", "client")
      .leftJoinAndSelect("booking.staff", "staff")
      .leftJoinAndSelect("booking.service", "service")
      .where("booking.orgId = :orgId", { orgId })
      .andWhere("booking.startTime >= :startDate", { startDate })
      .andWhere("booking.endTime <= :endDate", { endDate })
      .andWhere("booking.status NOT IN (:...excluded)", {
        excluded: [BookingStatus.Cancelled],
      });

    if (staffId) {
      queryBuilder.andWhere("booking.staffId = :staffId", { staffId });
    }

    return queryBuilder.orderBy("booking.startTime", "ASC").getMany();
  }

  async findById(id: string, orgId: string): Promise<Booking> {
    const booking = await this.bookingRepository.findOne({
      where: { id, orgId },
      relations: ["client", "staff", "service"],
    });

    if (!booking) {
      throw new NotFoundException("Booking not found");
    }

    return booking;
  }

  async update(id: string, orgId: string, dto: UpdateBookingDto): Promise<Booking> {
    const booking = await this.findById(id, orgId);
    const orgTimeZone = await this.getOrgTimeZone(orgId);

    let startTime = booking.startTime;
    let endTime = booking.endTime;
    let serviceId = booking.serviceId;

    // If service is being changed, recalculate end time
    if (dto.serviceId && dto.serviceId !== booking.serviceId) {
      const service = await this.serviceRepository.findOne({
        where: { id: dto.serviceId, orgId },
      });

      if (!service) {
        throw new NotFoundException("Service not found");
      }

      serviceId = dto.serviceId;
      startTime = dto.startTime
        ? parseIncomingDateTimeAsOrgTime(dto.startTime, orgTimeZone)
        : booking.startTime;
      endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);
    } else if (dto.startTime) {
      // If only start time is changing, recalculate with current service
      const service = await this.serviceRepository.findOne({
        where: { id: serviceId, orgId },
      });

      if (service) {
        startTime = parseIncomingDateTimeAsOrgTime(dto.startTime, orgTimeZone);
        endTime = new Date(startTime.getTime() + service.durationMinutes * 60 * 1000);
      }
    }

    // Check for conflicts if time or staff changed
    const staffId = dto.staffId ?? booking.staffId;
    const timeOrStaffChanged =
      dto.startTime || dto.staffId || (dto.serviceId && dto.serviceId !== booking.serviceId);

    if (timeOrStaffChanged) {
      const hasConflict = await this.checkConflict(orgId, staffId, startTime, endTime, id);

      if (hasConflict) {
        throw new BadRequestException("This time slot is already booked");
      }
    }

    const updatedBooking = {
      ...booking,
      ...(dto.clientId !== undefined && { clientId: dto.clientId }),
      ...(dto.clientName !== undefined && { clientName: dto.clientName }),
      ...(dto.staffId !== undefined && { staffId: dto.staffId }),
      serviceId,
      startTime,
      endTime,
      ...(dto.status !== undefined && { status: dto.status }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
    };

    await this.bookingRepository.save(updatedBooking);
    return this.findById(id, orgId);
  }

  async cancel(id: string, orgId: string): Promise<Booking> {
    const booking = await this.findById(id, orgId);

    if (booking.status === BookingStatus.Cancelled) {
      throw new BadRequestException("Booking is already cancelled");
    }

    const updatedBooking = {
      ...booking,
      status: BookingStatus.Cancelled,
    };

    await this.bookingRepository.save(updatedBooking);
    return this.findById(id, orgId);
  }

  async checkAvailability(dto: CheckAvailabilityDto): Promise<boolean> {
    const orgTimeZone = await this.getOrgTimeZone(dto.orgId);
    const startTime = parseIncomingDateTimeAsOrgTime(dto.startTime, orgTimeZone);
    const endTime = parseIncomingDateTimeAsOrgTime(dto.endTime, orgTimeZone);

    const hasConflict = await this.checkConflict(
      dto.orgId,
      dto.staffId,
      startTime,
      endTime,
      dto.excludeBookingId,
    );

    return !hasConflict;
  }

  private async checkConflict(
    orgId: string,
    staffId: string,
    startTime: Date,
    endTime: Date,
    excludeBookingId?: string,
  ): Promise<boolean> {
    const queryBuilder = this.bookingRepository
      .createQueryBuilder("booking")
      .where("booking.orgId = :orgId", { orgId })
      .andWhere("booking.staffId = :staffId", { staffId })
      .andWhere("booking.status NOT IN (:...excluded)", {
        excluded: [BookingStatus.Cancelled, BookingStatus.NoShow],
      })
      .andWhere("booking.startTime < :endTime", { endTime })
      .andWhere("booking.endTime > :startTime", { startTime });

    if (excludeBookingId) {
      queryBuilder.andWhere("booking.id != :excludeBookingId", { excludeBookingId });
    }

    const count = await queryBuilder.getCount();
    return count > 0;
  }

  private async createSmsBookingNotifications(
    booking: Booking,
    orgTimeZone: string | null,
  ): Promise<void> {
    const memberships = await this.membershipRepository.find({
      where: { orgId: booking.orgId, status: MembershipStatus.Active },
      select: ["userId"],
    });

    if (memberships.length === 0) {
      return;
    }

    const clientName =
      booking.client?.name?.trim() || booking.clientName?.trim() || "Walk-in client";
    const serviceName = booking.service?.name?.trim() || "Service";
    const staffName = booking.staff?.name?.trim() || "Staff member";
    const formattedStart = this.formatBookingStart(booking.startTime, orgTimeZone);

    const notifications = memberships.map((membership) =>
      this.notificationRepository.create({
        orgId: booking.orgId,
        userId: membership.userId,
        bookingId: booking.id,
        type: "booking_created_sms",
        title: "New chat booking",
        message: `${clientName} booked ${serviceName} with ${staffName} at ${formattedStart}.`,
        data: {
          bookingId: booking.id,
          source: "sms",
          clientName,
          serviceName,
          staffName,
          startTime: booking.startTime.toISOString(),
          timeZone: orgTimeZone,
        },
      }),
    );

    const savedNotifications = await this.notificationRepository.save(notifications);
    this.notificationService.broadcastNewNotifications(savedNotifications);
  }

  private formatBookingStart(startTime: Date, timeZone: string | null): string {
    try {
      return new Intl.DateTimeFormat("en-US", {
        timeZone: timeZone ?? undefined,
        month: "short",
        day: "numeric",
        hour: "numeric",
        minute: "2-digit",
        hour12: true,
      }).format(startTime);
    } catch {
      return startTime.toISOString();
    }
  }

  private async getOrgTimeZone(orgId: string): Promise<string | null> {
    const org = await this.orgRepository.findOne({
      where: { id: orgId },
      select: ["timeZone"],
    });

    const value = org?.timeZone?.trim();
    if (!value) {
      return null;
    }

    return isValidTimeZone(value) ? value : null;
  }
}
