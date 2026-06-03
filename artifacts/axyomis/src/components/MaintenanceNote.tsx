import React, { useEffect, useState } from 'react';
import { motion } from 'motion/react';
import { X } from 'lucide-react';

const STORAGE_KEY = 'axyomis_maintenance_note_dismissed';

export const MaintenanceNote: React.FC = () => {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const dismissed = window.localStorage.getItem(STORAGE_KEY);
    if (dismissed === 'true') {
      setVisible(false);
    }
  }, []);

  const handleDismiss = () => {
    setVisible(false);
    if (typeof window !== 'undefined') {
      window.localStorage.setItem(STORAGE_KEY, 'true');
    }
  };

  if (!visible) return null;

  return (
    <motion.div
      initial={{ opacity: 0, y: -12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.35 }}
      className="fixed right-4 top-24 z-50 w-[min(360px,92vw)] rounded-[32px] border border-white/10 bg-slate-950/95 p-4 shadow-2xl shadow-cyan-500/15 backdrop-blur-xl"
    >
      <div className="flex items-start gap-4">
        <div className="flex-1">
          <div className="text-[10px] uppercase tracking-[0.5em] text-cyan-400 font-black mb-2">Maintenance Notice</div>
          <p className="text-sm text-slate-200 leading-6">
            App is under maintenance. Some features may not work and are under improvement. It will update soon with a smoother experience.
          </p>
          <p className="mt-3 text-[11px] text-slate-500">Please share helpful feedback in the new section below.</p>
        </div>
        <button
          type="button"
          onClick={handleDismiss}
          className="rounded-full border border-white/10 bg-white/5 p-2 text-slate-400 hover:bg-white/10 transition"
          aria-label="Close maintenance note"
        >
          <X className="w-4 h-4" />
        </button>
      </div>
    </motion.div>
  );
};
