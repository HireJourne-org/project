import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

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

    const { resume, jobDescription } = await req.json();
    if (!resume || !jobDescription) {
      throw new Error('Resume and job description are required');
    }

    // Send to OpenAI for analysis
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
            content: `You are an expert resume matcher. Analyze the resume and job description to:
              1. Find matching skills between the resume and job requirements
              2. Identify missing skills that are required but not in the resume
              3. Evaluate the relevance of each previous role to the job

              Return the analysis in this exact JSON format:
              {
                "matchedSkills": string[],
                "missingSkills": string[],
                "relevantExperience": Array<{
                  "role": string,
                  "relevance": number,
                  "matchingKeywords": string[]
                }>
              }

              Where:
              - relevance is a number from 0-100
              - matchingKeywords are terms found in both the role and job description
            `
          },
          {
            role: 'user',
            content: JSON.stringify({
              resume,
              jobDescription
            })
          }
        ],
        temperature: 0.1,
        max_tokens: 2000,
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(error.error?.message || 'Failed to analyze resume match');
    }

    const { choices } = await openaiResponse.json();
    const content = choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let analysis;
    try {
      analysis = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }

    return new Response(JSON.stringify(analysis), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Resume matching error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to match resume',
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