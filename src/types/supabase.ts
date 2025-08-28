export type Database = {
  public: {
    Tables: {
      users: {
        Row: {
          id: string;
          email: string;
          name: string;
          role: 'member' | 'manager' | 'admin';
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id: string;
          email: string;
          name: string;
          role?: 'member' | 'manager' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          email?: string;
          name?: string;
          role?: 'member' | 'manager' | 'admin';
          created_at?: string;
          updated_at?: string;
        };
      };
      customers: {
        Row: {
          id: string;
          company_name: string;
          contact_name: string | null;
          plan_type: 'monthly' | 'yearly';
          status: 'active' | 'dormant' | 'churned';
          acquisition_channel: string;
          registered_at: string;
          churned_at: string | null;
          ltv: number | null;
          last_login_at: string | null;
          invitations_sent: number;
          invitations_approved: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          contact_name?: string | null;
          plan_type: 'monthly' | 'yearly';
          status?: 'active' | 'dormant' | 'churned';
          acquisition_channel: string;
          registered_at?: string;
          churned_at?: string | null;
          ltv?: number | null;
          last_login_at?: string | null;
          invitations_sent?: number;
          invitations_approved?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          company_name?: string;
          contact_name?: string | null;
          plan_type?: 'monthly' | 'yearly';
          status?: 'active' | 'dormant' | 'churned';
          acquisition_channel?: string;
          registered_at?: string;
          churned_at?: string | null;
          ltv?: number | null;
          last_login_at?: string | null;
          invitations_sent?: number;
          invitations_approved?: number;
          created_at?: string;
          updated_at?: string;
        };
      };
      daily_reports: {
        Row: {
          id: string;
          user_id: string;
          date: string;
          new_acquisitions: number;
          churns: number;
          acquisition_details: Record<string, any>;
          activities: string | null;
          tomorrow_plan: string | null;
          customer_feedback: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          user_id: string;
          date: string;
          new_acquisitions?: number;
          churns?: number;
          acquisition_details?: Record<string, any>;
          activities?: string | null;
          tomorrow_plan?: string | null;
          customer_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          user_id?: string;
          date?: string;
          new_acquisitions?: number;
          churns?: number;
          acquisition_details?: Record<string, any>;
          activities?: string | null;
          tomorrow_plan?: string | null;
          customer_feedback?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
      expenses: {
        Row: {
          id: string;
          date: string;
          category: string;
          amount: number;
          vendor: string;
          status: 'pending' | 'approved' | 'rejected';
          approved_by: string | null;
          receipt_url: string | null;
          notes: string | null;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          category: string;
          amount: number;
          vendor: string;
          status?: 'pending' | 'approved' | 'rejected';
          approved_by?: string | null;
          receipt_url?: string | null;
          notes?: string | null;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          category?: string;
          amount?: number;
          vendor?: string;
          status?: 'pending' | 'approved' | 'rejected';
          approved_by?: string | null;
          receipt_url?: string | null;
          notes?: string | null;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      targets: {
        Row: {
          id: string;
          period: string;
          metric_type: string;
          target_value: number;
          current_value: number;
          unit: string;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          period: string;
          metric_type: string;
          target_value: number;
          current_value?: number;
          unit: string;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          period?: string;
          metric_type?: string;
          target_value?: number;
          current_value?: number;
          unit?: string;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      budgets: {
        Row: {
          id: string;
          period: string;
          category: string;
          amount: number;
          spent: number;
          remaining: number;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          period: string;
          category: string;
          amount: number;
          spent?: number;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          period?: string;
          category?: string;
          amount?: number;
          spent?: number;
          created_by?: string;
          created_at?: string;
          updated_at?: string;
        };
      };
      actuals: {
        Row: {
          id: string;
          date: string;
          metric_type: string;
          value: number;
          channel: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          date: string;
          metric_type: string;
          value: number;
          channel?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: {
          id?: string;
          date?: string;
          metric_type?: string;
          value?: number;
          channel?: string | null;
          created_at?: string;
          updated_at?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
    CompositeTypes: {
      [_ in never]: never;
    };
  };
};