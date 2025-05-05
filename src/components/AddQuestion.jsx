import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Save, X } from 'lucide-react';
import { addQuestion } from '../services/supabaseService';

const AddQuestion = ({ setQuestions }) => {
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  const [formData, setFormData] = useState({
    question: '',
    answer: '',
    category: '',
    status: 'Pending',
    difficulty: '',
    notes: '',
    lastReviewed: new Date().toISOString().split('T')[0]
  });
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.question) {
      setError('Question is required');
      return;
    }
    
    try {
      setLoading(true);
      setError(null);
      
      const newQuestion = await addQuestion(formData);
      
      // Update the questions list in the parent component
      setQuestions(prev => [...prev, newQuestion]);
      
      // Navigate to the question detail page
      navigate(`/questions/${newQuestion.id}`);
    } catch (err) {
      console.error('Error adding question:', err);
      setError('Failed to add question. Please try again.');
    } finally {
      setLoading(false);
    }
  };
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Add New Question</h1>
        <button 
          onClick={() => navigate('/questions')}
          className="flex items-center text-gray-600 hover:text-gray-800"
        >
          <X className="h-5 w-5 mr-1" />
          Cancel
        </button>
      </div>
      
      {error && (
        <div className="bg-red-100 border border-red-400 text-red-700 px-4 py-3 rounded mb-4">
          {error}
        </div>
      )}
      
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Question <span className="text-red-500">*</span>
          </label>
          <textarea
            name="question"
            value={formData.question}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={3}
            required
          />
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Answer
          </label>
          <textarea
            name="answer"
            value={formData.answer}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={6}
          />
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Category
            </label>
            <input
              type="text"
              name="category"
              value={formData.category}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              placeholder="e.g., JavaScript, React, System Design"
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Status
            </label>
            <select
              name="status"
              value={formData.status}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="Pending">Pending</option>
              <option value="Answered">Answered</option>
              <option value="Needs Review">Needs Review</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Difficulty
            </label>
            <select
              name="difficulty"
              value={formData.difficulty}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">Select Difficulty</option>
              <option value="Easy">Easy</option>
              <option value="Medium">Medium</option>
              <option value="Hard">Hard</option>
            </select>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Last Reviewed
            </label>
            <input
              type="date"
              name="lastReviewed"
              value={formData.lastReviewed}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            />
          </div>
        </div>
        
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            Notes
          </label>
          <textarea
            name="notes"
            value={formData.notes}
            onChange={handleChange}
            className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
            rows={4}
            placeholder="Additional notes, resources, or tips..."
          />
        </div>
        
        <div className="flex justify-end">
          <button
            type="submit"
            disabled={loading}
            className="flex items-center px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
          >
            <Save className="h-5 w-5 mr-1" />
            {loading ? 'Saving...' : 'Save Question'}
          </button>
        </div>
      </form>
    </div>
  );
};

export default AddQuestion;