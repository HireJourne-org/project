import { supabase } from './supabaseService';

export interface Competitor {
  name: string;
  description: string;
}

export const fetchCompetitors = async (companyName: string): Promise<Competitor[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/competitors`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ companyName }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch competitors');
    }

    return await response.json();
  } catch (error) {
    console.error('Competitor analysis failed:', error);
    throw error;
  }
};