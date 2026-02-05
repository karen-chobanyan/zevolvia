import { Service } from "../entities/service.entity";

export interface CreateServiceDto {
  name: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  color?: string;
  isActive?: boolean;
}

export interface UpdateServiceDto {
  name?: string;
  description?: string;
  durationMinutes?: number;
  price?: number;
  color?: string;
  isActive?: boolean;
}

export class ServiceResponseDto {
  id: string;
  orgId: string;
  name: string;
  description: string | null;
  durationMinutes: number;
  price: number;
  color: string;
  isActive: boolean;
  createdAt: Date;
  updatedAt: Date;

  private constructor(data: ServiceResponseDto) {
    this.id = data.id;
    this.orgId = data.orgId;
    this.name = data.name;
    this.description = data.description;
    this.durationMinutes = data.durationMinutes;
    this.price = data.price;
    this.color = data.color;
    this.isActive = data.isActive;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromEntity(service: Service): ServiceResponseDto {
    return new ServiceResponseDto({
      id: service.id,
      orgId: service.orgId,
      name: service.name,
      description: service.description,
      durationMinutes: service.durationMinutes,
      price: Number(service.price),
      color: service.color,
      isActive: service.isActive,
      createdAt: service.createdAt,
      updatedAt: service.updatedAt,
    });
  }
}
