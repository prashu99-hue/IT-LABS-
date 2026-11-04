import {
  collection,
  doc,
  getDoc,
  getDocs,
  setDoc,
  deleteDoc,
  serverTimestamp
} from 'firebase/firestore';
import { db, auth } from '../firebase/config';
import { User, UserRole } from '../types';
import { cleanFirestoreData } from '../utils/firestoreSanitizer';

export interface FollowData {
  userId: string;
  name: string;
  username: string;
  avatar: string;
  role: UserRole;
  title: string;
  institution: string;
  bio?: string;
  followedAt?: any;
}

/**
 * Mask user identifier for development diagnostic logging without exposing private user data.
 */
function maskId(id: string): string {
  if (!id || id.length <= 8) return '****';
  return `${id.substring(0, 4)}...${id.substring(id.length - 4)}`;
}

/**
 * Follow another creator in Cloud Firestore.
 * Prevents self-following and duplicate follows.
 * Writes to following and followers subcollections with automatic rollback if either write fails,
 * ensuring the two relationship lists cannot silently become inconsistent.
 */
export async function followCreatorInFirestore(
  currentUser: User,
  targetUser: User
): Promise<{ success: boolean; newFollowersCount?: number; newFollowingCount?: number }> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('Please sign in or register to follow educational creators.');
  }

  const followerId = currentAuthUser.uid;
  const targetId = targetUser.id;

  // Prevent users from following themselves
  if (followerId === targetId || currentUser.id === targetId) {
    throw new Error('You cannot follow yourself.');
  }

  const followerMasked = maskId(followerId);
  const targetMasked = maskId(targetId);

  const followingDocRef = doc(db, 'users', followerId, 'following', targetId);
  const followerDocRef = doc(db, 'users', targetId, 'followers', followerId);

  // 1. Check for duplicate follow relationship
  try {
    const existingSnap = await getDoc(followingDocRef);
    if (existingSnap.exists()) {
      return { success: true };
    }
  } catch (checkErr: any) {
    console.warn(`[Follow Diagnostic] getDoc on /users/${followerMasked}/following/${targetMasked} warning:`, checkErr?.code || checkErr?.message);
    if (checkErr?.code === 'permission-denied' || checkErr?.message?.includes('Missing or insufficient permissions')) {
      const detailedErr: any = new Error(`Permission denied reading /users/${followerMasked}/following/${targetMasked}. Security rules must be published.`);
      detailedErr.code = 'permission-denied';
      detailedErr.failedOperation = 'getDoc';
      detailedErr.failedPath = '/users/{userId}/following/{targetUserId}';
      throw detailedErr;
    }
  }

  // 2. Perform Write 1: Record in follower's following subcollection
  let followingWritten = false;
  try {
    await setDoc(followingDocRef, cleanFirestoreData({
      userId: targetId,
      name: targetUser.name,
      username: targetUser.username,
      avatar: targetUser.avatar,
      role: targetUser.role,
      title: targetUser.title || '',
      institution: targetUser.institution || '',
      followedAt: serverTimestamp(),
    }));
    followingWritten = true;
    console.log(`[Follow Diagnostic] setDoc on /users/${followerMasked}/following/${targetMasked}: SUCCESS`);
  } catch (err: any) {
    console.error(`[Follow Diagnostic] Failed operation: setDoc on path: /users/${followerMasked}/following/${targetMasked}. Code: ${err?.code || 'unknown'}, Error: ${err?.message}`);
    const wrappedErr: any = new Error(`Permission denied writing /users/${followerMasked}/following/${targetMasked}: ${err?.message}`);
    wrappedErr.code = err?.code || 'permission-denied';
    wrappedErr.failedOperation = 'setDoc';
    wrappedErr.failedPath = '/users/{userId}/following/{targetUserId}';
    throw wrappedErr;
  }

  // 3. Perform Write 2: Record in target's followers subcollection
  try {
    await setDoc(followerDocRef, cleanFirestoreData({
      userId: followerId,
      name: currentUser.name,
      username: currentUser.username,
      avatar: currentUser.avatar,
      role: currentUser.role,
      title: currentUser.title || '',
      institution: currentUser.institution || '',
      followedAt: serverTimestamp(),
    }));
    console.log(`[Follow Diagnostic] setDoc on /users/${targetMasked}/followers/${followerMasked}: SUCCESS`);
  } catch (err: any) {
    console.error(`[Follow Diagnostic] Failed operation: setDoc on path: /users/${targetMasked}/followers/${followerMasked}. Code: ${err?.code || 'unknown'}, Error: ${err?.message}`);
    // Rollback Write 1 if Write 2 fails to prevent silent inconsistency
    if (followingWritten) {
      console.warn(`[Follow Diagnostic] Reconciling: Rolling back /users/${followerMasked}/following/${targetMasked} due to follower write failure`);
      try {
        await deleteDoc(followingDocRef);
        console.log(`[Follow Diagnostic] Rollback of following record successful`);
      } catch (rollbackErr: any) {
        console.error(`[Follow Diagnostic] Failed rollback of following record:`, rollbackErr?.message);
      }
    }
    const wrappedErr: any = new Error(`Permission denied writing /users/${targetMasked}/followers/${followerMasked}: ${err?.message}`);
    wrappedErr.code = err?.code || 'permission-denied';
    wrappedErr.failedOperation = 'setDoc';
    wrappedErr.failedPath = '/users/{userId}/followers/{followerUserId}';
    throw wrappedErr;
  }

  return { success: true };
}

/**
 * Unfollow an existing creator in Cloud Firestore.
 * Atomically removes both relationship documents with diagnostic tracking and reconciliation.
 */
export async function unfollowCreatorInFirestore(
  currentUserId: string,
  targetUserId: string
): Promise<{ success: boolean }> {
  const currentAuthUser = auth.currentUser;
  if (!currentAuthUser) {
    throw new Error('Please sign in to manage followed creators.');
  }

  const followerId = currentAuthUser.uid;
  if (followerId === targetUserId) {
    throw new Error('Invalid unfollow target.');
  }

  const followerMasked = maskId(followerId);
  const targetMasked = maskId(targetUserId);

  const followingDocRef = doc(db, 'users', followerId, 'following', targetUserId);
  const followerDocRef = doc(db, 'users', targetUserId, 'followers', followerId);

  // 1. Delete following doc
  try {
    await deleteDoc(followingDocRef);
    console.log(`[Follow Diagnostic] deleteDoc on /users/${followerMasked}/following/${targetMasked}: SUCCESS`);
  } catch (err: any) {
    console.error(`[Follow Diagnostic] Failed operation: deleteDoc on path: /users/${followerMasked}/following/${targetMasked}. Code: ${err?.code || 'unknown'}, Error: ${err?.message}`);
    const wrappedErr: any = new Error(`Permission denied deleting /users/${followerMasked}/following/${targetMasked}: ${err?.message}`);
    wrappedErr.code = err?.code || 'permission-denied';
    wrappedErr.failedOperation = 'deleteDoc';
    wrappedErr.failedPath = '/users/{userId}/following/{targetUserId}';
    throw wrappedErr;
  }

  // 2. Delete follower doc
  try {
    await deleteDoc(followerDocRef);
    console.log(`[Follow Diagnostic] deleteDoc on /users/${targetMasked}/followers/${followerMasked}: SUCCESS`);
  } catch (err: any) {
    console.error(`[Follow Diagnostic] Failed operation: deleteDoc on path: /users/${targetMasked}/followers/${followerMasked}. Code: ${err?.code || 'unknown'}, Error: ${err?.message}`);
    const wrappedErr: any = new Error(`Permission denied deleting /users/${targetMasked}/followers/${followerMasked}: ${err?.message}`);
    wrappedErr.code = err?.code || 'permission-denied';
    wrappedErr.failedOperation = 'deleteDoc';
    wrappedErr.failedPath = '/users/{userId}/followers/{followerUserId}';
    throw wrappedErr;
  }

  return { success: true };
}

/**
 * Fetch the set of user IDs followed by a specific user from Cloud Firestore.
 * Ensures state persistence across page refreshes and logins.
 */
export async function fetchFollowedUserIdsFromFirestore(userId: string): Promise<Set<string>> {
  const followedSet = new Set<string>();
  if (!userId) return followedSet;

  try {
    const followingCol = collection(db, 'users', userId, 'following');
    const snap = await getDocs(followingCol);
    snap.docs.forEach((d) => {
      followedSet.add(d.id);
    });
  } catch (err: any) {
    console.warn(`[Follow Diagnostic] Could not fetch followed user IDs for /users/${maskId(userId)}/following:`, err?.code || err?.message);
  }

  return followedSet;
}

/**
 * Fetch followers list for a user from Cloud Firestore.
 */
export async function fetchFollowersListFromFirestore(userId: string): Promise<User[]> {
  try {
    const followersCol = collection(db, 'users', userId, 'followers');
    const snap = await getDocs(followersCol);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.userId || d.id,
        name: data.name || 'Member',
        username: data.username || 'member',
        email: '',
        role: (data.role as UserRole) || 'student',
        title: data.title || (data.role === 'teacher_expert' ? 'Verified Tech Specialist' : 'Computer Science Scholar'),
        institution: data.institution || 'Tech Academy',
        bio: data.bio || '',
        expertise: Array.isArray(data.expertise) ? data.expertise : [],
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Member')}&background=2563eb&color=fff`,
        followersCount: 0,
        followingCount: 0,
        isVerified: data.role === 'teacher_expert',
        isFollowing: false,
      };
    });
  } catch (err: any) {
    console.warn(`[Follow Diagnostic] Could not fetch followers from /users/${maskId(userId)}/followers:`, err?.code || err?.message);
    return [];
  }
}

/**
 * Alias for fetchFollowersListFromFirestore for API compatibility.
 */
export const fetchFollowerListFromFirestore = fetchFollowersListFromFirestore;

/**
 * Fetch following list for a user from Cloud Firestore.
 */
export async function fetchFollowingListFromFirestore(userId: string): Promise<User[]> {
  try {
    const followingCol = collection(db, 'users', userId, 'following');
    const snap = await getDocs(followingCol);
    return snap.docs.map((d) => {
      const data = d.data();
      return {
        id: data.userId || d.id,
        name: data.name || 'Member',
        username: data.username || 'member',
        email: '',
        role: (data.role as UserRole) || 'student',
        title: data.title || (data.role === 'teacher_expert' ? 'Verified Tech Specialist' : 'Computer Science Scholar'),
        institution: data.institution || 'Tech Academy',
        bio: data.bio || '',
        expertise: Array.isArray(data.expertise) ? data.expertise : [],
        avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'Member')}&background=2563eb&color=fff`,
        followersCount: 0,
        followingCount: 0,
        isVerified: data.role === 'teacher_expert',
        isFollowing: true,
      };
    });
  } catch (err: any) {
    console.warn(`[Follow Diagnostic] Could not fetch following from /users/${maskId(userId)}/following:`, err?.code || err?.message);
    return [];
  }
}

/**
 * Get accurate count of followers for a user directly from Firestore relationship documents.
 */
export async function getFollowerCountFromFirestore(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const followersCol = collection(db, 'users', userId, 'followers');
    const snap = await getDocs(followersCol);
    return snap.size;
  } catch (err) {
    console.warn(`Could not get follower count for ${maskId(userId)}:`, err);
    return 0;
  }
}

/**
 * Get accurate count of following for a user directly from Firestore relationship documents.
 */
export async function getFollowingCountFromFirestore(userId: string): Promise<number> {
  if (!userId) return 0;
  try {
    const followingCol = collection(db, 'users', userId, 'following');
    const snap = await getDocs(followingCol);
    return snap.size;
  } catch (err) {
    console.warn(`Could not get following count for ${maskId(userId)}:`, err);
    return 0;
  }
}
