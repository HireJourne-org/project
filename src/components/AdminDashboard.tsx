import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, RefreshCw, AlertCircle, CheckCircle, Clock, XCircle, Database } from 'lucide-react';
import { supabase } from '../services/supabaseService';
import { processSubmission } from '../services/submissionProcessor';
import { runTestSubmissionFlow } from '../services/testSubmissionProcessor';
import { testStorageService, verifyStorageSetup } from '../services/testStorageService';
import { migrateStorageFiles, syncStorageReferences } from '../services/storageService';
import toast from 'react-hot-toast';

interface Submission {
  submission_id: string;
  company_name: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  created_at: string;
  error_message?: string;
  report_link?: string;
}

const AdminDashboard: React.FC = () => {
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState<string[]>([]);
  const [testRunning, setTestRunning] = useState(false);
  const [migrationLoading, setMigrationLoading] = useState(false);
  const [migrationStats, setMigrationStats] = useState<{
    success?: boolean;
    migratedFiles?: number;
    errors?: number;
  }>({});
  const [syncLoading, setSyncLoading] = useState(false);
  const [syncStats, setSyncStats] = useState<{
    success?: boolean;
    fixed?: number;
    total?: number;
  }>({});

  useEffect(() => {
    fetchSubmissions();
  }, []);

  const fetchSubmissions = async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('submissions')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setSubmissions(data || []);
    } catch (error) {
      console.error('Error fetching submissions:', error);
      toast.error('Failed to load submissions');
    } finally {
      setLoading(false);
    }
  };

  const handleReprocess = async (submissionId: string) => {
    try {
      setProcessing(prev => [...prev, submissionId]);
      
      // Update status to pending
      await supabase
        .from('submissions')
        .update({ status: 'pending', error_message: null })
        .eq('submission_id', submissionId);

      // Start processing
      await processSubmission(submissionId);
      
      toast.success('Reprocessing started');
      await fetchSubmissions();
    } catch (error) {
      console.error('Error reprocessing:', error);
      toast.error('Failed to reprocess submission');
    } finally {
      setProcessing(prev => prev.filter(id => id !== submissionId));
    }
  };

  const handleRunTest = async () => {
    try {
      setTestRunning(true);
      await runTestSubmissionFlow();
      await fetchSubmissions();
    } catch (error) {
      console.error('Test run failed:', error);
      toast.error('Test run failed');
    } finally {
      setTestRunning(false);
    }
  };

  const handleStorageMigration = async () => {
    setMigrationLoading(true);
    try {
      const result = await migrateStorageFiles();
      setMigrationStats(result);
      
      if (result.success) {
        toast.success(`Migration completed: ${result.migratedFiles} files migrated with ${result.errors} errors`);
      } else {
        toast.error('Migration failed');
      }
    } catch (error) {
      toast.error('Migration failed');
      console.error('Migration error:', error);
    } finally {
      setMigrationLoading(false);
    }
  };

  const handleStorageTest = async () => {
    try {
      const isValid = await verifyStorageSetup();
      if (!isValid) {
        toast.error('Storage setup verification failed');
        return;
      }
      await testStorageService();
    } catch (error) {
      toast.error('Storage test failed');
    }
  };

  const handleSyncStorageReferences = async () => {
    setSyncLoading(true);
    try {
      const result = await syncStorageReferences();
      setSyncStats(result);
      
      if (result.success) {
        toast.success(`Sync completed: Fixed ${result.fixed} of ${result.total} references`);
      } else {
        toast.error('Sync failed');
      }
    } catch (error) {
      toast.error('Sync failed');
      console.error('Sync error:', error);
    } finally {
      setSyncLoading(false);
    }
  };

  const StatusBadge: React.FC<{ status: string }> = ({ status }) => {
    const config = {
      pending: {
        icon: <Clock className="h-4 w-4" />,
        color: 'bg-yellow-100 text-yellow-800',
        text: 'Pending'
      },
      processing: {
        icon: <Loader className="h-4 w-4 animate-spin" />,
        color: 'bg-blue-100 text-blue-800',
        text: 'Processing'
      },
      complete: {
        icon: <CheckCircle className="h-4 w-4" />,
        color: 'bg-green-100 text-green-800',
        text: 'Complete'
      },
      failed: {
        icon: <XCircle className="h-4 w-4" />,
        color: 'bg-red-100 text-red-800',
        text: 'Failed'
      }
    };

    const { icon, color, text } = config[status as keyof typeof config] || config.pending;

    return (
      <span className={`flex items-center space-x-1 px-2 py-1 rounded-full text-sm ${color}`}>
        {icon}
        <span>{text}</span>
      </span>
    );
  };

  return (
    <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
      <div className="bg-white rounded-xl shadow-sm overflow-hidden">
        <div className="p-6 border-b border-gray-200">
          <div className="flex justify-between items-center">
            <h1 className="text-2xl font-bold text-gray-900">
              Submissions Dashboard
            </h1>
            <div className="flex items-center space-x-4">
              <motion.button
                onClick={handleStorageTest}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <Database className="h-4 w-4 mr-2" />
                Test Storage
              </motion.button>
              <motion.button
                onClick={handleRunTest}
                disabled={testRunning}
                className="flex items-center px-4 py-2 bg-secondary text-white rounded-lg hover:bg-secondary-dark transition-colors disabled:opacity-50"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                {testRunning ? (
                  <Loader className="h-4 w-4 animate-spin mr-2" />
                ) : (
                  <RefreshCw className="h-4 w-4 mr-2" />
                )}
                Run Test
              </motion.button>
              <motion.button
                onClick={() => fetchSubmissions()}
                className="flex items-center px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
                whileHover={{ scale: 1.02 }}
                whileTap={{ scale: 0.98 }}
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </motion.button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow p-6 mb-6">
          <h2 className="text-xl font-semibold mb-4">Storage Management</h2>
          
          <div className="space-y-4">
            <div className="flex flex-col">
              <h3 className="font-medium">Storage Test</h3>
              <p className="text-sm text-gray-500 mb-2">Verify storage functionality</p>
              <button
                onClick={handleStorageTest}
                className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 transition-colors"
                disabled={loading}
              >
                {loading ? 'Testing...' : 'Test Storage'}
              </button>
            </div>
            
            <div className="flex flex-col">
              <h3 className="font-medium">Storage Migration</h3>
              <p className="text-sm text-gray-500 mb-2">Migrate files to user-specific folders</p>
              <button
                onClick={handleStorageMigration}
                className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 transition-colors"
                disabled={migrationLoading}
              >
                {migrationLoading ? 'Migrating...' : 'Migrate Files'}
              </button>
              
              {migrationStats.success !== undefined && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p>
                    <span className="font-medium">Status:</span> 
                    {migrationStats.success ? (
                      <span className="text-green-600 ml-1">Success</span>
                    ) : (
                      <span className="text-red-600 ml-1">Failed</span>
                    )}
                  </p>
                  {migrationStats.migratedFiles !== undefined && (
                    <p>
                      <span className="font-medium">Files migrated:</span> 
                      <span className="ml-1">{migrationStats.migratedFiles}</span>
                    </p>
                  )}
                  {migrationStats.errors !== undefined && (
                    <p>
                      <span className="font-medium">Errors:</span> 
                      <span className="ml-1">{migrationStats.errors}</span>
                    </p>
                  )}
                </div>
              )}
            </div>

            <div className="flex flex-col">
              <h3 className="font-medium">Sync Storage References</h3>
              <p className="text-sm text-gray-500 mb-2">Synchronize database references with storage files</p>
              <button
                onClick={handleSyncStorageReferences}
                className="px-4 py-2 bg-purple-500 text-white rounded hover:bg-purple-600 transition-colors"
                disabled={syncLoading}
              >
                {syncLoading ? 'Syncing...' : 'Sync References'}
              </button>
              
              {syncStats.success !== undefined && (
                <div className="mt-2 p-2 bg-gray-50 rounded">
                  <p>
                    <span className="font-medium">Status:</span> 
                    {syncStats.success ? (
                      <span className="text-green-600 ml-1">Success</span>
                    ) : (
                      <span className="text-red-600 ml-1">Failed</span>
                    )}
                  </p>
                  {syncStats.fixed !== undefined && syncStats.total !== undefined && (
                    <p>
                      <span className="font-medium">Fixed:</span> 
                      <span className="ml-1">{syncStats.fixed} of {syncStats.total} references</span>
                    </p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center h-64">
            <Loader className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : submissions.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-64 text-gray-500">
            <AlertCircle className="h-12 w-12 mb-4" />
            <p className="text-lg font-medium">No submissions found</p>
          </div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    ID
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Company
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Status
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Created
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {submissions.map((submission) => (
                  <tr key={submission.submission_id} className="hover:bg-gray-50">
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
                      {submission.submission_id.slice(0, 8)}...
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {submission.company_name}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <StatusBadge status={submission.status} />
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(submission.created_at).toLocaleString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm">
                      <div className="flex items-center space-x-4">
                        {submission.report_link && (
                          <a
                            href={submission.report_link}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="text-primary hover:text-primary-dark"
                          >
                            View Report
                          </a>
                        )}
                        {(submission.status === 'failed' || submission.status === 'complete') && (
                          <motion.button
                            onClick={() => handleReprocess(submission.submission_id)}
                            disabled={processing.includes(submission.submission_id)}
                            className="text-gray-600 hover:text-primary disabled:opacity-50 disabled:cursor-not-allowed"
                            whileHover={{ scale: 1.05 }}
                            whileTap={{ scale: 0.95 }}
                          >
                            <RefreshCw className={`h-4 w-4 ${processing.includes(submission.submission_id) ? 'animate-spin' : ''}`} />
                          </motion.button>
                        )}
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;