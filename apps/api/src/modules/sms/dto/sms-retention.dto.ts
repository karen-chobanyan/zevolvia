export class UpdateSmsRetentionSettingsDto {
  isEnabled?: boolean;
  weMissYouEnabled?: boolean;
  nextBookingSpecialEnabled?: boolean;
  churnDays?: number;
}

export class RunSmsRetentionDto {
  dryRun?: boolean;
}
