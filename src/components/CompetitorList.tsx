import React from 'react';
import { Building2, ExternalLink } from 'lucide-react';
import { motion } from 'framer-motion';
import { Competitor } from '../services/competitorService';

interface CompetitorListProps {
  competitors: Competitor[];
  loading: boolean;
}

const CompetitorList: React.FC<CompetitorListProps> = ({ competitors, loading }) => {
  if (loading) {
    return (
      <div className="animate-pulse space-y-4">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="bg-gray-100 h-24 rounded-xl"></div>
        ))}
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {competitors.map((competitor, index) => (
        <motion.div
          key={competitor.name}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: index * 0.1 }}
          className="bg-white p-6 rounded-xl shadow-sm hover:shadow-md transition-shadow"
        >
          <div className="flex items-start space-x-4">
            <div className="bg-primary/10 p-3 rounded-lg">
              <Building2 className="h-6 w-6 text-primary" />
            </div>
            <div className="flex-1">
              <h3 className="text-lg font-semibold text-gray-900 flex items-center">
                {competitor.name}
                <ExternalLink className="h-4 w-4 ml-2 text-gray-400" />
              </h3>
              <p className="text-gray-600 mt-1">{competitor.description}</p>
            </div>
          </div>
        </motion.div>
      ))}
    </div>
  );
};

export default CompetitorList;