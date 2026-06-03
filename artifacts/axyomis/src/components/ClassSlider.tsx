import React, { useMemo } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { GraduationCap, ChevronRight, BookOpen } from 'lucide-react';
import { useUser, ClassLevel } from '../context/UserContext';

const CLASS_LEVELS: Array<{ level: ClassLevel; label: string; description: string }> = [
  { level: 'Grade 5', label: 'Grade 5', description: 'Foundational' },
  { level: 'Grade 8', label: 'Grade 8', description: 'Intermediate' },
  { level: 'Grade 10', label: 'Grade 10', description: 'Advanced' },
  { level: 'Grade 12', label: 'Grade 12', description: 'Expert' },
  { level: 'Undergraduate', label: 'University', description: 'Specialist' },
];

interface ClassSliderProps {
  onClassChange?: (level: ClassLevel) => void;
  compact?: boolean;
  showDescription?: boolean;
}

export const ClassSlider: React.FC<ClassSliderProps> = ({
  onClassChange,
  compact = false,
  showDescription = true,
}) => {
  const { classLevel, setClassLevel } = useUser();

  const handleClassChange = (level: ClassLevel) => {
    setClassLevel(level);
    onClassChange?.(level);
  };

  const currentIndex = useMemo(
    () => CLASS_LEVELS.findIndex(c => c.level === classLevel) ?? 2,
    [classLevel]
  );

  if (compact) {
    return (
      <div className="flex items-center gap-2 px-4 py-2 bg-gradient-to-r from-blue-600/20 to-purple-600/20 rounded-full border border-blue-500/30 backdrop-blur-xl">
        <GraduationCap className="w-4 h-4 text-blue-400" />
        <select
          value={classLevel || 'Grade 10'}
          onChange={(e) => handleClassChange(e.target.value as ClassLevel)}
          className="bg-transparent text-sm font-semibold text-white border-0 outline-none cursor-pointer"
        >
          {CLASS_LEVELS.map(({ level, label }) => (
            <option key={level} value={level} className="bg-slate-900">
              {label}
            </option>
          ))}
        </select>
      </div>
    );
  }

  return (
    <div className="w-full">
      {/* Header */}
      <div className="flex items-center gap-3 mb-6 px-1">
        <div className="p-2.5 bg-gradient-to-br from-blue-500 to-purple-600 rounded-xl shadow-lg">
          <GraduationCap className="w-6 h-6 text-white" />
        </div>
        <div>
          <h3 className="text-lg font-bold text-white">Your Class Level</h3>
          <p className="text-sm text-white/60">Personalize content for your learning stage</p>
        </div>
      </div>

      {/* Slider Container */}
      <div className="relative mb-6">
        {/* Background rail */}
        <div className="absolute top-1/2 left-0 right-0 h-1.5 bg-gradient-to-r from-slate-700 via-blue-700 to-purple-700 rounded-full transform -translate-y-1/2" />

        {/* Interactive buttons */}
        <div className="relative flex justify-between gap-1 px-2">
          {CLASS_LEVELS.map((item, index) => {
            const isSelected = classLevel === item.level;
            const distance = Math.abs(index - currentIndex);
            const isNear = distance <= 1;

            return (
              <motion.button
                key={item.level}
                onClick={() => handleClassChange(item.level)}
                whileHover={{ scale: 1.1 }}
                whileTap={{ scale: 0.95 }}
                className="relative flex flex-col items-center gap-2 flex-1 px-2 py-4"
              >
                {/* Animated selection circle */}
                <motion.div
                  initial={false}
                  animate={{
                    scale: isSelected ? 1 : 0.7,
                    opacity: isSelected ? 1 : 0.4,
                  }}
                  className={`w-12 h-12 rounded-full flex items-center justify-center font-bold text-sm transition-all ${
                    isSelected
                      ? 'bg-gradient-to-br from-blue-500 to-purple-600 text-white shadow-lg shadow-purple-500/50'
                      : isNear
                      ? 'bg-slate-700 text-slate-300 border border-slate-600'
                      : 'bg-slate-800 text-slate-500'
                  }`}
                >
                  {index + 5}
                </motion.div>

                {/* Label */}
                <motion.div
                  animate={{
                    opacity: isSelected || isNear ? 1 : 0.6,
                    scale: isSelected ? 1 : 0.9,
                  }}
                  className="text-center"
                >
                  <p className={`text-xs font-semibold ${isSelected ? 'text-white' : 'text-slate-400'}`}>
                    {item.label}
                  </p>
                  {showDescription && (
                    <p className={`text-[10px] mt-1 ${isSelected ? 'text-blue-400' : 'text-slate-500'}`}>
                      {item.description}
                    </p>
                  )}
                </motion.div>
              </motion.button>
            );
          })}
        </div>
      </div>

      {/* Info Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={classLevel}
          initial={{ opacity: 0, y: 10 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -10 }}
          transition={{ duration: 0.3 }}
          className="p-4 bg-gradient-to-br from-slate-800 to-slate-900 border border-slate-700 rounded-2xl"
        >
          <div className="flex items-start gap-3">
            <BookOpen className="w-5 h-5 text-blue-400 flex-shrink-0 mt-0.5" />
            <div className="flex-1 min-w-0">
              <h4 className="font-semibold text-white mb-1">
                {CLASS_LEVELS.find(c => c.level === classLevel)?.label} Level Content
              </h4>
              <p className="text-sm text-slate-400 leading-relaxed">
                {getClassDescription(classLevel)}
              </p>
            </div>
          </div>
        </motion.div>
      </AnimatePresence>

      {/* Quick features */}
      <div className="mt-4 grid grid-cols-2 gap-3 sm:grid-cols-3">
        {getClassFeatures(classLevel).map((feature, idx) => (
          <motion.div
            key={idx}
            initial={{ opacity: 0, scale: 0.8 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: idx * 0.05 }}
            className="p-3 bg-slate-800 border border-slate-700 rounded-lg hover:border-blue-500/50 transition-colors"
          >
            <p className="text-xs text-slate-300 leading-tight">{feature}</p>
          </motion.div>
        ))}
      </div>
    </div>
  );
};

function getClassDescription(level: ClassLevel | null): string {
  const descriptions: Partial<Record<ClassLevel, string>> = {
    'Grade 5': '🎯 Simple concepts, everyday examples, interactive learning. Perfect for building foundational understanding.',
    'Grade 8': '📚 Core concepts with real-world connections. Intermediate complexity for deeper learning.',
    'Grade 10': '⚡ Comprehensive coverage with board exam focus. Advanced explanations and problem-solving strategies.',
    'Grade 12': '🚀 Advanced topics, competitive exam preparation (JEE/NEET). University-level depth and complexity.',
    'Undergraduate': '🏆 Specialized knowledge, research-level content. University curricula and advanced applications.',
  };

  return descriptions[level || 'Grade 10'] || 'Personalized learning for any stage.';
}

function getClassFeatures(level: ClassLevel | null): string[] {
  const features: Partial<Record<ClassLevel, string[]>> = {
    'Grade 5': [
      '✨ Simple language',
      '🎨 Visual learning',
      '🎯 Basic concepts',
    ],
    'Grade 8': [
      '🔍 Core concepts',
      '🌍 Real-world apps',
      '📊 Foundation building',
    ],
    'Grade 10': [
      '📖 Board exams',
      '🧮 Advanced math',
      '🔬 Deep science',
    ],
    'Grade 12': [
      '🏅 JEE/NEET ready',
      '📈 Competition prep',
      '🔑 Key formulas',
    ],
    'Undergraduate': [
      '🎓 University level',
      '📚 Research-ready',
      '💡 Advanced topics',
    ],
  };

  return features[level || 'Grade 10'] || [];
}

export default ClassSlider;
