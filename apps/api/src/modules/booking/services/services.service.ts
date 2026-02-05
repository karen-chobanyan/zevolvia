import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Service } from "../entities/service.entity";
import { CreateServiceDto, UpdateServiceDto } from "../dto/service.dto";

@Injectable()
export class ServicesService {
  constructor(
    @InjectRepository(Service)
    private readonly serviceRepository: Repository<Service>,
  ) {}

  async create(orgId: string, dto: CreateServiceDto): Promise<Service> {
    const service = this.serviceRepository.create({
      orgId,
      name: dto.name,
      description: dto.description ?? null,
      durationMinutes: dto.durationMinutes ?? 30,
      price: dto.price ?? 0,
      color: dto.color ?? "#3b82f6",
      isActive: dto.isActive ?? true,
    });

    return this.serviceRepository.save(service);
  }

  async findAll(orgId: string, includeInactive = false): Promise<Service[]> {
    const queryBuilder = this.serviceRepository
      .createQueryBuilder("service")
      .where("service.orgId = :orgId", { orgId });

    if (!includeInactive) {
      queryBuilder.andWhere("service.isActive = true");
    }

    return queryBuilder.orderBy("service.name", "ASC").getMany();
  }

  async findById(id: string, orgId: string): Promise<Service> {
    const service = await this.serviceRepository.findOne({
      where: { id, orgId },
    });

    if (!service) {
      throw new NotFoundException("Service not found");
    }

    return service;
  }

  async update(id: string, orgId: string, dto: UpdateServiceDto): Promise<Service> {
    const service = await this.findById(id, orgId);

    const updatedService = {
      ...service,
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.description !== undefined && { description: dto.description }),
      ...(dto.durationMinutes !== undefined && { durationMinutes: dto.durationMinutes }),
      ...(dto.price !== undefined && { price: dto.price }),
      ...(dto.color !== undefined && { color: dto.color }),
      ...(dto.isActive !== undefined && { isActive: dto.isActive }),
    };

    return this.serviceRepository.save(updatedService);
  }

  async delete(id: string, orgId: string): Promise<void> {
    const service = await this.findById(id, orgId);
    await this.serviceRepository.remove(service);
  }
}
