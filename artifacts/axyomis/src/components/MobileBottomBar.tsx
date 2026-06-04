import React from 'react';
import { Volume2, Brain, User as UserIcon, Menu, Search } from 'lucide-react';

interface Props {
  onOpenVoice: () => void;
  onOpenTutor: () => void;
  onOpenProfile: () => void;
  onOpenMenu?: () => void;
  onOpenSearch?: () => void;
}

export const MobileBottomBar: React.FC<Props> = ({ onOpenVoice, onOpenTutor, onOpenProfile, onOpenMenu, onOpenSearch }) => {
  return (
    <div className="mobile-bottom-bar md:hidden fixed left-0 right-0 bottom-0 z-[1200] bg-[#06060a]/80 backdrop-blur border-t border-white/6 safe-bottom">
      <div className="max-w-7xl mx-auto px-4 py-3 flex items-center justify-between">
        <button aria-label="Open menu" onClick={onOpenMenu} className="touch-target p-2 rounded-lg text-slate-300">
          <Menu className="w-6 h-6" />
        </button>
        <button aria-label="Search" onClick={onOpenSearch} className="touch-target p-2 rounded-lg text-slate-300">
          <Search className="w-6 h-6" />
        </button>
        <button aria-label="Talk with Astra" onClick={onOpenVoice} className="touch-target p-2 rounded-lg text-slate-300">
          <Volume2 className="w-6 h-6" />
        </button>
        <button aria-label="AI Tutor" onClick={onOpenTutor} className="touch-target p-2 rounded-lg text-slate-300">
          <Brain className="w-6 h-6" />
        </button>
        <button aria-label="Profile" onClick={onOpenProfile} className="touch-target p-2 rounded-lg text-slate-300">
          <UserIcon className="w-6 h-6" />
        </button>
      </div>
    </div>
  );
};

export default MobileBottomBar;
