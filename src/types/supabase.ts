import { User, Customer, DailyReport, Expense, Target, Budget, DailyActual } from './database';

export interface Database {
  public: {
    Tables: {
      users: {
        Row: User;
        Insert: Omit<User, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<User, 'id' | 'created_at' | 'updated_at'>>;
      };
      customers: {
        Row: Customer;
        Insert: Omit<Customer, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>;
      };
      daily_reports: {
        Row: DailyReport;
        Insert: Omit<DailyReport, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailyReport, 'id' | 'created_at' | 'updated_at'>>;
      };
      expenses: {
        Row: Expense;
        Insert: Omit<Expense, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Expense, 'id' | 'created_at' | 'updated_at'>>;
      };
      targets: {
        Row: Target;
        Insert: Omit<Target, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Target, 'id' | 'created_at' | 'updated_at'>>;
      };
      budgets: {
        Row: Budget;
        Insert: Omit<Budget, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<Budget, 'id' | 'created_at' | 'updated_at'>>;
      };
      daily_actuals: {
        Row: DailyActual;
        Insert: Omit<DailyActual, 'id' | 'created_at' | 'updated_at'>;
        Update: Partial<Omit<DailyActual, 'id' | 'created_at' | 'updated_at'>>;
      };
    };
  };
}