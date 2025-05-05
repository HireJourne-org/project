import React, { useState, useCallback } from 'react';
import { motion } from 'framer-motion';
import { Upload, Send, Plus, Trash, Loader } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import toast from 'react-hot-toast';

interface InterviewPrepFormProps {
  onSubmit: (submissionId: string) => void;
}

interface Interviewer {
  name?: string;
  linkedin_url: string;
}

const InterviewPrepForm: React.FC<InterviewPrepFormProps> = ({ onSubmit }) => {
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState({
    companyName: '',
    jobDescription: '',
    interviewers: [{ linkedin_url: '' }] as Interviewer[],
    resumeFile: null as File | null,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      let resumeUrl = null;

      // Upload resume if provided
      if (formData.resumeFile) {
        // Get current user
        const { data: { user } } = await supabase.auth.getUser();
        if (!user) throw new Error('User not authenticated');
        
        // Generate proper filename with UUID
        const fileExt = formData.resumeFile.name.split('.').pop();
        const fileName = `${user.id}/${crypto.randomUUID()}.${fileExt}`;
        
        const { data: uploadData, error: uploadError } = await supabase.storage
          .from('resumes')
          .upload(fileName, formData.resumeFile);

        if (uploadError) throw uploadError;

        const { data: { publicUrl } } = supabase.storage
          .from('resumes')
          .getPublicUrl(fileName);
          
        resumeUrl = publicUrl;
      }

      // Submit to edge function
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/submit-interview-prep`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          companyName: formData.companyName,
          jobDescription: formData.jobDescription,
          interviewersList: formData.interviewers,
          resumeUrl,
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.message || 'Submission failed');
      }

      const { submissionId } = await response.json();
      toast.success('Submission received! Generating your report...');
      onSubmit(submissionId);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Submission failed');
      console.error('Submission error:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      const file = e.target.files[0];
      if (file.size > 5 * 1024 * 1024) {
        toast.error('File size must be less than 5MB');
        return;
      }
      setFormData({ ...formData, resumeFile: file });
    }
  };

  const addInterviewer = () => {
    setFormData({
      ...formData,
      interviewers: [...formData.interviewers, { linkedin_url: '' }],
    });
  };

  const removeInterviewer = (index: number) => {
    const newInterviewers = formData.interviewers.filter((_, i) => i !== index);
    setFormData({ ...formData, interviewers: newInterviewers });
  };

  const updateInterviewer = (index: number, field: keyof Interviewer, value: string) => {
    const newInterviewers = [...formData.interviewers];
    newInterviewers[index] = { ...newInterviewers[index], [field]: value };
    setFormData({ ...formData, interviewers: newInterviewers });
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Company Name
        </label>
        <input
          type="text"
          value={formData.companyName}
          onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
          required
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Enter company name"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Job Description
        </label>
        <textarea
          value={formData.jobDescription}
          onChange={(e) => setFormData({ ...formData, jobDescription: e.target.value })}
          required
          rows={8}
          className="w-full px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
          placeholder="Paste the full job description here"
        />
      </div>

      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">
          Resume (Optional)
        </label>
        <div
          className={`border-2 border-dashed rounded-xl p-6 text-center transition-colors ${
            formData.resumeFile ? 'border-green-500 bg-green-50' : 'border-gray-300 hover:border-primary'
          }`}
        >
          <input
            type="file"
            onChange={handleFileChange}
            accept=".pdf,.doc,.docx"
            className="hidden"
            id="resume-upload"
          />
          <label
            htmlFor="resume-upload"
            className="cursor-pointer flex flex-col items-center"
          >
            <Upload className="h-12 w-12 text-gray-400 mb-3" />
            <p className="text-sm text-gray-600">
              {formData.resumeFile
                ? formData.resumeFile.name
                : 'Click to upload or drag and drop'}
            </p>
            <p className="text-xs text-gray-500 mt-1">PDF, DOC up to 5MB</p>
          </label>
        </div>
      </div>

      <div className="space-y-4">
        <div className="flex justify-between items-center">
          <label className="block text-sm font-medium text-gray-700">
            Interviewers (Optional)
          </label>
          <button
            type="button"
            onClick={addInterviewer}
            className="text-primary hover:text-primary-dark flex items-center text-sm"
          >
            <Plus className="h-4 w-4 mr-1" />
            Add Interviewer
          </button>
        </div>

        {formData.interviewers.map((interviewer, index) => (
          <div key={index} className="flex items-center space-x-2">
            <input
              type="text"
              value={interviewer.linkedin_url}
              onChange={(e) => updateInterviewer(index, 'linkedin_url', e.target.value)}
              placeholder="LinkedIn URL"
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
            />
            {index > 0 && (
              <button
                type="button"
                onClick={() => removeInterviewer(index)}
                className="text-red-500 hover:text-red-700"
              >
                <Trash className="h-5 w-5" />
              </button>
            )}
          </div>
        ))}
      </div>

      <motion.button
        type="submit"
        disabled={loading}
        className="w-full bg-primary hover:bg-primary-dark text-white font-semibold py-3 rounded-xl flex items-center justify-center space-x-2 disabled:opacity-50"
        whileHover={{ scale: 1.02 }}
        whileTap={{ scale: 0.98 }}
      >
        {loading ? (
          <>
            <Loader className="animate-spin h-5 w-5" />
            <span>Processing...</span>
          </>
        ) : (
          <>
            <Send className="h-5 w-5" />
            <span>Submit</span>
          </>
        )}
      </motion.button>
    </form>
  );
};

export default InterviewPrepForm;