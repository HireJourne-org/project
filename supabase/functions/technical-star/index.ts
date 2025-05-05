import { serve } from "https://deno.land/std@0.168.0/http/server.ts";
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface ParsedResume {
  jobTitles: string[];
  companies: string[];
  skills: string[];
  industries: string[];
}

interface ParsedJobDescription {
  jobTitle: string;
  coreResponsibilities: string[];
  mustHaveSkills: string[];
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

    const { parsedResume, parsedJD } = await req.json();
    if (!parsedResume || !parsedJD) {
      throw new Error('Missing parsed resume or job description');
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
            content: `You are a technical interviewer.

            Based on the following candidate profile:
            - Previous Job Titles: ${parsedResume.jobTitles?.join(', ') || 'Unknown'}
            - Companies Worked For: ${parsedResume.companies?.join(', ') || 'Unknown'}
            - Skills: ${parsedResume.skills?.join(', ') || 'Unknown'}
            - Industries: ${parsedResume.industries?.join(', ') || 'Unknown'}

            And based on the following job description:
            - Role: ${parsedJD.jobTitle || 'Unknown'}
            - Core Responsibilities: ${parsedJD.coreResponsibilities?.join(', ') || 'Unknown'}
            - Must-Have Skills: ${parsedJD.mustHaveSkills?.join(', ') || 'Unknown'}

            Generate 15 technical interview questions with STAR-I format answers focusing on:
            1. Technical challenges and problem-solving
            2. System design and architecture decisions
            3. Performance optimization and scalability
            4. Code quality and best practices
            5. Technical leadership and mentoring

            Return a JSON array where each object has:
            {
              "question": "technical interview question",
              "star_i_answer": {
                "situation": "specific technical context",
                "task": "technical challenge to solve",
                "action": "technical approach and implementation",
                "result": "measurable technical outcomes",
                "impact_pivot": "how this experience applies to the new role"
              }
            }

            Focus on real-world technical scenarios and concrete implementation details.
            Keep each section concise but meaningful. Total answer length should not exceed 250 words.`
          }
        ],
        temperature: 0.3,
        max_tokens: 2000,
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(error.error?.message || 'Failed to generate technical STAR answers');
    }

    const { choices } = await openaiResponse.json();
    const content = choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let starAnswers;
    try {
      starAnswers = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }

    return new Response(JSON.stringify(starAnswers), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Technical STAR answer generation error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to generate technical STAR answers',
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