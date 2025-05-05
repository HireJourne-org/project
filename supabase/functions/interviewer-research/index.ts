import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface InterviewerInput {
  linkedin_url?: string;
  name?: string;
  company?: string;
}

async function generateInterviewerAssessment(profile: any): Promise<string> {
  const prompt = `
    You are preparing a candidate for an interview.

    Based on the following LinkedIn profile information:
    - Full Name: ${profile.full_name || 'Unknown'}
    - Title: ${profile.current_title || 'Unknown'}
    - Company: ${profile.current_company || 'Unknown'}
    - Work History: ${profile.experience_summary || 'Not available'}
    - Education: ${profile.education_summary || 'Not available'}
    - Skills: ${profile.skills ? profile.skills.join(', ') : 'Unknown'}

    Write 3–5 sentences summarizing what the candidate should know about this interviewer:
    - Their likely technical focus
    - Their career background
    - Any visible patterns from their career that may influence interview questions
    - Tone: friendly, analytical
  `;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [{ role: 'user', content: prompt }],
      temperature: 0.3,
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to generate assessment');
  }

  const { choices } = await response.json();
  return choices[0]?.message?.content || '';
}

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

    const interviewer: InterviewerInput = await req.json();
    
    if (!interviewer.linkedin_url && !interviewer.name) {
      throw new Error('Either LinkedIn URL or name is required');
    }

    // Build the lookup URL
    let lookupUrl = '';
    const proxycurlKey = Deno.env.get('PROXYCURL_API_KEY');

    if (!proxycurlKey) {
      throw new Error('Proxycurl API key not configured');
    }

    if (interviewer.linkedin_url) {
      lookupUrl = `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(interviewer.linkedin_url)}`;
    } else if (interviewer.name) {
      // If you only have name/company, fallback to search
      lookupUrl = `https://nubela.co/proxycurl/api/search/person?name=${encodeURIComponent(interviewer.name)}${interviewer.company ? `&company=${encodeURIComponent(interviewer.company)}` : ''}`;
    }

    // Fetch LinkedIn profile data
    const response = await fetch(lookupUrl, {
      headers: {
        'Authorization': `Bearer ${proxycurlKey}`
      }
    });

    if (!response.ok) {
      throw new Error(`Proxycurl API error: ${response.status}`);
    }

    const profile = await response.json();

    if (!profile || profile.error) {
      throw new Error('No profile data found');
    }

    // Generate assessment
    const assessment = await generateInterviewerAssessment(profile);

    // Prepare the response
    const interviewerProfile = {
      name: profile.full_name || interviewer.name || '',
      title: profile.occupation || profile.current_title || '',
      current_company: profile.current_company || interviewer.company || '',
      linkedin_url: interviewer.linkedin_url || profile.profile_url || '',
      assessment_notes: assessment
    };

    return new Response(JSON.stringify(interviewerProfile), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Interviewer research error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to research interviewer',
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