import React from 'react';
import { Home, Compass, Plus, Users, User as UserIcon } from 'lucide-react';
import { AppView } from '../types';

interface MobileNavProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  savedCount: number;
}

export const MobileNav: React.FC<MobileNavProps> = ({ currentView, onNavigate, savedCount }) => {
  return (
    <nav
      className="fixed bottom-0 left-0 right-0 z-40 bg-white/95 backdrop-blur-md border-t border-slate-200/80 px-4 py-2 shadow-lg"
      aria-label="Bottom Navigation"
    >
      <div className="flex items-center justify-around max-w-lg mx-auto relative">
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

        {/* Central Blue (+) Button: The Single Primary Create Post Entry Point */}
        <button
          onClick={() => onNavigate('create')}
          className="flex items-center justify-center -mt-6 w-12 h-12 bg-blue-600 hover:bg-blue-700 active:bg-blue-800 text-white rounded-full shadow-lg shadow-blue-500/35 ring-4 ring-white transition-all hover:scale-105 active:scale-95 cursor-pointer focus:outline-hidden"
          aria-label="Create new educational post"
          title="Create Post"
        >
          <Plus className="w-6 h-6 stroke-[2.5]" />
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
