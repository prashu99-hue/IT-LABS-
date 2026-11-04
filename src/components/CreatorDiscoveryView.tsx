import React, { useState, useMemo } from 'react';
import {
  Users,
  Search,
  CheckCircle,
  GraduationCap,
  Sparkles,
  BookOpen,
  Filter,
  UserPlus,
  UserCheck,
  RotateCcw,
  ExternalLink,
  ChevronRight,
  TrendingUp,
  Award
} from 'lucide-react';
import { User, Post, SubjectCategory } from '../types';
import { POPULAR_SUBJECTS } from '../data/mockData';

interface CreatorDiscoveryViewProps {
  creators: User[];
  currentUser: User;
  posts: Post[];
  followedUserIds: Set<string>;
  onFollowToggle: (userId: string) => Promise<void> | void;
  onSelectUser: (user: User) => void;
  onSelectCategory: (category: SubjectCategory) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const CreatorDiscoveryView: React.FC<CreatorDiscoveryViewProps> = ({
  creators,
  currentUser,
  posts,
  followedUserIds,
  onFollowToggle,
  onSelectUser,
  onSelectCategory,
  onToast,
}) => {
  const [searchQuery, setSearchQuery] = useState('');
  const [roleFilter, setRoleFilter] = useState<'all' | 'teacher_expert' | 'student'>('all');
  const [subjectFilter, setSubjectFilter] = useState<SubjectCategory | 'All'>('All');
  const [sortBy, setSortBy] = useState<'followers' | 'posts' | 'name'>('followers');

  // Compute published post count per creator
  const postCountByAuthor = useMemo(() => {
    const map = new Map<string, number>();
    for (const p of posts) {
      const authorId = p.authorId || p.author?.id;
      if (authorId) {
        map.set(authorId, (map.get(authorId) || 0) + 1);
      }
    }
    return map;
  }, [posts]);

  // Feature 1 Requirement: Exclude current user from their own discovery recommendations
  const discoverableCreators = useMemo(() => {
    return creators.filter((c) => c.id !== currentUser.id);
  }, [creators, currentUser.id]);

  // Filter and sort creators
  const filteredCreators = useMemo(() => {
    const q = searchQuery.toLowerCase().trim();

    const result = discoverableCreators.filter((creator) => {
      // Role filter
      if (roleFilter !== 'all' && creator.role !== roleFilter) {
        return false;
      }

      // Subject / Expertise filter
      if (subjectFilter !== 'All') {
        const matchesSubject = creator.expertise?.some(
          (e) => e.toLowerCase() === subjectFilter.toLowerCase()
        );
        if (!matchesSubject) return false;
      }

      // Search query (name, username, bio, institution, expertise)
      if (q) {
        const corpus = [
          creator.name,
          creator.username,
          creator.title || '',
          creator.institution || '',
          creator.bio || '',
          ...(creator.expertise || []),
        ]
          .join(' ')
          .toLowerCase();

        if (!corpus.includes(q)) return false;
      }

      return true;
    });

    // Sorting
    return result.sort((a, b) => {
      if (sortBy === 'followers') {
        return (b.followersCount || 0) - (a.followersCount || 0);
      }
      if (sortBy === 'posts') {
        const postsA = postCountByAuthor.get(a.id) || 0;
        const postsB = postCountByAuthor.get(b.id) || 0;
        return postsB - postsA;
      }
      return a.name.localeCompare(b.name);
    });
  }, [discoverableCreators, searchQuery, roleFilter, subjectFilter, sortBy, postCountByAuthor]);

  const handleClearFilters = () => {
    setSearchQuery('');
    setRoleFilter('all');
    setSubjectFilter('All');
    setSortBy('followers');
  };

  const hasActiveFilters =
    searchQuery.trim() !== '' ||
    roleFilter !== 'all' ||
    subjectFilter !== 'All';

  return (
    <div className="space-y-6">
      
      {/* Header Banner */}
      <div className="bg-gradient-to-r from-blue-700 via-indigo-700 to-slate-900 rounded-3xl p-6 sm:p-8 text-white relative overflow-hidden shadow-lg shadow-blue-500/10">
        <div className="absolute inset-0 opacity-10 bg-[radial-gradient(#fff_1px,transparent_1px)] [background-size:16px_16px]" />
        
        <div className="relative z-10 max-w-2xl">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-white/10 backdrop-blur-md text-blue-200 text-xs font-semibold mb-3 border border-white/10">
            <Users className="w-3.5 h-3.5" />
            <span>Academic Community & Creators</span>
          </div>
          
          <h1 className="text-2xl sm:text-3xl font-extrabold tracking-tight">
            Discover Tech Educators & Scholars
          </h1>
          <p className="mt-2 text-xs sm:text-sm text-blue-100/90 leading-relaxed">
            Follow verified university lecturers, industry software engineers, and ambitious student researchers. Personalize your feed with top academic notes and code reviews.
          </p>

          <div className="mt-4 flex items-center gap-4 text-xs font-medium text-blue-200/90">
            <div className="flex items-center gap-1.5">
              <Sparkles className="w-4 h-4 text-amber-300" />
              <span>{discoverableCreators.filter((c) => c.role === 'teacher_expert').length} Verified Educators</span>
            </div>
            <span>•</span>
            <div className="flex items-center gap-1.5">
              <GraduationCap className="w-4 h-4 text-emerald-300" />
              <span>{discoverableCreators.filter((c) => c.role === 'student').length} Student Scholars</span>
            </div>
          </div>
        </div>
      </div>

      {/* Search & Filter Toolbar */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 shadow-xs space-y-4">
        
        {/* Search Input */}
        <div className="relative">
          <input
            type="text"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            placeholder="Search by educator name, username, university, or subject..."
            className="w-full pl-11 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-2xl text-xs sm:text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all"
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-3.5 top-3.5" />
        </div>

        {/* Filter Controls Row */}
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pt-1">
          
          {/* Role Filter Pills */}
          <div className="flex items-center gap-1.5 p-1 bg-slate-100 rounded-xl overflow-x-auto">
            <button
              onClick={() => setRoleFilter('all')}
              className={`px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === 'all'
                  ? 'bg-white text-slate-900 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              All Roles ({discoverableCreators.length})
            </button>
            <button
              onClick={() => setRoleFilter('teacher_expert')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === 'teacher_expert'
                  ? 'bg-white text-blue-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <Sparkles className="w-3.5 h-3.5 text-blue-600" />
              <span>Teachers & Experts</span>
            </button>
            <button
              onClick={() => setRoleFilter('student')}
              className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold whitespace-nowrap transition-all ${
                roleFilter === 'student'
                  ? 'bg-white text-emerald-700 shadow-xs'
                  : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5 text-emerald-600" />
              <span>Students</span>
            </button>
          </div>

          {/* Subject & Sorting Dropdowns */}
          <div className="flex items-center gap-2 overflow-x-auto">
            {/* Subject Selector */}
            <select
              value={subjectFilter}
              onChange={(e) => setSubjectFilter(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:bg-white"
            >
              <option value="All">All Disciplines</option>
              {POPULAR_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>

            {/* Sort Selector */}
            <select
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as any)}
              className="px-3 py-1.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 focus:outline-hidden focus:bg-white"
            >
              <option value="followers">Most Followers</option>
              <option value="posts">Most Published Posts</option>
              <option value="name">Alphabetical (A-Z)</option>
            </select>

            {hasActiveFilters && (
              <button
                onClick={handleClearFilters}
                className="p-1.5 text-red-600 hover:bg-red-50 rounded-xl text-xs transition-colors shrink-0"
                title="Reset filters"
              >
                <RotateCcw className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      </div>

      {/* Creators Grid */}
      {filteredCreators.length === 0 ? (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-12 text-center space-y-4 shadow-xs">
          <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
            <Users className="w-7 h-7" />
          </div>
          <div>
            <h3 className="text-base font-bold text-slate-900">No creators found</h3>
            <p className="text-xs text-slate-500 max-w-sm mx-auto mt-1">
              No registered educators or students match your filter criteria. Try adjusting your query or resetting filters.
            </p>
          </div>
          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
            >
              <RotateCcw className="w-3.5 h-3.5" />
              <span>Reset All Filters</span>
            </button>
          )}
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {filteredCreators.map((creator) => {
            const isFollowing = followedUserIds.has(creator.id) || !!creator.isFollowing;
            const postCount = postCountByAuthor.get(creator.id) || 0;
            const isEducator = creator.role === 'teacher_expert';

            return (
              <div
                key={creator.id}
                className="bg-white rounded-3xl border border-slate-200/80 hover:border-blue-300 p-5 shadow-xs hover:shadow-md transition-all flex flex-col justify-between group"
              >
                <div>
                  {/* Top Header: Avatar, Name, Role & Follow Button */}
                  <div className="flex items-start justify-between gap-3">
                    <button
                      onClick={() => onSelectUser(creator)}
                      className="flex items-start gap-3.5 text-left min-w-0"
                    >
                      <div className="relative shrink-0">
                        <img
                          src={creator.avatar}
                          alt={creator.name}
                          referrerPolicy="no-referrer"
                          className="w-14 h-14 rounded-2xl object-cover ring-2 ring-slate-100 group-hover:scale-105 transition-transform"
                          onError={(e) => {
                            (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(creator.name)}&background=2563eb&color=fff`;
                          }}
                        />
                        {creator.isVerified && (
                          <span className="absolute -bottom-1 -right-1 bg-blue-600 text-white rounded-full p-0.5 ring-2 ring-white" title="Verified Creator">
                            <CheckCircle className="w-3.5 h-3.5" />
                          </span>
                        )}
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-1.5">
                          <h3 className="text-sm font-bold text-slate-900 group-hover:text-blue-600 truncate transition-colors">
                            {creator.name}
                          </h3>
                        </div>
                        <p className="text-[11px] text-slate-500 font-mono truncate">@{creator.username}</p>
                        
                        <div className="flex items-center gap-1.5 mt-1">
                          <span className={`text-[10px] px-2 py-0.5 rounded-md font-semibold ${
                            isEducator
                              ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                              : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                          }`}>
                            {isEducator ? 'Verified Educator' : 'Student Scholar'}
                          </span>
                        </div>
                      </div>
                    </button>

                    {/* Follow / Following Button */}
                    <button
                      onClick={() => onFollowToggle(creator.id)}
                      className={`flex items-center gap-1.5 px-3.5 py-1.5 rounded-xl text-xs font-semibold transition-all shrink-0 shadow-xs ${
                        isFollowing
                          ? 'bg-slate-100 hover:bg-red-50 text-slate-700 hover:text-red-600 hover:border-red-200 border border-slate-200'
                          : 'bg-blue-600 hover:bg-blue-700 text-white shadow-blue-500/20 hover:scale-[1.02]'
                      }`}
                    >
                      {isFollowing ? (
                        <>
                          <UserCheck className="w-3.5 h-3.5 text-blue-600 group-hover:hidden" />
                          <span>Following</span>
                        </>
                      ) : (
                        <>
                          <UserPlus className="w-3.5 h-3.5" />
                          <span>Follow</span>
                        </>
                      )}
                    </button>
                  </div>

                  {/* Title & Institution */}
                  <div className="mt-3 text-xs text-slate-600">
                    <span className="font-medium text-slate-800">{creator.title}</span>
                    {creator.institution && (
                      <span className="text-slate-400"> · {creator.institution}</span>
                    )}
                  </div>

                  {/* Bio */}
                  {creator.bio && (
                    <p className="mt-2 text-xs text-slate-600 line-clamp-2 leading-relaxed">
                      {creator.bio}
                    </p>
                  )}

                  {/* Expertise Chips */}
                  {creator.expertise && creator.expertise.length > 0 && (
                    <div className="mt-3 flex items-center gap-1.5 flex-wrap">
                      {creator.expertise.map((exp) => (
                        <button
                          key={exp}
                          onClick={() => onSelectCategory(exp as SubjectCategory)}
                          className="text-[10px] font-semibold px-2 py-0.5 rounded-md bg-slate-50 hover:bg-blue-50 text-slate-600 hover:text-blue-700 border border-slate-200 transition-colors"
                        >
                          {exp}
                        </button>
                      ))}
                    </div>
                  )}
                </div>

                {/* Bottom Stats & Profile Link */}
                <div className="mt-4 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
                  <div className="flex items-center gap-3">
                    <div>
                      <strong className="text-slate-900 font-bold tabular-nums">
                        {(creator.followersCount || 0).toLocaleString()}
                      </strong>{' '}
                      Followers
                    </div>
                    <span>•</span>
                    <div>
                      <strong className="text-slate-900 font-bold tabular-nums">
                        {postCount}
                      </strong>{' '}
                      Posts
                    </div>
                  </div>

                  <button
                    onClick={() => onSelectUser(creator)}
                    className="flex items-center gap-1 text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                  >
                    <span>View Profile</span>
                    <ChevronRight className="w-3.5 h-3.5" />
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

    </div>
  );
};
