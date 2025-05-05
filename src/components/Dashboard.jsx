import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { Search, BookOpen, CheckCircle, XCircle, Clock } from 'lucide-react';

const Dashboard = ({ questions }) => {
  const [searchTerm, setSearchTerm] = useState('');
  
  const filteredQuestions = questions.filter(question => 
    question.question?.toLowerCase().includes(searchTerm.toLowerCase()) ||
    question.category?.toLowerCase().includes(searchTerm.toLowerCase())
  );
  
  const totalQuestions = questions.length;
  const answeredQuestions = questions.filter(q => q.status === 'Answered').length;
  const needsReviewQuestions = questions.filter(q => q.status === 'Needs Review').length;
  const pendingQuestions = questions.filter(q => q.status === 'Pending').length;
  
  const categories = {};
  questions.forEach(question => {
    if (question.category) {
      if (!categories[question.category]) {
        categories[question.category] = 0;
      }
      categories[question.category]++;
    }
  });

  return (
    <div className="space-y-8">
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h1 className="text-3xl font-bold text-primary mb-6">Interview Prep Dashboard</h1>
        
        <div className="relative mb-6">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <Search className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-primary focus:border-primary"
            placeholder="Search questions or categories..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <StatCard 
            title="Total Questions" 
            value={totalQuestions} 
            icon={<BookOpen className="h-8 w-8 text-primary" />} 
            color="primary"
          />
          <StatCard 
            title="Answered" 
            value={answeredQuestions} 
            icon={<CheckCircle className="h-8 w-8 text-green-500" />} 
            color="green"
          />
          <StatCard 
            title="Needs Review" 
            value={needsReviewQuestions} 
            icon={<Clock className="h-8 w-8 text-secondary" />} 
            color="secondary"
          />
          <StatCard 
            title="Pending" 
            value={pendingQuestions} 
            icon={<XCircle className="h-8 w-8 text-red-500" />} 
            color="red"
          />
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-primary mb-4">Categories</h2>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {Object.entries(categories).map(([category, count]) => (
            <div key={category} className="border rounded-lg p-4 hover:bg-gray-50 transition-colors">
              <h3 className="font-semibold text-lg text-primary">{category}</h3>
              <p className="text-gray-600">{count} questions</p>
            </div>
          ))}
        </div>
      </div>
      
      <div className="bg-white p-6 rounded-lg shadow-md">
        <h2 className="text-2xl font-bold text-primary mb-4">Recent Questions</h2>
        <div className="space-y-4">
          {filteredQuestions.slice(0, 5).map(question => (
            <Link 
              key={question.id} 
              to={`/questions/${question.id}`}
              className="block border rounded-lg p-4 hover:bg-gray-50 transition-colors"
            >
              <h3 className="font-semibold text-lg text-primary">{question.question}</h3>
              <div className="flex justify-between mt-2">
                <span className="text-gray-600">{question.category}</span>
                <StatusBadge status={question.status} />
              </div>
            </Link>
          ))}
        </div>
        {filteredQuestions.length > 5 && (
          <Link 
            to="/questions" 
            className="mt-4 inline-block text-primary hover:text-primary-dark transition-colors"
          >
            View all questions →
          </Link>
        )}
      </div>
    </div>
  );
};

const StatCard = ({ title, value, icon, color }) => {
  const colorClasses = {
    primary: 'bg-primary-light/10 border-primary-light/20',
    green: 'bg-green-50 border-green-200',
    secondary: 'bg-secondary-light/10 border-secondary-light/20',
    red: 'bg-red-50 border-red-200',
  };
  
  return (
    <div className={`border rounded-lg p-4 ${colorClasses[color]}`}>
      <div className="flex justify-between items-center">
        <div>
          <p className="text-gray-500 text-sm">{title}</p>
          <p className="text-2xl font-bold">{value}</p>
        </div>
        {icon}
      </div>
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusClasses = {
    'Answered': 'bg-green-100 text-green-800',
    'Needs Review': 'bg-secondary-light/20 text-secondary-dark',
    'Pending': 'bg-red-100 text-red-800',
  };
  
  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium ${statusClasses[status] || 'bg-gray-100 text-gray-800'}`}>
      {status}
    </span>
  );
};

export default Dashboard;