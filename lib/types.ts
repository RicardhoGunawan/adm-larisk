export type User = {
  id: number;
  name: string;
  phone: string;
  email?: string;
  is_owner: boolean;
  is_active: boolean;
  business_id?: number;
  business_name?: string;
  last_login_at?: string;
  created_at: string;
  total_businesses?: number;
};

export type Business = {
  id: number;
  name: string;
  business_type: string;
  owner_id: number;
  owner_name: string;
  owner_phone: string;
  address?: string;
  phone?: string;
  is_active: boolean;
  outlets_count: number;
  users_count: number;
  subscription_status: "trialing" | "active" | "past_due" | "expired" | "canceled";
  plan_name: string;
  current_period_end?: string;
  created_at: string;
};

export type Invoice = {
  id: number;
  invoice_number: string;
  business_id: number;
  business_name: string;
  amount_idr: number;
  status: "open" | "pending" | "paid" | "expired" | "draft" | "failed";
  due_date: string;
  paid_at?: string;
  gateway: string;
  created_at: string;
};

export type DashboardStats = {
  total_users: number;
  total_businesses: number;
  total_outlets: number;
  active_subscriptions: number;
  trialing_subscriptions: number;
  expired_subscriptions: number;
  revenue_month: number;
  revenue_last_month?: number;
  revenue_total: number;
  pending_invoices: number;
  new_users_7d: number;
  trend_7d?: { date: string; new_users: number; new_businesses: number; revenue: number }[];
  // No.1 insights
  mrr: number;
  arr: number;
  growth_percent: number;
  arpu: number;
  ltv: number;
  churn_rate: number;
  trial_conversion: number;
  revenue_6m: { month: string; month_short: string; revenue: number }[];
  subscription_trend: { month: string; month_short: string; trial: number; active: number }[];
  // No.2 insights
  top_stores: { id: number; name: string; business_type: string; outlets_count: number; users_count: number; transactions_count: number; total_sales: number; paid_revenue: number; subscription_status: string; plan_name: string }[];
  activity_hourly: { hour: number; label: string; count: number; revenue: number }[];
  cohort: { month: string; total: number; active: number; retention: number }[];
};

export type ApiMeta = {
  current_page: number;
  per_page: number;
  total: number;
  last_page: number;
};

export type ApiResponse<T> = {
  data: T;
  meta?: ApiMeta;
  message?: string;
};

export type PaginatedData<T> = {
  data: T[];
  meta: ApiMeta;
};
