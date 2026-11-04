import React, { useState, useEffect, useMemo } from 'react';
import {
  Search,
  X,
  Users,
  BookOpen,
  Code2,
  CheckCircle,
  ExternalLink,
  Sparkles,
  ArrowRight,
  Filter,
  FileText,
  Video,
  Image as ImageIcon,
  Download,
  Eye,
  RotateCcw,
  History,
  GraduationCap,
  Layers,
  ChevronRight,
  FolderOpen
} from 'lucide-react';
import { Post, User, SubjectCategory, DifficultyLevel, MediaAttachment, PostAttachment } from '../types';
import { PostCard } from './PostCard';
import { POPULAR_SUBJECTS } from '../data/mockData';
import { filterPostsLocally, extractAttachmentsFromPosts, SearchAttachmentResult } from '../services/postService';

interface SearchViewProps {
  initialQuery?: string;
  posts: Post[];
  creators: User[];
  currentUser: User;
  followedUserIds?: Set<string>;
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
  onPreviewMedia?: (media: MediaAttachment) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

const RECENT_SEARCHES_KEY = 'itlabs_recent_searches';
const MAX_RECENT_SEARCHES = 8;
const INITIAL_PAGE_SIZE = 8;

export const SearchView: React.FC<SearchViewProps> = ({
  initialQuery = '',
  posts,
  creators,
  currentUser,
  followedUserIds = new Set<string>(),
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
  onPreviewMedia,
  onToast,
}) => {
  const [query, setQuery] = useState(initialQuery);
  const [activeTab, setActiveTab] = useState<'all' | 'posts' | 'attachments' | 'creators'>('all');
  const [filterResourceType, setFilterResourceType] = useState<'all' | 'pdf' | 'video' | 'image' | 'code'>('all');
  const [filterSubject, setFilterSubject] = useState<SubjectCategory | 'All'>('All');
  const [filterDifficulty, setFilterDifficulty] = useState<DifficultyLevel | 'All'>('All');
  const [creatorFilter, setCreatorFilter] = useState('');
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [visiblePostsCount, setVisiblePostsCount] = useState(INITIAL_PAGE_SIZE);
  const [visibleAttachmentsCount, setVisibleAttachmentsCount] = useState(INITIAL_PAGE_SIZE);

  // Sync initial query prop changes from navbar
  useEffect(() => {
    if (initialQuery !== undefined) {
      setQuery(initialQuery);
    }
  }, [initialQuery]);

  // Load recent searches from localStorage on mount
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_SEARCHES_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (Array.isArray(parsed)) {
          setRecentSearches(parsed.slice(0, MAX_RECENT_SEARCHES));
        }
      }
    } catch (e) {
      console.warn('Could not load recent searches:', e);
    }
  }, []);

  // Save query to recent searches
  const recordRecentSearch = (searchTerm: string) => {
    const trimmed = searchTerm.trim();
    if (!trimmed || trimmed.length < 2) return;

    setRecentSearches((prev) => {
      const filtered = prev.filter((item) => item.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, MAX_RECENT_SEARCHES);
      try {
        localStorage.setItem(RECENT_SEARCHES_KEY, JSON.stringify(updated));
      } catch (e) {
        // Ignore quota errors
      }
      return updated;
    });
  };

  const clearRecentSearches = () => {
    try {
      localStorage.removeItem(RECENT_SEARCHES_KEY);
    } catch (e) {}
    setRecentSearches([]);
  };

  const handleSelectRecentSearch = (term: string) => {
    setQuery(term);
    recordRecentSearch(term);
  };

  const handleClearFilters = () => {
    setQuery('');
    setFilterResourceType('all');
    setFilterSubject('All');
    setFilterDifficulty('All');
    setCreatorFilter('');
    setActiveTab('all');
    setVisiblePostsCount(INITIAL_PAGE_SIZE);
    setVisibleAttachmentsCount(INITIAL_PAGE_SIZE);
  };

  const hasActiveFilters =
    query.trim() !== '' ||
    filterResourceType !== 'all' ||
    filterSubject !== 'All' ||
    filterDifficulty !== 'All' ||
    creatorFilter.trim() !== '';

  // Filter matching creators with deduplication
  const matchedCreators = useMemo(() => {
    const trimmed = query.toLowerCase().trim();
    const creatorFilterTrimmed = creatorFilter.toLowerCase().trim();
    const seen = new Set<string>();

    return creators.filter((creator) => {
      if (seen.has(creator.id)) return false;
      seen.add(creator.id);

      // Creator filter input check
      if (creatorFilterTrimmed) {
        const matchesCreatorInput =
          creator.name.toLowerCase().includes(creatorFilterTrimmed) ||
          creator.username.toLowerCase().includes(creatorFilterTrimmed);
        if (!matchesCreatorInput) return false;
      }

      // Subject filter check
      if (filterSubject !== 'All') {
        const teachesSubject = creator.expertise?.some(
          (e) => e.toLowerCase() === filterSubject.toLowerCase()
        );
        if (!teachesSubject) return false;
      }

      // Query token match
      if (!trimmed) return true;
      const corpus = `${creator.name} ${creator.username} ${creator.bio || ''} ${creator.institution || ''} ${(creator.expertise || []).join(' ')} ${creator.title || ''}`.toLowerCase();
      return corpus.includes(trimmed);
    });
  }, [creators, query, creatorFilter, filterSubject]);

  // Filter matching posts with deduplication & multi-token logic
  const matchedPosts = useMemo(() => {
    const filtered = filterPostsLocally(posts, {
      query,
      resourceType: filterResourceType,
      subject: filterSubject,
      difficulty: filterDifficulty,
      creatorName: creatorFilter,
    });

    // Deduplicate posts by ID
    const seen = new Set<string>();
    return filtered.filter((p) => {
      if (seen.has(p.id)) return false;
      seen.add(p.id);
      return true;
    });
  }, [posts, query, filterResourceType, filterSubject, filterDifficulty, creatorFilter]);

  // Extract individual attachment resources from matched posts
  const matchedAttachments = useMemo(() => {
    return extractAttachmentsFromPosts(matchedPosts, filterResourceType);
  }, [matchedPosts, filterResourceType]);

  // Trending academic search tags
  const popularSearches = [
    'Java',
    'Python',
    'AI/ML',
    'PDF',
    'Video',
    'Web Development',
    'Cybersecurity',
    'C++',
  ];

  // Helper to trigger media preview
  const handlePreviewAttachment = (att: PostAttachment) => {
    if (!onPreviewMedia) return;
    const name = att.fileName || att.originalFileName || att.name || 'Resource';
    const originalName = att.originalFileName || att.fileName || att.originalName || name;
    const size = typeof att.fileSize === 'number' ? att.fileSize : (typeof att.size === 'number' ? att.size : 0);
    const sizeFormatted = att.sizeFormatted || (size > 0 ? `${(size / (1024 * 1024)).toFixed(1)} MB` : 'Saved');
    const url = att.permanentFileUrl || att.url || '';
    const id = att.attachmentId || att.id || 'att-' + Math.random().toString(36).substring(2, 7);
    const extension = att.extension || originalName.split('.').pop()?.toLowerCase() || 'bin';
    const cat = att.fileType === 'pdf' ? 'pdf' : (att.fileType === 'video' ? 'video' : (att.fileType === 'code' ? 'code' : (att.category || 'image')));

    const mediaObj: MediaAttachment = {
      attachmentId: id,
      id,
      name,
      fileName: name,
      originalName,
      originalFileName: originalName,
      extension,
      mimeType: att.mimeType || 'application/octet-stream',
      category: cat as any,
      size,
      fileSize: size,
      sizeFormatted,
      url,
      permanentFileUrl: url,
      storageProvider: att.storageProvider || 'IT LABS Server Storage',
      uploadedAt: att.uploadedAt || 'Recently',
      downloadUrl: att.downloadUrl || url,
      thumbnailUrl: att.thumbnailUrl,
      codeContent: att.codeContent,
    };
    onPreviewMedia(mediaObj);
  };

  const handleDownloadAttachment = (att: PostAttachment, e: React.MouseEvent) => {
    e.stopPropagation();
    const downloadUrl = att.downloadUrl || att.permanentFileUrl;
    if (!downloadUrl) {
      onToast?.('Download URL unavailable for this file', 'error');
      return;
    }
    const link = document.createElement('a');
    link.href = downloadUrl;
    link.download = att.originalFileName || att.fileName || 'educational-resource';
    link.target = '_blank';
    link.rel = 'noopener noreferrer';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    onToast?.(`Downloading ${att.originalFileName || att.fileName}`, 'info');
  };

  return (
    <div className="space-y-6">
      
      {/* Search Bar & Filters Control Center */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
        
        {/* Search input with icons */}
        <div className="relative">
          <input
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            onKeyDown={(e) => {
              if (e.key === 'Enter') {
                recordRecentSearch(query);
              }
            }}
            placeholder="Search educational posts, PDF notes, videos, code snippets, creators..."
            className="w-full pl-11 pr-10 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl text-sm focus:outline-hidden focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-all font-medium text-slate-900 placeholder:text-slate-400"
            autoFocus
          />
          <Search className="w-5 h-5 text-slate-400 absolute left-4 top-4" />
          {query && (
            <button
              onClick={() => setQuery('')}
              className="absolute right-3.5 top-3.5 p-1 text-slate-400 hover:text-slate-600 rounded-lg hover:bg-slate-100"
              title="Clear search query"
            >
              <X className="w-4 h-4" />
            </button>
          )}
        </div>

        {/* Recent Searches Row */}
        {recentSearches.length > 0 && !query && (
          <div className="pt-1">
            <div className="flex items-center justify-between text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
              <span className="flex items-center gap-1">
                <History className="w-3.5 h-3.5" />
                Recent Searches
              </span>
              <button
                onClick={clearRecentSearches}
                className="text-[10px] text-slate-400 hover:text-red-600 lowercase font-medium transition-colors"
              >
                clear history
              </button>
            </div>
            <div className="flex flex-wrap gap-1.5">
              {recentSearches.map((term) => (
                <button
                  key={term}
                  onClick={() => handleSelectRecentSearch(term)}
                  className="px-2.5 py-1 bg-slate-100 hover:bg-blue-50 hover:text-blue-600 text-slate-700 border border-slate-200/80 rounded-lg text-xs font-medium transition-colors flex items-center gap-1.5"
                >
                  <Search className="w-3 h-3 text-slate-400" />
                  <span>{term}</span>
                </button>
              ))}
            </div>
          </div>
        )}

        {/* Filter Row 1: Resource Type Pills */}
        <div className="pt-1">
          <div className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-2">
            Resource Type
          </div>
          <div className="flex flex-wrap gap-1.5">
            {[
              { id: 'all', label: 'All Resources', icon: Layers },
              { id: 'pdf', label: 'PDF Documents', icon: FileText },
              { id: 'video', label: 'Educational Videos', icon: Video },
              { id: 'image', label: 'Diagrams & Images', icon: ImageIcon },
              { id: 'code', label: 'Code Snippets', icon: Code2 },
            ].map((type) => {
              const IconComp = type.icon;
              const isSelected = filterResourceType === type.id;
              return (
                <button
                  key={type.id}
                  onClick={() => setFilterResourceType(type.id as any)}
                  className={`flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold transition-all border ${
                    isSelected
                      ? 'bg-blue-600 text-white border-blue-600 shadow-xs'
                      : 'bg-slate-50 text-slate-700 border-slate-200 hover:bg-slate-100'
                  }`}
                >
                  <IconComp className="w-3.5 h-3.5" />
                  <span>{type.label}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Filter Row 2: Subject, Difficulty, Creator Filters */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-2.5 pt-1">
          
          {/* Subject Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Subject / Topic
            </label>
            <select
              value={filterSubject}
              onChange={(e) => setFilterSubject(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
            >
              <option value="All">All Subjects (Java, Python, C++, ...)</option>
              {POPULAR_SUBJECTS.map((sub) => (
                <option key={sub} value={sub}>
                  {sub}
                </option>
              ))}
            </select>
          </div>

          {/* Difficulty Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Difficulty Level
            </label>
            <select
              value={filterDifficulty}
              onChange={(e) => setFilterDifficulty(e.target.value as any)}
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
            >
              <option value="All">All Levels</option>
              <option value="Beginner">Beginner</option>
              <option value="Intermediate">Intermediate</option>
              <option value="Advanced">Advanced</option>
            </select>
          </div>

          {/* Creator Name Filter */}
          <div>
            <label className="block text-[11px] font-semibold text-slate-400 uppercase tracking-wider mb-1">
              Creator / Author
            </label>
            <div className="relative">
              <input
                type="text"
                value={creatorFilter}
                onChange={(e) => setCreatorFilter(e.target.value)}
                placeholder="Filter by author name..."
                className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500 placeholder:text-slate-400"
              />
              <Users className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>
        </div>

        {/* Clear Filters & Popular Tags */}
        <div className="flex flex-wrap items-center justify-between gap-2 pt-2 border-t border-slate-100">
          <div className="flex items-center gap-1.5 flex-wrap">
            <span className="text-[11px] font-semibold text-slate-400 uppercase tracking-wider mr-1">
              Popular:
            </span>
            {popularSearches.map((s) => (
              <button
                key={s}
                onClick={() => {
                  setQuery(s);
                  recordRecentSearch(s);
                }}
                className="px-2 py-0.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200/80 rounded-md text-[11px] font-medium text-slate-600 transition-colors"
              >
                {s}
              </button>
            ))}
          </div>

          {hasActiveFilters && (
            <button
              onClick={handleClearFilters}
              className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-semibold text-red-600 bg-red-50 hover:bg-red-100 border border-red-200 transition-colors"
            >
              <RotateCcw className="w-3 h-3" />
              <span>Clear Filters</span>
            </button>
          )}
        </div>
      </div>

      {/* Result Tabs Navigation */}
      <div className="flex items-center gap-2 p-1 bg-white rounded-2xl border border-slate-200/80 shadow-xs overflow-x-auto">
        <button
          onClick={() => setActiveTab('all')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'all'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Sparkles className="w-3.5 h-3.5" />
          <span>All Results</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'all' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {matchedPosts.length + matchedCreators.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('posts')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'posts'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <BookOpen className="w-3.5 h-3.5" />
          <span>Posts & Notes</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'posts' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {matchedPosts.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('attachments')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'attachments'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FolderOpen className="w-3.5 h-3.5" />
          <span>Attached Media & Files</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'attachments' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {matchedAttachments.length}
          </span>
        </button>

        <button
          onClick={() => setActiveTab('creators')}
          className={`flex items-center gap-1.5 px-3.5 py-2 rounded-xl text-xs font-semibold whitespace-nowrap transition-all ${
            activeTab === 'creators'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-3.5 h-3.5" />
          <span>Creators & Scholars</span>
          <span className={`text-[10px] px-1.5 py-0.2 rounded-full ${activeTab === 'creators' ? 'bg-blue-700 text-white' : 'bg-slate-100 text-slate-600'}`}>
            {matchedCreators.length}
          </span>
        </button>
      </div>

      {/* Main Results Container */}
      <div className="space-y-6">

        {/* Section 1: Creators Results */}
        {(activeTab === 'all' || activeTab === 'creators') && matchedCreators.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <Users className="w-4 h-4 text-blue-600" />
                <span>Scholars & Verified Educators ({matchedCreators.length})</span>
              </h3>
              {activeTab === 'all' && matchedCreators.length > 4 && (
                <button
                  onClick={() => setActiveTab('creators')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <span>View all {matchedCreators.length}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(activeTab === 'all' ? matchedCreators.slice(0, 4) : matchedCreators).map((creator) => (
                <div
                  key={creator.id}
                  className="p-4 rounded-2xl border border-slate-100 hover:border-blue-200 bg-slate-50/50 hover:bg-blue-50/20 transition-all flex items-start justify-between gap-3 group"
                >
                  <button
                    onClick={() => onSelectUser(creator)}
                    className="flex items-start gap-3 text-left min-w-0"
                  >
                    <img
                      src={creator.avatar}
                      alt={creator.name}
                      referrerPolicy="no-referrer"
                      className="w-11 h-11 rounded-full object-cover shrink-0 border border-slate-200 group-hover:scale-105 transition-transform"
                    />
                    <div className="min-w-0">
                      <div className="flex items-center gap-1">
                        <span className="text-xs font-bold text-slate-900 group-hover:text-blue-600 truncate">
                          {creator.name}
                        </span>
                        {creator.isVerified && (
                          <CheckCircle className="w-3.5 h-3.5 text-blue-600 shrink-0" />
                        )}
                      </div>
                      <div className="flex items-center gap-1.5 mt-0.5">
                        <span className={`text-[10px] px-1.5 py-0.2 rounded font-semibold ${
                          creator.role === 'teacher_expert'
                            ? 'bg-indigo-50 text-indigo-700 border border-indigo-100'
                            : 'bg-emerald-50 text-emerald-700 border border-emerald-100'
                        }`}>
                          {creator.role === 'teacher_expert' ? 'Educator' : 'Student'}
                        </span>
                        <p className="text-[11px] text-slate-500 truncate">{creator.institution}</p>
                      </div>
                      <div className="flex items-center gap-1 mt-2 flex-wrap">
                        {creator.expertise?.slice(0, 3).map((e) => (
                          <span
                            key={e}
                            className="text-[10px] px-1.5 py-0.2 rounded bg-white text-slate-600 border border-slate-200 font-medium"
                          >
                            {e}
                          </span>
                        ))}
                      </div>
                    </div>
                  </button>

                  {creator.id !== currentUser.id && (
                    <button
                      onClick={() => onFollowToggle(creator.id)}
                      className={`text-xs px-3 py-1.5 rounded-xl font-semibold transition-colors shrink-0 shadow-xs ${
                        (followedUserIds.has(creator.id) || creator.isFollowing)
                          ? 'bg-slate-200 text-slate-700 hover:bg-slate-300'
                          : 'bg-blue-600 text-white hover:bg-blue-700'
                      }`}
                    >
                      {(followedUserIds.has(creator.id) || creator.isFollowing) ? 'Following' : 'Follow'}
                    </button>
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Section 2: Direct Attachments Resource Grid */}
        {(activeTab === 'all' || activeTab === 'attachments') && matchedAttachments.length > 0 && (
          <div className="bg-white rounded-3xl border border-slate-200/80 p-5 sm:p-6 shadow-xs space-y-4">
            <div className="flex items-center justify-between">
              <div>
                <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                  <FolderOpen className="w-4 h-4 text-blue-600" />
                  <span>Educational Files & Attached Media ({matchedAttachments.length})</span>
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Directly preview and download PDF notes, educational videos, and code samples.
                </p>
              </div>
              {activeTab === 'all' && matchedAttachments.length > 6 && (
                <button
                  onClick={() => setActiveTab('attachments')}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 flex items-center gap-0.5"
                >
                  <span>View all {matchedAttachments.length}</span>
                  <ChevronRight className="w-3.5 h-3.5" />
                </button>
              )}
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {(activeTab === 'all' ? matchedAttachments.slice(0, 6) : matchedAttachments.slice(0, visibleAttachmentsCount)).map((item, idx) => {
                const att = item.attachment;
                const post = item.parentPost;
                const isPdf = att.fileType === 'pdf';
                const isVideo = att.fileType === 'video';
                const isCode = att.fileType === 'code';
                const isImage = att.fileType === 'image';

                return (
                  <div
                    key={`${att.attachmentId || att.id}_${idx}`}
                    className="p-3.5 rounded-2xl border border-slate-200 hover:border-blue-300 bg-slate-50/40 hover:bg-blue-50/20 transition-all flex flex-col justify-between space-y-3 group"
                  >
                    <div className="flex items-start gap-3">
                      {/* File Icon Badge */}
                      <div className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs ${
                        isPdf
                          ? 'bg-red-50 text-red-600 border border-red-200'
                          : isVideo
                          ? 'bg-purple-50 text-purple-600 border border-purple-200'
                          : isCode
                          ? 'bg-amber-50 text-amber-700 border border-amber-200'
                          : 'bg-emerald-50 text-emerald-600 border border-emerald-200'
                      }`}>
                        {isPdf && <FileText className="w-5 h-5" />}
                        {isVideo && <Video className="w-5 h-5" />}
                        {isCode && <Code2 className="w-5 h-5" />}
                        {isImage && <ImageIcon className="w-5 h-5" />}
                      </div>

                      {/* File Info */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center gap-1.5">
                          <span className="text-xs font-bold text-slate-900 truncate group-hover:text-blue-600">
                            {att.originalFileName || att.fileName}
                          </span>
                        </div>
                        <div className="flex items-center gap-2 mt-0.5 text-[11px] text-slate-500">
                          <span className="font-semibold uppercase text-[10px] px-1 rounded bg-slate-200/80 text-slate-700">
                            {att.extension || att.fileType}
                          </span>
                          <span>•</span>
                          <span>{att.sizeFormatted || 'Saved'}</span>
                          <span>•</span>
                          <span className="text-slate-400 truncate max-w-[100px]">{post.subject}</span>
                        </div>
                        
                        {/* Parent Post Title & Author */}
                        <div className="mt-1.5 flex items-center gap-1 text-[11px] text-slate-600">
                          <span className="text-slate-400">from:</span>
                          <span className="font-medium text-slate-700 truncate max-w-[140px]">{post.title}</span>
                          <span className="text-slate-400">by</span>
                          <button
                            onClick={() => onSelectUser(post.author)}
                            className="font-semibold text-blue-600 hover:underline truncate"
                          >
                            {post.author?.name}
                          </button>
                        </div>
                      </div>
                    </div>

                    {/* Preview & Download Buttons */}
                    <div className="flex items-center gap-2 pt-2 border-t border-slate-200/60">
                      <button
                        onClick={() => handlePreviewAttachment(att)}
                        className="flex-1 flex items-center justify-center gap-1.5 py-1.5 px-3 bg-white hover:bg-blue-600 text-slate-700 hover:text-white border border-slate-200 hover:border-blue-600 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        <span>Preview</span>
                      </button>
                      <button
                        onClick={(e) => handleDownloadAttachment(att, e)}
                        className="flex items-center justify-center gap-1.5 py-1.5 px-3 bg-slate-100 hover:bg-slate-200 text-slate-700 border border-slate-200 rounded-xl text-xs font-semibold shadow-xs transition-colors"
                        title="Download resource"
                      >
                        <Download className="w-3.5 h-3.5" />
                        <span className="hidden sm:inline">Download</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Pagination for attachments in dedicated tab */}
            {activeTab === 'attachments' && visibleAttachmentsCount < matchedAttachments.length && (
              <div className="text-center pt-2">
                <button
                  onClick={() => setVisibleAttachmentsCount((prev) => prev + 6)}
                  className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-800 rounded-xl text-xs font-semibold transition-colors"
                >
                  Load More Attachments ({matchedAttachments.length - visibleAttachmentsCount} remaining)
                </button>
              </div>
            )}
          </div>
        )}

        {/* Section 3: Posts & Educational Notes Results */}
        {(activeTab === 'all' || activeTab === 'posts') && (
          <div className="space-y-4">
            <div className="flex items-center justify-between px-1">
              <h3 className="text-sm font-bold text-slate-900 flex items-center gap-1.5">
                <BookOpen className="w-4 h-4 text-blue-600" />
                <span>Educational Posts & Notes ({matchedPosts.length})</span>
              </h3>
              {matchedPosts.length > 0 && (
                <span className="text-xs text-slate-500">
                  Showing {Math.min(visiblePostsCount, matchedPosts.length)} of {matchedPosts.length}
                </span>
              )}
            </div>

            {matchedPosts.length === 0 ? (
              <div className="bg-white rounded-3xl border border-slate-200/80 p-8 sm:p-12 text-center space-y-4 shadow-xs">
                <div className="w-14 h-14 mx-auto rounded-2xl bg-blue-50 text-blue-600 flex items-center justify-center">
                  <Search className="w-7 h-7" />
                </div>
                <div>
                  <h4 className="text-base font-bold text-slate-900">
                    No resources matched your search criteria
                  </h4>
                  <p className="text-xs text-slate-500 max-w-md mx-auto mt-1">
                    {query ? (
                      <>We couldn't find any resources matching "<span className="font-semibold text-slate-700">{query}</span>". Try checking for spelling errors, using simpler keywords, or resetting filters.</>
                    ) : (
                      'Try choosing a different subject or difficulty level, or search for popular topics below.'
                    )}
                  </p>
                </div>

                <div className="flex flex-wrap items-center justify-center gap-2 pt-2">
                  {popularSearches.map((s) => (
                    <button
                      key={s}
                      onClick={() => {
                        setQuery(s);
                        recordRecentSearch(s);
                      }}
                      className="px-3 py-1.5 bg-slate-50 hover:bg-blue-50 hover:text-blue-600 border border-slate-200 rounded-xl text-xs font-medium text-slate-700 transition-colors"
                    >
                      Search "{s}"
                    </button>
                  ))}
                </div>

                {hasActiveFilters && (
                  <div className="pt-2">
                    <button
                      onClick={handleClearFilters}
                      className="inline-flex items-center gap-1.5 px-4 py-2 bg-blue-600 hover:bg-blue-700 text-white text-xs font-semibold rounded-xl shadow-xs transition-colors"
                    >
                      <RotateCcw className="w-3.5 h-3.5" />
                      <span>Reset All Filters</span>
                    </button>
                  </div>
                )}
              </div>
            ) : (
              <div className="space-y-4">
                {matchedPosts.slice(0, visiblePostsCount).map((post) => (
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
                ))}

                {/* Pagination / Load More Posts */}
                {visiblePostsCount < matchedPosts.length && (
                  <div className="text-center pt-2">
                    <button
                      onClick={() => setVisiblePostsCount((prev) => prev + 6)}
                      className="px-5 py-2.5 bg-white hover:bg-slate-50 border border-slate-200 text-slate-800 rounded-2xl text-xs font-semibold shadow-xs hover:border-slate-300 transition-all inline-flex items-center gap-1.5"
                    >
                      <span>Load More Educational Posts</span>
                      <span className="text-slate-400">
                        ({matchedPosts.length - visiblePostsCount} remaining)
                      </span>
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </div>
  );
};
