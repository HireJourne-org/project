import React, { useState, useEffect } from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { Loader } from 'lucide-react';
import { Toaster } from 'react-hot-toast';
import toast from 'react-hot-toast';

// Components
import Navbar from './components/Navbar';
import QuestionList from './components/QuestionList';
import QuestionDetail from './components/QuestionDetail';
import AddQuestion from './components/AddQuestion';
import Dashboard from './components/Dashboard';
import Onboarding from './components/Onboarding';
import Auth from './components/Auth';
import UserProfile from './components/UserProfile';
import SubmissionsDashboard from './components/SubmissionsDashboard';
import AdminDashboard from './components/AdminDashboard';
import Chat from './components/Chat';

// Services
import { fetchQuestions, testSupabaseConnection, supabase } from './services/supabaseService';
import { getCurrentUser } from './services/authService';

function App() {
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [onboardingComplete, setOnboardingComplete] = useState(false);
  const [user, setUser] = useState(null);
  const [authChecked, setAuthChecked] = useState(false);

  useEffect(() => {
    checkAuth();
    
    // Set up auth state listener
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setAuthChecked(true);
    });

    return () => {
      subscription.unsubscribe();
    };
  }, []);

  const checkAuth = async () => {
    try {
      const currentUser = await getCurrentUser();
      setUser(currentUser);
      
      if (currentUser) {
        const onboardingStatus = localStorage.getItem(`onboarding_${currentUser.id}`);
        setOnboardingComplete(!!onboardingStatus);
        
        const isConnected = await testSupabaseConnection();
        if (!isConnected) {
          toast.error('Failed to connect to database');
        }
      }
    } catch (err) {
      console.error('Auth check failed:', err);
      toast.error('Authentication check failed');
    } finally {
      setAuthChecked(true);
      setLoading(false);
    }
  };

  useEffect(() => {
    if (user) {
      getQuestions();
    }
  }, [user]);

  const getQuestions = async () => {
    try {
      setLoading(true);
      const data = await fetchQuestions();
      setQuestions(data);
      setError(null);
    } catch (err) {
      console.error('Error fetching questions:', err);
      setError('Failed to load questions. Please check your connection.');
      toast.error('Failed to load questions');
    } finally {
      setLoading(false);
    }
  };

  const handleOnboardingComplete = (data) => {
    if (user) {
      localStorage.setItem(`onboarding_${user.id}`, 'true');
      setOnboardingComplete(true);
    }
  };

  const handleAuthSuccess = async () => {
    await checkAuth();
  };

  if (!authChecked) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-10 h-10 text-primary animate-spin" />
      </div>
    );
  }

  if (!user) {
    return (
      <>
        <Auth onAuthSuccess={handleAuthSuccess} />
        <Toaster position="top-right" />
      </>
    );
  }

  if (!onboardingComplete) {
    return (
      <>
        <Onboarding onComplete={handleOnboardingComplete} />
        <Toaster position="top-right" />
      </>
    );
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Loader className="w-10 h-10 text-primary animate-spin" />
        <p className="ml-2 text-lg text-primary">Loading your interview prep data...</p>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="bg-white p-8 rounded-lg shadow-md max-w-md w-full">
          <h2 className="text-2xl font-bold text-red-600 mb-4">Error</h2>
          <p className="text-gray-700">{error}</p>
          <button 
            onClick={getQuestions}
            className="mt-4 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
          >
            Retry
          </button>
        </div>
      </div>
    );
  }

  return (
    <Router>
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <div className="container mx-auto px-4 py-8">
          <Routes>
            <Route path="/" element={<Dashboard questions={questions} />} />
            <Route path="/questions" element={<QuestionList questions={questions} />} />
            <Route path="/questions/:id" element={<QuestionDetail questions={questions} />} />
            <Route path="/add" element={<AddQuestion setQuestions={setQuestions} />} />
            <Route path="/profile" element={<UserProfile user={user} onUpdate={checkAuth} />} />
            <Route path="/submissions" element={<SubmissionsDashboard />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/chat" element={<Chat />} />
          </Routes>
        </div>
        <Toaster position="top-right" />
      </div>
    </Router>
  );
}

export default App;