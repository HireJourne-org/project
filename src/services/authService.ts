import { supabase } from './supabaseService';
import toast from 'react-hot-toast';

export const signUp = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      if (error.message.includes('already registered')) {
        throw new Error('This email is already registered. Please sign in instead.');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Sign up error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to sign up');
  }
};

export const signIn = async (email: string, password: string) => {
  try {
    const { data, error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    if (error) {
      if (error.message.includes('Email not confirmed')) {
        throw new Error('Please check your email and confirm your account before signing in. If you need a new confirmation email, please sign up again.');
      }
      if (error.message.includes('Invalid login credentials')) {
        throw new Error('Invalid email or password');
      }
      throw error;
    }

    return data;
  } catch (error) {
    console.error('Sign in error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to sign in');
  }
};

export const signInWithGoogle = async () => {
  try {
    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: 'google',
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
        queryParams: {
          access_type: 'offline',
          prompt: 'consent',
        },
      },
    });

    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Google sign in error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to sign in with Google');
  }
};

export const signOut = async () => {
  try {
    const { error } = await supabase.auth.signOut();
    if (error) throw error;
    
    // Clear any local storage data
    localStorage.removeItem('supabase.auth.token');
    localStorage.removeItem('supabase.auth.refreshToken');
  } catch (error) {
    console.error('Sign out error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to sign out');
  }
};

export const getCurrentUser = async () => {
  try {
    // First check if we have a session
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();
    
    if (sessionError) {
      console.error('Session error:', sessionError);
      return null;
    }
    
    if (!session) {
      return null;
    }
    
    // Then get the user data
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    
    if (userError) {
      console.error('Get user error:', userError);
      return null;
    }

    return user;
  } catch (error) {
    console.error('Get current user error:', error);
    toast.error('Authentication error. Please try again.');
    return null;
  }
};

export const updateProfile = async (updates: { email?: string }) => {
  try {
    const { data, error } = await supabase.auth.updateUser(updates);
    if (error) throw error;
    return data;
  } catch (error) {
    console.error('Update profile error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update profile');
  }
};

export const updatePassword = async (currentPassword: string, newPassword: string) => {
  try {
    // First verify the current password
    const { data: { user } } = await supabase.auth.getUser();
    if (!user?.email) throw new Error('No user found');

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: user.email,
      password: currentPassword,
    });

    if (signInError) {
      throw new Error('Current password is incorrect');
    }

    // Update to new password
    const { error } = await supabase.auth.updateUser({
      password: newPassword,
    });

    if (error) throw error;
  } catch (error) {
    console.error('Update password error:', error);
    throw new Error(error instanceof Error ? error.message : 'Failed to update password');
  }
};