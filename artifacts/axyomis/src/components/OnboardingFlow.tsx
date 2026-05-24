import React, { useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { ChevronRight, ChevronLeft, GraduationCap, BookOpen, Atom, FlaskConical, Dna, Telescope, Brain, Calculator, Check, User, Mail, MessageCircle, Sparkles } from 'lucide-react';
import { useUser, ClassLevel, Subject, ParentInfo } from '../context/UserContext';

const SUBJECTS: { id: Subject; icon: React.ReactNode; color: string; desc: string }[] = [
  { id: 'Science', icon: <Atom className="w-6 h-6" />, color: 'from-cyan-500/20 to-blue-500/20 border-cyan-500/40', desc: 'General sciences' },
  { id: 'Mathematics', icon: <Calculator className="w-6 h-6" />, color: 'from-purple-500/20 to-indigo-500/20 border-purple-500/40', desc: 'Algebra, calculus & more' },
  { id: 'Chemistry', icon: <FlaskConical className="w-6 h-6" />, color: 'from-green-500/20 to-emerald-500/20 border-green-500/40', desc: 'Reactions & molecules' },
  { id: 'Physics', icon: <Sparkles className="w-6 h-6" />, color: 'from-yellow-500/20 to-orange-500/20 border-yellow-500/40', desc: 'Forces & energy' },
  { id: 'Biology', icon: <Dna className="w-6 h-6" />, color: 'from-pink-500/20 to-rose-500/20 border-pink-500/40', desc: 'Life & living systems' },
  { id: 'Astronomy', icon: <Telescope className="w-6 h-6" />, color: 'from-indigo-500/20 to-violet-500/20 border-indigo-500/40', desc: 'Stars, planets & cosmos' },
  { id: 'AI & Computer Science', icon: <Brain className="w-6 h-6" />, color: 'from-teal-500/20 to-cyan-500/20 border-teal-500/40', desc: 'Algorithms & AI' },
];

const CLASS_GROUPS = [
  {
    label: 'Primary School',
    range: 'Grades 1 – 5',
    grades: ['Grade 1', 'Grade 2', 'Grade 3', 'Grade 4', 'Grade 5'] as ClassLevel[],
    color: 'from-green-500/10 to-emerald-500/10 border-green-500/30',
    glow: 'shadow-green-500/20',
    icon: '🌱',
  },
  {
    label: 'Middle School',
    range: 'Grades 6 – 8',
    grades: ['Grade 6', 'Grade 7', 'Grade 8'] as ClassLevel[],
    color: 'from-blue-500/10 to-cyan-500/10 border-blue-500/30',
    glow: 'shadow-blue-500/20',
    icon: '📚',
  },
  {
    label: 'High School',
    range: 'Grades 9 – 12',
    grades: ['Grade 9', 'Grade 10', 'Grade 11', 'Grade 12'] as ClassLevel[],
    color: 'from-purple-500/10 to-violet-500/10 border-purple-500/30',
    glow: 'shadow-purple-500/20',
    icon: '🎓',
  },
  {
    label: 'Higher Education',
    range: 'College & beyond',
    grades: ['Undergraduate', 'Postgraduate'] as ClassLevel[],
    color: 'from-amber-500/10 to-orange-500/10 border-amber-500/30',
    glow: 'shadow-amber-500/20',
    icon: '🏛️',
  },
];

interface OnboardingFlowProps {
  isOpen: boolean;
  onClose: () => void;
}

export const OnboardingFlow: React.FC<OnboardingFlowProps> = ({ isOpen, onClose }) => {
  const { completeOnboarding, uid } = useUser();
  const [step, setStep] = useState(0);
  const [selectedClass, setSelectedClass] = useState<ClassLevel | null>(null);
  const [selectedSubjects, setSelectedSubjects] = useState<Subject[]>([]);
  const [parentName, setParentName] = useState('');
  const [parentEmail, setParentEmail] = useState('');
  const [parentWhatsApp, setParentWhatsApp] = useState('');
  const [saving, setSaving] = useState(false);

  const toggleSubject = (s: Subject) => {
    setSelectedSubjects(prev =>
      prev.includes(s) ? prev.filter(x => x !== s) : [...prev, s]
    );
  };

  const handleFinish = async () => {
    if (!selectedClass || selectedSubjects.length === 0) return;
    setSaving(true);
    const parentInfo: ParentInfo | undefined =
      parentName || parentEmail || parentWhatsApp
        ? { name: parentName, email: parentEmail, whatsapp: parentWhatsApp }
        : undefined;
    await completeOnboarding({ classLevel: selectedClass, subjects: selectedSubjects, parentInfo });
    setSaving(false);
    onClose();
  };

  const steps = ['Class Level', 'Subjects', 'Parent Info'];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <div className="fixed inset-0 z-[200] flex items-center justify-center p-4">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="absolute inset-0 bg-black/80 backdrop-blur-md"
        />
        <motion.div
          initial={{ scale: 0.92, opacity: 0, y: 20 }}
          animate={{ scale: 1, opacity: 1, y: 0 }}
          exit={{ scale: 0.92, opacity: 0, y: 20 }}
          transition={{ type: 'spring', stiffness: 300, damping: 28 }}
          className="relative w-full max-w-2xl bg-[#08090e] border border-white/10 rounded-3xl shadow-2xl overflow-hidden"
        >
          {/* Ambient glow */}
          <div className="absolute top-0 left-1/2 -translate-x-1/2 w-96 h-40 bg-cyan-500/10 blur-[80px] rounded-full pointer-events-none" />

          {/* Header */}
          <div className="px-8 pt-8 pb-4 relative z-10">
            <div className="flex items-center gap-3 mb-2">
              <div className="w-8 h-8 rounded-xl bg-cyan-500/10 border border-cyan-500/30 flex items-center justify-center">
                <GraduationCap className="w-4 h-4 text-cyan-400" />
              </div>
              <div>
                <h2 className="text-white font-black uppercase tracking-wider text-sm">Personalize Your Experience</h2>
                <p className="text-slate-500 text-[10px] uppercase tracking-widest">Step {step + 1} of {steps.length}</p>
              </div>
            </div>

            {/* Progress */}
            <div className="flex gap-2 mt-4">
              {steps.map((s, i) => (
                <div key={s} className="flex-1 flex flex-col gap-1">
                  <div className={`h-0.5 rounded-full transition-all duration-500 ${i <= step ? 'bg-cyan-500' : 'bg-white/10'}`} />
                  <span className={`text-[9px] font-bold uppercase tracking-widest transition-colors ${i === step ? 'text-cyan-400' : 'text-slate-600'}`}>{s}</span>
                </div>
              ))}
            </div>
          </div>

          {/* Content */}
          <div className="px-8 pb-8 relative z-10 min-h-[360px]">
            <AnimatePresence mode="wait">
              {step === 0 && (
                <motion.div key="step0" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h3 className="text-lg font-bold text-white mb-1 mt-2">What's your class level?</h3>
                  <p className="text-slate-500 text-xs mb-5">Your AI tutor will adapt all content to your level.</p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {CLASS_GROUPS.map(group => (
                      <div key={group.label} className={`rounded-2xl border bg-gradient-to-br ${group.color} p-4 space-y-2`}>
                        <div className="flex items-center gap-2 mb-2">
                          <span className="text-xl">{group.icon}</span>
                          <div>
                            <div className="text-xs font-bold text-white">{group.label}</div>
                            <div className="text-[10px] text-slate-500">{group.range}</div>
                          </div>
                        </div>
                        <div className="flex flex-wrap gap-1.5">
                          {group.grades.map(g => (
                            <button
                              key={g}
                              onClick={() => setSelectedClass(g)}
                              className={`px-3 py-1.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all border ${selectedClass === g ? 'bg-cyan-500 border-cyan-400 text-black shadow-lg shadow-cyan-500/30' : 'bg-white/5 border-white/10 text-slate-400 hover:border-white/30'}`}
                            >
                              {g.replace('Grade ', 'G')}
                            </button>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 1 && (
                <motion.div key="step1" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h3 className="text-lg font-bold text-white mb-1 mt-2">Choose your subjects</h3>
                  <p className="text-slate-500 text-xs mb-5">Pick one or more — your AI tutor covers all of them.</p>
                  <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                    {SUBJECTS.map(s => (
                      <button
                        key={s.id}
                        onClick={() => toggleSubject(s.id)}
                        className={`relative rounded-2xl border bg-gradient-to-br ${s.color} p-4 text-left transition-all duration-200 ${selectedSubjects.includes(s.id) ? 'scale-[1.02] shadow-lg' : 'hover:scale-[1.01]'}`}
                      >
                        {selectedSubjects.includes(s.id) && (
                          <div className="absolute top-2 right-2 w-5 h-5 bg-cyan-500 rounded-full flex items-center justify-center">
                            <Check className="w-3 h-3 text-black" />
                          </div>
                        )}
                        <div className="text-cyan-400 mb-2">{s.icon}</div>
                        <div className="text-[11px] font-black text-white uppercase tracking-wider">{s.id}</div>
                        <div className="text-[10px] text-slate-500 mt-0.5">{s.desc}</div>
                      </button>
                    ))}
                  </div>
                </motion.div>
              )}

              {step === 2 && (
                <motion.div key="step2" initial={{ opacity: 0, x: 30 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -30 }}>
                  <h3 className="text-lg font-bold text-white mb-1 mt-2">Add Parent / Guardian Info</h3>
                  <p className="text-slate-500 text-xs mb-5">
                    Optional — enables daily progress reports sent directly to parents.
                    <span className="text-cyan-400 ml-1 font-bold">Premium feature</span>
                  </p>
                  <div className="space-y-4">
                    {[
                      { icon: <User className="w-4 h-4" />, placeholder: "Parent / Guardian full name", value: parentName, onChange: setParentName },
                      { icon: <Mail className="w-4 h-4" />, placeholder: "Parent email address", value: parentEmail, onChange: setParentEmail },
                      { icon: <MessageCircle className="w-4 h-4" />, placeholder: "WhatsApp number (with country code)", value: parentWhatsApp, onChange: setParentWhatsApp },
                    ].map((field, i) => (
                      <div key={i} className="flex items-center gap-3 bg-white/3 border border-white/10 rounded-2xl px-4 py-3 focus-within:border-cyan-500/40 transition-colors">
                        <div className="text-slate-500">{field.icon}</div>
                        <input
                          type="text"
                          placeholder={field.placeholder}
                          value={field.value}
                          onChange={e => field.onChange(e.target.value)}
                          className="flex-1 bg-transparent text-white text-sm outline-none placeholder:text-slate-600"
                        />
                      </div>
                    ))}
                    <div className="mt-4 p-4 rounded-2xl bg-cyan-500/5 border border-cyan-500/20">
                      <p className="text-[10px] text-cyan-400/70 font-bold uppercase tracking-widest">
                        🔒 Reports are sent once daily. WhatsApp reports available on Elite plan. You can update this info in your Profile settings.
                      </p>
                    </div>
                  </div>
                </motion.div>
              )}
            </AnimatePresence>
          </div>

          {/* Footer */}
          <div className="flex items-center justify-between px-8 pb-8 relative z-10">
            <button
              onClick={() => step > 0 ? setStep(s => s - 1) : onClose()}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl text-slate-500 hover:text-white transition-colors text-[10px] font-black uppercase tracking-widest"
            >
              <ChevronLeft className="w-4 h-4" />
              {step === 0 ? 'Skip' : 'Back'}
            </button>

            {step < 2 ? (
              <button
                onClick={() => setStep(s => s + 1)}
                disabled={(step === 0 && !selectedClass) || (step === 1 && selectedSubjects.length === 0)}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 rounded-xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-cyan-400 disabled:opacity-30 disabled:cursor-not-allowed transition-all shadow-lg shadow-cyan-500/20"
              >
                Continue
                <ChevronRight className="w-4 h-4" />
              </button>
            ) : (
              <button
                onClick={handleFinish}
                disabled={saving || !selectedClass || selectedSubjects.length === 0}
                className="flex items-center gap-2 px-6 py-2.5 bg-cyan-500 rounded-xl text-black font-black uppercase tracking-widest text-[10px] hover:bg-cyan-400 disabled:opacity-30 transition-all shadow-lg shadow-cyan-500/20"
              >
                {saving ? 'Saving...' : "Let's go!"}
                <GraduationCap className="w-4 h-4" />
              </button>
            )}
          </div>
        </motion.div>
      </div>
    </AnimatePresence>
  );
};
