import { supabase } from './supabaseService';

export interface TechStack {
  name: string;
  category: string;
  description?: string;
}

export const fetchTechStack = async (domain: string): Promise<TechStack[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/tech-stack`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ domain }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to fetch tech stack');
    }

    return await response.json();
  } catch (error) {
    console.error('Tech stack analysis failed:', error);
    throw error;
  }
};