import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { FileText, Building, Clock, CheckCircle, XCircle, Search, Filter } from 'lucide-react';
import { getSubmissions } from '../services/submissionService';
import SubmissionForm from './SubmissionForm';
import toast from 'react-hot-toast';

const SubmissionsDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const data = await getSubmissions();
      setSubmissions(data);
    } catch (error) {
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const filteredSubmissions = submissions.filter(sub => {
    const matchesSearch = 
      sub.company_name.toLowerCase().includes(searchTerm.toLowerCase()) ||
      sub.job_description.toLowerCase().includes(searchTerm.toLowerCase());
    
    const matchesStatus = 
      statusFilter === 'all' ||
      (statusFilter === 'completed' && sub.reports?.[0]?.report_pdf_url) ||
      (statusFilter === 'pending' && !sub.reports?.[0]?.report_pdf_url);
    
    return matchesSearch && matchesStatus;
  });

  const handleSubmissionComplete = () => {
    setShowForm(false);
    fetchSubmissions();
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold text-gray-800">Interview Submissions</h1>
          <p className="text-gray-600 mt-1">Track and manage your interview preparations</p>
        </div>
        
        <motion.button
          onClick={() => setShowForm(!showForm)}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          <FileText className="h-5 w-5" />
          <span>New Submission</span>
        </motion.button>
      </div>

      <AnimatePresence mode="wait">
        {showForm ? (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="bg-white p-6 rounded-2xl shadow-lg"
          >
            <SubmissionForm onSubmit={handleSubmissionComplete} />
          </motion.div>
        ) : (
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-grow relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <input
                  type="text"
                  placeholder="Search submissions..."
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
                />
              </div>
              
              <div className="relative">
                <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-gray-400" />
                <select
                  value={statusFilter}
                  onChange={(e) => setStatusFilter(e.target.value)}
                  className="pl-10 pr-8 py-3 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent appearance-none bg-white"
                >
                  <option value="all">All Status</option>
                  <option value="completed">Completed</option>
                  <option value="pending">Pending</option>
                </select>
              </div>
            </div>

            <div className="grid gap-4">
              {loading ? (
                <div className="text-center py-12">
                  <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
                  <p className="mt-4 text-gray-600">Loading submissions...</p>
                </div>
              ) : filteredSubmissions.length === 0 ? (
                <div className="text-center py-12 bg-white rounded-2xl shadow">
                  <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                  <h3 className="text-lg font-semibold text-gray-800">No submissions found</h3>
                  <p className="text-gray-600 mt-1">Start by creating a new submission</p>
                </div>
              ) : (
                filteredSubmissions.map((submission) => (
                  <motion.div
                    key={submission.submission_id}
                    layoutId={submission.submission_id}
                    className="bg-white p-6 rounded-2xl shadow hover:shadow-lg transition-shadow"
                  >
                    <div className="flex justify-between items-start">
                      <div className="flex items-start space-x-4">
                        <div className="bg-primary/10 p-3 rounded-xl">
                          <Building className="h-6 w-6 text-primary" />
                        </div>
                        <div>
                          <h3 className="text-lg font-semibold text-gray-800">
                            {submission.company_name}
                          </h3>
                          <p className="text-gray-600 mt-1 line-clamp-2">
                            {submission.job_description}
                          </p>
                        </div>
                      </div>
                      
                      <StatusBadge
                        hasReport={!!submission.reports?.[0]?.report_pdf_url}
                      />
                    </div>
                    
                    <div className="mt-4 flex items-center justify-between text-sm text-gray-500">
                      <div className="flex items-center">
                        <Clock className="h-4 w-4 mr-1" />
                        <span>
                          Submitted {new Date(submission.created_at).toLocaleDateString()}
                        </span>
                      </div>
                      
                      {submission.reports?.[0]?.report_pdf_url && (
                        <a
                          href={submission.reports[0].report_pdf_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-primary hover:text-primary-dark font-medium"
                        >
                          View Report →
                        </a>
                      )}
                    </div>
                  </motion.div>
                ))
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

const StatusBadge: React.FC<{ hasReport: boolean }> = ({ hasReport }) => {
  return hasReport ? (
    <div className="flex items-center space-x-1 bg-green-100 text-green-800 px-3 py-1 rounded-full text-sm font-medium">
      <CheckCircle className="h-4 w-4" />
      <span>Completed</span>
    </div>
  ) : (
    <div className="flex items-center space-x-1 bg-yellow-100 text-yellow-800 px-3 py-1 rounded-full text-sm font-medium">
      <Clock className="h-4 w-4" />
      <span>Processing</span>
    </div>
  );
};

export default SubmissionsDashboard;