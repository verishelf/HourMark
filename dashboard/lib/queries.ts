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
  EmailCampaignTemplate,
  WebsiteSignup,
  AuditLog,
  PlatformSettings,
  Dealer,
  DealerActivity,
  DealerTask,
  DealerChangelog,
  DealerFilters,
  DealerAnalytics,
  DealerWithStats,
  DealerPipelineStatus,
} from "@/types/database";
import { DEALER_PIPELINE_STATUSES } from "@/lib/dealer-scoring";
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

export async function getEmailCampaignTemplates(): Promise<EmailCampaignTemplate[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("email_campaign_templates")
    .select("*")
    .order("updated_at", { ascending: false });
  return (data ?? []) as EmailCampaignTemplate[];
}

export async function getWebsiteSignups(): Promise<WebsiteSignup[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("website_signups")
    .select("*")
    .order("created_at", { ascending: false });
  return (data ?? []) as WebsiteSignup[];
}

export async function getAuditLogs(): Promise<AuditLog[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("audit_logs")
    .select("*, admin:users!admin_id(id, full_name, username)")
    .order("created_at", { ascending: false })
    .limit(100);

  if (error) {
    console.error("[getAuditLogs]", error.message);
    return [];
  }

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

export async function getAdminStories() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("stories")
    .select("*, category:story_categories(name, slug), author:authors(name)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAdminStory(id: string) {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("stories")
    .select("*, category:story_categories(*), author:authors(*)")
    .eq("id", id)
    .single();
  return data;
}

export async function getStoryCategories() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("story_categories").select("*").order("sort_order");
  return data ?? [];
}

export async function getStorySubmissions() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("story_submissions")
    .select("*, user:users!user_id(username, full_name, avatar_url)")
    .order("created_at", { ascending: false });
  return data ?? [];
}

export async function getAdminAuthors() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("authors").select("*").order("name");
  return data ?? [];
}

export async function getCelebrityProfiles() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("celebrity_profiles").select("*").order("name");
  return data ?? [];
}

export async function getPushNotificationCampaigns() {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("push_notification_campaigns")
    .select("*")
    .order("created_at", { ascending: false });
  return data ?? [];
}

// ─── Dealer CRM ───────────────────────────────────────────────────────────────

const DEALER_PAGE_SIZE = 50;

// eslint-disable-next-line @typescript-eslint/no-explicit-any
function applyDealerFilters(query: any, filters: DealerFilters) {
  let q = query;
  if (filters.country) q = q.eq("country", filters.country);
  if (filters.city) q = q.eq("city", filters.city);
  if (filters.pipeline_status) q = q.eq("pipeline_status", filters.pipeline_status);
  if (filters.lead_grade) q = q.eq("lead_grade", filters.lead_grade);
  if (filters.is_launch_partner !== undefined) q = q.eq("is_launch_partner", filters.is_launch_partner);
  if (filters.inventory_min) q = q.gte("inventory_value", filters.inventory_min);
  if (filters.date_from) q = q.gte("created_at", filters.date_from);
  if (filters.date_to) q = q.lte("created_at", filters.date_to);
  if (filters.search) {
    const term = `%${filters.search.trim()}%`;
    q = q.or(
      `company_name.ilike.${term},contact_name.ilike.${term},email.ilike.${term},city.ilike.${term},country.ilike.${term}`
    );
  }
  return q;
}

export async function getDealers(options: {
  cursor?: string;
  limit?: number;
  filters?: DealerFilters;
} = {}): Promise<{ dealers: Dealer[]; nextCursor: string | null }> {
  const supabase = createServiceClient();
  const limit = options.limit ?? DEALER_PAGE_SIZE;
  const filters = options.filters ?? {};

  let query = supabase
    .from("dealers")
    .select("*")
    .order("created_at", { ascending: false })
    .limit(limit + 1);

  query = applyDealerFilters(query, filters);

  if (options.cursor) {
    query = query.lt("created_at", options.cursor);
  }

  const { data } = await query;
  const rows = (data ?? []) as Dealer[];
  const hasMore = rows.length > limit;
  const dealers = hasMore ? rows.slice(0, limit) : rows;
  const nextCursor = hasMore ? dealers[dealers.length - 1]?.created_at ?? null : null;

  return { dealers, nextCursor };
}

export async function getDealersByPipelineStatus(
  status: DealerPipelineStatus,
  limit = 20,
  offset = 0
): Promise<Dealer[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("dealers")
    .select("*")
    .eq("pipeline_status", status)
    .order("updated_at", { ascending: false })
    .range(offset, offset + limit - 1);
  return (data ?? []) as Dealer[];
}

export async function getDealerById(id: string): Promise<DealerWithStats | null> {
  const supabase = createServiceClient();
  const { data } = await supabase.from("dealers").select("*").eq("id", id).single();
  if (!data) return null;

  const dealer = data as Dealer;
  let listings_count = 0;
  let actual_monthly_gmv = 0;

  if (dealer.user_id) {
    const monthStart = startOfMonth(new Date()).toISOString();
    const [{ count }, { data: orders }] = await Promise.all([
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("seller_id", dealer.user_id).eq("status", "active"),
      supabase.from("orders").select("amount").eq("seller_id", dealer.user_id).eq("status", "completed").gte("created_at", monthStart),
    ]);
    listings_count = count ?? 0;
    actual_monthly_gmv = orders?.reduce((s, o) => s + (o.amount ?? 0), 0) ?? 0;
  }

  return { ...dealer, listings_count, actual_monthly_gmv };
}

export async function getDealerActivities(dealerId: string, limit = 50): Promise<DealerActivity[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("dealer_activities")
    .select("*, creator:users!created_by(id, full_name, username)")
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DealerActivity[];
}

export async function getDealerTasks(dealerId: string): Promise<DealerTask[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("dealer_tasks")
    .select("*, assignee:users!assigned_to(id, full_name, username)")
    .eq("dealer_id", dealerId)
    .order("due_at", { ascending: true, nullsFirst: false });
  return (data ?? []) as DealerTask[];
}

export async function getDealerChangelog(dealerId: string, limit = 100): Promise<DealerChangelog[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("dealer_changelog")
    .select("*, admin:users!admin_id(id, full_name, username)")
    .eq("dealer_id", dealerId)
    .order("created_at", { ascending: false })
    .limit(limit);
  return (data ?? []) as DealerChangelog[];
}

export async function getAdminUsers(): Promise<UserProfile[]> {
  const supabase = createServiceClient();
  const { data } = await supabase
    .from("users")
    .select("id, full_name, username, avatar_url, admin_role")
    .not("admin_role", "is", null)
    .eq("suspended", false);
  return (data ?? []) as UserProfile[];
}

export async function getDealerFilterOptions() {
  const supabase = createServiceClient();
  const { data } = await supabase.from("dealers").select("country, city");
  const countries = [...new Set((data ?? []).map((d) => d.country).filter(Boolean))].sort();
  const cities = [...new Set((data ?? []).map((d) => d.city).filter(Boolean))].sort();
  return { countries: countries as string[], cities: cities as string[] };
}

export async function getDealerAnalytics(): Promise<DealerAnalytics> {
  const supabase = createServiceClient();
  const monthStart = startOfMonth(new Date()).toISOString();

  const { data: allDealers } = await supabase.from("dealers").select("*");
  const dealers = (allDealers ?? []) as Dealer[];

  const totalLeads = dealers.length;
  const newLeadsThisMonth = dealers.filter((d) => d.created_at >= monthStart).length;
  const activeConversations = dealers.filter((d) =>
    ["contacted", "interested", "demo_scheduled"].includes(d.pipeline_status)
  ).length;
  const meetingsScheduled = dealers.filter((d) => d.pipeline_status === "demo_scheduled").length;
  const signedDealers = dealers.filter((d) =>
    ["account_created", "inventory_imported", "active_seller", "top_seller"].includes(d.pipeline_status)
  ).length;
  const launchPartners = dealers.filter((d) => d.is_launch_partner).length;
  const activeSellers = dealers.filter((d) =>
    ["active_seller", "top_seller"].includes(d.pipeline_status)
  ).length;
  const topSellers = dealers.filter((d) => d.pipeline_status === "top_seller").length;

  const totalInventoryValue = dealers.reduce((s, d) => s + (d.inventory_value ?? 0), 0);
  const totalWatches = dealers.reduce((s, d) => s + (d.watch_count ?? 0), 0);
  const estimatedMonthlyGmv = dealers.reduce((s, d) => s + (d.estimated_monthly_sales ?? 0), 0);
  const estimatedAnnualGmv = estimatedMonthlyGmv * 12;
  const estimatedAnnualRevenue = dealers.reduce((s, d) => {
    const monthly = Math.round((d.estimated_monthly_sales ?? 0) * (d.commission_rate / 100));
    return s + monthly * 12;
  }, 0);

  const dealerGrowth = groupDealersByMonth(dealers);
  const conversionFunnel = DEALER_PIPELINE_STATUSES.map((status) => ({
    date: status,
    value: dealers.filter((d) => d.pipeline_status === status).length,
    label: status.replace(/_/g, " "),
  }));
  const inventoryGrowth = groupDealersInventoryByMonth(dealers);
  const revenueForecast = groupDealersRevenueByMonth(dealers);
  const locationMap = new Map<string, number>();
  for (const d of dealers) {
    const key = d.country ?? "Unknown";
    locationMap.set(key, (locationMap.get(key) ?? 0) + 1);
  }
  const dealerLocations = Array.from(locationMap.entries())
    .map(([date, value]) => ({ date, value }))
    .sort((a, b) => b.value - a.value)
    .slice(0, 15);

  return {
    totalLeads,
    newLeadsThisMonth,
    activeConversations,
    meetingsScheduled,
    signedDealers,
    launchPartners,
    activeSellers,
    topSellers,
    totalInventoryValue,
    totalWatches,
    estimatedMonthlyGmv,
    estimatedAnnualGmv,
    estimatedAnnualRevenue,
    dealerGrowth,
    conversionFunnel,
    inventoryGrowth,
    revenueForecast,
    dealerLocations,
  };
}

function groupDealersByMonth(dealers: Dealer[]): ChartDataPoint[] {
  const map = new Map<string, number>();
  for (const d of dealers) {
    const key = format(new Date(d.created_at), "yyyy-MM");
    map.set(key, (map.get(key) ?? 0) + 1);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function groupDealersInventoryByMonth(dealers: Dealer[]): ChartDataPoint[] {
  const map = new Map<string, number>();
  for (const d of dealers) {
    const key = format(new Date(d.created_at), "yyyy-MM");
    map.set(key, (map.get(key) ?? 0) + (d.inventory_value ?? 0));
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

function groupDealersRevenueByMonth(dealers: Dealer[]): ChartDataPoint[] {
  const map = new Map<string, number>();
  for (const d of dealers) {
    const key = format(new Date(d.created_at), "yyyy-MM");
    const annual = Math.round((d.estimated_monthly_sales ?? 0) * (d.commission_rate / 100)) * 12;
    map.set(key, (map.get(key) ?? 0) + annual);
  }
  return Array.from(map.entries())
    .sort(([a], [b]) => a.localeCompare(b))
    .map(([date, value]) => ({ date, value }));
}

export async function getDealerCrmNotifications(): Promise<AdminNotification[]> {
  const supabase = createServiceClient();
  const crmTypes = [
    "follow_up_due_today",
    "follow_up_overdue",
    "meeting_tomorrow",
    "proposal_waiting",
    "launch_partner_expiring_30",
    "launch_partner_expiring_7",
  ];
  const { data } = await supabase
    .from("admin_notifications")
    .select("*")
    .in("type", crmTypes)
    .order("created_at", { ascending: false })
    .limit(50);
  return (data ?? []) as AdminNotification[];
}

// ─── Shopify Integrations ───

export async function getShopifyIntegrationStats(): Promise<import("@/types/database").ShopifyIntegrationStats> {
  const supabase = createServiceClient();
  const since = new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString();

  const [{ count: storeCount }, { count: listingCount }, { data: failedLogs }, { data: lastStore }] =
    await Promise.all([
      supabase.from("dealer_shopify_stores").select("id", { count: "exact", head: true }).eq("integration_enabled", true),
      supabase.from("listings").select("id", { count: "exact", head: true }).eq("external_source", "shopify"),
      supabase.from("shopify_sync_logs").select("id").eq("status", "failed").gte("created_at", since),
      supabase
        .from("dealer_shopify_stores")
        .select("last_sync")
        .order("last_sync", { ascending: false })
        .limit(1)
        .maybeSingle(),
    ]);

  return {
    connectedStores: storeCount ?? 0,
    connectedDealers: storeCount ?? 0,
    totalImportedListings: listingCount ?? 0,
    failedSyncs24h: failedLogs?.length ?? 0,
    lastSyncAt: lastStore?.last_sync ?? null,
  };
}

export async function getShopifyStores(limit = 50): Promise<import("@/types/database").DealerShopifyStore[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("dealer_shopify_stores_public")
    .select(`
      *,
      dealer:dealers(company_name, contact_name, email)
    `)
    .order("connected_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as import("@/types/database").DealerShopifyStore[];
}

export async function getShopifySyncLogs(limit = 100): Promise<import("@/types/database").ShopifySyncLog[]> {
  const supabase = createServiceClient();
  const { data, error } = await supabase
    .from("shopify_sync_logs")
    .select(`
      *,
      dealer:dealers(company_name, email)
    `)
    .order("created_at", { ascending: false })
    .limit(limit);

  if (error) throw error;
  return (data ?? []) as import("@/types/database").ShopifySyncLog[];
}
