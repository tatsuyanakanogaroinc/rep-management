import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';

export interface PricingSettings {
  id: string;
  monthly_price: number;
  yearly_price: number;
  currency: string;
  pricing_model: 'flat' | 'per_user' | 'tiered';
  is_active: boolean;
  effective_date: string;
  created_at: string;
  updated_at: string;
}

export interface PricingSettingsInput {
  monthly_price: number;
  yearly_price: number;
  pricing_model: 'flat' | 'per_user' | 'tiered';
  effective_date?: string;
}

export function usePricingSettings() {
  const queryClient = useQueryClient();

  // 現在の料金設定を取得
  const pricingQuery = useQuery({
    queryKey: ['pricing-settings'],
    queryFn: async (): Promise<PricingSettings> => {
      console.log('PricingSettings: Fetching current pricing...');
      
      // get_current_pricing関数を使用
      const { data, error } = await supabase.rpc('get_current_pricing');

      if (error) {
        // RPCが存在しない場合は警告レベルに下げる
        if (error.code === 'PGRST202' || error.message?.includes('function') || error.message?.includes('not found')) {
          console.warn('get_current_pricing RPC not found, using default values');
        } else {
          console.error('Failed to fetch pricing settings:', error);
        }
        // デフォルト値を返す
        return {
          id: 'default',
          monthly_price: 4980,
          yearly_price: 49800,
          currency: 'JPY',
          pricing_model: 'flat',
          is_active: true,
          effective_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      if (!data || data.length === 0) {
        // データがない場合はデフォルト値
        return {
          id: 'default',
          monthly_price: 4980,
          yearly_price: 49800,
          currency: 'JPY',
          pricing_model: 'flat',
          is_active: true,
          effective_date: new Date().toISOString().split('T')[0],
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString()
        };
      }

      // 最初のレコードを返す（関数は1件のみ返す）
      const pricing = data[0];
      return {
        id: 'current',
        monthly_price: pricing.monthly_price,
        yearly_price: pricing.yearly_price,
        currency: pricing.currency,
        pricing_model: pricing.pricing_model,
        is_active: true,
        effective_date: new Date().toISOString().split('T')[0],
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString()
      };
    },
    staleTime: 10 * 60 * 1000, // 10分間キャッシュ
  });

  // 料金設定更新
  const updatePricingMutation = useMutation({
    mutationFn: async (settings: PricingSettingsInput) => {
      console.log('PricingSettings: Updating pricing:', settings);
      
      // 既存のアクティブ設定を無効化
      const { error: deactivateError } = await supabase
        .from('pricing_settings')
        .update({ is_active: false })
        .eq('is_active', true);

      if (deactivateError) {
        console.error('Failed to deactivate existing pricing:', deactivateError);
      }

      // 新しい設定を挿入
      const { data, error } = await supabase
        .from('pricing_settings')
        .insert([{
          monthly_price: settings.monthly_price,
          yearly_price: settings.yearly_price,
          pricing_model: settings.pricing_model,
          effective_date: settings.effective_date || new Date().toISOString().split('T')[0],
          is_active: true
        }])
        .select()
        .single();

      if (error) throw error;
      console.log('PricingSettings: Updated successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['pricing-settings'] });
      // 他の関連クエリも無効化
      queryClient.invalidateQueries({ queryKey: ['dashboard-with-targets'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-trends'] });
    },
  });

  return {
    data: pricingQuery.data,
    isLoading: pricingQuery.isLoading,
    error: pricingQuery.error,
    updatePricing: updatePricingMutation.mutateAsync,
    isUpdating: updatePricingMutation.isPending,
  };
}

// MRR計算用のヘルパー関数
export function calculateMRR(
  monthlyCustomers: number, 
  yearlyCustomers: number, 
  pricingSettings?: PricingSettings
): number {
  if (!pricingSettings) {
    // デフォルト価格を使用
    return monthlyCustomers * 4980 + yearlyCustomers * Math.round(49800 / 12);
  }
  
  const monthlyRevenue = monthlyCustomers * pricingSettings.monthly_price;
  const yearlyRevenue = yearlyCustomers * Math.round(pricingSettings.yearly_price / 12);
  
  return monthlyRevenue + yearlyRevenue;
}

// 料金設定の妥当性チェック
export function validatePricingSettings(settings: PricingSettingsInput): string[] {
  const errors = [];
  
  if (settings.monthly_price <= 0) {
    errors.push('月額料金は0円より大きい必要があります');
  }
  
  if (settings.yearly_price <= 0) {
    errors.push('年額料金は0円より大きい必要があります');
  }
  
  // 年額料金が月額料金の妥当な範囲かチェック
  const monthlyEquivalent = settings.yearly_price / 12;
  if (monthlyEquivalent > settings.monthly_price) {
    errors.push('年額料金の月割り金額が月額料金より高くなっています');
  }
  
  // 年額割引率が妥当かチェック（一般的には10-20%の割引）
  const discountRate = ((settings.monthly_price * 12 - settings.yearly_price) / (settings.monthly_price * 12)) * 100;
  if (discountRate < 5) {
    errors.push('年額プランの割引率が低すぎます（推奨: 5%以上）');
  } else if (discountRate > 50) {
    errors.push('年額プランの割引率が高すぎます（推奨: 50%以下）');
  }
  
  return errors;
}