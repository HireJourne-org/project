import { supabase } from './supabaseService';

export interface ParsedJobDescription {
  jobTitle: string;
  responsibilities: string[];
  requiredSkills: string[];
  preferredSkills: string[];
  companyValues: string[];
}

export const parseJobDescription = async (jobDescription: string): Promise<ParsedJobDescription> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/job-description-parser`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ jobDescription }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse job description');
    }

    return await response.json();
  } catch (error) {
    console.error('Job description parsing failed:', error);
    throw error;
  }
};