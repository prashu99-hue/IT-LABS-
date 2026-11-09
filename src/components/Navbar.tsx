import React, { useState } from 'react';
import {
  BookOpen,
  Search,
  Bookmark,
  Compass,
  Home,
  User as UserIcon,
  ShieldCheck,
  Sparkles,
  ChevronDown,
  LogOut,
  Layers,
  ArrowRight,
  X
} from 'lucide-react';
import { AppView, User } from '../types';

interface NavbarProps {
  currentView: AppView;
  onNavigate: (view: AppView) => void;
  currentUser: User;
  users: User[];
  onOpenSearch: () => void;
  isLoggedIn: boolean;
  onToggleAuth: () => void;
  searchQuery?: string;
  onSearchChange?: (query: string) => void;
  onSearchSubmit?: (query: string) => void;
  isAdminVerified?: boolean;
}

export const Navbar: React.FC<NavbarProps> = ({
  currentView,
  onNavigate,
  currentUser,
  users,
  onOpenSearch,
  isLoggedIn,
  onToggleAuth,
  searchQuery = '',
  onSearchChange,
  onSearchSubmit,
  isAdminVerified = false,
}) => {
  const [showUserDropdown, setShowUserDropdown] = useState(false);

  // Global ⌘K / Ctrl+K keyboard shortcut to focus search
  React.useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        onOpenSearch();
      }
    };
    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, [onOpenSearch]);

  return (
    <header className="sticky top-0 z-40 bg-white/95 backdrop-blur-md border-b border-slate-200/80 transition-all">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Brand Logo Zone */}
          <div className="flex items-center gap-3 shrink-0">
            <button
              onClick={() => onNavigate(isLoggedIn ? 'feed' : 'landing')}
              className="flex items-center gap-2.5 text-left group focus:outline-hidden"
            >
              <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-blue-600 to-indigo-700 flex items-center justify-center text-white shadow-md shadow-blue-500/20 group-hover:scale-105 transition-transform">
                <Layers className="w-5 h-5 text-white" />
              </div>
              <div>
                <div className="flex items-center gap-1.5">
                  <span className="text-lg font-extrabold tracking-tight text-slate-900 group-hover:text-blue-600 transition-colors">
                    LearnNova
                  </span>
                  <span className="text-[10px] uppercase font-bold tracking-wider px-1.5 py-0.5 rounded-md bg-blue-50 text-blue-700 border border-blue-100">
                    Edu
                  </span>
                </div>
                <p className="text-[11px] font-medium text-slate-500 tracking-tight hidden sm:block">
                  Learn · Share · Grow
                </p>
              </div>
            </button>
          </div>

          {/* Search Input Bar (Middle Zone) */}
          <div className="flex-1 max-w-md hidden md:block">
            <form
              onSubmit={(e) => {
                e.preventDefault();
                if (onSearchSubmit) {
                  onSearchSubmit(searchQuery);
                } else {
                  onOpenSearch();
                }
              }}
              className="w-full relative"
            >
              <input
                type="text"
                value={searchQuery}
                onChange={(e) => onSearchChange?.(e.target.value)}
                onFocus={() => {
                  if (currentView !== 'search') {
                    onOpenSearch();
                  }
                }}
                placeholder="Search posts, PDFs, videos, code, creators..."
                className="w-full pl-9 pr-14 py-2 bg-slate-50 hover:bg-slate-100/80 focus:bg-white border border-slate-200 focus:border-blue-500 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:ring-2 focus:ring-blue-500/15 transition-all font-medium placeholder:text-slate-400"
              />
              <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5 pointer-events-none" />
              <div className="absolute right-2 top-1.5 flex items-center gap-1">
                {searchQuery ? (
                  <button
                    type="button"
                    onClick={() => onSearchChange?.('')}
                    className="p-1 text-slate-400 hover:text-slate-600 rounded"
                    title="Clear search"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                ) : (
                  <kbd className="hidden lg:inline-block px-1.5 py-0.5 text-[10px] font-mono bg-white border border-slate-200 text-slate-400 rounded">
                    ⌘K
                  </kbd>
                )}
              </div>
            </form>
          </div>

          {/* Navigation Action Zone */}
          <div className="flex items-center gap-2 sm:gap-3 shrink-0">
            {/* Mobile search button */}
            <button
              onClick={onOpenSearch}
              className="md:hidden p-2 text-slate-600 hover:text-blue-600 hover:bg-slate-100 rounded-lg transition-colors"
              aria-label="Search"
            >
              <Search className="w-5 h-5" />
            </button>

            {isLoggedIn ? (
              <>
                {/* Desktop Quick Nav Links */}
                <nav className="hidden lg:flex items-center gap-1 text-sm font-medium text-slate-600 mr-2">
                  <button
                    onClick={() => onNavigate('feed')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'feed'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Feed
                  </button>
                  <button
                    onClick={() => onNavigate('explore')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'explore'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Explore
                  </button>
                  <button
                    onClick={() => onNavigate('creators')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'creators'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Creators
                  </button>
                  <button
                    onClick={() => onNavigate('saved')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'saved'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Saved
                  </button>
                  <button
                    onClick={() => onNavigate('admin')}
                    className={`px-3 py-1.5 rounded-lg transition-colors ${
                      currentView === 'admin'
                        ? 'bg-blue-50 text-blue-700 font-semibold'
                        : 'hover:text-slate-900 hover:bg-slate-50'
                    }`}
                  >
                    Admin
                  </button>
                </nav>

                {/* Profile & Role Switcher Dropdown */}
                <div className="relative">
                  <button
                    onClick={() => setShowUserDropdown(!showUserDropdown)}
                    className="flex items-center gap-2 p-1 pl-1.5 pr-2 rounded-xl hover:bg-slate-100 border border-slate-200/80 transition-colors focus:outline-hidden"
                  >
                    <img
                      src={currentUser.avatar}
                      alt={currentUser.name}
                      referrerPolicy="no-referrer"
                      className="w-8 h-8 rounded-full object-cover ring-1 ring-blue-500"
                    />
                    <div className="text-left hidden xl:block">
                      <div className="text-xs font-bold text-slate-800 leading-tight">
                        {currentUser.name.split(' ')[0]}
                      </div>
                      <div className="text-[10px] text-blue-600 font-medium leading-none capitalize">
                        {currentUser.role === 'teacher_expert' ? 'Expert' : 'Student'}
                      </div>
                    </div>
                    <ChevronDown className="w-3.5 h-3.5 text-slate-400" />
                  </button>

                  {showUserDropdown && (
                    <div className="absolute right-0 top-11 z-50 w-64 bg-white rounded-2xl shadow-xl border border-slate-200 py-2 text-xs animate-in fade-in zoom-in-95 duration-150">
                      <div className="px-3 py-2 border-b border-slate-100">
                        <p className="font-semibold text-slate-900 text-sm truncate">{currentUser.name}</p>
                        <p className="text-slate-500 text-[11px] truncate">@{currentUser.username}</p>
                        <div className="mt-1 flex items-center gap-1">
                          {currentUser.role === 'teacher_expert' ? (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-blue-50 text-blue-700 flex items-center gap-1">
                              <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                              Educator / Expert
                            </span>
                          ) : (
                            <span className="text-[10px] font-medium px-2 py-0.5 rounded bg-slate-100 text-slate-700">
                              Student Learner
                            </span>
                          )}
                        </div>
                      </div>

                      <div className="py-1">
                        <button
                          onClick={() => {
                            onNavigate('profile');
                            setShowUserDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <UserIcon className="w-4 h-4 text-slate-500" />
                          View My Profile
                        </button>
                        <button
                          onClick={() => {
                            onNavigate('saved');
                            setShowUserDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                        >
                          <Bookmark className="w-4 h-4 text-slate-500" />
                          Saved Resources
                        </button>
                        {isAdminVerified && (
                          <button
                            onClick={() => {
                              onNavigate('admin');
                              setShowUserDropdown(false);
                            }}
                            className="w-full px-3 py-2 text-left text-blue-700 font-semibold hover:bg-blue-50 flex items-center gap-2"
                          >
                            <ShieldCheck className="w-4 h-4 text-blue-600" />
                            Admin Moderation
                          </button>
                        )}
                      </div>

                      <div className="border-t border-slate-100 pt-1 mt-1">
                        <button
                          onClick={() => {
                            onToggleAuth();
                            setShowUserDropdown(false);
                          }}
                          className="w-full px-3 py-2 text-left text-slate-600 hover:text-rose-600 hover:bg-rose-50 flex items-center gap-2"
                        >
                          <LogOut className="w-3.5 h-3.5" />
                          Sign Out (Back to Landing)
                        </button>
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center gap-2">
                <button
                  onClick={() => onNavigate('auth')}
                  className="px-3.5 py-2 text-xs font-semibold text-slate-700 hover:text-slate-900 rounded-xl hover:bg-slate-100 transition-colors"
                >
                  Log In
                </button>
                <button
                  onClick={() => onNavigate('auth')}
                  className="flex items-center gap-1 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs shadow-blue-500/20 transition-all hover:scale-[1.02]"
                >
                  <span>Get Started</span>
                  <ArrowRight className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

          </div>

        </div>
      </div>
    </header>
  );
};
