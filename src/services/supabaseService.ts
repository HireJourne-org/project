import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL;
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error('Missing Supabase environment variables');
}

export const supabase = createClient(supabaseUrl, supabaseAnonKey, {
  auth: {
    persistSession: true,
    detectSessionInUrl: true,
    autoRefreshToken: true,
    flowType: 'pkce',
    storage: window.localStorage,
  },
  global: {
    headers: {
      'x-application-name': 'hirejourne',
    },
  },
  db: {
    schema: 'public',
  },
  realtime: {
    params: {
      eventsPerSecond: 10,
    },
  },
});

export const testSupabaseConnection = async () => {
  try {
    // Test auth connection
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('❌ Auth connection test failed:', sessionError.message);
      return false;
    }

    // Test database connection with error handling and retry
    const maxRetries = 3;
    let retries = 0;
    
    while (retries < maxRetries) {
      try {
        const { data, error: dbError } = await supabase
          .from('companies')
          .select('id')
          .limit(1)
          .maybeSingle();

        if (dbError) {
          throw dbError;
        }

        console.log('✅ Supabase connection successful');
        if (session?.user) {
          console.log('Current user:', session.user.id);
        }
        
        return true;
      } catch (dbError) {
        retries++;
        if (retries === maxRetries) {
          console.error('❌ Database connection failed after retries:', dbError);
          return false;
        }
        // Wait before retrying
        await new Promise(resolve => setTimeout(resolve, 1000 * retries));
      }
    }

    return false;
  } catch (error) {
    console.error('❌ Connection test failed:', error);
    return false;
  }
};

// Add auth state change handler
supabase.auth.onAuthStateChange((event, session) => {
  if (event === 'SIGNED_IN') {
    console.log('👤 User signed in:', session?.user?.id);
  } else if (event === 'SIGNED_OUT') {
    console.log('👋 User signed out');
  } else if (event === 'TOKEN_REFRESHED') {
    console.log('🔄 Auth token refreshed');
  } else if (event === 'USER_UPDATED') {
    console.log('👤 User profile updated');
  } else if (event === 'USER_DELETED') {
    console.log('❌ User account deleted');
  } else if (event === 'PASSWORD_RECOVERY') {
    console.log('🔑 Password recovery initiated');
  }
});

// Add the missing fetchQuestions function
export const fetchQuestions = async () => {
  const { data, error } = await supabase
    .from('questions')
    .select('*')
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data || [];
};

// Question management functions
export const addQuestion = async (questionData: any) => {
  const { data, error } = await supabase
    .from('questions')
    .insert([questionData])
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const updateQuestion = async (id: string, questionData: any) => {
  const { data, error } = await supabase
    .from('questions')
    .update(questionData)
    .eq('id', id)
    .select()
    .single();

  if (error) {
    throw error;
  }

  return data;
};

export const deleteQuestion = async (id: string): Promise<void> => {
  const { error } = await supabase
    .from('questions')
    .delete()
    .eq('id', id);

  if (error) {
    throw error;
  }
};