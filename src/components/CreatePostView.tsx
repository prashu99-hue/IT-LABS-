import React, { useState, useRef } from 'react';
import {
  FileText,
  Code2,
  Link as LinkIcon,
  BookOpen,
  Send,
  Eye,
  CheckCircle,
  HelpCircle,
  AlertCircle,
  Layers,
  Sparkles,
  ArrowLeft,
  UploadCloud,
  FileCode,
  Video,
  Image as ImageIcon,
  X,
  Plus,
  Tag,
  Check,
  Settings,
  Cloud,
  Download,
  ExternalLink,
  Clock,
  RotateCcw,
  Trash2,
  Paperclip
} from 'lucide-react';
import { SubjectCategory, DifficultyLevel, ResourceType, Post, User, MediaAttachment, PostAttachment, MediaCategory } from '../types';
import { POPULAR_SUBJECTS } from '../data/mockData';
import { processUploadedFile, validateFile, formatFileSize } from '../services/storageService';
import { downloadMediaResource } from '../utils/downloadHelper';
import { StorageSettingsModal } from './StorageSettingsModal';
import { Loader2 } from 'lucide-react';

export interface UploadQueueItem {
  id: string;
  file: File;
  name: string;
  size: number;
  sizeFormatted: string;
  category: MediaCategory;
  extension: string;
  status: 'uploading' | 'completed' | 'error';
  progress: number;
  error?: string;
  attachment?: PostAttachment;
}

interface CreatePostViewProps {
  currentUser: User;
  isAuthenticated?: boolean;
  onSignIn?: () => void;
  onPublishPost: (
    post: Omit<
      Post,
      | 'id'
      | 'author'
      | 'likesCount'
      | 'isLiked'
      | 'commentsCount'
      | 'savesCount'
      | 'isSaved'
      | 'sharesCount'
      | 'createdAt'
      | 'comments'
    >
  ) => Promise<void> | void;
  onCancel: () => void;
  isPublishing?: boolean;
}

export const CreatePostView: React.FC<CreatePostViewProps> = ({
  currentUser,
  isAuthenticated = true,
  onSignIn,
  onPublishPost,
  onCancel,
  isPublishing = false,
}) => {
  const [contentType, setContentType] = useState<'media_notes' | 'code' | 'discussion'>('media_notes');
  const [title, setTitle] = useState('');
  const [subject, setSubject] = useState<SubjectCategory>('Java');
  const [difficulty, setDifficulty] = useState<DifficultyLevel>('Intermediate');
  const [description, setDescription] = useState('');
  const [resourceUrl, setResourceUrl] = useState('');
  const [resourceTitle, setResourceTitle] = useState('');
  const [hasCodeSnippet, setHasCodeSnippet] = useState(false);
  const [codeLanguage, setCodeLanguage] = useState('java');
  const [codeContent, setCodeContent] = useState('');
  const [isPreview, setIsPreview] = useState(false);

  // Multi-file upload queue & attached list
  const [uploadQueue, setUploadQueue] = useState<UploadQueueItem[]>([]);
  const [uploadError, setUploadError] = useState<string | null>(null);
  const [isDragging, setIsDragging] = useState(false);
  const [storageModalOpen, setStorageModalOpen] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  // Tags state
  const [tags, setTags] = useState<string[]>(['ComputerScience', 'StudyNotes']);
  const [tagInput, setTagInput] = useState('');

  const handleAddTag = (e?: React.KeyboardEvent | React.MouseEvent) => {
    if (e && 'key' in e && e.key !== 'Enter' && e.key !== ',') return;
    if (e && 'preventDefault' in e) e.preventDefault();

    const clean = tagInput.trim().replace(/^#/, '');
    if (clean && !tags.includes(clean)) {
      setTags([...tags, clean]);
      setTagInput('');
    }
  };

  const handleRemoveTag = (tagToRemove: string) => {
    setTags(tags.filter((t) => t !== tagToRemove));
  };

  // Upload a single file item with live progress tracking
  const uploadSingleFile = async (item: UploadQueueItem) => {
    try {
      const processed = await processUploadedFile(item.file, (progress) => {
        setUploadQueue((prev) =>
          prev.map((q) => (q.id === item.id ? { ...q, progress } : q))
        );
      });

      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'completed', progress: 100, attachment: processed } : q
        )
      );

      // Auto-populate title from first file if empty
      setTitle((prev) => {
        if (prev.trim()) return prev;
        const cleanName = item.name.replace(/\.[^/.]+$/, '').replace(/[-_]/g, ' ');
        return cleanName.charAt(0).toUpperCase() + cleanName.slice(1);
      });
    } catch (err: any) {
      setUploadQueue((prev) =>
        prev.map((q) =>
          q.id === item.id ? { ...q, status: 'error', error: err.message || 'Upload failed' } : q
        )
      );
    }
  };

  // Handle selection of one or multiple files
  const handleFilesSelection = (fileList: FileList | File[] | null) => {
    if (!fileList || fileList.length === 0) return;
    setUploadError(null);

    const files = Array.from(fileList);
    const newItems: UploadQueueItem[] = [];

    for (const file of files) {
      const validation = validateFile(file);
      const queueId = 'queue_' + Date.now() + '_' + Math.random().toString(36).substring(2, 7);

      if (!validation.isValid) {
        newItems.push({
          id: queueId,
          file,
          name: file.name,
          size: file.size,
          sizeFormatted: formatFileSize(file.size),
          category: 'code',
          extension: file.name.split('.').pop() || '',
          status: 'error',
          progress: 0,
          error: validation.error || 'File validation failed',
        });
        continue;
      }

      const item: UploadQueueItem = {
        id: queueId,
        file,
        name: file.name,
        size: file.size,
        sizeFormatted: formatFileSize(file.size),
        category: validation.category!,
        extension: validation.extension!,
        status: 'uploading',
        progress: 10,
      };

      newItems.push(item);
    }

    setUploadQueue((prev) => [...prev, ...newItems]);

    // Start uploading valid items
    for (const item of newItems) {
      if (item.status === 'uploading') {
        uploadSingleFile(item);
      }
    }
  };

  const handleRetryUpload = (itemId: string) => {
    const item = uploadQueue.find((q) => q.id === itemId);
    if (!item) return;

    setUploadQueue((prev) =>
      prev.map((q) => (q.id === itemId ? { ...q, status: 'uploading', error: undefined, progress: 10 } : q))
    );
    uploadSingleFile(item);
  };

  const handleRemoveQueueItem = (itemId: string) => {
    setUploadQueue((prev) => prev.filter((q) => q.id !== itemId));
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      handleFilesSelection(e.dataTransfer.files);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      handleFilesSelection(e.target.files);
      // Reset input value so same files can be re-selected if removed
      e.target.value = '';
    }
  };

  // Derive completed attachments list
  const completedAttachments: PostAttachment[] = uploadQueue
    .filter((q) => q.status === 'completed' && q.attachment)
    .map((q) => q.attachment!);

  const isAnyUploading = uploadQueue.some((q) => q.status === 'uploading');
  const hasUploadErrors = uploadQueue.some((q) => q.status === 'error');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!isAuthenticated && onSignIn) {
      onSignIn();
      return;
    }
    if (!title.trim() || !description.trim()) return;

    if (isAnyUploading) {
      setUploadError('Please wait for all attachments to finish uploading before publishing.');
      return;
    }

    if (hasUploadErrors) {
      setUploadError('One or more attachments failed to upload. Please retry or remove the failed attachment before publishing.');
      return;
    }

    const payload: any = {
      authorId: currentUser.id,
      title: title.trim(),
      content: description.trim(),
      subject,
      difficulty,
      resourceType: completedAttachments.length > 0
        ? (completedAttachments[0].category === 'pdf' ? 'document' : completedAttachments[0].category === 'video' ? 'video' : completedAttachments[0].category === 'image' ? 'image' : 'code')
        : (contentType === 'code' ? 'code' : 'notes'),
    };

    if (resourceUrl.trim()) {
      payload.resourceUrl = resourceUrl.trim();
    }
    if (resourceTitle.trim()) {
      payload.resourceTitle = resourceTitle.trim();
    }
    if (hasCodeSnippet && codeContent.trim()) {
      payload.codeSnippet = {
        language: codeLanguage || 'javascript',
        code: codeContent.trim(),
      };
    }

    // Attachments array and primary media
    if (completedAttachments.length > 0) {
      payload.attachments = completedAttachments;
      payload.media = completedAttachments[0];
    }

    if (tags && tags.length > 0) {
      payload.tags = tags;
    }

    onPublishPost(payload);
  };

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <button
          onClick={onCancel}
          className="flex items-center gap-1.5 text-xs font-semibold text-slate-500 hover:text-slate-900 transition-colors"
        >
          <ArrowLeft className="w-4 h-4" />
          <span>Cancel & Return</span>
        </button>

        <div className="flex items-center gap-1 bg-slate-100 p-1 rounded-xl">
          <button
            type="button"
            onClick={() => setIsPreview(false)}
            className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              !isPreview ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            Edit Form
          </button>
          <button
            type="button"
            onClick={() => setIsPreview(true)}
            className={`flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold transition-all ${
              isPreview ? 'bg-white text-slate-900 shadow-xs' : 'text-slate-600 hover:text-slate-900'
            }`}
          >
            <Eye className="w-3.5 h-3.5" />
            <span>Live Preview</span>
          </button>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-200/80 p-6 sm:p-8 shadow-xs">
        {/* Title */}
        <div className="mb-6">
          <div className="inline-flex items-center gap-1.5 text-xs font-semibold text-blue-600 uppercase tracking-wider mb-1">
            <Sparkles className="w-3.5 h-3.5" />
            Educational Publishing Studio
          </div>
          <h1 className="text-xl sm:text-2xl font-extrabold text-slate-900 tracking-tight">
            Upload Educational Media, Notes & Code
          </h1>
          <p className="text-xs text-slate-500 mt-1">
            Share images, video lessons, PDF e-books, and source code files with students and educators.
          </p>

          {!isAuthenticated && (
            <div className="mt-4 p-3.5 rounded-2xl bg-amber-50 border border-amber-200 flex items-center justify-between gap-3 text-amber-900 text-xs">
              <div className="flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                <span>You are browsing in guest mode. Sign in with your account to publish to Cloud Firestore.</span>
              </div>
              {onSignIn && (
                <button
                  type="button"
                  onClick={onSignIn}
                  className="px-3 py-1 bg-amber-600 hover:bg-amber-700 text-white font-semibold rounded-lg shrink-0 text-xs transition-colors"
                >
                  Sign In
                </button>
              )}
            </div>
          )}
        </div>

        {!isPreview ? (
          <form onSubmit={handleSubmit} className="space-y-5">
            {/* Content Category Mode */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider mb-2">
                Select Publishing Type
              </label>
              <div className="grid grid-cols-3 gap-2 sm:gap-3">
                <button
                  type="button"
                  onClick={() => {
                    setContentType('media_notes');
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    contentType === 'media_notes'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-800 ring-2 ring-blue-500/10 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <UploadCloud className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs">Media & PDF Upload</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setContentType('code');
                    setHasCodeSnippet(true);
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    contentType === 'code'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-800 ring-2 ring-blue-500/10 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <Code2 className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs">Code Snippet Breakdown</span>
                </button>

                <button
                  type="button"
                  onClick={() => {
                    setContentType('discussion');
                  }}
                  className={`p-3 rounded-2xl border text-center transition-all ${
                    contentType === 'discussion'
                      ? 'border-blue-600 bg-blue-50/50 text-blue-800 ring-2 ring-blue-500/10 font-bold'
                      : 'border-slate-200 text-slate-600 hover:bg-slate-50'
                  }`}
                >
                  <HelpCircle className="w-4 h-4 mx-auto mb-1 text-blue-600" />
                  <span className="text-xs">Concept Question / AMA</span>
                </button>
              </div>
            </div>

            {/* Drag & Drop Media Upload Area */}
            <div className="pt-1">
              <div className="flex items-center justify-between mb-2">
                <label className="block text-xs font-semibold text-slate-700 uppercase tracking-wider">
                  Educational Media Resource (Drag & Drop or Browse)
                </label>
                <button
                  type="button"
                  onClick={() => setStorageModalOpen(true)}
                  className="inline-flex items-center gap-1 text-[11px] font-semibold text-blue-700 hover:text-blue-800 bg-blue-50 hover:bg-blue-100 px-2.5 py-1 rounded-lg border border-blue-200 transition-colors"
                >
                  <Settings className="w-3 h-3 text-blue-600" />
                  <span>Storage: Server / CDN</span>
                </button>
              </div>

              {/* Hidden multi-file input */}
              <input
                ref={fileInputRef}
                type="file"
                multiple
                onChange={handleFileInputChange}
                accept=".jpg,.jpeg,.png,.webp,.mp4,.webm,.pdf,.txt,.py,.java,.c,.cpp,.js,.html,.css"
                className="hidden"
              />

              {uploadQueue.length === 0 ? (
                /* Primary Empty State Dropzone */
                <div
                  onDrop={handleDrop}
                  onDragOver={handleDragOver}
                  onDragLeave={handleDragLeave}
                  onClick={() => fileInputRef.current?.click()}
                  className={`border-2 border-dashed rounded-2xl p-6 sm:p-8 text-center cursor-pointer transition-all ${
                    isDragging
                      ? 'border-blue-600 bg-blue-50/70 scale-[1.01]'
                      : 'border-slate-300 hover:border-blue-400 bg-slate-50/50 hover:bg-slate-50'
                  }`}
                >
                  <div className="w-12 h-12 rounded-2xl bg-blue-100 text-blue-600 flex items-center justify-center mx-auto mb-3 shadow-xs">
                    <UploadCloud className="w-6 h-6" />
                  </div>

                  <h4 className="text-sm font-bold text-slate-900">
                    Drag and drop multiple educational files here, or <span className="text-blue-600 underline">browse</span>
                  </h4>
                  <p className="text-xs text-slate-500 mt-1 max-w-md mx-auto">
                    Attach multiple files: <strong>Images</strong> (JPG, PNG, WEBP), <strong>Videos</strong> (MP4, WEBM), <strong>PDF</strong> documents & e-books, and <strong>Code</strong> (PY, JAVA, C, CPP, JS, HTML, CSS, TXT)
                  </p>
                  <p className="text-[11px] text-slate-400 mt-2 font-mono">
                    Select multiple files at once · Max 50 MB per file · Zero-cost persistent storage
                  </p>
                </div>
              ) : (
                /* Multi-File Attachments List & Queue */
                <div className="space-y-3">
                  {/* Queue Header with count and Add More button */}
                  <div className="flex items-center justify-between px-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-slate-900">
                        Attached Files ({completedAttachments.length} of {uploadQueue.length} ready)
                      </span>
                      {completedAttachments.length > 0 && (
                        <span className="text-[11px] font-semibold text-emerald-700 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-full">
                          {formatFileSize(completedAttachments.reduce((acc, a) => acc + (a.fileSize || a.size || 0), 0))} total
                        </span>
                      )}
                    </div>

                    <button
                      type="button"
                      onClick={() => fileInputRef.current?.click()}
                      className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-blue-50 hover:bg-blue-100 border border-blue-200 text-blue-700 rounded-xl text-xs font-semibold transition-colors"
                    >
                      <Plus className="w-3.5 h-3.5" />
                      <span>Add More Files</span>
                    </button>
                  </div>

                  {/* Attachment Items */}
                  <div className="space-y-2.5">
                    {uploadQueue.map((item, idx) => {
                      const isComplete = item.status === 'completed' && item.attachment;
                      const isError = item.status === 'error';
                      const isUploadingItem = item.status === 'uploading';

                      return (
                        <div
                          key={item.id}
                          className={`rounded-2xl border transition-all p-3.5 space-y-2.5 ${
                            isError
                              ? 'border-rose-200 bg-rose-50/40'
                              : isUploadingItem
                              ? 'border-blue-200 bg-blue-50/30'
                              : 'border-slate-200 bg-white hover:border-slate-300'
                          }`}
                        >
                          {/* File info row */}
                          <div className="flex items-center justify-between gap-3">
                            <div className="flex items-center gap-3 min-w-0">
                              <div
                                className={`w-10 h-10 rounded-xl flex items-center justify-center shrink-0 shadow-xs font-bold text-xs uppercase ${
                                  item.category === 'pdf'
                                    ? 'bg-rose-600 text-white'
                                    : item.category === 'video'
                                    ? 'bg-indigo-600 text-white'
                                    : item.category === 'code'
                                    ? 'bg-teal-600 text-white'
                                    : 'bg-blue-600 text-white'
                                }`}
                              >
                                {item.category === 'image' && <ImageIcon className="w-5 h-5" />}
                                {item.category === 'video' && <Video className="w-5 h-5" />}
                                {item.category === 'pdf' && <FileText className="w-5 h-5" />}
                                {item.category === 'code' && <FileCode className="w-5 h-5" />}
                              </div>

                              <div className="min-w-0">
                                <div className="flex items-center gap-2 flex-wrap">
                                  <span className="font-bold text-xs text-slate-900 truncate max-w-xs sm:max-w-md">
                                    {item.name}
                                  </span>
                                  <span
                                    className={`uppercase text-[10px] font-bold px-1.5 py-0.2 rounded font-mono ${
                                      item.category === 'pdf'
                                        ? 'bg-rose-100 text-rose-800'
                                        : item.category === 'video'
                                        ? 'bg-indigo-100 text-indigo-800'
                                        : 'bg-blue-100 text-blue-800'
                                    }`}
                                  >
                                    {item.extension}
                                  </span>
                                  {item.attachment?.durationFormatted && (
                                    <span className="inline-flex items-center gap-1 text-[10px] font-semibold bg-indigo-50 text-indigo-700 px-1.5 py-0.2 rounded-md">
                                      <Clock className="w-3 h-3" />
                                      {item.attachment.durationFormatted}
                                    </span>
                                  )}
                                  {item.attachment?.resolution && (
                                    <span className="text-[10px] font-semibold bg-slate-100 text-slate-700 px-1.5 py-0.2 rounded">
                                      {item.attachment.resolution}
                                    </span>
                                  )}
                                </div>

                                <div className="flex items-center gap-2 text-[11px] text-slate-500 mt-0.5">
                                  <span className="capitalize">{item.category}</span>
                                  <span>·</span>
                                  <span className="font-mono tabular-nums">{item.sizeFormatted}</span>
                                  {isComplete && (
                                    <>
                                      <span>·</span>
                                      <span className="text-emerald-700 font-semibold flex items-center gap-0.5">
                                        <Check className="w-3 h-3 text-emerald-600" /> Stored Permanently
                                      </span>
                                    </>
                                  )}
                                </div>
                              </div>
                            </div>

                            {/* Actions on this item */}
                            <div className="flex items-center gap-1.5 shrink-0">
                              {isError && (
                                <button
                                  type="button"
                                  onClick={() => handleRetryUpload(item.id)}
                                  className="px-2.5 py-1.5 bg-rose-100 hover:bg-rose-200 text-rose-800 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                                  title="Retry file upload"
                                >
                                  <RotateCcw className="w-3.5 h-3.5" />
                                  <span>Retry</span>
                                </button>
                              )}

                              {isComplete && (
                                <button
                                  type="button"
                                  onClick={async () => {
                                    if (item.attachment) {
                                      await downloadMediaResource(item.attachment);
                                    }
                                  }}
                                  className="px-2.5 py-1.5 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold flex items-center gap-1 transition-colors"
                                  title={`Download ${item.name}`}
                                >
                                  <Download className="w-3.5 h-3.5 text-blue-600" />
                                  <span className="hidden sm:inline">Test Download</span>
                                </button>
                              )}

                              <button
                                type="button"
                                onClick={() => handleRemoveQueueItem(item.id)}
                                className="p-1.5 text-slate-400 hover:text-rose-600 hover:bg-rose-50 rounded-xl transition-colors"
                                title="Remove attachment"
                              >
                                <X className="w-4 h-4" />
                              </button>
                            </div>
                          </div>

                          {/* Progress bar when uploading */}
                          {isUploadingItem && (
                            <div className="space-y-1">
                              <div className="flex justify-between text-[11px] text-blue-700 font-semibold">
                                <span>Uploading to persistent storage...</span>
                                <span className="font-mono">{item.progress}%</span>
                              </div>
                              <div className="w-full h-1.5 bg-blue-100 rounded-full overflow-hidden">
                                <div
                                  className="h-full bg-blue-600 transition-all duration-150"
                                  style={{ width: `${item.progress}%` }}
                                />
                              </div>
                            </div>
                          )}

                          {/* Error notice if upload failed */}
                          {isError && (
                            <div className="p-2 rounded-xl bg-rose-100/70 text-rose-800 text-xs flex items-center gap-1.5">
                              <AlertCircle className="w-4 h-4 shrink-0 text-rose-600" />
                              <span className="truncate">{item.error || 'Upload failed. Please check network or file size.'}</span>
                            </div>
                          )}

                          {/* Embedded interactive preview when completed */}
                          {isComplete && item.attachment && (
                            <div className="pt-1.5 border-t border-slate-100">
                              {/* Video Player */}
                              {item.category === 'video' && (
                                <div className="rounded-xl overflow-hidden bg-black shadow-inner max-h-56 flex items-center justify-center">
                                  <video
                                    controls
                                    playsInline
                                    preload="metadata"
                                    src={item.attachment.url}
                                    className="w-full max-h-56 rounded-xl"
                                  >
                                    Your browser does not support the video tag.
                                  </video>
                                </div>
                              )}

                              {/* PDF Preview Frame */}
                              {item.category === 'pdf' && (
                                <div className="space-y-1.5">
                                  <div className="flex items-center justify-between text-[11px] text-slate-600">
                                    <span className="font-semibold text-rose-700 flex items-center gap-1">
                                      <FileText className="w-3.5 h-3.5" /> PDF Reader Preview
                                    </span>
                                    <a
                                      href={item.attachment.url}
                                      target="_blank"
                                      rel="noopener noreferrer"
                                      className="text-blue-600 hover:underline flex items-center gap-1 font-medium"
                                    >
                                      <span>Open separately</span>
                                      <ExternalLink className="w-3 h-3" />
                                    </a>
                                  </div>
                                  <div className="w-full h-44 rounded-xl border border-slate-300 bg-white overflow-hidden shadow-inner">
                                    <iframe
                                      src={`${item.attachment.url}#toolbar=0&navpanes=0`}
                                      title={item.name}
                                      className="w-full h-full border-0"
                                    />
                                  </div>
                                </div>
                              )}

                              {/* Image Preview */}
                              {item.category === 'image' && (
                                <div className="flex items-center justify-center bg-slate-900/5 rounded-xl p-2 max-h-44 overflow-hidden">
                                  <img
                                    src={item.attachment.url}
                                    alt={item.name}
                                    className="max-h-40 object-contain rounded-lg"
                                  />
                                </div>
                              )}

                              {/* Code Preview */}
                              {item.category === 'code' && item.attachment.codeContent && (
                                <div className="rounded-xl overflow-hidden bg-slate-900 text-slate-200 p-2.5 font-mono text-xs max-h-36 overflow-y-auto">
                                  <pre>
                                    <code>{item.attachment.codeContent}</code>
                                  </pre>
                                </div>
                              )}
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  {/* Compact dropzone for appending additional files */}
                  <div
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    onDragLeave={handleDragLeave}
                    onClick={() => fileInputRef.current?.click()}
                    className={`border border-dashed rounded-xl p-3 text-center cursor-pointer transition-all ${
                      isDragging
                        ? 'border-blue-600 bg-blue-50/80'
                        : 'border-slate-300 hover:border-blue-400 bg-slate-50 hover:bg-blue-50/30'
                    }`}
                  >
                    <div className="flex items-center justify-center gap-2 text-xs font-semibold text-slate-600 hover:text-blue-600">
                      <Plus className="w-4 h-4 text-blue-600" />
                      <span>Drag more files here or click to add</span>
                    </div>
                  </div>
                </div>
              )}

              {/* General Upload Error Banner */}
              {uploadError && (
                <div className="mt-3 p-3 rounded-xl bg-rose-50 border border-rose-200 flex items-center justify-between gap-2 text-xs text-rose-800">
                  <div className="flex items-center gap-2 min-w-0">
                    <AlertCircle className="w-4 h-4 text-rose-600 shrink-0" />
                    <span>{uploadError}</span>
                  </div>
                  <button
                    type="button"
                    onClick={() => setUploadError(null)}
                    className="text-rose-500 hover:text-rose-800 p-1"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              )}
            </div>

            {/* Subject and Difficulty row */}
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Subject Category
                </label>
                <select
                  value={subject}
                  onChange={(e) => {
                    const val = e.target.value as SubjectCategory;
                    setSubject(val);
                    if (val === 'Java') setCodeLanguage('java');
                    if (val === 'Python') setCodeLanguage('python');
                    if (val === 'C') setCodeLanguage('c');
                    if (val === 'C++') setCodeLanguage('cpp');
                    if (val === 'Web Development') setCodeLanguage('typescript');
                    if (val === 'DBMS') setCodeLanguage('sql');
                    if (val === 'Cloud Computing') setCodeLanguage('yaml');
                  }}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
                >
                  {POPULAR_SUBJECTS.map((sub) => (
                    <option key={sub} value={sub}>
                      {sub}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                  Difficulty Level
                </label>
                <select
                  value={difficulty}
                  onChange={(e) => setDifficulty(e.target.value as DifficultyLevel)}
                  className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs font-medium text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
                >
                  <option value="Beginner">Beginner (Foundations & Syntax)</option>
                  <option value="Intermediate">Intermediate (Real-world Algorithms & Internals)</option>
                  <option value="Advanced">Advanced (High-Performance & Low-Level)</option>
                </select>
              </div>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Resource Title
              </label>
              <input
                type="text"
                required
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="e.g. Modern C++20 Ranges Architecture & Complete Reference"
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm font-semibold text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Tags (Prompt Requirement 2) */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Educational Tags (Keywords & Disciplines)
              </label>
              <div className="flex gap-2 mb-2">
                <div className="relative flex-1">
                  <input
                    type="text"
                    value={tagInput}
                    onChange={(e) => setTagInput(e.target.value)}
                    onKeyDown={handleAddTag}
                    placeholder="Type a tag (e.g. PyTorch, Concurrency, DSA) and press Enter"
                    className="w-full pl-8 pr-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                  />
                  <Tag className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
                <button
                  type="button"
                  onClick={handleAddTag}
                  className="px-3 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-medium flex items-center gap-1"
                >
                  <Plus className="w-3.5 h-3.5" />
                  <span>Add Tag</span>
                </button>
              </div>

              {/* Tag Chips */}
              <div className="flex items-center gap-1.5 flex-wrap">
                {tags.map((tag) => (
                  <span
                    key={tag}
                    className="inline-flex items-center gap-1 px-2.5 py-1 rounded-lg bg-blue-50 text-blue-700 border border-blue-100 text-xs font-medium"
                  >
                    #{tag}
                    <button
                      type="button"
                      onClick={() => handleRemoveTag(tag)}
                      className="hover:text-blue-900 ml-0.5"
                    >
                      <X className="w-3 h-3" />
                    </button>
                  </span>
                ))}
              </div>
            </div>

            {/* Content / Description */}
            <div>
              <label className="block text-xs font-semibold text-slate-700 mb-1.5">
                Explanation, Overview & Learning Notes
              </label>
              <textarea
                required
                rows={4}
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Explain the intuition, why this concept matters, pitfalls students face, and key takeaways..."
                className="w-full px-3.5 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-xs text-slate-800 leading-relaxed focus:outline-hidden focus:bg-white focus:border-blue-500"
              />
            </div>

            {/* Optional Embedded Code Snippet */}
            <div className="pt-2">
              <div className="flex items-center justify-between mb-2">
                <label className="flex items-center gap-2 cursor-pointer text-xs font-semibold text-slate-800">
                  <input
                    type="checkbox"
                    checked={hasCodeSnippet}
                    onChange={(e) => setHasCodeSnippet(e.target.checked)}
                    className="w-4 h-4 text-blue-600 rounded-sm border-slate-300 focus:ring-blue-500"
                  />
                  <span>Include Formatted In-Line Code Snippet</span>
                </label>

                {hasCodeSnippet && (
                  <select
                    value={codeLanguage}
                    onChange={(e) => setCodeLanguage(e.target.value)}
                    className="px-2.5 py-1 bg-slate-100 border border-slate-200 rounded-lg text-xs font-mono text-slate-700"
                  >
                    <option value="java">Java</option>
                    <option value="python">Python</option>
                    <option value="c">C</option>
                    <option value="cpp">C++</option>
                    <option value="typescript">TypeScript</option>
                    <option value="sql">SQL</option>
                    <option value="yaml">YAML</option>
                  </select>
                )}
              </div>

              {hasCodeSnippet && (
                <div className="rounded-xl overflow-hidden border border-slate-800 bg-slate-900">
                  <div className="px-3.5 py-1.5 bg-slate-950 text-slate-400 font-mono text-[11px] border-b border-slate-800 flex items-center justify-between">
                    <span>{codeLanguage.toUpperCase()} CODE BLOCK</span>
                    <span>Syntax highlighted</span>
                  </div>
                  <textarea
                    rows={5}
                    value={codeContent}
                    onChange={(e) => setCodeContent(e.target.value)}
                    placeholder="// Paste clean, commented code snippet here..."
                    className="w-full p-3.5 bg-slate-900 text-slate-100 font-mono text-xs focus:outline-hidden resize-y"
                  />
                </div>
              )}
            </div>

            {/* Optional External Documentation Link */}
            <div className="pt-2 border-t border-slate-100">
              <label className="block text-xs font-semibold text-slate-700 mb-1">
                Additional Reference URL (Optional)
              </label>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                <input
                  type="text"
                  value={resourceTitle}
                  onChange={(e) => setResourceTitle(e.target.value)}
                  placeholder="Link Title (e.g. GitHub Repository, Official Docs)"
                  className="w-full px-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
                <div className="relative">
                  <input
                    type="url"
                    value={resourceUrl}
                    onChange={(e) => setResourceUrl(e.target.value)}
                    placeholder="https://..."
                    className="w-full pl-8 pr-3.5 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-800 focus:outline-hidden focus:bg-white focus:border-blue-500"
                  />
                  <LinkIcon className="w-3.5 h-3.5 text-slate-400 absolute left-3 top-2.5" />
                </div>
              </div>
            </div>

            {/* Submit Bar */}
            <div className="pt-4 flex items-center justify-end gap-3">
              <button
                type="button"
                onClick={onCancel}
                className="px-5 py-2.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-xl"
              >
                Discard Draft
              </button>
              <button
                type="submit"
                disabled={!title.trim() || !description.trim() || isAnyUploading || hasUploadErrors || isPublishing}
                className="px-6 py-2.5 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-200 disabled:text-slate-400 text-white rounded-xl text-xs font-semibold shadow-md shadow-blue-500/20 transition-all flex items-center gap-1.5"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing to Firestore...</span>
                  </>
                ) : (
                  <>
                    <Send className="w-3.5 h-3.5" />
                    <span>Publish to IT LABS Feed</span>
                  </>
                )}
              </button>
            </div>
          </form>
        ) : (
          /* Live Preview Mode */
          <div className="space-y-4">
            <div className="p-4 rounded-xl bg-blue-50 border border-blue-200 text-xs text-blue-800">
              This is a live preview of your educational post and all attached resources before publishing.
            </div>

            <div className="p-5 rounded-2xl border border-slate-200 bg-white space-y-3">
              <div className="flex items-center gap-2 text-xs text-slate-500">
                <span className="font-semibold text-blue-600">{subject}</span>
                <span>·</span>
                <span>{difficulty} Level</span>
              </div>
              <h2 className="text-lg font-bold text-slate-900">{title || 'Untitled Post'}</h2>
              <p className="text-xs text-slate-700 whitespace-pre-line leading-relaxed">
                {description || 'No description entered yet.'}
              </p>

              {/* Tags Preview */}
              {tags.length > 0 && (
                <div className="flex items-center gap-1.5 flex-wrap">
                  {tags.map((t) => (
                    <span key={t} className="text-[11px] font-medium text-slate-600 bg-slate-100 px-2 py-0.5 rounded-md">
                      #{t}
                    </span>
                  ))}
                </div>
              )}

              {/* Multiple Media Attachments Preview */}
              {completedAttachments.length > 0 && (
                <div className="space-y-3 pt-2 border-t border-slate-100">
                  <div className="flex items-center justify-between">
                    <span className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                      <Paperclip className="w-4 h-4 text-blue-600" />
                      Attached Resources ({completedAttachments.length})
                    </span>
                    <span className="text-[11px] text-slate-500">
                      Permanent storage confirmed
                    </span>
                  </div>

                  <div className="space-y-3">
                    {completedAttachments.map((att, idx) => (
                      <div
                        key={att.id || idx}
                        className="rounded-2xl border border-blue-200 bg-blue-50/50 p-4 space-y-3"
                      >
                        <div className="flex items-center justify-between gap-3">
                          <div className="flex items-center gap-3 min-w-0">
                            <div
                              className={`w-10 h-10 shrink-0 rounded-xl flex items-center justify-center font-bold text-xs uppercase text-white ${
                                att.category === 'pdf'
                                  ? 'bg-rose-600'
                                  : att.category === 'video'
                                  ? 'bg-indigo-600'
                                  : att.category === 'image'
                                  ? 'bg-blue-600'
                                  : 'bg-emerald-600'
                              }`}
                            >
                              {att.extension}
                            </div>
                            <div className="min-w-0">
                              <div className="text-xs font-bold text-slate-900 truncate">
                                {att.originalName}
                              </div>
                              <div className="text-[11px] text-slate-500">
                                {att.category.toUpperCase()} · {att.sizeFormatted}
                                {att.durationFormatted && ` · ${att.durationFormatted}`}
                                {att.resolution && ` · ${att.resolution}`}
                              </div>
                            </div>
                          </div>
                          <button
                            type="button"
                            onClick={() => downloadMediaResource(att)}
                            className="px-3 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold flex items-center gap-1 shadow-xs shrink-0"
                          >
                            <Download className="w-3.5 h-3.5" />
                            <span>Download</span>
                          </button>
                        </div>

                        {att.category === 'pdf' && (
                          <div className="w-full h-64 rounded-xl border border-slate-300 bg-white overflow-hidden shadow-inner">
                            <iframe
                              src={`${att.url}#toolbar=0&navpanes=0`}
                              title={att.originalName}
                              className="w-full h-full border-0"
                            />
                          </div>
                        )}

                        {att.category === 'video' && (
                          <div className="rounded-xl overflow-hidden bg-black shadow-inner max-h-64">
                            <video
                              controls
                              playsInline
                              preload="metadata"
                              src={att.url}
                              className="w-full max-h-64 rounded-xl"
                            />
                          </div>
                        )}

                        {att.category === 'image' && (
                          <div className="rounded-xl overflow-hidden max-h-64 flex items-center justify-center bg-slate-900/5 p-2">
                            <img
                              src={att.url}
                              alt={att.originalName}
                              className="max-h-60 object-contain rounded-lg"
                            />
                          </div>
                        )}

                        {att.category === 'code' && att.codeContent && (
                          <div className="rounded-xl overflow-hidden bg-slate-900 text-slate-200 p-3 font-mono text-xs max-h-48 overflow-y-auto">
                            <pre>
                              <code>{att.codeContent}</code>
                            </pre>
                          </div>
                        )}
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {hasCodeSnippet && codeContent && (
                <div className="mt-3 rounded-xl bg-slate-900 text-slate-200 p-3 font-mono text-xs">
                  <pre>
                    <code>{codeContent}</code>
                  </pre>
                </div>
              )}
            </div>

            <div className="flex justify-end gap-2 pt-2">
              <button
                onClick={() => setIsPreview(false)}
                className="px-4 py-2 bg-slate-100 text-slate-700 rounded-xl text-xs font-medium"
              >
                Back to Editing
              </button>
              <button
                onClick={handleSubmit}
                disabled={!title.trim() || !description.trim() || isAnyUploading || hasUploadErrors || isPublishing}
                className="px-6 py-2 bg-blue-600 hover:bg-blue-700 disabled:bg-slate-300 text-white rounded-xl text-xs font-semibold flex items-center gap-1.5"
              >
                {isPublishing ? (
                  <>
                    <Loader2 className="w-3.5 h-3.5 animate-spin" />
                    <span>Publishing...</span>
                  </>
                ) : (
                  <span>Publish Now</span>
                )}
              </button>
            </div>
          </div>
        )}
      </div>

      {/* Storage Provider Settings Modal */}
      <StorageSettingsModal
        isOpen={storageModalOpen}
        onClose={() => setStorageModalOpen(false)}
      />
    </div>
  );
};
