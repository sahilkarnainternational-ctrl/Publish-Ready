import React, { ReactNode, useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';
import { X } from 'lucide-react';

interface OriginDialogProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  children: ReactNode;
  footerActions: ReactNode;
}

export const OriginDialog: React.FC<OriginDialogProps> = ({
  isOpen,
  onClose,
  title,
  children,
  footerActions
}) => {
  const [isMobile, setIsMobile] = useState(false);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    const check = () => setIsMobile(window.innerWidth <= 768);
    check();
    window.addEventListener('resize', check);
    return () => window.removeEventListener('resize', check);
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    const onKey = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', onKey);
    return () => { window.removeEventListener('keydown', onKey); document.body.style.overflow = prev; };
  }, [isOpen, onClose]);
  return (
    <AnimatePresence>
      {isOpen && (
        <div className={`fixed inset-0 z-[1205] flex ${isMobile ? 'items-end' : 'items-center'} justify-center p-4`}> 
          <motion.div 
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            onClick={onClose}
            className="absolute inset-0 bg-black/60 backdrop-blur-sm"
          />
          
          <motion.div 
            initial={{ scale: 0.95, opacity: 0, y: 10 }}
            animate={{ scale: 1, opacity: 1, y: 0 }}
            exit={{ scale: 0.95, opacity: 0, y: 10 }}
            className={`relative w-full ${isMobile ? 'max-w-none rounded-t-3xl' : 'max-w-lg rounded-3xl'} bg-[#0c0c0e] border border-white/10 shadow-2xl overflow-hidden flex flex-col ${isMobile ? 'max-h-[92vh]' : 'max-h-[85vh]'}`}
            onClick={(e) => e.stopPropagation()}
            role="dialog"
            aria-modal="true"
          >
            {/* Header - Sticky */}
            <div className="px-8 py-6 border-b border-white/5 flex items-center justify-between shrink-0 bg-black/20">
              <h3 className="text-lg font-bold text-white tracking-tight">{title}</h3>
              <button 
                onClick={onClose}
                className="p-2 hover:bg-white/5 rounded-xl transition-colors text-slate-400 hover:text-white"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Content - Scrollable */}
            <div className="flex-1 overflow-y-auto px-8 py-8 scrollbar-thin scrollbar-thumb-white/10 scrollbar-track-transparent">
              <div className="text-slate-400 text-sm leading-relaxed space-y-4">
                {children}
              </div>
            </div>

            {/* Footer - Sticky with Blur Effect */}
            <div className="px-8 py-6 border-t border-white/5 shrink-0 bg-black/40 backdrop-blur-xl flex justify-end gap-3">
              {footerActions}
            </div>
          </motion.div>
        </div>
      )}
    </AnimatePresence>
  );
};
