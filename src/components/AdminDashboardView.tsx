import React, { useState } from 'react';
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
  GraduationCap
} from 'lucide-react';
import { User, Post, PostReport } from '../types';

interface AdminDashboardViewProps {
  users: User[];
  posts: Post[];
  reports: PostReport[];
  onToggleUserVerification: (userId: string) => void;
  onToggleFeaturedPost: (postId: string) => void;
  onDeletePost: (postId: string) => void;
  onResolveReport: (reportId: string, action: 'dismiss' | 'delete') => void;
  onSelectUser: (user: User) => void;
}

export const AdminDashboardView: React.FC<AdminDashboardViewProps> = ({
  users,
  posts,
  reports,
  onToggleUserVerification,
  onToggleFeaturedPost,
  onDeletePost,
  onResolveReport,
  onSelectUser,
}) => {
  const [activeTab, setActiveTab] = useState<'users' | 'content' | 'reports'>('users');
  const [userSearch, setUserSearch] = useState('');
  const [contentSearch, setContentSearch] = useState('');

  const filteredUsers = users.filter(
    (u) =>
      u.name.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.username.toLowerCase().includes(userSearch.toLowerCase()) ||
      u.institution.toLowerCase().includes(userSearch.toLowerCase())
  );

  const filteredPosts = posts.filter(
    (p) =>
      p.title.toLowerCase().includes(contentSearch.toLowerCase()) ||
      p.author.name.toLowerCase().includes(contentSearch.toLowerCase()) ||
      p.subject.toLowerCase().includes(contentSearch.toLowerCase())
  );

  const pendingReports = reports.filter((r) => r.status === 'pending');

  return (
    <div className="space-y-6">
      
      {/* Admin Header */}
      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
          <div>
            <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
              <ShieldCheck className="w-4 h-4 text-blue-600" />
              IT LABS System Administration
            </div>
            <h1 className="text-2xl sm:text-3xl font-extrabold text-slate-900 tracking-tight">
              Platform Moderation & Quality Control
            </h1>
            <p className="text-xs sm:text-sm text-slate-600 mt-1">
              Maintain academic rigor, manage verified educator credentials, and audit community-reported resources.
            </p>
          </div>

          <div className="flex items-center gap-2">
            <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl bg-emerald-50 text-emerald-700 text-xs font-bold border border-emerald-200">
              <span className="w-2 h-2 rounded-full bg-emerald-500" />
              Platform Status: Healthy
            </span>
          </div>
        </div>

        {/* Admin KPI Metric Cards */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mt-6 pt-6 border-t border-slate-100">
          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Total Registered Users</span>
              <Users className="w-4 h-4 text-blue-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {users.length + 14200}
            </div>
            <div className="text-[11px] text-emerald-600 font-medium mt-0.5">+14% this month</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Verified Educators</span>
              <Sparkles className="w-4 h-4 text-indigo-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {users.filter((u) => u.isVerified).length + 380}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Faculty & Staff</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Published Resources</span>
              <FileText className="w-4 h-4 text-teal-600" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {posts.length + 4890}
            </div>
            <div className="text-[11px] text-slate-500 mt-0.5">Notes, Code & Guides</div>
          </div>

          <div className="p-4 bg-slate-50 rounded-2xl border border-slate-100">
            <div className="flex items-center justify-between">
              <span className="text-xs font-medium text-slate-500">Pending Review Reports</span>
              <AlertTriangle className="w-4 h-4 text-amber-500" />
            </div>
            <div className="text-2xl font-extrabold text-slate-900 mt-1 tabular-nums">
              {pendingReports.length}
            </div>
            <div className="text-[11px] text-amber-600 font-medium mt-0.5">Action required</div>
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
          <span>User Management</span>
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
          <span>Content Management</span>
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
          {pendingReports.length > 0 && (
            <span
              className={`text-[10px] font-bold px-1.5 py-0.2 rounded-full ${
                activeTab === 'reports' ? 'bg-white text-blue-600' : 'bg-amber-500 text-white'
              }`}
            >
              {pendingReports.length}
            </span>
          )}
        </button>
      </div>

      {/* Tab 1: User Management */}
      {activeTab === 'users' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">User & Educator Roster</h2>
              <p className="text-xs text-slate-500">Toggle verified credentials or moderate role privileges</p>
            </div>
            <div className="relative">
              <input
                type="text"
                value={userSearch}
                onChange={(e) => setUserSearch(e.target.value)}
                placeholder="Filter users..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-60 focus:outline-hidden focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="border-b border-slate-200 text-slate-400 font-semibold uppercase tracking-wider text-[11px]">
                  <th className="py-3 px-3">Educator / Student</th>
                  <th className="py-3 px-3">Role</th>
                  <th className="py-3 px-3">Institution / Affiliation</th>
                  <th className="py-3 px-3">Followers</th>
                  <th className="py-3 px-3">Verified Status</th>
                  <th className="py-3 px-3 text-right">Moderation Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {filteredUsers.map((u) => (
                  <tr key={u.id} className="hover:bg-slate-50/70 transition-colors">
                    <td className="py-3 px-3">
                      <div className="flex items-center gap-3">
                        <img
                          src={u.avatar}
                          alt={u.name}
                          referrerPolicy="no-referrer"
                          className="w-8 h-8 rounded-full object-cover shrink-0"
                        />
                        <div>
                          <button
                            onClick={() => onSelectUser(u)}
                            className="font-bold text-slate-900 hover:text-blue-600 transition-colors"
                          >
                            {u.name}
                          </button>
                          <div className="text-[11px] text-slate-400">@{u.username}</div>
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
                    </td>

                    <td className="py-3 px-3 text-slate-700 max-w-[200px] truncate">
                      {u.institution}
                    </td>

                    <td className="py-3 px-3 font-mono tabular-nums text-slate-700">
                      {u.followersCount.toLocaleString()}
                    </td>

                    <td className="py-3 px-3">
                      {u.isVerified ? (
                        <span className="inline-flex items-center gap-1 text-emerald-700 bg-emerald-50 px-2 py-0.5 rounded-md text-[11px] font-semibold">
                          <CheckCircle className="w-3 h-3" />
                          Verified
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[11px]">Unverified</span>
                      )}
                    </td>

                    <td className="py-3 px-3 text-right">
                      <button
                        onClick={() => onToggleUserVerification(u.id)}
                        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                          u.isVerified
                            ? 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                            : 'bg-blue-600 hover:bg-blue-700 text-white'
                        }`}
                      >
                        {u.isVerified ? 'Revoke Badge' : 'Grant Verified'}
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {/* Tab 2: Content Management */}
      {activeTab === 'content' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3">
            <div>
              <h2 className="text-base font-bold text-slate-900">Platform Educational Content</h2>
              <p className="text-xs text-slate-500">Feature stellar explanations or purge low-quality entries</p>
            </div>
            <div className="relative">
              <input
                type="text"
                value={contentSearch}
                onChange={(e) => setContentSearch(e.target.value)}
                placeholder="Search posts..."
                className="pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-xl w-60 focus:outline-hidden focus:bg-white"
              />
              <Search className="w-3.5 h-3.5 text-slate-400 absolute left-2.5 top-2.5" />
            </div>
          </div>

          <div className="space-y-3">
            {filteredPosts.map((post) => (
              <div
                key={post.id}
                className="p-4 rounded-2xl border border-slate-200 hover:border-slate-300 transition-all flex flex-col sm:flex-row sm:items-center justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    <span className="font-semibold text-blue-600">{post.subject}</span>
                    <span>·</span>
                    <span>by {post.author.name}</span>
                    <span>·</span>
                    <span>{post.createdAt}</span>
                    {post.isFeatured && (
                      <span className="inline-flex items-center gap-1 text-[10px] font-bold text-amber-700 bg-amber-50 px-2 py-0.2 rounded-md">
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
                    className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-colors flex items-center gap-1 ${
                      post.isFeatured
                        ? 'bg-amber-100 text-amber-800'
                        : 'bg-slate-100 hover:bg-slate-200 text-slate-700'
                    }`}
                  >
                    <Star className="w-3.5 h-3.5" />
                    <span>{post.isFeatured ? 'Featured' : 'Make Featured'}</span>
                  </button>

                  <button
                    onClick={() => onDeletePost(post.id)}
                    className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors"
                    title="Delete Post"
                  >
                    <Trash2 className="w-4 h-4" />
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Tab 3: Reported Content Moderation Queue */}
      {activeTab === 'reports' && (
        <div className="bg-white rounded-3xl border border-slate-200/80 p-6 shadow-xs space-y-4">
          <div>
            <h2 className="text-base font-bold text-slate-900">Reported Content Moderation Queue</h2>
            <p className="text-xs text-slate-500">Review student flags on outdated code, inaccuracies, or spam</p>
          </div>

          {pendingReports.length === 0 ? (
            <div className="p-8 text-center text-xs text-slate-500 border border-dashed border-slate-200 rounded-2xl">
              <CheckCircle className="w-8 h-8 text-emerald-500 mx-auto mb-2" />
              All reports resolved! No pending community flags.
            </div>
          ) : (
            <div className="space-y-3">
              {pendingReports.map((report) => {
                const targetPost = posts.find((p) => p.id === report.postId);
                return (
                  <div
                    key={report.id}
                    className="p-4 rounded-2xl border border-rose-200 bg-rose-50/30 flex flex-col sm:flex-row sm:items-center justify-between gap-4"
                  >
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center gap-2 text-xs">
                        <span className="font-bold text-rose-700">Flagged by @{report.reportedBy}</span>
                        <span className="text-slate-400">·</span>
                        <span className="text-slate-500">{report.timestamp}</span>
                      </div>
                      <p className="text-xs font-semibold text-slate-800 mt-1">
                        Report Reason: <span className="font-normal text-rose-900">"{report.reason}"</span>
                      </p>
                      {targetPost && (
                        <div className="mt-2 p-2.5 bg-white rounded-xl border border-slate-200 text-xs">
                          <span className="font-bold text-slate-900">{targetPost.title}</span>
                          <span className="text-slate-500 text-[11px] block truncate">
                            {targetPost.content}
                          </span>
                        </div>
                      )}
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      <button
                        onClick={() => onResolveReport(report.id, 'dismiss')}
                        className="px-3 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
                      >
                        Dismiss Report
                      </button>
                      <button
                        onClick={() => onResolveReport(report.id, 'delete')}
                        className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold transition-colors flex items-center gap-1"
                      >
                        <Trash2 className="w-3.5 h-3.5" />
                        <span>Remove Post</span>
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

    </div>
  );
};
