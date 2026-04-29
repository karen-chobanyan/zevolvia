import { Column, Entity, OneToMany } from "typeorm";
import { BaseModel } from "../../../common/base-model.entity";
import { Membership } from "./membership.entity";
import { Role } from "./role.entity";

@Entity({ name: "orgs" })
export class Org extends BaseModel {
  @Column({ type: "text" })
  name!: string;

  @Column({ type: "text", unique: true })
  slug!: string;

  @Column({ type: "text", nullable: true })
  phone!: string | null;

  @Column({ type: "text", default: "US" })
  country!: string;

  @Column({ name: "time_zone", type: "text", nullable: true })
  timeZone!: string | null;

  @Column({ name: "working_hours_start", type: "time", default: "09:00" })
  workingHoursStart!: string;

  @Column({ name: "working_hours_end", type: "time", default: "20:00" })
  workingHoursEnd!: string;

  @Column({ name: "twilio_account_sid", type: "text", nullable: true })
  twilioAccountSid!: string | null;

  @Column({ name: "twilio_auth_token", type: "text", nullable: true })
  twilioAuthToken!: string | null;

  @Column({ name: "twilio_messaging_service_sid", type: "text", nullable: true })
  twilioMessagingServiceSid!: string | null;

  @Column({ name: "telegram_bot_token", type: "text", nullable: true })
  telegramBotToken!: string | null;

  @Column({ name: "telegram_bot_username", type: "text", nullable: true })
  telegramBotUsername!: string | null;

  @Column({ name: "telegram_webhook_secret", type: "text", nullable: true })
  telegramWebhookSecret!: string | null;

  @OneToMany(() => Membership, (membership) => membership.org)
  memberships!: Membership[];

  @OneToMany(() => Role, (role) => role.org)
  roles!: Role[];
}
