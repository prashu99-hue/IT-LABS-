import React, { useState, useEffect } from 'react';
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
  Bookmark,
  Users,
  ChevronRight,
  Loader2
} from 'lucide-react';
import { User, Post, SubjectCategory, MediaAttachment } from '../types';
import { PostCard } from './PostCard';
import { fetchFollowersListFromFirestore, fetchFollowingListFromFirestore } from '../services/followService';

interface ProfileViewProps {
  user: User;
  currentUser: User;
  allPosts: Post[];
  creators?: User[];
  followedUserIds?: Set<string>;
  onFollowToggle: (userId: string) => Promise<void> | void;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onShare: (post: Post) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => Promise<void> | void;
  onReportPost: (postId: string, reason: string) => void;
  onDeletePost?: (postId: string) => Promise<void> | void;
  onDeleteAttachment?: (postId: string, attachmentId: string) => Promise<void> | void;
  onSelectUser: (user: User) => void;
  onSelectCategory: (category: SubjectCategory) => void;
  onBackToFeed: () => void;
  onPreviewMedia?: (media: MediaAttachment) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
  isAdminVerified?: boolean;
}

export const ProfileView: React.FC<ProfileViewProps> = ({
  user,
  currentUser,
  allPosts,
  creators = [],
  followedUserIds = new Set<string>(),
  onFollowToggle,
  onLikeToggle,
  onSaveToggle,
  onShare,
  onAddComment,
  onDeleteComment,
  onReportPost,
  onDeletePost,
  onDeleteAttachment,
  onSelectUser,
  onSelectCategory,
  onBackToFeed,
  onPreviewMedia,
  onToast,
  isAdminVerified,
}) => {
  const [profileTab, setProfileTab] = useState<'posts' | 'resources' | 'followers' | 'following' | 'saved'>('posts');
  const [followersList, setFollowersList] = useState<User[]>([]);
  const [followingList, setFollowingList] = useState<User[]>([]);
  const [isLoadingLists, setIsLoadingLists] = useState(false);

  const isSelf = user.id === currentUser.id;
  const isFollowingUser = followedUserIds.has(user.id) || !!user.isFollowing;
  const userPosts = allPosts.filter((p) => p.author.id === user.id || p.authorId === user.id);
  const resourcePosts = userPosts.filter((p) => !!p.resourceUrl || (p.attachments && p.attachments.length > 0));
  const savedPosts = allPosts.filter((p) => p.isSaved);

  // Load followers and following lists when switching to those tabs or user changes
  useEffect(() => {
    let isMounted = true;
    async function loadLists() {
      setIsLoadingLists(true);
      try {
        const [followers, following] = await Promise.all([
          fetchFollowersListFromFirestore(user.id),
          fetchFollowingListFromFirestore(user.id),
        ]);

        if (isMounted) {
          // Merge with any known creators for enriched metadata if needed
          const enrichUser = (u: User) => {
            const found = creators.find((c) => c.id === u.id);
            if (found) {
              return { ...found, ...u };
            }
            return u;
          };

          setFollowersList(followers.map(enrichUser));
          setFollowingList(following.map(enrichUser));
        }
      } catch (err) {
        console.warn('Could not load followers/following lists:', err);
      } finally {
        if (isMounted) setIsLoadingLists(false);
      }
    }

    loadLists();
    return () => {
      isMounted = false;
    };
  }, [user.id, creators]);

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
              className="px-3.5 py-1.5 bg-black/40 hover:bg-black/60 text-white rounded-xl text-xs backdrop-blur-md transition-colors font-medium flex items-center gap-1.5"
            >
              <span>← Back to Feed</span>
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

            {/* Actions: Follow / Following Button */}
            <div className="flex items-center gap-2">
              {!isSelf ? (
                <button
                  onClick={() => onFollowToggle(user.id)}
                  className={`flex items-center gap-1.5 px-5 py-2.5 rounded-xl text-xs font-semibold shadow-xs transition-all ${
                    isFollowingUser
                      ? 'bg-slate-100 hover:bg-red-50 text-slate-800 hover:text-red-600 hover:border-red-200 border border-slate-200'
                      : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-[1.02]'
                  }`}
                >
                  {isFollowingUser ? (
                    <>
                      <UserCheck className="w-4 h-4 text-blue-600" />
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
              <span className="text-xs text-slate-500 font-mono">@{user.username}</span>

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
            {user.bio && (
              <p className="mt-3 text-xs sm:text-sm text-slate-600 leading-relaxed max-w-3xl">
                {user.bio}
              </p>
            )}

            {/* Expertise Tags */}
            {user.expertise && user.expertise.length > 0 && (
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
            )}

            {/* Stats (Followers & Following clickable for Feature 3) */}
            <div className="mt-5 pt-4 border-t border-slate-100 flex items-center gap-6 text-xs text-slate-600 flex-wrap">
              <button
                onClick={() => setProfileTab('followers')}
                className="hover:text-blue-600 transition-colors text-left"
              >
                <strong className="text-slate-900 text-sm font-bold tabular-nums">
                  {(user.followersCount || 0).toLocaleString()}
                </strong>{' '}
                Followers
              </button>

              <button
                onClick={() => setProfileTab('following')}
                className="hover:text-blue-600 transition-colors text-left"
              >
                <strong className="text-slate-900 text-sm font-bold tabular-nums">
                  {(user.followingCount || 0).toLocaleString()}
                </strong>{' '}
                Following
              </button>

              <button
                onClick={() => setProfileTab('posts')}
                className="hover:text-blue-600 transition-colors text-left"
              >
                <strong className="text-slate-900 text-sm font-bold tabular-nums">
                  {userPosts.length}
                </strong>{' '}
                Published Posts
              </button>

              <button
                onClick={() => setProfileTab('resources')}
                className="hover:text-blue-600 transition-colors text-left"
              >
                <strong className="text-slate-900 text-sm font-bold tabular-nums">
                  {resourcePosts.length}
                </strong>{' '}
                Open Resources
              </button>
            </div>

          </div>
        </div>
      </div>

      {/* Profile Content Navigation Tabs */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1 overflow-x-auto">
        <button
          onClick={() => setProfileTab('posts')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            profileTab === 'posts'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-3.5 h-3.5" />
          <span>Posts ({userPosts.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('resources')}
          className={`flex-1 min-w-[140px] py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            profileTab === 'resources'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Notes & Media ({resourcePosts.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('followers')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            profileTab === 'followers'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Followers ({user.followersCount || followersList.length})</span>
        </button>

        <button
          onClick={() => setProfileTab('following')}
          className={`flex-1 min-w-[120px] py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
            profileTab === 'following'
              ? 'bg-blue-50 text-blue-700 font-bold'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <UserCheck className="w-3.5 h-3.5" />
          <span>Following ({user.followingCount || followingList.length})</span>
        </button>

        {isSelf && (
          <button
            onClick={() => setProfileTab('saved')}
            className={`flex-1 min-w-[100px] py-2 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-1.5 whitespace-nowrap ${
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

      {/* Tab Content Area */}
      <div className="space-y-4">
        {/* Posts Tab */}
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
                onDeleteComment={onDeleteComment}
                onReportPost={onReportPost}
                onDeletePost={onDeletePost}
                onDeleteAttachment={onDeleteAttachment}
                onSelectUser={onSelectUser}
                onSelectCategory={onSelectCategory}
                onPreviewMedia={onPreviewMedia}
                onToast={onToast}
                isAdminVerified={isAdminVerified}
              />
            ))
          )
        )}

        {/* Resources & Media Tab */}
        {profileTab === 'resources' && (
          resourcePosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
              No notes, PDFs, code files, or educational videos uploaded yet.
            </div>
          ) : (
            resourcePosts.map((post) => (
              <PostCard
                key={post.id}
                post={post}
                currentUser={currentUser}
                onLikeToggle={onLikeToggle}
                onSaveToggle={onSaveToggle}
                onFollowToggle={onFollowToggle}
                onShare={onShare}
                onAddComment={onAddComment}
                onDeleteComment={onDeleteComment}
                onReportPost={onReportPost}
                onDeletePost={onDeletePost}
                onDeleteAttachment={onDeleteAttachment}
                onSelectUser={onSelectUser}
                onSelectCategory={onSelectCategory}
                onPreviewMedia={onPreviewMedia}
                onToast={onToast}
                isAdminVerified={isAdminVerified}
              />
            ))
          )
        )}

        {/* Followers List Tab (Feature 3) */}
        {profileTab === 'followers' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Followers of {user.name}</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {followersList.length} members
              </span>
            </div>

            {isLoadingLists ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading followers...</span>
              </div>
            ) : followersList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No one has followed this creator yet. Be the first to follow!
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {followersList.map((member) => {
                  const isFollowingMember = followedUserIds.has(member.id) || !!member.isFollowing;
                  const isCurrent = member.id === currentUser.id;

                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-3 group"
                    >
                      <button
                        onClick={() => onSelectUser(member)}
                        className="flex items-start gap-3 text-left min-w-0 flex-1"
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563eb&color=fff`;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                              {member.name}
                            </span>
                            {member.isVerified && (
                              <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate">@{member.username}</p>
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">{member.title || member.institution}</p>
                        </div>
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => onFollowToggle(member.id)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-semibold transition-colors shrink-0 shadow-xs ${
                            isFollowingMember
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isFollowingMember ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Following List Tab (Feature 3) */}
        {profileTab === 'following' && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between pb-2 border-b border-slate-100">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-2">
                <UserCheck className="w-4 h-4 text-blue-600" />
                <span>Creators Followed by {user.name}</span>
              </h3>
              <span className="text-xs text-slate-500 font-medium">
                {followingList.length} creators
              </span>
            </div>

            {isLoadingLists ? (
              <div className="py-8 text-center text-xs text-slate-500 flex items-center justify-center gap-2">
                <Loader2 className="w-4 h-4 animate-spin text-blue-600" />
                <span>Loading followed creators...</span>
              </div>
            ) : followingList.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                This creator is not currently following anyone.
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                {followingList.map((member) => {
                  const isFollowingMember = followedUserIds.has(member.id) || !!member.isFollowing;
                  const isCurrent = member.id === currentUser.id;

                  return (
                    <div
                      key={member.id}
                      className="p-3.5 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-3 group"
                    >
                      <button
                        onClick={() => onSelectUser(member)}
                        className="flex items-start gap-3 text-left min-w-0 flex-1"
                      >
                        <img
                          src={member.avatar}
                          alt={member.name}
                          referrerPolicy="no-referrer"
                          className="w-10 h-10 rounded-full object-cover shrink-0 ring-1 ring-slate-200 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(member.name)}&background=2563eb&color=fff`;
                          }}
                        />
                        <div className="min-w-0">
                          <div className="flex items-center gap-1">
                            <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                              {member.name}
                            </span>
                            {member.isVerified && (
                              <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                            )}
                          </div>
                          <p className="text-[11px] text-slate-500 font-mono truncate">@{member.username}</p>
                          <p className="text-[11px] text-slate-600 truncate mt-0.5">{member.title || member.institution}</p>
                        </div>
                      </button>

                      {!isCurrent && (
                        <button
                          onClick={() => onFollowToggle(member.id)}
                          className={`text-xs px-2.5 py-1 rounded-xl font-semibold transition-colors shrink-0 shadow-xs ${
                            isFollowingMember
                              ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                              : 'bg-blue-600 text-white hover:bg-blue-700'
                          }`}
                        >
                          {isFollowingMember ? 'Following' : 'Follow'}
                        </button>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}

        {/* Saved Posts Tab (Self Only) */}
        {profileTab === 'saved' && isSelf && (
          savedPosts.length === 0 ? (
            <div className="bg-white rounded-2xl border border-slate-200/80 p-8 text-center text-xs text-slate-500">
              You haven't bookmarked any educational resources yet. Click the bookmark icon on any post to save it for quick review.
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
                isAdminVerified={isAdminVerified}
              />
            ))
          )
        )}
      </div>

    </div>
  );
};
