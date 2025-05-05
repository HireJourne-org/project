import { supabase } from './supabaseService';

export const testConnection = async () => {
  try {
    // Try to get the current user as a basic connection test
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Auth connection error:', userError.message);
      return false;
    }

    // Try to query the submissions table
    const { data, error } = await supabase
      .from('submissions')
      .select('*')
      .limit(1);

    if (error) {
      console.error('Database connection error:', error.message);
      return false;
    }

    console.log('Supabase connection successful');
    console.log('Current user:', user?.id);
    console.log('Test query result:', data);
    
    return true;
  } catch (error) {
    console.error('Connection test failed:', error);
    return false;
  }
};