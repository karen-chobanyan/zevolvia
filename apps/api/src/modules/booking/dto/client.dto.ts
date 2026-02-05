import { Client } from "../entities/client.entity";

export interface CreateClientDto {
  name: string;
  email?: string;
  phone?: string;
  notes?: string;
  isWalkIn?: boolean;
}

export interface UpdateClientDto {
  name?: string;
  email?: string;
  phone?: string;
  notes?: string;
  isWalkIn?: boolean;
}

export class ClientResponseDto {
  id: string;
  orgId: string;
  name: string;
  email: string | null;
  phone: string | null;
  notes: string | null;
  isWalkIn: boolean;
  createdAt: Date;
  updatedAt: Date;

  private constructor(data: ClientResponseDto) {
    this.id = data.id;
    this.orgId = data.orgId;
    this.name = data.name;
    this.email = data.email;
    this.phone = data.phone;
    this.notes = data.notes;
    this.isWalkIn = data.isWalkIn;
    this.createdAt = data.createdAt;
    this.updatedAt = data.updatedAt;
  }

  static fromEntity(client: Client): ClientResponseDto {
    return new ClientResponseDto({
      id: client.id,
      orgId: client.orgId,
      name: client.name,
      email: client.email,
      phone: client.phone,
      notes: client.notes,
      isWalkIn: client.isWalkIn,
      createdAt: client.createdAt,
      updatedAt: client.updatedAt,
    });
  }
}
