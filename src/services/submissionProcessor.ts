import { supabase } from './supabaseService';

interface ProcessedSubmission {
  resumeAnalysis?: {
    skills: string[];
    matchedSkills: string[];
    missingSkills: string[];
    relevantExperience: {
      role: string;
      relevance: number;
      matchingKeywords: string[];
    }[];
  };
  companyAnalysis?: {
    overview: string;
    competitors: {
      name: string;
      url?: string;
      description?: string;
    }[];
    techStack: {
      name: string;
      category: string;
    }[];
    fundingRounds: {
      date: string;
      round: string;
      amount: number;
      investors: string[];
    }[];
  };
  interviewPrep?: {
    behavioralQuestions: string[];
    technicalQuestions: string[];
    closingStatements: string[];
  };
}

export async function processSubmission(submissionId: string) {
  try {
    // Create Supabase client with service role key for background processing
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update status to processing
    await supabaseAdmin
      .from('submissions')
      .update({ status: 'processing' })
      .eq('submission_id', submissionId);

    // Get the submission data
    const { data: submission, error: submissionError } = await supabaseAdmin
      .from('submissions')
      .select('*')
      .eq('submission_id', submissionId)
      .single();

    if (submissionError || !submission) {
      throw new Error('Failed to fetch submission');
    }

    // Process all analyses in parallel
    const [
      resumeAnalysis,
      companyAnalysis,
      interviewPrep
    ] = await Promise.all([
      processResumeAnalysis(submission.resume_url, submission.job_description),
      processCompanyAnalysis(submission.company_name),
      processInterviewPrep(submission.job_description)
    ]);

    // Create report
    const { data: report, error: reportError } = await supabaseAdmin
      .from('reports')
      .insert({
        submission_id: submissionId,
        user_id: submission.user_id,
        company_overview_summary: companyAnalysis?.overview,
        potential_interview_questions: JSON.stringify([
          ...interviewPrep?.behavioralQuestions || [],
          ...interviewPrep?.technicalQuestions || []
        ]),
        key_insights: JSON.stringify({
          skills: resumeAnalysis?.skills || [],
          matchedSkills: resumeAnalysis?.matchedSkills || [],
          missingSkills: resumeAnalysis?.missingSkills || [],
          closingStatements: interviewPrep?.closingStatements || []
        })
      })
      .select()
      .single();

    if (reportError) {
      throw reportError;
    }

    // Save company analysis if available
    if (companyAnalysis) {
      await supabaseAdmin
        .from('companies')
        .insert({
          submission_id: submissionId,
          company_summary: companyAnalysis.overview,
          market_map: companyAnalysis.competitors,
          tech_stack: companyAnalysis.techStack,
          funding_rounds: companyAnalysis.fundingRounds
        });
    }

    // Update submission with success status
    await supabaseAdmin
      .from('submissions')
      .update({
        status: 'complete',
        report_link: `/reports/${report.report_id}`
      })
      .eq('submission_id', submissionId);

  } catch (error) {
    // Create Supabase client with service role key for error handling
    const supabaseAdmin = createClient(
      Deno.env.get('SUPABASE_URL') ?? '',
      Deno.env.get('SUPABASE_SERVICE_ROLE_KEY') ?? ''
    );

    // Update submission with error status
    await supabaseAdmin
      .from('submissions')
      .update({
        status: 'failed',
        error_message: error instanceof Error ? error.message : 'Unknown error occurred'
      })
      .eq('submission_id', submissionId);

    console.error('Error processing submission:', error);
    throw error;
  }
}

async function processResumeAnalysis(resumeUrl: string | null, jobDescription: string) {
  if (!resumeUrl) return null;

  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Analyze the resume and job description to:
            1. Extract key skills from the resume
            2. Match skills to job requirements
            3. Identify missing required skills
            4. Evaluate role relevance

            Return analysis as JSON with:
            {
              "skills": string[],
              "matchedSkills": string[],
              "missingSkills": string[],
              "relevantExperience": Array<{
                "role": string,
                "relevance": number,
                "matchingKeywords": string[]
              }>
            }`
        },
        {
          role: 'user',
          content: `Resume URL: ${resumeUrl}\nJob Description: ${jobDescription}`
        }
      ],
      temperature: 0.3
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function processCompanyAnalysis(companyName: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Research ${companyName} and provide:
            1. Company overview
            2. Main competitors
            3. Technology stack
            4. Recent funding rounds

            Return as JSON with:
            {
              "overview": string,
              "competitors": Array<{
                "name": string,
                "url"?: string,
                "description": string
              }>,
              "techStack": Array<{
                "name": string,
                "category": string
              }>,
              "fundingRounds": Array<{
                "date": string,
                "round": string,
                "amount": number,
                "investors": string[]
              }>
            }`
        },
        {
          role: 'user',
          content: companyName
        }
      ],
      temperature: 0.3
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}

async function processInterviewPrep(jobDescription: string) {
  const response = await fetch('https://api.openai.com/v1/chat/completions', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${Deno.env.get('OPENAI_API_KEY')}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      model: 'gpt-4',
      messages: [
        {
          role: 'system',
          content: `Generate interview preparation materials:
            1. Behavioral questions
            2. Technical questions
            3. Closing statements

            Return as JSON with:
            {
              "behavioralQuestions": string[],
              "technicalQuestions": string[],
              "closingStatements": string[]
            }`
        },
        {
          role: 'user',
          content: jobDescription
        }
      ],
      temperature: 0.3
    })
  });

  const data = await response.json();
  return JSON.parse(data.choices[0].message.content);
}