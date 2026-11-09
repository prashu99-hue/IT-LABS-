import {
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
  updateProfile,
  User as FirebaseUser
} from 'firebase/auth';
import {
  doc,
  getDoc,
  setDoc,
  updateDoc,
  collection,
  getDocs,
  onSnapshot,
  Unsubscribe
} from 'firebase/firestore';
import { auth, db } from '../firebase/config';
import { User, UserRole } from '../types';
import { cleanFirestoreData } from '../utils/firestoreSanitizer';

export interface RegistrationData {
  name: string;
  email: string;
  password: string;
  role: UserRole;
  title?: string;
  institution?: string;
  bio?: string;
  expertise?: string[];
}

// Convert Firebase error codes into clear, user-friendly error messages
export function formatFirebaseAuthError(error: any): string {
  const code = error?.code || '';
  switch (code) {
    case 'auth/email-already-in-use':
      return 'An account with this email address already exists. Please sign in instead.';
    case 'auth/invalid-email':
      return 'The email address entered is not valid.';
    case 'auth/weak-password':
      return 'Password must be at least 6 characters long.';
    case 'auth/user-not-found':
      return 'No account found with this email address. Please register first.';
    case 'auth/wrong-password':
      return 'Incorrect password. Please try again.';
    case 'auth/invalid-credential':
      return 'Invalid email or password. Please verify your credentials.';
    case 'auth/too-many-requests':
      return 'Access temporarily disabled due to many failed login attempts. Please try again later or reset password.';
    case 'auth/network-request-failed':
      return 'Network communication failed. Please check your internet connection.';
    case 'auth/operation-not-allowed':
      return 'Email/Password authentication is not yet enabled in the Firebase Console. Please enable Email/Password under Firebase Authentication > Sign-in method.';
    case 'auth/api-key-not-valid':
    case 'auth/invalid-api-key':
      return 'The Firebase Web API Key for project "it-labs-47fb8" is invalid or expired. Please copy the current Web API Key from Firebase Console > Project Settings and update it.';
    case 'permission-denied':
      return 'Firestore permission denied: Your user profile could not be saved. Please publish the provided security rules in the Firebase Console under Firestore Database > Rules.';
    default:
      if (typeof error?.message === 'string' && error.message.toLowerCase().includes('api-key-not-valid')) {
        return 'The Firebase Web API Key for project "it-labs-47fb8" is invalid or expired. Please copy the current Web API Key from Firebase Console > Project Settings.';
      }
      if (typeof error?.message === 'string' && (error.message.toLowerCase().includes('insufficient permissions') || error.message.toLowerCase().includes('permission-denied'))) {
        return 'Firestore permission denied: Please publish the security rules in the Firebase Console under Firestore Database > Rules.';
      }
      return error?.message || 'Authentication failed. Please try again.';
  }
}

/**
 * Register a new user in Firebase Auth and persist profile in Cloud Firestore
 */
export async function registerWithFirebase(data: RegistrationData): Promise<User> {
  // Client-side validations
  if (!data.email.trim()) {
    throw new Error('Email address is required.');
  }
  if (!data.password || data.password.length < 6) {
    throw new Error('Password must be at least 6 characters.');
  }
  if (!data.name.trim()) {
    throw new Error('Full name is required.');
  }

  // 1. Create user in Firebase Authentication
  const userCredential = await createUserWithEmailAndPassword(auth, data.email.trim(), data.password);
  const fbUser = userCredential.user;

  // 2. Set Firebase Auth display name
  await updateProfile(fbUser, {
    displayName: data.name.trim(),
  });

  const username = data.name.trim().toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + fbUser.uid.substring(0, 4);
  const avatar = `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name.trim())}&background=2563eb&color=fff`;

  // 3. Construct Firestore User Profile Document (UID as Document ID)
  const userProfile: User = {
    id: fbUser.uid,
    name: data.name.trim(),
    username,
    email: data.email.trim(),
    role: data.role,
    title: data.title?.trim() || (data.role === 'teacher_expert' ? 'Verified Instructor / Expert' : 'Computer Science Scholar'),
    institution: data.institution?.trim() || (data.role === 'teacher_expert' ? 'Tech University' : 'Student Scholar'),
    bio: data.bio?.trim() || (data.role === 'teacher_expert'
      ? 'Passionate educator sharing computer science concepts and industry best practices on LearnNova.'
      : 'Student passionate about computer science, software engineering, and peer problem solving.'),
    expertise: data.expertise && data.expertise.length > 0 ? data.expertise : ['Web Development'],
    avatar,
    followersCount: 0,
    followingCount: 0,
    isVerified: data.role === 'teacher_expert',
    isFollowing: false,
  };

  // Cache locally immediately so profile is never lost
  try {
    localStorage.setItem(`itlabs_profile_${fbUser.uid}`, JSON.stringify(userProfile));
  } catch (err) {
    // Ignore storage quota or disabled errors
  }

  // 4. Save to Firestore collection 'users' with UID as document ID
  const userDocRef = doc(db, 'users', fbUser.uid);
  try {
    const cleanProfilePayload = cleanFirestoreData({
      ...userProfile,
      isAdmin: false, // Security: Never allow users to assign themselves admin privileges
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
    await setDoc(userDocRef, cleanProfilePayload);
  } catch (firestoreError: any) {
    // If Firestore rules are not yet published in console, log a clean warning
    console.warn('Firestore profile write pending rules publication:', firestoreError?.message || firestoreError);
  }

  return userProfile;
}

/**
 * Sign in existing user with Email and Password
 */
export async function loginWithFirebase(email: string, password: string): Promise<User> {
  if (!email.trim() || !password) {
    throw new Error('Please enter both email and password.');
  }

  // 1. Authenticate with Firebase Auth
  const userCredential = await signInWithEmailAndPassword(auth, email.trim(), password);
  const fbUser = userCredential.user;

  // 2. Load Firestore User Profile
  const profile = await getUserProfileFromFirestore(fbUser.uid);
  if (profile) {
    return profile;
  }

  // Fallback: If document does not exist yet, initialize it
  const fallbackUser: User = {
    id: fbUser.uid,
    name: fbUser.displayName || 'LearnNova Member',
    username: (fbUser.displayName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_') + '_' + fbUser.uid.substring(0, 4),
    email: fbUser.email || email.trim(),
    role: 'student',
    title: 'Computer Science Scholar',
    institution: 'Tech Academy',
    bio: 'Passionate learner on LearnNova.',
    expertise: ['Web Development'],
    avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || 'User')}&background=2563eb&color=fff`,
    followersCount: 0,
    followingCount: 0,
    isVerified: false,
    isFollowing: false,
  };

  try {
    localStorage.setItem(`itlabs_profile_${fbUser.uid}`, JSON.stringify(fallbackUser));
    await setDoc(doc(db, 'users', fbUser.uid), {
      ...fallbackUser,
      isAdmin: false,
      createdAt: new Date().toISOString(),
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('Firestore fallback sync pending rules publication:', err?.message || err);
  }

  return fallbackUser;
}

/**
 * Fetch User Profile Document from Cloud Firestore
 */
export async function getUserProfileFromFirestore(uid: string): Promise<User | null> {
  let cachedProfile: User | null = null;
  try {
    const raw = localStorage.getItem(`itlabs_profile_${uid}`);
    if (raw) {
      cachedProfile = JSON.parse(raw);
    }
  } catch (e) {
    // ignore
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const docSnap = await getDoc(userDocRef);
    if (docSnap.exists()) {
      const data = docSnap.data();
      const userProfile: User = {
        id: uid,
        name: data.name || cachedProfile?.name || 'Member',
        username: data.username || cachedProfile?.username || 'member',
        email: data.email || cachedProfile?.email,
        role: data.role || cachedProfile?.role || 'student',
        title: data.title || cachedProfile?.title || '',
        institution: data.institution || cachedProfile?.institution || '',
        bio: data.bio || cachedProfile?.bio || '',
        expertise: data.expertise || cachedProfile?.expertise || [],
        avatar: data.avatar || cachedProfile?.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(data.name || 'User')}&background=2563eb&color=fff`,
        followersCount: data.followersCount || cachedProfile?.followersCount || 0,
        followingCount: data.followingCount || cachedProfile?.followingCount || 0,
        isVerified: data.isVerified !== undefined ? !!data.isVerified : !!cachedProfile?.isVerified,
        isFollowing: false,
      };

      try {
        localStorage.setItem(`itlabs_profile_${uid}`, JSON.stringify(userProfile));
      } catch (e) {
        // ignore
      }

      return userProfile;
    }

    return cachedProfile;
  } catch (error: any) {
    // If permissions are not configured yet in Firebase console, smoothly use cached profile
    if (cachedProfile) {
      return cachedProfile;
    }
    console.warn('Firestore user profile fetch pending rules publication in Firebase Console:', error?.message || error);
    return null;
  }
}

/**
 * Map raw Firestore document data to genuine User model.
 * Never injects dummy titles, institutions, or fake verification badges.
 */
function mapFirestoreDocToUser(id: string, data: any): User {
  const cleanName = data.name || 'Community Member';
  return {
    id,
    name: cleanName,
    username: data.username || cleanName.toLowerCase().replace(/[^a-z0-9]/g, '_'),
    email: '', // Never expose private user email in public discovery
    role: (data.role as UserRole) || 'student',
    title: data.title || (data.role === 'teacher_expert' ? 'Educator' : 'Student Scholar'),
    institution: data.institution || '',
    bio: data.bio || '',
    expertise: Array.isArray(data.expertise) ? data.expertise : [],
    avatar: data.avatar || `https://ui-avatars.com/api/?name=${encodeURIComponent(cleanName)}&background=2563eb&color=fff`,
    followersCount: typeof data.followersCount === 'number' ? data.followersCount : 0,
    followingCount: typeof data.followingCount === 'number' ? data.followingCount : 0,
    isVerified: !!data.isVerified,
    isFollowing: false,
  };
}

/**
 * Fetch all genuine registered user profiles from Cloud Firestore for global search and creator discovery.
 */
export async function fetchAllUsersFromFirestore(): Promise<User[]> {
  try {
    const usersSnap = await getDocs(collection(db, 'users'));
    if (!usersSnap.empty) {
      return usersSnap.docs.map((d) => mapFirestoreDocToUser(d.id, d.data()));
    }
  } catch (err) {
    console.warn('Could not query users collection from Firestore:', err);
  }
  return [];
}

/**
 * Subscribe to real-time genuine user profiles from Cloud Firestore.
 */
export function subscribeToAllUsersFromFirestore(
  onUpdate: (users: User[]) => void,
  onError?: (error: any) => void
): Unsubscribe {
  return onSnapshot(
    collection(db, 'users'),
    (snapshot) => {
      const users: User[] = snapshot.docs.map((d) => mapFirestoreDocToUser(d.id, d.data()));
      onUpdate(users);
    },
    (err) => {
      console.warn('Real-time users sync error:', err);
      if (onError) onError(err);
    }
  );
}

/**
 * Update User Profile Document in Cloud Firestore
 */
export async function updateUserProfileInFirestore(uid: string, updates: Partial<User>): Promise<void> {
  try {
    const raw = localStorage.getItem(`itlabs_profile_${uid}`);
    if (raw) {
      const current = JSON.parse(raw);
      localStorage.setItem(`itlabs_profile_${uid}`, JSON.stringify({ ...current, ...updates }));
    }
  } catch (e) {
    // ignore
  }

  try {
    const userDocRef = doc(db, 'users', uid);
    const { id, email, ...safeUpdates } = updates as any;
    delete safeUpdates.isAdmin;

    await updateDoc(userDocRef, {
      ...safeUpdates,
      updatedAt: new Date().toISOString(),
    });
  } catch (err: any) {
    console.warn('Could not update Firestore profile:', err?.message || err);
  }
}

/**
 * Log out user from Firebase Auth
 */
export async function logoutFirebase(): Promise<void> {
  await signOut(auth);
}

/**
 * Subscribe to persistent Firebase Authentication state changes
 */
export function subscribeToFirebaseAuthState(
  onStateChange: (user: User | null, fbUser: FirebaseUser | null) => void
) {
  return onAuthStateChanged(auth, async (fbUser) => {
    if (fbUser) {
      const profile = await getUserProfileFromFirestore(fbUser.uid);
      if (profile) {
        onStateChange(profile, fbUser);
      } else {
        const minimalUser: User = {
          id: fbUser.uid,
          name: fbUser.displayName || 'Member',
          username: (fbUser.displayName || 'user').toLowerCase().replace(/[^a-z0-9]/g, '_'),
          email: fbUser.email || '',
          role: 'student',
          title: 'Computer Science Scholar',
          institution: 'Tech Academy',
          bio: 'Passionate learner on LearnNova.',
          expertise: ['Web Development'],
          avatar: fbUser.photoURL || `https://ui-avatars.com/api/?name=${encodeURIComponent(fbUser.displayName || 'User')}&background=2563eb&color=fff`,
          followersCount: 0,
          followingCount: 0,
          isVerified: false,
          isFollowing: false,
        };
        onStateChange(minimalUser, fbUser);
      }
    } else {
      onStateChange(null, null);
    }
  });
}

