import { supabase } from './supabaseService';

export interface Submission {
  submission_id: string;
  user_id: string;
  company_name: string;
  job_description: string;
  resume_url?: string;
  email: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  report_link?: string;
  created_at?: string;
  error_message?: string;
  interviewers_list: Array<{
    name: string;
    linkedin_url: string;
  }>;
  company_id?: string;
  company?: any;
}

export async function fetchSubmissions() {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Fetch submissions with reports only (no companies join)
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        reports (
          report_id,
          report_pdf_url,
          company_overview_summary,
          potential_interview_questions,
          key_insights
        )
      `)
      .eq('user_id', user.id)
      .order('created_at', { ascending: false });

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching submissions:', error);
    throw error;
  }
}

export async function getSubmission(submissionId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Fetch submission with reports only (no companies join)
    const { data, error } = await supabase
      .from('submissions')
      .select(`
        *,
        reports (
          report_id,
          report_pdf_url,
          company_overview_summary,
          potential_interview_questions,
          key_insights
        )
      `)
      .eq('submission_id', submissionId)
      .eq('user_id', user.id)
      .single();

    if (error) {
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Error fetching submission:', error);
    throw error;
  }
}

export async function updateSubmissionStatus(
  submissionId: string,
  status: 'pending' | 'processing' | 'complete' | 'failed',
  errorMessage?: string
) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const updates: any = { status };
    if (errorMessage !== undefined) {
      updates.error_message = errorMessage;
    }

    const { error } = await supabase
      .from('submissions')
      .update(updates)
      .eq('submission_id', submissionId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error updating submission status:', error);
    throw error;
  }
}

export async function deleteSubmission(submissionId: string) {
  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    const { error } = await supabase
      .from('submissions')
      .delete()
      .eq('submission_id', submissionId)
      .eq('user_id', user.id);

    if (error) {
      throw error;
    }
  } catch (error) {
    console.error('Error deleting submission:', error);
    throw error;
  }
}