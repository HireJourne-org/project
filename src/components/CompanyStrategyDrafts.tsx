import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { Check, X, Loader, ChevronDown, ChevronUp, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import {
  listCompanyStrategies,
  approveCompanyStrategy,
  rejectCompanyStrategy,
  CompanyStrategyRecord,
  FitTier,
  ReviewStatus,
} from '../services/semanticBridgeService';

const tierStyles: Record<FitTier, { label: string; color: string }> = {
  strong_target: { label: 'Strong target', color: 'bg-green-100 text-green-800' },
  viable_target: { label: 'Viable target', color: 'bg-blue-100 text-blue-800' },
  stretch: { label: 'Stretch', color: 'bg-yellow-100 text-yellow-800' },
  not_a_fit: { label: 'Not a fit', color: 'bg-gray-100 text-gray-700' },
};

const tabs: { status: ReviewStatus; label: string }[] = [
  { status: 'pending_review', label: 'Drafts' },
  { status: 'verified', label: 'Approved' },
  { status: 'rejected', label: 'Rejected' },
];

const signalLabels = {
  market: 'Market data (SimilarIQ)',
  tech: 'Tech data (TinyFish)',
  both: 'Both feeds',
  neither: 'Neither feed',
};

// Review First: AI strategies stay drafts here until the user approves them.
const CompanyStrategyDrafts: React.FC = () => {
  const [status, setStatus] = useState<ReviewStatus>('pending_review');
  const [strategies, setStrategies] = useState<CompanyStrategyRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [expanded, setExpanded] = useState<string | null>(null);
  const [actingOn, setActingOn] = useState<string | null>(null);

  useEffect(() => {
    loadStrategies();
  }, [status]);

  const loadStrategies = async () => {
    try {
      setLoading(true);
      setStrategies(await listCompanyStrategies(status));
    } catch (error) {
      console.error('Failed to load company strategies:', error);
      toast.error('Failed to load company strategies');
    } finally {
      setLoading(false);
    }
  };

  const review = async (id: string, decision: 'approve' | 'reject') => {
    try {
      setActingOn(id);
      if (decision === 'approve') {
        await approveCompanyStrategy(id);
        toast.success('Strategy approved');
      } else {
        await rejectCompanyStrategy(id);
        toast.success('Strategy rejected');
      }
      setStrategies((current) => current.filter((s) => s.id !== id));
    } catch (error) {
      console.error('Failed to update strategy:', error);
      toast.error('Failed to update strategy');
    } finally {
      setActingOn(null);
    }
  };

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-2xl font-bold text-gray-800">Company Strategies</h2>
        <p className="text-gray-600 mt-1">
          AI-proposed target companies. Nothing is used or shared until you approve it.
        </p>
      </div>

      <div className="flex space-x-2 border-b border-gray-200">
        {tabs.map((tab) => (
          <button
            key={tab.status}
            onClick={() => setStatus(tab.status)}
            className={`px-4 py-2 -mb-px border-b-2 transition-colors ${
              status === tab.status
                ? 'border-[#164881] text-[#164881] font-medium'
                : 'border-transparent text-gray-600 hover:text-gray-800'
            }`}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="flex items-center justify-center h-64">
          <Loader className="h-8 w-8 animate-spin text-primary" />
        </div>
      ) : strategies.length === 0 ? (
        <div className="bg-white p-10 rounded-xl shadow-sm text-center text-gray-600">
          <Target className="h-10 w-10 mx-auto text-gray-300 mb-3" />
          {status === 'pending_review' ? 'No drafts waiting for review.' : 'Nothing here yet.'}
        </div>
      ) : (
        <div className="space-y-4">
          {strategies.map((record, index) => {
            const { strategy } = record;
            const tier = tierStyles[record.fit_tier];
            const isOpen = expanded === record.id;
            const busy = actingOn === record.id;

            return (
              <motion.div
                key={record.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: index * 0.05 }}
                className="bg-white p-6 rounded-xl shadow-sm"
              >
                <div className="flex flex-wrap items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <h3 className="text-lg font-semibold text-gray-800">{record.company_name}</h3>
                      <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${tier.color}`}>
                        {tier.label}
                      </span>
                      {status === 'pending_review' && (
                        <span className="px-2 py-0.5 rounded-full text-xs font-medium bg-amber-50 text-amber-700 border border-amber-200">
                          Draft · Needs review
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500 mt-1">
                      Supported by: {signalLabels[strategy.primary_signal]}
                    </p>
                  </div>
                  <div className="text-right">
                    <div className="text-3xl font-bold text-[#164881]">{record.fit_score}</div>
                    <div className="text-xs text-gray-500">fit score</div>
                  </div>
                </div>

                <p className="text-gray-700 mt-4">{strategy.why}</p>

                <button
                  onClick={() => setExpanded(isOpen ? null : record.id)}
                  className="flex items-center text-sm text-[#164881] mt-3 hover:underline"
                >
                  {isOpen ? <ChevronUp className="h-4 w-4 mr-1" /> : <ChevronDown className="h-4 w-4 mr-1" />}
                  {isOpen ? 'Hide details' : 'Show evidence, conflicts and proposed moves'}
                </button>

                {isOpen && (
                  <div className="mt-4 space-y-4 text-sm">
                    {strategy.evidence_matches.length > 0 && (
                      <Section title="Evidence matches">
                        {strategy.evidence_matches.map((m, i) => (
                          <li key={i}>
                            <span className="font-medium">{m.career_evidence}</span> → {m.company_signal}{' '}
                            <span className="text-gray-400">({m.source})</span>
                          </li>
                        ))}
                      </Section>
                    )}
                    {strategy.source_conflicts.length > 0 && (
                      <Section title="Where the data feeds disagree">
                        {strategy.source_conflicts.map((c, i) => (
                          <li key={i}>
                            <span className="font-medium">{c.topic}:</span> market says “{c.market_says}”,
                            tech says “{c.tech_says}”. {c.resolution}
                          </li>
                        ))}
                      </Section>
                    )}
                    {strategy.gaps.length > 0 && (
                      <Section title="Gaps">
                        {strategy.gaps.map((g, i) => <li key={i}>{g}</li>)}
                      </Section>
                    )}
                    {strategy.proposed_moves.length > 0 && (
                      <Section title="Proposed moves">
                        {strategy.proposed_moves.map((m, i) => <li key={i}>{m}</li>)}
                      </Section>
                    )}
                  </div>
                )}

                {status === 'pending_review' && (
                  <div className="flex justify-end gap-2 mt-5 pt-4 border-t border-gray-100">
                    <button
                      onClick={() => review(record.id, 'reject')}
                      disabled={busy}
                      className="flex items-center px-4 py-2 rounded-lg border border-gray-300 text-gray-700 hover:bg-gray-50 disabled:opacity-50 transition-colors"
                    >
                      <X className="h-4 w-4 mr-1" />
                      Reject
                    </button>
                    <button
                      onClick={() => review(record.id, 'approve')}
                      disabled={busy}
                      className="flex items-center px-4 py-2 rounded-lg bg-[#164881] text-white hover:bg-[#123a69] disabled:opacity-50 transition-colors"
                    >
                      {busy ? <Loader className="h-4 w-4 mr-1 animate-spin" /> : <Check className="h-4 w-4 mr-1" />}
                      Approve
                    </button>
                  </div>
                )}
              </motion.div>
            );
          })}
        </div>
      )}
    </div>
  );
};

const Section: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
  <div>
    <h4 className="font-semibold text-gray-800 mb-1">{title}</h4>
    <ul className="list-disc pl-5 space-y-1 text-gray-700">{children}</ul>
  </div>
);

export default CompanyStrategyDrafts;
