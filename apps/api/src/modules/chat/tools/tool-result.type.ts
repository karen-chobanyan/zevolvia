export type ToolResult = {
  readonly toolCallId: string;
  readonly functionName: string;
  readonly result: string;
};

export type ToolExecutionContext = {
  readonly orgId: string;
  readonly timeZone?: string;
};
