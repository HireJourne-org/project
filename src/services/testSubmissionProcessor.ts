import { createTestSubmission } from './testSubmissionService';
import { processSubmission } from './submissionProcessor';
import { supabase } from './supabaseService';
import toast from 'react-hot-toast';

interface SubmissionStatus {
  status: 'pending' | 'processing' | 'complete' | 'failed';
  report_link?: string;
  error_message?: string;
}

export async function processTestSubmission() {
  try {
    // Create test submission
    const { data: submission, error } = await createTestSubmission();
    
    if (error || !submission) {
      throw new Error(error || 'Failed to create test submission');
    }

    console.log('🚀 Created test submission:', submission.submission_id);
    toast.success('Test submission created successfully');

    // Process the submission
    await processSubmission(submission.submission_id);
    
    console.log('✅ Completed processing test submission');
    toast.success('Test submission processed successfully');

    return submission.submission_id;
  } catch (error) {
    console.error('❌ Test submission processing failed:', error);
    toast.error(error instanceof Error ? error.message : 'Failed to process test submission');
    throw error;
  }
}

async function checkSubmissionStatus(submissionId: string): Promise<SubmissionStatus> {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      status,
      report_link,
      error_message
    `)
    .eq('submission_id', submissionId)
    .single();

  if (error) {
    throw new Error(`Failed to check submission status: ${error.message}`);
  }

  return data as SubmissionStatus;
}

export async function runTestSubmissionFlow(
  options = { 
    maxAttempts: 30, 
    intervalMs: 10000 
  }
) {
  try {
    const submissionId = await processTestSubmission();
    let attempts = 0;
    
    const checkStatus = async (): Promise<SubmissionStatus> => {
      try {
        const status = await checkSubmissionStatus(submissionId);
        
        switch (status.status) {
          case 'complete':
            console.log('✅ Test submission completed successfully');
            toast.success('Test flow completed successfully');
            return status;
            
          case 'failed':
            const errorMsg = status.error_message || 'Unknown error occurred';
            console.error('❌ Submission processing failed:', errorMsg);
            toast.error(`Processing failed: ${errorMsg}`);
            throw new Error(errorMsg);
            
          case 'processing':
          case 'pending':
            if (attempts >= options.maxAttempts) {
              throw new Error('Submission processing timed out');
            }
            attempts++;
            
            // Show progress
            const progress = Math.round((attempts / options.maxAttempts) * 100);
            console.log(`⏳ Processing: ${progress}% complete`);
            
            // Wait and check again
            await new Promise(resolve => setTimeout(resolve, options.intervalMs));
            return checkStatus();
            
          default:
            throw new Error(`Invalid status: ${status.status}`);
        }
      } catch (error) {
        console.error('Status check failed:', error);
        throw error;
      }
    };

    // Start status checking
    return await checkStatus();

  } catch (error) {
    console.error('❌ Test submission flow failed:', error);
    toast.error(error instanceof Error ? error.message : 'Test flow failed');
    throw error;
  }
}

// Helper to validate submission results
export async function validateTestSubmission(submissionId: string) {
  try {
    const { data: submission } = await supabase
      .from('submissions')
      .select(`
        *,
        reports (*),
        companies (*)
      `)
      .eq('submission_id', submissionId)
      .single();

    if (!submission) {
      throw new Error('Submission not found');
    }

    // Validation checks
    const checks = {
      hasReport: !!submission.reports?.[0],
      hasCompanyData: !!submission.companies?.[0],
      hasReportPDF: !!submission.reports?.[0]?.report_pdf_url,
      hasCompanyOverview: !!submission.reports?.[0]?.company_overview_summary,
      hasQuestions: !!submission.reports?.[0]?.potential_interview_questions,
      hasInsights: !!submission.reports?.[0]?.key_insights
    };

    const failed = Object.entries(checks)
      .filter(([, passed]) => !passed)
      .map(([check]) => check);

    if (failed.length > 0) {
      console.warn('⚠️ Validation warnings:', failed);
      return {
        valid: false,
        warnings: failed,
        submission
      };
    }

    console.log('✅ Submission validation passed');
    return {
      valid: true,
      warnings: [],
      submission
    };
  } catch (error) {
    console.error('❌ Validation failed:', error);
    throw error;
  }
}