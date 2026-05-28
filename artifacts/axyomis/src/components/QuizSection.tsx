import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { CheckCircle2, XCircle, BrainCircuit, ChevronRight, RefreshCw, Trophy, Target, ShieldAlert, Crosshair, Atom, FlaskConical, Dna, Layers, Lock } from 'lucide-react';
import allQuizData from '../data/axyomis_full_quiz.json';
import { voiceService } from '../services/voice';
import { useUser } from '../context/UserContext';
import { UpgradeModal } from './UpgradeModal';

const FREE_DAILY_LIMIT = 5;

function getDailyQuizCount(): number {
  const key = `axyomis_quiz_day_${new Date().toISOString().slice(0, 10)}`;
  return parseInt(localStorage.getItem(key) ?? '0', 10);
}

function incrementDailyQuizCount(): void {
  const key = `axyomis_quiz_day_${new Date().toISOString().slice(0, 10)}`;
  localStorage.setItem(key, String(getDailyQuizCount() + 1));
}

interface QuizQuestion {
  id: string;
  category: string;
  subcategory: string;
  difficulty: "entry-level" | "mid-tier" | "advanced";
  question: string;
  options: string[];
  correct_index: number;
  explanation: string;
}

type Difficulty = "kids" | "entry-level" | "mid-tier" | "advanced";
type Subject = "physics" | "chemistry" | "biology" | "all";

interface SessionResult {
  id: string;
  correct: boolean;
  explanation: string;
  userChoice: number | null;
  questionText: string;
}

const MathJaxText: React.FC<{ content?: string; className?: string }> = ({ content, className }) => {
  const containerRef = React.useRef<HTMLDivElement>(null);
  const displayContent = content || 'No rationale available.';

  useEffect(() => {
    if (containerRef.current && (window as any).MathJax?.typesetPromise) {
      (window as any).MathJax.typesetPromise([containerRef.current]);
    }
  }, [displayContent]);

  return <div ref={containerRef} className={className}>{displayContent}</div>;
};

export const QuizSection: React.FC = () => {
  const { isPremium, isTrialActive } = useUser() as any;
  const isUnlimited = isPremium || isTrialActive;
  const [showQuizUpgrade, setShowQuizUpgrade] = useState(false);
  const [dailyCount, setDailyCount] = useState(getDailyQuizCount);
  const [gameActive, setGameActive] = useState(false);
  const [showReport, setShowReport] = useState(false);
  const [questions, setQuestions] = useState<QuizQuestion[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [selectedOption, setSelectedOption] = useState<number | null>(null);
  const [isAnswered, setIsAnswered] = useState(false);
  const [score, setScore] = useState(0);
  const [timeLeft, setTimeLeft] = useState(15);
  const [sessionResults, setSessionResults] = useState<SessionResult[]>([]);

  const currentQ = questions[currentIndex];

  const [setupPhase, setSetupPhase] = useState<'resume' | 'difficulty' | 'subject' | 'count' | 'none'>('difficulty');
  const [selectedDiff, setSelectedDiff] = useState<Difficulty | null>(null);
  const [selectedSubject, setSelectedSubject] = useState<Subject | null>(null);

  const [playedIds, setPlayedIds] = useState<Set<string>>(() => {
    const saved = localStorage.getItem('axyomis_played_ids');
    return saved ? new Set(JSON.parse(saved)) : new Set();
  });

  useEffect(() => {
    localStorage.setItem('axyomis_played_ids', JSON.stringify(Array.from(playedIds)));
  }, [playedIds]);

  useEffect(() => {
    if (localStorage.getItem('axyomis_active_session')) {
      setSetupPhase('resume');
    }
  }, []);

  useEffect(() => {
    let timer: ReturnType<typeof setTimeout>;
    if (gameActive && !showReport && !isAnswered && timeLeft > 0) {
      timer = setTimeout(() => {
        setTimeLeft(t => t - 1);
      }, 1000);
    } else if (gameActive && !showReport && !isAnswered && timeLeft === 0 && currentQ) {
      setIsAnswered(true);
      setSessionResults(prev => [...prev, {
        id: currentQ.id,
        correct: false,
        explanation: currentQ.explanation,
        userChoice: null,
        questionText: currentQ.question
      }]);
    }
    return () => clearTimeout(timer);
  }, [gameActive, showReport, isAnswered, timeLeft, currentQ]);

  useEffect(() => {
    if (gameActive && !showReport) {
      localStorage.setItem('axyomis_active_session', JSON.stringify({
        questions,
        currentIndex,
        score,
        isAnswered,
        selectedOption,
        timeLeft,
        sessionResults
      }));
    } else {
      localStorage.removeItem('axyomis_active_session');
    }
  }, [gameActive, showReport, questions, currentIndex, score, isAnswered, selectedOption, timeLeft, sessionResults]);

  const resumeSession = () => {
    const saved = localStorage.getItem('axyomis_active_session');
    if (saved) {
      const parsed = JSON.parse(saved);
      setQuestions(parsed.questions);
      setCurrentIndex(parsed.currentIndex);
      setScore(parsed.score);
      setIsAnswered(parsed.isAnswered);
      setSelectedOption(parsed.selectedOption);
      setTimeLeft(parsed.timeLeft ?? 15);
      setSessionResults(parsed.sessionResults ?? []);
      setGameActive(true);
      setShowReport(false);
      setSetupPhase('none');
    }
  };

  const clearSessionAndStartNew = () => {
    localStorage.removeItem('axyomis_active_session');
    setSetupPhase('difficulty');
  };

  const handleSelectDifficulty = (diff: Difficulty) => {
    setSelectedDiff(diff);
    setSetupPhase('subject');
  };

  const handleSelectSubject = (subj: Subject) => {
    setSelectedSubject(subj);
    setSetupPhase('count');
  };

  const handleSelectCount = (count: number) => {
    startGame(selectedDiff!, selectedSubject!, count);
  };

  const startGame = (difficulty: Difficulty, subject: Subject, count: number) => {
    if (!isUnlimited && dailyCount >= FREE_DAILY_LIMIT) {
      setShowQuizUpgrade(true);
      return;
    }
    if (!isUnlimited) {
      incrementDailyQuizCount();
      setDailyCount(getDailyQuizCount());
    }
    let pool = (allQuizData as QuizQuestion[]).filter(q => q.difficulty === difficulty);
    if (subject !== "all") {
      pool = pool.filter(q => q.category.toLowerCase() === subject);
    }
    
    // Fallback if no questions for this difficulty/subject pair
    if (pool.length === 0) {
      pool = (allQuizData as QuizQuestion[]).filter(q => q.category.toLowerCase() === subject);
      if (pool.length === 0) pool = allQuizData as QuizQuestion[];
    }

    const shuffleArray = <T,>(array: T[]): T[] => {
      const arr = [...array];
      for (let i = arr.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [arr[i], arr[j]] = [arr[j], arr[i]];
      }
      return arr;
    };

    const unseen = shuffleArray(pool.filter(q => !playedIds.has(q.id)));
    const seen = shuffleArray(pool.filter(q => playedIds.has(q.id)));
    
    const available = [...unseen, ...seen];
    const selectedMods = available.slice(0, count);

    setPlayedIds(prev => {
      const newSet = new Set(prev);
      selectedMods.forEach(q => newSet.add(q.id));
      return newSet;
    });

    setQuestions(selectedMods);
    setCurrentIndex(0);
    setSelectedOption(null);
    setIsAnswered(false);
    setScore(0);
    setTimeLeft(15);
    setSessionResults([]);
    setShowReport(false);
    setGameActive(true);
    setSetupPhase('none');
    voiceService.speak(`Initializing diagnostic evaluation in ${difficulty} tier. Prepare for synchronization.`);
  };

  const handleOptionClick = (index: number) => {
    if (isAnswered || timeLeft === 0) return;
    setSelectedOption(index);
    setIsAnswered(true);
    
    const correct = index === questions[currentIndex].correct_index;
    if (correct) {
      setScore(s => s + 1);
      voiceService.speak("Node verified. Correct deduction.");
    } else {
      voiceService.speak("Signal mismatch. Incorrect analysis.");
    }
    
    setSessionResults(prev => [...prev, {
      id: currentQ.id,
      correct,
      explanation: currentQ.explanation,
      userChoice: index,
      questionText: currentQ.question
    }]);
  };

  const handleNext = () => {
    if (currentIndex < questions.length - 1) {
      setCurrentIndex(c => c + 1);
      setSelectedOption(null);
      setIsAnswered(false);
      setTimeLeft(15);
    } else {
      setShowReport(true);
    }
  };

  const resetQuiz = () => {
    setGameActive(false);
    setShowReport(false);
    setQuestions([]);
    setSetupPhase('difficulty');
    localStorage.removeItem('axyomis_active_session');
  };

  const getDifficultyColor = (diff: string) => {
    switch(diff) {
      case 'advanced': return 'text-purple-400 border-purple-400/30 bg-purple-400/10';
      case 'mid-tier': return 'text-blue-400 border-blue-400/30 bg-blue-400/10';
      case 'entry-level': return 'text-emerald-400 border-emerald-400/30 bg-emerald-400/10';
      case 'kids': return 'text-yellow-400 border-yellow-400/30 bg-yellow-400/10';
      default: return 'text-slate-400 border-slate-400/30 bg-slate-400/10';
    }
  };

  return (
    <section id="evaluation-quiz" className="max-w-4xl mx-auto px-4 sm:px-8 mb-32 relative z-10">
      <UpgradeModal
        open={showQuizUpgrade}
        onClose={() => setShowQuizUpgrade(false)}
        featureName="Unlimited Quizzes"
        requiredTier="scholar"
        description="removes the 5-quiz daily limit so you can practice as much as you need, every day."
      />
      <div className="text-center mb-10">
        <h2 className="text-4xl sm:text-5xl font-bold uppercase tracking-widest mb-4">
          Evaluation <span className="text-[var(--accent)]">Quiz</span>
        </h2>
        <p className="text-[#8b8b93] max-w-2xl mx-auto">
          Test your conceptual and analytical framework across high-tier science disciplines.
        </p>
        {!isUnlimited && (
          <div className="mt-3 inline-flex items-center gap-2 px-4 py-1.5 rounded-full bg-amber-500/10 border border-amber-500/20">
            <Lock className="w-3 h-3 text-amber-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-amber-400">
              {Math.max(0, FREE_DAILY_LIMIT - dailyCount)} of {FREE_DAILY_LIMIT} free quizzes remaining today
            </span>
          </div>
        )}
      </div>

      <div className="bg-[#0d0d10a6] p-8 md:p-12 border border-white/10 rounded-[32px] shadow-2xl backdrop-blur-xl relative overflow-hidden min-h-[500px] flex flex-col justify-center">
        <AnimatePresence mode="wait">
          {!gameActive && !showReport && (
            <motion.div 
              key="setup-phase"
              initial={{ opacity: 0, filter: 'blur(10px)', y: 20 }}
              animate={{ opacity: 1, filter: 'blur(0px)', y: 0 }}
              exit={{ opacity: 0, filter: 'blur(10px)', y: -20 }}
              transition={{ duration: 0.5, ease: "easeOut" }}
              className="flex flex-col items-center placeholder-data w-full"
            >
              <AnimatePresence mode="wait">
                {setupPhase === 'resume' && (
                  <motion.div
                    key="resume"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="text-center w-full"
                  >
                    <BrainCircuit className="w-16 h-16 text-[var(--accent)] mx-auto mb-6" />
                    <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Active Session Detected</h3>
                    <p className="text-slate-400 text-sm mb-8">You have an incomplete diagnostic quiz. Resume or initialize a new sequence.</p>
                    <div className="flex gap-4 justify-center">
                      <button onClick={resumeSession} className="px-6 py-3 bg-[var(--accent)] text-black rounded-full font-bold uppercase tracking-widest text-sm hover:scale-105 transition-transform">Resume Quiz</button>
                      <button onClick={clearSessionAndStartNew} className="px-6 py-3 border border-white/20 text-white rounded-full font-bold uppercase tracking-widest text-sm hover:bg-white/10 transition-colors">Start New</button>
                    </div>
                  </motion.div>
                )}

                {setupPhase === 'difficulty' && (
                  <motion.div
                    key="difficulty"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    exit={{ opacity: 0, scale: 0.95 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center w-full"
                  >
                    <div className="mb-10 text-center">
                      <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Step 1: Select Difficulty</h3>
                      <p className="text-slate-400 text-sm">Choose your evaluation tier.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 w-full max-w-5xl">
                  <button 
                    onClick={() => handleSelectDifficulty('kids')}
                    className="group p-8 rounded-3xl border border-yellow-500/20 bg-yellow-500/5 hover:bg-yellow-500/10 hover:border-yellow-500/50 transition-all flex flex-col items-center text-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-yellow-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Target className="w-8 h-8 text-yellow-400" />
                    </div>
                    <h4 className="text-lg font-bold text-yellow-300 uppercase tracking-widest mb-2">Kids</h4>
                    <p className="text-sm text-slate-400 font-light leading-relaxed">Simple concepts and fun facts for young minds.</p>
                  </button>

                  <button 
                    onClick={() => handleSelectDifficulty('entry-level')}
                    className="group p-8 rounded-3xl border border-emerald-500/20 bg-emerald-500/5 hover:bg-emerald-500/10 hover:border-emerald-500/50 transition-all flex flex-col items-center text-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-emerald-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Target className="w-8 h-8 text-emerald-400" />
                    </div>
                    <h4 className="text-lg font-bold text-emerald-300 uppercase tracking-widest mb-2">Entry-Level</h4>
                    <p className="text-sm text-slate-400 font-light leading-relaxed">Conceptual foundations and primary mechanisms.</p>
                  </button>

                  <button 
                    onClick={() => handleSelectDifficulty('mid-tier')}
                    className="group p-8 rounded-3xl border border-blue-500/20 bg-blue-500/5 hover:bg-blue-500/10 hover:border-blue-500/50 transition-all flex flex-col items-center text-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-blue-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <Crosshair className="w-8 h-8 text-blue-400" />
                    </div>
                    <h4 className="text-lg font-bold text-blue-300 uppercase tracking-widest mb-2">Mid-Tier</h4>
                    <p className="text-sm text-slate-400 font-light leading-relaxed">Operational application and systemic synthesis.</p>
                  </button>

                  <button 
                    onClick={() => handleSelectDifficulty('advanced')}
                    className="group p-8 rounded-3xl border border-purple-500/20 bg-purple-500/5 hover:bg-purple-500/10 hover:border-purple-500/50 transition-all flex flex-col items-center text-center cursor-pointer"
                  >
                    <div className="w-16 h-16 rounded-full bg-purple-500/20 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                      <ShieldAlert className="w-8 h-8 text-purple-400" />
                    </div>
                    <h4 className="text-lg font-bold text-purple-300 uppercase tracking-widest mb-2">Advanced</h4>
                    <p className="text-sm text-slate-400 font-light leading-relaxed">Complex derivations and edge-case analytical operations.</p>
                  </button>
                </div>
                  </motion.div>
                )}

                {setupPhase === 'subject' && (
                  <motion.div
                    key="subject"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center w-full"
                  >
                    <div className="mb-10 text-center">
                      <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Step 2: Select Discipline</h3>
                      <p className="text-slate-400 text-sm">Focus your diagnostics or run a hybrid quiz.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 w-full max-w-2xl">
                  {['physics', 'chemistry', 'biology', 'all'].map(subj => {
                    const subjectIcons: Record<string, React.FC<any>> = { physics: Atom, chemistry: FlaskConical, biology: Dna, all: Layers };
                    const Icon = subjectIcons[subj];
                    return (
                      <button 
                        key={subj}
                        onClick={() => handleSelectSubject(subj as Subject)}
                        className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[var(--accent)] transition-all uppercase tracking-widest font-bold text-slate-300 hover:text-white flex flex-row items-center justify-center gap-4 text-center group cursor-pointer"
                      >
                        <Icon className="w-8 h-8 text-[var(--accent)] group-hover:scale-110 transition-transform" />
                        <span>{subj === 'all' ? 'Hybrid Quiz (All)' : subj}</span>
                      </button>
                    );
                  })}
                </div>
                <button 
                  onClick={() => setSetupPhase('difficulty')} 
                  className="mt-8 text-xs text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to Tier Selection
                </button>
                  </motion.div>
                )}

                {setupPhase === 'count' && (
                  <motion.div
                    key="count"
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.4 }}
                    className="flex flex-col items-center w-full"
                  >
                    <div className="mb-10 text-center">
                      <h3 className="text-2xl font-bold text-white mb-2 uppercase tracking-wide">Step 3: Select Quiz Length</h3>
                      <p className="text-slate-400 text-sm">Choose how many questions you want for this round.</p>
                    </div>
                    
                    <div className="grid grid-cols-1 sm:grid-cols-3 gap-6 w-full max-w-2xl">
                  {[5, 10, 15].map(count => (
                    <button 
                       key={count}
                       onClick={() => handleSelectCount(count)}
                       className="p-8 rounded-2xl border border-white/10 bg-white/5 hover:bg-white/10 hover:border-[var(--accent)] transition-all flex flex-col items-center text-center group cursor-pointer"
                    >
                       <div className="w-16 h-16 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-6 group-hover:scale-110 transition-transform">
                          <Layers className="w-8 h-8 text-[var(--accent)]" />
                       </div>
                       <h4 className="text-xl font-bold text-white mb-2">{count} Questions</h4>
                       <p className="text-sm text-slate-400 font-light">Short and focused assessment.</p>
                    </button>
                  ))}
                </div>
                <button 
                  onClick={() => setSetupPhase('subject')} 
                  className="mt-8 text-xs text-slate-500 hover:text-white uppercase tracking-widest flex items-center gap-2"
                >
                  <ChevronRight className="w-4 h-4 rotate-180" /> Back to Discipline Selection
                </button>
                  </motion.div>
                )}
              </AnimatePresence>
            </motion.div>
          )}

          {gameActive && showReport && (
            <motion.div 
              key="report-phase"
              initial={{ opacity: 0, scale: 0.95, filter: 'blur(8px)' }}
              animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
              exit={{ opacity: 0, scale: 1.05, filter: 'blur(8px)' }}
              transition={{ duration: 0.6, ease: [0.16, 1, 0.3, 1] }}
              className="flex flex-col items-center text-center w-full"
            >
            <div className="w-24 h-24 rounded-full bg-[var(--accent)]/10 flex items-center justify-center mb-8 border border-[var(--accent)]/30">
              <Trophy className="w-12 h-12 text-[var(--accent)]" />
            </div>
            <h3 className="text-4xl font-bold text-white uppercase tracking-widest mb-2">Evaluation Report</h3>
            <p className="text-slate-400 mb-10 text-lg">Diagnostics successfully registered into Axyomis quiz.</p>

            <div className="flex gap-12 mb-12 bg-white/5 p-8 rounded-3xl border border-white/10 w-full max-w-2xl justify-center">
              <div className="text-center">
                <div className="text-5xl font-black text-white mb-2">{score} <span className="text-2xl text-slate-500">/ {questions.length}</span></div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Total Integrity</div>
              </div>
              <div className="w-px bg-white/10"></div>
              <div className="text-center">
                <div className="text-5xl font-black text-[#var(--accent)] mb-2">{Math.round((score / questions.length) * 100)}%</div>
                <div className="text-[10px] font-bold text-slate-500 uppercase tracking-widest">Accuracy Ratio</div>
              </div>
            </div>

            {sessionResults.filter(r => !r.correct).length > 0 && (
              <div className="w-full max-w-3xl mb-12 text-left">
                <h4 className="text-xl font-bold text-white mb-6 uppercase tracking-widest border-b border-white/10 pb-4">Diagnostic Deviations</h4>
                <div className="flex flex-col gap-4">
                  {sessionResults.filter(r => !r.correct).map((res, i) => (
                    <div key={i} className="bg-red-500/5 border border-red-500/20 p-6 rounded-2xl">
                      <p className="text-sm text-slate-300 font-medium mb-4 leading-relaxed">{res.questionText}</p>
                      <div className="bg-black/30 p-4 rounded-xl border border-white/5">
                        <span className="text-xs text-red-400 font-bold uppercase tracking-widest mb-2 block">Correction</span>
                        <MathJaxText className="text-sm text-slate-400 font-light" content={res.explanation} />
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            )}

            <button 
              onClick={resetQuiz}
              className="flex items-center gap-3 px-8 py-4 bg-white hover:bg-slate-200 text-black rounded-full font-bold uppercase tracking-widest text-sm transition-all shadow-[0_0_20px_rgba(255,255,255,0.2)] hover:shadow-[0_0_30px_rgba(255,255,255,0.4)]"
            >
              <RefreshCw className="w-5 h-5" /> Initialize New Sequence
            </button>
          </motion.div>
        )}

        {gameActive && !showReport && currentQ && (
          <motion.div
            key="game-phase"
            initial={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
            animate={{ opacity: 1, scale: 1, filter: 'blur(0px)' }}
            exit={{ opacity: 0, scale: 0.98, filter: 'blur(5px)' }}
            transition={{ duration: 0.5, ease: "easeOut" }}
            className="w-full flex-1 flex flex-col"
          >
            {/* Progress Bar */}
            <div className="absolute top-0 left-0 h-1 bg-white/5 w-full">
              <motion.div 
                className="h-full bg-[var(--accent)]"
                initial={{ width: 0 }}
                animate={{ width: `${((currentIndex) / questions.length) * 100}%` }}
                transition={{ duration: 0.3 }}
              />
            </div>

            <div className="flex justify-between items-center mb-8 border-b border-white/5 pb-6 mt-4">
              <div className="flex items-center gap-3">
                <BrainCircuit className="w-6 h-6 text-[var(--accent)]" />
                <span className="font-mono text-sm tracking-[0.2em] uppercase text-slate-400">
                  Module {currentIndex + 1} / {questions.length}
                </span>
              </div>
              <div className="flex items-center gap-6">
                <div className={`text-xs font-black tracking-widest uppercase flex items-center gap-2 ${timeLeft <= 5 && !isAnswered ? 'text-red-400 animate-pulse' : 'text-slate-500'}`}>
                  <span>Time:</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-white font-mono">{timeLeft}s</span>
                </div>
                <div className="text-xs font-black tracking-widest uppercase flex items-center gap-2">
                  <span className="text-slate-500">Integrity:</span>
                  <span className="bg-white/10 px-3 py-1 rounded-full text-white font-mono">{score}</span>
                </div>
              </div>
            </div>

            <AnimatePresence mode="wait">
              <motion.div
                key={currentQ.id}
                initial={{ opacity: 0, y: 15, filter: 'blur(4px)' }}
                animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                exit={{ opacity: 0, y: -15, filter: 'blur(4px)' }}
                transition={{ duration: 0.4, ease: [0.25, 1, 0.5, 1] }}
                className="flex-1 flex flex-col"
              >
                {/* Meta Tags */}
                <div className="flex flex-wrap gap-2 mb-6">
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-slate-300">
                    {currentQ.category.replace('_', ' ')}
                  </span>
                  <span className="px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest bg-white/5 border border-white/10 text-slate-400">
                    {currentQ.subcategory.replace('_', ' ')}
                  </span>
                  <span className={`px-3 py-1 rounded-full text-[10px] font-bold uppercase tracking-widest border ${getDifficultyColor(currentQ.difficulty)}`}>
                    {currentQ.difficulty}
                  </span>
                </div>

                {/* Question */}
                <h3 className="text-2xl font-medium text-white leading-relaxed mb-8">
                  {currentQ.question}
                </h3>

                {/* Options */}
                <div className="grid grid-cols-1 gap-3 mt-auto">
                  {currentQ.options.map((option, idx) => {
                    const isSelected = selectedOption === idx;
                    const isCorrect = idx === currentQ.correct_index;
                    
                    let optionClasses = "p-5 border rounded-2xl text-left transition-all flex items-center gap-4 group cursor-pointer relative overflow-hidden ";
                    
                    if (!isAnswered) {
                      optionClasses += "border-white/10 bg-white/5 hover:bg-white/10 hover:border-white/20 text-slate-300";
                    } else if (isCorrect) {
                      optionClasses += "border-emerald-500/50 bg-emerald-500/10 text-emerald-200 z-10 scale-[1.02] shadow-[0_0_30px_rgba(16,185,129,0.15)]";
                    } else if (isSelected && !isCorrect) {
                      optionClasses += "border-red-500/50 bg-red-500/10 text-red-200";
                    } else {
                      optionClasses += "border-white/5 bg-white/5 text-slate-500 opacity-50";
                    }

                    return (
                      <button 
                        key={idx}
                        onClick={() => handleOptionClick(idx)}
                        disabled={isAnswered}
                        className={optionClasses}
                      >
                        <div className={`w-6 h-6 rounded-full flex items-center justify-center border text-[10px] font-black shrink-0
                          ${!isAnswered ? 'border-white/20 text-slate-500 group-hover:border-white/40 group-hover:text-slate-300' 
                            : isCorrect ? 'border-emerald-500 bg-emerald-500 text-black'
                            : isSelected && !isCorrect ? 'border-red-500 bg-red-500 text-white'
                            : 'border-white/10 text-slate-600'
                          }
                        `}>
                          {String.fromCharCode(65 + idx)}
                        </div>
                        <span className="flex-1 font-light leading-snug">{option}</span>
                        
                        {isAnswered && isCorrect && <CheckCircle2 className="w-5 h-5 text-emerald-400 shrink-0 absolute right-6" />}
                        {isAnswered && isSelected && !isCorrect && <XCircle className="w-5 h-5 text-red-400 shrink-0 absolute right-6" />}
                      </button>
                    );
                  })}
                </div>

                {/* Explanation & Next action */}
                {isAnswered && (
                  <motion.div 
                    initial={{ opacity: 0, y: 20, filter: 'blur(4px)' }}
                    animate={{ opacity: 1, y: 0, filter: 'blur(0px)' }}
                    transition={{ duration: 0.5, ease: [0.16, 1, 0.3, 1] }}
                    className="mt-6 pt-6 border-t border-white/10 flex flex-col sm:flex-row gap-6 items-start sm:items-center justify-between"
                  >
                    <div className="bg-blue-500/5 border border-blue-500/10 rounded-2xl p-6 flex-1">
                      <h4 className="text-[10px] font-black uppercase tracking-[0.2em] text-blue-400 mb-3 flex items-center gap-2">
                        <BrainCircuit className="w-3 h-3" /> Synthesis Rationale
                      </h4>
                      <MathJaxText className="text-sm text-blue-100/70 leading-relaxed font-light" content={currentQ.explanation} />
                    </div>

                    <div className="shrink-0">
                      {currentIndex < questions.length - 1 ? (
                        <button 
                          onClick={handleNext}
                          className="flex items-center gap-3 px-6 py-4 bg-[var(--accent)] hover:bg-[var(--accent-hover)] text-black rounded-full font-bold uppercase tracking-widest text-sm transition-all"
                        >
                          Proceed <ChevronRight className="w-4 h-4" />
                        </button>
                      ) : (
                        <button 
                          onClick={handleNext}
                          className="flex items-center gap-3 px-6 py-4 bg-white hover:bg-slate-200 text-black rounded-full font-bold uppercase tracking-widest text-sm transition-all"
                        >
                          <RefreshCw className="w-4 h-4" /> Generate Report
                        </button>
                      )}
                    </div>
                  </motion.div>
                )}
              </motion.div>
            </AnimatePresence>
          </motion.div>
        )}
        </AnimatePresence>
      </div>
    </section>
  );
};
