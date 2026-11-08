import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  updateDoc,
  deleteDoc,
  query,
  where,
  orderBy,
  serverTimestamp,
  writeBatch,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { User, Post, PostReport, UserRole } from '../types';
import { cleanFirestoreData } from '../utils/firestoreSanitizer';
import { deletePostInFirestore } from './postService';

/**
 * Primary administrator email recognized by default in security rules.
 */
export const PRIMARY_ADMIN_EMAIL = 'ecode2544@gmail.com';

/**
 * Check whether a given user holds verified administrator privileges.
 * Security: Never trusts client-side storage or user-editable flags.
 * Checks Firestore /admins/{uid} collection or verified server auth email.
 */
export async function verifyAdminStatus(user: User | null): Promise<boolean> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) return false;

  // 1. Primary super admin email check
  if (currentAuthUser.email && currentAuthUser.email.toLowerCase() === PRIMARY_ADMIN_EMAIL.toLowerCase()) {
    return true;
  }

  // 2. Query trusted /admins/{uid} collection in Cloud Firestore
  try {
    const adminDocRef = doc(db, 'admins', currentAuthUser.uid);
    const snap = await getDoc(adminDocRef);
    if (snap.exists()) {
      return true;
    }
  } catch (err) {
    // If permission denied or document doesn't exist, user is not admin
    console.warn('[Admin Verification] Not recognized in /admins:', err);
  }

  return false;
}

/**
 * Live platform metric counters for Admin Dashboard.
 */
export interface PlatformMetrics {
  totalUsers: number;
  totalPosts: number;
  verifiedEducators: number;
  pendingReports: number;
  totalImages: number;
  totalVideos: number;
  totalPdfs: number;
  totalCodeFiles: number;
}

/**
 * Calculate live platform metrics from Cloud Firestore collections.
 */
export async function fetchPlatformMetrics(
  users: User[],
  posts: Post[],
  reports: PostReport[]
): Promise<PlatformMetrics> {
  let imagesCount = 0;
  let videosCount = 0;
  let pdfsCount = 0;
  let codeFilesCount = 0;

  posts.forEach((p) => {
    if (Array.isArray(p.attachments)) {
      p.attachments.forEach((att) => {
        const type = att.fileType || att.category;
        if (type === 'image') imagesCount++;
        else if (type === 'video') videosCount++;
        else if (type === 'pdf') pdfsCount++;
        else if (type === 'code') codeFilesCount++;
      });
    } else if (p.media) {
      const type = p.media.fileType || p.media.category;
      if (type === 'image') imagesCount++;
      else if (type === 'video') videosCount++;
      else if (type === 'pdf') pdfsCount++;
      else if (type === 'code') codeFilesCount++;
    }
  });

  return {
    totalUsers: users.length,
    totalPosts: posts.length,
    verifiedEducators: users.filter((u) => u.isVerified).length,
    pendingReports: reports.filter((r) => r.status === 'pending').length,
    totalImages: imagesCount,
    totalVideos: videosCount,
    totalPdfs: pdfsCount,
    totalCodeFiles: codeFilesCount,
  };
}

/**
 * Toggle Educator Verification status in Cloud Firestore.
 * Persists isVerified to /users/{userId} directly.
 */
export async function toggleUserVerificationInFirestore(
  userId: string,
  currentStatus: boolean
): Promise<boolean> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('You must be signed in as an administrator to manage educator badges.');
  }

  const nextStatus = !currentStatus;
  const userDocRef = doc(db, 'users', userId);

  await updateDoc(userDocRef, {
    isVerified: nextStatus,
    updatedAt: serverTimestamp(),
  });

  return nextStatus;
}

/**
 * Update user role (e.g. promoting to teacher_expert or resetting to student).
 */
export async function updateUserRoleInFirestore(
  userId: string,
  newRole: UserRole,
  title?: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('You must be signed in as an administrator.');
  }

  const userDocRef = doc(db, 'users', userId);
  const updates: any = {
    role: newRole,
    updatedAt: serverTimestamp(),
  };
  if (title) updates.title = title;

  await updateDoc(userDocRef, updates);
}

/**
 * Delete a user profile from Cloud Firestore (Administrator privilege).
 */
export async function deleteUserInFirestore(userId: string): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('You must be signed in as an administrator.');
  }

  const userDocRef = doc(db, 'users', userId);
  await deleteDoc(userDocRef);
}

/**
 * Toggle Featured status for an educational post in Cloud Firestore.
 */
export async function toggleFeaturedPostInFirestore(
  postId: string,
  currentStatus: boolean
): Promise<boolean> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('You must be signed in as an administrator.');
  }

  const nextStatus = !currentStatus;
  const postDocRef = doc(db, 'posts', postId);

  await updateDoc(postDocRef, {
    isFeatured: nextStatus,
    updatedAt: serverTimestamp(),
  });

  return nextStatus;
}

/**
 * Delete post as administrator.
 */
export async function deletePostAsAdmin(postId: string): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('You must be signed in as an administrator.');
  }

  await deletePostInFirestore(postId, currentAuthUser.uid, true);
}

/**
 * Submit a community content report to Cloud Firestore.
 * Callable by any signed-in student or educator.
 */
export async function submitPostReportToFirestore(
  postId: string,
  reason: string,
  reporter: User,
  postTitle?: string
): Promise<PostReport> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('Please sign in to report educational content.');
  }

  if (!reason.trim()) {
    throw new Error('Please provide a reason for reporting this post.');
  }

  const reportId = `report_${postId}_${currentAuthUser.uid}`;
  const reportDocRef = doc(db, 'reports', reportId);

  const newReport: PostReport = {
    id: reportId,
    postId,
    reportedBy: reporter.username || currentAuthUser.displayName || 'member',
    reason: reason.trim(),
    timestamp: 'Just now',
    status: 'pending',
  };

  await setDoc(
    reportDocRef,
    cleanFirestoreData({
      id: reportId,
      postId,
      postTitle: postTitle || '',
      reporterId: currentAuthUser.uid,
      reportedBy: newReport.reportedBy,
      reason: newReport.reason,
      status: 'pending',
      createdAt: serverTimestamp(),
    })
  );

  return newReport;
}

/**
 * Subscribe to real-time moderation reports from Cloud Firestore (Admin only).
 */
export function subscribeToReportsFromFirestore(
  onUpdate: (reports: PostReport[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  const reportsCol = collection(db, 'reports');
  let q;
  try {
    q = query(reportsCol, orderBy('createdAt', 'desc'));
  } catch {
    q = reportsCol;
  }

  return onSnapshot(
    q,
    (snapshot) => {
      const reports: PostReport[] = snapshot.docs.map((d) => {
        const data = d.data();
        let formattedTime = 'Recently';
        if (data.createdAt?.toDate) {
          formattedTime = data.createdAt.toDate().toLocaleDateString('en-US', {
            month: 'short',
            day: 'numeric',
            hour: '2-digit',
            minute: '2-digit',
          });
        }

        return {
          id: d.id,
          postId: data.postId,
          reportedBy: data.reportedBy || 'community_member',
          reason: data.reason || 'Flagged for moderation',
          timestamp: formattedTime,
          status: (data.status as 'pending' | 'reviewed' | 'dismissed') || 'pending',
        };
      });
      onUpdate(reports);
    },
    (error) => {
      console.warn('[Admin Reports] Real-time sync listener error:', error);
      if (onError) onError(error);
    }
  );
}

/**
 * Fetch all moderation reports from Cloud Firestore (Admin only).
 */
export async function fetchReportsFromFirestore(): Promise<PostReport[]> {
  const reportsCol = collection(db, 'reports');
  let snap;
  try {
    const q = query(reportsCol, orderBy('createdAt', 'desc'));
    snap = await getDocs(q);
  } catch {
    snap = await getDocs(reportsCol);
  }

  if (snap.empty) return [];

  return snap.docs.map((d) => {
    const data = d.data();
    let formattedTime = 'Recently';
    if (data.createdAt?.toDate) {
      formattedTime = data.createdAt.toDate().toLocaleDateString('en-US', {
        month: 'short',
        day: 'numeric',
        hour: '2-digit',
        minute: '2-digit',
      });
    }

    return {
      id: d.id,
      postId: data.postId,
      reportedBy: data.reportedBy || 'community_member',
      reason: data.reason || 'Flagged for moderation',
      timestamp: formattedTime,
      status: (data.status as 'pending' | 'reviewed' | 'dismissed') || 'pending',
    };
  });
}

/**
 * Resolve a content report in Cloud Firestore (Admin only).
 * If action is 'delete', also removes the flagged post and media attachments.
 */
export async function resolveReportInFirestore(
  reportId: string,
  action: 'dismiss' | 'delete',
  postId?: string
): Promise<void> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('Admin privileges required to resolve moderation reports.');
  }

  // 1. If action is 'delete', delete the post from Firestore and purge its media
  if (action === 'delete' && postId) {
    await deletePostInFirestore(postId, currentAuthUser.uid, true);
  }

  // 2. Update report status in Cloud Firestore
  const reportDocRef = doc(db, 'reports', reportId);
  await updateDoc(reportDocRef, {
    status: action === 'dismiss' ? 'dismissed' : 'reviewed',
    resolvedBy: currentAuthUser.email || currentAuthUser.uid,
    resolvedAt: serverTimestamp(),
  });
}
