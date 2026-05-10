import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { supabase } from '../services/supabase';
import { resolveOrganizationId } from '../utils/resolveOrganizationId';

// ─── Types ───────────────────────────────────────────────────────────

export interface SubmitForApprovalInput {
  post_id: string;
  note?: string;
}

export interface SubmitForApprovalResult {
  ok: boolean;
  post_id: string;
  status: 'in_review';
  notified_admins?: number;
}

export type ApprovalDecision = 'approve' | 'reject';

export interface ProcessApprovalInput {
  post_id: string;
  decision: ApprovalDecision;
  reason?: string;
}

export interface ProcessApprovalResult {
  ok: boolean;
  post_id: string;
  status: 'approved' | 'draft';
}

// ─── Helpers ─────────────────────────────────────────────────────────

/**
 * Invalidate all post-related caches so the UI reflects the new status
 * after an approval-flow mutation. Mirrors the keys used by useEventPosts.
 */
function invalidatePostCaches(qc: ReturnType<typeof useQueryClient>) {
  qc.invalidateQueries({ queryKey: ['event-posts'] });
  qc.invalidateQueries({ queryKey: ['go-posts'] });
  qc.invalidateQueries({ queryKey: ['library-posts'] });
  qc.invalidateQueries({ queryKey: ['go-notifications'] });
}

// ─── Mutations ───────────────────────────────────────────────────────

/**
 * Submit a draft post for admin approval. Calls the
 * `submit-post-for-approval` edge function which transitions the post
 * from `draft` → `in_review` and creates a `post_approval_needed`
 * notification for every admin in the user's organization.
 */
export function useSubmitForApproval() {
  const qc = useQueryClient();
  return useMutation<SubmitForApprovalResult, Error, SubmitForApprovalInput>({
    mutationFn: async ({ post_id, note }) => {
      const { data, error } = await supabase.functions.invoke('submit-post-for-approval', {
        body: { post_id, note },
      });
      if (error) {
        // supabase-js wraps non-2xx in FunctionsHttpError; surface body when possible
        let bodyMsg = '';
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx === 'object' && typeof ctx.json === 'function') {
          try {
            const j = await ctx.clone().json();
            bodyMsg = j?.error || j?.message || '';
          } catch { /* ignore */ }
        }
        throw new Error(bodyMsg || error.message || 'submit-post-for-approval failed');
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
      return data as SubmitForApprovalResult;
    },
    onSuccess: () => invalidatePostCaches(qc),
  });
}

/**
 * Approve or reject an `in_review` post. Calls the
 * `process-post-approval` edge function which transitions the post to
 * `approved` (or back to `draft` with a stored `rejection_reason`) and
 * creates a `post_approval_decided` notification for the submitter.
 *
 * Caller must have admin role in the organization — enforced server-side.
 */
export function useProcessApproval() {
  const qc = useQueryClient();
  return useMutation<ProcessApprovalResult, Error, ProcessApprovalInput>({
    mutationFn: async ({ post_id, decision, reason }) => {
      const { data, error } = await supabase.functions.invoke('process-post-approval', {
        body: { post_id, decision, reason },
      });
      if (error) {
        let bodyMsg = '';
        const ctx = (error as any)?.context;
        if (ctx && typeof ctx === 'object' && typeof ctx.json === 'function') {
          try {
            const j = await ctx.clone().json();
            bodyMsg = j?.error || j?.message || '';
          } catch { /* ignore */ }
        }
        throw new Error(bodyMsg || error.message || 'process-post-approval failed');
      }
      if (data && (data as any).error) {
        throw new Error((data as any).error);
      }
      return data as ProcessApprovalResult;
    },
    onSuccess: () => invalidatePostCaches(qc),
  });
}

// ─── Query: requires_post_approval flag ──────────────────────────────

/**
 * Returns `true` if the user's primary organization has the
 * `requires_post_approval` flag enabled. Used by PostReviewScreen to
 * gate the Publish button behind a Submit-for-review step.
 *
 * Returns `false` when:
 *   - the user is not logged in
 *   - the user has no organization (solo / unsupported state)
 *   - the flag is missing or false
 */
export function useRequiresApproval() {
  return useQuery<boolean>({
    queryKey: ['post-approval', 'requires-approval'],
    queryFn: async () => {
      const orgId = await resolveOrganizationId();
      if (!orgId) return false;

      const { data, error } = await supabase
        .from('organizations')
        .select('requires_post_approval')
        .eq('id', orgId)
        .maybeSingle();

      if (error) {
        console.warn('[useRequiresApproval] query error:', error.message);
        return false;
      }
      return Boolean((data as any)?.requires_post_approval);
    },
    staleTime: 60_000,
  });
}
