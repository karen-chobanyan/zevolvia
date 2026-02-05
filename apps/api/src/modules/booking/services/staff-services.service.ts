import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository, In } from "typeorm";
import { StaffService } from "../entities/staff-service.entity";
import { Service } from "../entities/service.entity";
import { Membership } from "../../identity/entities/membership.entity";
import { MembershipStatus } from "../../../common/enums";

@Injectable()
export class StaffServicesService {
  constructor(
    @InjectRepository(StaffService)
    private readonly staffServiceRepository: Repository<StaffService>,
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
    @InjectRepository(Membership)
    private readonly membershipRepository: Repository<Membership>,
  ) {}

  async getServicesForStaff(orgId: string, userId: string): Promise<Service[]> {
    const staffServices = await this.staffServiceRepository.find({
      where: { userId },
      relations: ["service"],
    });

    return staffServices.map((ss) => ss.service).filter((service) => service.orgId === orgId);
  }

  async getStaffForService(orgId: string, serviceId: string): Promise<Membership[]> {
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, orgId },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    const staffServices = await this.staffServiceRepository.find({
      where: { serviceId },
    });

    const userIds = staffServices.map((ss) => ss.userId);

    if (userIds.length === 0) {
      return [];
    }

    return this.membershipRepository.find({
      where: {
        orgId,
        userId: In(userIds),
        status: MembershipStatus.Active,
      },
      relations: ["user", "role"],
    });
  }

  async setServicesForStaff(
    orgId: string,
    userId: string,
    serviceIds: string[],
  ): Promise<Service[]> {
    // Verify user is a member of the org
    const membership = await this.membershipRepository.findOne({
      where: { orgId, userId, status: MembershipStatus.Active },
    });

    if (!membership) {
      throw new NotFoundException("Staff member not found");
    }

    // Verify all services belong to the org
    const services = await this.serviceRepository.find({
      where: { orgId, id: In(serviceIds) },
    });

    if (services.length !== serviceIds.length) {
      throw new NotFoundException("One or more services not found");
    }

    // Get current assignments for this user
    const currentAssignments = await this.staffServiceRepository.find({
      where: { userId },
      relations: ["service"],
    });

    // Filter to only org services
    const currentOrgAssignments = currentAssignments.filter((ss) => ss.service.orgId === orgId);

    const currentServiceIds = currentOrgAssignments.map((ss) => ss.serviceId);

    // Find services to add and remove
    const toAdd = serviceIds.filter((id) => !currentServiceIds.includes(id));
    const toRemove = currentOrgAssignments.filter((ss) => !serviceIds.includes(ss.serviceId));

    // Remove old assignments
    if (toRemove.length > 0) {
      await this.staffServiceRepository.remove(toRemove);
    }

    // Add new assignments
    if (toAdd.length > 0) {
      const newAssignments = toAdd.map((serviceId) =>
        this.staffServiceRepository.create({ userId, serviceId }),
      );
      await this.staffServiceRepository.save(newAssignments);
    }

    return this.getServicesForStaff(orgId, userId);
  }

  async addServiceToStaff(orgId: string, userId: string, serviceId: string): Promise<void> {
    // Verify membership
    const membership = await this.membershipRepository.findOne({
      where: { orgId, userId, status: MembershipStatus.Active },
    });

    if (!membership) {
      throw new NotFoundException("Staff member not found");
    }

    // Verify service
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, orgId },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    // Check if already assigned
    const existing = await this.staffServiceRepository.findOne({
      where: { userId, serviceId },
    });

    if (!existing) {
      const assignment = this.staffServiceRepository.create({ userId, serviceId });
      await this.staffServiceRepository.save(assignment);
    }
  }

  async removeServiceFromStaff(orgId: string, userId: string, serviceId: string): Promise<void> {
    // Verify membership
    const membership = await this.membershipRepository.findOne({
      where: { orgId, userId, status: MembershipStatus.Active },
    });

    if (!membership) {
      throw new NotFoundException("Staff member not found");
    }

    // Verify service belongs to org
    const service = await this.serviceRepository.findOne({
      where: { id: serviceId, orgId },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    await this.staffServiceRepository.delete({ userId, serviceId });
  }

  async getAllStaffWithServices(orgId: string): Promise<
    Array<{
      userId: string;
      user: { id: string; email: string; name: string | null };
      services: Service[];
    }>
  > {
    // Get all active members of the org
    const memberships = await this.membershipRepository.find({
      where: { orgId, status: MembershipStatus.Active },
      relations: ["user"],
    });

    // Get all services for the org
    const orgServices = await this.serviceRepository.find({
      where: { orgId },
    });

    const orgServiceIds = new Set(orgServices.map((s) => s.id));

    // Get all staff-service assignments
    const staffServices = await this.staffServiceRepository.find({
      where: { userId: In(memberships.map((m) => m.userId)) },
      relations: ["service"],
    });

    // Group by user
    const servicesByUser = new Map<string, Service[]>();
    for (const ss of staffServices) {
      if (orgServiceIds.has(ss.serviceId)) {
        const existing = servicesByUser.get(ss.userId) || [];
        existing.push(ss.service);
        servicesByUser.set(ss.userId, existing);
      }
    }

    return memberships.map((m) => ({
      userId: m.userId,
      user: {
        id: m.user.id,
        email: m.user.email,
        name: m.user.name,
      },
      services: servicesByUser.get(m.userId) || [],
    }));
  }
}
