export interface AskDto {
  question: string;
  k?: number;
  where?: Record<string, unknown>;
  kbOnly?: boolean;
  system?: string;
}
