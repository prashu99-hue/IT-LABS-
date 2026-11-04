import React from 'react';
import {
  Home,
  Compass,
  Bookmark,
  User as UserIcon,
  ShieldCheck,
  PlusCircle,
  Terminal,
  Code2,
  Sparkles,
  Cloud,
  Database,
  Lock,
  Layers,
  GraduationCap
} from 'lucide-react';
import { AppView, SubjectCategory, User } from '../types';
import { POPULAR_SUBJECTS } from '../data/mockData';

interface SidebarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentUser: User;
  selectedSubject: SubjectCategory | 'All';
  onSelectSubject: (subj: SubjectCategory | 'All') => void;
  savedCount: number;
}

export const Sidebar: React.FC<SidebarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  selectedSubject,
  onSelectSubject,
  savedCount,
}) => {
  const getSubjectIcon = (subj: SubjectCategory) => {
    switch (subj) {
      case 'Python':
        return <Terminal className="w-3.5 h-3.5 text-sky-600" />;
      case 'Java':
      case 'C':
      case 'C++':
        return <Code2 className="w-3.5 h-3.5 text-blue-600" />;
      case 'AI/ML':
        return <Sparkles className="w-3.5 h-3.5 text-purple-600" />;
      case 'Cloud Computing':
        return <Cloud className="w-3.5 h-3.5 text-indigo-600" />;
      case 'DBMS':
        return <Database className="w-3.5 h-3.5 text-cyan-600" />;
      case 'Cybersecurity':
        return <Lock className="w-3.5 h-3.5 text-rose-600" />;
      default:
        return <Layers className="w-3.5 h-3.5 text-teal-600" />;
    }
  };

  return (
    <aside className="w-64 shrink-0 hidden md:block">
      <div className="sticky top-20 space-y-6">
        
        {/* Primary Navigation */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
          <nav className="space-y-1">
            <button
              onClick={() => onNavigate('feed')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'feed'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Home className="w-4 h-4" />
                <span>Home Feed</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('explore')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'explore'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Compass className="w-4 h-4" />
                <span>Explore Tracks</span>
              </div>
              <span className="text-[10px] font-bold px-1.5 py-0.5 rounded bg-blue-100 text-blue-800">
                9 Subjects
              </span>
            </button>

            <button
              onClick={() => onNavigate('create')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'create'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <PlusCircle className="w-4 h-4" />
                <span>Create & Upload</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('saved')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'saved'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <Bookmark className="w-4 h-4" />
                <span>Saved Resources</span>
              </div>
              {savedCount > 0 && (
                <span className="text-[10px] font-bold px-1.5 py-0.2 rounded-full bg-slate-100 text-slate-700">
                  {savedCount}
                </span>
              )}
            </button>

            <button
              onClick={() => onNavigate('profile')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'profile'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <UserIcon className="w-4 h-4" />
                <span>My Profile</span>
              </div>
            </button>

            <button
              onClick={() => onNavigate('admin')}
              className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl text-sm font-medium transition-all ${
                currentView === 'admin'
                  ? 'bg-blue-50 text-blue-700 font-semibold shadow-xs'
                  : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
              }`}
            >
              <div className="flex items-center gap-3">
                <ShieldCheck className="w-4 h-4" />
                <span>Admin Dashboard</span>
              </div>
              <span className="w-2 h-2 rounded-full bg-amber-500" title="3 pending reports" />
            </button>
          </nav>
        </div>

        {/* Popular Subject Shortcuts */}
        <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
          <div className="flex items-center justify-between mb-2">
            <h3 className="text-xs font-semibold text-slate-900 tracking-wide uppercase">
              Curated Subjects
            </h3>
            <button
              onClick={() => {
                onSelectSubject('All');
                if (currentView !== 'feed') onNavigate('feed');
              }}
              className="text-[11px] text-blue-600 hover:underline font-medium"
            >
              View All
            </button>
          </div>

          <div className="space-y-1">
            {POPULAR_SUBJECTS.map((subj) => (
              <button
                key={subj}
                onClick={() => {
                  onSelectSubject(subj);
                  if (currentView !== 'feed') onNavigate('feed');
                }}
                className={`w-full flex items-center justify-between px-2.5 py-1.5 rounded-lg text-xs transition-colors ${
                  selectedSubject === subj && currentView === 'feed'
                    ? 'bg-blue-50 text-blue-700 font-semibold'
                    : 'text-slate-600 hover:bg-slate-50 hover:text-slate-900'
                }`}
              >
                <div className="flex items-center gap-2">
                  {getSubjectIcon(subj)}
                  <span>{subj}</span>
                </div>
              </button>
            ))}
          </div>
        </div>

        {/* User Mini Card */}
        <div className="bg-gradient-to-br from-blue-600 to-indigo-700 rounded-2xl p-4 text-white shadow-md shadow-blue-500/10">
          <div className="flex items-center gap-3">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-10 h-10 rounded-full object-cover ring-2 ring-white/50"
            />
            <div className="min-w-0">
              <div className="font-semibold text-xs truncate">{currentUser.name}</div>
              <div className="text-[11px] text-blue-100 truncate">@{currentUser.username}</div>
            </div>
          </div>
          <div className="mt-3 pt-3 border-t border-white/20 flex items-center justify-between text-[11px]">
            <span className="flex items-center gap-1 text-blue-100">
              <GraduationCap className="w-3.5 h-3.5" />
              {currentUser.role === 'teacher_expert' ? 'Verified Educator' : 'Active Student'}
            </span>
            <button
              onClick={() => onNavigate('profile')}
              className="font-medium underline hover:text-blue-200 transition-colors"
            >
              Profile
            </button>
          </div>
        </div>

      </div>
    </aside>
  );
};
