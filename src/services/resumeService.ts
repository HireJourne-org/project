import { supabase } from './supabaseService';

export interface ParsedResume {
  fullName?: string;
  email?: string;
  phone?: string;
  jobTitles: string[];
  companies: string[];
  skills: string[];
  education: {
    degree: string;
    institution: string;
    year?: string;
  }[];
  industries: string[];
}

export const parseResume = async (resumeUrl: string): Promise<ParsedResume> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resume-parser`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ resumeUrl }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to parse resume');
    }

    return await response.json();
  } catch (error) {
    console.error('Resume parsing failed:', error);
    throw error;
  }
};

export const matchResumeToJob = async (
  parsedResume: ParsedResume,
  jobDescription: string
): Promise<{
  matchedSkills: string[];
  missingSkills: string[];
  relevantExperience: {
    role: string;
    relevance: number;
    matchingKeywords: string[];
  }[];
}> => {
  try {
    const { data: { session } } = await supabase.auth.getSession();
    if (!session) {
      throw new Error('No authenticated session');
    }

    const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/resume-matcher`, {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${session.access_token}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        resume: parsedResume,
        jobDescription
      }),
    });

    if (!response.ok) {
      const error = await response.json();
      throw new Error(error.error || 'Failed to match resume');
    }

    return await response.json();
  } catch (error) {
    console.error('Resume matching failed:', error);
    throw error;
  }
};