import {
  collection,
  doc,
  setDoc,
  getDoc,
  getDocs,
  query,
  orderBy,
  where,
  serverTimestamp,
  updateDoc,
  increment,
  deleteDoc,
  onSnapshot,
  Timestamp,
  writeBatch,
  runTransaction
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { Post, Comment, User, SubjectCategory, DifficultyLevel, ResourceType, CodeSnippet, MediaAttachment, PostAttachment } from '../types';
import { cleanFirestoreData } from '../utils/firestoreSanitizer';
import { handleFirestoreError, OperationType } from '../utils/firestoreErrorHandler';
import { deleteMediaFromServer, deleteAttachmentFromServer, formatFileSize } from './storageService';

export { cleanFirestoreData };

export interface CreatePostInput {
  title: string;
  description: string;
  subject: SubjectCategory;
  difficulty: DifficultyLevel;
  tags?: string[];
  resourceUrl?: string;
  resourceTitle?: string;
  resourceType?: ResourceType;
  codeSnippet?: CodeSnippet;
  media?: MediaAttachment;
  attachments?: PostAttachment[];
}

/**
 * Helper to convert Firestore timestamp or ISO string to friendly relative time
 */
export function formatTimestamp(timestamp: any): string {
  if (!timestamp) return 'Just now';

  let date: Date;
  if (timestamp instanceof Timestamp) {
    date = timestamp.toDate();
  } else if (timestamp?.seconds) {
    date = new Date(timestamp.seconds * 1000);
  } else if (typeof timestamp === 'string') {
    date = new Date(timestamp);
  } else if (timestamp instanceof Date) {
    date = timestamp;
  } else {
    return 'Just now';
  }

  const now = new Date();
  const diffInSeconds = Math.floor((now.getTime() - date.getTime()) / 1000);

  if (diffInSeconds < 60) return 'Just now';
  if (diffInSeconds < 3600) return `${Math.floor(diffInSeconds / 60)}m ago`;
  if (diffInSeconds < 86400) return `${Math.floor(diffInSeconds / 3600)}h ago`;
  if (diffInSeconds < 604800) return `${Math.floor(diffInSeconds / 86400)}d ago`;

  return date.toLocaleDateString('en-US', { month: 'short', day: 'numeric' });
}

/**
 * Publish a new educational post to Cloud Firestore
 */
export async function createPostInFirestore(
  input: CreatePostInput,
  currentUser: User
): Promise<Post> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('You must be signed in to publish an educational post.');
  }

  if (!input.title.trim()) {
    throw new Error('Post title is required.');
  }
  if (!input.description.trim()) {
    throw new Error('Post description is required.');
  }

  // Create document reference with auto-generated ID
  const postDocRef = doc(collection(db, 'posts'));
  const postId = postDocRef.id;

  const nowIso = new Date().toISOString();

  // Clean tags
  const cleanTags = (input.tags || [])
    .map((t) => t.trim().replace(/^#/, ''))
    .filter((t) => t.length > 0);

  // Clean code snippet if present; otherwise null
  const cleanCodeSnippet = input.codeSnippet && input.codeSnippet.code?.trim()
    ? {
        language: input.codeSnippet.language?.trim() || 'javascript',
        code: input.codeSnippet.code.trim(),
      }
    : null;

  // Gather all attachments from input.attachments or legacy input.media
  const rawAttachments: PostAttachment[] = (input.attachments && input.attachments.length > 0)
    ? input.attachments
    : (input.media ? [input.media] : []);

  for (const att of rawAttachments) {
    if (att.permanentFileUrl?.startsWith('blob:') || att.url?.startsWith('blob:')) {
      throw new Error(`Upload validation failed: Attachment "${att.originalFileName || att.originalName || att.name}" contains an ephemeral session blob URL. All files must be saved to persistent cloud storage.`);
    }
  }

  // Clean and normalize each attachment according to Requirement 3
  const cleanAttachments: PostAttachment[] = rawAttachments.map((att, idx) => {
    const originalFileName = att.originalFileName || att.originalName || att.name || `attachment_${idx + 1}`;
    const fileName = att.fileName || att.name || originalFileName;
    const fileType = att.fileType || (att.category === 'pdf' ? 'pdf' : att.category === 'video' ? 'video' : att.category === 'image' ? 'image' : 'code');
    const size = typeof att.fileSize === 'number' ? att.fileSize : (typeof att.size === 'number' ? att.size : 0);
    const sizeFormatted = att.sizeFormatted || formatFileSize(size);
    const permanentFileUrl = att.permanentFileUrl || att.url || '';
    const extension = att.extension || originalFileName.split('.').pop()?.toLowerCase() || '';

    return {
      attachmentId: att.attachmentId || att.id || `att_${Date.now()}_${idx}`,
      fileName,
      originalFileName,
      fileType,
      mimeType: att.mimeType || (fileType === 'pdf' ? 'application/pdf' : `application/${extension || 'octet-stream'}`),
      fileSize: size,
      permanentFileUrl,
      storageProvider: att.storageProvider || 'IT LABS Server Storage',
      uploadedAt: att.uploadedAt || new Date().toISOString(),
      // Rich metadata
      id: att.attachmentId || att.id || `att_${Date.now()}_${idx}`,
      name: fileName,
      originalName: originalFileName,
      category: (fileType === 'document' ? 'pdf' : fileType) as any,
      extension,
      size,
      sizeFormatted,
      url: permanentFileUrl,
      downloadUrl: att.downloadUrl || permanentFileUrl,
      ...(att.thumbnailUrl ? { thumbnailUrl: att.thumbnailUrl } : {}),
      ...(att.codeContent ? { codeContent: att.codeContent } : {}),
      ...(typeof att.duration === 'number' ? { duration: att.duration } : {}),
      ...(att.durationFormatted ? { durationFormatted: att.durationFormatted } : {}),
      ...(att.resolution ? { resolution: att.resolution } : {}),
    };
  });

  const primaryMedia = cleanAttachments.length > 0 ? cleanAttachments[0] : null;

  const rawPostPayload: Record<string, any> = {
    id: postId,
    authorId: currentAuthUser.uid,
    authorName: currentUser.name || currentAuthUser.displayName || 'IT LABS Member',
    authorPhoto: currentUser.avatar || currentAuthUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'Member')}&background=2563eb&color=fff`,
    authorRole: currentUser.role || 'student',
    authorInstitution: currentUser.institution || 'Tech Academy',
    authorUsername: currentUser.username || 'member',
    authorVerified: !!currentUser.isVerified,
    title: input.title.trim(),
    description: input.description.trim(),
    category: input.subject || 'Web Development',
    difficulty: input.difficulty || 'Intermediate',
    tags: cleanTags,
    resourceUrl: input.resourceUrl?.trim() || null,
    resourceTitle: input.resourceTitle?.trim() || null,
    resourceType: input.resourceType || 'notes',
    codeSnippet: cleanCodeSnippet,
    media: primaryMedia,
    attachments: cleanAttachments,
    // Top-level schema fields for querying and indexing
    resourceId: primaryMedia?.attachmentId || null,
    originalFileName: primaryMedia?.originalFileName || null,
    fileSize: primaryMedia?.fileSize || null,
    mimeType: primaryMedia?.mimeType || null,
    storageProvider: primaryMedia?.storageProvider || null,
    permanentFileUrl: primaryMedia?.permanentFileUrl || null,
    duration: typeof primaryMedia?.duration === 'number' ? primaryMedia.duration : null,
    resolution: primaryMedia?.resolution || null,
    likesCount: 0,
    commentsCount: 0,
    savesCount: 0,
    createdAt: serverTimestamp(),
    updatedAt: serverTimestamp(),
    createdAtIso: nowIso,
  };

  // Safe recursive Firestore data cleaning removes any undefined values
  const postPayload = cleanFirestoreData(rawPostPayload);

  // Perform Firestore write
  try {
    await setDoc(postDocRef, postPayload);
  } catch (error) {
    handleFirestoreError(error, OperationType.CREATE, `posts/${postId}`);
  }

  // Return the client representation of the newly created post
  const newPost: Post = {
    id: postId,
    authorId: currentAuthUser.uid,
    author: {
      id: currentAuthUser.uid,
      name: postPayload.authorName,
      username: postPayload.authorUsername,
      avatar: postPayload.authorPhoto,
      role: postPayload.authorRole,
      title: currentUser.title || (currentUser.role === 'teacher_expert' ? 'Verified Tech Specialist' : 'Computer Science Scholar'),
      institution: postPayload.authorInstitution,
      bio: currentUser.bio || '',
      expertise: currentUser.expertise || [input.subject],
      followersCount: currentUser.followersCount || 0,
      followingCount: currentUser.followingCount || 0,
      isVerified: postPayload.authorVerified,
      isFollowing: false,
    },
    title: postPayload.title,
    content: postPayload.description,
    subject: postPayload.category,
    difficulty: postPayload.difficulty,
    tags: postPayload.tags,
    resourceUrl: postPayload.resourceUrl || undefined,
    resourceTitle: postPayload.resourceTitle || undefined,
    resourceType: postPayload.resourceType,
    codeSnippet: postPayload.codeSnippet || undefined,
    media: primaryMedia || undefined,
    attachments: cleanAttachments,
    likesCount: 0,
    isLiked: false,
    commentsCount: 0,
    savesCount: 0,
    isSaved: false,
    sharesCount: 0,
    createdAt: 'Just now',
    comments: [],
    isFeatured: false,
  };

  return newPost;
}

export function parsePostMedia(data: any): MediaAttachment | undefined {
  if (!data.media && !data.permanentFileUrl) return undefined;
  const m = data.media || {};
  const url = m.url || data.permanentFileUrl;
  if (!url) return undefined;

  const originalName = m.originalName || m.originalFileName || data.originalFileName || m.name || 'educational_file';
  const size = typeof m.size === 'number' ? m.size : (typeof data.fileSize === 'number' ? data.fileSize : 0);
  const sizeFormatted = m.sizeFormatted || formatFileSize(size);
  const extension = m.extension || originalName.split('.').pop()?.toLowerCase() || 'bin';

  let category = m.category;
  if (!category) {
    if (['mp4', 'webm', 'mov'].includes(extension) || (data.mimeType && data.mimeType.includes('video'))) category = 'video';
    else if (extension === 'pdf' || (data.mimeType && data.mimeType.includes('pdf'))) category = 'pdf';
    else if (['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(extension)) category = 'image';
    else category = 'code';
  }

  const id = m.attachmentId || m.id || data.resourceId || 'media-' + Math.random().toString(36).substring(2, 7);
  const fileName = m.fileName || m.name || originalName;
  const permanentUrl = m.permanentFileUrl || data.permanentFileUrl || url;

  return {
    attachmentId: id,
    fileName,
    originalFileName: originalName,
    fileType: (category === 'pdf' ? 'pdf' : category) as any,
    fileSize: size,
    sizeFormatted,
    permanentFileUrl: permanentUrl,
    storageProvider: m.storageProvider || data.storageProvider || 'IT LABS Server Storage',
    uploadedAt: m.uploadedAt || 'Recently',
    id,
    resourceId: id,
    name: fileName,
    originalName,
    extension,
    mimeType: m.mimeType || data.mimeType || (category === 'pdf' ? 'application/pdf' : `application/${extension}`),
    category,
    size,
    cloudinaryPublicId: m.cloudinaryPublicId || data.cloudinaryPublicId,
    cloudinaryResourceType: m.cloudinaryResourceType || data.cloudinaryResourceType,
    format: m.format || data.format,
    url: permanentUrl,
    downloadUrl: m.downloadUrl || permanentUrl,
    thumbnailUrl: m.thumbnailUrl || data.thumbnailUrl,
    codeContent: m.codeContent,
    duration: typeof m.duration === 'number' ? m.duration : data.duration,
    durationFormatted: m.durationFormatted || (typeof data.duration === 'number' ? `${Math.floor(data.duration / 60)}:${(data.duration % 60).toString().padStart(2, '0')}` : undefined),
    resolution: m.resolution || data.resolution,
  };
}

export function parsePostAttachments(data: any): PostAttachment[] {
  if (Array.isArray(data.attachments) && data.attachments.length > 0) {
    return data.attachments.map((att: any, idx: number) => {
      const originalFileName = att.originalFileName || att.originalName || att.name || `attachment_${idx + 1}`;
      const fileName = att.fileName || att.name || originalFileName;
      const fileType = att.fileType || (att.category === 'pdf' ? 'pdf' : att.category === 'video' ? 'video' : att.category === 'image' ? 'image' : 'code');
      const size = typeof att.fileSize === 'number' ? att.fileSize : (typeof att.size === 'number' ? att.size : 0);
      const sizeFormatted = att.sizeFormatted || formatFileSize(size);
      const permanentFileUrl = att.permanentFileUrl || att.url || '';
      const extension = att.extension || originalFileName.split('.').pop()?.toLowerCase() || '';
      const id = att.attachmentId || att.id || `att_${idx}_${Date.now()}`;

      return {
        attachmentId: id,
        fileName,
        originalFileName,
        fileType,
        mimeType: att.mimeType || (fileType === 'pdf' ? 'application/pdf' : `application/${extension || 'octet-stream'}`),
        fileSize: size,
        permanentFileUrl,
        storageProvider: att.storageProvider || 'Cloudinary Cloud Storage',
        uploadedAt: att.uploadedAt || 'Recently',
        id,
        resourceId: id,
        name: fileName,
        originalName: originalFileName,
        category: (fileType === 'document' ? 'pdf' : fileType) as any,
        extension,
        size,
        sizeFormatted,
        cloudinaryPublicId: att.cloudinaryPublicId,
        cloudinaryResourceType: att.cloudinaryResourceType,
        format: att.format,
        url: permanentFileUrl,
        downloadUrl: att.downloadUrl || permanentFileUrl,
        thumbnailUrl: att.thumbnailUrl,
        codeContent: att.codeContent,
        duration: typeof att.duration === 'number' ? att.duration : undefined,
        durationFormatted: att.durationFormatted || (typeof att.duration === 'number' ? `${Math.floor(att.duration / 60)}:${(att.duration % 60).toString().padStart(2, '0')}` : undefined),
        resolution: att.resolution,
      };
    });
  }

  const single = parsePostMedia(data);
  return single ? [single] : [];
}

/**
 * Fetch all published educational posts from Cloud Firestore
 */
export async function fetchPostsFromFirestore(currentUserId?: string): Promise<Post[]> {
  const postsCollection = collection(db, 'posts');
  let snapshot;

  try {
    const q = query(postsCollection, orderBy('createdAt', 'desc'));
    snapshot = await getDocs(q);
  } catch (err) {
    // If index or serverTimestamp is syncing, fallback to un-ordered fetch
    console.warn('Falling back to unordered fetch:', err);
    snapshot = await getDocs(postsCollection);
  }

  // Fetch user's liked post IDs if signed in
  const likedPostIds = new Set<string>();
  if (currentUserId) {
    try {
      // Check likes across fetched posts
      const likeChecks = snapshot.docs.map(async (d) => {
        const likeDocRef = doc(db, 'posts', d.id, 'likes', currentUserId);
        const likeSnap = await getDoc(likeDocRef);
        if (likeSnap.exists()) {
          likedPostIds.add(d.id);
        }
      });
      await Promise.all(likeChecks);
    } catch (likeErr) {
      console.warn('Could not batch check user likes:', likeErr);
    }
  }

  const posts: Post[] = [];

  for (const docSnap of snapshot.docs) {
    const data = docSnap.data();
    
    // Fetch top comments for each post
    let comments: Comment[] = [];
    try {
      const commentsSnap = await getDocs(
        query(collection(db, 'posts', docSnap.id, 'comments'), orderBy('createdAt', 'asc'))
      );
      comments = commentsSnap.docs.map((cDoc) => {
        const cData = cDoc.data();
        return {
          id: cDoc.id,
          postId: docSnap.id,
          authorId: cData.authorId || 'unknown',
          author: {
            id: cData.authorId || 'unknown',
            name: cData.authorName || 'Member',
            username: cData.authorUsername || 'member',
            avatar: cData.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(cData.authorName || 'Member')}&background=2563eb&color=fff`,
            role: cData.authorRole || 'student',
            title: cData.authorRole === 'teacher_expert' ? 'Verified Instructor' : 'Computer Science Scholar',
            institution: cData.authorInstitution || 'Tech Academy',
            bio: '',
            expertise: [],
            followersCount: 0,
            followingCount: 0,
            isVerified: cData.authorRole === 'teacher_expert',
          },
          content: cData.content || cData.text || '',
          createdAt: formatTimestamp(cData.createdAt),
          likes: cData.likes || 0,
        };
      });
    } catch (cErr) {
      // No comments or subcollection not indexed
    }

    const attachments = parsePostAttachments(data);
    const media = attachments.length > 0 ? attachments[0] : undefined;

    posts.push({
      id: docSnap.id,
      authorId: data.authorId,
      author: {
        id: data.authorId,
        name: data.authorName || 'Community Member',
        username: data.authorUsername || 'member',
        avatar: data.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.authorName || 'Member')}&background=2563eb&color=fff`,
        role: data.authorRole || 'student',
        title: data.authorRole === 'teacher_expert' ? 'Verified Tech Specialist' : 'Computer Science Scholar',
        institution: data.authorInstitution || 'Tech Academy',
        bio: '',
        expertise: data.category ? [data.category] : ['Web Development'],
        followersCount: 1,
        followingCount: 1,
        isVerified: !!data.authorVerified,
        isFollowing: false,
      },
      title: data.title || 'Untitled Post',
      content: data.description || '',
      subject: (data.category as SubjectCategory) || 'Web Development',
      difficulty: (data.difficulty as DifficultyLevel) || 'Intermediate',
      tags: data.tags || [],
      resourceUrl: data.resourceUrl || undefined,
      resourceTitle: data.resourceTitle || undefined,
      resourceType: data.resourceType || 'notes',
      codeSnippet: data.codeSnippet || undefined,
      media,
      attachments,
      likesCount: typeof data.likesCount === 'number' ? data.likesCount : 0,
      isLiked: likedPostIds.has(docSnap.id),
      commentsCount: typeof data.commentsCount === 'number' ? Math.max(0, data.commentsCount) : comments.length,
      savesCount: typeof data.savesCount === 'number' ? Math.max(0, data.savesCount) : 0,
      isSaved: false,
      sharesCount: 0,
      createdAt: formatTimestamp(data.createdAt || data.createdAtIso),
      comments,
      isFeatured: !!data.isFeatured,
    });
  }

  // Ensure newest posts first
  return posts.sort((a, b) => {
    return 0;
  });
}

/**
 * Subscribe to real-time posts from Cloud Firestore
 */
export function subscribeToFeedPosts(
  currentUserId: string | undefined,
  onPosts: (posts: Post[]) => void,
  onError: (error: Error) => void
) {
  const postsCollection = collection(db, 'posts');
  let q;
  try {
    q = query(postsCollection, orderBy('createdAt', 'desc'));
  } catch (err) {
    q = postsCollection;
  }

  return onSnapshot(
    q,
    async (snapshot) => {
      // Check user likes
      const likedPostIds = new Set<string>();
      if (currentUserId) {
        try {
          const checks = snapshot.docs.map(async (d) => {
            const likeDocRef = doc(db, 'posts', d.id, 'likes', currentUserId);
            const likeSnap = await getDoc(likeDocRef);
            if (likeSnap.exists()) likedPostIds.add(d.id);
          });
          await Promise.all(checks);
        } catch (e) {
          // ignore
        }
      }

      const posts: Post[] = snapshot.docs.map((docSnap) => {
        const data = docSnap.data();
        const attachments = parsePostAttachments(data);
        const media = attachments.length > 0 ? attachments[0] : undefined;

        return {
          id: docSnap.id,
          authorId: data.authorId,
          author: {
            id: data.authorId,
            name: data.authorName || 'Community Member',
            username: data.authorUsername || 'member',
            avatar: data.authorPhoto || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.authorName || 'Member')}&background=2563eb&color=fff`,
            role: data.authorRole || 'student',
            title: data.authorRole === 'teacher_expert' ? 'Verified Tech Specialist' : 'Computer Science Scholar',
            institution: data.authorInstitution || 'Tech Academy',
            bio: '',
            expertise: data.category ? [data.category] : ['Web Development'],
            followersCount: 1,
            followingCount: 1,
            isVerified: !!data.authorVerified,
            isFollowing: false,
          },
          title: data.title || 'Untitled Post',
          content: data.description || '',
          subject: (data.category as SubjectCategory) || 'Web Development',
          difficulty: (data.difficulty as DifficultyLevel) || 'Intermediate',
          tags: data.tags || [],
          resourceUrl: data.resourceUrl || undefined,
          resourceTitle: data.resourceTitle || undefined,
          resourceType: data.resourceType || 'notes',
          codeSnippet: data.codeSnippet || undefined,
          media,
          attachments,
          likesCount: typeof data.likesCount === 'number' ? data.likesCount : 0,
          isLiked: likedPostIds.has(docSnap.id),
          commentsCount: typeof data.commentsCount === 'number' ? data.commentsCount : 0,
          savesCount: typeof data.savesCount === 'number' ? data.savesCount : 0,
          isSaved: false,
          sharesCount: 0,
          createdAt: formatTimestamp(data.createdAt || data.createdAtIso),
          comments: [],
          isFeatured: !!data.isFeatured,
        };
      });

      onPosts(posts);
    },
    (error) => {
      console.warn('Real-time feed listener warning:', error);
      onError(error);
    }
  );
}

/**
 * Toggle like for a post in Cloud Firestore using an atomic transaction.
 * Creates / deletes /posts/{postId}/likes/{userId} and updates likesCount with zero-bound protection.
 */
export async function toggleLikeInFirestore(
  postId: string,
  currentUserId: string,
  _currentlyLiked?: boolean
): Promise<{ nextLiked: boolean; newLikesCount: number }> {
  if (!currentUserId) {
    throw new Error('Please sign in to like educational posts.');
  }

  const postDocRef = doc(db, 'posts', postId);
  const likeDocRef = doc(db, 'posts', postId, 'likes', currentUserId);

  try {
    const result = await runTransaction(db, async (transaction) => {
      const postSnap = await transaction.get(postDocRef);
      if (!postSnap.exists()) {
        throw new Error('Educational post not found in Firestore.');
      }

      const likeSnap = await transaction.get(likeDocRef);
      const isCurrentlyLiked = likeSnap.exists();
      const currentCount = typeof postSnap.data()?.likesCount === 'number' ? postSnap.data().likesCount : 0;

      if (isCurrentlyLiked) {
        // User is unliking
        const nextCount = Math.max(0, currentCount - 1);
        transaction.delete(likeDocRef);
        transaction.update(postDocRef, {
          likesCount: nextCount,
          updatedAt: serverTimestamp(),
        });
        return { nextLiked: false, newLikesCount: nextCount };
      } else {
        // User is liking
        const nextCount = currentCount + 1;
        transaction.set(likeDocRef, {
          userId: currentUserId,
          likedAt: serverTimestamp(),
        });
        transaction.update(postDocRef, {
          likesCount: nextCount,
          updatedAt: serverTimestamp(),
        });
        return { nextLiked: true, newLikesCount: nextCount };
      }
    });

    return result;
  } catch (err: any) {
    handleFirestoreError(err, OperationType.WRITE, `posts/${postId}/likes/${currentUserId}`);
    throw err;
  }
}

/**
 * Add a comment to an educational post in Cloud Firestore
 */
export async function addCommentInFirestore(
  postId: string,
  text: string,
  currentUser: User
): Promise<Comment> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('Please sign in to comment on educational posts.');
  }

  if (!text.trim()) {
    throw new Error('Comment cannot be empty.');
  }

  const commentsColRef = collection(db, 'posts', postId, 'comments');
  const commentDocRef = doc(commentsColRef);
  const commentId = commentDocRef.id;

  const commentPayload = cleanFirestoreData({
    id: commentId,
    postId,
    authorId: currentAuthUser.uid,
    authorName: currentUser.name || currentAuthUser.displayName || 'Member',
    authorPhoto: currentUser.avatar || currentAuthUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(currentUser.name || 'Member')}&background=2563eb&color=fff`,
    authorRole: currentUser.role || 'student',
    authorInstitution: currentUser.institution || 'Tech Academy',
    authorUsername: currentUser.username || 'member',
    content: text.trim(),
    likes: 0,
    createdAt: serverTimestamp(),
  });

  // 1. Write the comment document
  try {
    await setDoc(commentDocRef, commentPayload);
  } catch (err) {
    handleFirestoreError(err, OperationType.CREATE, `posts/${postId}/comments/${commentId}`);
  }

  // 2. Increment comment count on the parent post
  const postDocRef = doc(db, 'posts', postId);
  try {
    await updateDoc(postDocRef, {
      commentsCount: increment(1),
      updatedAt: serverTimestamp(),
    });
  } catch (err) {
    console.warn('Could not increment post commentsCount:', err);
  }

  return {
    id: commentId,
    postId,
    authorId: currentAuthUser.uid,
    author: {
      id: currentAuthUser.uid,
      name: commentPayload.authorName,
      username: commentPayload.authorUsername,
      avatar: commentPayload.authorPhoto,
      role: commentPayload.authorRole as any,
      title: currentUser.title || (currentUser.role === 'teacher_expert' ? 'Verified Instructor' : 'Computer Science Scholar'),
      institution: commentPayload.authorInstitution,
      bio: '',
      expertise: [],
      followersCount: 0,
      followingCount: 0,
      isVerified: currentUser.role === 'teacher_expert',
    },
    content: commentPayload.content,
    createdAt: 'Just now',
    likes: 0,
    isLiked: false,
  };
}

/**
 * Delete a comment from an educational post in Cloud Firestore (Author or Admin only).
 * Uses an atomic writeBatch to remove the comment document and decrement the parent post's commentsCount.
 */
export async function deleteCommentInFirestore(
  postId: string,
  commentId: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('Please sign in to manage comments.');
  }

  const commentDocRef = doc(db, 'posts', postId, 'comments', commentId);
  const postDocRef = doc(db, 'posts', postId);

  // 1. Verify comment existence & ownership
  const commentSnap = await getDoc(commentDocRef);
  if (!commentSnap.exists()) {
    return; // Already deleted
  }

  const commentData = commentSnap.data();
  const commentAuthorUid = commentData?.authorId;
  const isAuthor = Boolean(commentAuthorUid && commentAuthorUid === currentAuthUser.uid);
  const isAdmin = Boolean(currentAuthUser.email && currentAuthUser.email.toLowerCase() === 'ecode2544@gmail.com');

  if (!isAuthor && !isAdmin) {
    throw new Error('Permission denied: You can only delete your own comments.');
  }

  // 2. Safely read parent post to prevent negative commentsCount
  let currentCount = 0;
  let postExists = false;
  try {
    const postSnap = await getDoc(postDocRef);
    if (postSnap.exists()) {
      postExists = true;
      const countVal = postSnap.data()?.commentsCount;
      currentCount = typeof countVal === 'number' ? countVal : 0;
    }
  } catch (pErr) {
    console.warn('Could not read post before comment deletion:', pErr);
  }

  const newCount = Math.max(0, currentCount - 1);

  // 3. Atomic writeBatch: delete comment and safely update post commentsCount
  const batch = writeBatch(db);
  batch.delete(commentDocRef);
  if (postExists) {
    batch.update(postDocRef, {
      commentsCount: newCount,
      updatedAt: serverTimestamp(),
    });
  }

  try {
    await batch.commit();
  } catch (err: any) {
    handleFirestoreError(err, OperationType.DELETE, `posts/${postId}/comments/${commentId}`);
  }
}

/**
 * Delete a post from Cloud Firestore (Owner or Admin only)
 */
export async function deletePostInFirestore(
  postId: string,
  currentUserId: string,
  isAdmin: boolean = false
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('You must be signed in to delete posts.');
  }

  const postDocRef = doc(db, 'posts', postId);
  let snap;
  try {
    snap = await getDoc(postDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `posts/${postId}`);
  }

  if (!snap || !snap.exists()) {
    // If not found in Firestore (e.g. demo local mock post), return cleanly
    return;
  }

  const data = snap.data();
  const isAuthor = data.authorId === currentUserId || data.authorId === currentAuthUser.uid;

  if (!isAuthor && !isAdmin) {
    throw new Error('Permission denied: You can only delete your own educational posts.');
  }

  // Collect all associated stored files and Cloudinary public IDs for safe cleanup
  const filesToDelete: string[] = [];
  const publicIdsToDelete: string[] = [];

  if (Array.isArray(data.attachments)) {
    for (const att of data.attachments) {
      if (att.cloudinaryPublicId) publicIdsToDelete.push(att.cloudinaryPublicId);
      if (att.fileName) filesToDelete.push(att.fileName);
      if (att.permanentFileUrl) filesToDelete.push(att.permanentFileUrl);
      if (att.url) filesToDelete.push(att.url);
    }
  }
  if (data.media?.cloudinaryPublicId) publicIdsToDelete.push(data.media.cloudinaryPublicId);
  if (data.media?.fileName) filesToDelete.push(data.media.fileName);
  if (data.media?.permanentFileUrl) filesToDelete.push(data.media.permanentFileUrl);
  if (data.media?.url) filesToDelete.push(data.media.url);
  if (data.permanentFileUrl) filesToDelete.push(data.permanentFileUrl);

  if (filesToDelete.length > 0 || publicIdsToDelete.length > 0) {
    try {
      await deleteMediaFromServer(filesToDelete, publicIdsToDelete);
    } catch (storageErr) {
      console.warn('Non-blocking storage file deletion warning:', storageErr);
    }
  }

  try {
    // Try to clean up subcollection comments in a batch if permissions allow
    const commentsSnap = await getDocs(collection(db, 'posts', postId, 'comments'));
    if (!commentsSnap.empty) {
      const batch = writeBatch(db);
      commentsSnap.docs.forEach((cDoc) => batch.delete(cDoc.ref));
      batch.delete(postDocRef);
      await batch.commit();
      return;
    }
  } catch {
    // Fall back to deleting postDoc directly if batch or subcollection read encounters rule restrictions
  }

  try {
    await deleteDoc(postDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.DELETE, `posts/${postId}`);
  }
}

/**
 * Delete a single attachment from an educational post in Firestore and clean up its stored file on the server
 */
export async function deleteSingleAttachmentFromPost(
  postId: string,
  attachmentId: string,
  currentUserId: string,
  userEmail?: string,
  isAdmin: boolean = false
): Promise<{ updatedAttachments: PostAttachment[]; updatedMedia?: MediaAttachment }> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('You must be signed in to delete attachments.');
  }

  const postDocRef = doc(db, 'posts', postId);
  let snap;
  try {
    snap = await getDoc(postDocRef);
  } catch (err) {
    handleFirestoreError(err, OperationType.GET, `posts/${postId}`);
  }

  let currentAttachments: PostAttachment[] = [];
  let authorId = currentUserId;

  if (snap && snap.exists()) {
    const data = snap.data();
    authorId = data.authorId;
    const isAuthor = authorId === currentUserId || authorId === currentAuthUser.uid;
    if (!isAuthor && !isAdmin) {
      throw new Error('Permission denied: You can only delete attachments from your own posts.');
    }
    currentAttachments = parsePostAttachments(data);
  }

  // Identify target attachment
  const targetAttachment = currentAttachments.find(
    (att) => att.attachmentId === attachmentId || att.id === attachmentId || att.fileName === attachmentId
  );

  // Requirement 5: Delete only its corresponding stored file through an authorized server operation
  if (targetAttachment) {
    const fileName = targetAttachment.fileName || (targetAttachment.url ? targetAttachment.url.split('/uploads/').pop() : undefined);
    try {
      await deleteAttachmentFromServer({
        postId,
        attachmentId: targetAttachment.attachmentId || targetAttachment.id || attachmentId,
        fileName,
        fileUrl: targetAttachment.permanentFileUrl || targetAttachment.url,
        cloudinaryPublicId: targetAttachment.cloudinaryPublicId,
        cloudinaryResourceType: targetAttachment.cloudinaryResourceType,
        userId: currentAuthUser.uid,
        userEmail: currentAuthUser.email || userEmail,
      });
    } catch (storageErr) {
      console.warn('Server attachment file deletion warning:', storageErr);
    }
  }

  // Requirement 4 & 6: Remove only selected attachment; preserve the post and all remaining attachments
  const remainingAttachments = currentAttachments.filter(
    (att) => att.attachmentId !== attachmentId && att.id !== attachmentId && att.fileName !== attachmentId
  );

  const updatedMedia = remainingAttachments.length > 0 ? remainingAttachments[0] : null;

  if (snap && snap.exists()) {
    try {
      const updatePayload: Record<string, any> = {
        attachments: remainingAttachments,
        media: updatedMedia,
        updatedAt: serverTimestamp(),
      };

      if (remainingAttachments.length === 0) {
        updatePayload.resourceId = null;
        updatePayload.originalFileName = null;
        updatePayload.permanentFileUrl = null;
      } else {
        updatePayload.resourceId = updatedMedia?.attachmentId || null;
        updatePayload.originalFileName = updatedMedia?.originalFileName || null;
        updatePayload.permanentFileUrl = updatedMedia?.permanentFileUrl || null;
      }

      await updateDoc(postDocRef, cleanFirestoreData(updatePayload));
    } catch (err) {
      handleFirestoreError(err, OperationType.UPDATE, `posts/${postId}`);
    }
  }

  return {
    updatedAttachments: remainingAttachments,
    updatedMedia: updatedMedia || undefined,
  };
}

export interface PostSearchFilters {
  query?: string;
  resourceType?: 'all' | 'pdf' | 'video' | 'image' | 'code' | ResourceType;
  subject?: SubjectCategory | 'All';
  difficulty?: DifficultyLevel | 'All';
  creatorName?: string;
}

export interface SearchAttachmentResult {
  attachment: PostAttachment;
  parentPost: Post;
}

/**
 * Searches posts in Cloud Firestore and performs client tokenized matching
 * across post fields, code snippets, creator profiles, subjects, difficulty, and attachments.
 * Ensures zero-cost operation without paid search APIs.
 */
export async function searchPostsInFirestore(
  filters: PostSearchFilters,
  currentUserId?: string
): Promise<Post[]> {
  const allPosts = await fetchPostsFromFirestore(currentUserId);
  return filterPostsLocally(allPosts, filters);
}

/**
 * Filter posts in-memory using multi-token and multi-criteria matching
 */
export function filterPostsLocally(posts: Post[], filters: PostSearchFilters): Post[] {
  const q = (filters.query || '').trim().toLowerCase();
  const searchTokens = q ? q.split(/\s+/).filter(Boolean) : [];
  const reqSubject = filters.subject && filters.subject !== 'All' ? filters.subject : null;
  const reqDifficulty = filters.difficulty && filters.difficulty !== 'All' ? filters.difficulty : null;
  const reqType = filters.resourceType && filters.resourceType !== 'all' ? filters.resourceType.toLowerCase() : null;
  const reqCreator = (filters.creatorName || '').trim().toLowerCase();

  return posts.filter((post) => {
    // Subject filter
    if (reqSubject && post.subject !== reqSubject) {
      return false;
    }

    // Difficulty filter
    if (reqDifficulty && post.difficulty !== reqDifficulty) {
      return false;
    }

    // Creator name filter
    if (reqCreator) {
      const authorName = (post.author?.name || '').toLowerCase();
      const authorUsername = (post.author?.username || '').toLowerCase();
      if (!authorName.includes(reqCreator) && !authorUsername.includes(reqCreator)) {
        return false;
      }
    }

    // Resource type filter (PDF, Video, Image, Code)
    if (reqType) {
      const hasMatchingAttachment = post.attachments?.some(
        (att) => (att.fileType && att.fileType.toLowerCase() === reqType) || att.mimeType?.toLowerCase().includes(reqType)
      );
      const hasMatchingMedia =
        post.media?.category?.toLowerCase() === reqType ||
        post.media?.mimeType?.toLowerCase().includes(reqType) ||
        (reqType === 'pdf' && post.media?.extension === 'pdf') ||
        (reqType === 'video' && ['mp4', 'webm', 'mov'].includes(post.media?.extension || '')) ||
        (reqType === 'image' && ['jpg', 'jpeg', 'png', 'webp', 'gif'].includes(post.media?.extension || '')) ||
        (reqType === 'code' && ['py', 'java', 'c', 'cpp', 'js', 'ts', 'html', 'css', 'txt'].includes(post.media?.extension || ''));

      const hasMatchingCodeSnippet = reqType === 'code' && !!post.codeSnippet;
      const hasMatchingResourceType = post.resourceType?.toLowerCase() === reqType;

      if (!hasMatchingAttachment && !hasMatchingMedia && !hasMatchingCodeSnippet && !hasMatchingResourceType) {
        return false;
      }
    }

    // Query tokens matching (title, description, tags, subject, author, attachments, code snippet)
    if (searchTokens.length > 0) {
      const searchableCorpus = [
        post.title || '',
        post.content || '',
        post.subject || '',
        post.difficulty || '',
        post.author?.name || '',
        post.author?.username || '',
        post.author?.institution || '',
        post.resourceTitle || '',
        post.resourceType || '',
        ...(post.tags || []),
        post.codeSnippet?.language || '',
        post.codeSnippet?.code || '',
        ...(post.attachments || []).flatMap((att) => [att.fileName, att.originalFileName, att.fileType, att.storageProvider]),
        post.media?.originalName || '',
        post.media?.name || '',
      ]
        .join(' ')
        .toLowerCase();

      // All tokens should match (AND matching across tokens for precise multi-word searches)
      const matchesAllTokens = searchTokens.every((token) => searchableCorpus.includes(token));
      if (!matchesAllTokens) return false;
    }

    return true;
  });
}

/**
 * Extracts and deduplicates individual attachment items from matching posts for rich resource discovery
 */
export function extractAttachmentsFromPosts(posts: Post[], resourceTypeFilter?: string): SearchAttachmentResult[] {
  const results: SearchAttachmentResult[] = [];
  const seenUrls = new Set<string>();

  for (const post of posts) {
    if (!post.attachments || post.attachments.length === 0) continue;

    for (const att of post.attachments) {
      const url = att.permanentFileUrl || att.url || '';
      const key = `${att.attachmentId || att.id}_${url}`;
      if (seenUrls.has(key)) continue;

      if (resourceTypeFilter && resourceTypeFilter !== 'all') {
        const filterLower = resourceTypeFilter.toLowerCase();
        const matches = (att.fileType && att.fileType.toLowerCase() === filterLower) || att.mimeType?.toLowerCase().includes(filterLower);
        if (!matches) continue;
      }

      seenUrls.add(key);
      results.push({
        attachment: att,
        parentPost: post,
      });
    }
  }

  return results;
}


