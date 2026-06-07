const EXPO_PUSH_URL = "https://exp.host/--/api/v2/push/send";

export type ExpoPushMessage = {
  to: string;
  title: string;
  body: string;
  data?: Record<string, unknown>;
  sound?: "default" | null;
  priority?: "default" | "normal" | "high";
};

export type ExpoPushTicket = {
  status: "ok" | "error";
  id?: string;
  message?: string;
  details?: { error?: string };
};

export type SendPushResult = {
  successCount: number;
  failureCount: number;
  errors: string[];
};

function chunk<T>(items: T[], size: number): T[][] {
  const chunks: T[][] = [];
  for (let i = 0; i < items.length; i += size) {
    chunks.push(items.slice(i, i + size));
  }
  return chunks;
}

export async function sendExpoPushNotifications(
  messages: ExpoPushMessage[]
): Promise<SendPushResult> {
  if (messages.length === 0) {
    return { successCount: 0, failureCount: 0, errors: [] };
  }

  const accessToken = process.env.EXPO_ACCESS_TOKEN;
  const headers: Record<string, string> = {
    Accept: "application/json",
    "Accept-Encoding": "gzip, deflate",
    "Content-Type": "application/json",
  };
  if (accessToken) {
    headers.Authorization = `Bearer ${accessToken}`;
  }

  let successCount = 0;
  let failureCount = 0;
  const errors: string[] = [];

  for (const batch of chunk(messages, 100)) {
    const response = await fetch(EXPO_PUSH_URL, {
      method: "POST",
      headers,
      body: JSON.stringify(batch),
    });

    if (!response.ok) {
      const text = await response.text();
      failureCount += batch.length;
      errors.push(`Expo API error (${response.status}): ${text.slice(0, 200)}`);
      continue;
    }

    const payload = (await response.json()) as { data?: ExpoPushTicket[] };
    for (const ticket of payload.data ?? []) {
      if (ticket.status === "ok") {
        successCount += 1;
      } else {
        failureCount += 1;
        errors.push(ticket.message ?? ticket.details?.error ?? "Unknown push error");
      }
    }
  }

  return { successCount, failureCount, errors: errors.slice(0, 20) };
}

export async function sendExpoPushToTokens(
  tokens: string[],
  notification: { title: string; body: string; data?: Record<string, unknown> }
): Promise<SendPushResult> {
  const messages: ExpoPushMessage[] = tokens.map((token) => ({
    to: token,
    title: notification.title,
    body: notification.body,
    data: notification.data,
    sound: "default",
    priority: "high",
  }));
  return sendExpoPushNotifications(messages);
}
