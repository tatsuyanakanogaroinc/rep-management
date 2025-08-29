import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { generateTargetsFromParameters } from '@/lib/target-calculator';

export interface GrowthParameters {
  id: number;
  initial_acquisitions: number;
  monthly_growth_rate: number;
  monthly_price: number;
  yearly_price: number;
  churn_rate: number;
  created_at: string;
  updated_at: string;
  is_active: boolean;
}

export interface GrowthParametersInput {
  initial_acquisitions: number;
  monthly_growth_rate: number;
  monthly_price: number;
  yearly_price: number;
  churn_rate: number;
}

export function useGrowthParameters() {
  const queryClient = useQueryClient();

  // パラメータ取得
  const parametersQuery = useQuery({
    queryKey: ['growth-parameters'],
    queryFn: async (): Promise<GrowthParameters> => {
      console.log('GrowthParameters: Fetching parameters...');
      
      // タイムアウト付きでパラメータ取得（5秒）
      const fetchPromise = supabase
        .from('growth_parameters')
        .select('*')
        .eq('is_active', true)
        .single();

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Growth parameters fetch timeout')), 5000)
      );

      const { data, error } = await Promise.race([fetchPromise, timeout]);

      if (error) {
        console.error('Failed to fetch growth parameters:', error);
        console.log('GrowthParameters: Using default values');
        // デフォルト値を返す
        return {
          id: 1,
          initial_acquisitions: 30,
          monthly_growth_rate: 50,
          monthly_price: 2490,
          yearly_price: 24900,
          churn_rate: 5.0,
          created_at: new Date().toISOString(),
          updated_at: new Date().toISOString(),
          is_active: true
        };
      }

      console.log('GrowthParameters: Data fetched successfully:', data);

      return data;
    },
    staleTime: 5 * 60 * 1000, // 5分間キャッシュ
  });

  // パラメータ更新
  const updateParametersMutation = useMutation({
    mutationFn: async (parameters: GrowthParametersInput) => {
      console.log('GrowthParameters: Updating parameters:', parameters);
      
      // タイムアウト付きで更新（8秒）
      const updatePromise = supabase
        .from('growth_parameters')
        .update({
          ...parameters,
          updated_at: new Date().toISOString()
        })
        .eq('is_active', true)
        .select()
        .single();

      const timeout = new Promise<never>((_, reject) =>
        setTimeout(() => reject(new Error('Parameters update timeout')), 8000)
      );

      const { data, error } = await Promise.race([updatePromise, timeout]);

      if (error) {
        // レコードが存在しない場合は挿入
        if (error.code === 'PGRST116') {
          console.log('GrowthParameters: Record not found, inserting new one');
          
          const insertPromise = supabase
            .from('growth_parameters')
            .insert([{
              ...parameters,
              is_active: true
            }])
            .select()
            .single();

          const insertTimeout = new Promise<never>((_, reject) =>
            setTimeout(() => reject(new Error('Parameters insert timeout')), 5000)
          );

          const { data: insertData, error: insertError } = await Promise.race([
            insertPromise,
            insertTimeout
          ]);

          if (insertError) throw insertError;
          console.log('GrowthParameters: New record inserted successfully');
          return insertData;
        }
        throw error;
      }

      console.log('GrowthParameters: Parameters updated successfully');
      return data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['growth-parameters'] });
    },
  });

  // 目標値再計算とデータベース更新
  const recalculateTargetsMutation = useMutation({
    mutationFn: async (parameters: GrowthParametersInput) => {
      try {
        console.log('Recalculating targets with parameters:', parameters);
        
        // 目標値を計算
        const targets = generateTargetsFromParameters(parameters);
        console.log('Generated targets:', targets.length, 'records');
        
        // 計算結果を確認
        if (!targets || targets.length === 0) {
          throw new Error('目標値の計算に失敗しました');
        }

        // バッチで削除と挿入を行う（トランザクション的な処理）
        // まず既存の目標値を削除（2025-09以降）
        console.log('Deleting existing targets from 2025-09 onwards...');
        const { error: deleteError, count: deleteCount } = await supabase
          .from('targets')
          .delete()
          .gte('period', '2025-09')
          .select('*', { count: 'exact', head: true });

        if (deleteError) {
          console.error('Delete error:', deleteError);
          throw new Error(`目標値の削除に失敗しました: ${deleteError.message}`);
        }
        console.log(`Deleted ${deleteCount || 0} existing target records`);

        // 新しい目標値をバッチで挿入（一度に100件まで）
        const batchSize = 100;
        for (let i = 0; i < targets.length; i += batchSize) {
          const batch = targets.slice(i, i + batchSize);
          console.log(`Inserting batch ${Math.floor(i / batchSize) + 1} of ${Math.ceil(targets.length / batchSize)}...`);
          
          const { error: insertError, data: insertedData } = await supabase
            .from('targets')
            .insert(batch)
            .select('*', { count: 'exact', head: true });

          if (insertError) {
            console.error('Insert error:', insertError);
            throw new Error(`目標値の挿入に失敗しました: ${insertError.message}`);
          }
        }
        console.log('All target batches inserted successfully');

        // パラメータも更新
        console.log('Updating growth parameters...');
        await updateParametersMutation.mutateAsync(parameters);

        console.log('Successfully updated targets and parameters');
        return { success: true, count: targets.length };
        
      } catch (error) {
        console.error('Recalculate targets error:', error);
        // エラーメッセージを明確にする
        if (error instanceof Error) {
          throw new Error(`再計算エラー: ${error.message}`);
        }
        throw new Error('目標値の再計算中に予期しないエラーが発生しました');
      }
    },
    onSuccess: () => {
      // 関連するすべてのキャッシュを無効化
      queryClient.invalidateQueries({ queryKey: ['growth-parameters'] });
      queryClient.invalidateQueries({ queryKey: ['targets'] });
      queryClient.invalidateQueries({ queryKey: ['dashboard-with-targets'] });
      queryClient.invalidateQueries({ queryKey: ['monthly-trends'] });
    },
  });

  return {
    data: parametersQuery.data,
    isLoading: parametersQuery.isLoading,
    error: parametersQuery.error,
    updateParameters: updateParametersMutation.mutateAsync,
    recalculateTargets: recalculateTargetsMutation.mutateAsync,
    isUpdating: updateParametersMutation.isPending,
    isRecalculating: recalculateTargetsMutation.isPending,
  };
}