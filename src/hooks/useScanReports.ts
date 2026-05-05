import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';

const SUPABASE_URL      = process.env.EXPO_PUBLIC_SUPABASE_URL      ?? '';
const SUPABASE_ANON_KEY = process.env.EXPO_PUBLIC_SUPABASE_ANON_KEY ?? '';

export interface ScanCheckResult {
  id: string;
  name: string;
  passed: boolean;
  error?: string;
  scanIssueRef?: string;
}

export interface ScanReport {
  id: string;
  created_at: string;
  source: 'cron' | 'manual-edge' | 'manual-app';
  total_checks: number;
  passed: number;
  failed: number;
  results: ScanCheckResult[];
  summary: string | null;
}

// ─── Fetch the N most recent reports ─────────────────────────────────────────

export function useScanReports(limit = 10) {
  return useQuery<ScanReport[]>({
    queryKey: ['scan-reports', limit],
    queryFn: async () => {
      const { data, error } = await supabase
        .from('scan_reports')
        .select('*')
        .order('created_at', { ascending: false })
        .limit(limit);
      if (error) throw error;
      return (data ?? []) as ScanReport[];
    },
    staleTime: 60_000,
  });
}

// ─── Trigger a manual scan via the Edge Function ─────────────────────────────

export function useTriggerScan() {
  const qc = useQueryClient();

  return useMutation({
    mutationFn: async () => {
      const { data: { session } } = await supabase.auth.getSession();
      const token = session?.access_token ?? SUPABASE_ANON_KEY;

      const res = await fetch(`${SUPABASE_URL}/functions/v1/scan-monitor`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`,
          'apikey': SUPABASE_ANON_KEY,
        },
        body: '{}',
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`Scan mislukt (${res.status}): ${body}`);
      }

      return res.json() as Promise<{
        ok: boolean;
        source: string;
        passed: number;
        failed: number;
        total: number;
        summary: string;
        checks: ScanCheckResult[];
      }>;
    },
    onSuccess: () => {
      // Refetch the report list so the new result appears immediately
      qc.invalidateQueries({ queryKey: ['scan-reports'] });
    },
  });
}
