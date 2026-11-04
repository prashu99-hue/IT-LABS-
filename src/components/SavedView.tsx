import React, { useState } from 'react';
import {
  Bookmark,
  BookOpen,
  Code2,
  Trash2,
  ExternalLink,
  Copy,
  Check,
  Compass,
  ArrowRight,
  FileText,
  UploadCloud,
  Layers
} from 'lucide-react';
import { Post, User, SubjectCategory, MediaAttachment } from '../types';
import { PostCard } from './PostCard';

interface SavedViewProps {
  savedPosts: Post[];
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
  onSelectCategory: (category: SubjectCategory) => void;
  onExplore: () => void;
  onPreviewMedia?: (media: MediaAttachment) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const SavedView: React.FC<SavedViewProps> = ({
  savedPosts,
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
  onSelectCategory,
  onExplore,
  onPreviewMedia,
  onToast,
}) => {
  const [filterType, setFilterType] = useState<'all' | 'media' | 'pdf' | 'code' | 'notes'>('all');

  const filteredSaved = savedPosts.filter((post) => {
    if (filterType === 'media') return !!post.media;
    if (filterType === 'pdf') return post.media?.category === 'pdf' || post.resourceType === 'document';
    if (filterType === 'code') return !!post.codeSnippet || post.media?.category === 'code';
    if (filterType === 'notes') return !!post.resourceUrl || post.resourceType === 'notes';
    return true;
  });

  return (
    <div className="space-y-6">
      {/* Saved Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <Bookmark className="w-3.5 h-3.5 fill-blue-600" />
              Personal Study Vault
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Saved Educational Resources & Media
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Quick access to bookmarked code snippets, cheat sheets, video lectures, and PDF e-books.
            </p>
          </div>

          <div className="text-xs font-semibold px-3 py-1.5 bg-blue-50 text-blue-700 rounded-xl self-start sm:self-auto border border-blue-100">
            {savedPosts.length} Items Bookmarked
          </div>
        </div>

        {/* Filter pills */}
        <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-1.5 overflow-x-auto pb-1">
          <button
            onClick={() => setFilterType('all')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all whitespace-nowrap shrink-0 ${
              filterType === 'all'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            All Saved ({savedPosts.length})
          </button>

          <button
            onClick={() => setFilterType('media')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
              filterType === 'media'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <UploadCloud className="w-3.5 h-3.5" />
            <span>Media Attachments</span>
          </button>

          <button
            onClick={() => setFilterType('pdf')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
              filterType === 'pdf'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <FileText className="w-3.5 h-3.5" />
            <span>PDF Documents</span>
          </button>

          <button
            onClick={() => setFilterType('code')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
              filterType === 'code'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <Code2 className="w-3.5 h-3.5" />
            <span>Code Files & Snippets</span>
          </button>

          <button
            onClick={() => setFilterType('notes')}
            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-all flex items-center gap-1 whitespace-nowrap shrink-0 ${
              filterType === 'notes'
                ? 'bg-blue-600 text-white'
                : 'bg-slate-100 text-slate-600 hover:text-slate-900'
            }`}
          >
            <BookOpen className="w-3.5 h-3.5" />
            <span>Study Notes & Docs</span>
          </button>
        </div>
      </div>

      {/* Saved items stream */}
      <div className="space-y-4">
        {filteredSaved.length === 0 ? (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center shadow-xs">
            <div className="w-14 h-14 rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
              <Bookmark className="w-6 h-6" />
            </div>
            <h3 className="text-base font-bold text-slate-900">
              No saved educational resources in this category
            </h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              Click the bookmark icon on any educational post, media file, or code resource to build your study collection.
            </p>
            <button
              onClick={onExplore}
              className="mt-5 inline-flex items-center gap-2 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all hover:scale-105"
            >
              <Compass className="w-4 h-4" />
              <span>Explore Top Tech Roadmaps</span>
            </button>
          </div>
        ) : (
          filteredSaved.map((post) => (
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
