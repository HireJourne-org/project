import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Loader, ChevronDown, ChevronUp } from 'lucide-react';
import { generateTechnicalSTAR, STARAnswer } from '../services/starService';
import { ParsedResume } from '../services/resumeService';
import { ParsedJobDescription } from '../services/jobService';
import toast from 'react-hot-toast';

interface Props {
  parsedResume: ParsedResume;
  parsedJD: ParsedJobDescription;
}

const TechnicalSTARGenerator: React.FC<Props> = ({ parsedResume, parsedJD }) => {
  const [loading, setLoading] = useState(false);
  const [answers, setAnswers] = useState<STARAnswer[]>([]);
  const [expandedIndex, setExpandedIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    try {
      setLoading(true);
      const generatedAnswers = await generateTechnicalSTAR(parsedResume, parsedJD);
      setAnswers(generatedAnswers);
    } catch (error) {
      console.error('Failed to generate technical STAR answers:', error);
      toast.error('Failed to generate technical interview answers');
    } finally {
      setLoading(false);
    }
  };

  const toggleExpand = (index: number) => {
    setExpandedIndex(expandedIndex === index ? null : index);
  };

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold text-gray-800">Technical STAR Answers</h2>
          <p className="text-gray-600 mt-1">
            Generate technical interview answers in STAR format
          </p>
        </div>

        <motion.button
          onClick={handleGenerate}
          disabled={loading}
          className="bg-primary hover:bg-primary-dark text-white px-6 py-3 rounded-xl font-semibold flex items-center space-x-2 disabled:opacity-50"
          whileHover={{ scale: 1.02 }}
          whileTap={{ scale: 0.98 }}
        >
          {loading ? (
            <>
              <Loader className="animate-spin h-5 w-5" />
              <span>Generating...</span>
            </>
          ) : (
            <span>Generate Technical Answers</span>
          )}
        </motion.button>
      </div>

      {answers.length > 0 && (
        <div className="space-y-4">
          {answers.map((answer, index) => (
            <motion.div
              key={index}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.1 }}
              className="bg-white rounded-xl shadow-sm overflow-hidden"
            >
              <button
                onClick={() => toggleExpand(index)}
                className="w-full px-6 py-4 text-left flex justify-between items-center hover:bg-gray-50"
              >
                <h3 className="font-medium text-gray-800">{answer.question}</h3>
                {expandedIndex === index ? (
                  <ChevronUp className="h-5 w-5 text-gray-400" />
                ) : (
                  <ChevronDown className="h-5 w-5 text-gray-400" />
                )}
              </button>

              {expandedIndex === index && (
                <div className="px-6 py-4 border-t space-y-4">
                  <div>
                    <h4 className="font-medium text-gray-700">Technical Context</h4>
                    <p className="text-gray-600 mt-1">{answer.star_i_answer.situation}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Technical Challenge</h4>
                    <p className="text-gray-600 mt-1">{answer.star_i_answer.task}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Implementation</h4>
                    <p className="text-gray-600 mt-1">{answer.star_i_answer.action}</p>
                  </div>
                  
                  <div>
                    <h4 className="font-medium text-gray-700">Technical Outcomes</h4>
                    <p className="text-gray-600 mt-1">{answer.star_i_answer.result}</p>
                  </div>
                  
                  <div className="border-t pt-4">
                    <h4 className="font-medium text-primary">Relevance & Application</h4>
                    <p className="text-gray-600 mt-1">{answer.star_i_answer.impact_pivot}</p>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}
    </div>
  );
};