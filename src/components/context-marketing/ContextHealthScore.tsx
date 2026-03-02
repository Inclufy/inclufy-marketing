// src/components/context-marketing/ContextHealthScore.tsx
import { motion } from 'framer-motion';

interface ContextHealthScoreProps {
  score: number;
  size?: 'sm' | 'md' | 'lg';
  showLabel?: boolean;
}

export function ContextHealthScore({ score, size = 'md', showLabel = true }: ContextHealthScoreProps) {
  const normalizedScore = Math.min(100, Math.max(0, score));
  const circumference = 2 * Math.PI * 45;
  const strokeDashoffset = circumference - (normalizedScore / 100) * circumference;

  const getColor = () => {
    if (normalizedScore >= 80) return '#10b981'; // green
    if (normalizedScore >= 60) return '#f59e0b'; // yellow
    return '#ef4444'; // red
  };

  const getSize = () => {
    switch (size) {
      case 'sm': return { width: 80, height: 80, strokeWidth: 6 };
      case 'lg': return { width: 200, height: 200, strokeWidth: 12 };
      default: return { width: 120, height: 120, strokeWidth: 8 };
    }
  };

  const dimensions = getSize();
  const center = dimensions.width / 2;
  const radius = 45 * (dimensions.width / 120); // Scale radius with size

  return (
    <div className="flex flex-col items-center">
      <div className="relative">
        <svg
          width={dimensions.width}
          height={dimensions.height}
          viewBox={`0 0 ${dimensions.width} ${dimensions.height}`}
          className="transform -rotate-90"
        >
          {/* Background circle */}
          <circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke="currentColor"
            strokeWidth={dimensions.strokeWidth}
            className="text-gray-200 dark:text-gray-700"
          />
          
          {/* Progress circle */}
          <motion.circle
            cx={center}
            cy={center}
            r={radius}
            fill="none"
            stroke={getColor()}
            strokeWidth={dimensions.strokeWidth}
            strokeLinecap="round"
            strokeDasharray={circumference}
            initial={{ strokeDashoffset: circumference }}
            animate={{ strokeDashoffset }}
            transition={{ duration: 1, ease: "easeInOut" }}
          />
        </svg>
        
        <div className="absolute inset-0 flex items-center justify-center">
          <div className="text-center">
            <motion.div 
              className={`font-bold ${size === 'sm' ? 'text-2xl' : size === 'lg' ? 'text-5xl' : 'text-3xl'}`}
              initial={{ opacity: 0, scale: 0.5 }}
              animate={{ opacity: 1, scale: 1 }}
              transition={{ delay: 0.5 }}
            >
              {Math.round(normalizedScore)}%
            </motion.div>
            {showLabel && (
              <div className={`text-gray-600 dark:text-gray-400 ${size === 'sm' ? 'text-xs' : 'text-sm'}`}>
                Complete
              </div>
            )}
          </div>
        </div>
      </div>
      
      {showLabel && size !== 'sm' && (
        <div className="mt-4 text-center">
          <div className="text-lg font-medium">
            Context Health
          </div>
          <div className="text-sm text-gray-600 dark:text-gray-400">
            {normalizedScore >= 80 ? 'Excellent' : normalizedScore >= 60 ? 'Good' : 'Needs Attention'}
          </div>
        </div>
      )}
    </div>
  );
}