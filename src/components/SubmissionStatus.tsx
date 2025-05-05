import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, CheckCircle, XCircle } from 'lucide-react';
import { supabase } from '../services/supabaseService';

interface SubmissionStatusProps {
  submissionId: string;
  onComplete: (reportUrl: string) => void;
}

const SubmissionStatus: React.FC<SubmissionStatusProps> = ({ submissionId, onComplete }) => {
  const [status, setStatus] = useState<string>('pending');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    const checkStatus = async () => {
      try {
        const { data, error } = await supabase
          .from('submissions')
          .select('status, report_link')
          .eq('submission_id', submissionId)
          .single();

        if (error) throw error;

        setStatus(data.status);

        if (data.status === 'complete' && data.report_link) {
          onComplete(data.report_link);
        } else if (data.status === 'failed') {
          setError('Failed to generate report. Please try again.');
        }
      } catch (err) {
        console.error('Error checking submission status:', err);
        setError('Failed to check submission status');
      }
    };

    const interval = setInterval(checkStatus, 5000);
    checkStatus();

    return () => clearInterval(interval);
  }, [submissionId, onComplete]);

  const statusConfig = {
    pending: {
      icon: <Loader className="animate-spin h-8 w-8 text-primary" />,
      text: 'Initializing submission...',
      color: 'text-primary',
    },
    processing: {
      icon: <Loader className="animate-spin h-8 w-8 text-primary" />,
      text: 'Generating your interview preparation report...',
      color: 'text-primary',
    },
    complete: {
      icon: <CheckCircle className="h-8 w-8 text-green-500" />,
      text: 'Report generated successfully!',
      color: 'text-green-500',
    },
    failed: {
      icon: <XCircle className="h-8 w-8 text-red-500" />,
      text: error || 'Failed to generate report',
      color: 'text-red-500',
    },
  };

  const currentStatus = statusConfig[status as keyof typeof statusConfig];

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      className="text-center py-12"
    >
      {currentStatus.icon}
      <p className={`mt-4 text-lg font-medium ${currentStatus.color}`}>
        {currentStatus.text}
      </p>
    </motion.div>
  );
};

export default SubmissionStatus;