import { createServiceClient } from "@/lib/supabase/server";

function isDeliverableEmail(email: string | null | undefined): email is string {
  if (!email) return false;
  const normalized = email.toLowerCase();
  return (
    email.includes("@") &&
    !normalized.endsWith("@privaterelay.appleid.com")
  );
}

export async function getAuthEmailsByUserIds(userIds: string[]): Promise<string[]> {
  if (userIds.length === 0) return [];

  const supabase = createServiceClient();
  const uniqueIds = [...new Set(userIds)];
  const emails: string[] = [];

  const batchSize = 25;
  for (let i = 0; i < uniqueIds.length; i += batchSize) {
    const batch = uniqueIds.slice(i, i + batchSize);
    const results = await Promise.all(
      batch.map(async (id) => {
        const { data, error } = await supabase.auth.admin.getUserById(id);
        if (error || !isDeliverableEmail(data.user?.email)) return null;
        return data.user.email;
      })
    );
    emails.push(...results.filter((email): email is string => Boolean(email)));
  }

  return [...new Set(emails)];
}

export async function getAllAuthEmails(): Promise<string[]> {
  const supabase = createServiceClient();
  const emails: string[] = [];
  let page = 1;

  while (true) {
    const { data, error } = await supabase.auth.admin.listUsers({ page, perPage: 200 });
    if (error) throw new Error(error.message);

    for (const user of data.users) {
      if (isDeliverableEmail(user.email)) emails.push(user.email);
    }

    if (data.users.length < 200) break;
    page += 1;
  }

  return [...new Set(emails)];
}

export async function getAuthEmailForUser(userId: string): Promise<string | null> {
  const supabase = createServiceClient();
  const { data, error } = await supabase.auth.admin.getUserById(userId);
  if (error || !isDeliverableEmail(data.user?.email)) return null;
  return data.user.email;
}
