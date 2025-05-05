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

    // Get domain from request
    const { domain } = await req.json();
    if (!domain) {
      throw new Error('Domain is required');
    }

    // First, try to get cached data from Supabase
    const { data: cachedData } = await supabaseClient
      .from('tech_stack')
      .select('*')
      .eq('domain', domain)
      .maybeSingle();

    if (cachedData) {
      return new Response(JSON.stringify(cachedData.technologies), {
        headers: {
          ...corsHeaders,
          'Content-Type': 'application/json',
        },
      });
    }

    // If no cached data, analyze with OpenAI
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
            content: `You are a technology stack analyst. Based on the domain ${domain}, provide a list of technologies likely used by the company.

            Group technologies into categories like:
            - Frontend
            - Backend
            - Database
            - DevOps
            - Analytics
            - Security
            
            Return a JSON array of objects with:
            - name: technology name
            - category: one of the above categories
            - description: brief description of how it's likely used
            
            Focus on major technologies and frameworks, not minor libraries.`
          },
          {
            role: 'user',
            content: domain
          }
        ],
        temperature: 0.2,
        max_tokens: 1000,
      })
    });

    if (!openaiResponse.ok) {
      const error = await openaiResponse.json();
      throw new Error(error.error?.message || 'Failed to analyze tech stack');
    }

    const { choices } = await openaiResponse.json();
    const content = choices[0]?.message?.content;

    if (!content) {
      throw new Error('No response from OpenAI');
    }

    let techStack;
    try {
      techStack = JSON.parse(content);
    } catch (error) {
      console.error('Failed to parse OpenAI response:', error);
      throw new Error('Invalid response format from OpenAI');
    }

    // Cache the results in Supabase
    await supabaseClient
      .from('tech_stack')
      .insert({
        domain,
        technologies: techStack,
        last_updated: new Date().toISOString()
      });

    return new Response(JSON.stringify(techStack), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });

  } catch (error) {
    console.error('Tech stack analysis error:', error);
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : 'Failed to analyze tech stack',
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