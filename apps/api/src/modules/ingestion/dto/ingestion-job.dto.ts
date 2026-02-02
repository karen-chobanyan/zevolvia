export interface IngestionJobData {
  fileId: string;
  orgId: string;
}

export interface ChunkResult {
  content: string;
  idx: number;
  tokens: number;
}
