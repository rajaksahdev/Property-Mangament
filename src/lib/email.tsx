import { render } from "@react-email/render";
import { Resend } from "resend";

import {
  RentReminderEmail,
  type RentReminderEmailProps,
} from "@/emails/rent-reminder";
import { OverdueEmail, type OverdueEmailProps } from "@/emails/overdue";
import { RenewalEmail, type RenewalEmailProps } from "@/emails/renewal";

const FROM = process.env.EMAIL_FROM ?? "Property Manager <onboarding@resend.dev>";

/**
 * Low-level sender. In local dev (no RESEND_API_KEY) it logs instead of
 * sending, so flows stay testable without a Resend account.
 */
async function sendEmail({
  to,
  subject,
  html,
}: {
  to: string;
  subject: string;
  html: string;
}): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(`[email:dev] would send "${subject}" to ${to}`);
    return;
  }
  const resend = new Resend(apiKey);
  const { error } = await resend.emails.send({ from: FROM, to, subject, html });
  if (error) {
    throw new Error(`Failed to send email: ${error.message}`);
  }
}

export async function sendPasswordResetEmail(
  to: string,
  resetUrl: string,
): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    console.warn(
      `\n[email:dev] RESEND_API_KEY not set — password reset link for ${to}:\n${resetUrl}\n`,
    );
    return;
  }
  await sendEmail({
    to,
    subject: "Reset your Property Manager password",
    html: `
      <div style="font-family: system-ui, sans-serif; max-width: 480px; margin: 0 auto;">
        <h2>Reset your password</h2>
        <p>We received a request to reset your password. This link expires in 1 hour.</p>
        <p>
          <a href="${resetUrl}"
             style="display:inline-block;background:#171717;color:#fff;padding:10px 16px;border-radius:8px;text-decoration:none;">
            Reset password
          </a>
        </p>
        <p style="color:#666;font-size:13px;">
          If you didn't request this, you can safely ignore this email.
        </p>
      </div>
    `,
  });
}

// ---------------------------------------------------------------------------
// Cron emails (React Email templates)
// ---------------------------------------------------------------------------
export async function sendRentReminderEmail(
  to: string,
  props: RentReminderEmailProps,
): Promise<void> {
  const html = await render(<RentReminderEmail {...props} />);
  await sendEmail({
    to,
    subject: props.dueSoon ? "Rent due soon" : "Rent due today",
    html,
  });
}

export async function sendOverdueEmail(
  to: string,
  props: OverdueEmailProps,
): Promise<void> {
  const html = await render(<OverdueEmail {...props} />);
  await sendEmail({
    to,
    subject: `Rent overdue — ${props.propertyTitle}`,
    html,
  });
}

export async function sendRenewalEmail(
  to: string,
  props: RenewalEmailProps,
): Promise<void> {
  const html = await render(<RenewalEmail {...props} />);
  await sendEmail({
    to,
    subject: `Lease renewal — ${props.propertyTitle}`,
    html,
  });
}
