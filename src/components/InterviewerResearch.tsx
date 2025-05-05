import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Search, Loader, User, Building, FileText } from 'lucide-react';
import { researchInterviewer, InterviewerProfile } from '../services/interviewerService';
import toast from 'react-hot-toast';

interface Props {
  onComplete?: (profile: InterviewerProfile) => void;
}

const InterviewerResearch: React.FC<Props> = ({ onComplete }) => {
  const [loading, setLoading] = useState(false);
  const [profile, setProfile] = useState<InterviewerProfile | null>(null);
  const [input, setInput] = useState({
    linkedin_url: '',
    name: '',
    company: ''
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (loading) return;

    if (!input.linkedin_url && !input.name) {
      toast.error('Please provide either a LinkedIn URL or name');
      return;
    }

    try {
      setLoading(true);
      const data = await researchInterviewer(input);
      setProfile(data);
      if (onComplete) {
        onComplete(data);
      }
    } catch (error) {
      console.error('Research failed:', error);
      toast.error('Failed to research interviewer');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Research Interviewer</h2>
        <p className="text-gray-600 mt-1">Get insights about your interviewer</p>
      </div>

      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            LinkedIn URL
          </label>
          <div className="relative">
            <input
              type="url"
              value={input.linkedin_url}
              onChange={(e) => setInput({ ...input, linkedin_url: e.target.value })}
              placeholder="https://linkedin.com/in/username"
              className="w-full pl-10 pr-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            <User className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
          </div>
        </div>

        <div className="text-center text-gray-500">or</div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Name
            </label>
            <input
              type="text"
              value={input.name}
              onChange={(e) => setInput({ ...input, name: e.target.value })}
              placeholder="John Doe"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Company
            </label>
            <input
              type="text"
              value={input.company}
              onChange={(e) => setInput({ ...input, company: e.target.value })}
              placeholder="Company Name"
              className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
          </div>
        </div>

        <motion.button
          type="submit"
          disabled={loading || (!input.linkedin_url && !input.name)}
          className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <Loader className="animate-spin h-5 w-5" />
              <span>Researching...</span>
            </>
          ) : (
            <>
              <Search className="h-5 w-5" />
              <span>Research Interviewer</span>
            </>
          )}
        </motion.button>
      </form>

      {profile && (
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          className="bg-white p-6 rounded-xl shadow-sm space-y-4"
        >
          <div className="flex items-center space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <User className="h-6 w-6 text-primary" />
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800">{profile.name}</h3>
              <p className="text-gray-600">{profile.title}</p>
            </div>
          </div>

          <div className="flex items-center space-x-2 text-gray-600">
            <Building className="h-5 w-5" />
            <span>{profile.current_company}</span>
          </div>

          {profile.linkedin_url && (
            <a
              href={profile.linkedin_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark flex items-center space-x-1"
            >
              View LinkedIn Profile →
            </a>
          )}

          <div className="border-t pt-4 mt-4">
            <div className="flex items-center space-x-2 mb-2">
              <FileText className="h-5 w-5 text-primary" />
              <h4 className="font-medium text-gray-800">Interview Strategy Notes</h4>
            </div>
            <p className="text-gray-600 whitespace-pre-wrap">{profile.assessment_notes}</p>
          </div>
        </motion.div>
      )}
    </div>
  );
};

export default InterviewerResearch;