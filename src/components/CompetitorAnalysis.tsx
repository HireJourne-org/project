import React, { useState, useEffect } from 'react';
import { fetchCompetitors, Competitor } from '../services/competitorService';
import CompetitorList from './CompetitorList';
import toast from 'react-hot-toast';

const CompetitorAnalysis: React.FC = () => {
  const [competitors, setCompetitors] = useState<Competitor[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    analyzeCompetitors();
  }, []);

  const analyzeCompetitors = async () => {
    try {
      setLoading(true);
      setError(null);
      const data = await fetchCompetitors('Rivian');
      setCompetitors(data);
    } catch (error) {
      console.error('Failed to fetch competitors:', error);
      setError('Failed to fetch competitor analysis');
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
      
      {loading ? (
        <div data-testid="competitor-loading">
          <CompetitorList competitors={[]} loading />
        </div>
      ) : error ? (
        <div className="bg-red-50 text-red-700 p-6 rounded-xl">{error}</div>
      ) : (
        <CompetitorList competitors={competitors} loading={false} />
      )}
    </div>
  );
};

export default CompetitorAnalysis;