import { supabase } from './supabaseService';
import { ParsedResume } from './resumeService';
import { ParsedJobDescription } from './jobService';

export interface STARAnswer {
  question: string;
  star_i_answer: {
    situation: string;
    task: string;
    action: string;
    result: string;
    impact_pivot: string;
  };
}

export const generateBehavioralSTAR = async (
  parsedResume: ParsedResume,
  parsedJD: ParsedJobDescription
): Promise<STARAnswer[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/behavioral-star`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parsedResume,
        parsedJD
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate STAR answers');
    }

    return await response.json();
  } catch (error) {
    console.error('STAR answer generation failed:', error);
    throw error;
  }
};

export const generateTechnicalSTAR = async (
  parsedResume: ParsedResume,
  parsedJD: ParsedJobDescription
): Promise<STARAnswer[]> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/technical-star`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        parsedResume,
        parsedJD
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to generate technical STAR answers');
    }

    return await response.json();
  } catch (error) {
    console.error('Technical STAR answer generation failed:', error);
    throw error;
  }
};