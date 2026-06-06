import { Resend } from "resend";

let resendClient: Resend | null = null;

export function getResend(): Resend {
  const apiKey = process.env.RESEND_API_KEY;
  if (!apiKey) {
    throw new Error(
      "RESEND_API_KEY is missing. Add it to dashboard/.env.local or your Vercel project env vars."
    );
  }
  if (!resendClient) {
    resendClient = new Resend(apiKey);
  }
  return resendClient;
}

export const FROM_EMAIL =
  process.env.RESEND_FROM_EMAIL ?? "hello@marketing.crownly.art";
export const REPLY_TO_EMAIL =
  process.env.RESEND_REPLY_TO_EMAIL ?? "hello@crownly.art";

export type SendEmailResult =
  | { ok: true; id: string }
  | { ok: false; error: string };

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
}): Promise<SendEmailResult> {
  if (!process.env.RESEND_API_KEY) {
    return {
      ok: false,
      error:
        "RESEND_API_KEY is missing. Add it to dashboard/.env.local or Vercel env vars.",
    };
  }

  const recipients = (Array.isArray(to) ? to : [to]).map((email) => email.trim()).filter(Boolean);
  if (recipients.length === 0) {
    return { ok: false, error: "No recipient email address provided." };
  }

  if (!subject.trim()) {
    return { ok: false, error: "Email subject is required." };
  }

  if (!html.trim()) {
    return { ok: false, error: "Email body is required." };
  }

  try {
    const resend = getResend();
    const result = await resend.emails.send({
      from: `Crownly <${FROM_EMAIL}>`,
      replyTo: REPLY_TO_EMAIL,
      to: recipients,
      subject,
      html,
      tags,
    });

    if (result.error) {
      return { ok: false, error: result.error.message };
    }

    if (!result.data?.id) {
      return { ok: false, error: "Resend did not return a message id." };
    }

    return { ok: true, id: result.data.id };
  } catch (error) {
    return {
      ok: false,
      error: error instanceof Error ? error.message : "Failed to send email.",
    };
  }
}
