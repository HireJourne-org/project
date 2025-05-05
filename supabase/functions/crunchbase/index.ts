import { serve } from 'https://deno.land/std@0.168.0/http/server.ts';
import { createClient } from 'npm:@supabase/supabase-js@2.39.7';

const CRUNCHBASE_API_KEY = Deno.env.get('CRUNCHBASE_API_KEY');
const CRUNCHBASE_API_URL = 'https://api.crunchbase.com/api/v4';

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Methods': 'GET, POST, OPTIONS',
  'Access-Control-Allow-Headers': 'Content-Type, Authorization',
};

interface CrunchbaseCompany {
  properties: {
    name: string;
    description: string;
    website_url?: string;
    linkedin_url?: string;
    founded_on?: string;
    num_employees_enum?: string;
    funding_total?: {
      value: number;
      currency: string;
    };
  };
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

    const url = new URL(req.url);
    const endpoint = url.pathname.split('/crunchbase')[1];

    if (!endpoint) {
      throw new Error('Missing endpoint');
    }

    if (!CRUNCHBASE_API_KEY) {
      throw new Error('Crunchbase API key not configured');
    }

    const crunchbaseUrl = `${CRUNCHBASE_API_URL}${endpoint}&user_key=${CRUNCHBASE_API_KEY}`;
    
    const response = await fetch(crunchbaseUrl);
    const data = await response.json();

    if (!response.ok) {
      throw new Error(`Crunchbase API error: ${data.message || response.statusText}`);
    }

    return new Response(JSON.stringify(data), {
      headers: {
        ...corsHeaders,
        'Content-Type': 'application/json',
      },
    });
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