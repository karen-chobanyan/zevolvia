import { Injectable, NotFoundException } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Client } from "../entities/client.entity";
import { CreateClientDto, UpdateClientDto } from "../dto/client.dto";

export interface ListClientsOptions {
  orgId: string;
  search?: string;
  page?: number;
  limit?: number;
}

export interface PaginatedClients {
  items: Client[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

@Injectable()
export class ClientsService {
  constructor(
    @InjectRepository(Client)
    private readonly clientRepository: Repository<Client>,
  ) {}

  async create(orgId: string, dto: CreateClientDto): Promise<Client> {
    const client = this.clientRepository.create({
      orgId,
      name: dto.name,
      email: dto.email ?? null,
      phone: dto.phone ?? null,
      notes: dto.notes ?? null,
      isWalkIn: dto.isWalkIn ?? false,
    });

    return this.clientRepository.save(client);
  }

  async findAll(options: ListClientsOptions): Promise<PaginatedClients> {
    const { orgId, search, page = 1, limit = 20 } = options;

    const queryBuilder = this.clientRepository
      .createQueryBuilder("client")
      .where("client.orgId = :orgId", { orgId });

    if (search) {
      queryBuilder.andWhere(
        "(LOWER(client.name) LIKE LOWER(:search) OR LOWER(client.email) LIKE LOWER(:search) OR client.phone LIKE :search)",
        { search: `%${search}%` },
      );
    }

    const [items, total] = await queryBuilder
      .orderBy("client.name", "ASC")
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

  async search(orgId: string, query: string, limit = 10): Promise<Client[]> {
    if (!query || query.length < 2) {
      return [];
    }

    return this.clientRepository
      .createQueryBuilder("client")
      .where("client.orgId = :orgId", { orgId })
      .andWhere(
        "(LOWER(client.name) LIKE LOWER(:query) OR LOWER(client.email) LIKE LOWER(:query) OR client.phone LIKE :query)",
        { query: `%${query}%` },
      )
      .orderBy("client.name", "ASC")
      .take(limit)
      .getMany();
  }

  async findById(id: string, orgId: string): Promise<Client> {
    const client = await this.clientRepository.findOne({
      where: { id, orgId },
    });

    if (!client) {
      throw new NotFoundException("Client not found");
    }

    return client;
  }

  async update(id: string, orgId: string, dto: UpdateClientDto): Promise<Client> {
    const client = await this.findById(id, orgId);

    const updatedClient = {
      ...client,
      ...(dto.name !== undefined && { name: dto.name }),
      ...(dto.email !== undefined && { email: dto.email }),
      ...(dto.phone !== undefined && { phone: dto.phone }),
      ...(dto.notes !== undefined && { notes: dto.notes }),
      ...(dto.isWalkIn !== undefined && { isWalkIn: dto.isWalkIn }),
    };

    return this.clientRepository.save(updatedClient);
  }

  async delete(id: string, orgId: string): Promise<void> {
    const client = await this.findById(id, orgId);
    await this.clientRepository.remove(client);
  }
}
