import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';
import { processSubmission } from './submissionProcessor.ts';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

serve(async (req) => {
  if (req.method === 'OPTIONS') {
    return new Response(null, { headers: corsHeaders });
  }

  try {
    const authHeader = req.headers.get('Authorization');
    if (!authHeader) {
      throw new Error('Missing authorization header');
    }

    // Create Supabase client
    const supabaseClient = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_ANON_KEY') ?? '',
      {
        global: { headers: { Authorization: authHeader } },
      }
    );

    // Verify authentication
    const { data: { user }, error: authError } = await supabaseClient.auth.getUser();
    if (authError || !user) {
      throw new Error('Unauthorized');
    }

    // Get submission data from request
    const { resumeUrl, jobDescription, interviewersList, companyName } = await req.json();

    // Validate required fields
    if (!jobDescription || !companyName) {
      throw new Error('Missing required fields');
    }
    
    // Validate resume URL format if provided
    if (resumeUrl) {
      // Check if URL is valid
      try {
        new URL(resumeUrl);
      } catch (error) {
        throw new Error('Invalid resume URL format');
      }
      
      // Check if resume URL belongs to the user (if using user-scoped storage)
      if (resumeUrl.includes('/resumes/')) {
        const urlParts = resumeUrl.split('/resumes/')[1].split('/');
        if (urlParts.length > 0 && urlParts[0] !== user.id) {
          console.warn(`Resume URL does not match user ID: ${resumeUrl}`);
          // We don't throw here to avoid breaking existing data, but we log a warning
        }
      }
    }

    // Create submission record
    const { data: submission, error: submissionError } = await supabaseClient
      .from('submissions')
      .insert({
        user_id: user.id,
        job_description: jobDescription,
        company_name: companyName,
        resume_url: resumeUrl,
        interviewers_list: interviewersList || [],
        email: user.email,
        status: 'pending'
      })
      .select()
      .single();

    if (submissionError) {
      throw submissionError;
    }

    // Start processing in the background
    EdgeRuntime.waitUntil(processSubmission(submission.submission_id));

    return new Response(
      JSON.stringify({
        message: 'Submission received',
        submissionId: submission.submission_id
      }),
      {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  } catch (error) {
    console.error('Error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Unknown error occurred',
      }),
      {
        status: 500,
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      }
    );
  }
});