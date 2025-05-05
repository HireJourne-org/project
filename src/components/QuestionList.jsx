import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, Filter, CheckCircle, XCircle, Clock } from 'lucide-react';

const QuestionList = ({ questions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [statusFilter, setStatusFilter] = useState('');
  
  const categories = [...new Set(questions.map(q => q.category).filter(Boolean))];
  
  const filteredQuestions = questions.filter(question => {
    const matchesSearch = question.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         question.answer?.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesCategory = !categoryFilter || question.category === categoryFilter;
    const matchesStatus = !statusFilter || question.status === statusFilter;
    
    return matchesSearch && matchesCategory && matchesStatus;
  });

  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <h1 className="text-3xl font-bold text-primary mb-6">Interview Questions</h1>
      
      <div className="flex flex-col md:flex-row gap-4 mb-6">
        <div className="relative flex-grow">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Search questions..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="flex gap-2">
          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary focus:border-primary"
              value={categoryFilter}
              onChange={(e) => setCategoryFilter(e.target.value)}
            >
              <option value="">All Categories</option>
              {categories.map(category => (
                <option key={category} value={category}>{category}</option>
              ))}
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
          </div>
          
          <div className="relative">
            <select
              className="block w-full pl-3 pr-10 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-primary focus:border-primary"
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="">All Statuses</option>
              <option value="Answered">Answered</option>
              <option value="Needs Review">Needs Review</option>
              <option value="Pending">Pending</option>
            </select>
            <div className="absolute inset-y-0 right-0 pr-3 flex items-center pointer-events-none">
              <Filter className="h-5 w-5 text-gray-400" />
            </div>
          </div>
        </div>
      </div>
      
      {filteredQuestions.length === 0 ? (
        <div className="text-center py-8">
          <p className="text-gray-500">No questions found matching your criteria.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredQuestions.map(question => (
            <Link 
              key={question.id} 
              to={`/questions/${question.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="font-semibold text-lg text-primary">{question.question}</h3>
                  {question.category && (
                    <span className="inline-block bg-primary-light/10 text-primary text-xs px-2 py-1 rounded mt-2">
                      {question.category}
                    </span>
                  )}
                </div>
                <StatusIcon status={question.status} />
              </div>
              
              {question.answer && (
                <p className="text-gray-600 mt-2 line-clamp-2">{question.answer}</p>
              )}
              
              <div className="flex justify-between mt-2 text-sm text-gray-500">
                <span>Difficulty: {question.difficulty || 'Not rated'}</span>
                {question.last_reviewed && (
                  <span>Last reviewed: {new Date(question.last_reviewed).toLocaleDateString()}</span>
                )}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
};

const StatusIcon = ({ status }) => {
  switch (status) {
    case 'Answered':
      return <CheckCircle className="h-6 w-6 text-green-500" />;
    case 'Needs Review':
      return <Clock className="h-6 w-6 text-secondary" />;
    case 'Pending':
      return <XCircle className="h-6 w-6 text-red-500" />;
    default:
      return null;
  }
};

export default QuestionList;