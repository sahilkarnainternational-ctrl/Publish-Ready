import React from 'react';
import { motion } from 'motion/react';

const TICKET_ITEMS = [
  "SYSTEM STATUS: ONLINE",
  "RESEARCH MODE: ACTIVE",
  "DNA SEQUENCING 98.4%",
  "LABORATORY INITIALIZED",
  "ASTRA AI CORE V2.4",
  "ANALYSIS COMPLETE",
  "MOLECULAR ANALYSIS IN PROGRESS",
  "RESEARCH NETWORK LINKED",
  "NOTICE: Some features may not work and are under improvement",
  "Update soon with a smoother experience",
  "Please share helpful feedback to improve the app"
];

export const MarqueeBanner: React.FC = () => {
  return (
    <div className="w-full bg-blue-600 py-1 overflow-hidden border-y border-blue-400 group relative">
      <div className="absolute inset-0 bg-gradient-to-r from-blue-600 via-transparent to-blue-600 z-10 pointer-events-none" />
      <motion.div 
        animate={{ x: ['0%', '-50%'] }}
        transition={{ duration: 30, repeat: Infinity, ease: "linear" }}
        className="flex whitespace-nowrap gap-12 items-center"
      >
        {[...TICKET_ITEMS, ...TICKET_ITEMS].map((item, idx) => (
          <div key={idx} className="flex items-center gap-2">
            <div className="w-1 h-1 bg-white rounded-full" />
            <span className="text-[10px] font-black text-white tracking-[0.3em] font-mono">
              {item}
            </span>
          </div>
        ))}
      </motion.div>
    </div>
  );
};
