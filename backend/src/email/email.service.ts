import { Injectable, Logger } from "@nestjs/common";
import { Resend } from "resend";

@Injectable()
export class EmailService {
  private readonly logger = new Logger(EmailService.name);
  private readonly resend: Resend;
  private readonly fromAddress: string;
  private readonly appUrl: string;

  constructor() {
    this.resend = new Resend(process.env.RESEND_API_KEY);
    this.fromAddress = process.env.EMAIL_FROM || "onboarding@resend.dev";
    this.appUrl = process.env.FRONTEND_URL || "http://localhost:5173";
  }

  async sendVerificationEmail(
    to: string,
    username: string,
    token: string,
  ): Promise<void> {
    const verifyUrl = `${this.appUrl}/verify-email?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: "Verify your Fina account",
        html: this.buildVerificationEmail(username, verifyUrl),
      });
      this.logger.log(`Verification email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send verification email to ${to}`, err);
      // Non-fatal in development — log but don't throw
      if (process.env.NODE_ENV === "production") throw err;
    }
  }

  async sendPasswordResetEmail(
    to: string,
    username: string,
    token: string,
  ): Promise<void> {
    const resetUrl = `${this.appUrl}/reset-password?token=${token}`;

    try {
      await this.resend.emails.send({
        from: this.fromAddress,
        to,
        subject: "Reset your Fina password",
        html: this.buildPasswordResetEmail(username, resetUrl),
      });
      this.logger.log(`Password reset email sent to ${to}`);
    } catch (err) {
      this.logger.error(`Failed to send password reset email to ${to}`, err);
      if (process.env.NODE_ENV === "production") throw err;
    }
  }

  // ── Email templates ────────────────────────────────────────────

  private buildVerificationEmail(username: string, verifyUrl: string): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a4731;padding:28px 40px;text-align:center;">
              <div style="display:inline-flex;align-items:center;gap:10px;">
                <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🌿 Fina</span>
              </div>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a4731;">
                Welcome, ${username} 👋
              </h1>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                Thanks for signing up for Fina. Verify your email address to activate your account and start tracking your finances.
              </p>
              <a href="${verifyUrl}"
                 style="display:inline-block;padding:13px 28px;background:#1a4731;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;letter-spacing:0.01em;">
                Verify Email Address
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
                This link expires in <strong>24 hours</strong>. If you didn't create a Fina account, you can safely ignore this email.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
                Or copy this URL into your browser:<br/>
                <span style="color:#1a4731;word-break:break-all;">${verifyUrl}</span>
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="padding:16px 40px 24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                © ${new Date().getFullYear()} Fina · Your personal finance tracker
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }

  private buildPasswordResetEmail(
    username: string,
    resetUrl: string,
  ): string {
    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
</head>
<body style="margin:0;padding:0;background:#f4f7f4;font-family:'Helvetica Neue',Helvetica,Arial,sans-serif;">
  <table width="100%" cellpadding="0" cellspacing="0" style="background:#f4f7f4;padding:40px 0;">
    <tr>
      <td align="center">
        <table width="520" cellpadding="0" cellspacing="0" style="background:#ffffff;border-radius:12px;overflow:hidden;box-shadow:0 2px 8px rgba(0,0,0,0.08);">
          <!-- Header -->
          <tr>
            <td style="background:#1a4731;padding:28px 40px;text-align:center;">
              <span style="font-size:22px;font-weight:800;color:#ffffff;letter-spacing:-0.5px;">🌿 Fina</span>
            </td>
          </tr>
          <!-- Body -->
          <tr>
            <td style="padding:40px 40px 32px;">
              <h1 style="margin:0 0 8px;font-size:22px;font-weight:700;color:#1a4731;">
                Reset your password
              </h1>
              <p style="margin:0 0 8px;font-size:15px;color:#4b5563;line-height:1.6;">
                Hi ${username}, we received a request to reset your Fina password.
              </p>
              <p style="margin:0 0 24px;font-size:15px;color:#4b5563;line-height:1.6;">
                Click the button below to choose a new password. This link expires in <strong>1 hour</strong>.
              </p>
              <a href="${resetUrl}"
                 style="display:inline-block;padding:13px 28px;background:#1a4731;color:#ffffff;text-decoration:none;border-radius:8px;font-size:14px;font-weight:600;">
                Reset Password
              </a>
              <p style="margin:24px 0 0;font-size:12px;color:#9ca3af;line-height:1.6;">
                If you didn't request a password reset, ignore this email — your password won't change.
              </p>
              <p style="margin:12px 0 0;font-size:11px;color:#d1d5db;">
                Or copy this URL:<br/>
                <span style="color:#1a4731;word-break:break-all;">${resetUrl}</span>
              </p>
            </td>
          </tr>
          <tr>
            <td style="padding:16px 40px 24px;border-top:1px solid #f3f4f6;">
              <p style="margin:0;font-size:11px;color:#9ca3af;text-align:center;">
                © ${new Date().getFullYear()} Fina · Your personal finance tracker
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`;
  }
}