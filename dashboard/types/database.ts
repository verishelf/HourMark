export type AdminRole =
  | "super_admin"
  | "support_admin"
  | "auth_inspector"
  | "finance_admin";

export type ListingStatus = "draft" | "active" | "sold" | "archived" | "pending" | "rejected" | "featured";

export type LeadStatus =
  | "new"
  | "contacted"
  | "interested"
  | "negotiating"
  | "seller_onboarded"
  | "closed";

export type DealerPipelineStatus =
  | "new_lead"
  | "contacted"
  | "interested"
  | "demo_scheduled"
  | "proposal_sent"
  | "account_created"
  | "inventory_imported"
  | "active_seller"
  | "top_seller";

export type DealerGrade = "A+" | "A" | "B" | "C";

export type DealerActivityType =
  | "email"
  | "instagram_dm"
  | "whatsapp"
  | "phone_call"
  | "meeting"
  | "proposal_sent"
  | "account_created"
  | "inventory_imported";

export type DealerTaskStatus = "open" | "in_progress" | "done";
export type DealerTaskPriority = "low" | "medium" | "high" | "urgent";

export type Dealer = {
  id: string;
  company_name: string;
  contact_name: string;
  email: string;
  phone: string | null;
  website: string | null;
  instagram: string | null;
  city: string | null;
  country: string | null;
  inventory_value: number;
  estimated_monthly_sales: number;
  watch_count: number;
  instagram_followers: number;
  lead_score: number;
  lead_grade: DealerGrade;
  commission_rate: number;
  default_commission_rate: number;
  is_launch_partner: boolean;
  launch_partner_start: string | null;
  launch_partner_expires: string | null;
  pipeline_status: DealerPipelineStatus;
  notes: string | null;
  user_id: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type DealerActivity = {
  id: string;
  dealer_id: string;
  activity_type: DealerActivityType;
  notes: string | null;
  outcome: string | null;
  next_follow_up_at: string | null;
  created_by: string;
  created_at: string;
  creator?: UserProfile;
};

export type DealerTask = {
  id: string;
  dealer_id: string;
  title: string;
  assigned_to: string | null;
  due_at: string | null;
  status: DealerTaskStatus;
  priority: DealerTaskPriority;
  created_at: string;
  updated_at: string;
  assignee?: UserProfile;
};

export type DealerChangelog = {
  id: string;
  dealer_id: string;
  admin_id: string;
  field_name: string;
  old_value: string | null;
  new_value: string | null;
  created_at: string;
  admin?: UserProfile;
};

export type DealerFilters = {
  country?: string;
  city?: string;
  pipeline_status?: DealerPipelineStatus;
  lead_grade?: DealerGrade;
  is_launch_partner?: boolean;
  inventory_min?: number;
  date_from?: string;
  date_to?: string;
  search?: string;
};

export type DealerAnalytics = {
  totalLeads: number;
  newLeadsThisMonth: number;
  activeConversations: number;
  meetingsScheduled: number;
  signedDealers: number;
  launchPartners: number;
  activeSellers: number;
  topSellers: number;
  totalInventoryValue: number;
  totalWatches: number;
  estimatedMonthlyGmv: number;
  estimatedAnnualGmv: number;
  estimatedAnnualRevenue: number;
  dealerGrowth: ChartDataPoint[];
  conversionFunnel: ChartDataPoint[];
  inventoryGrowth: ChartDataPoint[];
  revenueForecast: ChartDataPoint[];
  dealerLocations: ChartDataPoint[];
};

export type DealerWithStats = Dealer & {
  listings_count?: number;
  actual_monthly_gmv?: number;
};

export type AuthRequestStatus =
  | "awaiting_shipment"
  | "received"
  | "under_inspection"
  | "passed"
  | "failed"
  | "returned"
  | "delivered";

export type TicketPriority = "low" | "medium" | "high" | "urgent";
export type TicketStatus = "open" | "in_progress" | "resolved" | "closed";

export type CampaignStatus = "draft" | "scheduled" | "sending" | "sent" | "cancelled";
export type CampaignAudience =
  | "sellers"
  | "buyers"
  | "dealers"
  | "new_leads"
  | "web_signups"
  | "all";

export type UserProfile = {
  id: string;
  username: string | null;
  full_name: string | null;
  avatar_url: string | null;
  email?: string;
  verified: boolean;
  is_verified_seller?: boolean;
  kyc_status?: string;
  admin_role?: AdminRole | null;
  suspended?: boolean;
  total_sales?: number;
  total_purchases?: number;
  created_at: string;
};

export type Listing = {
  id: string;
  seller_id: string;
  brand: string;
  model: string;
  reference_number: string | null;
  price: number;
  status: ListingStatus;
  authentication_status?: string;
  featured?: boolean;
  created_at: string;
  seller?: UserProfile;
};

export type Order = {
  id: string;
  buyer_id: string;
  seller_id: string;
  listing_id: string;
  amount: number;
  commission_fee: number;
  status: string;
  created_at: string;
  buyer?: UserProfile;
  seller?: UserProfile;
  listing?: Listing;
};

export type Transaction = {
  id: string;
  order_id: string;
  amount: number;
  commission_fee: number;
  seller_payout: number;
  stripe_charge_id: string | null;
  status: string;
  created_at: string;
  order?: Order;
};

export type SellerLead = {
  id: string;
  name: string;
  email: string;
  phone: string | null;
  watch_brand: string;
  model: string;
  estimated_value: number | null;
  status: LeadStatus;
  notes: string | null;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
};

export type AuthenticationRequest = {
  id: string;
  listing_id: string | null;
  seller_id: string;
  buyer_id: string | null;
  watch_brand: string;
  watch_model: string;
  tracking_number: string | null;
  status: AuthRequestStatus;
  inspection_notes: string | null;
  inspection_photos: string[];
  created_at: string;
  updated_at: string;
  seller?: UserProfile;
  buyer?: UserProfile;
};

export type SupportTicket = {
  id: string;
  user_id: string;
  subject: string;
  body: string;
  priority: TicketPriority;
  status: TicketStatus;
  assigned_to: string | null;
  created_at: string;
  updated_at: string;
  user?: UserProfile;
};

export type AdminNotification = {
  id: string;
  type: string;
  title: string;
  body: string;
  data: Record<string, unknown>;
  read_at: string | null;
  created_at: string;
};

export type EmailCampaign = {
  id: string;
  subject: string;
  template_html: string;
  template_id?: string | null;
  audience: CampaignAudience;
  audience_filters: Record<string, unknown>;
  status: CampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  open_count: number;
  click_count: number;
  reply_count: number;
  created_by: string;
  created_at: string;
};

export type EmailCampaignTemplate = {
  id: string;
  name: string;
  description: string | null;
  default_subject: string;
  html: string;
  created_by: string | null;
  created_at: string;
  updated_at: string;
};

export type WebsiteSignup = {
  id: string;
  email: string;
  source: string;
  subscribed: boolean;
  created_at: string;
};

export type AuditLog = {
  id: string;
  admin_id: string;
  action: string;
  resource_type: string;
  resource_id: string | null;
  details: Record<string, unknown>;
  created_at: string;
  admin?: UserProfile;
};

export type PlatformSettings = {
  id: string;
  commission_percentage: number;
  seller_fee_percentage: number;
  buyer_fee_percentage: number;
  email_templates: Record<string, string>;
  authentication_rules: Record<string, unknown>;
  platform_settings: Record<string, unknown>;
  updated_at: string;
};

export type DashboardKPIs = {
  totalUsers: number;
  activeSellers: number;
  activeBuyers: number;
  totalListings: number;
  pendingListings: number;
  pendingAuthRequests: number;
  completedSales: number;
  totalRevenue: number;
  monthlyRevenue: number;
  openSupportTickets: number;
};

export type ChartDataPoint = {
  date: string;
  value: number;
  label?: string;
};

export type PushNotificationAudience =
  | "sellers"
  | "buyers"
  | "dealers"
  | "new_leads"
  | "web_signups"
  | "all";

export type PushNotificationCampaignStatus =
  | "draft"
  | "scheduled"
  | "sending"
  | "sent"
  | "cancelled";

export type PushNotificationCampaign = {
  id: string;
  title: string;
  body: string;
  audience: PushNotificationAudience;
  deep_link: string | null;
  status: PushNotificationCampaignStatus;
  scheduled_at: string | null;
  sent_at: string | null;
  recipient_count: number;
  success_count: number;
  failure_count: number;
  created_by: string;
  created_at: string;
  updated_at: string;
};

export type {
  Story,
  StoryStatus,
  StoryBlock,
  StoryCategory,
  Author,
  StorySubmission,
  SubmissionStatus,
  CelebrityProfile,
  CollectorProfile,
  StoryAnalytics,
  UserInterest,
} from "./stories";

export type {
  SocialPlatform,
  SocialPostStatus,
  SocialPost,
  SocialChannelCredentials,
  SocialPlatformResult,
} from "./social-media";

export type ShopifySyncStatus = "idle" | "syncing" | "success" | "error" | "disabled";

export type ShopifySyncType =
  | "initial_import"
  | "manual"
  | "webhook"
  | "scheduled"
  | "admin_force";

export type ShopifySyncLogStatus = "started" | "success" | "partial" | "failed";

export type DealerShopifyStore = {
  id: string;
  dealer_id: string;
  user_id: string;
  shop_domain: string;
  shop_name: string | null;
  connected_at: string;
  last_sync: string | null;
  sync_status: ShopifySyncStatus;
  products_imported: number;
  integration_enabled: boolean;
  seller_fee_rate: number;
  created_at: string;
  updated_at: string;
  dealer?: Pick<Dealer, "company_name" | "contact_name" | "email">;
};

export type ShopifySyncLog = {
  id: string;
  dealer_id: string;
  store_id: string | null;
  sync_type: ShopifySyncType;
  status: ShopifySyncLogStatus;
  products_created: number;
  products_updated: number;
  products_deleted: number;
  error_message: string | null;
  metadata: Record<string, unknown>;
  created_at: string;
  dealer?: Pick<Dealer, "company_name" | "email">;
};

export type ShopifyIntegrationStats = {
  connectedStores: number;
  connectedDealers: number;
  totalImportedListings: number;
  failedSyncs24h: number;
  lastSyncAt: string | null;
};
