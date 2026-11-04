import React, { useState } from 'react';
import {
  Code2,
  Terminal,
  Cpu,
  Binary,
  Sparkles,
  Globe,
  Database,
  Cloud,
  Lock,
  ArrowRight,
  BookOpen,
  CheckCircle,
  FileText,
  Layers,
  Search,
  ExternalLink,
  ChevronRight
} from 'lucide-react';
import { SubjectCategory, Post, User, DifficultyLevel, MediaAttachment } from '../types';
import { CATEGORIES_META, POPULAR_SUBJECTS } from '../data/mockData';
import { PostCard } from './PostCard';

interface ExploreViewProps {
  activeCategory: SubjectCategory | null;
  onSelectCategory: (cat: SubjectCategory | null) => void;
  posts: Post[];
  creators: User[];
  currentUser: User;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onFollowToggle: (userId: string) => void;
  onShare: (post: Post) => void;
  onAddComment: (postId: string, text: string) => void;
  onReportPost: (postId: string, reason: string) => void;
  onDeletePost?: (postId: string) => Promise<void> | void;
  onDeleteAttachment?: (postId: string, attachmentId: string) => Promise<void> | void;
  onSelectUser: (user: User) => void;
  onPreviewMedia?: (media: MediaAttachment) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ExploreView: React.FC<ExploreViewProps> = ({
  activeCategory,
  onSelectCategory,
  posts,
  creators,
  currentUser,
  onLikeToggle,
  onSaveToggle,
  onFollowToggle,
  onShare,
  onAddComment,
  onReportPost,
  onDeletePost,
  onDeleteAttachment,
  onSelectUser,
  onPreviewMedia,
  onToast,
}) => {
  const [selectedRoadmapLevel, setSelectedRoadmapLevel] = useState<DifficultyLevel>('Beginner');
  const [filterDifficulty, setFilterDifficulty] = useState<'All' | DifficultyLevel>('All');

  const getSubjectIcon = (subj: SubjectCategory, sizeClass = 'w-5 h-5') => {
    switch (subj) {
      case 'Python':
        return <Terminal className={`${sizeClass} text-sky-600`} />;
      case 'Java':
        return <Code2 className={`${sizeClass} text-amber-600`} />;
      case 'C':
        return <Cpu className={`${sizeClass} text-slate-700`} />;
      case 'C++':
        return <Binary className={`${sizeClass} text-blue-600`} />;
      case 'AI/ML':
        return <Sparkles className={`${sizeClass} text-purple-600`} />;
      case 'Web Development':
        return <Globe className={`${sizeClass} text-teal-600`} />;
      case 'DBMS':
        return <Database className={`${sizeClass} text-cyan-600`} />;
      case 'Cloud Computing':
        return <Cloud className={`${sizeClass} text-indigo-600`} />;
      case 'Cybersecurity':
        return <Lock className={`${sizeClass} text-rose-600`} />;
    }
  };

  // If a category is selected, render the detailed category track view
  if (activeCategory) {
    const meta = CATEGORIES_META[activeCategory];
    const categoryPosts = posts.filter(
      (p) =>
        p.subject === activeCategory &&
        (filterDifficulty === 'All' || p.difficulty === filterDifficulty)
    );
    const categoryCreators = creators.filter((c) =>
      c.expertise.includes(activeCategory)
    );

    const activeRoadmapTier = meta.roadmap.find((r) => r.level === selectedRoadmapLevel) || meta.roadmap[0];

    return (
      <div className="space-y-6">
        {/* Breadcrumb Header */}
        <div className="flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => onSelectCategory(null)}
            className="hover:text-blue-600 font-medium transition-colors"
          >
            Explore Categories
          </button>
          <ChevronRight className="w-3.5 h-3.5" />
          <span className="font-semibold text-slate-900">{activeCategory} Track</span>
        </div>

        {/* Hero Card for Selected Category */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-start gap-4">
              <div className="w-14 h-14 rounded-2xl bg-blue-50 border border-blue-100 flex items-center justify-center shrink-0">
                {getSubjectIcon(activeCategory, 'w-8 h-8')}
              </div>
              <div>
                <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
                  {meta.name}
                </h1>
                <p className="text-xs sm:text-sm text-slate-600 mt-1 max-w-xl leading-relaxed">
                  {meta.longDesc}
                </p>
              </div>
            </div>

            <button
              onClick={() => onSelectCategory(null)}
              className="px-4 py-2 border border-slate-200 hover:bg-slate-50 text-slate-700 rounded-xl text-xs font-semibold self-start sm:self-auto transition-colors"
            >
              Browse Other Subjects
            </button>
          </div>

          <div className="mt-6 pt-5 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-500 flex-wrap">
            <span>
              <strong className="text-slate-800">{meta.topicsCount}</strong> Discussion Threads
            </span>
            <span>·</span>
            <span>
              <strong className="text-slate-800">{meta.resourcesCount}</strong> Uploaded Notes & Code
            </span>
            <span>·</span>
            <span>
              <strong className="text-slate-800">{categoryCreators.length}</strong> Verified Educators
            </span>
          </div>
        </div>

        {/* Curated Interactive Roadmap */}
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
          <div className="flex items-center justify-between mb-4 flex-wrap gap-2">
            <div>
              <h2 className="text-base font-bold text-slate-900">
                Structured Learning Roadmap
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Step-by-step milestones recommended by educators
              </p>
            </div>

            {/* Level Selector */}
            <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl">
              {(['Beginner', 'Intermediate', 'Advanced'] as const).map((level) => (
                <button
                  key={level}
                  onClick={() => setSelectedRoadmapLevel(level)}
                  className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
                    selectedRoadmapLevel === level
                      ? 'bg-white text-slate-900 shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  {level}
                </button>
              ))}
            </div>
          </div>

          {/* Active Roadmap Items */}
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="text-xs font-bold text-blue-700 uppercase tracking-wider mb-2">
              Milestone: {activeRoadmapTier.title}
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2.5">
              {activeRoadmapTier.items.map((item, idx) => (
                <div
                  key={idx}
                  className="flex items-center gap-2.5 p-2.5 bg-white rounded-xl border border-slate-200/70 text-xs font-medium text-slate-800"
                >
                  <span className="w-5 h-5 rounded-md bg-blue-50 text-blue-600 flex items-center justify-center text-[10px] font-bold shrink-0">
                    {idx + 1}
                  </span>
                  <span>{item}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Top Educators in this track */}
        {categoryCreators.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs">
            <h3 className="text-sm font-bold text-slate-900 mb-3">
              Leading {activeCategory} Educators & Mentors
            </h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {categoryCreators.map((creator) => (
                <div
                  key={creator.id}
                  className="flex items-center justify-between p-3 rounded-xl border border-slate-100 hover:border-slate-200 bg-slate-50/50"
                >
                  <button
                    onClick={() => onSelectUser(creator)}
                    className="flex items-center gap-3 text-left min-w-0 group"
                  >
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      referrerPolicy="no-referrer"
                      className="w-10 h-10 rounded-full object-cover shrink-0"
                    />
                    <div className="min-w-0">
                      <div className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                        {creator.name}
                      </div>
                      <div className="text-[11px] text-slate-500 truncate">
                        {creator.title}
                      </div>
                    </div>
                  </button>
                  <button
                    onClick={() => onFollowToggle(creator.id)}
                    className={`text-xs px-2.5 py-1 rounded-lg font-medium transition-colors shrink-0 ${
                      creator.isFollowing
                        ? 'bg-slate-200 text-slate-700'
                        : 'bg-blue-600 text-white hover:bg-blue-700'
                    }`}
                  >
                    {creator.isFollowing ? 'Following' : 'Follow'}
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Filter Posts by Difficulty */}
        <div className="flex items-center justify-between gap-3 pt-2">
          <h3 className="text-sm font-bold text-slate-900">
            {activeCategory} Educational Posts & Notes ({categoryPosts.length})
          </h3>

          <div className="flex items-center gap-1">
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setFilterDifficulty(lvl)}
                className={`text-xs px-2.5 py-1 rounded-lg transition-colors ${
                  filterDifficulty === lvl
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100 bg-white border border-slate-200'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>
        </div>

        {/* Posts Stream for this Subject */}
        <div className="space-y-4">
          {categoryPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center">
              <FileText className="w-8 h-8 text-slate-400 mx-auto mb-2" />
              <p className="text-xs text-slate-600 font-medium">
                No posts found under {activeCategory} for {filterDifficulty} level.
              </p>
            </div>
          ) : (
            categoryPosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLikeToggle={onLikeToggle}
                onSaveToggle={onSaveToggle}
                onFollowToggle={onFollowToggle}
                onShare={onShare}
                onAddComment={onAddComment}
                onReportPost={onReportPost}
                onDeletePost={onDeletePost}
                onDeleteAttachment={onDeleteAttachment}
                onSelectUser={onSelectUser}
                onSelectCategory={onSelectCategory}
                onPreviewMedia={onPreviewMedia}
                onToast={onToast}
              />
            ))
          )}
        </div>
      </div>
    );
  }

  // Otherwise, render the main 9 Categories Explore Grid
  return (
    <div className="space-y-8">
      {/* Explore Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="max-w-2xl">
          <div className="inline-flex items-center gap-2 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-2">
            <Layers className="w-4 h-4" />
            Educational Disciplines
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
            Explore 9 Core Tech Disciplines
          </h1>
          <p className="text-xs sm:text-sm text-slate-600 mt-2 leading-relaxed">
            Select a subject to view step-by-step learning roadmaps, verified peer notes, 
            production code snippets, and active educational discussions.
          </p>
        </div>
      </div>

      {/* 9 Categories Grid as explicitly requested */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
        {POPULAR_SUBJECTS.map((subject) => {
          const meta = CATEGORIES_META[subject];
          return (
            <div
              key={subject}
              onClick={() => onSelectCategory(subject)}
              className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs hover:shadow-md hover:border-blue-400 transition-all cursor-pointer group flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between mb-3">
                  <div className="w-11 h-11 rounded-xl bg-slate-50 border border-slate-100 flex items-center justify-center group-hover:scale-105 transition-transform">
                    {getSubjectIcon(subject, 'w-6 h-6')}
                  </div>
                  <span className="text-[11px] font-semibold text-slate-400">
                    {meta.topicsCount} discussions
                  </span>
                </div>

                <h3 className="text-base font-bold text-slate-900 group-hover:text-blue-600 transition-colors">
                  {subject}
                </h3>
                <p className="text-xs text-slate-600 mt-1.5 leading-relaxed line-clamp-2">
                  {meta.shortDesc}
                </p>

                {/* Roadmaps highlights */}
                <div className="mt-4 pt-3 border-t border-slate-100">
                  <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1.5">
                    Includes Roadmaps:
                  </div>
                  <div className="flex items-center gap-1.5 flex-wrap">
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">Beginner</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">Intermediate</span>
                    <span className="text-[10px] px-2 py-0.5 rounded bg-slate-100 text-slate-600">Advanced</span>
                  </div>
                </div>
              </div>

              <div className="mt-5 pt-3 border-t border-slate-100 flex items-center justify-between text-xs font-semibold text-blue-600">
                <span>View Full Roadmap & Notes</span>
                <ArrowRight className="w-3.5 h-3.5 group-hover:translate-x-1 transition-transform" />
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};
