import { supabase } from './supabaseService';

interface TestSubmission {
  resume_file_url?: string;
  job_description: string;
  company_name: string;
  company_domain: string;
  interviewers_list: Array<{
    name: string;
    linkedin_url: string;
  }>;
  status?: 'pending' | 'processing' | 'complete' | 'failed';
}

export async function createTestSubmission(): Promise<{ data: any; error: any }> {
  const testData: TestSubmission = {
    resume_file_url: 'https://xozohtlohlcybcljbczs.supabase.co/storage/v1/object/public/test-resumes/john_doe_resume.pdf',
    job_description: `
      Senior Product Manager - Payments Platform

      About the Role:
      We are seeking a Senior Product Manager to lead new product launches in the Payments vertical. 
      You will be responsible for driving the strategy and execution of key payment initiatives.

      Key Responsibilities:
      - Own the product roadmap for our payments platform
      - Work closely with engineering, design, and business teams
      - Drive product adoption and growth metrics
      - Lead cross-functional initiatives
      - Define and track success metrics

      Requirements:
      - 5+ years of product management experience
      - Strong background in SaaS and API products
      - Experience with payment systems and financial technology
      - Excellent communication and leadership skills
      - Track record of successful product launches

      Nice to Have:
      - Experience with international payment systems
      - Understanding of regulatory compliance in fintech
      - Technical background or ability to understand complex systems

      Benefits:
      - Competitive salary and equity
      - Comprehensive health coverage
      - Flexible work arrangements
      - Professional development budget
      - Regular team events and offsites
    `,
    company_name: 'Stripe',
    company_domain: 'stripe.com',
    interviewers_list: [
      {
        name: "Jane Smith",
        linkedin_url: "https://linkedin.com/in/janesmith",
      },
      {
        name: "Tom Johnson",
        linkedin_url: "https://linkedin.com/in/tomjohnson",
      }
    ],
    status: 'pending'
  };

  try {
    const { data: { user } } = await supabase.auth.getUser();
    
    if (!user) {
      throw new Error('No authenticated user');
    }

    // Create submission
    const { data: submission, error: submissionError } = await supabase
      .from('submissions')
      .insert({
        ...testData,
        user_id: user.id,
        email: user.email
      })
      .select()
      .single();

    if (submissionError) {
      throw submissionError;
    }

    // Create company record
    const { error: companyError } = await supabase
      .from('companies')
      .insert({
        submission_id: submission.submission_id,
        name: testData.company_name,
        domain: testData.company_domain,
        description: 'Global technology company that builds economic infrastructure for the internet.',
        industry: 'Financial Technology',
        employee_count: 8000,
        funding_rounds: [
          {
            date: '2016-12-01',
            type: 'Series D',
            amount: 150000000,
            investors: ['CapitalG', 'General Catalyst']
          },
          {
            date: '2019-09-19',
            type: 'Series G',
            amount: 250000000,
            investors: ['Sequoia Capital', 'Andreessen Horowitz']
          }
        ],
        tech_stack: [
          { name: 'Ruby on Rails', category: 'Backend' },
          { name: 'React', category: 'Frontend' },
          { name: 'PostgreSQL', category: 'Database' },
          { name: 'Redis', category: 'Cache' },
          { name: 'Kubernetes', category: 'Infrastructure' },
          { name: 'GraphQL', category: 'API' }
        ]
      });

    if (companyError) {
      throw companyError;
    }

    // Create initial report
    const { error: reportError } = await supabase
      .from('reports')
      .insert({
        submission_id: submission.submission_id,
        user_id: user.id,
        company_overview_summary: 'Initial overview pending generation',
        potential_interview_questions: '[]',
        key_insights: '[]'
      });

    if (reportError) {
      throw reportError;
    }

    return { 
      data: submission, 
      error: null 
    };

  } catch (error) {
    console.error('Error in createTestSubmission:', error);
    return { 
      data: null, 
      error: error instanceof Error ? error.message : 'Unknown error occurred' 
    };
  }
}