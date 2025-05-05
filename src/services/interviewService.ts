import { supabase } from './supabaseService';

interface Interview {
  id: string;
  user_id: string;
  resume_url?: string;
  job_description: string;
  created_at?: string;
  status: string;
  interviewers: Interviewer[];
}

interface Interviewer {
  id: string;
  interview_id: string;
  linkedin_url: string;
  created_at?: string;
}

export const createInterview = async (
  jobDescription: string,
  resumeUrl: string | null,
  interviewerUrls: string[]
): Promise<Interview> => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  // Start a transaction
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .insert({
      user_id: user.id,
      job_description: jobDescription,
      resume_url: resumeUrl,
      status: 'pending'
    })
    .select()
    .single();

  if (interviewError) {
    throw interviewError;
  }

  // Insert interviewers
  const interviewerPromises = interviewerUrls.map(url =>
    supabase
      .from('interviewers')
      .insert({
        interview_id: interview.id,
        linkedin_url: url
      })
      .select()
  );

  const interviewerResults = await Promise.all(interviewerPromises);
  const interviewers = interviewerResults
    .map(result => result.data?.[0])
    .filter(Boolean);

  return {
    ...interview,
    interviewers
  };
};

export const getInterviews = async (): Promise<Interview[]> => {
  const { data: interviews, error: interviewsError } = await supabase
    .from('interviews')
    .select(`
      *,
      interviewers (*)
    `)
    .order('created_at', { ascending: false });

  if (interviewsError) {
    throw interviewsError;
  }

  return interviews || [];
};

export const getInterview = async (id: string): Promise<Interview> => {
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .select(`
      *,
      interviewers (*)
    `)
    .eq('id', id)
    .single();

  if (interviewError) {
    throw interviewError;
  }

  return interview;
};

export const updateInterview = async (
  id: string,
  updates: Partial<Interview>
): Promise<Interview> => {
  const { data: interview, error: interviewError } = await supabase
    .from('interviews')
    .update(updates)
    .eq('id', id)
    .select()
    .single();

  if (interviewError) {
    throw interviewError;
  }

  return interview;
};

export const deleteInterview = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('interviews')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};