export type CoreSubject = 'Physics' | 'Chemistry' | 'Biology' | 'Mathematics';

export interface CourseUnit {
  title: string;
  topics: string[];
}

export interface CourseTrack {
  subject: CoreSubject;
  icon: string;
  color: string;
  description: string;
  units: Record<string, CourseUnit[]>;
}

export const CORE_COURSES: CourseTrack[] = [
  {
    subject: 'Physics',
    icon: 'fa-atom',
    color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/30',
    description: 'Forces, energy, motion, and the laws of the universe',
    units: {
      'Grade 5': [{ title: 'Introduction to Physics', topics: ['Force', 'Motion', 'Light', 'Sound', 'Magnetism'] }],
      'Grade 8': [{ title: 'Middle School Physics', topics: ['Force', 'Energy', 'Waves', 'Electricity', 'Pressure'] }],
      'Grade 10': [{ title: 'High School Physics', topics: ['Force', 'Newton\'s laws of motion', 'Work (physics)', 'Energy', 'Gravity', 'Kinematics'] }],
      'Grade 12': [{ title: 'Advanced Physics', topics: ['Thermodynamics', 'Optics', 'Magnetism', 'Modern Physics', 'Rotational dynamics'] }],
    },
  },
  {
    subject: 'Chemistry',
    icon: 'fa-flask',
    color: 'from-green-500/20 to-emerald-500/20 border-green-500/30',
    description: 'Atoms, reactions, and the building blocks of matter',
    units: {
      'Grade 5': [{ title: 'Matter Around Us', topics: ['States of matter', 'Water', 'Air', 'Mixtures'] }],
      'Grade 8': [{ title: 'Middle School Chemistry', topics: ['Atomic structure', 'Periodic table', 'Acids and bases', 'Chemical reactions'] }],
      'Grade 10': [{ title: 'High School Chemistry', topics: ['Atomic structure', 'Chemical bonding', 'Stoichiometry', 'Acid–base reaction', 'Redox'] }],
      'Grade 12': [{ title: 'Advanced Chemistry', topics: ['Organic Chemistry', 'Electrochemistry', 'Equilibrium', 'Thermochemistry'] }],
    },
  },
  {
    subject: 'Biology',
    icon: 'fa-dna',
    color: 'from-pink-500/20 to-rose-500/20 border-pink-500/30',
    description: 'Life, cells, genetics, and living systems',
    units: {
      'Grade 5': [{ title: 'Living World', topics: ['Life', 'Plant reproduction', 'Mammal', 'Bird', 'Photosynthesis'] }],
      'Grade 8': [{ title: 'Middle School Biology', topics: ['Cell (biology)', 'Human Body', 'Ecosystems', 'Photosynthesis', 'Respiration'] }],
      'Grade 10': [{ title: 'High School Biology', topics: ['Cell cycle', 'DNA', 'Genetics', 'Evolution', 'Photosynthesis'] }],
      'Grade 12': [{ title: 'Advanced Biology', topics: ['Genetics', 'Biotechnology', 'Human physiology', 'Ecology', 'Microbiology'] }],
    },
  },
  {
    subject: 'Mathematics',
    icon: 'fa-square-root-alt',
    color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/30',
    description: 'Numbers, algebra, geometry, and problem solving',
    units: {
      'Grade 5': [{ title: 'Primary Mathematics', topics: ['Fractions', 'Decimals', 'Geometry', 'Measurement', 'Data handling'] }],
      'Grade 8': [{ title: 'Middle School Maths', topics: ['Algebra', 'Linear equations', 'Geometry', 'Statistics', 'Ratio and proportion'] }],
      'Grade 10': [{ title: 'High School Maths', topics: ['Algebra', 'Geometry', 'Trigonometry', 'Statistics & Probability', 'Quadratic equations'] }],
      'Grade 12': [{ title: 'Advanced Mathematics', topics: ['Calculus', 'Linear Algebra', 'Probability', 'Differential equations', 'Complex Numbers'] }],
    },
  },
];

export function getCourseUnits(subject: CoreSubject, classLevel: string): CourseUnit[] {
  const track = CORE_COURSES.find((c) => c.subject === subject);
  if (!track) return [];
  if (track.units[classLevel]) return track.units[classLevel];
  const grade = parseInt(classLevel.replace(/\D/g, ''), 10) || 10;
  if (grade <= 5) return track.units['Grade 5'] || [];
  if (grade <= 8) return track.units['Grade 8'] || [];
  if (grade <= 10) return track.units['Grade 10'] || [];
  return track.units['Grade 12'] || track.units['Grade 10'] || [];
}
