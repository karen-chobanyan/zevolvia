import { Injectable } from "@nestjs/common";
import { ConfigService } from "@nestjs/config";
import { InjectPinoLogger, PinoLogger } from "nestjs-pino";
import * as nodemailer from "nodemailer";
import type { Transporter } from "nodemailer";

export interface SendEmailOptions {
  to: string;
  subject: string;
  html: string;
  text?: string;
}

@Injectable()
export class EmailService {
  private transporter: Transporter | null = null;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor(
    @InjectPinoLogger(EmailService.name)
    private readonly logger: PinoLogger,
    private readonly configService: ConfigService,
  ) {
    this.fromAddress = this.configService.get<string>("SMTP_FROM") || "noreply@zevolvia.com";
    this.appUrl = this.configService.get<string>("APP_URL") || "";

    const smtpHost = this.configService.get<string>("SMTP_HOST");
    const smtpPort = this.configService.get<number>("SMTP_PORT");
    const smtpUser = this.configService.get<string>("SMTP_USER");
    const smtpPass = this.configService.get<string>("SMTP_PASS");

    if (smtpHost && smtpPort) {
      this.transporter = nodemailer.createTransport({
        host: smtpHost,
        port: smtpPort,
        secure: smtpPort === 465,
        auth:
          smtpUser && smtpPass
            ? {
                user: smtpUser,
                pass: smtpPass,
              }
            : undefined,
      });

      this.logger.info({ smtpHost }, "Email service initialized");
    } else {
      this.logger.warn("Email service not configured - emails will be logged only");
    }
  }

  async sendEmail(options: SendEmailOptions): Promise<boolean> {
    const { to, subject, html, text } = options;

    if (!this.transporter) {
      this.logger.info({ to, subject }, "Email not sent because SMTP is not configured");
      this.logger.debug(`Email content: ${text || html}`);
      return true;
    }

    try {
      await this.transporter.sendMail({
        from: this.fromAddress,
        to,
        subject,
        html,
        text: text || html.replace(/<[^>]*>/g, ""),
      });

      this.logger.info({ to }, "Email sent successfully");
      return true;
    } catch (error) {
      this.logger.error({ err: error, to }, "Failed to send email");
      return false;
    }
  }

  async sendInviteEmail(params: {
    email: string;
    inviterName: string;
    orgName: string;
    roleName: string;
    inviteToken: string;
    inviteeName?: string;
  }): Promise<boolean> {
    const { email, inviterName, orgName, roleName, inviteToken, inviteeName } = params;
    const inviteUrl = `${this.appUrl}/auth/accept-invite?token=${inviteToken}`;

    const greeting = inviteeName ? `Hi ${inviteeName}` : "Hi";

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">You've been invited to join ${orgName}</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-top: 0;">${greeting},</p>
            <p style="font-size: 16px;">${inviterName} has invited you to join <strong>${orgName}</strong> as a <strong>${roleName}</strong>.</p>
            <p style="font-size: 16px;">Click the button below to accept the invitation and set up your account:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${inviteUrl}" style="display: inline-block; background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Accept Invitation</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${inviteUrl}" style="color: #667eea;">${inviteUrl}</a></p>
          </div>
        </body>
      </html>
    `;

    const text = `
${greeting},

${inviterName} has invited you to join ${orgName} as a ${roleName}.

Click the link below to accept the invitation and set up your account:
${inviteUrl}

This invitation will expire in 7 days. If you didn't expect this invitation, you can safely ignore this email.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: `You've been invited to join ${orgName}`,
      html,
      text,
    });
  }

  async sendPasswordResetEmail(params: { email: string; resetToken: string }): Promise<boolean> {
    const { email, resetToken } = params;
    const resetUrl = `${this.appUrl}/auth/reset-password?token=${encodeURIComponent(resetToken)}`;

    const html = `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="utf-8">
          <meta name="viewport" content="width=device-width, initial-scale=1.0">
        </head>
        <body style="font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px;">
          <div style="background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); padding: 30px; border-radius: 10px 10px 0 0;">
            <h1 style="color: white; margin: 0; font-size: 24px;">Reset your Evolvia password</h1>
          </div>
          <div style="background: #f9fafb; padding: 30px; border-radius: 0 0 10px 10px; border: 1px solid #e5e7eb; border-top: none;">
            <p style="font-size: 16px; margin-top: 0;">We received a request to reset your password.</p>
            <p style="font-size: 16px;">Use the button below to set a new password:</p>
            <div style="text-align: center; margin: 30px 0;">
              <a href="${resetUrl}" style="display: inline-block; background: linear-gradient(135deg, #3b82f6 0%, #1d4ed8 100%); color: white; padding: 14px 32px; text-decoration: none; border-radius: 8px; font-weight: 600; font-size: 16px;">Reset Password</a>
            </div>
            <p style="font-size: 14px; color: #6b7280;">If you didn't request this, you can ignore this email. The reset link will expire shortly.</p>
            <hr style="border: none; border-top: 1px solid #e5e7eb; margin: 20px 0;">
            <p style="font-size: 12px; color: #9ca3af; margin-bottom: 0;">If the button doesn't work, copy and paste this link into your browser:<br><a href="${resetUrl}" style="color: #3b82f6;">${resetUrl}</a></p>
          </div>
        </body>
      </html>
    `;

    const text = `
Reset your Evolvia password

We received a request to reset your password.

Reset your password using this link:
${resetUrl}

If you didn't request this, you can ignore this email.
    `.trim();

    return this.sendEmail({
      to: email,
      subject: "Reset your Evolvia password",
      html,
      text,
    });
  }
}
