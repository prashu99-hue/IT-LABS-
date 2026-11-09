import React, { useState } from 'react';
import {
  Heart,
  MessageSquare,
  Bookmark,
  Share2,
  ExternalLink,
  Copy,
  Check,
  CheckCircle,
  MoreHorizontal,
  Flag,
  Sparkles,
  Send,
  UserCheck,
  UserPlus,
  BookOpen,
  Code2,
  Download,
  Eye,
  FileText,
  FileCode,
  Video,
  Image as ImageIcon,
  Tag,
  Trash2,
  AlertTriangle,
  Clock,
  RotateCcw,
  Maximize2,
  Paperclip,
  Loader2
} from 'lucide-react';
import { Post, User, SubjectCategory, MediaAttachment } from '../types';
import { downloadMediaResource } from '../utils/downloadHelper';
import { deleteSingleAttachmentFromPost } from '../services/postService';
import { auth } from '../firebase/config';

interface PostCardProps {
  post: Post;
  currentUser: User;
  isAdminVerified?: boolean;
  onLikeToggle: (postId: string) => void;
  onSaveToggle: (postId: string) => void;
  onFollowToggle: (userId: string) => void;
  onShare: (post: Post) => void;
  onAddComment: (postId: string, text: string) => void;
  onDeleteComment?: (postId: string, commentId: string) => Promise<void> | void;
  onReportPost: (postId: string, reason: string) => void;
  onDeletePost?: (postId: string) => Promise<void> | void;
  onDeleteAttachment?: (postId: string, attachmentId: string) => Promise<void> | void;
  onSelectUser: (user: User) => void;
  onSelectCategory?: (category: SubjectCategory) => void;
  onPreviewMedia?: (media: MediaAttachment) => void;
  onToast?: (message: string, type?: 'success' | 'info' | 'error') => void;
}

export const PostCard: React.FC<PostCardProps> = ({
  post,
  currentUser,
  isAdminVerified = false,
  onLikeToggle,
  onSaveToggle,
  onFollowToggle,
  onShare,
  onAddComment,
  onDeleteComment,
  onReportPost,
  onDeletePost,
  onDeleteAttachment,
  onSelectUser,
  onSelectCategory,
  onPreviewMedia,
  onToast,
}) => {
  const [copiedCode, setCopiedCode] = useState(false);
  const [showComments, setShowComments] = useState(false);
  const [commentText, setCommentText] = useState('');
  const [showMenu, setShowMenu] = useState(false);
  const [isReporting, setIsReporting] = useState(false);
  const [reportReason, setReportReason] = useState('');
  const [isExpanded, setIsExpanded] = useState(false);
  const [downloadingMediaId, setDownloadingMediaId] = useState<string | null>(null);
  const [showDeleteModal, setShowDeleteModal] = useState(false);
  const [isDeleting, setIsDeleting] = useState(false);
  const [deletingCommentId, setDeletingCommentId] = useState<string | null>(null);
  const [failedMediaMap, setFailedMediaMap] = useState<Record<string, boolean>>({});

  const handleDeleteComment = async (commentId: string) => {
    if (!onDeleteComment) return;
    setDeletingCommentId(commentId);
    try {
      await onDeleteComment(post.id, commentId);
    } finally {
      setDeletingCommentId(null);
    }
  };

  // Individual Attachment Deletion state (Requirement 1, 3, 7)
  const [attachmentToDelete, setAttachmentToDelete] = useState<MediaAttachment | null>(null);
  const [isDeletingAttachment, setIsDeletingAttachment] = useState(false);
  const [localAttachments, setLocalAttachments] = useState<MediaAttachment[] | null>(null);

  const markMediaFailed = (key: string) => {
    setFailedMediaMap((prev) => ({ ...prev, [key]: true }));
  };

  const clearMediaFailed = (key: string) => {
    setFailedMediaMap((prev) => {
      const next = { ...prev };
      delete next[key];
      return next;
    });
  };

  const handleConfirmDeleteAttachment = async () => {
    if (!attachmentToDelete) return;
    const attId = attachmentToDelete.attachmentId || attachmentToDelete.id;
    setIsDeletingAttachment(true);
    try {
      if (onDeleteAttachment) {
        await onDeleteAttachment(post.id, attId);
      } else {
        // Fallback direct service invocation
        await deleteSingleAttachmentFromPost(
          post.id,
          attId,
          currentUser.id,
          currentUser.email,
          isAdmin
        );
      }

      // Requirement 7: Update local state immediately so UI updates in real-time
      setLocalAttachments((prev) => {
        const base = prev ?? (post.attachments && post.attachments.length > 0 ? post.attachments : (post.media ? [post.media] : []));
        return base.filter((a) => (a.attachmentId || a.id) !== attId);
      });

      if (onToast) {
        onToast(`Attachment "${attachmentToDelete.originalName}" removed successfully`, 'success');
      }
      setAttachmentToDelete(null);
    } catch (err: any) {
      console.error('Error deleting attachment:', err);
      if (onToast) {
        onToast(`Could not delete attachment: ${err.message || 'Error'}`, 'error');
      }
    } finally {
      setIsDeletingAttachment(false);
    }
  };

  const handleDownloadAttachment = async (media: MediaAttachment) => {
    const mediaKey = media.id || media.url;
    setDownloadingMediaId(mediaKey);
    try {
      await downloadMediaResource(media);
      if (onToast) {
        onToast(`Downloaded ${media.originalName} (${media.sizeFormatted})`, 'success');
      }
    } catch (err: any) {
      if (onToast) {
        onToast(`Download error: ${err.message || 'Failed to download'}`, 'error');
      }
    } finally {
      setDownloadingMediaId(null);
    }
  };

  const handleCopyCode = () => {
    if (!post.codeSnippet) return;
    navigator.clipboard.writeText(post.codeSnippet.code);
    setCopiedCode(true);
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleCommentSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!commentText.trim()) return;
    onAddComment(post.id, commentText.trim());
    setCommentText('');
  };

  const submitReport = () => {
    if (!reportReason.trim()) return;
    onReportPost(post.id, reportReason.trim());
    setIsReporting(false);
    setShowMenu(false);
    setReportReason('');
  };

  const currentAuthUid = auth.currentUser?.uid;
  const isSelf = Boolean(
    (currentAuthUid && (post.author.id === currentAuthUid || post.authorId === currentAuthUid)) ||
    (currentUser?.id && (post.author.id === currentUser.id || post.authorId === currentUser.id))
  );
  const isAdmin = Boolean(
    isAdminVerified ||
    (currentAuthUid && auth.currentUser?.email === 'ecode2544@gmail.com')
  );
  const canDelete = isSelf || isAdmin;

  return (
    <article className="bg-white rounded-2xl border border-slate-200/80 shadow-xs hover:border-slate-300 transition-all duration-200 overflow-hidden">
      {/* Header */}
      <div className="p-4 sm:p-5 pb-3">
        <div className="flex items-start justify-between gap-3">
          <div className="flex items-center gap-3 min-w-0">
            <button
              onClick={() => onSelectUser(post.author)}
              className="relative shrink-0 group focus:outline-hidden"
              title={`View ${post.author.name}'s profile`}
            >
              <img
                src={post.author.avatar}
                alt={post.author.name}
                referrerPolicy="no-referrer"
                className="w-11 h-11 rounded-full object-cover ring-2 ring-transparent group-hover:ring-blue-500 transition-all"
                onError={(e) => {
                  (e.target as HTMLImageElement).src = `https://ui-avatars.com/api/?name=${encodeURIComponent(post.author.name)}&background=2563eb&color=fff`;
                }}
              />
              {post.author.isVerified && (
                <span className="absolute -bottom-0.5 -right-0.5 bg-blue-600 text-white rounded-full p-0.5 ring-2 ring-white" title="Verified Creator">
                  <CheckCircle className="w-3 h-3" />
                </span>
              )}
            </button>

            <div className="min-w-0">
              <div className="flex items-center gap-1.5 flex-wrap">
                <button
                  onClick={() => onSelectUser(post.author)}
                  className="font-semibold text-sm text-slate-900 hover:text-blue-600 transition-colors truncate text-left"
                >
                  {post.author.name}
                </button>
                <span className="text-xs text-slate-500">@{post.author.username}</span>

                {post.author.role === 'teacher_expert' ? (
                  <span className="inline-flex items-center gap-1 text-[11px] font-medium text-blue-700 bg-blue-50 px-2 py-0.5 rounded-md">
                    <Sparkles className="w-3 h-3 text-blue-600" />
                    Teacher / Expert
                  </span>
                ) : (
                  <span className="inline-flex items-center text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                    Student
                  </span>
                )}
              </div>

              <div className="flex items-center gap-2 text-xs text-slate-500 mt-0.5 truncate">
                <span className="truncate">{post.author.institution}</span>
                <span aria-hidden="true">·</span>
                <span className="shrink-0">{post.createdAt}</span>
              </div>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {!isSelf && (
              <button
                onClick={() => onFollowToggle(post.author.id)}
                className={`text-xs font-medium px-2.5 py-1.5 rounded-lg transition-colors flex items-center gap-1 ${
                  post.author.isFollowing
                    ? 'bg-slate-100 text-slate-700 hover:bg-slate-200'
                    : 'bg-blue-50 text-blue-700 hover:bg-blue-100'
                }`}
              >
                {post.author.isFollowing ? (
                  <>
                    <UserCheck className="w-3.5 h-3.5" />
                    <span className="hidden sm:inline">Following</span>
                  </>
                ) : (
                  <>
                    <UserPlus className="w-3.5 h-3.5" />
                    <span>Follow</span>
                  </>
                )}
              </button>
            )}

            <div className="relative">
              <button
                onClick={() => setShowMenu(!showMenu)}
                className="p-1.5 text-slate-400 hover:text-slate-600 hover:bg-slate-100 rounded-lg transition-colors"
                aria-label="More post options"
              >
                <MoreHorizontal className="w-4 h-4" />
              </button>

              {showMenu && (
                <div className="absolute right-0 top-8 z-20 w-48 bg-white rounded-xl shadow-lg border border-slate-200 py-1 text-xs">
                  <button
                    onClick={() => {
                      onShare(post);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-slate-700 hover:bg-slate-50 flex items-center gap-2"
                  >
                    <Share2 className="w-3.5 h-3.5 text-slate-500" />
                    <span>Share Direct Link</span>
                  </button>
                  <button
                    onClick={() => {
                      setIsReporting(true);
                      setShowMenu(false);
                    }}
                    className="w-full px-3 py-2 text-left text-amber-700 hover:bg-amber-50 flex items-center gap-2 font-medium"
                  >
                    <Flag className="w-3.5 h-3.5 text-amber-600" />
                    <span>Report Content</span>
                  </button>
                  {canDelete && (
                    <>
                      <div className="my-1 border-t border-slate-100" />
                      <button
                        onClick={() => {
                          setShowDeleteModal(true);
                          setShowMenu(false);
                        }}
                        className="w-full px-3 py-2 text-left text-rose-600 hover:bg-rose-50 flex items-center gap-2 font-medium transition-colors"
                      >
                        <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                        <span>Delete Post {isAdmin && !isSelf ? '(Admin)' : ''}</span>
                      </button>
                    </>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Category metadata kicker */}
        <div className="mt-3 flex items-center gap-2 text-xs text-slate-500">
          <button
            onClick={() => onSelectCategory && onSelectCategory(post.subject)}
            className="font-semibold text-blue-600 hover:underline cursor-pointer"
          >
            {post.subject}
          </button>
          <span aria-hidden="true">·</span>
          <span>{post.difficulty} Level</span>
          {post.resourceType && (
            <>
              <span aria-hidden="true">·</span>
              <span className="capitalize">{post.resourceType}</span>
            </>
          )}
        </div>

        {/* Post Title */}
        <h2 className="text-base sm:text-lg font-bold text-slate-900 mt-1 tracking-tight">
          {post.title}
        </h2>

        {/* Post Content */}
        <div className="mt-2 text-sm text-slate-700 leading-relaxed whitespace-pre-line">
          {post.content.length > 320 && !isExpanded ? (
            <>
              {post.content.slice(0, 320)}...
              <button
                onClick={() => setIsExpanded(true)}
                className="text-blue-600 font-medium ml-1.5 hover:underline"
              >
                Read more
              </button>
            </>
          ) : (
            post.content
          )}
        </div>

        {/* Tags */}
        {post.tags && post.tags.length > 0 && (
          <div className="mt-3 flex items-center gap-1.5 flex-wrap">
            {post.tags.map((tag) => (
              <span
                key={tag}
                className="text-[11px] font-medium text-slate-600 bg-slate-100 hover:bg-blue-50 hover:text-blue-700 px-2 py-0.5 rounded-md transition-colors"
              >
                #{tag}
              </span>
            ))}
          </div>
        )}
      </div>

      {/* Educational Media Attachments (Images, Videos, PDFs, Code Resources) */}
      {(() => {
        const baseAttachments: MediaAttachment[] =
          post.attachments && post.attachments.length > 0
            ? post.attachments
            : post.media
            ? [post.media]
            : [];

        const postAttachments: MediaAttachment[] = localAttachments ?? baseAttachments;

        if (postAttachments.length === 0) return null;

        return (
          <div className="mx-4 sm:mx-5 my-2.5 rounded-2xl border border-slate-200/90 bg-slate-50/70 overflow-hidden shadow-2xs">
            {/* Multi-Attachment Header if more than 1 file */}
            {postAttachments.length > 1 && (
              <div className="p-3 bg-blue-50/70 border-b border-blue-100 flex items-center justify-between">
                <div className="flex items-center gap-2 text-xs font-bold text-slate-900">
                  <Paperclip className="w-4 h-4 text-blue-600" />
                  <span>Attached Educational Resources ({postAttachments.length} files)</span>
                </div>
                <span className="text-[11px] text-blue-700 font-medium">All resources persistent</span>
              </div>
            )}

            <div className="divide-y divide-slate-200/70">
              {postAttachments.map((mediaItem, idx) => {
                const attKey = mediaItem.id || `${mediaItem.originalName}_${idx}`;
                const hasFailed = failedMediaMap[attKey];
                const isDownloadingThis = downloadingMediaId === (mediaItem.id || mediaItem.url);

                return (
                  <div key={attKey} className="overflow-hidden">
                    {/* Media File Header with Details & Download Button */}
                    <div className="p-3.5 sm:p-4 flex flex-col sm:flex-row sm:items-center justify-between gap-3 border-b border-slate-200/60 bg-white">
                      <div className="flex items-center gap-3 min-w-0">
                        <div
                          className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 border ${
                            mediaItem.category === 'pdf'
                              ? 'bg-rose-50 text-rose-600 border-rose-100'
                              : mediaItem.category === 'video'
                              ? 'bg-indigo-50 text-indigo-600 border-indigo-100'
                              : mediaItem.category === 'code'
                              ? 'bg-teal-50 text-teal-600 border-teal-100'
                              : 'bg-blue-50 text-blue-600 border-blue-100'
                          }`}
                        >
                          {mediaItem.category === 'image' && <ImageIcon className="w-5 h-5" />}
                          {mediaItem.category === 'video' && <Video className="w-5 h-5" />}
                          {mediaItem.category === 'pdf' && <FileText className="w-5 h-5" />}
                          {mediaItem.category === 'code' && <FileCode className="w-5 h-5" />}
                        </div>
                        <div className="min-w-0">
                          <div className="flex items-center gap-2 flex-wrap">
                            <span className="font-bold text-xs text-slate-900 truncate max-w-xs sm:max-w-md">
                              {mediaItem.originalName}
                            </span>
                            <span
                              className={`uppercase text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                mediaItem.category === 'pdf'
                                  ? 'bg-rose-100 text-rose-800'
                                  : mediaItem.category === 'video'
                                  ? 'bg-indigo-100 text-indigo-800'
                                  : mediaItem.category === 'code'
                                  ? 'bg-teal-100 text-teal-800'
                                  : 'bg-blue-100 text-blue-800'
                              }`}
                            >
                              {mediaItem.extension}
                            </span>
                            {mediaItem.durationFormatted && (
                              <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-md">
                                <Clock className="w-3 h-3" />
                                {mediaItem.durationFormatted}
                              </span>
                            )}
                            {mediaItem.resolution && (
                              <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                {mediaItem.resolution}
                              </span>
                            )}
                          </div>
                          <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                            <span className="capitalize">{mediaItem.category} Resource</span>
                            <span aria-hidden="true">·</span>
                            <span className="font-mono tabular-nums">{mediaItem.sizeFormatted}</span>
                            {mediaItem.storageProvider && (
                              <>
                                <span aria-hidden="true">·</span>
                                <span className="text-slate-400 text-[10px]">{mediaItem.storageProvider}</span>
                              </>
                            )}
                          </div>
                        </div>
                      </div>

                      {/* Quick Actions: Preview & Download */}
                      <div className="flex items-center gap-2 shrink-0">
                        {mediaItem.category === 'pdf' && (
                          <a
                            href={mediaItem.url}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors hidden sm:flex"
                            title="Open PDF in new browser tab"
                          >
                            <ExternalLink className="w-3.5 h-3.5" />
                            <span>New Tab</span>
                          </a>
                        )}

                        {onPreviewMedia && (
                          <button
                            type="button"
                            onClick={() => onPreviewMedia(mediaItem)}
                            className="px-3 py-1.5 bg-white hover:bg-slate-100 border border-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1.5 transition-colors"
                          >
                            {mediaItem.category === 'video' ? (
                              <>
                                <Maximize2 className="w-3.5 h-3.5 text-indigo-600" />
                                <span>Theater Mode</span>
                              </>
                            ) : mediaItem.category === 'pdf' ? (
                              <>
                                <Eye className="w-3.5 h-3.5 text-rose-600" />
                                <span>Preview PDF</span>
                              </>
                            ) : (
                              <>
                                <Eye className="w-3.5 h-3.5 text-blue-600" />
                                <span>Preview</span>
                              </>
                            )}
                          </button>
                        )}

                        <button
                          type="button"
                          onClick={() => handleDownloadAttachment(mediaItem)}
                          disabled={isDownloadingThis}
                          className={`px-3.5 py-1.5 text-white rounded-xl text-xs font-semibold shadow-xs flex items-center gap-1.5 transition-all disabled:bg-slate-300 ${
                            mediaItem.category === 'pdf'
                              ? 'bg-rose-600 hover:bg-rose-700'
                              : mediaItem.category === 'video'
                              ? 'bg-indigo-600 hover:bg-indigo-700'
                              : mediaItem.category === 'code'
                              ? 'bg-teal-600 hover:bg-teal-700'
                              : 'bg-blue-600 hover:bg-blue-700'
                          }`}
                          title={`Download ${mediaItem.originalName}`}
                        >
                          <Download className="w-3.5 h-3.5" />
                          <span>
                            {isDownloadingThis
                              ? 'Downloading...'
                              : mediaItem.category === 'pdf'
                              ? 'Download PDF'
                              : mediaItem.category === 'video'
                              ? 'Download Video'
                              : 'Download'}
                          </span>
                        </button>

                        {/* Individual Attachment Delete Option (Requirement 1 & 2) */}
                        {canDelete && (
                          <button
                            type="button"
                            onClick={() => setAttachmentToDelete(mediaItem)}
                            disabled={isDeletingAttachment}
                            className="px-2.5 py-1.5 bg-rose-50 hover:bg-rose-100 border border-rose-200 text-rose-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors disabled:opacity-50"
                            title={`Delete attachment "${mediaItem.originalName}"`}
                          >
                            <Trash2 className="w-3.5 h-3.5 text-rose-600" />
                            <span className="hidden sm:inline">Delete</span>
                          </button>
                        )}
                      </div>
                    </div>

                    {/* Inline Preview Stage */}
                    <div className="p-3 bg-slate-950/5">
                      {/* Image Preview */}
                      {mediaItem.category === 'image' && (
                        hasFailed || (mediaItem.url.startsWith('blob:') && !mediaItem.url.includes('/uploads/')) ? (
                          <div className="p-4 bg-slate-50 border border-slate-200 rounded-xl text-center space-y-1.5">
                            <div className="flex items-center justify-center gap-1.5 text-slate-700 text-xs font-bold">
                              <ImageIcon className="w-4 h-4 text-slate-500" />
                              <span>Legacy Attachment Unavailable</span>
                            </div>
                            <p className="text-[11px] text-slate-500 max-w-md mx-auto leading-relaxed">
                              File metadata is preserved ({mediaItem.originalName} · {mediaItem.sizeFormatted}). This file was stored before Cloudinary persistent cloud storage was enabled.
                            </p>
                          </div>
                        ) : (
                          <div
                            onClick={() => onPreviewMedia && onPreviewMedia(mediaItem)}
                            className="relative rounded-xl overflow-hidden cursor-pointer group max-h-80 bg-slate-100 flex items-center justify-center border border-slate-200"
                          >
                            <img
                              src={mediaItem.url}
                              alt={mediaItem.originalName}
                              onError={() => markMediaFailed(attKey)}
                              className="w-full max-h-80 object-cover group-hover:scale-102 transition-transform duration-200"
                            />
                            <div className="absolute inset-0 bg-slate-900/30 opacity-0 group-hover:opacity-100 transition-opacity flex items-center justify-center gap-2 text-white text-xs font-semibold backdrop-blur-2xs">
                              <Eye className="w-4 h-4" />
                              <span>Click to expand full size</span>
                            </div>
                          </div>
                        )
                      )}

                      {/* Video Player */}
                      {mediaItem.category === 'video' && (
                        <div className="rounded-xl overflow-hidden bg-black shadow-inner">
                          {hasFailed ? (
                            <div className="p-6 bg-slate-900 text-center space-y-3">
                              <div className="flex items-center justify-center gap-2 text-rose-400 text-xs font-bold">
                                <AlertTriangle className="w-4 h-4" />
                                <span>Video Playback Error</span>
                              </div>
                              <p className="text-xs text-slate-400 max-w-md mx-auto">
                                Could not play video stream directly. The browser codec may require downloading or opening externally.
                              </p>
                              <div className="flex items-center justify-center gap-2 pt-1">
                                <button
                                  type="button"
                                  onClick={() => clearMediaFailed(attKey)}
                                  className="px-3 py-1.5 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Retry</span>
                                </button>
                                <button
                                  type="button"
                                  onClick={() => handleDownloadAttachment(mediaItem)}
                                  className="px-3 py-1.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-lg text-xs font-semibold flex items-center gap-1.5 transition-colors"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download Video</span>
                                </button>
                              </div>
                            </div>
                          ) : (
                            <video
                              controls
                              playsInline
                              preload="metadata"
                              src={mediaItem.url}
                              onError={() => markMediaFailed(attKey)}
                              className="w-full max-h-96 rounded-xl bg-black"
                            >
                              Your browser does not support the video tag.
                            </video>
                          )}
                        </div>
                      )}

                      {/* PDF Document Reader Preview */}
                      {mediaItem.category === 'pdf' && (
                        <div className="space-y-2">
                          <div
                            onClick={() => onPreviewMedia && onPreviewMedia(mediaItem)}
                            className="p-4 bg-white rounded-xl border border-slate-200 hover:border-rose-300 transition-all cursor-pointer flex items-center justify-between shadow-2xs group"
                          >
                            <div className="flex items-center gap-3 min-w-0">
                              <div className="w-11 h-11 rounded-lg bg-rose-50 text-rose-600 flex items-center justify-center font-bold text-xs uppercase border border-rose-100 group-hover:scale-105 transition-transform shrink-0">
                                PDF
                              </div>
                              <div className="min-w-0">
                                <div className="text-xs font-bold text-slate-900 group-hover:text-rose-600 transition-colors truncate">
                                  {mediaItem.originalName}
                                </div>
                                <div className="text-[11px] text-slate-500 mt-0.5">
                                  Educational Document · {mediaItem.sizeFormatted} · Click to launch reader
                                </div>
                              </div>
                            </div>
                            <div className="flex items-center gap-1.5 text-xs text-rose-600 font-semibold shrink-0">
                              <span>Preview PDF</span>
                              <Eye className="w-4 h-4" />
                            </div>
                          </div>

                          {/* Embedded iframe preview */}
                          <div className="w-full h-72 rounded-xl border border-slate-300 bg-white overflow-hidden shadow-inner">
                            <iframe
                              src={`${mediaItem.url}#toolbar=0&navpanes=0`}
                              title={mediaItem.originalName}
                              className="w-full h-full border-0"
                            />
                          </div>
                        </div>
                      )}

                      {/* Code Snippet Attachment Preview */}
                      {mediaItem.category === 'code' && (
                        <div className="rounded-xl overflow-hidden bg-slate-900 border border-slate-800 text-slate-100 text-xs">
                          <div className="px-3 py-1.5 bg-slate-950 border-b border-slate-800 flex items-center justify-between text-[11px] font-mono text-slate-400">
                            <span>{mediaItem.originalName}</span>
                            <button
                              onClick={() => onPreviewMedia && onPreviewMedia(mediaItem)}
                              className="text-teal-400 hover:text-teal-300 flex items-center gap-1"
                            >
                              <Eye className="w-3 h-3" />
                              <span>Expand Code</span>
                            </button>
                          </div>
                          <div className="p-3 max-h-48 overflow-x-auto font-mono text-xs">
                            <pre>
                              <code>{mediaItem.codeContent || '// Code file ready for download'}</code>
                            </pre>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        );
      })()}

      {/* Code Snippet Box (if available) */}
      {post.codeSnippet && (
        <div className="mx-4 sm:mx-5 my-2 rounded-xl bg-slate-900 text-slate-100 overflow-hidden border border-slate-800 text-xs">
          <div className="flex items-center justify-between px-3.5 py-2 bg-slate-950/60 border-b border-slate-800">
            <div className="flex items-center gap-2">
              <Code2 className="w-3.5 h-3.5 text-blue-400" />
              <span className="font-mono text-[11px] text-slate-400 tracking-wide uppercase">
                {post.codeSnippet.language}
              </span>
            </div>
            <button
              onClick={handleCopyCode}
              className="flex items-center gap-1.5 px-2 py-1 rounded bg-slate-800 hover:bg-slate-700 text-slate-300 hover:text-white transition-colors text-[11px]"
            >
              {copiedCode ? (
                <>
                  <Check className="w-3 h-3 text-emerald-400" />
                  <span className="text-emerald-400">Copied</span>
                </>
              ) : (
                <>
                  <Copy className="w-3 h-3" />
                  <span>Copy Code</span>
                </>
              )}
            </button>
          </div>
          <div className="p-3.5 overflow-x-auto max-h-72 leading-relaxed font-mono">
            <pre className="text-slate-200">
              <code>{post.codeSnippet.code}</code>
            </pre>
          </div>
        </div>
      )}

      {/* Resource Attachment Card (if present) */}
      {post.resourceUrl && (
        <div className="mx-4 sm:mx-5 my-2">
          <a
            href={post.resourceUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="flex items-center justify-between p-3 bg-blue-50/70 hover:bg-blue-50 border border-blue-100 rounded-xl transition-all group"
          >
            <div className="flex items-center gap-3 min-w-0">
              <div className="w-9 h-9 rounded-lg bg-blue-600 text-white flex items-center justify-center shrink-0 shadow-xs">
                <BookOpen className="w-4 h-4" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-semibold text-slate-900 group-hover:text-blue-700 truncate">
                  {post.resourceTitle || 'External Educational Resource / Document'}
                </div>
                <div className="text-[11px] text-slate-500 truncate mt-0.5 font-mono">
                  {post.resourceUrl}
                </div>
              </div>
            </div>
            <ExternalLink className="w-4 h-4 text-blue-600 shrink-0 ml-2 group-hover:translate-x-0.5 group-hover:-translate-y-0.5 transition-transform" />
          </a>
        </div>
      )}

      {/* Action Footer */}
      <div className="px-4 sm:px-5 py-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-600 mt-2">
        <div className="flex items-center gap-4 sm:gap-6">
          {/* Like */}
          <button
            onClick={() => onLikeToggle(post.id)}
            className={`flex items-center gap-1.5 transition-colors group ${
              post.isLiked ? 'text-rose-600 font-semibold' : 'hover:text-rose-600'
            }`}
          >
            <Heart
              className={`w-4 h-4 transition-transform group-active:scale-125 ${
                post.isLiked ? 'fill-rose-600 text-rose-600' : 'text-slate-500 group-hover:text-rose-600'
              }`}
            />
            <span className="tabular-nums">{post.likesCount}</span>
          </button>

          {/* Comment */}
          <button
            onClick={() => setShowComments(!showComments)}
            className="flex items-center gap-1.5 hover:text-blue-600 transition-colors"
          >
            <MessageSquare className="w-4 h-4 text-slate-500 hover:text-blue-600" />
            <span className="tabular-nums">{post.commentsCount}</span>
          </button>

          {/* Save */}
          <button
            onClick={() => onSaveToggle(post.id)}
            className={`flex items-center gap-1.5 transition-colors ${
              post.isSaved ? 'text-blue-600 font-semibold' : 'hover:text-blue-600'
            }`}
          >
            <Bookmark
              className={`w-4 h-4 ${
                post.isSaved ? 'fill-blue-600 text-blue-600' : 'text-slate-500'
              }`}
            />
            <span className="hidden sm:inline">{post.isSaved ? 'Saved' : 'Save'}</span>
          </button>
        </div>

        {/* Share */}
        <button
          onClick={() => onShare(post)}
          className="flex items-center gap-1.5 text-slate-500 hover:text-slate-900 transition-colors"
          title="Share post"
        >
          <Share2 className="w-4 h-4" />
          <span className="hidden sm:inline">Share</span>
        </button>
      </div>

      {/* Inline Comments Section */}
      {showComments && (
        <div className="bg-slate-50/70 border-t border-slate-100 p-4 sm:p-5 space-y-4">
          <h4 className="text-xs font-semibold text-slate-700 tracking-wide uppercase">
            Discussion & Peer Insights ({post.comments.length})
          </h4>

          {/* Add comment input */}
          <form onSubmit={handleCommentSubmit} className="flex gap-2">
            <img
              src={currentUser.avatar}
              alt={currentUser.name}
              referrerPolicy="no-referrer"
              className="w-8 h-8 rounded-full object-cover shrink-0 mt-0.5"
            />
            <div className="flex-1 flex gap-2">
              <input
                type="text"
                value={commentText}
                onChange={(e) => setCommentText(e.target.value)}
                placeholder="Ask a clarifying question or add your insight..."
                className="w-full px-3.5 py-2 bg-white border border-slate-200 rounded-xl text-xs text-slate-900 focus:outline-hidden focus:border-blue-500 focus:ring-1 focus:ring-blue-500"
              />
              <button
                type="submit"
                disabled={!commentText.trim()}
                className="px-3.5 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-medium flex items-center gap-1 transition-colors shrink-0"
              >
                <Send className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">Post</span>
              </button>
            </div>
          </form>

          {/* Comments list */}
          <div className="space-y-3 pt-1">
            {post.comments.length === 0 ? (
              <p className="text-xs text-slate-400 text-center py-2">
                No comments yet. Be the first to spark the discussion!
              </p>
            ) : (
              post.comments.map((comment) => {
                const currentAuthUid = auth.currentUser?.uid;
                const commentAuthorUid = comment.author?.id || (comment as any).authorId;
                const isCommentAuthor = Boolean(currentAuthUid && commentAuthorUid && currentAuthUid === commentAuthorUid);
                const isVerifiedAdmin = Boolean(
                  isAdminVerified ||
                  (currentAuthUid && auth.currentUser?.email === 'ecode2544@gmail.com')
                );
                const canDeleteComment = isCommentAuthor || isVerifiedAdmin;
                const isDeletingThis = deletingCommentId === comment.id;

                return (
                  <div
                    key={comment.id}
                    className={`p-3 rounded-xl border ${
                      comment.isVerifiedEducatorAnswer
                        ? 'bg-blue-50/60 border-blue-200 ring-1 ring-blue-100'
                        : 'bg-white border-slate-200/80'
                    }`}
                  >
                    <div className="flex items-center justify-between gap-2 mb-1">
                      <div className="flex items-center gap-2">
                        <img
                          src={comment.author.avatar}
                          alt={comment.author.name}
                          referrerPolicy="no-referrer"
                          className="w-6 h-6 rounded-full object-cover"
                        />
                        <span className="text-xs font-semibold text-slate-900">
                          {comment.author.name}
                        </span>
                        {comment.isVerifiedEducatorAnswer && (
                          <span className="text-[10px] font-semibold text-blue-700 bg-blue-100 px-2 py-0.5 rounded-full flex items-center gap-1">
                            <Sparkles className="w-2.5 h-2.5 text-blue-600" />
                            Educator Answer
                          </span>
                        )}
                      </div>

                      <div className="flex items-center gap-2">
                        <span className="text-[11px] text-slate-400">{comment.createdAt}</span>

                        {canDeleteComment && onDeleteComment && (
                          <button
                            type="button"
                            onClick={() => handleDeleteComment(comment.id)}
                            disabled={isDeletingThis}
                            className="p-1 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-lg transition-colors cursor-pointer"
                            title={isCommentAuthor ? "Delete your comment" : "Delete comment (Admin Moderation)"}
                            aria-label="Delete comment"
                          >
                            {isDeletingThis ? (
                              <Loader2 className="w-3.5 h-3.5 animate-spin text-rose-500" />
                            ) : (
                              <Trash2 className="w-3.5 h-3.5" />
                            )}
                          </button>
                        )}
                      </div>
                    </div>
                    <p className="text-xs text-slate-700 ml-8 leading-relaxed">
                      {comment.content}
                    </p>
                  </div>
                );
              })
            )}
          </div>
        </div>
      )}

      {/* Report Modal */}
      {isReporting && (
        <div className="p-4 bg-rose-50 border-t border-rose-200">
          <div className="flex items-center justify-between mb-2">
            <span className="text-xs font-semibold text-rose-800">Report this educational content</span>
            <button
              onClick={() => setIsReporting(false)}
              className="text-xs text-slate-500 hover:text-slate-800"
            >
              Cancel
            </button>
          </div>
          <p className="text-xs text-slate-600 mb-2">
            Help maintain academic standards on LearnNova. What is the issue?
          </p>
          <div className="flex gap-2">
            <input
              type="text"
              value={reportReason}
              onChange={(e) => setReportReason(e.target.value)}
              placeholder="e.g. Misleading code syntax, broken link, plagiarism..."
              className="flex-1 px-3 py-1.5 bg-white border border-rose-300 rounded-lg text-xs"
            />
            <button
              onClick={submitReport}
              className="px-3 py-1.5 bg-rose-600 hover:bg-rose-700 text-white rounded-lg text-xs font-medium"
            >
              Submit Report
            </button>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {showDeleteModal && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-dialog-title" className="text-base font-bold text-slate-900">
                  Delete Educational Post?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Are you sure you want to delete this resource?
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4">
              <p className="font-bold text-slate-900 truncate">{post.title}</p>
              <p className="text-[11px] text-slate-500 mt-0.5 line-clamp-2">{post.content}</p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This action will permanently delete this educational post from Cloud Firestore, along with all attached peer comments and likes. This cannot be undone.
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeleting}
                onClick={() => setShowDeleteModal(false)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeleting}
                onClick={async () => {
                  if (!onDeletePost) return;
                  setIsDeleting(true);
                  try {
                    await onDeletePost(post.id);
                    setShowDeleteModal(false);
                  } catch {
                    // Toast error shown by caller
                  } finally {
                    setIsDeleting(false);
                  }
                }}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeleting ? (
                  <>
                    <div className="w-3.5 h-3.5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                    <span>Deleting...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Post</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Individual Attachment Confirmation Modal (Requirement 3 & 6) */}
      {attachmentToDelete && (
        <div
          role="dialog"
          aria-modal="true"
          aria-labelledby="delete-attachment-dialog-title"
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-150"
        >
          <div className="bg-white rounded-2xl max-w-md w-full p-6 shadow-2xl border border-slate-200">
            <div className="flex items-start gap-3.5 mb-4">
              <div className="w-10 h-10 rounded-xl bg-rose-50 border border-rose-100 flex items-center justify-center shrink-0">
                <Trash2 className="w-5 h-5 text-rose-600" />
              </div>
              <div className="min-w-0">
                <h3 id="delete-attachment-dialog-title" className="text-base font-bold text-slate-900">
                  Delete This Attachment?
                </h3>
                <p className="text-xs text-slate-500 mt-0.5">
                  Remove learning resource from educational post
                </p>
              </div>
            </div>

            <div className="p-3 bg-slate-50 rounded-xl border border-slate-200 text-xs text-slate-700 mb-4">
              <div className="flex items-center gap-2 font-bold text-slate-900 truncate">
                <span className="uppercase text-[10px] font-mono bg-rose-100 text-rose-800 px-1.5 py-0.5 rounded">
                  {attachmentToDelete.extension || attachmentToDelete.category}
                </span>
                <span className="truncate">{attachmentToDelete.originalName}</span>
              </div>
              <p className="text-[11px] text-slate-500 mt-1 font-mono">
                Size: {attachmentToDelete.sizeFormatted} · Stored persistently
              </p>
            </div>

            <p className="text-xs text-slate-600 leading-relaxed mb-6">
              This action will remove only this attachment from Firestore and delete its file from storage. <strong>The educational post and all remaining attachments will be preserved.</strong>
            </p>

            <div className="flex items-center justify-end gap-2.5">
              <button
                type="button"
                disabled={isDeletingAttachment}
                onClick={() => setAttachmentToDelete(null)}
                className="px-4 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors disabled:opacity-50"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={isDeletingAttachment}
                onClick={handleConfirmDeleteAttachment}
                className="px-4 py-2 bg-rose-600 hover:bg-rose-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors flex items-center gap-1.5 disabled:opacity-50"
              >
                {isDeletingAttachment ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Deleting Attachment...</span>
                  </>
                ) : (
                  <>
                    <Trash2 className="w-3.5 h-3.5" />
                    <span>Delete Attachment</span>
                  </>
                )}
              </button>
            </div>
          </div>
        </div>
      )}
    </article>
  );
};
