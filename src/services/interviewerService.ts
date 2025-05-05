import { supabase } from './supabaseService';

export interface InterviewerProfile {
  name: string;
  title: string;
  current_company: string;
  linkedin_url: string;
  assessment_notes: string;
}

export interface InterviewerInput {
  linkedin_url?: string;
  name?: string;
  company?: string;
}

export const researchInterviewer = async (interviewer: InterviewerInput): Promise<InterviewerProfile> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/interviewer-research`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(interviewer),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to research interviewer');
    }

    return await response.json();
  } catch (error) {
    console.error('Interviewer research failed:', error);
    throw error;
  }
};