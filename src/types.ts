export type UserRole = 'student' | 'teacher_expert';

export type SubjectCategory =
  | 'Java'
  | 'Python'
  | 'C'
  | 'C++'
  | 'AI/ML'
  | 'Web Development'
  | 'DBMS'
  | 'Cloud Computing'
  | 'Cybersecurity';

export interface User {
  id: string;
  name: string;
  username: string;
  email?: string;
  avatar: string;
  role: UserRole;
  title: string;
  institution: string;
  bio: string;
  expertise: string[];
  followersCount: number;
  followingCount: number;
  isVerified: boolean;
  isAdmin?: boolean;
  isFollowing?: boolean;
}

export type ResourceType = 'notes' | 'code' | 'cheatsheet' | 'tutorial' | 'article' | 'document' | 'video' | 'image';
export type DifficultyLevel = 'Beginner' | 'Intermediate' | 'Advanced';

export interface CodeSnippet {
  language: string;
  code: string;
}

export interface Comment {
  id: string;
  postId: string;
  author: User;
  content: string;
  createdAt: string;
  likes: number;
  isLiked?: boolean;
  isVerifiedEducatorAnswer?: boolean;
}

export interface PostReport {
  id: string;
  postId: string;
  reportedBy: string;
  reason: string;
  timestamp: string;
  status: 'pending' | 'reviewed' | 'dismissed';
}

export type MediaCategory = 'image' | 'video' | 'pdf' | 'code';
export type AttachmentFileType = 'image' | 'pdf' | 'video' | 'code' | 'document';

export interface PostAttachment {
  attachmentId?: string;
  fileName?: string;
  originalFileName?: string;
  fileType?: AttachmentFileType;
  mimeType: string;
  fileSize?: number; // bytes
  permanentFileUrl?: string;
  storageProvider?: string;
  uploadedAt: string;
  // Compatibility fields
  id: string;
  name: string;
  originalName: string;
  category: MediaCategory;
  extension: string;
  size: number;
  sizeFormatted: string;
  url: string;
  downloadUrl?: string;
  thumbnailUrl?: string;
  codeContent?: string;
  duration?: number;
  durationFormatted?: string;
  resolution?: string;
  resourceId?: string;
}

export type MediaAttachment = PostAttachment;

export interface Post {
  id: string;
  authorId: string;
  author: User;
  title: string;
  content: string;
  subject: SubjectCategory;
  resourceUrl?: string;
  resourceTitle?: string;
  resourceType?: ResourceType;
  codeSnippet?: CodeSnippet;
  media?: MediaAttachment;
  attachments?: PostAttachment[];
  tags?: string[];
  likesCount: number;
  isLiked: boolean;
  commentsCount: number;
  savesCount: number;
  isSaved: boolean;
  sharesCount: number;
  createdAt: string;
  difficulty: DifficultyLevel;
  comments: Comment[];
  isFeatured?: boolean;
  reports?: PostReport[];
}

export interface CategoryMeta {
  name: SubjectCategory;
  shortDesc: string;
  longDesc: string;
  iconName: string;
  color: string;
  bgLight: string;
  borderLight: string;
  topicsCount: number;
  resourcesCount: number;
  roadmap: {
    level: DifficultyLevel;
    title: string;
    items: string[];
  }[];
}

export type AppView =
  | 'landing'
  | 'feed'
  | 'explore'
  | 'creators'
  | 'create'
  | 'search'
  | 'saved'
  | 'profile'
  | 'admin'
  | 'auth';
