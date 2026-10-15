import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { motion } from 'framer-motion';
import { Sparkles, ArrowRight } from 'lucide-react';
import { countPendingStrategies } from '../services/semanticBridgeService';

// Center Stage call-out: surfaces Semantic Bridge drafts awaiting the user's review.
const NewMatchesBadge: React.FC = () => {
  const [count, setCount] = useState(0);

  useEffect(() => {
    countPendingStrategies()
      .then(setCount)
      .catch((error) => console.error('Failed to count new matches:', error));
  }, []);

  if (count === 0) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -10 }}
      animate={{ opacity: 1, y: 0 }}
    >
      <Link
        to="/strategies"
        data-testid="new-matches-badge"
        className="flex items-center justify-between gap-4 p-5 rounded-xl bg-gradient-to-r from-[#164881] to-[#2A5C95] text-white shadow-md hover:shadow-lg transition-shadow"
      >
        <div className="flex items-center gap-4">
          <div className="relative">
            <div className="p-3 rounded-lg bg-white/15">
              <Sparkles className="h-6 w-6 text-[#DCAF35]" />
            </div>
            <span className="absolute -top-2 -right-2 min-w-[1.5rem] h-6 px-1.5 rounded-full bg-[#CE2028] text-white text-sm font-bold flex items-center justify-center">
              {count}
            </span>
            <span className="absolute -top-2 -right-2 h-6 w-6 rounded-full bg-[#CE2028] animate-ping opacity-40" />
          </div>
          <div>
            <div className="text-lg font-semibold">
              {count} New {count === 1 ? 'Match' : 'Matches'}
            </div>
            <div className="text-sm text-white/80">
              Target companies matched to your experience. Review and approve before anything is used.
            </div>
          </div>
        </div>
        <span className="hidden sm:flex items-center font-medium whitespace-nowrap">
          Review drafts <ArrowRight className="h-5 w-5 ml-1" />
        </span>
      </Link>
    </motion.div>
  );
};

export default NewMatchesBadge;
