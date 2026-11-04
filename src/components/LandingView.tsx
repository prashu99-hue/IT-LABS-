import React from 'react';
import {
  ArrowRight,
  BookOpen,
  Users,
  Award,
  Sparkles,
  Code2,
  Terminal,
  Cpu,
  Binary,
  Globe,
  Database,
  Cloud,
  Lock,
  CheckCircle,
  TrendingUp,
  Layers
} from 'lucide-react';
import { User, SubjectCategory } from '../types';
import { POPULAR_SUBJECTS, CATEGORIES_META } from '../data/mockData';

interface LandingViewProps {
  creators: User[];
  onGetStarted: () => void;
  onLogin: () => void;
  onSelectCategory: (category: SubjectCategory) => void;
  onSelectCreator: (user: User) => void;
  onExploreFeed: () => void;
}

export const LandingView: React.FC<LandingViewProps> = ({
  creators,
  onGetStarted,
  onLogin,
  onSelectCategory,
  onSelectCreator,
  onExploreFeed,
}) => {
  const getSubjectIcon = (subj: SubjectCategory) => {
    switch (subj) {
      case 'Python':
        return <Terminal className="w-5 h-5 text-sky-600" />;
      case 'Java':
        return <Code2 className="w-5 h-5 text-amber-600" />;
      case 'C':
        return <Cpu className="w-5 h-5 text-slate-600" />;
      case 'C++':
        return <Binary className="w-5 h-5 text-blue-600" />;
      case 'AI/ML':
        return <Sparkles className="w-5 h-5 text-purple-600" />;
      case 'Web Development':
        return <Globe className="w-5 h-5 text-teal-600" />;
      case 'DBMS':
        return <Database className="w-5 h-5 text-cyan-600" />;
      case 'Cloud Computing':
        return <Cloud className="w-5 h-5 text-indigo-600" />;
      case 'Cybersecurity':
        return <Lock className="w-5 h-5 text-rose-600" />;
    }
  };

  return (
    <div className="min-h-screen bg-white">
      {/* Hero Section */}
      <section className="relative overflow-hidden pt-12 pb-20 md:pt-20 md:pb-28 border-b border-slate-100 bg-gradient-to-b from-blue-50/40 via-white to-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 text-center relative z-10">
          
          {/* Platform Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full bg-blue-50 border border-blue-200/80 text-blue-700 text-xs font-semibold mb-6 shadow-xs">
            <Layers className="w-3.5 h-3.5 text-blue-600" />
            <span>The Open Tech Education & Knowledge Network</span>
          </div>

          {/* Hero Heading as per prompt */}
          <h1 className="text-3xl sm:text-5xl lg:text-6xl font-extrabold text-slate-900 tracking-tight max-w-4xl mx-auto leading-tight text-balance">
            Learn from people.{' '}
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600">
              Share what you know.
            </span>{' '}
            Grow together.
          </h1>

          {/* Subheading */}
          <p className="mt-5 text-base sm:text-lg text-slate-600 max-w-2xl mx-auto leading-relaxed">
            IT LABS connects students, professors, industry practitioners, and educational creators. 
            Discover verified lecture notes, concise code breakdowns, and interactive study roadmaps.
          </p>

          {/* Primary CTA Buttons */}
          <div className="mt-8 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-sm font-semibold shadow-lg shadow-blue-500/25 transition-all hover:scale-[1.02] active:scale-[0.98] flex items-center justify-center gap-2"
            >
              <span>Get Started Free</span>
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-7 py-3.5 bg-white hover:bg-slate-50 text-slate-800 border border-slate-200 rounded-xl text-sm font-semibold transition-all shadow-xs"
            >
              Sign In to Your Account
            </button>
            <button
              onClick={onExploreFeed}
              className="w-full sm:w-auto px-5 py-3.5 text-slate-600 hover:text-blue-600 text-sm font-medium transition-colors"
            >
              Browse Public Feed →
            </button>
          </div>

          {/* Trust Metrics Bar */}
          <div className="mt-14 grid grid-cols-2 sm:grid-cols-4 gap-4 max-w-3xl mx-auto pt-8 border-t border-slate-200/60">
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">28,000+</div>
              <div className="text-xs text-slate-500 mt-0.5">Active Learners</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-blue-600 tabular-nums">850+</div>
              <div className="text-xs text-slate-500 mt-0.5">Verified Educators</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-slate-900 tabular-nums">12,400+</div>
              <div className="text-xs text-slate-500 mt-0.5">Curated Notes & Code</div>
            </div>
            <div>
              <div className="text-2xl sm:text-3xl font-bold text-indigo-600 tabular-nums">9</div>
              <div className="text-xs text-slate-500 mt-0.5">Core Tech Disciplines</div>
            </div>
          </div>

        </div>
      </section>

      {/* Popular Subjects Grid (Prompt Requirement) */}
      <section className="py-16 md:py-20 bg-slate-50/60 border-b border-slate-100">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center max-w-2xl mx-auto mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
              Explore Popular Educational Subjects
            </h2>
            <p className="mt-2 text-sm text-slate-600">
              Structured study tracks curated by academic professors and industry software architects.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6">
            {POPULAR_SUBJECTS.map((subject) => {
              const meta = CATEGORIES_META[subject];
              return (
                <div
                  key={subject}
                  onClick={() => onSelectCategory(subject)}
                  className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:shadow-md hover:border-blue-300 transition-all cursor-pointer group flex flex-col justify-between"
                >
                  <div>
                    <div className="flex items-center justify-between mb-3">
                      <div className="w-10 h-10 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-110 transition-transform">
                        {getSubjectIcon(subject)}
                      </div>
                      <span className="text-[11px] font-semibold text-slate-500">
                        {meta.topicsCount} discussions
                      </span>
                    </div>

                    <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                      {subject}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1.5 leading-relaxed">
                      {meta.shortDesc}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                    <span>Explore Roadmaps & Notes</span>
                    <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Featured Creators Section (Prompt Requirement) */}
      <section className="py-16 md:py-20 bg-white">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex flex-col md:flex-row md:items-end justify-between mb-10 gap-4">
            <div>
              <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
                <Award className="w-4 h-4" />
                Knowledge Leaders
              </div>
              <h2 className="text-2xl sm:text-3xl font-bold text-slate-900 tracking-tight">
                Featured Educators & Tech Creators
              </h2>
              <p className="text-sm text-slate-600 mt-1">
                Learn directly from university researchers, industry authors, and peer mentors.
              </p>
            </div>
            <button
              onClick={onExploreFeed}
              className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-1 self-start md:self-auto"
            >
              <span>View all creators</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {creators.slice(0, 6).map((creator) => (
              <div
                key={creator.id}
                className="bg-white rounded-2xl p-5 border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-start gap-3.5">
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      referrerPolicy="no-referrer"
                      className="w-12 h-12 rounded-full object-cover ring-2 ring-slate-100 shrink-0"
                    />
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-1.5">
                        <h3 className="font-bold text-sm text-slate-900 truncate">
                          {creator.name}
                        </h3>
                        {creator.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <p className="text-xs font-medium text-slate-500 truncate">
                        {creator.title}
                      </p>
                      <p className="text-[11px] text-blue-600 truncate mt-0.5">
                        {creator.institution}
                      </p>
                    </div>
                  </div>

                  <p className="text-xs text-slate-600 mt-3 line-clamp-2 leading-relaxed">
                    {creator.bio}
                  </p>

                  <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                    {creator.expertise.slice(0, 3).map((tag) => (
                      <span
                        key={tag}
                        className="text-[10px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md"
                      >
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>

                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                  <span className="text-xs text-slate-500 font-medium">
                    <strong className="text-slate-800 tabular-nums">
                      {creator.followersCount.toLocaleString()}
                    </strong>{' '}
                    followers
                  </span>
                  <button
                    onClick={() => onSelectCreator(creator)}
                    className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold transition-colors"
                  >
                    View Profile
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Call to Action Banner */}
      <section className="py-16 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 text-center">
          <h2 className="text-2xl sm:text-4xl font-extrabold tracking-tight">
            Ready to elevate your tech knowledge?
          </h2>
          <p className="mt-3 text-sm sm:text-base text-blue-100 max-w-xl mx-auto">
            Join thousands of passionate engineers and educators sharing code insights every day on IT LABS.
          </p>
          <div className="mt-6 flex flex-col sm:flex-row items-center justify-center gap-3">
            <button
              onClick={onGetStarted}
              className="w-full sm:w-auto px-7 py-3 bg-white text-blue-700 hover:bg-blue-50 rounded-xl text-sm font-bold shadow-md transition-all hover:scale-105"
            >
              Create Free Account
            </button>
            <button
              onClick={onLogin}
              className="w-full sm:w-auto px-7 py-3 bg-blue-800/80 hover:bg-blue-800 text-white border border-white/20 rounded-xl text-sm font-medium transition-all"
            >
              Sign In to Existing Account
            </button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-10 bg-white border-t border-slate-100 text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 flex flex-col sm:flex-row items-center justify-between gap-4">
          <div className="flex items-center gap-2">
            <div className="w-6 h-6 rounded-lg bg-blue-600 text-white flex items-center justify-center font-bold text-xs">
              IT
            </div>
            <span className="font-bold text-slate-800">IT LABS</span>
            <span>— Educational Social Network</span>
          </div>
          <div className="flex items-center gap-6">
            <span>Learn</span>
            <span>·</span>
            <span>Share</span>
            <span>·</span>
            <span>Grow</span>
          </div>
          <div>© {new Date().getFullYear()} IT LABS Platform. All rights reserved.</div>
        </div>
      </footer>
    </div>
  );
};
