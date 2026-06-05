import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend(): Resend {
  if (!resendClient) {
    resendClient = new Resend(process.env.RESEND_API_KEY);
  }
  return resendClient;
}

export const FROM_EMAIL = process.env.RESEND_FROM_EMAIL ?? "admin@crownly.com";

export async function sendEmail({
  to,
  subject,
  html,
  tags,
}: {
  to: string | string[];
  subject: string;
  html: string;
  tags?: { name: string; value: string }[];
}) {
  const resend = getResend();
  return resend.emails.send({
    from: `Crownly <${FROM_EMAIL}>`,
    to,
    subject,
    html,
    tags,
  });
}
