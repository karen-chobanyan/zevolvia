export enum MembershipStatus {
  Active = "active",
  Invited = "invited",
  Disabled = "disabled",
}

export enum DocumentStatus {
  Pending = "pending",
  Processing = "processing",
  Ready = "ready",
  Failed = "failed",
}

export enum DocumentSourceType {
  Upload = "upload",
  Url = "url",
  Note = "note",
}

export enum FileStatus {
  Uploaded = "uploaded",
  Processing = "processing",
  Ready = "ready",
  Failed = "failed",
  Deleted = "deleted",
}

export enum FileRagStatus {
  Pending = "pending",
  Queued = "queued",
  Ingesting = "ingesting",
  Indexed = "indexed",
  Failed = "failed",
  Skipped = "skipped",
}

export enum ChatRole {
  User = "USER",
  Assistant = "ASSISTANT",
  System = "SYSTEM",
}

export const ALLOWED_FILE_TYPES = [
  "application/pdf",
  "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  "text/plain",
  "text/markdown",
] as const;

export type AllowedFileType = (typeof ALLOWED_FILE_TYPES)[number];

export enum BookingStatus {
  Scheduled = "scheduled",
  Confirmed = "confirmed",
  InProgress = "in_progress",
  Completed = "completed",
  Cancelled = "cancelled",
  NoShow = "no_show",
}

export enum NotificationChannel {
  WebPush = "web_push",
}

export enum NotificationStatus {
  Pending = "pending",
  Processing = "processing",
  Delivered = "delivered",
  Failed = "failed",
  Skipped = "skipped",
  DeadLettered = "dead_lettered",
}

export enum SubscriptionStatus {
  Trialing = "trialing",
  Active = "active",
  TrialExpired = "trial_expired",
  Canceled = "canceled",
  Incomplete = "incomplete",
  PastDue = "past_due",
}
