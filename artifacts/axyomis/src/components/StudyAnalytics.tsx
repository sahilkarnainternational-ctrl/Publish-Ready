import React, { useState, useEffect } from 'react';
import { motion } from 'motion/react';
import { BarChart3, Brain, BookOpen, Video, Trophy, TrendingUp, Calendar, Target, Crown, Sparkles } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { getTodayActivity, getWeekActivity, type ActivityEntry } from '../services/activityService';
import { UpgradeModal } from './UpgradeModal';
import { DATA_SETS } from '../constants';

interface DayStats {
  day: string;
  date: string;
  quizzes: number;
  chapters: number;
  videos: number;
  score: number;
  total: number;
}

interface SubjectStats {
  subject: string;
  count: number;
  avgScore: number;
}

function buildWeekStats(entries: ActivityEntry[]): DayStats[] {
  const days = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat'];
  const result: DayStats[] = [];
  for (let i = 6; i >= 0; i--) {
    const d = new Date();
    d.setDate(d.getDate() - i);
    d.setHours(0, 0, 0, 0);
    const next = new Date(d);
    next.setDate(next.getDate() + 1);
    const dayEntries = entries.filter(e => {
      const t = e.timestamp?.toDate?.() ?? new Date(0);
      return t >= d && t < next;
    });
    const quizEntries = dayEntries.filter(e => e.type === 'quiz');
    const totalScore = quizEntries.reduce((s, e) => s + (e.score ?? 0), 0);
    const totalMax = quizEntries.reduce((s, e) => s + (e.maxScore ?? 1), 0);
    result.push({
      day: days[d.getDay()],
      date: d.toLocaleDateString('en-US', { month: 'short', day: 'numeric' }),
      quizzes: quizEntries.length,
      chapters: dayEntries.filter(e => e.type === 'chapter').length,
      videos: dayEntries.filter(e => e.type === 'video').length,
      score: totalMax > 0 ? Math.round((totalScore / totalMax) * 100) : 0,
      total: dayEntries.length,
    });
  }
  return result;
}

function buildSubjectStats(entries: ActivityEntry[]): SubjectStats[] {
  const map = new Map<string, { count: number; totalScore: number; totalMax: number }>();
  for (const e of entries) {
    const subj = e.subject || 'General';
    const existing = map.get(subj) ?? { count: 0, totalScore: 0, totalMax: 0 };
    map.set(subj, {
      count: existing.count + 1,
      totalScore: existing.totalScore + (e.score ?? 0),
      totalMax: existing.totalMax + (e.maxScore ?? 1),
    });
  }
  return [...map.entries()]
    .map(([subject, v]) => ({
      subject,
      count: v.count,
      avgScore: v.totalMax > 0 ? Math.round((v.totalScore / v.totalMax) * 100) : 0,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, 6);
}

export const StudyAnalytics: React.FC = () => {
  const { uid, isPremium, isTrialActive, effectiveTier } = useUser() as any;
  const canAccess = isPremium || isTrialActive;
  const [todayEntries, setTodayEntries] = useState<ActivityEntry[]>([]);
  const [weekEntries, setWeekEntries] = useState<ActivityEntry[]>([]);
  const [loading, setLoading] = useState(false);
  const [showUpgrade, setShowUpgrade] = useState(false);

  useEffect(() => {
    if (!uid || !canAccess) return;
    setLoading(true);
    Promise.all([getTodayActivity(uid), getWeekActivity(uid)])
      .then(([today, week]) => {
        setTodayEntries(today);
        setWeekEntries(week);
      })
      .finally(() => setLoading(false));
  }, [uid, canAccess]);

  if (!uid) return null;

  if (!canAccess) {
    return (
      <section id="study-analytics" className="max-w-7xl mx-auto px-4 sm:px-8 mb-20">
        <div className="p-8 rounded-3xl border border-white/5 bg-white/[0.01] text-center">
          <BarChart3 className="w-12 h-12 text-cyan-400 mx-auto mb-4 opacity-40" />
          <h3 className="text-xl font-black uppercase tracking-widest text-white mb-2">Study Analytics Dashboard</h3>
          <p className="text-slate-500 text-sm mb-5 max-w-md mx-auto">See your quiz scores, topics studied, and weekly learning streaks — all in one place.</p>
          <button onClick={() => setShowUpgrade(true)} className="px-6 py-3 bg-gradient-to-r from-cyan-500 to-blue-500 rounded-2xl text-black font-black uppercase tracking-widest text-[10px] hover:from-cyan-400 hover:to-blue-400 transition-colors inline-flex items-center gap-2 shadow-xl shadow-cyan-500/20">
            <Crown className="w-4 h-4" /> Unlock with Premium
          </button>
        </div>
        <UpgradeModal open={showUpgrade} onClose={() => setShowUpgrade(false)} featureName="Study Analytics Dashboard" requiredTier="premium" description="shows your quiz scores, weekly activity heatmap, subject breakdown, and learning trends." />
      </section>
    );
  }

  const weekStats = buildWeekStats(weekEntries);
  const subjectStats = buildSubjectStats(weekEntries);
  const maxTotal = Math.max(...weekStats.map(d => d.total), 1);

  const todayQuizzes = todayEntries.filter(e => e.type === 'quiz');
  const todayMinutes = todayEntries.reduce((sum, e) => sum + (e.duration ?? 0), 0);
  const todayAccuracy = todayQuizzes.length > 0
    ? Math.round((todayQuizzes.reduce((s, e) => s + (e.score ?? 0), 0) / Math.max(todayQuizzes.reduce((s, e) => s + (e.maxScore ?? 1), 0), 1)) * 100)
    : 0;
  const weekStreak = weekStats.filter(d => d.total > 0).length;
  const weekQuizzes = weekEntries.filter(e => e.type === 'quiz').length;
  const weekAccuracy = weekQuizzes > 0
    ? Math.round((weekEntries.filter(e => e.type === 'quiz').reduce((s, e) => s + (e.score ?? 0), 0) / Math.max(weekEntries.filter(e => e.type === 'quiz').reduce((s, e) => s + (e.maxScore ?? 1), 0), 1)) * 100)
    : 0;
  const completedChaptersCount = weekEntries.filter(e => e.type === 'chapter').length;
  const totalChapterCount = Object.values(DATA_SETS).reduce((sum, list) => sum + list.length, 0);
  const completionPercentage = totalChapterCount > 0 ? Math.round((completedChaptersCount / totalChapterCount) * 100) : 0;
  const chaptersLeft = Math.max(0, totalChapterCount - completedChaptersCount);

  const STAT_CARDS = [
    { icon: <Trophy className="w-5 h-5" />, label: "Today's Accuracy", value: todayAccuracy > 0 ? `${todayAccuracy}%` : '—', sub: `${todayQuizzes.length} quiz${todayQuizzes.length !== 1 ? 'zes' : ''} today`, color: 'text-amber-400', bg: 'bg-amber-500/10 border-amber-500/20' },
    { icon: <Calendar className="w-5 h-5" />, label: 'Time Today', value: `${todayMinutes} min`, sub: 'active study time', color: 'text-cyan-400', bg: 'bg-cyan-500/10 border-cyan-500/20' },
    { icon: <Brain className="w-5 h-5" />, label: 'Course Progress', value: `${completionPercentage}%`, sub: `${chaptersLeft} chapters left`, color: 'text-green-400', bg: 'bg-green-500/10 border-green-500/20' },
    { icon: <BookOpen className="w-5 h-5" />, label: 'Topics Studied', value: `${completedChaptersCount}`, sub: 'chapters this week', color: 'text-blue-400', bg: 'bg-blue-500/10 border-blue-500/20' },
  ];

  const SUBJECT_COLORS = ['text-cyan-400', 'text-blue-400', 'text-purple-400', 'text-amber-400', 'text-green-400', 'text-rose-400'];

  return (
    <section id="study-analytics" className="max-w-7xl mx-auto px-4 sm:px-8 mb-20">
      <div className="flex items-center gap-4 mb-6">
        <span className="w-12 h-px bg-cyan-500" />
        <h2 className="text-2xl font-black uppercase tracking-[0.5em] text-white">Analytics</h2>
        <div className="flex items-center gap-1.5 px-3 py-1 rounded-full bg-cyan-500/10 border border-cyan-500/20">
          <Sparkles className="w-3 h-3 text-cyan-400" />
          <span className="text-[9px] font-black uppercase tracking-widest text-cyan-400">Premium</span>
        </div>
        {effectiveTier === 'free' && <span className="text-[9px] text-slate-600 uppercase tracking-widest">Trial access active</span>}
      </div>

      {loading ? (
        <div className="h-48 flex items-center justify-center">
          <div className="w-8 h-8 rounded-full border-2 border-cyan-500/30 border-t-cyan-500 animate-spin" />
        </div>
      ) : (
        <>
          {/* Stat Cards */}
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mb-6">
            {STAT_CARDS.map((card, i) => (
              <motion.div key={i} initial={{ opacity: 0, y: 16 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.07 }}
                className={`p-5 rounded-2xl border ${card.bg} flex flex-col gap-2`}>
                <div className={card.color}>{card.icon}</div>
                <div className="text-2xl font-black text-white">{card.value}</div>
                <div className="text-[10px] font-black uppercase tracking-widest text-white/70">{card.label}</div>
                <div className="text-[10px] text-slate-500">{card.sub}</div>
              </motion.div>
            ))}
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
            {/* Weekly Activity Bar Chart */}
            <div className="lg:col-span-2 p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-5">
                <TrendingUp className="w-4 h-4 text-cyan-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">7-Day Activity</span>
              </div>
              <div className="flex items-end gap-2 sm:gap-3 h-36">
                {weekStats.map((day, i) => (
                  <div key={i} className="flex-1 flex flex-col items-center gap-1.5">
                    <div className="w-full flex flex-col items-center justify-end gap-0.5" style={{ height: '112px' }}>
                      {day.total > 0 && (
                        <motion.div
                          initial={{ height: 0 }}
                          animate={{ height: `${Math.max(8, (day.total / maxTotal) * 96)}px` }}
                          transition={{ delay: i * 0.05, type: 'spring', stiffness: 300 }}
                          className="w-full rounded-t-lg bg-gradient-to-t from-cyan-600 to-cyan-400"
                          title={`${day.total} activities`}
                        />
                      )}
                      {day.total === 0 && (
                        <div className="w-full h-2 rounded-t-lg bg-white/5" />
                      )}
                    </div>
                    <div className="text-[9px] text-slate-500 font-bold uppercase">{day.day}</div>
                    {day.score > 0 && <div className="text-[8px] text-cyan-400/70">{day.score}%</div>}
                  </div>
                ))}
              </div>
              <div className="flex gap-4 mt-4 flex-wrap">
                {[
                  { dot: 'bg-cyan-400', label: 'Quizzes' },
                  { dot: 'bg-blue-400', label: 'Chapters' },
                  { dot: 'bg-purple-400', label: 'Videos' },
                ].map(l => (
                  <div key={l.label} className="flex items-center gap-1.5">
                    <div className={`w-2 h-2 rounded-full ${l.dot}`} />
                    <span className="text-[10px] text-slate-500">{l.label}</span>
                  </div>
                ))}
              </div>
            </div>

            {/* Subject Breakdown */}
            <div className="p-6 rounded-2xl border border-white/5 bg-white/[0.02]">
              <div className="flex items-center gap-2 mb-5">
                <Target className="w-4 h-4 text-blue-400" />
                <span className="text-[11px] font-black uppercase tracking-widest text-white">By Subject</span>
              </div>
              {subjectStats.length === 0 ? (
                <div className="flex flex-col items-center justify-center h-32 text-center">
                  <Brain className="w-8 h-8 text-slate-700 mb-2" />
                  <p className="text-slate-600 text-xs">No activity yet this week.</p>
                  <p className="text-slate-700 text-[10px] mt-1">Complete quizzes or AI Tutor sessions to see your breakdown.</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {subjectStats.map((s, i) => (
                    <div key={s.subject}>
                      <div className="flex items-center justify-between mb-1">
                        <span className={`text-[11px] font-bold ${SUBJECT_COLORS[i % SUBJECT_COLORS.length]}`}>{s.subject}</span>
                        <span className="text-[10px] text-slate-400">{s.count} activities</span>
                      </div>
                      <div className="w-full h-1.5 bg-white/5 rounded-full overflow-hidden">
                        <motion.div
                          initial={{ width: 0 }}
                          animate={{ width: `${Math.min(100, (s.count / (subjectStats[0]?.count || 1)) * 100)}%` }}
                          transition={{ delay: i * 0.05 + 0.2, type: 'spring', stiffness: 200 }}
                          className="h-full rounded-full bg-gradient-to-r from-cyan-500 to-blue-500"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </>
      )}
    </section>
  );
};
