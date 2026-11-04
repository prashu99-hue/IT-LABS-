import React, { useState } from 'react';
import {
  CheckCircle,
  GraduationCap,
  Sparkles,
  UserCheck,
  UserPlus,
  BookOpen,
  Code2,
  FileText,
  MapPin,
  Calendar,
  Layers,
  ExternalLink,
  Bookmark
} from 'lucide-react';
import { User, Post, SubjectCategory, MediaAttachment } from '../types';
import { PostCard } from './PostCard';

interface ProfileViewProps {
  user: User;
  currentUser: User;
  allPosts: Post[];
  onFollowToggle: (userId: string) => void;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onShare: (post: Post) => void;
  onAddComment: (postId: string, text: string) => void;
  onReportPost: (postId: string, reason: string) => void;
  onDeletePost?: (postId: string) => Promise<void> | void;
  onDeleteAttachment?: (postId: string, attachmentId: string) => Promise<void> | void;
  onSelectUser: (user: User) => void;
  onSelectCategory: (category: SubjectCategory) => void;
  onBackToFeed: () => void;
  onPreviewMedia?: (media: MediaAttachment) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  allPosts,
  onFollowToggle,
  onLikeToggle,
  onSaveToggle,
  onShare,
  onAddComment,
  onReportPost,
  onDeletePost,
  onDeleteAttachment,
  onSelectUser,
  onSelectCategory,
  onBackToFeed,
  onPreviewMedia,
  onToast,
}) => {
  const [profileTab, setProfileTab] = useState<'posts' | 'resources' | 'saved'>('posts');

  const isSelf = user.id === currentUser.id;
  const userPosts = allPosts.filter((p) => p.author.id === user.id);
  const resourcePosts = userPosts.filter((p) => !!p.resourceUrl);
  const savedPosts = allPosts.filter((p) => p.isSaved);

  return (
    <div className="space-y-6">
      
      {/* Profile Header Card */}
      <div className="bg-white rounded-3xl border border-slate-200/80 overflow-hidden shadow-xs">
        {/* Decorative Cover Banner */}
        <div className="h-32 sm:h-44 bg-gradient-to-r from-blue-600 via-indigo-600 to-slate-900 relative">
          <div className="absolute inset-0 opacity-15 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
          <div className="absolute top-4 left-4">
            <button
              onClick={onBackToFeed}
              className="px-3 py-1.5 bg-black/30 hover:bg-black/50 text-white rounded-xl text-xs backdrop-blur-md transition-colors"
            >
              ← Back to Feed
            </button>
          </div>
        </div>

        {/* Profile Info Container */}
        <div className="px-5 sm:px-8 pb-6 sm:pb-8 pt-0 relative">
          <div className="flex flex-col sm:flex-row sm:items-end justify-between gap-4 -mt-14 sm:-mt-16 mb-4">
            {/* Avatar */}
            <div className="relative inline-block">
              <img
                src={user.avatar}
                alt={user.name}
                referrerPolicy="no-referrer"
                className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover ring-4 ring-white shadow-md bg-white"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=2563eb&color=fff`;
                }}
              />
              {user.isVerified && (
                <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-1 ring-2 ring-white shadow-xs" title="Verified Creator">
                  <CheckCircle className="w-4 h-4" />
                </span>
              )}
            </div>

            {/* Actions */}
            <div className="flex items-center gap-2">
              {!isSelf ? (
                <button
                  onClick={() => onFollowToggle(user.id)}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                    user.isFollowing
                      ? 'bg-slate-100 hover:bg-slate-200 text-slate-800'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-[1.02]'
                  }`}
                >
                  {user.isFollowing ? (
                    <>
                      <UserCheck className="w-4 h-4" />
                      <span>Following</span>
                    </>
                  ) : (
                    <>
                      <UserPlus className="w-4 h-4" />
                      <span>Follow Educator</span>
                    </>
                  )}
                </button>
              ) : (
                <div className="px-3.5 py-1.5 bg-blue-50 text-blue-700 rounded-xl text-xs font-semibold border border-blue-100">
                  Your Active Persona
                </div>
              )}
            </div>
          </div>

          {/* Name & Title */}
          <div>
            <div className="flex items-center gap-2 flex-wrap">
              <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
                {user.name}
              </h1>
              <span className="text-xs text-slate-500">@{user.username}</span>

              {user.role === 'teacher_expert' ? (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2.5 py-0.5 rounded-md border border-blue-100">
                  <Sparkles className="w-3 h-3 text-blue-600" />
                  Teacher / Expert
                </span>
              ) : (
                <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-slate-700 bg-slate-100 px-2.5 py-0.5 rounded-md">
                  <GraduationCap className="w-3 h-3 text-slate-600" />
                  Student Scholar
                </span>
              )}
            </div>

            <p className="text-xs sm:text-sm font-medium text-slate-700 mt-1">
              {user.title} · <span className="text-blue-600">{user.institution}</span>
            </p>

            {/* Bio */}
            <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
              {user.bio}
            </p>

            {/* Expertise Tags (Prompt Requirement) */}
            <div className="mt-4 flex items-center gap-2 flex-wrap">
              <span className="text-xs font-medium text-slate-400">Areas of Expertise:</span>
              {user.expertise.map((tag) => (
                <span
                  key={tag}
                  className="text-xs font-semibold px-2.5 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-blue-50 hover:text-blue-700 transition-colors cursor-pointer"
                  onClick={() => onSelectCategory(tag as SubjectCategory)}
                >
                  {tag}
                </span>
              ))}
            </div>

            {/* Stats (Followers & Following as per Prompt) */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-600">
              <div>
                <strong className="text-slate-900 text-sm font-bold tabular-nums">
                  {user.followersCount.toLocaleString()}
                </strong>{' '}
                Followers
              </div>
              <div>
                <strong className="text-slate-900 text-sm font-bold tabular-nums">
                  {user.followingCount.toLocaleString()}
                </strong>{' '}
                Following
              </div>
              <div>
                <strong className="text-slate-900 text-sm font-bold tabular-nums">
                  {userPosts.length}
                </strong>{' '}
                Published Posts
              </div>
              <div>
                <strong className="text-slate-900 text-sm font-bold tabular-nums">
                  {resourcePosts.length}
                </strong>{' '}
                Open Resources
              </div>
            </div>

          </div>
        </div>
      </div>

      {/* Profile Content Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setProfileTab('posts')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            profileTab === 'posts'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Posts & Insights ({userPosts.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('resources')}
          className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
            profileTab === 'resources'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Uploaded Notes & Code ({resourcePosts.length})</span>
        </button>

        {isSelf && (
          <button
            onClick={() => setProfileTab('saved')}
            className={`flex-1 py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 ${
              profileTab === 'saved'
                ? 'bg-blue-50 text-blue-700 font-bold'
                : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
            }`}
          >
            <Bookmark className="w-3.5 h-3.5" />
            <span>Saved ({savedPosts.length})</span>
          </button>
        )}
      </div>

      {/* Tab Content */}
      <div className="space-y-4">
        {profileTab === 'posts' && (
          userPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
              No educational posts published by this creator yet.
            </div>
          ) : (
            userPosts.map((post) => (
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
          )
        )}

        {profileTab === 'resources' && (
          resourcePosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
              No uploaded study notes or external code repositories shared yet.
            </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {resourcePosts.map((post) => (
                <div
                  key={post.id}
                  className="bg-white rounded-2xl border border-slate-200/80 p-4 shadow-xs flex flex-col justify-between"
                >
                  <div>
                    <span className="text-[11px] font-semibold text-blue-600 uppercase tracking-wide">
                      {post.subject} · {post.difficulty}
                    </span>
                    <h3 className="text-sm font-bold text-slate-900 mt-1">
                      {post.title}
                    </h3>
                    <p className="text-xs text-slate-600 mt-1 line-clamp-2">
                      {post.content}
                    </p>
                  </div>

                  <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between">
                    <span className="text-[11px] text-slate-400 truncate max-w-[150px] font-mono">
                      {post.resourceUrl}
                    </span>
                    <a
                      href={post.resourceUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="px-3 py-1.5 bg-blue-50 hover:bg-blue-100 text-blue-700 rounded-lg text-xs font-semibold flex items-center gap-1 transition-colors"
                    >
                      <span>Open Link</span>
                      <ExternalLink className="w-3 h-3" />
                    </a>
                  </div>
                </div>
              ))}
            </div>
          )
        )}

        {profileTab === 'saved' && (
          savedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
              You haven't saved any study materials yet.
            </div>
          ) : (
            savedPosts.map((post) => (
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
          )
        )}
      </div>

    </div>
  );
};
