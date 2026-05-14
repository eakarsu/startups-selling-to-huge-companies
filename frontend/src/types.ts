export interface User {
  id: number;
  email: string;
  name: string;
  role: string;
}

export interface Company {
  id: number;
  name: string;
  industry: string;
  revenue_billions: number;
  employee_count: number;
  tier: string;
  website: string;
  hq_city: string;
  hq_country: string;
  stock_symbol: string;
  founded_year: number;
  notes: string;
}

export interface Contact {
  id: number;
  company_id: number;
  company_name: string;
  name: string;
  title: string;
  email: string;
  phone: string;
  linkedin: string;
  decision_maker: boolean;
  relationship_strength: string;
  last_contacted: string;
  notes: string;
}

export interface Deal {
  id: number;
  company_id: number;
  company_name: string;
  title: string;
  value_usd: number;
  stage: string;
  probability: number;
  expected_close: string;
  owner_id: number;
  created_at: string;
  last_activity_at: string;
  next_action: string;
  arr_usd: number;
}

export interface Activity {
  id: number;
  deal_id: number;
  deal_title: string;
  contact_id: number;
  contact_name: string;
  activity_type: string;
  subject: string;
  notes: string;
  outcome: string;
  scheduled_at: string;
  completed_at: string;
  duration_mins: number;
  created_by: number;
}

export interface SalesTeamMember {
  id: number;
  name: string;
  email: string;
  role: string;
  quota_usd: number;
  deals_won: number;
  revenue_closed: number;
  win_rate: number;
  avg_deal_size: number;
  active_deals: number;
  joined_date: string;
}

export interface Note {
  id: number;
  deal_id: number;
  deal_title: string;
  user_id: number;
  content: string;
  note_type: string;
  is_pinned: boolean;
  created_at: string;
  updated_at: string;
}
