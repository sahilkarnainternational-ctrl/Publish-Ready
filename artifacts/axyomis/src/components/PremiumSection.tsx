import React, { useState } from 'react';
import { motion } from 'motion/react';
import { Check, X, Zap, BookOpen, Brain, Crown, Star, Users, MessageCircle, BarChart3, Video, Sparkles, GraduationCap, Clock, Bell, Shield } from 'lucide-react';
import { useUser } from '../context/UserContext';

const PLANS = [
  {
    id: 'free' as const,
    name: 'Spark',
    price: 0,
    period: 'forever',
    tagline: 'Start your journey',
    color: 'border-white/10',
    glow: '',
    badge: null,
    gradient: 'from-slate-900 to-slate-800',
    accentColor: 'text-slate-400',
    btnClass: 'bg-white/5 border border-white/10 text-white hover:bg-white/10',
    features: [
      { text: 'Wiki topic cards (Science, Physics, Biology, Chemistry)', available: true },
      { text: '5 quizzes per day', available: true },
      { text: 'Basic Lyra AI chat', available: true },
      { text: '3D anatomy & cosmos viewer', available: true },
      { text: 'Class-level adaptive content', available: false },
      { text: 'AI Tutor with chapter lessons', available: false },
      { text: 'YouTube video compilation per topic', available: false },
      { text: 'AI chapter summaries', available: false },
      { text: 'Personal evaluation engine', available: false },
      { text: 'Daily parent report', available: false },
    ],
  },
  {
    id: 'scholar' as const,
    name: 'Scholar',
    price: 4.99,
    period: 'month',
    tagline: 'Unlock intelligent learning',
    color: 'border-blue-500/40',
    glow: 'shadow-blue-500/20',
    badge: null,
    gradient: 'from-blue-950/80 to-slate-900',
    accentColor: 'text-blue-400',
    btnClass: 'bg-blue-600 text-white hover:bg-blue-500 shadow-lg shadow-blue-500/20',
    features: [
      { text: 'Wiki topic cards (all subjects)', available: true },
      { text: 'Unlimited quizzes', available: true },
      { text: 'Advanced Lyra AI chat', available: true },
      { text: '3D anatomy & cosmos viewer', available: true },
      { text: 'Class-level adaptive content', available: true },
      { text: 'AI Tutor with chapter lessons', available: true },
      { text: 'YouTube video compilation per topic', available: true },
      { text: 'AI chapter summaries', available: true },
      { text: 'Personal evaluation engine', available: false },
      { text: 'Daily parent report', available: false },
    ],
  },
  {
    id: 'premium' as const,
    name: 'Premium',
    price: 9.99,
    period: 'month',
    tagline: 'Full intelligence suite',
    color: 'border-cyan-400/60',
    glow: 'shadow-cyan-500/30',
    badge: 'Most Popular',
    gradient: 'from-cyan-950/80 to-slate-900',
    accentColor: 'text-cyan-400',
    btnClass: 'bg-gradient-to-r from-cyan-500 to-blue-500 text-black font-black hover:from-cyan-400 hover:to-blue-400 shadow-xl shadow-cyan-500/30',
    features: [
      { text: 'Everything in Scholar', available: true },
      { text: 'Real-time topic tests (unlimited)', available: true },
      { text: 'Personal evaluation engine', available: true },
      { text: 'AI-powered study plan generator', available: true },
      { text: 'Daily progress report to parents (email)', available: true },
      { text: 'Study analytics dashboard', available: true },
      { text: 'Priority AI response speed', available: true },
      { text: 'WhatsApp reports to parents', available: false },
    ],
  },
  {
    id: 'elite' as const,
    name: 'Elite',
    price: 19.99,
    period: 'month',
    tagline: 'Ultimate mastery tier',
    color: 'border-amber-400/60',
    glow: 'shadow-amber-500/30',
    badge: 'All-Access',
    gradient: 'from-amber-950/60 to-slate-900',
    accentColor: 'text-amber-400',
    btnClass: 'bg-gradient-to-r from-amber-500 to-orange-500 text-black font-black hover:from-amber-400 hover:to-orange-400 shadow-xl shadow-amber-500/30',
    features: [
      { text: 'Everything in Premium', available: true },
      { text: 'WhatsApp reports to parents', available: true },
      { text: 'Advanced AI 1-on-1 tutoring sessions', available: true },
      { text: 'Predictive exam performance AI', available: true },
      { text: 'Curriculum-aligned chapter maps', available: true },
      { text: 'Early access to new features', available: true },
      { text: 'Dedicated support channel', available: true },
      { text: 'Offline mode (coming soon)', available: true },
    ],
  },
];

const TESTIMONIALS = [
  { name: 'Priya S.', class: 'Grade 10', avatar: 12, quote: 'The AI tutor explained photosynthesis better than my teacher ever did. Premium is absolutely worth it!' },
  { name: 'Arjun K.', class: 'Grade 8', avatar: 24, quote: 'My parents love the daily reports. I study harder knowing they can see my progress in real time.' },
  { name: 'Emma T.', class: 'Undergraduate', avatar: 36, quote: 'The chapter videos + AI summary combo is insane. I finished my organic chemistry revision in half the time.' },
  { name: 'Rahul M.', class: 'Grade 12', avatar: 48, quote: 'Elite plan is 🔥. The study plan AI literally maps out my entire week based on my exam date.' },
];

export const PremiumSection: React.FC = () => {
  const { isPremium, premiumTier, upgradeToPremium, uid } = useUser();
  const [hoveredPlan, setHoveredPlan] = useState<string | null>(null);
  const [selectedUpgrade, setSelectedUpgrade] = useState<string | null>(null);

  const handleUpgrade = (tier: 'scholar' | 'premium' | 'elite') => {
    if (!uid) {
      alert('Please sign in to upgrade your plan.');
      return;
    }
    setSelectedUpgrade(tier);
    setTimeout(() => {
      upgradeToPremium(tier);
      setSelectedUpgrade(null);
    }, 1500);
  };

  return (
    <section id="premium-section" className="relative max-w-7xl mx-auto px-4 sm:px-8 py-32 overflow-hidden">
      {/* Background effects */}
      <div className="absolute inset-0 pointer-events-none overflow-hidden">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-cyan-500/5 rounded-full blur-[120px]" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-amber-500/5 rounded-full blur-[120px]" />
        <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[800px] h-[400px] bg-blue-500/3 rounded-full blur-[160px]" />
      </div>

      {/* Header */}
      <div className="text-center mb-20 relative z-10">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-amber-500/10 border border-amber-500/20 mb-6">
          <Crown className="w-4 h-4 text-amber-400" />
          <span className="text-[10px] font-black uppercase tracking-[0.3em] text-amber-400">Premium Intelligence</span>
        </div>
        <h2 className="text-4xl sm:text-6xl font-black uppercase tracking-tighter text-white mb-4">
          Unlock Your <span className="bg-gradient-to-r from-cyan-400 to-blue-500 bg-clip-text text-transparent">Full Potential</span>
        </h2>
        <p className="text-slate-400 max-w-xl mx-auto text-sm font-light leading-relaxed">
          Every student deserves a world-class AI teacher. Choose the plan that matches your ambition.
        </p>

        {isPremium && (
          <div className="mt-6 inline-flex items-center gap-2 px-4 py-2 rounded-full bg-green-500/10 border border-green-500/20">
            <Shield className="w-4 h-4 text-green-400" />
            <span className="text-[10px] font-black uppercase tracking-widest text-green-400">
              Active: {premiumTier.charAt(0).toUpperCase() + premiumTier.slice(1)} Plan
            </span>
          </div>
        )}
      </div>

      {/* Pricing Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6 relative z-10">
        {PLANS.map((plan, idx) => {
          const isActive = premiumTier === plan.id;
          const isHovered = hoveredPlan === plan.id;
          const isUpgrading = selectedUpgrade === plan.id;

          return (
            <motion.div
              key={plan.id}
              initial={{ opacity: 0, y: 40 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: idx * 0.1, type: 'spring', stiffness: 200 }}
              onMouseEnter={() => setHoveredPlan(plan.id)}
              onMouseLeave={() => setHoveredPlan(null)}
              className="relative group"
            >
              {/* Glow border animation for premium+ */}
              {(plan.id === 'premium' || plan.id === 'elite') && (
                <div className={`absolute -inset-px rounded-3xl transition-opacity duration-500 ${isHovered || isActive ? 'opacity-100' : 'opacity-60'}`}
                  style={{
                    background: plan.id === 'premium'
                      ? 'linear-gradient(135deg, rgba(34,211,238,0.6), rgba(59,130,246,0.6), rgba(34,211,238,0.6))'
                      : 'linear-gradient(135deg, rgba(245,158,11,0.6), rgba(249,115,22,0.6), rgba(245,158,11,0.6))',
                    backgroundSize: '200% 200%',
                    animation: 'gradientShift 3s ease infinite',
                  }}
                />
              )}

              <div className={`relative rounded-3xl border bg-gradient-to-b ${plan.gradient} ${plan.color} p-6 flex flex-col h-full backdrop-blur-xl overflow-hidden transition-all duration-300 ${isHovered ? `shadow-2xl ${plan.glow}` : ''}`}
                style={{ background: 'rgba(8,9,14,0.95)' }}
              >
                {/* Inner glow */}
                <div className={`absolute top-0 left-1/2 -translate-x-1/2 w-48 h-24 blur-[60px] rounded-full transition-opacity duration-500 ${isHovered ? 'opacity-100' : 'opacity-40'}`}
                  style={{
                    background: plan.id === 'free' ? 'rgba(148,163,184,0.15)' :
                      plan.id === 'scholar' ? 'rgba(59,130,246,0.3)' :
                      plan.id === 'premium' ? 'rgba(34,211,238,0.3)' :
                      'rgba(245,158,11,0.3)'
                  }}
                />

                {/* Badge */}
                {plan.badge && (
                  <div className={`absolute top-4 right-4 px-3 py-1 rounded-full text-[9px] font-black uppercase tracking-widest ${plan.id === 'premium' ? 'bg-cyan-500 text-black' : 'bg-amber-500 text-black'}`}>
                    {plan.badge}
                  </div>
                )}

                {/* Plan name & price */}
                <div className="mb-6 relative z-10">
                  <div className={`text-[10px] font-black uppercase tracking-[0.3em] mb-2 ${plan.accentColor}`}>{plan.name}</div>
                  <div className="flex items-baseline gap-1">
                    {plan.price === 0 ? (
                      <span className="text-4xl font-black text-white">Free</span>
                    ) : (
                      <>
                        <span className="text-4xl font-black text-white">${plan.price}</span>
                        <span className="text-slate-500 text-sm">/{plan.period}</span>
                      </>
                    )}
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1">{plan.tagline}</p>
                </div>

                {/* CTA Button */}
                <button
                  onClick={() => plan.id !== 'free' && handleUpgrade(plan.id as any)}
                  disabled={isActive || isUpgrading}
                  className={`w-full py-3 rounded-2xl text-[11px] font-black uppercase tracking-widest mb-6 transition-all relative z-10 ${isActive ? 'bg-green-500/20 border border-green-500/30 text-green-400 cursor-default' : plan.btnClass} ${isUpgrading ? 'opacity-70' : ''}`}
                >
                  {isUpgrading ? (
                    <span className="flex items-center justify-center gap-2">
                      <span className="w-3 h-3 border-2 border-current border-t-transparent rounded-full animate-spin" />
                      Activating...
                    </span>
                  ) : isActive ? (
                    <span className="flex items-center justify-center gap-2"><Check className="w-3 h-3" /> Current Plan</span>
                  ) : plan.id === 'free' ? 'Get Started Free' : 'Upgrade Now'}
                </button>

                {/* Divider */}
                <div className="h-px bg-white/5 mb-4" />

                {/* Features */}
                <ul className="space-y-2.5 flex-1 relative z-10">
                  {plan.features.map((f, fi) => (
                    <li key={fi} className={`flex items-start gap-2.5 text-[11px] ${f.available ? 'text-slate-300' : 'text-slate-600'}`}>
                      {f.available ? (
                        <Check className={`w-3.5 h-3.5 mt-0.5 flex-shrink-0 ${plan.accentColor}`} />
                      ) : (
                        <X className="w-3.5 h-3.5 mt-0.5 flex-shrink-0 text-slate-700" />
                      )}
                      {f.text}
                    </li>
                  ))}
                </ul>
              </div>
            </motion.div>
          );
        })}
      </div>

      {/* Feature highlights */}
      <div className="mt-24 grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-4 relative z-10">
        {[
          { icon: <Brain className="w-5 h-5" />, label: 'AI Tutor', desc: 'Class-adaptive lessons' },
          { icon: <Video className="w-5 h-5" />, label: 'Video Library', desc: 'Per-topic compilation' },
          { icon: <BarChart3 className="w-5 h-5" />, label: 'Analytics', desc: 'Track your progress' },
          { icon: <Bell className="w-5 h-5" />, label: 'Parent Reports', desc: 'Daily email + WhatsApp' },
          { icon: <GraduationCap className="w-5 h-5" />, label: 'Study Plans', desc: 'AI-built schedules' },
          { icon: <Clock className="w-5 h-5" />, label: 'Live Tests', desc: 'Real-time evaluation' },
        ].map((feat, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.07 }}
            className="flex flex-col items-center text-center gap-2 p-4 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
          >
            <div className="text-cyan-400">{feat.icon}</div>
            <div className="text-[11px] font-black text-white uppercase tracking-widest">{feat.label}</div>
            <div className="text-[10px] text-slate-500">{feat.desc}</div>
          </motion.div>
        ))}
      </div>

      {/* Testimonials */}
      <div className="mt-24 relative z-10">
        <h3 className="text-center text-2xl font-black uppercase tracking-widest text-white mb-2">
          Students <span className="text-cyan-400">Love It</span>
        </h3>
        <p className="text-center text-slate-500 text-xs mb-10 uppercase tracking-widest">Real results from real learners</p>
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {TESTIMONIALS.map((t, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.1 }}
              className="p-5 rounded-2xl bg-white/[0.02] border border-white/5 hover:border-white/10 transition-colors"
            >
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-full overflow-hidden border border-white/10 bg-slate-800">
                  <img src={`https://api.dicebear.com/7.x/avataaars/svg?seed=${t.avatar}`} alt={t.name} />
                </div>
                <div>
                  <div className="text-xs font-bold text-white">{t.name}</div>
                  <div className="text-[10px] text-slate-500">{t.class}</div>
                </div>
                <div className="ml-auto flex gap-0.5">
                  {[1,2,3,4,5].map(s => <Star key={s} className="w-2.5 h-2.5 fill-amber-400 text-amber-400" />)}
                </div>
              </div>
              <p className="text-[11px] text-slate-400 leading-relaxed italic">"{t.quote}"</p>
            </motion.div>
          ))}
        </div>
      </div>

      <style>{`
        @keyframes gradientShift {
          0% { background-position: 0% 50%; }
          50% { background-position: 100% 50%; }
          100% { background-position: 0% 50%; }
        }
      `}</style>
    </section>
  );
};
