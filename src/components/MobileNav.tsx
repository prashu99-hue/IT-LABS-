import React from 'react';
import { Home, Compass, PlusCircle, Users, User as UserIcon } from 'lucide-react';
import { AppView } from '../types';

interface MobileNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  savedCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate, savedCount }) => {
  return (
    <nav className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 md:hidden px-3 py-2">
      <div className="flex items-center justify-around max-w-lg mx-auto">
        <button
          onClick={() => onNavigate('feed')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            currentView === 'feed' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Home className="w-5 h-5" />
          <span>Home</span>
        </button>

        <button
          onClick={() => onNavigate('explore')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            currentView === 'explore' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Compass className="w-5 h-5" />
          <span>Explore</span>
        </button>

        <button
          onClick={() => onNavigate('create')}
          className="flex flex-col items-center justify-center -mt-5 p-2 bg-blue-600 hover:bg-blue-700 text-white rounded-full shadow-lg shadow-blue-500/30 transition-transform active:scale-95"
          aria-label="Create new educational post or upload notes"
        >
          <PlusCircle className="w-6 h-6" />
        </button>

        <button
          onClick={() => onNavigate('creators')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            currentView === 'creators' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <Users className="w-5 h-5" />
          <span>Creators</span>
        </button>

        <button
          onClick={() => onNavigate('profile')}
          className={`flex flex-col items-center gap-1 p-1 text-[11px] font-medium transition-colors ${
            currentView === 'profile' ? 'text-blue-600 font-bold' : 'text-slate-500 hover:text-slate-900'
          }`}
        >
          <UserIcon className="w-5 h-5" />
          <span>Profile</span>
        </button>
      </div>
    </nav>
  );
};
