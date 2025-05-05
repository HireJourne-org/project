import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ParsedResume {
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

    // Get resume URL from request
    const { resumeUrl } = await req.json();
    if (!resumeUrl) {
      throw new Error('Resume URL is required');
    }

    // Download the resume file
    const response = await fetch(resumeUrl);
    if (!response.ok) {
      console.error(`Failed to download resume: ${response.status} ${response.statusText}`);
      throw new Error(`Failed to download resume: ${response.status} ${response.statusText}`);
    }

    // Check content type
    const contentType = response.headers.get('content-type');
    const validContentTypes = ['application/pdf', 'application/msword', 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', 'text/plain'];
    
    if (contentType && !validContentTypes.some(type => contentType.includes(type))) {
      console.error(`Invalid content type: ${contentType}`);
      throw new Error(`Invalid resume format. Expected PDF or Word document, but got ${contentType}`);
    }

    let text;
    try {
      text = await response.text();
    } catch (error) {
      console.error('Error extracting text from resume:', error);
      throw new Error('Failed to extract text from resume file');
    }

    // Send to OpenAI for parsing
    const openaiResponse = await fetch('https://api.openai.com/v1/chat/completions', {
      method: 'POST',
      headers: {
        'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        model: 'gpt-4',
        messages: [
          {
            role: 'system',
            content: `You are an expert resume parser. Extract the following information from the resume text:
              - Full Name (if found)
              - Email Address (if found)
              - Phone Number (if found)
              - List of Previous Job Titles (chronological)
              - List of Companies Worked For
              - List of Skills Mentioned (both technical and soft skills)
              - Education Details (degrees, institutions, years)
              - Industries Worked In

              Return the data in a clean JSON format with these exact keys:
              {
                "fullName": string | null,
                "email": string | null,
                "phone": string | null,
                "jobTitles": string[],
                "companies": string[],
                "skills": string[],
                "education": Array<{ degree: string, institution: string, year?: string }>,
                "industries": string[]
              }
            `
          },
          {
            role: 'user',
            content: text
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(error.error?.message || 'Failed to parse resume');
    }

    const { choices } = await openaiResponse.json();
    const content = choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let parsedData: ParsedResume;
    try {
      parsedData = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }

    return new Response(JSON.stringify(parsedData), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Resume parsing error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to parse resume',
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