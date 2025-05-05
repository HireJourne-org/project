import React, { useState, useEffect } from 'react';
import { fetchCompetitors, Competitor } from '../services/competitorService';
import CompetitorList from './CompetitorList';
import toast from 'react-hot-toast';

const CompetitorAnalysis: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    analyzeCompetitors();
  }, []);

  const analyzeCompetitors = async () => {
    try {
      setLoading(true);
      const data = await fetchCompetitors('Rivian');
      setCompetitors(data);
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
      toast.error('Failed to fetch competitor analysis');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Competitor Analysis</h2>
        <p className="text-gray-600 mt-1">Top competitors in the electric vehicle market</p>
      </div>
      
      <CompetitorList competitors={competitors} loading={loading} />
    </div>
  );
};

export default CompetitorAnalysis;