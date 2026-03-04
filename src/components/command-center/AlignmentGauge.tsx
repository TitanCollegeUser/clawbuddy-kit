import { motion } from 'framer-motion';

interface AlignmentGaugeProps {
  score: number;
}

const AlignmentGauge = ({ score }: AlignmentGaugeProps) => {
  const radius = 80;
  const semicircumference = Math.PI * radius;
  const progress = (score / 100) * semicircumference;

  const getColor = (s: number) => {
    if (s >= 90) return 'hsl(160, 84%, 39%)';
    if (s >= 75) return 'hsl(217, 91%, 60%)';
    if (s >= 60) return 'hsl(45, 93%, 47%)';
    return 'hsl(0, 84%, 60%)';
  };

  const getGrade = (s: number) => {
    if (s >= 90) return 'A';
    if (s >= 75) return 'B';
    if (s >= 60) return 'C';
    return 'F';
  };

  const getScoreClass = (s: number) => {
    if (s >= 90) return 'score-a';
    if (s >= 75) return 'score-b';
    if (s >= 60) return 'score-c';
    return 'score-f';
  };

  return (
    <div className="flex flex-col items-center gauge-glow">
      <svg width="200" height="120" viewBox="0 0 200 120">
        {/* Outer glow ring */}
        <motion.path
          d="M 16 105 A 84 84 0 0 1 184 105"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="2"
          strokeLinecap="round"
          strokeDasharray={Math.PI * 84}
          initial={{ strokeDashoffset: Math.PI * 84 }}
          animate={{ strokeDashoffset: Math.PI * 84 - (score / 100) * Math.PI * 84 }}
          transition={{ duration: 2, ease: 'easeOut', delay: 0.2 }}
          opacity={0.15}
          filter="blur(3px)"
        />
        {/* Background arc */}
        <path
          d="M 20 105 A 80 80 0 0 1 180 105"
          fill="none"
          stroke="hsl(220, 15%, 15%)"
          strokeWidth="14"
          strokeLinecap="round"
        />
        {/* Animated progress arc */}
        <motion.path
          d="M 20 105 A 80 80 0 0 1 180 105"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={semicircumference}
          initial={{ strokeDashoffset: semicircumference }}
          animate={{ strokeDashoffset: semicircumference - progress }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
        />
        {/* Glow layer */}
        <motion.path
          d="M 20 105 A 80 80 0 0 1 180 105"
          fill="none"
          stroke={getColor(score)}
          strokeWidth="14"
          strokeLinecap="round"
          strokeDasharray={semicircumference}
          initial={{ strokeDashoffset: semicircumference }}
          animate={{ strokeDashoffset: semicircumference - progress }}
          transition={{ duration: 1.8, ease: 'easeOut', delay: 0.3 }}
          opacity={0.3}
          filter="blur(6px)"
        />
      </svg>
      <div className="-mt-14 text-center">
        <motion.div
          className={`text-4xl font-bold font-mono ${getScoreClass(score)} score-number-pulse`}
          initial={{ opacity: 0, scale: 0.5 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.5, delay: 1 }}
        >
          {score}%
        </motion.div>
        <motion.div
          className={`text-lg font-semibold ${getScoreClass(score)}`}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.2 }}
        >
          ({getGrade(score)})
        </motion.div>
      </div>
    </div>
  );
};

export default AlignmentGauge;
