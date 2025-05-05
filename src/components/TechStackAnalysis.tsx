import React, { useState, useEffect } from 'react';
import { fetchTechStack, TechStack } from '../services/techStackService';
import { motion } from 'framer-motion';
import { Server, Database, Layout, Cloud, BarChart, Shield, Loader } from 'lucide-react';
import toast from 'react-hot-toast';

interface CategoryConfig {
  icon: React.ReactNode;
  color: string;
}

const categories: Record<string, CategoryConfig> = {
  Frontend: {
    icon: <Layout className="h-5 w-5" />,
    color: 'bg-blue-100 text-blue-800',
  },
  Backend: {
    icon: <Server className="h-5 w-5" />,
    color: 'bg-green-100 text-green-800',
  },
  Database: {
    icon: <Database className="h-5 w-5" />,
    color: 'bg-purple-100 text-purple-800',
  },
  DevOps: {
    icon: <Cloud className="h-5 w-5" />,
    color: 'bg-orange-100 text-orange-800',
  },
  Analytics: {
    icon: <BarChart className="h-5 w-5" />,
    color: 'bg-yellow-100 text-yellow-800',
  },
  Security: {
    icon: <Shield className="h-5 w-5" />,
    color: 'bg-red-100 text-red-800',
  },
};

interface Props {
  domain: string;
}

const TechStackAnalysis: React.FC<Props> = ({ domain }) => {
  const [techStack, setTechStack] = useState<TechStack[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeTechStack();
  }, [domain]);

  const analyzeTechStack = async () => {
    try {
      setLoading(true);
      const data = await fetchTechStack(domain);
      setTechStack(data);
    } catch (error) {
      console.error('Failed to fetch tech stack:', error);
      toast.error('Failed to analyze tech stack');
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  const groupedTechStack = techStack.reduce((acc, tech) => {
    if (!acc[tech.category]) {
      acc[tech.category] = [];
    }
    acc[tech.category].push(tech);
    return acc;
  }, {} as Record<string, TechStack[]>);

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Technology Stack</h2>
        <p className="text-gray-600 mt-1">Analysis of {domain}'s technology infrastructure</p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {Object.entries(groupedTechStack).map(([category, technologies], index) => (
          <motion.div
            key={category}
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: index * 0.1 }}
            className="bg-white p-6 rounded-xl shadow-sm"
          >
            <div className="flex items-center space-x-3 mb-4">
              <div className={`p-2 rounded-lg ${categories[category]?.color || 'bg-gray-100'}`}>
                {categories[category]?.icon}
              </div>
              <h3 className="text-lg font-semibold text-gray-800">{category}</h3>
            </div>

            <div className="space-y-3">
              {technologies.map((tech) => (
                <div key={tech.name} className="border-b border-gray-100 pb-3 last:border-0">
                  <div className="font-medium text-gray-800">{tech.name}</div>
                  {tech.description && (
                    <p className="text-sm text-gray-600 mt-1">{tech.description}</p>
                  )}
                </div>
              ))}
            </div>
          </motion.div>
        ))}
      </div>
    </div>
  );
};