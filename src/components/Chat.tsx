import React, { useState, useRef, useEffect } from 'react';
import { Send, Loader, Trash2, AlertCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { supabase } from '../services/supabaseService';
import { fetchChatHistory, saveMessage, clearChatHistory, Message } from '../services/chatService';
import toast from 'react-hot-toast';

const SYSTEM_PROMPT = `You are an AI interview preparation assistant. Help users prepare for job interviews by:
1. Providing detailed answers to technical questions
2. Offering interview strategy advice
3. Helping with company research
4. Giving feedback on answers
5. Suggesting good questions to ask interviewers

Be concise but thorough in your responses.`;

const Chat: React.FC = () => {
  const [messages, setMessages] = useState<Message[]>([]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    loadChatHistory();
  }, []);

  useEffect(() => {
    if (!initialLoad) {
      scrollToBottom();
    }
  }, [messages, initialLoad]);

  const loadChatHistory = async () => {
    try {
      const history = await fetchChatHistory();
      setMessages(history);
    } catch (error) {
      console.error('Failed to load chat history:', error);
      toast.error('Failed to load chat history');
    } finally {
      setInitialLoad(false);
    }
  };

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading) return;

    const userMessage: Omit<Message, 'id' | 'user_id' | 'created_at'> = {
      role: 'user',
      content: input.trim(),
    };

    try {
      setLoading(true);
      setInput('');

      // Save user message
      const savedUserMessage = await saveMessage(userMessage);
      setMessages(prev => [...prev, savedUserMessage]);

      // Get chat history for context
      const chatHistory = messages
        .filter(m => m.role !== 'system')
        .slice(-4)
        .map(m => ({ role: m.role, content: m.content }));

      // Prepare messages array with system prompt and recent history
      const contextMessages = [
        { role: 'system', content: SYSTEM_PROMPT },
        ...chatHistory,
        { role: userMessage.role, content: userMessage.content }
      ];

      // Send request to chat function
      const { data: { session } } = await supabase.auth.getSession();
      if (!session) throw new Error('Not authenticated');

      const response = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/functions/v1/chat`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${session.access_token}`,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ 
          messages: contextMessages
        }),
      });

      if (!response.ok) {
        const error = await response.json();
        throw new Error(error.error || 'Failed to get response');
      }

      const { result } = await response.json();

      // Save assistant message
      const savedAssistantMessage = await saveMessage({
        role: 'assistant',
        content: result,
      });

      setMessages(prev => [...prev, savedAssistantMessage]);
    } catch (error) {
      console.error('Chat error:', error);
      toast.error('Failed to send message');
      
      const errorMessage: Omit<Message, 'id' | 'user_id' | 'created_at'> = {
        role: 'assistant',
        content: 'Sorry, I encountered an error. Please try again.',
      };
      
      const savedErrorMessage = await saveMessage(errorMessage);
      setMessages(prev => [...prev, savedErrorMessage]);
    } finally {
      setLoading(false);
    }
  };

  const handleClearChat = async () => {
    if (!confirm('Are you sure you want to clear the chat history?')) return;

    try {
      await clearChatHistory();
      setMessages([]);
      toast.success('Chat history cleared');
    } catch (error) {
      console.error('Failed to clear chat:', error);
      toast.error('Failed to clear chat history');
    }
  };

  return (
    <div className="flex flex-col space-y-4">
      <div className="flex justify-between items-center">
        <h1 className="text-2xl font-bold text-gray-800">Interview Assistant</h1>
        <button
          onClick={handleClearChat}
          className="flex items-center px-3 py-2 text-red-600 hover:text-red-800 transition-colors"
          title="Clear chat history"
        >
          <Trash2 className="h-5 w-5" />
        </button>
      </div>

      <div className="flex flex-col h-[calc(100vh-12rem)] bg-white rounded-xl shadow-lg overflow-hidden">
        <div className="flex-1 overflow-y-auto p-6 space-y-4">
          {initialLoad ? (
            <div className="flex items-center justify-center h-full text-gray-500">
              <Loader className="w-6 h-6 animate-spin mr-2" />
              <span>Loading chat history...</span>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-gray-500">
              <AlertCircle className="w-12 h-12 mb-2" />
              <p className="text-lg font-medium">No messages yet</p>
              <p className="text-sm">Start a conversation to get interview help</p>
            </div>
          ) : (
            <AnimatePresence initial={false}>
              {messages.map((message) => (
                <motion.div
                  key={message.id}
                  initial={{ opacity: 0, y: 20 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0, y: -20 }}
                  className={`flex ${message.role === 'user' ? 'justify-end' : 'justify-start'}`}
                >
                  <div
                    className={`max-w-[80%] rounded-lg p-4 ${
                      message.role === 'user'
                        ? 'bg-primary text-white'
                        : 'bg-gray-100 text-gray-800'
                    }`}
                  >
                    <p className="whitespace-pre-wrap">{message.content}</p>
                    <p className="text-xs mt-2 opacity-70">
                      {new Date(message.created_at!).toLocaleTimeString()}
                    </p>
                  </div>
                </motion.div>
              ))}
            </AnimatePresence>
          )}
          <div ref={messagesEndRef} />
        </div>

        <form onSubmit={handleSubmit} className="p-4 border-t">
          <div className="flex space-x-4">
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask about interview preparation..."
              className="flex-1 px-4 py-2 border border-gray-300 rounded-xl focus:ring-2 focus:ring-primary focus:border-transparent"
              disabled={loading}
            />
            <motion.button
              type="submit"
              disabled={loading || !input.trim()}
              className="bg-primary hover:bg-primary-dark text-white px-6 py-2 rounded-xl flex items-center space-x-2 disabled:opacity-50"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
            >
              {loading ? (
                <Loader className="animate-spin h-5 w-5" />
              ) : (
                <Send className="h-5 w-5" />
              )}
            </motion.button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default Chat;