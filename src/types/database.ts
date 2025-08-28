export type UserRole = 'member' | 'manager' | 'admin';

export interface User {
  id: string;
  email: string;
  name: string;
  role: UserRole;
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: string;
  company_name: string;
  contact_name?: string;
  plan_type: 'monthly' | 'yearly';
  status: 'active' | 'dormant' | 'churned';
  acquisition_channel: string;
  registered_at: string;
  churned_at?: string;
  ltv?: number;
  last_login_at?: string;
  invitations_sent: number;
  invitations_approved: number;
  created_at: string;
  updated_at: string;
}

export interface DailyReport {
  id: string;
  user_id: string;
  date: string;
  new_acquisitions: number;
  churns: number;
  acquisition_details: Record<string, number>;
  activities: string;
  tomorrow_plan: string;
  customer_feedback?: string;
  created_at: string;
  updated_at: string;
}

export interface Expense {
  id: string;
  date: string;
  category: string;
  amount: number;
  vendor: string;
  status: 'pending' | 'approved' | 'rejected';
  approved_by?: string;
  receipt_url?: string;
  notes?: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Target {
  id: string;
  period: string;
  metric_type: string;
  target_value: number;
  current_value?: number;
  unit: string;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Budget {
  id: string;
  period: string;
  category: string;
  amount: number;
  spent?: number;
  remaining?: number;
  created_by: string;
  created_at: string;
  updated_at: string;
}