/**
 * Class-Adaptive Content Configuration
 * Maps topics to difficulty levels and content recommendations
 */

import { ClassLevel } from '../context/UserContext';

export interface TopicDifficulty {
  topic: string;
  basicKeywords: string[];
  intermediateKeywords: string[];
  advancedKeywords: string[];
  concepts: Partial<Record<ClassLevel, string[]>>;
}

/**
 * Topic difficulty mapping for adaptive learning
 */
export const TOPIC_DIFFICULTY_MAP: Record<string, TopicDifficulty> = {
  photosynthesis: {
    topic: 'Photosynthesis',
    basicKeywords: ['plant', 'sunlight', 'food', 'energy', 'leaves'],
    intermediateKeywords: ['chlorophyll', 'light reaction', 'dark reaction', 'glucose'],
    advancedKeywords: ['photosystem', 'electron transport', 'chemiosmosis', 'C3/C4 pathway'],
    concepts: {
      'Grade 5': ['Plants use sunlight to make food', 'Leaves are green because of chlorophyll', 'Plants need light, water, and air'],
      'Grade 8': ['Light and dark reactions', 'Role of chlorophyll in capturing light', 'Production of glucose and oxygen'],
      'Grade 10': ['Light-dependent and light-independent reactions', 'Photosystem I and II', 'Calvin cycle details'],
      'Grade 12': ['Electron transport chains', 'Photophosphorylation mechanisms', 'Carbon fixation pathways', 'Regulation and factors'],
      'Undergraduate': ['Quantum yield and efficiency', 'Structural biology of photosystems', 'Molecular mechanisms', 'Research methodologies'],
    },
  },
  
  evolution: {
    topic: 'Evolution',
    basicKeywords: ['animals', 'change', 'adapt', 'different', 'fossils'],
    intermediateKeywords: ['natural selection', 'adaptation', 'species', 'inheritance'],
    advancedKeywords: ['molecular evolution', 'phylogenetics', 'speciation', 'microevolution', 'macroevolution'],
    concepts: {
      'Grade 5': ['Living things change over time', 'Animals adapt to their environment', 'Fossils show old life'],
      'Grade 8': ['Natural selection basics', 'Adaptation and survival', 'Evidence from fossils and DNA'],
      'Grade 10': ['Mechanism of natural selection', 'Variation in populations', 'Speciation process'],
      'Grade 12': ['Population genetics', 'Hardy-Weinberg equilibrium', 'Molecular evolution', 'Evolutionary mechanisms'],
      'Undergraduate': ['Population dynamics', 'Molecular phylogenetics', 'Speciation models', 'Evolutionary developmental biology'],
    },
  },

  atoms: {
    topic: 'Atomic Structure',
    basicKeywords: ['atom', 'electron', 'nucleus', 'small', 'particle'],
    intermediateKeywords: ['proton', 'neutron', 'electron shell', 'valence'],
    advancedKeywords: ['orbitals', 'quantum numbers', 'electron configuration', 'spectroscopy'],
    concepts: {
      'Grade 5': ['Atoms are tiny particles', 'Electrons move around nucleus', 'Different atoms make different materials'],
      'Grade 8': ['Protons, neutrons, electrons basics', 'Atomic number and mass', 'Electron shells'],
      'Grade 10': ['Electron distribution', 'Periodic table organization', 'Valence electrons and bonding'],
      'Grade 12': ['Quantum numbers', 'Orbital shapes', 'Electron configuration notation'],
      'Undergraduate': ['Wave-particle duality', 'Quantum mechanics', 'Advanced spectroscopy', 'Nuclear processes'],
    },
  },
};

/**
 * Get recommended topics for a class level
 */
export function getRecommendedTopics(classLevel: ClassLevel): string[] {
  const recommendations: Partial<Record<ClassLevel, string[]>> = {
    'Grade 5': ['Life cycles', 'Food chains', 'Weather', 'Space basics', 'Animal habitats'],
    'Grade 8': ['Cell structure', 'Genetics basics', 'Energy sources', 'Earth science', 'Simple machines'],
    'Grade 10': ['Photosynthesis', 'Respiration', 'Heredity', 'Evolution', 'Atomic structure', 'Newton\'s laws'],
    'Grade 12': ['Complex genetics', 'Advanced chemistry', 'Quantum physics', 'Organic chemistry', 'Ecology'],
    'Undergraduate': ['Molecular biology', 'Advanced physics', 'Differential equations', 'Quantum mechanics', 'Research methodology'],
  };

  return recommendations[classLevel] || [];
}

/**
 * Get difficulty level for a topic at a specific class
 */
export function getTopicDifficulty(topic: string, classLevel: ClassLevel): {
  difficulty: 'basic' | 'intermediate' | 'advanced';
  keywords: string[];
  concepts: string[];
  recommendedResources: string;
} {
  const topicData = TOPIC_DIFFICULTY_MAP[topic.toLowerCase()];

  if (!topicData) {
    // Default mapping for unknown topics
    const defaultDifficulty: Partial<Record<ClassLevel, 'basic' | 'intermediate' | 'advanced'>> = {
      'Grade 5': 'basic',
      'Grade 8': 'basic',
      'Grade 10': 'intermediate',
      'Grade 12': 'advanced',
      'Undergraduate': 'advanced',
    };

    return {
      difficulty: defaultDifficulty[classLevel] ?? 'intermediate',
      keywords: [],
      concepts: [],
      recommendedResources: `Beginner-friendly resources for ${topic}`,
    };
  }

  const difficultyMapping: Partial<Record<ClassLevel, 'basic' | 'intermediate' | 'advanced'>> = {
    'Grade 5': 'basic',
    'Grade 8': 'basic',
    'Grade 10': 'intermediate',
    'Grade 12': 'advanced',
    'Undergraduate': 'advanced',
  };

  const difficulty = difficultyMapping[classLevel] ?? 'intermediate';
  const keywords = topicData[`${difficulty}Keywords` as const] || [];
  const concepts = topicData.concepts[classLevel] || [];

  return {
    difficulty,
    keywords,
    concepts,
    recommendedResources: generateResourceRecommendation(difficulty, topic),
  };
}

/**
 * Generate resource recommendation based on difficulty
 */
function generateResourceRecommendation(
  difficulty: 'basic' | 'intermediate' | 'advanced',
  topic: string
): string {
  const recommendations: Record<string, string> = {
    basic: `Start with animated tutorials and simple diagrams for ${topic}. Focus on core concepts.`,
    intermediate: `Watch educational videos explaining mechanisms. Work through practice problems.`,
    advanced: `Study detailed lectures and research papers. Solve board exam/competitive exam questions.`,
  };

  return recommendations[difficulty];
}

/**
 * Adapt search query for a class level
 */
export function adaptSearchQuery(query: string, classLevel: ClassLevel): string {
  const classModifiers: Partial<Record<ClassLevel, string>> = {
    'Grade 5': ' kids animation simple easy',
    'Grade 8': ' middle school tutorial explained',
    'Grade 10': ' class 10 board exam explanation',
    'Grade 12': ' class 12 NEET JEE advanced concepts',
    'Undergraduate': ' university lecture advanced research',
  };

  return `${query}${classModifiers[classLevel] ?? ''}`;
}

/**
 * Estimate study time for a topic
 */
export function estimateStudyTime(topic: string, classLevel: ClassLevel): {
  videoHours: number;
  practiceHours: number;
  totalHours: number;
  breakdown: string;
} {
  const timeEstimates: Partial<Record<ClassLevel, number>> = {
    'Grade 5': 1,
    'Grade 8': 2,
    'Grade 10': 3,
    'Grade 12': 5,
    'Undergraduate': 8,
  };

  const videoHours = timeEstimates[classLevel] ?? 3;
  const practiceHours = Math.ceil(videoHours * 0.8);
  const totalHours = videoHours + practiceHours;

  return {
    videoHours,
    practiceHours,
    totalHours,
    breakdown: `${videoHours}h videos + ${practiceHours}h practice = ${totalHours}h total`,
  };
}

/**
 * Get achievement milestones for a class level
 */
export function getAchievementMilestones(classLevel: ClassLevel): string[] {
  const milestones: Partial<Record<ClassLevel, string[]>> = {
    'Grade 5': [
      'Complete 5 topics',
      'Watch 10 videos',
      'Score 80% on quiz',
      'Learn 25 concepts',
      'Complete study plan',
    ],
    'Grade 8': [
      'Master 10 topics',
      'Watch 30 videos',
      'Perfect score on quiz',
      'Learn 50 concepts',
      'Complete advanced path',
    ],
    'Grade 10': [
      'Master 15 topics',
      'Score 90%+ on exams',
      'Watch 50 videos',
      'Master mechanisms',
      'Prepare for board exam',
    ],
    'Grade 12': [
      'Complete all subjects',
      'Score 95%+ on tests',
      'Master problem-solving',
      'NEET/JEE preparation',
      'Competitive excellence',
    ],
    'Undergraduate': [
      'Master advanced concepts',
      'Research paper review',
      'Teaching capability',
      'Specialization mastery',
      'Publication ready',
    ],
  };

  return milestones[classLevel] || [];
}

/**
 * Validate if content is appropriate for class level
 */
export function isContentAppropriateForClass(content: string, classLevel: ClassLevel): boolean {
  // Simple heuristic: check content complexity
  const complexityScores: Partial<Record<ClassLevel, { min: number; max: number }>> = {
    'Grade 5': { min: 1, max: 3 },
    'Grade 8': { min: 2, max: 5 },
    'Grade 10': { min: 4, max: 7 },
    'Grade 12': { min: 6, max: 9 },
    'Undergraduate': { min: 7, max: 10 },
  };

  // Count advanced terminology as indicator of complexity
  const advancedTerms = (content.match(/formula|equation|theorem|hypothesis|mechanism|system|structure/gi) || []).length;
  const complexityScore = Math.min(10, Math.ceil(advancedTerms / 2));

  const range = complexityScores[classLevel] || { min: 4, max: 7 };
  return complexityScore >= range.min && complexityScore <= range.max;
}
