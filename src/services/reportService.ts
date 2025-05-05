import { supabase } from './supabaseService';

interface Report {
  report_id: string;
  submission_id: string;
  user_id: string;
  report_pdf_url?: string;
  company_overview_summary?: string;
  potential_interview_questions?: string;
  key_insights?: string;
  created_at?: string;
}

interface Company {
  id: string;
  submission_id: string;
  company_summary?: string;
  market_map?: any[];
  tech_stack?: any[];
  funding_rounds?: any[];
  due_diligence_notes?: string;
}

interface Submission {
  submission_id: string;
  user_id: string;
  company_name: string;
  job_description: string;
  resume_url?: string;
  email: string;
  status: 'pending' | 'processing' | 'complete' | 'failed';
  report_link?: string;
  created_at?: string;
}

export async function assembleFinalReport(submissionId: string): Promise<Report> {
  try {
    // Step 1: Pull the submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (submissionError || !submission) {
      throw new Error('Submission not found');
    }

    // Step 2: Pull the related company data
    const { data: company, error: companyError } = await supabase
      .from('companies')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (companyError || !company) {
      throw new Error('Company data not found');
    }

    // Step 3: Create the report
    const { data: report, error: reportError } = await supabase
      .from('reports')
      .insert({
        submission_id: submissionId,
        user_id: submission.user_id,
        company_overview_summary: company.company_summary,
        potential_interview_questions: generateInterviewQuestions(
          submission.job_description,
          company.tech_stack
        ),
        key_insights: generateKeyInsights(company, submission)
      })
      .select()
      .single();

    if (reportError || !report) {
      throw new Error('Failed to create report');
    }

    // Step 4: Generate PDF URL
    const pdfUrl = await generatePDFReport(report, company, submission);

    // Step 5: Update report with PDF URL
    const { data: updatedReport, error: updateError } = await supabase
      .from('reports')
      .update({ report_pdf_url: pdfUrl })
      .eq('report_id', report.report_id)
      .select()
      .single();

    if (updateError || !updatedReport) {
      throw new Error('Failed to update report with PDF URL');
    }

    // Step 6: Update submission status
    await supabase
      .from('submissions')
      .update({
        status: 'complete',
        report_link: pdfUrl
      })
      .eq('submission_id', submissionId);

    return updatedReport;
  } catch (error) {
    console.error('Error assembling final report:', error);

    // Update submission status to failed
    await supabase
      .from('submissions')
      .update({ status: 'failed' })
      .eq('submission_id', submissionId);

    throw error;
  }
}

function generateInterviewQuestions(jobDescription: string, techStack: any[]): string {
  // Combine behavioral and technical questions
  const questions = [
    // Company Culture & Values
    "What interests you about our company's mission?",
    "How do you stay updated with industry trends?",
    "Describe your ideal work environment.",

    // Technical Skills
    ...techStack.map(tech => 
      `Tell me about your experience with ${tech.name} and how you've used it in production.`
    ),

    // Problem Solving
    "Describe a challenging technical problem you've solved.",
    "How do you approach debugging complex issues?",
    "Tell me about a time you had to make a difficult technical decision.",

    // Collaboration
    "How do you handle disagreements in technical discussions?",
    "Describe your experience with code reviews.",
    "Tell me about a successful project you led.",

    // Growth & Learning
    "What's the most interesting technical challenge you've faced?",
    "How do you keep your technical skills current?",
    "What are you looking to learn in your next role?"
  ];

  return JSON.stringify(questions);
}

function generateKeyInsights(company: Company, submission: Submission): string {
  const insights = {
    companyProfile: {
      overview: company.company_summary,
      marketPosition: company.market_map?.length 
        ? `Competes with ${company.market_map.map(c => c.name).join(', ')}`
        : 'Market position analysis not available',
      technology: company.tech_stack?.length
        ? `Key technologies: ${company.tech_stack.map(t => t.name).join(', ')}`
        : 'Technology stack analysis not available',
    },
    preparationTips: [
      "Research recent company news and developments",
      "Review the company's product offerings",
      "Understand the company's technical challenges",
      "Prepare questions about growth opportunities",
      "Review your relevant experience and prepare examples"
    ],
    keyFocusAreas: [
      "Technical expertise alignment",
      "Problem-solving capabilities",
      "Team collaboration",
      "Learning and growth mindset",
      "Cultural fit"
    ],
    nextSteps: [
      "Review all generated interview questions",
      "Practice STAR format responses",
      "Research your interviewers",
      "Prepare thoughtful questions",
      "Follow up after the interview"
    ]
  };

  return JSON.stringify(insights);
}

async function generatePDFReport(
  report: Report,
  company: Company,
  submission: Submission
): Promise<string> {
  // In a real implementation, this would generate a PDF
  // For now, we'll return a placeholder URL
  return `/reports/${report.report_id}.pdf`;
}

export async function getReport(reportId: string): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('report_id', reportId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getReportBySubmission(submissionId: string): Promise<Report> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('submission_id', submissionId)
    .single();

  if (error) {
    throw error;
  }

  return data;
}

export async function getUserReports(userId: string): Promise<Report[]> {
  const { data, error } = await supabase
    .from('reports')
    .select('*')
    .eq('user_id', userId)
    .order('created_at', { ascending: false });

  if (error) {
    throw error;
  }

  return data;
}