import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Mail, Lock, ArrowRight, Chrome } from 'lucide-react';
import { signIn, signUp, signInWithGoogle } from '../services/authService';
import { supabase } from '../services/supabaseService';
import toast from 'react-hot-toast';

interface AuthProps {
  onAuthSuccess: () => void;
}

const Auth: React.FC<AuthProps> = ({ onAuthSuccess }) => {
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  });
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const { data: authListener } = supabase.auth.onAuthStateChange((event, session) => {
      if (event === 'SIGNED_IN' && session) {
        toast.success('Successfully signed in!');
        onAuthSuccess();
      }
    });

    // Check for OAuth callback
    const params = new URLSearchParams(window.location.search);
    const error = params.get('error');
    const errorDescription = params.get('error_description');

    if (error) {
      toast.error(errorDescription || 'Authentication failed');
    }

    return () => {
      authListener.subscription.unsubscribe();
    };
  }, [onAuthSuccess]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!formData.email || !formData.password) {
        throw new Error('Please enter both email and password');
      }

      if (isLogin) {
        await signIn(formData.email, formData.password);
      } else {
        if (formData.password.length < 6) {
          throw new Error('Password must be at least 6 characters long');
        }
        await signUp(formData.email, formData.password);
        setError('Account created! Please check your email to verify your account before signing in.');
        setIsLogin(true); // Switch to login view after successful signup
      }
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Authentication failed';
      setError(errorMessage);
      console.error('Auth error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleGoogleSignIn = async () => {
    try {
      setLoading(true);
      setError(null);
      await signInWithGoogle();
    } catch (error) {
      console.error('Google sign in error:', error);
      setError('Failed to initialize Google sign in');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-md w-full"
      >
        <div className="flex flex-col items-center justify-center mb-8">
          <img src="/journe-logo.png" alt="Journe" className="h-12 mb-4" />
          <div className="text-2xl font-bold flex items-center">
            <span className="text-black">Hire</span>
            <div className="flex">
              <span className="text-[#164881] animate-[textColor_6s_ease-in-out_infinite]">J</span>
              <span className="text-[#CE2028] animate-[textColor_6s_ease-in-out_infinite_2s]">o</span>
              <span className="text-[#164881] animate-[textColor_6s_ease-in-out_infinite_4s]">u</span>
              <span className="text-[#CE2028] animate-[textColor_6s_ease-in-out_infinite]">r</span>
              <span className="text-[#DCAF35] animate-[textColor_6s_ease-in-out_infinite_2s]">n</span>
              <span className="text-[#164881] animate-[textColor_6s_ease-in-out_infinite_4s]">e</span>
            </div>
          </div>
        </div>

        <h2 className="text-3xl font-bold text-center mb-2">
          Welcome to Your Interview Playbook
        </h2>
        <p className="text-gray-600 text-center mb-8">
          {isLogin
            ? 'Sign in to access your personalized interview guides'
            : 'Create an account to start your interview preparation'}
        </p>

        {error && (
          <div className={`mb-6 p-4 rounded-lg text-sm ${error.includes('created') ? 'bg-green-50 text-green-800' : 'bg-red-50 text-red-800'}`}>
            {error}
          </div>
        )}

        <motion.button
          onClick={handleGoogleSignIn}
          disabled={loading}
          className="w-full bg-white border-2 border-gray-300 text-gray-700 font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 hover:bg-gray-50 transition-colors mb-6 disabled:opacity-50 disabled:cursor-not-allowed"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <Chrome className="h-5 w-5" />
          <span>Continue with Google</span>
        </motion.button>

        <div className="relative mb-6">
          <div className="absolute inset-0 flex items-center">
            <div className="w-full border-t border-gray-300"></div>
          </div>
          <div className="relative flex justify-center text-sm">
            <span className="px-2 bg-white text-gray-500">Or continue with email</span>
          </div>
        </div>

        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="relative">
            <Mail className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="email"
              name="email"
              value={formData.email}
              onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              placeholder="Email address"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#164881] focus:border-transparent"
            />
          </div>

          <div className="relative">
            <Lock className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
            <input
              type="password"
              name="password"
              value={formData.password}
              onChange={(e) => setFormData(prev => ({ ...prev, [e.target.name]: e.target.value }))}
              placeholder="Password"
              required
              className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-[#164881] focus:border-transparent"
            />
          </div>

          <motion.button
            type="submit"
            disabled={loading}
            className="w-full bg-[#164881] hover:bg-[#0D3B74] text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 transition-colors disabled:opacity-50"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            <span>{isLogin ? 'Sign In' : 'Sign Up'}</span>
            <ArrowRight className="h-5 w-5" />
          </motion.button>
        </form>

        <div className="mt-6 text-center">
          <button
            onClick={() => {
              setIsLogin(!isLogin);
              setError(null);
            }}
            className="text-[#164881] hover:text-[#0D3B74] font-medium"
          >
            {isLogin
              ? "Don't have an account? Sign Up"
              : 'Already have an account? Sign In'}
          </button>
        </div>
      </motion.div>
    </div>
  );
};

export default Auth;