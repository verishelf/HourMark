import { createServiceClient } from "@/lib/supabase/server";
import { getAuthEmailForUser } from "@/lib/userEmails";
import type {
  DashboardKPIs,
  ChartDataPoint,
  Listing,
  UserProfile,
  Transaction,
  SellerLead,
  AuthenticationRequest,
  SupportTicket,
  AdminNotification,
  EmailCampaign,
  AuditLog,
  PlatformSettings,
} from "@/types/database";
import { format, subDays, startOfMonth } from "date-fns";

export async function getAdminProfile(userId: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, username, admin_role, avatar_url")
    .eq("id", userId)
    .single();
  return data;
}

export async function getDashboardKPIs(): Promise<DashboardKPIs> {
  const supabase = createServiceClient();
  const monthStart = startOfMonth(new Date()).toISOString();

  const [
    usersRes,
    sellersRes,
    buyersRes,
    listingsRes,
    pendingListingsRes,
    pendingAuthRes,
    completedSalesRes,
    totalRevenueRes,
    monthlyRevenueRes,
    openTicketsRes,
  ] = await Promise.all([
    supabase.from("users").select("id", { count: "exact", head: true }),
    supabase.from("users").select("id", { count: "exact", head: true }).eq("is_verified_seller", true),
    supabase.from("orders").select("buyer_id"),
    supabase.from("listings").select("id", { count: "exact", head: true }),
    supabase.from("listings").select("id", { count: "exact", head: true }).eq("authentication_status", "manual_review"),
    supabase.from("authentication_requests").select("id", { count: "exact", head: true }).in("status", ["awaiting_shipment", "received", "under_inspection"]),
    supabase.from("orders").select("id", { count: "exact", head: true }).eq("status", "completed"),
    supabase.from("transactions").select("commission_fee").eq("status", "completed"),
    supabase.from("transactions").select("commission_fee").eq("status", "completed").gte("created_at", monthStart),
    supabase.from("support_tickets").select("id", { count: "exact", head: true }).in("status", ["open", "in_progress"]),
  ]);

  const uniqueBuyers = new Set(buyersRes.data?.map((o) => o.buyer_id) ?? []);
  const totalRevenue = totalRevenueRes.data?.reduce((sum, t) => sum + (t.commission_fee ?? 0), 0) ?? 0;
  const monthlyRevenue = monthlyRevenueRes.data?.reduce((sum, t) => sum + (t.commission_fee ?? 0), 0) ?? 0;

  return {
    totalUsers: usersRes.count ?? 0,
    activeSellers: sellersRes.count ?? 0,
    activeBuyers: uniqueBuyers.size,
    totalListings: listingsRes.count ?? 0,
    pendingListings: pendingListingsRes.count ?? 0,
    pendingAuthRequests: pendingAuthRes.count ?? 0,
    completedSales: completedSalesRes.count ?? 0,
    totalRevenue,
    monthlyRevenue,
    openSupportTickets: openTicketsRes.count ?? 0,
  };
}

function groupByDate(
  rows: { created_at: string; value?: number }[],
  days = 30,
  valueKey = "value"
): ChartDataPoint[] {
  const map = new Map<string, number>();
  for (let i = days - 1; i >= 0; i--) {
    map.set(format(subDays(new Date(), i), "MMM d"), 0);
  }
  for (const row of rows) {
    const key = format(new Date(row.created_at), "MMM d");
    if (map.has(key)) {
      const val = valueKey === "value" ? (row as { value: number }).value : 1;
      map.set(key, (map.get(key) ?? 0) + val);
    }
  }
  return Array.from(map.entries()).map(([date, value]) => ({ date, value }));
}

export async function getDashboardCharts() {
  const supabase = createServiceClient();
  const since = subDays(new Date(), 30).toISOString();

  const [revenueRes, listingsRes, usersRes, salesRes, authRes] = await Promise.all([
    supabase.from("transactions").select("created_at, commission_fee").eq("status", "completed").gte("created_at", since),
    supabase.from("listings").select("created_at").gte("created_at", since),
    supabase.from("users").select("created_at").gte("created_at", since),
    supabase.from("orders").select("created_at, amount").eq("status", "completed").gte("created_at", since),
    supabase.from("authentication_requests").select("created_at").gte("created_at", since),
  ]);

  const dailyRevenue = groupByDate(
    (revenueRes.data ?? []).map((r) => ({ created_at: r.created_at, value: r.commission_fee ?? 0 }))
  );
  const listingsCreated = groupByDate(listingsRes.data ?? []);
  const userGrowth = groupByDate(usersRes.data ?? []);
  const salesVolume = groupByDate(
    (salesRes.data ?? []).map((r) => ({ created_at: r.created_at, value: r.amount ?? 0 }))
  );
  const authVolume = groupByDate(authRes.data ?? []);

  return { dailyRevenue, listingsCreated, userGrowth, salesVolume, authVolume };
}

export async function getListings(filters?: {
  brand?: string;
  status?: string;
  minPrice?: number;
  maxPrice?: number;
}): Promise<Listing[]> {
  const supabase = createServiceClient();
  let query = supabase
    .from("listings")
    .select("*, seller:users!seller_id(id, full_name, username, email:username)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (filters?.brand) query = query.ilike("brand", `%${filters.brand}%`);
  if (filters?.status) query = query.eq("status", filters.status);
  if (filters?.minPrice) query = query.gte("price", filters.minPrice);
  if (filters?.maxPrice) query = query.lte("price", filters.maxPrice);

  const { data } = await query;
  return (data ?? []) as Listing[];
}

export async function getUsers(): Promise<UserProfile[]> {
  const supabase = createServiceClient();
  const { data: users } = await supabase
    .from("users")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(100);

  if (!users) return [];

  const enriched = await Promise.all(
    users.map(async (user) => {
      const [{ count: sales }, { count: purchases }, email] = await Promise.all([
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("seller_id", user.id).eq("status", "completed"),
        supabase.from("orders").select("id", { count: "exact", head: true }).eq("buyer_id", user.id).eq("status", "completed"),
        getAuthEmailForUser(user.id),
      ]);
      return { ...user, email, total_sales: sales ?? 0, total_purchases: purchases ?? 0 };
    })
  );

  return enriched as UserProfile[];
}

export async function getSellerLeads(): Promise<SellerLead[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("seller_leads")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as SellerLead[];
}

export async function getAuthenticationRequests(): Promise<AuthenticationRequest[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("authentication_requests")
    .select("*, seller:users!seller_id(id, full_name, username), buyer:users!buyer_id(id, full_name, username)")
    .order("created_at", { ascending: false });
  return (data ?? []) as AuthenticationRequest[];
}

export async function getTransactions(): Promise<Transaction[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("transactions")
    .select("*, order:orders(*, buyer:users!buyer_id(id, full_name, username), seller:users!seller_id(id, full_name, username), listing:listings(id, brand, model))")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as Transaction[];
}

export async function getSupportTickets(): Promise<SupportTicket[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("support_tickets")
    .select("*, user:users!user_id(id, full_name, username)")
    .order("created_at", { ascending: false });
  return (data ?? []) as SupportTicket[];
}

export async function getAdminNotifications(): Promise<AdminNotification[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("admin_notifications")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as AdminNotification[];
}

export async function getEmailCampaigns(): Promise<EmailCampaign[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("email_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as EmailCampaign[];
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("audit_logs")
    .select("*, admin:users!admin_id(id, full_name, username)")
    .order("created_at", { ascending: false })
    .limit(100);
  return (data ?? []) as AuditLog[];
}

export async function getPlatformSettings(): Promise<PlatformSettings | null> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("platform_settings")
    .select("*")
    .limit(1)
    .single();
  return data as PlatformSettings | null;
}

export async function getAnalytics() {
  const supabase = createServiceClient();

  const [users, listings, orders, transactions, authRequests] = await Promise.all([
    supabase.from("users").select("id, created_at"),
    supabase.from("listings").select("id, seller_id, price, status"),
    supabase.from("orders").select("id, buyer_id, seller_id, amount, status"),
    supabase.from("transactions").select("commission_fee, status"),
    supabase.from("authentication_requests").select("status"),
  ]);

  const totalUsers = users.data?.length ?? 0;
  const totalListings = listings.data?.length ?? 0;
  const completedOrders = orders.data?.filter((o) => o.status === "completed") ?? [];
  const totalOrders = orders.data?.length ?? 0;
  const sellers = new Set(listings.data?.map((l) => l.seller_id) ?? []);
  const totalRevenue = transactions.data?.filter((t) => t.status === "completed").reduce((s, t) => s + (t.commission_fee ?? 0), 0) ?? 0;
  const passedAuth = authRequests.data?.filter((a) => a.status === "passed").length ?? 0;
  const totalAuth = authRequests.data?.length ?? 0;
  const avgSalePrice = completedOrders.length > 0
    ? completedOrders.reduce((s, o) => s + (o.amount ?? 0), 0) / completedOrders.length
    : 0;

  const buyerIds = new Set(orders.data?.map((o) => o.buyer_id) ?? []);
  const repeatBuyers = orders.data?.filter((o) => {
    const count = orders.data?.filter((x) => x.buyer_id === o.buyer_id).length ?? 0;
    return count > 1;
  }).length ?? 0;

  return {
    conversionRate: totalListings > 0 ? (completedOrders.length / totalListings) * 100 : 0,
    listingsPerSeller: sellers.size > 0 ? totalListings / sellers.size : 0,
    averageSalePrice: avgSalePrice,
    revenuePerUser: totalUsers > 0 ? totalRevenue / totalUsers : 0,
    authenticationSuccessRate: totalAuth > 0 ? (passedAuth / totalAuth) * 100 : 0,
    buyerRetention: buyerIds.size > 0 ? (repeatBuyers / buyerIds.size) * 100 : 0,
    sellerRetention: sellers.size > 0 ? ((sellers.size / totalUsers) * 100) : 0,
    totalOrders,
    completedOrders: completedOrders.length,
  };
}

export async function getRevenueMetrics() {
  const supabase = createServiceClient();
  const monthStart = startOfMonth(new Date()).toISOString();

  const [transactions, orders, listings] = await Promise.all([
    supabase.from("transactions").select("commission_fee, amount, status, created_at").eq("status", "completed"),
    supabase.from("orders").select("amount, listing:listings(brand), status").eq("status", "completed"),
    supabase.from("orders").select("amount, seller_id, status").eq("status", "completed"),
  ]);

  const grossVolume = transactions.data?.reduce((s, t) => s + (t.amount ?? 0), 0) ?? 0;
  const crownlyRevenue = transactions.data?.reduce((s, t) => s + (t.commission_fee ?? 0), 0) ?? 0;
  const monthlyRevenue = transactions.data
    ?.filter((t) => t.created_at >= monthStart)
    .reduce((s, t) => s + (t.commission_fee ?? 0), 0) ?? 0;

  const brandMap = new Map<string, number>();
  for (const order of orders.data ?? []) {
    const listing = order.listing as { brand?: string } | null;
    const brand = listing?.brand ?? "Unknown";
    brandMap.set(brand, (brandMap.get(brand) ?? 0) + (order.amount ?? 0));
  }

  const sellerMap = new Map<string, number>();
  for (const order of listings.data ?? []) {
    sellerMap.set(order.seller_id, (sellerMap.get(order.seller_id) ?? 0) + (order.amount ?? 0));
  }

  const revenueByBrand = Array.from(brandMap.entries())
    .map(([brand, revenue]) => ({ brand, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const revenueBySeller = Array.from(sellerMap.entries())
    .map(([sellerId, revenue]) => ({ sellerId, revenue }))
    .sort((a, b) => b.revenue - a.revenue)
    .slice(0, 10);

  const revenueGrowth = groupByDate(
    (transactions.data ?? []).map((t) => ({ created_at: t.created_at, value: t.commission_fee ?? 0 }))
  );

  const transactionVolume = groupByDate(
    (transactions.data ?? []).map((t) => ({ created_at: t.created_at, value: t.amount ?? 0 }))
  );

  return {
    grossVolume,
    crownlyRevenue,
    monthlyRevenue,
    revenueByBrand,
    revenueBySeller,
    revenueGrowth,
    transactionVolume,
    topBrands: revenueByBrand.slice(0, 5).map((b) => ({ date: b.brand, value: b.revenue })),
  };
}
