import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { ArrowLeft, Edit, Trash, Save, X, CheckCircle, XCircle, Clock } from 'lucide-react';
import { updateQuestion, deleteQuestion } from '../services/supabaseService';

const QuestionDetail = ({ questions }) => {
  const { id } = useParams();
  const navigate = useNavigate();
  
  const [question, setQuestion] = useState(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editedQuestion, setEditedQuestion] = useState({});
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(null);
  
  useEffect(() => {
    const foundQuestion = questions.find(q => q.id === id);
    if (foundQuestion) {
      setQuestion(foundQuestion);
      setEditedQuestion(foundQuestion);
    } else {
      setError('Question not found');
    }
  }, [id, questions]);
  
  const handleEdit = () => {
    setIsEditing(true);
  };
  
  const handleCancel = () => {
    setIsEditing(false);
    setEditedQuestion(question);
  };
  
  const handleChange = (e) => {
    const { name, value } = e.target;
    setEditedQuestion(prev => ({
      ...prev,
      [name]: value
    }));
  };
  
  const handleSave = async () => {
    try {
      setLoading(true);
      const updatedQuestion = await updateQuestion(id, editedQuestion);
      setQuestion(updatedQuestion);
      setIsEditing(false);
      setError(null);
    } catch (err) {
      setError('Failed to update question');
      console.error(err);
    } finally {
      setLoading(false);
    }
  };
  
  const handleDelete = async () => {
    if (window.confirm('Are you sure you want to delete this question?')) {
      try {
        setLoading(true);
        await deleteQuestion(id);
        navigate('/questions');
      } catch (err) {
        setError('Failed to delete question');
        console.error(err);
      } finally {
        setLoading(false);
      }
    }
  };
  
  if (error) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <div className="text-red-600 mb-4">{error}</div>
        <button 
          onClick={() => navigate('/questions')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Questions
        </button>
      </div>
    );
  }
  
  if (!question) {
    return (
      <div className="bg-white p-6 rounded-lg shadow-md">
        <p>Loading...</p>
      </div>
    );
  }
  
  return (
    <div className="bg-white p-6 rounded-lg shadow-md">
      <div className="flex justify-between items-center mb-6">
        <button 
          onClick={() => navigate('/questions')}
          className="flex items-center text-blue-600 hover:text-blue-800"
        >
          <ArrowLeft className="h-5 w-5 mr-1" />
          Back to Questions
        </button>
        
        <div className="flex space-x-2">
          {isEditing ? (
            <>
              <button 
                onClick={handleSave}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-green-600 text-white rounded hover:bg-green-700 disabled:opacity-50"
              >
                <Save className="h-5 w-5 mr-1" />
                Save
              </button>
              <button 
                onClick={handleCancel}
                className="flex items-center px-3 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
              >
                <X className="h-5 w-5 mr-1" />
                Cancel
              </button>
            </>
          ) : (
            <>
              <button 
                onClick={handleEdit}
                className="flex items-center px-3 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
              >
                <Edit className="h-5 w-5 mr-1" />
                Edit
              </button>
              <button 
                onClick={handleDelete}
                disabled={loading}
                className="flex items-center px-3 py-2 bg-red-600 text-white rounded hover:bg-red-700 disabled:opacity-50"
              >
                <Trash className="h-5 w-5 mr-1" />
                Delete
              </button>
            </>
          )}
        </div>
      </div>
      
      {isEditing ? (
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Question</label>
            <textarea
              name="question"
              value={editedQuestion.question || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={3}
            />
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Answer</label>
            <textarea
              name="answer"
              value={editedQuestion.answer || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={6}
            />
          </div>
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
              <input
                type="text"
                name="category"
                value={editedQuestion.category || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
              <select
                name="status"
                value={editedQuestion.status || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="">Select Status</option>
                <option value="Answered">Answered</option>
                <option value="Needs Review">Needs Review</option>
                <option value="Pending">Pending</option>
              </select>
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Difficulty</label>
              <select
                name="difficulty"
                value={editedQuestion.difficulty || ''}
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
              <label className="block text-sm font-medium text-gray-700 mb-1">Last Reviewed</label>
              <input
                type="date"
                name="lastReviewed"
                value={editedQuestion.lastReviewed || ''}
                onChange={handleChange}
                className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              />
            </div>
          </div>
          
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Notes</label>
            <textarea
              name="notes"
              value={editedQuestion.notes || ''}
              onChange={handleChange}
              className="w-full p-2 border rounded-md focus:ring-blue-500 focus:border-blue-500"
              rows={4}
            />
          </div>
        </div>
      ) : (
        <div>
          <div className="flex items-center mb-4">
            <StatusBadge status={question.status} />
            {question.category && (
              <span className="ml-2 bg-blue-100 text-blue-800 text-sm px-2 py-1 rounded">
                {question.category}
              </span>
            )}
            {question.difficulty && (
              <span className="ml-2 bg-purple-100 text-purple-800 text-sm px-2 py-1 rounded">
                {question.difficulty}
              </span>
            )}
          </div>
          
          <h1 className="text-2xl font-bold text-gray-800 mb-4">{question.question}</h1>
          
          <div className="bg-gray-50 p-4 rounded-lg mb-6">
            <h2 className="text-lg font-semibold text-gray-700 mb-2">Answer:</h2>
            <div className="whitespace-pre-line">{question.answer || 'No answer provided yet.'}</div>
          </div>
          
          {question.notes && (
            <div className="mb-6">
              <h2 className="text-lg font-semibold text-gray-700 mb-2">Notes:</h2>
              <div className="whitespace-pre-line">{question.notes}</div>
            </div>
          )}
          
          {question.lastReviewed && (
            <div className="text-sm text-gray-500">
              Last reviewed: {new Date(question.lastReviewed).toLocaleDateString()}
            </div>
          )}
        </div>
      )}
    </div>
  );
};

const StatusBadge = ({ status }) => {
  const statusInfo = {
    'Answered': { 
      icon: <CheckCircle className="h-5 w-5 mr-1" />, 
      classes: 'bg-green-100 text-green-800' 
    },
    'Needs Review': { 
      icon: <Clock className="h-5 w-5 mr-1" />, 
      classes: 'bg-yellow-100 text-yellow-800' 
    },
    'Pending': { 
      icon: <XCircle className="h-5 w-5 mr-1" />, 
      classes: 'bg-red-100 text-red-800' 
    }
  };
  
  const { icon, classes } = statusInfo[status] || { 
    icon: null, 
    classes: 'bg-gray-100 text-gray-800' 
  };
  
  return (
    <span className={`flex items-center px-2 py-1 rounded-full text-sm font-medium ${classes}`}>
      {icon}
      {status || 'Unknown'}
    </span>
  );
};

export default QuestionDetail;