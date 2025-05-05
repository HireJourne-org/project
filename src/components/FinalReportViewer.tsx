import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { FileText, Building, Users, Brain, Calendar, Loader, AlertCircle, Download } from 'lucide-react';
import html2pdf from 'html2pdf.js';
import toast from 'react-hot-toast';

interface FinalReport {
  candidate: {
    resume_url: string;
    company_name: string;
    created_at: string;
  };
  company_research: {
    summary: string;
    market_map: any[];
    tech_stack: any[];
    funding_rounds: string;
    due_diligence_notes: string;
  };
  interviewers: any[];
  behavioral_questions: any[];
  technical_questions: any[];
  best_practices_notes: string;
  closing_statements: string;
}

interface Props {
  submissionId: string;
}

const FinalReportViewer: React.FC<Props> = ({ submissionId }) => {
  const [report, setReport] = useState<FinalReport | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('overview');
  const reportRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    fetchReport();
  }, [submissionId]);

  const fetchReport = async () => {
    try {
      setLoading(true);
      const response = await fetch(`/api/final-report/${submissionId}`);
      if (!response.ok) {
        throw new Error('Failed to fetch report');
      }
      const data = await response.json();
      setReport(data);
    } catch (error) {
      console.error('Error fetching final report:', error);
      toast.error('Failed to load report');
    } finally {
      setLoading(false);
    }
  };

  const downloadPDF = () => {
    if (!reportRef.current || !report) return;

    const opt = {
      margin: 0.5,
      filename: `${report.candidate.company_name || "Interview_Prep"}_Framework_HireJourne.pdf`,
      image: { type: 'jpeg', quality: 0.98 },
      html2canvas: { 
        scale: 2,
        useCORS: true,
        letterRendering: true
      },
      jsPDF: { 
        unit: 'in', 
        format: 'letter', 
        orientation: 'portrait',
        compress: true
      }
    };

    html2pdf()
      .from(reportRef.current)
      .set(opt)
      .toPdf()
      .get('pdf')
      .then(function (pdf) {
        const totalPages = pdf.internal.getNumberOfPages();
        const pageWidth = pdf.internal.pageSize.getWidth();
        const pageHeight = pdf.internal.pageSize.getHeight();

        for (let i = 1; i <= totalPages; i++) {
          pdf.setPage(i);

          // Footer with improved styling
          pdf.setFontSize(10);
          pdf.setTextColor(100);
          pdf.setFont("helvetica", "italic");
          pdf.text(`Page ${i} of ${totalPages}`, pageWidth - 0.75, pageHeight - 0.5, { align: 'right' });
          
          pdf.setFont("helvetica", "normal");
          pdf.text('Powered by HireJourne', 0.75, pageHeight - 0.5, { align: 'left' });

          // Add clickable logo and styling on Cover Page
          if (i === 1) {
            pdf.setTextColor(22, 72, 129); // HireJourne blue
            pdf.setFontSize(12);
            pdf.link(
              pageWidth / 2 - 1.5,
              2,
              3,
              1,
              { url: 'https://www.hirejourne.com' }
            );
          }

          // Add subtle page border
          pdf.setDrawColor(200);
          pdf.setLineWidth(0.01);
          pdf.rect(0.25, 0.25, pageWidth - 0.5, pageHeight - 0.5);
        }
      })
      .save();

    toast.promise(
      Promise.resolve(),
      {
        loading: 'Generating PDF...',
        success: 'Report downloaded successfully',
        error: 'Failed to generate PDF'
      }
    );
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!report) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-gray-500">
        <AlertCircle className="h-12 w-12 mb-4" />
        <p className="text-lg font-medium">Report not found</p>
      </div>
    );
  }

  const tabs = [
    { id: 'overview', label: 'Overview', icon: <FileText className="h-5 w-5" /> },
    { id: 'company', label: 'Company Research', icon: <Building className="h-5 w-5" /> },
    { id: 'interviewers', label: 'Interviewers', icon: <Users className="h-5 w-5" /> },
    { id: 'questions', label: 'Interview Questions', icon: <Brain className="h-5 w-5" /> },
  ];

  return (
    <div className="space-y-6">
      <div className="bg-white p-6 rounded-xl shadow-sm">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-800">
              Interview Preparation Report
            </h1>
            <p className="text-gray-600 mt-1 flex items-center">
              <Calendar className="h-4 w-4 mr-2" />
              Generated on {new Date(report.candidate.created_at).toLocaleDateString()}
            </p>
          </div>
          <div className="flex items-center space-x-4">
            <a
              href={report.candidate.resume_url}
              target="_blank"
              rel="noopener noreferrer"
              className="text-primary hover:text-primary-dark flex items-center"
            >
              View Resume →
            </a>
            <button
              onClick={downloadPDF}
              className="flex items-center space-x-2 px-4 py-2 bg-primary text-white rounded-lg hover:bg-primary-dark transition-colors"
            >
              <Download className="h-4 w-4" />
              <span>Download PDF</span>
            </button>
          </div>
        </div>

        <div className="flex space-x-4 border-b">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center space-x-2 px-4 py-2 border-b-2 transition-colors ${
                activeTab === tab.id
                  ? 'border-primary text-primary'
                  : 'border-transparent text-gray-500 hover:text-gray-700'
              }`}
            >
              {tab.icon}
              <span>{tab.label}</span>
            </button>
          ))}
        </div>

        <div ref={reportRef} className="mt-6">
          {activeTab === 'overview' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Company Overview
                </h2>
                <p className="text-gray-600">{report.company_research.summary}</p>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Best Practices & Tips
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {report.best_practices_notes}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Closing Statements
                </h2>
                <p className="text-gray-600">{report.closing_statements}</p>
              </div>
            </motion.div>
          )}

          {activeTab === 'company' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-6"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Market Position
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {report.company_research.market_map.map((competitor, index) => (
                    <div
                      key={index}
                      className="p-4 border rounded-lg hover:bg-gray-50 transition-colors"
                    >
                      <h3 className="font-medium text-gray-800">{competitor.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">
                        {competitor.description}
                      </p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Technology Stack
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {report.company_research.tech_stack.map((tech, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <h3 className="font-medium text-gray-800">{tech.name}</h3>
                      <p className="text-gray-600 text-sm mt-1">{tech.category}</p>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-2">
                  Due Diligence Notes
                </h2>
                <div className="prose prose-sm max-w-none text-gray-600">
                  {report.company_research.due_diligence_notes}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === 'interviewers' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="grid grid-cols-1 md:grid-cols-2 gap-6"
            >
              {report.interviewers.map((interviewer, index) => (
                <div
                  key={index}
                  className="bg-white p-6 rounded-lg border hover:shadow-md transition-shadow"
                >
                  <div className="flex items-center space-x-4 mb-4">
                    <div className="bg-primary/10 p-3 rounded-full">
                      <Users className="h-6 w-6 text-primary" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-800">
                        {interviewer.name}
                      </h3>
                      <p className="text-gray-600">{interviewer.title}</p>
                    </div>
                  </div>
                  <p className="text-gray-600 text-sm">
                    {interviewer.assessment_notes}
                  </p>
                  {interviewer.linkedin_url && (
                    <a
                      href={interviewer.linkedin_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary hover:text-primary-dark text-sm mt-4 inline-block"
                    >
                      View LinkedIn Profile →
                    </a>
                  )}
                </div>
              ))}
            </motion.div>
          )}

          {activeTab === 'questions' && (
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="space-y-8"
            >
              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Behavioral Questions
                </h2>
                <div className="space-y-4">
                  {report.behavioral_questions.map((q, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <h3 className="font-medium text-gray-800 mb-2">
                        {q.question}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Situation:</strong> {q.star_i_answer.situation}</p>
                        <p><strong>Task:</strong> {q.star_i_answer.task}</p>
                        <p><strong>Action:</strong> {q.star_i_answer.action}</p>
                        <p><strong>Result:</strong> {q.star_i_answer.result}</p>
                        <p className="text-primary mt-2">
                          <strong>Impact:</strong> {q.star_i_answer.impact_pivot}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              <div>
                <h2 className="text-lg font-semibold text-gray-800 mb-4">
                  Technical Questions
                </h2>
                <div className="space-y-4">
                  {report.technical_questions.map((q, index) => (
                    <div
                      key={index}
                      className="p-4 bg-gray-50 rounded-lg"
                    >
                      <h3 className="font-medium text-gray-800 mb-2">
                        {q.question}
                      </h3>
                      <div className="space-y-2 text-sm text-gray-600">
                        <p><strong>Context:</strong> {q.star_i_answer.situation}</p>
                        <p><strong>Challenge:</strong> {q.star_i_answer.task}</p>
                        <p><strong>Solution:</strong> {q.star_i_answer.action}</p>
                        <p><strong>Outcome:</strong> {q.star_i_answer.result}</p>
                        <p className="text-primary mt-2">
                          <strong>Application:</strong> {q.star_i_answer.impact_pivot}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FinalReportViewer;