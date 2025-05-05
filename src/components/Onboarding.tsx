import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ArrowRight, Upload, Link as LinkIcon, Users, CheckCircle, AlertCircle } from 'lucide-react';
import { generateGuide } from '../services/guideService';
import { supabase } from '../services/supabaseService';
import toast from 'react-hot-toast';

interface OnboardingProps {
  onComplete: (data: OnboardingData) => void;
}

interface OnboardingData {
  resume: File | null;
  jobDescription: string;
  interviewers: string[];
}

const Onboarding: React.FC<OnboardingProps> = ({ onComplete }) => {
  const [step, setStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [data, setData] = useState<OnboardingData>({
    resume: null,
    jobDescription: '',
    interviewers: [''],
  });

  const handleNext = async () => {
    if (step < 4) {
      setStep(step + 1);
    } else {
      try {
        setLoading(true);
        setError(null);

        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('Please log in to continue.');
        
        await generateGuide(data, user.id);
        toast.success('Interview guide generation started!');
        onComplete(data);
      } catch (error) {
        console.error('Guide generation failed:', error);
        const errorMessage = error instanceof Error ? error.message : 'Failed to generate guide';
        setError(errorMessage);
        toast.error(errorMessage);
      } finally {
        setLoading(false);
      }
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setData({ ...data, resume: file });
      toast.success('Resume uploaded successfully!');
    }
  };

  const handleInterviewerChange = (index: number, value: string) => {
    const newInterviewers = [...data.interviewers];
    newInterviewers[index] = value;
    setData({ ...data, interviewers: newInterviewers });
  };

  const addInterviewer = () => {
    setData({ ...data, interviewers: [...data.interviewers, ''] });
  };

  const slideVariants = {
    enter: (direction: number) => ({
      x: direction > 0 ? 1000 : -1000,
      opacity: 0
    }),
    center: {
      zIndex: 1,
      x: 0,
      opacity: 1
    },
    exit: (direction: number) => ({
      zIndex: 0,
      x: direction < 0 ? 1000 : -1000,
      opacity: 0
    })
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
          >
            <h1 className="text-5xl font-bold text-primary mb-8 leading-tight">
              Welcome to
              <br />
              <span className="text-secondary">HireJourne's Interview Playbook</span>
            </h1>
            <p className="text-xl text-gray-600 mb-12 max-w-2xl mx-auto">
              Let's prepare your personalized interview guide to help you succeed.
            </p>
            <motion.button
              onClick={handleNext}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-6 px-12 rounded-xl text-xl transition-colors flex items-center justify-center group"
              whileHover={{ scale: 1.05 }}
              whileTap={{ scale: 0.95 }}
            >
              Get Started
              <ArrowRight className="ml-2 h-6 w-6 group-hover:translate-x-2 transition-transform" />
            </motion.button>
          </motion.div>
        );

      case 2:
        return (
          <motion.div
            className="max-w-xl mx-auto w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-4xl font-bold text-primary mb-8">Upload Your Resume</h2>
            <motion.div
              className={`border-2 border-dashed rounded-xl p-12 text-center transition-colors ${
                data.resume ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary'
              }`}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <input
                type="file"
                accept=".pdf,.doc,.docx"
                onChange={handleFileChange}
                className="hidden"
                id="resume-upload"
              />
              <label
                htmlFor="resume-upload"
                className="cursor-pointer flex flex-col items-center"
              >
                {data.resume ? (
                  <CheckCircle className="h-16 w-16 text-green-500 mb-4" />
                ) : (
                  <Upload className="h-16 w-16 text-gray-400 mb-4" />
                )}
                <p className="text-xl text-gray-600 mb-3">
                  {data.resume ? data.resume.name : 'Drop your resume here or click to browse'}
                </p>
                <p className="text-sm text-gray-500">
                  Supported formats: PDF, DOC, DOCX
                </p>
              </label>
            </motion.div>
          </motion.div>
        );

      case 3:
        return (
          <motion.div
            className="max-w-xl mx-auto w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-4xl font-bold text-primary mb-8">Job Description</h2>
            <div className="space-y-6">
              <motion.div
                className="relative"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <textarea
                  value={data.jobDescription}
                  onChange={(e) => setData({ ...data, jobDescription: e.target.value })}
                  placeholder="Paste the job description here..."
                  className="w-full h-64 p-6 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                />
              </motion.div>
              <div className="flex items-center justify-center text-gray-600 bg-gray-50 p-4 rounded-xl">
                <LinkIcon className="h-6 w-6 mr-3 text-secondary" />
                <span className="text-lg">Or paste the job posting URL</span>
              </div>
            </div>
          </motion.div>
        );

      case 4:
        return (
          <motion.div
            className="max-w-xl mx-auto w-full"
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
          >
            <h2 className="text-4xl font-bold text-primary mb-8">Your Interviewers</h2>
            <div className="space-y-4">
              <AnimatePresence>
                {data.interviewers.map((interviewer, index) => (
                  <motion.div
                    key={index}
                    className="flex items-center space-x-3"
                    initial={{ opacity: 0, x: -20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: 20 }}
                    transition={{ delay: index * 0.1 }}
                  >
                    <Users className="h-6 w-6 text-secondary" />
                    <input
                      type="text"
                      value={interviewer}
                      onChange={(e) => handleInterviewerChange(index, e.target.value)}
                      placeholder="LinkedIn URL of interviewer"
                      className="flex-1 p-4 border rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent text-lg"
                    />
                  </motion.div>
                ))}
              </AnimatePresence>
              <motion.button
                onClick={addInterviewer}
                className="text-primary hover:text-primary-dark font-medium text-lg flex items-center"
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
              >
                + Add another interviewer
              </motion.button>
            </div>
          </motion.div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        className="bg-white p-8 rounded-2xl shadow-xl max-w-4xl w-full"
      >
        <AnimatePresence mode="wait">
          <motion.div
            key={step}
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
          >
            {renderStep()}
          </motion.div>
        </AnimatePresence>

        {error && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            className="mt-4 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3"
          >
            <AlertCircle className="h-5 w-5 text-red-500 flex-shrink-0 mt-0.5" />
            <div>
              <p className="text-red-700 font-medium">Error</p>
              <p className="text-red-600 text-sm mt-1">{error}</p>
              <button
                onClick={() => window.location.reload()}
                className="text-red-700 text-sm font-medium mt-2 hover:text-red-800"
              >
                Try Again
              </button>
            </div>
          </motion.div>
        )}

        {step > 1 && (
          <motion.div
            className="mt-8 flex justify-between items-center"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
          >
            <button
              onClick={() => setStep(step - 1)}
              className="text-gray-600 hover:text-gray-800 font-medium"
            >
              ← Back
            </button>
            <motion.button
              onClick={handleNext}
              disabled={loading || (step === 2 && !data.resume)}
              className="bg-primary hover:bg-primary-dark text-white font-bold py-3 px-6 rounded-xl flex items-center space-x-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              <span>{step === 4 ? (loading ? 'Generating...' : 'Generate Guide') : 'Continue'}</span>
              <ArrowRight className="h-5 w-5" />
            </motion.button>
          </motion.div>
        )}

        <div className="mt-6 flex justify-center space-x-2">
          {[1, 2, 3, 4].map((i) => (
            <motion.div
              key={i}
              className={`h-2 w-2 rounded-full ${
                i === step ? 'bg-primary' : 'bg-gray-300'
              }`}
              animate={{
                scale: i === step ? 1.2 : 1,
              }}
            />
          ))}
        </div>
      </motion.div>
    </div>
  );
};

export default Onboarding;