import {
  BadRequestException,
  Body,
  Controller,
  Get,
  Param,
  Patch,
  Post,
  Query,
  Request,
  UseGuards,
} from "@nestjs/common";
import { JwtAuthGuard } from "../../auth/guards/jwt-auth.guard";
import { PermissionsGuard } from "../../auth/guards/permissions.guard";
import { Permissions } from "../../auth/decorators/permissions.decorator";
import { JwtPayload } from "../../auth/types/jwt-payload";
import { BookingsService } from "../services/bookings.service";
import {
  CreateBookingDto,
  UpdateBookingDto,
  BookingResponseDto,
  CalendarEventDto,
} from "../dto/booking.dto";
import { BookingStatus } from "../../../common/enums";

@Controller("bookings")
@UseGuards(JwtAuthGuard, PermissionsGuard)
export class BookingsController {
  constructor(private readonly bookingsService: BookingsService) {}

  @Post()
  @Permissions("bookings:write")
  async create(
    @Body() dto: CreateBookingDto,
    @Request() req: { user: JwtPayload },
  ): Promise<BookingResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const booking = await this.bookingsService.create(req.user.orgId, dto);
    return BookingResponseDto.fromEntity(booking);
  }

  @Get()
  @Permissions("bookings:read")
  async findAll(
    @Query("staffId") staffId: string,
    @Query("clientId") clientId: string,
    @Query("status") status: BookingStatus,
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("page") page: string,
    @Query("limit") limit: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{
    items: BookingResponseDto[];
    total: number;
    page: number;
    limit: number;
    totalPages: number;
  }> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const result = await this.bookingsService.findAll({
      orgId: req.user.orgId,
      staffId,
      clientId,
      status,
      startDate: startDate ? new Date(startDate) : undefined,
      endDate: endDate ? new Date(endDate) : undefined,
      page: page ? parseInt(page, 10) : 1,
      limit: limit ? parseInt(limit, 10) : 20,
    });
    return {
      items: result.items.map((b) => BookingResponseDto.fromEntity(b)),
      total: result.total,
      page: result.page,
      limit: result.limit,
      totalPages: result.totalPages,
    };
  }

  @Get("calendar")
  @Permissions("bookings:read")
  async findForCalendar(
    @Query("startDate") startDate: string,
    @Query("endDate") endDate: string,
    @Query("staffId") staffId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<CalendarEventDto[]> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }

    if (!startDate || !endDate) {
      throw new BadRequestException("startDate and endDate are required");
    }

    const bookings = await this.bookingsService.findForCalendar(
      req.user.orgId,
      new Date(startDate),
      new Date(endDate),
      staffId,
    );
    return bookings.map((b) => CalendarEventDto.fromBooking(b));
  }

  @Get("check-availability")
  @Permissions("bookings:read")
  async checkAvailability(
    @Query("staffId") staffId: string,
    @Query("startTime") startTime: string,
    @Query("endTime") endTime: string,
    @Query("excludeBookingId") excludeBookingId: string,
    @Request() req: { user: JwtPayload },
  ): Promise<{ available: boolean }> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }

    if (!staffId || !startTime || !endTime) {
      throw new BadRequestException("staffId, startTime, and endTime are required");
    }

    const available = await this.bookingsService.checkAvailability({
      orgId: req.user.orgId,
      staffId,
      startTime,
      endTime,
      excludeBookingId,
    });

    return { available };
  }

  @Get(":id")
  @Permissions("bookings:read")
  async findById(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<BookingResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const booking = await this.bookingsService.findById(id, req.user.orgId);
    return BookingResponseDto.fromEntity(booking);
  }

  @Patch(":id")
  @Permissions("bookings:write")
  async update(
    @Param("id") id: string,
    @Body() dto: UpdateBookingDto,
    @Request() req: { user: JwtPayload },
  ): Promise<BookingResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const booking = await this.bookingsService.update(id, req.user.orgId, dto);
    return BookingResponseDto.fromEntity(booking);
  }

  @Post(":id/cancel")
  @Permissions("bookings:write")
  async cancel(
    @Param("id") id: string,
    @Request() req: { user: JwtPayload },
  ): Promise<BookingResponseDto> {
    if (!req.user?.orgId) {
      throw new BadRequestException("Missing org context");
    }
    const booking = await this.bookingsService.cancel(id, req.user.orgId);
    return BookingResponseDto.fromEntity(booking);
  }
}
