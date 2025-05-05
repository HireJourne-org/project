import { supabase } from './supabaseService';
import { uploadResume } from './storageService';
import { verifyStorageSetup } from './testStorageService';
import toast from 'react-hot-toast';

interface GuideData {
  jobDescription: string;
  resume: File | null;
  interviewers: string[];
}

const MAX_RETRIES = 3;
const INITIAL_RETRY_DELAY = 1000; // 1 second

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));

const verifyStorageWithRetry = async (): Promise<boolean> => {
  let retryDelay = INITIAL_RETRY_DELAY;

  for (let attempt = 1; attempt <= MAX_RETRIES; attempt++) {
    try {
      // Verify buckets exist (but don't try to create them)
      const { data: buckets, error: bucketsError } = await supabase
        .storage
        .listBuckets();

      if (bucketsError) {
        throw new Error(`Failed to list storage buckets: ${bucketsError.message}`);
      }

      const requiredBuckets = ['resumes', 'reports'];
      const missingBuckets = requiredBuckets.filter(
        bucket => !buckets?.some(b => b.name === bucket)
      );

      // Just check if buckets exist, don't try to create them
      if (missingBuckets.length > 0) {
        console.error('Missing required storage buckets:', missingBuckets);
        throw new Error(
          'Required storage buckets are missing. Please contact an administrator to set up the storage system properly.'
        );
      }

      // Then verify overall storage setup
      const isStorageValid = await verifyStorageSetup();
      if (isStorageValid) {
        return true;
      }

      console.warn(
        `Storage verification attempt ${attempt} failed, retrying in ${retryDelay}ms...`
      );
      
      await sleep(retryDelay);
      // Implement exponential backoff
      retryDelay *= 2;
    } catch (error) {
      console.error(`Storage verification attempt ${attempt} failed with error:`, error);
      
      if (attempt === MAX_RETRIES) {
        throw new Error(
          'Storage system is temporarily unavailable. This might be due to high traffic ' +
          'or maintenance. Please try again in a few minutes. If the issue persists, ' +
          'contact support.'
        );
      }

      await sleep(retryDelay);
      // Implement exponential backoff
      retryDelay *= 2;
    }
  }
  return false;
};

export const generateGuide = async (data: GuideData, userId: string) => {
  try {
    // Verify storage setup with improved retry mechanism
    try {
      const isStorageValid = await verifyStorageWithRetry();
      if (!isStorageValid) {
        throw new Error(
          'Storage system verification failed. Please ensure your Supabase project ' +
          'is properly configured and try again. If the issue persists, contact support.'
        );
      }
    } catch (storageError) {
      console.error('Storage verification failed:', storageError);
      throw storageError; // Propagate the detailed error message
    }

    let resumeUrl = null;
    
    // Handle resume upload if provided
    if (data.resume) {
      try {
        resumeUrl = await uploadResume(data.resume, userId);
      } catch (uploadError) {
        console.error('Resume upload failed:', uploadError);
        throw new Error(
          'Failed to upload resume. Please ensure the file is valid (PDF format, ' +
          'size under 10MB) and try again. If the issue persists, contact support.'
        );
      }
    }

    // Get user email
    const { data: { user }, error: userError } = await supabase.auth.getUser();
    if (userError || !user?.email) {
      throw new Error(
        'Unable to verify user credentials. Please ensure you are properly logged in ' +
        'and try again. If the issue persists, try logging out and back in.'
      );
    }

    // Extract company name from job description
    const companyName = extractCompanyName(data.jobDescription);

    // Create submission record with error handling
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        user_id: userId,
        job_description: data.jobDescription,
        company_name: companyName,
        resume_url: resumeUrl,
        email: user.email,
        status: 'pending',
        interviewers_list: data.interviewers
      })
      .select()
      .single();

    if (submissionError) {
      console.error('Submission creation failed:', submissionError);
      throw new Error(
        'Failed to create submission. This might be due to a temporary database issue. ' +
        'Please try again. If the issue persists, contact support.'
      );
    }

    // Create initial report
    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        submission_id: submission.submission_id,
        user_id: userId,
        company_overview_summary: 'Generating report...',
        potential_interview_questions: '[]',
        key_insights: '[]'
      });

    if (reportError) {
      console.error('Report creation failed:', reportError);
      throw new Error(
        'Failed to create initial report. This might be due to a temporary database issue. ' +
        'Please try again. If the issue persists, contact support.'
      );
    }

    // Start background processing
    try {
      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/process-submission`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          submissionId: submission.submission_id
        })
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
    } catch (processingError) {
      console.error('Failed to trigger processing:', processingError);
      throw new Error(
        'Failed to start report generation. The processing service might be temporarily ' +
        'unavailable. Please try again in a few minutes. If the issue persists, contact support.'
      );
    }

    return submission;
  } catch (error) {
    console.error('Guide generation failed:', error);
    throw error;
  }
};

const extractCompanyName = (jobDescription: string): string => {
  // Common patterns to extract company name
  const patterns = [
    /at\s+([A-Z][A-Za-z0-9\s&]+)(?=\s|$)/,
    /([A-Z][A-Za-z0-9\s&]+)\s+is\s+looking/i,
    /join\s+([A-Z][A-Za-z0-9\s&]+)(?=\s|$)/,
    /([A-Z][A-Za-z0-9\s&]+)\s+is\s+hiring/i
  ];

  for (const pattern of patterns) {
    const match = jobDescription.match(pattern);
    if (match && match[1]) {
      return match[1].trim();
    }
  }

  return "Unknown Company";
};