import { Injectable } from "@nestjs/common";
import { InjectRepository } from "@nestjs/typeorm";
import { Repository } from "typeorm";
import { Membership } from "../identity/entities/membership.entity";
import { MembershipStatus } from "../../common/enums";
import { Document } from "../knowledge/entities/document.entity";

@Injectable()
export class DashboardService {
  constructor(
    @InjectRepository(Membership)
    private readonly membershipRepo: Repository<Membership>,
    @InjectRepository(Document)
    private readonly documentRepo: Repository<Document>,
  ) {}

  async getSummary(orgId: string) {
    const [members, files] = await Promise.all([
      this.membershipRepo.count({
        where: { orgId, status: MembershipStatus.Active },
      }),
      this.documentRepo.count({ where: { orgId } }),
    ]);

    return {
      orgId,
      generatedAt: new Date().toISOString(),
      widgets: {
        members,
        files,
        storageBytes: 0,
        chatSessions: 0,
        chatMessages: 0,
        pendingInvites: 0,
      },
      charts: {
        uploadsByMonth: [],
        messagesByMonth: [],
        sessionsByMonth: [],
      },
      lists: {
        recentMembers: [],
        recentFiles: [],
        recentChats: [],
      },
    };
  }
}
