export class UpdateOrgDto {
  name?: string;
  phone?: string | null;
  timeZone?: string | null;
  workingHoursStart?: string;
  workingHoursEnd?: string;
  twilioAccountSid?: string | null;
  twilioAuthToken?: string | null;
  twilioMessagingServiceSid?: string | null;
  telegramBotToken?: string | null;
  telegramBotUsername?: string | null;
  telegramWebhookSecret?: string | null;
}
