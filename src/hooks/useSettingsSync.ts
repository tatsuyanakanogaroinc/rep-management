import { useCallback } from 'react';
import { useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useAuthContext } from '@/lib/auth-context';

interface SettingUpdate {
  setting_key: string;
  setting_value: string;
  setting_type: string;
  category: string;
  description: string;
}

export function useSettingsSync() {
  const { user } = useAuthContext();
  const queryClient = useQueryClient();

  const updateSettingMutation = useMutation({
    mutationFn: async (setting: SettingUpdate) => {
      const { data, error } = await supabase
        .from('service_settings')
        .upsert({
          setting_key: setting.setting_key,
          setting_value: setting.setting_value,
          setting_type: setting.setting_type,
          category: setting.category,
          description: setting.description,
          created_by: user?.id,
          updated_at: new Date().toISOString()
        })
        .select()
        .single();
      
      if (error) throw error;
      return data;
    },
    onSuccess: () => {
      // 設定関連のクエリを無効化して再取得
      queryClient.invalidateQueries({ queryKey: ['service-settings'] });
      queryClient.invalidateQueries({ queryKey: ['service-settings-planning'] });
    }
  });

  const syncPlanningSettings = useCallback(async (planningParams: {
    targetNewCustomers: number;
    conversionRate: number;
    monthlyPrice: number;
    yearlyPrice: number;
    yearlyRatio: number;
    churnRate: number;
  }) => {
    const updates = [
      {
        setting_key: 'target_monthly_customers',
        setting_value: planningParams.targetNewCustomers.toString(),
        setting_type: 'number',
        category: 'planning',
        description: '月間新規顧客目標'
      },
      {
        setting_key: 'trial_conversion_rate',
        setting_value: (planningParams.conversionRate / 100).toString(),
        setting_type: 'number',
        category: 'growth',
        description: 'トライアル→有料転換率'
      },
      {
        setting_key: 'monthly_plan_price',
        setting_value: planningParams.monthlyPrice.toString(),
        setting_type: 'number',
        category: 'pricing',
        description: '月額プラン料金（円）'
      },
      {
        setting_key: 'yearly_plan_price',
        setting_value: planningParams.yearlyPrice.toString(),
        setting_type: 'number',
        category: 'pricing',
        description: '年額プラン料金（円）'
      },
      {
        setting_key: 'yearly_plan_ratio',
        setting_value: (planningParams.yearlyRatio / 100).toString(),
        setting_type: 'number',
        category: 'planning',
        description: '年額プラン選択率'
      },
      {
        setting_key: 'monthly_churn_rate',
        setting_value: (planningParams.churnRate / 100).toString(),
        setting_type: 'number',
        category: 'retention',
        description: '月次チャーン率'
      }
    ];

    // 順次更新
    for (const update of updates) {
      await updateSettingMutation.mutateAsync(update);
    }
  }, [updateSettingMutation]);

  const syncChannelSettings = useCallback(async (channelMix: Record<string, number>, channelCPA: Record<string, number>) => {
    const updates = [];

    // チャネル別割合を保存
    for (const [channel, percentage] of Object.entries(channelMix)) {
      updates.push({
        setting_key: `channel_mix_${channel}`,
        setting_value: (percentage / 100).toString(),
        setting_type: 'number',
        category: 'channels',
        description: `${channel}チャネル割合`
      });
    }

    // チャネル別CPAを保存
    for (const [channel, cpa] of Object.entries(channelCPA)) {
      if (cpa > 0) {
        updates.push({
          setting_key: `channel_cpa_${channel}`,
          setting_value: cpa.toString(),
          setting_type: 'number',
          category: 'channels',
          description: `${channel}チャネルCPA`
        });
      }
    }

    // 順次更新
    for (const update of updates) {
      await updateSettingMutation.mutateAsync(update);
    }
  }, [updateSettingMutation]);

  return {
    syncPlanningSettings,
    syncChannelSettings,
    isUpdating: updateSettingMutation.isPending
  };
}