import React from 'react';
import { motion } from 'motion/react';
import { BookOpen, ChevronRight, GraduationCap } from 'lucide-react';
import { useUser } from '../context/UserContext';
import { CORE_COURSES, getCourseUnits, type CoreSubject } from '../data/curriculum';

interface CoursesSectionProps {
  onOpenChapter: (topic: string, subject: string) => void;
}

export const CoursesSection: React.FC<CoursesSectionProps> = ({ onOpenChapter }) => {
  const { classLevel } = useUser();
  const grade = classLevel || 'Grade 10';

  return (
    <section id="courses" className="py-32 px-6 sm:px-8 max-w-7xl mx-auto">
      <div className="text-center mb-16 space-y-4">
        <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-blue-500/10 border border-blue-500/20 text-blue-400 text-[10px] font-black uppercase tracking-[0.3em]">
          <GraduationCap className="w-3.5 h-3.5" />
          Structured Curriculum
        </div>
        <h2 className="text-4xl sm:text-5xl font-black text-white tracking-tight">
          Core Courses
        </h2>
        <p className="text-slate-500 max-w-xl mx-auto text-sm leading-relaxed">
          Full textbook chapters adapted to your class level — Physics, Chemistry, Biology, and Mathematics.
          {classLevel && (
            <span className="block mt-2 text-blue-400/80 font-medium">Personalized for {classLevel}</span>
          )}
        </p>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {CORE_COURSES.map((course) => {
          const units = getCourseUnits(course.subject, grade);
          const topics = units.flatMap((u) => u.topics);

          return (
            <motion.div
              key={course.subject}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              className={`rounded-3xl border bg-gradient-to-br ${course.color} p-8 space-y-6`}
            >
              <div className="flex items-start gap-4">
                <div className="w-12 h-12 rounded-2xl bg-black/40 border border-white/10 flex items-center justify-center">
                  <i className={`fas ${course.icon} text-lg text-white/80`} />
                </div>
                <div>
                  <h3 className="text-xl font-black text-white tracking-tight">{course.subject}</h3>
                  <p className="text-slate-400 text-xs mt-1 leading-relaxed">{course.description}</p>
                </div>
              </div>

              <div className="space-y-2">
                {topics.slice(0, 8).map((topic) => (
                  <button
                    key={topic}
                    onClick={() => onOpenChapter(topic, course.subject)}
                    className="w-full flex items-center justify-between px-4 py-3 rounded-xl bg-black/30 border border-white/5 hover:border-white/15 hover:bg-black/50 transition-all group text-left"
                  >
                    <span className="flex items-center gap-3 text-sm text-slate-300 group-hover:text-white transition-colors">
                      <BookOpen className="w-3.5 h-3.5 text-blue-400/60 shrink-0" />
                      {topic}
                    </span>
                    <ChevronRight className="w-4 h-4 text-slate-600 group-hover:text-blue-400 transition-colors shrink-0" />
                  </button>
                ))}
              </div>

              {topics.length > 8 && (
                <p className="text-[10px] text-slate-600 font-mono uppercase tracking-widest text-center">
                  +{topics.length - 8} more chapters available
                </p>
              )}
            </motion.div>
          );
        })}
      </div>
    </section>
  );
};
