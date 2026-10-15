import { supabase } from './supabaseService';

export type FitTier = 'strong_target' | 'viable_target' | 'stretch' | 'not_a_fit';
export type ReviewStatus = 'pending_review' | 'verified' | 'rejected';

export interface CompanyStrategy {
  fit_score: number;
  fit_tier: FitTier;
  primary_signal: 'market' | 'tech' | 'both' | 'neither';
  why: string;
  evidence_matches: { career_evidence: string; company_signal: string; source: 'market' | 'tech' }[];
  source_conflicts: { topic: string; market_says: string; tech_says: string; resolution: string }[];
  gaps: string[];
  proposed_moves: string[];
}

export interface CompanyStrategyRecord {
  id: string;
  company_name: string;
  fit_score: number;
  fit_tier: FitTier;
  strategy: CompanyStrategy;
  model: string;
  status: ReviewStatus;
  reviewed_at: string | null;
  created_at: string;
}

export interface SemanticBridgeInput {
  resume: string | Record<string, unknown>;
  company: {
    name: string;
    market?: unknown; // SimilarIQ payload
    tech?: unknown; // TinyFish payload
    jobDescription?: string;
  };
}

// Returns a draft (status `pending_review`); it must be approved before use.
export const generateCompanyStrategy = async (input: SemanticBridgeInput) => {
  const { data: { session } } = await supabase.auth.getSession();
  if (!session) {
    throw new Error('No authenticated session');
  }

  const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/semantic-bridge`, {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${session.access_token}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify(input),
  });

  if (!response.ok) {
    const error = await response.json().catch(() => ({}));
    throw new Error(error.error || 'Failed to build company strategy');
  }

  return await response.json() as CompanyStrategy & {
    id: string;
    company_name: string;
    status: ReviewStatus;
    created_at: string;
    model: string;
  };
};

export const listCompanyStrategies = async (status?: ReviewStatus): Promise<CompanyStrategyRecord[]> => {
  let query = supabase
    .from('company_strategies')
    .select('id, company_name, fit_score, fit_tier, strategy, model, status, reviewed_at, created_at')
    .order('created_at', { ascending: false });

  if (status) {
    query = query.eq('status', status);
  }

  const { data, error } = await query;
  if (error) throw error;
  return data ?? [];
};

const setReviewStatus = async (id: string, status: ReviewStatus) => {
  const { data, error } = await supabase
    .from('company_strategies')
    .update({ status })
    .eq('id', id)
    .select('id, status, reviewed_at')
    .single();

  if (error) throw error;
  return data;
};

// Review First: the user's explicit sign-off. Only call from a user action.
export const approveCompanyStrategy = (id: string) => setReviewStatus(id, 'verified');
export const rejectCompanyStrategy = (id: string) => setReviewStatus(id, 'rejected');
