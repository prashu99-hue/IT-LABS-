import React, { useState } from 'react';
import {
  Sparkles,
  Users,
  Filter,
  PlusCircle,
  BookOpen,
  Search,
  MessageSquare,
  ArrowRight,
  TrendingUp,
  Flame
} from 'lucide-react';
import { Post, User, SubjectCategory, MediaAttachment } from '../types';
import { PostCard } from './PostCard';
import { POPULAR_SUBJECTS } from '../data/mockData';
import { RefreshCw, AlertCircle, Loader2 } from 'lucide-react';

interface FeedViewProps {
  posts: Post[];
  currentUser: User;
  selectedSubject: SubjectCategory | 'All';
  onSelectSubject: (subject: SubjectCategory | 'All') => void;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onFollowToggle: (userId: string) => void;
  onShare: (post: Post) => void;
  onAddComment: (postId: string, text: string) => void;
  onReportPost: (postId: string, reason: string) => void;
  onDeletePost?: (postId: string) => Promise<void> | void;
  onDeleteAttachment?: (postId: string, attachmentId: string) => Promise<void> | void;
  onSelectUser: (user: User) => void;
  onSelectCategory: (category: SubjectCategory) => void;
  onOpenCreate: () => void;
  onPreviewMedia?: (media: MediaAttachment) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  isLoading?: boolean;
  error?: string | null;
  onRetry?: () => void;
  followedUserIds?: Set<string>;
  onDiscoverCreators?: () => void;
}

export const FeedView: React.FC<FeedViewProps> = ({
  posts,
  currentUser,
  selectedSubject,
  onSelectSubject,
  onLikeToggle,
  onSaveToggle,
  onFollowToggle,
  onShare,
  onAddComment,
  onReportPost,
  onDeletePost,
  onDeleteAttachment,
  onSelectUser,
  onSelectCategory,
  onOpenCreate,
  onPreviewMedia,
  onToast,
  isLoading = false,
  error = null,
  onRetry,
  followedUserIds = new Set<string>(),
  onDiscoverCreators,
}) => {
  const [feedTab, setFeedTab] = useState<'for_you' | 'following'>('for_you');
  const [difficultyFilter, setDifficultyFilter] = useState<'All' | 'Beginner' | 'Intermediate' | 'Advanced'>('All');

  // Filter posts based on feed tab, subject, and difficulty (Feature 4)
  const filteredPosts = posts.filter((post) => {
    // Subject filter
    if (selectedSubject !== 'All' && post.subject !== selectedSubject) {
      return false;
    }
    // Difficulty filter
    if (difficultyFilter !== 'All' && post.difficulty !== difficultyFilter) {
      return false;
    }
    // Following tab filter: displays posts from creators the current user follows
    if (feedTab === 'following') {
      const authorId = post.authorId || post.author?.id;
      const isFollowed = (followedUserIds && followedUserIds.has(authorId)) || !!post.author?.isFollowing;
      return isFollowed || authorId === currentUser.id;
    }
    return true;
  });

  return (
    <div className="space-y-5">
      {/* Quick Create Prompt Bar */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs">
        <div className="flex items-center gap-3">
          <img
            src={currentUser.avatar}
            alt={currentUser.name}
            referrerPolicy="no-referrer"
            className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
          />
          <button
            onClick={onOpenCreate}
            className="flex-1 text-left px-4 py-2.5 bg-slate-50 hover:bg-slate-100 border border-slate-200 rounded-xl text-xs text-slate-500 transition-colors flex items-center justify-between"
          >
            <span>Share a code snippet, upload lecture notes, or ask a question...</span>
            <PlusCircle className="w-4 h-4 text-blue-600 shrink-0 ml-2" />
          </button>
        </div>
      </div>

      {/* Feed Tabs Header: "For You" vs "Following" */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-3 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          
          {/* Main Feed Tab Buttons */}
          <div className="flex items-center gap-1 p-1 bg-slate-100 rounded-xl w-full sm:w-auto">
            <button
              onClick={() => setFeedTab('for_you')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                feedTab === 'for_you'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>For You</span>
            </button>
            <button
              onClick={() => setFeedTab('following')}
              className={`flex-1 sm:flex-none flex items-center justify-center gap-1.5 px-4 py-2 rounded-lg text-xs font-semibold transition-all ${
                feedTab === 'following'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Users className="w-3.5 h-3.5 text-blue-600" />
              <span>Following</span>
            </button>
          </div>

          {/* Difficulty Level Filter */}
          <div className="flex items-center gap-1 overflow-x-auto pb-1 sm:pb-0">
            <span className="text-[11px] font-medium text-slate-400 mr-1 hidden sm:inline">Level:</span>
            {(['All', 'Beginner', 'Intermediate', 'Advanced'] as const).map((lvl) => (
              <button
                key={lvl}
                onClick={() => setDifficultyFilter(lvl)}
                className={`text-[11px] px-2.5 py-1 rounded-lg transition-colors whitespace-nowrap ${
                  difficultyFilter === lvl
                    ? 'bg-blue-600 text-white font-medium'
                    : 'text-slate-600 hover:bg-slate-100'
                }`}
              >
                {lvl}
              </button>
            ))}
          </div>

        </div>

        {/* Horizontal Subject Scroller */}
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto scrollbar-none">
          <button
            onClick={() => onSelectSubject('All')}
            className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
              selectedSubject === 'All'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:bg-slate-50'
            }`}
          >
            All Subjects
          </button>
          {POPULAR_SUBJECTS.map((subject) => (
            <button
              key={subject}
              onClick={() => onSelectSubject(subject)}
              className={`px-3 py-1 rounded-lg text-xs font-medium whitespace-nowrap transition-colors shrink-0 ${
                selectedSubject === subject
                  ? 'bg-blue-50 text-blue-700 font-bold'
                  : 'text-slate-600 hover:bg-slate-50'
              }`}
            >
              {subject}
            </button>
          ))}
        </div>
      </div>

      {/* Feed Stream */}
      <div className="space-y-4">
        {/* Error State */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-2xl p-4 flex items-center justify-between gap-3 text-red-800">
            <div className="flex items-center gap-2.5">
              <AlertCircle className="w-5 h-5 text-red-600 shrink-0" />
              <div>
                <p className="text-xs font-bold">Failed to load posts from Cloud Firestore</p>
                <p className="text-[11px] text-red-700">{error}</p>
              </div>
            </div>
            {onRetry && (
              <button
                onClick={onRetry}
                className="px-3 py-1.5 bg-red-600 hover:bg-red-700 text-white rounded-xl text-xs font-semibold shrink-0 flex items-center gap-1.5 transition-colors"
              >
                <RefreshCw className="w-3.5 h-3.5" />
                <span>Retry</span>
              </button>
            )}
          </div>
        )}

        {/* Loading State Skeleton */}
        {isLoading ? (
          <div className="space-y-4">
            {[1, 2, 3].map((n) => (
              <div key={n} className="bg-white rounded-2xl border border-slate-200/80 p-5 shadow-xs space-y-3 animate-pulse">
                <div className="flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-slate-200"></div>
                  <div className="space-y-1.5 flex-1">
                    <div className="h-3.5 bg-slate-200 rounded-md w-1/4"></div>
                    <div className="h-2.5 bg-slate-100 rounded-md w-1/3"></div>
                  </div>
                </div>
                <div className="space-y-2 pt-2">
                  <div className="h-4 bg-slate-200 rounded-md w-3/4"></div>
                  <div className="h-3 bg-slate-100 rounded-md w-full"></div>
                  <div className="h-3 bg-slate-100 rounded-md w-5/6"></div>
                </div>
                <div className="h-8 bg-slate-100 rounded-xl w-full"></div>
              </div>
            ))}
          </div>
        ) : filteredPosts.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center shadow-xs space-y-4">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto">
              {feedTab === 'following' ? <Users className="w-7 h-7" /> : <BookOpen className="w-7 h-7" />}
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                {feedTab === 'following' ? 'Your Following Feed is Empty' : 'No educational posts found'}
              </h3>
              <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                {feedTab === 'following'
                  ? 'Follow university professors, software architects, and student scholars to personalize your daily learning feed with targeted notes and code examples.'
                  : `No discussions matched the filter for "${selectedSubject}" at ${difficultyFilter} level.`}
              </p>
            </div>
            <div className="pt-2 flex flex-wrap items-center justify-center gap-2">
              {feedTab === 'following' && onDiscoverCreators && (
                <button
                  onClick={onDiscoverCreators}
                  className="px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5"
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  <span>Discover Educators & Creators</span>
                </button>
              )}
              <button
                onClick={() => {
                  onSelectSubject('All');
                  setDifficultyFilter('All');
                  setFeedTab('for_you');
                }}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Reset All Filters
              </button>
              <button
                onClick={onOpenCreate}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
              >
                Create Post
              </button>
            </div>
          </div>
        ) : (
          filteredPosts.map((post) => (
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
};
