import { FileStatus } from "../../../common/enums";

export interface ListFilesQueryDto {
  knowledgeBaseId?: string;
  status?: FileStatus;
  page?: number;
  limit?: number;
}

export interface LinkKnowledgeBaseDto {
  knowledgeBaseId: string | null;
}
