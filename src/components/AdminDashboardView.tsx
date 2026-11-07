import React, { useState, useMemo } from 'react';
import {
  ShieldCheck,
  Users,
  FileText,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Star,
  Trash2,
  Sparkles,
  Search,
  ExternalLink,
  GraduationCap,
  Filter,
  Film,
  Code,
  FileDown,
  Image,
  RefreshCw,
  UserX,
  Award,
  AlertCircle
} from 'lucide-react';
import { User, Post, PostReport, UserRole, SubjectCategory } from '../types';

interface AdminDashboardViewProps {
  users: User[];
  posts: Post[];
  reports: PostReport[];
  currentAdmin: User;
  onToggleUserVerification: (userId: string) => Promise<void> | void;
  onUpdateUserRole?: (userId: string, role: UserRole, title?: string) => Promise<void> | void;
  onDeleteUser?: (userId: string) => Promise<void> | void;
  onToggleFeaturedPost: (postId: string) => Promise<void> | void;
  onDeletePost: (postId: string) => Promise<void> | void;
  onResolveReport: (reportId: string, action: 'dismiss' | 'delete') => Promise<void> | void;
  onSelectUser: (user: User) => void;
  onPreviewPost?: (post: Post) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  users,
  posts,
  reports,
  currentAdmin,
  onToggleUserVerification,
  onUpdateUserRole,
  onDeleteUser,
  onToggleFeaturedPost,
  onDeletePost,
  onResolveReport,
  onSelectUser,
  onPreviewPost,
  onToast,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'reports'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [userRoleFilter, setUserRoleFilter] = useState<'all' | 'teacher_expert' | 'student'>('all');
  const [userVerifiedFilter, setUserVerifiedFilter] = useState<'all' | 'verified' | 'unverified'>('all');

  const [contentSearch, setContentSearch] = useState('');
  const [contentSubjectFilter, setContentSubjectFilter] = useState<SubjectCategory | 'All'>('All');
  const [contentFeaturedFilter, setContentFeaturedFilter] = useState<'all' | 'featured' | 'regular'>('all');

  const [reportStatusFilter, setReportStatusFilter] = useState<'pending' | 'dismissed' | 'reviewed' | 'all'>('pending');

  // Confirmation modal states
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<User | null>(null);
  const [confirmDeletePost, setConfirmDeletePost] = useState<Post | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);

  // Compute live platform metrics
  const metrics = useMemo(() => {
    let images = 0;
    let videos = 0;
    let pdfs = 0;
    let codeFiles = 0;

    posts.forEach((p) => {
      if (Array.isArray(p.attachments)) {
        p.attachments.forEach((att) => {
          const type = att.fileType || att.category;
          if (type === 'image') images++;
          else if (type === 'video') videos++;
          else if (type === 'pdf') pdfs++;
          else if (type === 'code') codeFiles++;
        });
      } else if (p.media) {
        const type = p.media.fileType || p.media.category;
        if (type === 'image') images++;
        else if (type === 'video') videos++;
        else if (type === 'pdf') pdfs++;
        else if (type === 'code') codeFiles++;
      }
    });

    return {
      totalUsers: users.length,
      verifiedEducators: users.filter((u) => u.isVerified).length,
      totalPosts: posts.length,
      featuredPosts: posts.filter((p) => p.isFeatured).length,
      pendingReports: reports.filter((r) => r.status === 'pending').length,
      totalReports: reports.length,
      images,
      videos,
      pdfs,
      codeFiles,
    };
  }, [users, posts, reports]);

  // Filtered Users List
  const filteredUsers = useMemo(() => {
    const q = userSearch.toLowerCase().trim();
    return users.filter((u) => {
      if (userRoleFilter !== 'all' && u.role !== userRoleFilter) return false;
      if (userVerifiedFilter === 'verified' && !u.isVerified) return false;
      if (userVerifiedFilter === 'unverified' && u.isVerified) return false;

      if (q) {
        const corpus = `${u.name} ${u.username} ${u.institution || ''} ${u.title || ''} ${u.bio || ''}`.toLowerCase();
        if (!corpus.includes(q)) return false;
      }
      return true;
    });
  }, [users, userSearch, userRoleFilter, userVerifiedFilter]);

  // Filtered Posts List
  const filteredPosts = useMemo(() => {
    const q = contentSearch.toLowerCase().trim();
    return posts.filter((p) => {
      if (contentSubjectFilter !== 'All' && p.subject !== contentSubjectFilter) return false;
      if (contentFeaturedFilter === 'featured' && !p.isFeatured) return false;
      if (contentFeaturedFilter === 'regular' && p.isFeatured) return false;

      if (q) {
        const corpus = `${p.title} ${p.content} ${p.author.name} ${p.subject}`.toLowerCase();
        if (!corpus.includes(q)) return false;
      }
      return true;
    });
  }, [posts, contentSearch, contentSubjectFilter, contentFeaturedFilter]);

  // Filtered Reports List
  const filteredReports = useMemo(() => {
    return reports.filter((r) => {
      if (reportStatusFilter === 'all') return true;
      return r.status === reportStatusFilter;
    });
  }, [reports, reportStatusFilter]);

  return (
    <div className="space-y-6">
      
      {/* Admin Header & Security Badge */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              IT LABS Security & Moderation Console
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Platform Governance & Quality Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Supervise educational resources, audit community reports, and manage verified educator credentials.
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
              Database: it-labs-47fb8
            </span>
            <span className="inline-flex items-center gap-1 px-3 py-1.5 rounded-xl bg-blue-50 text-blue-700 text-xs font-semibold border border-blue-200">
              <ShieldCheck className="w-3.5 h-3.5 text-blue-600" />
              Admin: {currentAdmin.email || currentAdmin.name}
            </span>
          </div>
        </div>

        {/* Live Platform Metric Cards (Module A) */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Registered Users</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {metrics.totalUsers}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Students & Teachers</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Verified Educators</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {metrics.verifiedEducators}
            </div>
            <div className="text-[11px] text-indigo-600 font-medium mt-0.5">Badge Active</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Published Posts</span>
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {metrics.totalPosts}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">{metrics.featuredPosts} Featured</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Review Queue</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {metrics.pendingReports}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Community Flags</div>
          </div>
        </div>

        {/* Media Storage Breakdown Strip */}
        <div className="mt-4 pt-4 border-t border-slate-100 flex flex-wrap items-center justify-between gap-3 text-xs text-slate-600">
          <span className="font-semibold text-slate-700">Media Attachments Hosted:</span>
          <div className="flex items-center gap-4 text-[11px]">
            <span className="flex items-center gap-1">
              <Image className="w-3.5 h-3.5 text-blue-500" />
              <strong>{metrics.images}</strong> Images
            </span>
            <span className="flex items-center gap-1">
              <Film className="w-3.5 h-3.5 text-indigo-500" />
              <strong>{metrics.videos}</strong> Videos
            </span>
            <span className="flex items-center gap-1">
              <FileDown className="w-3.5 h-3.5 text-rose-500" />
              <strong>{metrics.pdfs}</strong> PDFs
            </span>
            <span className="flex items-center gap-1">
              <Code className="w-3.5 h-3.5 text-emerald-500" />
              <strong>{metrics.codeFiles}</strong> Code Files
            </span>
          </div>
        </div>
      </div>

      {/* Admin Tab Switcher */}
      <div className="bg-white rounded-2xl border border-slate-200/80 p-1.5 shadow-xs flex items-center gap-1">
        <button
          onClick={() => setActiveTab('users')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'users'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <Users className="w-4 h-4" />
          <span>User Management ({users.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('content')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 ${
            activeTab === 'content'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <FileText className="w-4 h-4" />
          <span>Post Management ({posts.length})</span>
        </button>

        <button
          onClick={() => setActiveTab('reports')}
          className={`flex-1 py-2.5 text-xs font-semibold rounded-xl transition-all flex items-center justify-center gap-2 relative ${
            activeTab === 'reports'
              ? 'bg-blue-600 text-white shadow-xs'
              : 'text-slate-600 hover:text-slate-900 hover:bg-slate-50'
          }`}
        >
          <AlertTriangle className="w-4 h-4" />
          <span>Reported Queue</span>
          {metrics.pendingReports > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'reports' ? 'bg-white text-blue-600' : 'bg-amber-500 text-white'
              }`}
            >
              {metrics.pendingReports}
            </span>
          )}
        </button>
      </div>

      {/* TAB 1: User Management (Module B) */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">User & Educator Governance</h2>
              <p className="text-xs text-slate-500">Toggle educator verification badges, manage academic roles, and maintain integrity.</p>
            </div>
            
            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={userSearch}
                  onChange={(e) => setUserSearch(e.target.value)}
                  placeholder="Filter by name, handle, institute..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-60 focus:outline-hidden focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Role filter */}
              <select
                value={userRoleFilter}
                onChange={(e) => setUserRoleFilter(e.target.value as any)}
                aria-label="Filter users by academic role"
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Roles</option>
                <option value="teacher_expert">Teacher / Expert</option>
                <option value="student">Student</option>
              </select>

              {/* Verification filter */}
              <select
                value={userVerifiedFilter}
                onChange={(e) => setUserVerifiedFilter(e.target.value as any)}
                aria-label="Filter users by verification status"
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Badges</option>
                <option value="verified">Verified Only</option>
                <option value="unverified">Unverified Only</option>
              </select>
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Educator / Scholar</th>
                  <th className="py-3 px-3">Academic Role</th>
                  <th className="py-3 px-3">Institution</th>
                  <th className="py-3 px-3">Followers</th>
                  <th className="py-3 px-3">Badge Status</th>
                  <th className="py-3 px-3 text-right">Moderator Controls</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-xs text-slate-500">
                      No users match the selected filters.
                    </td>
                  </tr>
                ) : (
                  filteredUsers.map((u) => (
                    <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                      <td className="py-3 px-3">
                        <div className="flex items-center gap-3">
                          <img
                            src={u.avatar}
                            alt={u.name}
                            referrerPolicy="no-referrer"
                            className="w-8 h-8 rounded-full object-cover shrink-0 ring-1 ring-slate-200"
                            onError={(e) => {
                              (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name)}&background=2563eb&color=fff`;
                            }}
                          />
                          <div className="min-w-0">
                            <button
                              onClick={() => onSelectUser(u)}
                              className="font-bold text-slate-900 hover:text-blue-600 transition-colors truncate block text-left"
                            >
                              {u.name}
                            </button>
                            <div className="text-[11px] text-slate-400 truncate">@{u.username}</div>
                          </div>
                        </div>
                      </td>

                      <td className="py-3 px-3">
                        {u.role === 'teacher_expert' ? (
                          <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                            <Sparkles className="w-3 h-3 text-blue-600" />
                            Teacher / Expert
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 text-[11px] font-medium text-slate-700 bg-slate-100 px-2 py-0.5 rounded-md">
                            <GraduationCap className="w-3 h-3" />
                            Student
                          </span>
                        )}
                        {u.title && <div className="text-[10px] text-slate-500 truncate mt-0.5">{u.title}</div>}
                      </td>

                      <td className="py-3 px-3 text-slate-700 max-w-[180px] truncate">
                        {u.institution || '—'}
                      </td>

                      <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                        {u.followersCount.toLocaleString()}
                      </td>

                      <td className="py-3 px-3">
                        {u.isVerified ? (
                          <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-semibold border border-emerald-200">
                            <CheckCircle className="w-3 h-3" />
                            Verified Educator
                          </span>
                        ) : (
                          <span className="text-slate-400 text-[11px]">Unverified</span>
                        )}
                      </td>

                      <td className="py-3 px-3 text-right">
                        <div className="inline-flex items-center gap-1.5 justify-end">
                          <button
                            onClick={() => onToggleUserVerification(u.id)}
                            className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors ${
                              u.isVerified
                                ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                                : 'bg-blue-600 hover:bg-blue-700 text-white shadow-xs'
                            }`}
                          >
                            {u.isVerified ? 'Revoke Badge' : 'Grant Badge'}
                          </button>

                          {onDeleteUser && (
                            <button
                              onClick={() => setConfirmDeleteUser(u)}
                              className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                              title="Delete User Profile"
                            >
                              <UserX className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* TAB 2: Content Management (Module C) */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Educational Resources & Notes</h2>
              <p className="text-xs text-slate-500">Feature exemplary explanations, purge low-quality submissions, or audit media files.</p>
            </div>

            <div className="flex flex-wrap items-center gap-2">
              <div className="relative">
                <input
                  type="text"
                  value={contentSearch}
                  onChange={(e) => setContentSearch(e.target.value)}
                  placeholder="Search post titles or creators..."
                  className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-56 focus:outline-hidden focus:bg-white"
                />
                <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
              </div>

              {/* Featured filter */}
              <select
                value={contentFeaturedFilter}
                onChange={(e) => setContentFeaturedFilter(e.target.value as any)}
                aria-label="Filter posts by featured status"
                className="px-2.5 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl text-slate-700 focus:outline-hidden"
              >
                <option value="all">All Posts</option>
                <option value="featured">Featured Only</option>
                <option value="regular">Standard Only</option>
              </select>
            </div>
          </div>

          <div className="space-y-3">
            {filteredPosts.length === 0 ? (
              <div className="py-8 text-center text-xs text-slate-500">
                No educational posts found matching the filter criteria.
              </div>
            ) : (
              filteredPosts.map((post) => {
                const attachmentsCount = post.attachments?.length || (post.media ? 1 : 0);

                return (
                  <div
                    key={post.id}
                    className="p-4 rounded-2xl border border-slate-200/80 hover:border-blue-200 hover:bg-blue-50/10 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex flex-wrap items-center gap-2 text-xs text-slate-500">
                        <span className="font-semibold text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">
                          {post.subject}
                        </span>
                        <span>·</span>
                        <span className="font-medium text-slate-700">by {post.author.name}</span>
                        <span>·</span>
                        <span>{post.createdAt}</span>
                        {attachmentsCount > 0 && (
                          <span className="inline-flex items-center gap-1 text-[11px] text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                            <FileText className="w-3 h-3 text-slate-500" />
                            {attachmentsCount} file{attachmentsCount > 1 ? 's' : ''}
                          </span>
                        )}
                        {post.isFeatured && (
                          <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.5 rounded-md border border-amber-200">
                            <Star className="w-3 h-3 fill-amber-500 text-amber-500" />
                            Featured
                          </span>
                        )}
                      </div>

                      <h3 className="text-sm font-bold text-slate-900 mt-1 truncate">
                        {post.title}
                      </h3>
                      <p className="text-xs text-slate-600 line-clamp-1 mt-0.5">
                        {post.content}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onToggleFeaturedPost(post.id)}
                        className={`px-3 py-1.5 rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 ${
                          post.isFeatured
                            ? 'bg-amber-100 text-amber-800 hover:bg-amber-200'
                            : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                        }`}
                      >
                        <Star className={`w-3.5 h-3.5 ${post.isFeatured ? 'fill-amber-600 text-amber-600' : ''}`} />
                        <span>{post.isFeatured ? 'Featured' : 'Make Featured'}</span>
                      </button>

                      <button
                        onClick={() => setConfirmDeletePost(post)}
                        className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                        title="Delete Post and Purge Stored Files"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </div>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* TAB 3: Reported Content Moderation Queue (Module D) */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 pb-3 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Community Moderation Queue</h2>
              <p className="text-xs text-slate-500">Audit user-flagged code snippets, inaccurate explanations, or policy violations.</p>
            </div>

            {/* Filter pills */}
            <div className="flex items-center gap-1.5">
              {(['pending', 'reviewed', 'dismissed', 'all'] as const).map((status) => (
                <button
                  key={status}
                  onClick={() => setReportStatusFilter(status)}
                  className={`px-3 py-1 rounded-xl text-xs font-semibold capitalize transition-colors ${
                    reportStatusFilter === status
                      ? 'bg-blue-600 text-white shadow-xs'
                      : 'bg-slate-100 text-slate-600 hover:bg-slate-200'
                  }`}
                >
                  {status === 'pending' ? `Pending (${metrics.pendingReports})` : status}
                </button>
              ))}
            </div>
          </div>

          {filteredReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All reports resolved! No {reportStatusFilter !== 'all' ? reportStatusFilter : ''} flags in queue.
            </div>
          ) : (
            <div className="space-y-3">
              {filteredReports.map((report) => {
                const targetPost = posts.find((p) => p.id === report.postId);

                return (
                  <div
                    key={report.id}
                    className={`p-4 rounded-2xl border transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4 ${
                      report.status === 'pending'
                        ? 'border-rose-200 bg-rose-50/20'
                        : report.status === 'dismissed'
                        ? 'border-slate-200 bg-slate-50/40 opacity-70'
                        : 'border-emerald-200 bg-emerald-50/20'
                    }`}
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-rose-700">Flagged by @{report.reportedBy}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{report.timestamp}</span>
                        <span
                          className={`text-[10px] font-bold px-2 py-0.5 rounded-full uppercase tracking-wider ${
                            report.status === 'pending'
                              ? 'bg-rose-100 text-rose-800'
                              : report.status === 'dismissed'
                              ? 'bg-slate-200 text-slate-700'
                              : 'bg-emerald-100 text-emerald-800'
                          }`}
                        >
                          {report.status}
                        </span>
                      </div>

                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        Report Reason: <span className="font-normal text-rose-900">"{report.reason}"</span>
                      </p>

                      {targetPost ? (
                        <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                          <span className="font-bold text-slate-900 block truncate">{targetPost.title}</span>
                          <span className="text-slate-500 text-[11px] block truncate mt-0.5">
                            {targetPost.content}
                          </span>
                        </div>
                      ) : (
                        <div className="mt-2 text-[11px] text-slate-400 italic">
                          (Associated post ID {report.postId} has been removed from feed)
                        </div>
                      )}
                    </div>

                    {report.status === 'pending' && (
                      <div className="flex items-center gap-2 shrink-0">
                        <button
                          onClick={() => onResolveReport(report.id, 'dismiss')}
                          className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                        >
                          Dismiss Flag
                        </button>
                        <button
                          onClick={() => onResolveReport(report.id, 'delete')}
                          className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1.5 shadow-xs"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                          <span>Remove Post</span>
                        </button>
                      </div>
                    )}
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {/* Confirmation Modal: Delete User */}
      {confirmDeleteUser && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Delete User Account?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to delete <span className="font-semibold text-slate-900">{confirmDeleteUser.name}</span> (@{confirmDeleteUser.username})? This action removes their profile from Firestore.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeleteUser(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (onDeleteUser && confirmDeleteUser) {
                    setIsProcessing(true);
                    await onDeleteUser(confirmDeleteUser.id);
                    setIsProcessing(false);
                    setConfirmDeleteUser(null);
                  }
                }}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-xs"
              >
                {isProcessing ? 'Deleting...' : 'Confirm Delete'}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Confirmation Modal: Delete Post */}
      {confirmDeletePost && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
          <div className="bg-white rounded-3xl max-w-md w-full p-6 shadow-2xl border border-slate-200 space-y-4">
            <div className="w-12 h-12 rounded-2xl bg-rose-100 text-rose-600 flex items-center justify-center">
              <AlertCircle className="w-6 h-6" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">Remove Educational Post?</h3>
              <p className="text-xs text-slate-600 mt-1">
                Are you sure you want to purge <span className="font-semibold text-slate-900">"{confirmDeletePost.title}"</span>? This will permanently delete the post document and all attached storage media files.
              </p>
            </div>
            <div className="flex items-center justify-end gap-2 pt-2">
              <button
                onClick={() => setConfirmDeletePost(null)}
                className="px-4 py-2 text-xs font-semibold text-slate-600 hover:bg-slate-100 rounded-xl transition-colors"
              >
                Cancel
              </button>
              <button
                onClick={async () => {
                  if (confirmDeletePost) {
                    setIsProcessing(true);
                    await onDeletePost(confirmDeletePost.id);
                    setIsProcessing(false);
                    setConfirmDeletePost(null);
                  }
                }}
                disabled={isProcessing}
                className="px-4 py-2 text-xs font-semibold bg-rose-600 hover:bg-rose-700 text-white rounded-xl transition-colors shadow-xs"
              >
                {isProcessing ? 'Removing...' : 'Confirm Purge'}
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
};
