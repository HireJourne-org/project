import { supabase } from './supabaseService';
import { uploadResume, uploadReport } from './storageService';
import { enrichCompanyData } from './companyService';

interface Interviewer {
  name?: string;
  linkedin_url: string;
}

interface Submission {
  submission_id?: string;
  job_description: string;
  company_name: string;
  email: string;
  resume_url?: string;
  interviewers_list: Interviewer[];
  status?: 'pending' | 'processing' | 'complete' | 'failed';
  report_link?: string;
  user_id?: string;
}

interface Report {
  report_id?: string;
  submission_id: string;
  report_pdf_url?: string;
  company_overview_summary?: string;
  potential_interview_questions?: string;
  key_insights?: string;
  user_id: string;
}

export const createSubmission = async (data: Omit<Submission, 'user_id' | 'submission_id'>) => {
  const { data: { user } } = await supabase.auth.getUser();
  
  if (!user) {
    throw new Error('User not authenticated');
  }

  const submission = {
    ...data,
    user_id: user.id,
    status: 'pending',
    interviewers_list: data.interviewers_list || []
  };

  const { data: result, error } = await supabase
    .from('submissions')
    .insert(submission)
    .select()
    .single();

  if (error) {
    throw error;
  }

  // Start the report generation process and company data enrichment in parallel
  await Promise.all([
    generateReport(result.submission_id, user.id),
    enrichCompanyData(result.submission_id, result.company_name)
  ]);

  return result;
};

export const getSubmissions = async () => {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      reports (*),
      companies (*)
    `)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
};

export const getSubmission = async (submissionId: string) => {
  const { data, error } = await supabase
    .from('submissions')
    .select(`
      *,
      reports (*),
      companies (*)
    `)
    .eq('submission_id', submissionId)
    .single();

  if (error) {
    throw error;
  }

  return data;
};

const generateReport = async (submissionId: string, userId: string) => {
  try {
    // Update submission status
    await supabase
      .from('submissions')
      .update({ status: 'processing' })
      .eq('submission_id', submissionId);

    // Create initial report entry
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        submission_id: submissionId,
        user_id: userId
      })
      .select()
      .single();

    if (reportError) {
      throw reportError;
    }

    // Get submission data with company information
    const { data: submission } = await getSubmission(submissionId);

    // Generate report sections in parallel
    const [companyOverview, questions, insights] = await Promise.all([
      generateCompanyOverview(submission.company_name, submission.companies?.[0]),
      generateInterviewQuestions(submission.job_description),
      generateInsights(submission.company_name, submission.companies?.[0])
    ]);

    // Generate PDF
    const pdfUrl = await generatePDF({
      companyOverview,
      questions,
      insights,
      submission
    });

    // Update report with generated content
    const { error: updateError } = await supabase
      .from('reports')
      .update({
        report_pdf_url: pdfUrl,
        company_overview_summary: companyOverview,
        potential_interview_questions: questions,
        key_insights: insights
      })
      .eq('report_id', report.report_id);

    if (updateError) {
      throw updateError;
    }

    // Update submission status and report link
    await supabase
      .from('submissions')
      .update({ 
        status: 'complete',
        report_link: pdfUrl 
      })
      .eq('submission_id', submissionId);

  } catch (error) {
    console.error('Error generating report:', error);
    
    // Update submission status to failed
    await supabase
      .from('submissions')
      .update({ status: 'failed' })
      .eq('submission_id', submissionId);
      
    throw error;
  }
};

// Helper functions for report generation
const generateCompanyOverview = async (companyName: string, companyData?: any) => {
  if (companyData?.company_summary) {
    return companyData.company_summary;
  }
  return `Company overview for ${companyName}`;
};

const generateInterviewQuestions = async (jobDescription: string) => {
  // TODO: Implement AI-based question generation
  return `Generated questions based on: ${jobDescription}`;
};

const generateInsights = async (companyName: string, companyData?: any) => {
  if (companyData?.due_diligence_notes) {
    return companyData.due_diligence_notes;
  }
  return `Key insights for ${companyName}`;
};

const generatePDF = async (data: any): Promise<string> => {
  try {
    // Import the HTML2PDF library
    const html2pdf = (await import('html2pdf.js')).default;
    
    // Compose HTML for PDF
    const html = `
      <!DOCTYPE html>
      <html>
      <head>
        <title>${data.submission.company_name} - Interview Preparation</title>
        <style>
          body { font-family: Arial, sans-serif; margin: 0; padding: 20px; color: #333; }
          h1 { color: #2563eb; margin-bottom: 10px; font-size: 24px; }
          h2 { color: #1e40af; margin-top: 20px; margin-bottom: 10px; font-size: 20px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
          .section { margin-bottom: 20px; }
          .footer { margin-top: 30px; text-align: center; font-size: 12px; color: #6b7280; }
          .header { text-align: center; margin-bottom: 30px; }
          .logo { max-width: 150px; margin-bottom: 10px; }
        </style>
      </head>
      <body>
        <div class="header">
          <h1>${data.submission.company_name} - Interview Preparation Report</h1>
          <p>Generated on ${new Date().toLocaleDateString()}</p>
        </div>
        
        <div class="section">
          <h2>Company Overview</h2>
          <div>${data.companyOverview || 'No company overview available.'}</div>
        </div>
        
        <div class="section">
          <h2>Potential Interview Questions</h2>
          <div>${data.questions || 'No questions available.'}</div>
        </div>
        
        <div class="section">
          <h2>Key Insights</h2>
          <div>${data.insights || 'No insights available.'}</div>
        </div>
        
        <div class="footer">
          <p>This report was automatically generated by HireJourne</p>
        </div>
      </body>
      </html>
    `;
    
    // Create element to render PDF
    const element = document.createElement('div');
    element.innerHTML = html;
    document.body.appendChild(element);
    
    // Configure HTML2PDF options
    const options = {
      margin: [10, 10, 10, 10],
      filename: `${data.submission.company_name.toLowerCase().replace(/\s+/g, '-')}-report.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { scale: 2, useCORS: true },
      jsPDF: { unit: 'mm', format: 'a4', orientation: 'portrait' }
    };
    
    // Generate PDF
    const pdfBlob = await new Promise<Blob>((resolve, reject) => {
      html2pdf().from(element).set(options).outputPdf('blob').then((blob: Blob) => {
        resolve(blob);
      }).catch((error: any) => {
        reject(error);
      });
    });
    
    // Clean up the element
    document.body.removeChild(element);
    
    // Upload to Supabase Storage
    const reportId = data.submission.submission_id;
    const fileName = `${reportId}.pdf`;
    
    const { error: uploadError } = await supabase.storage
      .from('reports')
      .upload(fileName, pdfBlob, {
        contentType: 'application/pdf',
        cacheControl: '3600',
        upsert: true
      });
      
    if (uploadError) {
      console.error('❌ Error uploading PDF:', uploadError);
      throw uploadError;
    }
    
    // Get public URL
    const { data: { publicUrl } } = supabase.storage
      .from('reports')
      .getPublicUrl(fileName);
      
    return publicUrl;
  } catch (error) {
    console.error('❌ Error generating PDF:', error);
    throw new Error('Failed to generate PDF report');
  }
};