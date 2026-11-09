import React, { useState, useEffect, useCallback } from 'react';
import { ShieldAlert } from 'lucide-react';
import {
  AppView,
  User,
  Post,
  SubjectCategory,
  PostReport,
  UserRole,
  MediaAttachment
} from './types';
import {
  INITIAL_POSTS
} from './data/mockData';
import { Navbar } from './components/Navbar';
import { Sidebar } from './components/Sidebar';
import { RightSidebar } from './components/RightSidebar';
import { MobileNav } from './components/MobileNav';
import { LandingView } from './components/LandingView';
import { AuthView } from './components/AuthView';
import { FeedView } from './components/FeedView';
import { ExploreView } from './components/ExploreView';
import { ProfileView } from './components/ProfileView';
import { CreatePostView } from './components/CreatePostView';
import { SearchView } from './components/SearchView';
import { SavedView } from './components/SavedView';
import { AdminDashboardView } from './components/AdminDashboardView';
import { CreatorDiscoveryView } from './components/CreatorDiscoveryView';
import { ShareModal } from './components/ShareModal';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { FirestoreRulesModal } from './components/FirestoreRulesModal';
import { Toast, ToastMessage } from './components/Toast';
import {
  subscribeToFirebaseAuthState,
  logoutFirebase,
  fetchAllUsersFromFirestore,
  subscribeToAllUsersFromFirestore,
  updateUserProfileInFirestore
} from './services/authService';
import {
  followCreatorInFirestore,
  unfollowCreatorInFirestore,
  fetchFollowedUserIdsFromFirestore
} from './services/followService';
import { auth } from './firebase/config';
import {
  createPostInFirestore,
  fetchPostsFromFirestore,
  toggleLikeInFirestore,
  addCommentInFirestore,
  deleteCommentInFirestore,
  deletePostInFirestore,
  deleteSingleAttachmentFromPost
} from './services/postService';
import {
  verifyAdminStatus,
  toggleUserVerificationInFirestore,
  updateUserRoleInFirestore,
  deleteUserInFirestore,
  toggleFeaturedPostInFirestore,
  submitPostReportToFirestore,
  fetchReportsFromFirestore,
  subscribeToReportsFromFirestore,
  resolveReportInFirestore,
  PRIMARY_ADMIN_EMAIL
} from './services/adminService';

const GUEST_USER: User = {
  id: 'guest',
  name: 'Guest Learner',
  username: 'guest',
  email: '',
  role: 'student',
  title: 'Student Scholar',
  institution: '',
  bio: '',
  expertise: [],
  avatar: 'https://ui-avatars.com/api/?name=Guest+Learner&background=64748b&color=fff',
  followersCount: 0,
  followingCount: 0,
  isVerified: false,
  isFollowing: false,
};

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [isAdminVerified, setIsAdminVerified] = useState(false);
  const [users, setUsers] = useState<User[]>([]);
  const [currentUser, setCurrentUser] = useState<User>(GUEST_USER);
  const [followedUserIds, setFollowedUserIds] = useState<Set<string>>(new Set());
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [reports, setReports] = useState<PostReport[]>([]);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCategory | 'All'>('All');
  const [activeExploreCategory, setActiveExploreCategory] = useState<SubjectCategory | null>(null);
  const [viewedUser, setViewedUser] = useState<User>(GUEST_USER);
  const [shareModalPost, setShareModalPost] = useState<Post | null>(null);
  const [previewMedia, setPreviewMedia] = useState<MediaAttachment | null>(null);
  const [rulesModalOpen, setRulesModalOpen] = useState(false);
  const [rulesErrorPath, setRulesErrorPath] = useState<string | null>(null);
  const [toasts, setToasts] = useState<ToastMessage[]>([]);

  // Toast Helper
  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'success') => {
    const id = 'toast-' + Date.now() + Math.random().toString(36).substring(2, 5);
    setToasts((prev) => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts((prev) => prev.filter((t) => t.id !== id));
    }, 3500);
  };

  const dismissToast = (id: string) => {
    setToasts((prev) => prev.filter((t) => t.id !== id));
  };

  // Listen to Firebase Auth state changes & sync Firestore profile
  useEffect(() => {
    const unsubscribe = subscribeToFirebaseAuthState((profile, fbUser) => {
      if (fbUser && profile) {
        setCurrentUser(profile);
        setViewedUser(profile);
        setIsLoggedIn(true);
        setUsers((prev) => {
          if (prev.some((u) => u.id === profile.id)) {
            return prev.map((u) => (u.id === profile.id ? profile : u));
          }
          return [profile, ...prev];
        });
      } else {
        setIsLoggedIn(false);
        setIsAdminVerified(false);
      }
    });

    return () => unsubscribe();
  }, []);

  // Secure Admin Verification & Real-time Reports Sync Effect
  useEffect(() => {
    let isMounted = true;
    let unsubscribeReports: (() => void) | null = null;

    async function checkAdminCredentials() {
      if (auth.currentUser) {
        try {
          const verified = await verifyAdminStatus(currentUser);
          if (isMounted) {
            setIsAdminVerified(verified);
            if (verified) {
              // Establish real-time listener for moderation reports in Cloud Firestore
              unsubscribeReports = subscribeToReportsFromFirestore(
                (liveReports) => {
                  if (isMounted) {
                    setReports(liveReports);
                  }
                },
                (err) => {
                  console.warn('Real-time reports sync error:', err);
                  const isPermissionDenied =
                    err?.code === 'permission-denied' ||
                    (typeof err?.message === 'string' &&
                      (err.message.includes('insufficient permissions') ||
                       err.message.includes('permission-denied')));
                  if (isPermissionDenied && isMounted) {
                    setRulesErrorPath('reports');
                    setRulesModalOpen(true);
                  }
                }
              );
            } else {
              setReports([]);
            }
          }
        } catch (err) {
          console.warn('Admin verification check warning:', err);
          if (isMounted) {
            setIsAdminVerified(false);
            setReports([]);
          }
        }
      } else {
        if (isMounted) {
          setIsAdminVerified(false);
          setReports([]);
        }
      }
    }

    checkAdminCredentials();
    return () => {
      isMounted = false;
      if (unsubscribeReports) {
        unsubscribeReports();
      }
    };
  }, [isLoggedIn, currentUser.id, currentUser.email]);

  // Live real-time sync of all genuine registered users from Cloud Firestore (/users collection)
  useEffect(() => {
    const unsubscribe = subscribeToAllUsersFromFirestore(
      (firestoreUsers) => {
        setUsers(
          firestoreUsers.map((u) => ({
            ...u,
            isFollowing: followedUserIds.has(u.id),
          }))
        );
      },
      (err) => {
        console.warn('Real-time users sync error:', err);
      }
    );

    return () => unsubscribe();
  }, [followedUserIds]);

  // Fetch followed user IDs when signed in to ensure persistence across page refreshes
  useEffect(() => {
    async function loadFollowedCreators() {
      if (auth.currentUser) {
        try {
          const followedSet = await fetchFollowedUserIdsFromFirestore(auth.currentUser.uid);
          setFollowedUserIds(followedSet);
          // Sync with users list
          setUsers((prevUsers) =>
            prevUsers.map((u) => ({
              ...u,
              isFollowing: followedSet.has(u.id),
            }))
          );
          // Sync with posts list
          setPosts((prevPosts) =>
            prevPosts.map((p) => {
              const aId = p.authorId || p.author?.id;
              return {
                ...p,
                author: {
                  ...p.author,
                  isFollowing: followedSet.has(aId),
                },
              };
            })
          );
        } catch (err) {
          console.warn('Could not load followed creators from Firestore:', err);
        }
      } else {
        setFollowedUserIds(new Set());
      }
    }

    loadFollowedCreators();
  }, [isLoggedIn, currentUser.id]);

  // Helper to read and persist user-specific bookmarks
  const getUserSavedIds = useCallback((userId: string): Set<string> => {
    try {
      const raw = localStorage.getItem(`it_labs_saved_${userId}`);
      if (raw) return new Set(JSON.parse(raw));
    } catch {
      // ignore
    }
    return new Set();
  }, []);

  const persistUserSavedIds = useCallback((userId: string, ids: Set<string>) => {
    try {
      localStorage.setItem(`it_labs_saved_${userId}`, JSON.stringify(Array.from(ids)));
    } catch {
      // ignore
    }
  }, []);

  // Fetch actual educational posts from Cloud Firestore
  const loadFeedPosts = useCallback(async () => {
    setIsFeedLoading(true);
    setFeedError(null);
    try {
      const activeUid = isLoggedIn && auth.currentUser ? auth.currentUser.uid : currentUser.id;
      const savedIds = getUserSavedIds(activeUid);
      const firestorePosts = await fetchPostsFromFirestore(isLoggedIn ? currentUser.id : undefined);
      setPosts(
        firestorePosts.map((p) => ({
          ...p,
          isSaved: savedIds.has(p.id),
        }))
      );
    } catch (err: any) {
      console.warn('Firestore feed load warning:', err);
      setFeedError(err?.message || 'Could not load posts from Cloud Firestore.');
    } finally {
      setIsFeedLoading(false);
    }
  }, [isLoggedIn, currentUser.id, getUserSavedIds]);

  useEffect(() => {
    loadFeedPosts();
  }, [loadFeedPosts]);

  // Synchronize bookmark states whenever the active user account changes
  useEffect(() => {
    const activeUid = isLoggedIn && auth.currentUser ? auth.currentUser.uid : currentUser.id;
    const savedIds = getUserSavedIds(activeUid);
    setPosts((prev) =>
      prev.map((p) => ({
        ...p,
        isSaved: savedIds.has(p.id),
      }))
    );
  }, [currentUser.id, isLoggedIn, getUserSavedIds]);

  // Like Toggle (Cloud Firestore)
  const handleLikeToggle = async (postId: string) => {
    if (!isLoggedIn || !auth.currentUser) {
      showToast('Please sign in or register to like educational posts.', 'info');
      setCurrentView('auth');
      return;
    }

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const currentlyLiked = !!targetPost.isLiked;

    // Optimistically update UI
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const nextLiked = !currentlyLiked;
          return {
            ...p,
            isLiked: nextLiked,
            likesCount: nextLiked ? p.likesCount + 1 : Math.max(0, p.likesCount - 1),
          };
        }
        return p;
      })
    );

    try {
      const result = await toggleLikeInFirestore(postId, currentUser.id, currentlyLiked);
      if (result) {
        setPosts((prevPosts) =>
          prevPosts.map((p) => {
            if (p.id === postId) {
              return {
                ...p,
                isLiked: result.nextLiked,
                likesCount: result.newLikesCount,
              };
            }
            return p;
          })
        );
      }
    } catch (err: any) {
      console.warn('Like toggle sync error in Firestore:', err);
      // Revert optimistic update
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              isLiked: currentlyLiked,
              likesCount: currentlyLiked ? p.likesCount : Math.max(0, p.likesCount - 1),
            };
          }
          return p;
        })
      );
      showToast(`Could not update like: ${err?.message || 'Firestore permission error'}`, 'error');
    }
  };

  // Save / Bookmark Toggle with persistent user-specific storage
  const handleSaveToggle = (postId: string) => {
    const activeUid = isLoggedIn && auth.currentUser ? auth.currentUser.uid : currentUser.id;
    const savedIds = getUserSavedIds(activeUid);

    setPosts((prevPosts) => {
      const updated = prevPosts.map((p) => {
        if (p.id === postId) {
          const nextSaved = !p.isSaved;
          if (nextSaved) {
            savedIds.add(postId);
            showToast(`"${p.title.slice(0, 30)}..." added to saved resources!`);
          } else {
            savedIds.delete(postId);
            showToast('Removed from saved resources', 'info');
          }
          return {
            ...p,
            isSaved: nextSaved,
            savesCount: nextSaved ? p.savesCount + 1 : Math.max(0, p.savesCount - 1),
          };
        }
        return p;
      });
      persistUserSavedIds(activeUid, savedIds);
      return updated;
    });
  };

  // Real Firebase-backed Follow / Unfollow System (Feature 2)
  const handleFollowToggle = async (userId: string) => {
    if (!isLoggedIn || !auth.currentUser) {
      showToast('Please sign in or register to follow educational creators.', 'info');
      setCurrentView('auth');
      return;
    }

    // Feature 2 Requirement: Prevent users from following themselves
    if (userId === currentUser.id || userId === auth.currentUser.uid) {
      showToast('You cannot follow yourself.', 'info');
      return;
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const currentlyFollowing = followedUserIds.has(userId) || !!targetUser.isFollowing;
    const nextFollowing = !currentlyFollowing;

    // Optimistically update followedUserIds Set
    setFollowedUserIds((prev) => {
      const nextSet = new Set(prev);
      if (nextFollowing) {
        nextSet.add(userId);
      } else {
        nextSet.delete(userId);
      }
      return nextSet;
    });

    // Optimistically update currentUser's followingCount
    setCurrentUser((prev) => ({
      ...prev,
      followingCount: nextFollowing
        ? (prev.followingCount || 0) + 1
        : Math.max(0, (prev.followingCount || 1) - 1),
    }));

    // Optimistically update users list
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === userId) {
          return {
            ...u,
            isFollowing: nextFollowing,
            followersCount: nextFollowing
              ? (u.followersCount || 0) + 1
              : Math.max(0, (u.followersCount || 1) - 1),
          };
        }
        if (u.id === currentUser.id) {
          return {
            ...u,
            followingCount: nextFollowing
              ? (u.followingCount || 0) + 1
              : Math.max(0, (u.followingCount || 1) - 1),
          };
        }
        return u;
      })
    );

    // Optimistically update posts author info
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        const authorId = p.authorId || p.author?.id;
        if (authorId === userId) {
          return {
            ...p,
            author: {
              ...p.author,
              isFollowing: nextFollowing,
              followersCount: nextFollowing
                ? (p.author.followersCount || 0) + 1
                : Math.max(0, (p.author.followersCount || 1) - 1),
            },
          };
        }
        return p;
      })
    );

    // Optimistically update viewedUser if viewing their profile
    if (viewedUser.id === userId) {
      setViewedUser((prev) => ({
        ...prev,
        isFollowing: nextFollowing,
        followersCount: nextFollowing
          ? (prev.followersCount || 0) + 1
          : Math.max(0, (prev.followersCount || 1) - 1),
      }));
    }

    // Persist relationship in Cloud Firestore
    try {
      if (nextFollowing) {
        await followCreatorInFirestore(currentUser, targetUser);
        showToast(`You are now following ${targetUser.name}`, 'info');
      } else {
        await unfollowCreatorInFirestore(currentUser.id, userId);
        showToast(`Unfollowed ${targetUser.name}`, 'info');
      }
    } catch (err: any) {
      console.warn('Follow synchronization error:', err);
      // Revert optimistic updates on error
      setFollowedUserIds((prev) => {
        const revertedSet = new Set(prev);
        if (currentlyFollowing) {
          revertedSet.add(userId);
        } else {
          revertedSet.delete(userId);
        }
        return revertedSet;
      });

      setUsers((prevUsers) =>
        prevUsers.map((u) => {
          if (u.id === userId) {
            return {
              ...u,
              isFollowing: currentlyFollowing,
              followersCount: currentlyFollowing
                ? (u.followersCount || 0) + 1
                : Math.max(0, (u.followersCount || 1) - 1),
            };
          }
          if (u.id === currentUser.id) {
            return {
              ...u,
              followingCount: currentlyFollowing
                ? (u.followingCount || 0) + 1
                : Math.max(0, (u.followingCount || 1) - 1),
            };
          }
          return u;
        })
      );

      // Revert posts author info
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          const authorId = p.authorId || p.author?.id;
          if (authorId === userId) {
            return {
              ...p,
              author: {
                ...p.author,
                isFollowing: currentlyFollowing,
                followersCount: currentlyFollowing
                  ? (p.author.followersCount || 0) + 1
                  : Math.max(0, (p.author.followersCount || 1) - 1),
              },
            };
          }
          return p;
        })
      );

      // Revert viewedUser if viewing their profile
      if (viewedUser.id === userId) {
        setViewedUser((prev) => ({
          ...prev,
          isFollowing: currentlyFollowing,
          followersCount: currentlyFollowing
            ? (prev.followersCount || 0) + 1
            : Math.max(0, (prev.followersCount || 1) - 1),
        }));
      }

      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        (typeof err?.message === 'string' &&
          (err.message.includes('insufficient permissions') ||
           err.message.includes('permission-denied') ||
           err.message.includes('Missing or insufficient permissions')));

      if (isPermissionDenied) {
        setRulesErrorPath(err?.failedPath || 'users/{userId}/following & /users/{userId}/followers');
        setRulesModalOpen(true);
        showToast('Firestore Permission Denied: Security rules for following/followers must be published in Firebase Console.', 'error');
      } else {
        showToast(`Could not sync follow status: ${err?.message || 'Permission denied'}`, 'error');
      }
    }
  };

  // Add Comment (Cloud Firestore)
  const handleAddComment = async (postId: string, text: string) => {
    if (!isLoggedIn || !auth.currentUser) {
      showToast('Please sign in or register to join community discussions.', 'info');
      setCurrentView('auth');
      return;
    }

    try {
      const createdComment = await addCommentInFirestore(postId, text, currentUser);
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: p.commentsCount + 1,
              comments: [...p.comments, createdComment],
            };
          }
          return p;
        })
      );
      showToast('Comment posted successfully!');
    } catch (err: any) {
      console.warn('Comment error in Firestore:', err);
      showToast(`Comment failed: ${err.message || 'Firestore error'}`, 'error');
    }
  };

  // Delete Comment (Author or Admin only in Cloud Firestore)
  const handleDeleteComment = async (postId: string, commentId: string) => {
    if (!isLoggedIn || !auth.currentUser) {
      showToast('Please sign in to manage comments.', 'info');
      setCurrentView('auth');
      return;
    }

    try {
      await deleteCommentInFirestore(postId, commentId);

      // Update UI only after Firestore confirms successful deletion
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              commentsCount: Math.max(0, p.commentsCount - 1),
              comments: p.comments.filter((c) => c.id !== commentId),
            };
          }
          return p;
        })
      );

      showToast('Comment deleted successfully.', 'success');
    } catch (err: any) {
      console.error('Failed to delete comment:', err);
      showToast(`Could not delete comment: ${err?.message || 'Permission denied'}`, 'error');
    }
  };

  // Community Report Submission (Cloud Firestore)
  const handleReportPost = async (postId: string, reason: string) => {
    if (!isLoggedIn || !auth.currentUser) {
      showToast('Please sign in or register to report content.', 'info');
      setCurrentView('auth');
      return;
    }

    const targetPost = posts.find((p) => p.id === postId);

    try {
      // Writes to /reports/{reportId} in Cloud Firestore
      await submitPostReportToFirestore(
        postId,
        reason,
        currentUser,
        targetPost?.title
      );
      // Success toast ONLY shown after Firestore confirms setDoc succeeded
      showToast('Report submitted for admin review. Thank you for keeping LearnNova safe!', 'info');
    } catch (err: any) {
      console.error('Failed to submit report to Firestore:', err);
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        (typeof err?.message === 'string' &&
          (err.message.includes('insufficient permissions') ||
           err.message.includes('permission-denied') ||
           err.message.includes('Missing or insufficient permissions')));

      if (isPermissionDenied) {
        setRulesErrorPath('reports');
        setRulesModalOpen(true);
        showToast('Firestore Permission Denied: /reports rules need to be published in Firebase Console.', 'error');
      } else {
        showToast(`Could not submit report: ${err?.message || 'Firestore write error'}`, 'error');
      }
    }
  };

  // Publish New Educational Post (Cloud Firestore)
  const handlePublishPost = async (
    postData: Omit<
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
  ) => {
    if (!isLoggedIn || !auth.currentUser) {
      showToast('Please sign in or register to publish educational notes to Firestore.', 'error');
      setCurrentView('auth');
      return;
    }

    setIsPublishing(true);
    try {
      const createdPost = await createPostInFirestore(
        {
          title: postData.title,
          description: postData.content,
          subject: postData.subject,
          difficulty: postData.difficulty,
          tags: postData.tags,
          resourceUrl: postData.resourceUrl,
          resourceTitle: postData.resourceTitle,
          resourceType: postData.resourceType,
          codeSnippet: postData.codeSnippet,
          media: postData.media,
          attachments: postData.attachments,
        },
        currentUser
      );

      setPosts((prev) => [createdPost, ...prev.filter((p) => p.id !== createdPost.id)]);
      showToast('Educational post published to LearnNova feed!');
      setCurrentView('feed');
    } catch (err: any) {
      console.error('Failed to publish post to Firestore:', err);
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        (typeof err?.message === 'string' &&
          (err.message.includes('insufficient permissions') ||
           err.message.includes('permission-denied') ||
           err.message.includes('Missing or insufficient permissions')));

      if (isPermissionDenied) {
        let errorPath = 'posts';
        try {
          const parsed = JSON.parse(err.message);
          if (parsed.path) errorPath = parsed.path;
        } catch (e) {
          // not JSON
        }
        setRulesErrorPath(errorPath);
        setRulesModalOpen(true);
        showToast(
          'Firestore Permission Denied: Please update the security rules for "posts" in Firebase Console > Firestore Database > Rules.',
          'error'
        );
      } else {
        showToast(`Publishing failed: ${err.message || 'Firestore write error'}`, 'error');
      }
    } finally {
      setIsPublishing(false);
    }
  };

  // Authentication handlers (called upon successful Firebase Register / Login)
  const handleAuthenticate = (authenticatedUser: User) => {
    setCurrentUser(authenticatedUser);
    setViewedUser(authenticatedUser);
    setIsLoggedIn(true);
    setUsers((prev) => {
      if (prev.some((u) => u.id === authenticatedUser.id)) {
        return prev.map((u) => (u.id === authenticatedUser.id ? authenticatedUser : u));
      }
      return [authenticatedUser, ...prev];
    });
    setCurrentView('feed');
    showToast(`Welcome to LearnNova, ${authenticatedUser.name}!`);
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      setIsLoggedIn(false);
      setCurrentUser(GUEST_USER);
      setViewedUser(GUEST_USER);
      setCurrentView('landing');
      showToast('Signed out of LearnNova', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggedIn(false);
      setCurrentUser(GUEST_USER);
      setViewedUser(GUEST_USER);
      setCurrentView('landing');
      showToast('Signed out of LearnNova', 'info');
    }
  };

  const handleUpdateProfile = async (updates: Partial<User>) => {
    if (!auth.currentUser) {
      showToast('Please sign in to update your profile.', 'info');
      return;
    }

    try {
      await updateUserProfileInFirestore(auth.currentUser.uid, updates);
      setCurrentUser((prev) => ({ ...prev, ...updates }));
      setViewedUser((prev) => (prev.id === auth.currentUser?.uid ? { ...prev, ...updates } : prev));
      setUsers((prev) =>
        prev.map((u) => (u.id === auth.currentUser?.uid ? { ...u, ...updates } : u))
      );
      showToast('Scholar profile updated successfully!', 'success');
    } catch (err: any) {
      console.error('Failed to update profile in Firestore:', err);
      showToast(`Could not update profile: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  };

  const handleSelectUser = (user: User) => {
    setViewedUser(user);
    setCurrentView('profile');
  };

  const handleSelectCategory = (category: SubjectCategory | null) => {
    setActiveExploreCategory(category);
    if (category) {
      setSelectedSubject(category);
    }
    setCurrentView('explore');
  };

  // Admin actions: Educator Verification Badge (Firestore-backed)
  const handleToggleUserVerification = async (userId: string) => {
    if (!isAdminVerified) {
      showToast('Admin privileges required to manage educator badges.', 'error');
      return;
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const currentStatus = !!targetUser.isVerified;
    const nextStatus = !currentStatus;

    // Optimistic UI update
    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, isVerified: nextStatus } : u))
    );

    try {
      await toggleUserVerificationInFirestore(userId, currentStatus);
      showToast(`${nextStatus ? 'Granted' : 'Revoked'} verified educator badge for ${targetUser.name}`);
    } catch (err: any) {
      console.error('Failed to update verification status in Firestore:', err);
      // Revert on error
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, isVerified: currentStatus } : u))
      );
      showToast(`Could not update verification badge: ${err?.message || 'Permission denied'}`, 'error');
    }
  };

  // Admin action: Update User Role & Academic Title (Firestore-backed)
  const handleUpdateUserRole = async (userId: string, role: UserRole, title?: string) => {
    if (!isAdminVerified) {
      showToast('Admin privileges required to update user roles.', 'error');
      return;
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    const prevRole = targetUser.role;
    const prevTitle = targetUser.title;

    setUsers((prev) =>
      prev.map((u) => (u.id === userId ? { ...u, role, title: title || u.title } : u))
    );

    try {
      await updateUserRoleInFirestore(userId, role, title);
      showToast(`Updated role to ${role === 'teacher_expert' ? 'Expert / Educator' : 'Student'} for ${targetUser.name}`);
    } catch (err: any) {
      console.error('Failed to update user role in Firestore:', err);
      setUsers((prev) =>
        prev.map((u) => (u.id === userId ? { ...u, role: prevRole, title: prevTitle } : u))
      );
      showToast(`Could not update user role: ${err?.message || 'Permission denied'}`, 'error');
    }
  };

  // Admin action: Feature/Unfeature Post (Firestore-backed)
  const handleToggleFeaturedPost = async (postId: string) => {
    if (!isAdminVerified) {
      showToast('Admin privileges required to feature posts.', 'error');
      return;
    }

    const targetPost = posts.find((p) => p.id === postId);
    if (!targetPost) return;

    const currentStatus = !!targetPost.isFeatured;
    const nextStatus = !currentStatus;

    // Optimistic UI update
    setPosts((prev) =>
      prev.map((p) => (p.id === postId ? { ...p, isFeatured: nextStatus } : p))
    );

    try {
      await toggleFeaturedPostInFirestore(postId, currentStatus);
      showToast(nextStatus ? 'Post marked as Featured on Feed!' : 'Post removed from Featured');
    } catch (err: any) {
      console.error('Failed to update featured post in Firestore:', err);
      // Revert on error
      setPosts((prev) =>
        prev.map((p) => (p.id === postId ? { ...p, isFeatured: currentStatus } : p))
      );
      showToast(`Could not feature post: ${err?.message || 'Permission denied'}`, 'error');
    }
  };

  // Admin action: Delete User Account (Firestore-backed)
  const handleDeleteUser = async (userId: string) => {
    if (!isAdminVerified) {
      showToast('Admin privileges required to remove accounts.', 'error');
      return;
    }

    const targetUser = users.find((u) => u.id === userId);
    if (!targetUser) return;

    try {
      await deleteUserInFirestore(userId);
      setUsers((prev) => prev.filter((u) => u.id !== userId));
      showToast(`User account ${targetUser.name} removed from platform`);
    } catch (err: any) {
      console.error('Failed to delete user in Firestore:', err);
      showToast(`Could not delete user: ${err?.message || 'Permission denied'}`, 'error');
    }
  };

  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find((p) => p.id === postId);
    const isPostAuthor = postToDelete && (postToDelete.authorId === currentUser.id || postToDelete.author.id === currentUser.id);
    const isAdminUser = isAdminVerified || currentUser.email === PRIMARY_ADMIN_EMAIL;

    if (!isPostAuthor && !isAdminUser) {
      showToast('Permission denied: You can only delete your own educational posts.', 'error');
      return;
    }

    try {
      await deletePostInFirestore(postId, currentUser.id, isAdminUser);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setReports((prev) => prev.filter((r) => r.postId !== postId));
      showToast('Educational post and associated files purged successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete post:', err);
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        (typeof err?.message === 'string' &&
          (err.message.includes('insufficient permissions') ||
           err.message.includes('permission-denied') ||
           err.message.includes('Missing or insufficient permissions')));

      if (isPermissionDenied) {
        setRulesErrorPath(`posts/${postId}`);
        setRulesModalOpen(true);
        showToast('Firestore Permission Denied: Only post authors or administrators can delete posts.', 'error');
      } else {
        showToast(`Failed to delete post: ${err?.message || 'Firestore delete error'}`, 'error');
      }
      throw err;
    }
  };

  // Individual Attachment Deletion Handler (Requirements 1, 4, 5, 6, 7)
  const handleDeleteAttachment = async (postId: string, attachmentId: string) => {
    const postObj = posts.find((p) => p.id === postId);
    const isPostAuthor = postObj && (postObj.authorId === currentUser.id || postObj.author.id === currentUser.id);
    const isAdminUser = isAdminVerified || currentUser.email === PRIMARY_ADMIN_EMAIL;

    if (!isPostAuthor && !isAdminUser) {
      showToast('Permission denied: You can only delete attachments from your own educational posts.', 'error');
      return;
    }

    try {
      const { updatedAttachments, updatedMedia } = await deleteSingleAttachmentFromPost(
        postId,
        attachmentId,
        currentUser.id,
        currentUser.email,
        isAdminUser
      );

      // Requirement 7: Update UI and attachment count immediately in state
      setPosts((prevPosts) =>
        prevPosts.map((p) => {
          if (p.id === postId) {
            return {
              ...p,
              attachments: updatedAttachments,
              media: updatedMedia,
            };
          }
          return p;
        })
      );

      showToast('Attachment deleted successfully', 'success');
    } catch (err: any) {
      console.error('Failed to delete attachment:', err);
      showToast(`Could not delete attachment: ${err?.message || 'Error'}`, 'error');
      throw err;
    }
  };

  // Admin action: Resolve moderation report (Cloud Firestore)
  const handleResolveReport = async (reportId: string, action: 'dismiss' | 'delete') => {
    if (!isAdminVerified) {
      showToast('Admin privileges required to resolve moderation reports.', 'error');
      return;
    }

    const targetReport = reports.find((r) => r.id === reportId);
    if (!targetReport) return;

    // Handle legacy in-memory mock reports cleanly if any exist
    if (reportId.startsWith('rep-') && !reportId.includes('_')) {
      setReports((prev) => prev.filter((r) => r.id !== reportId));
      if (action === 'delete') {
        setPosts((prev) => prev.filter((p) => p.id !== targetReport.postId));
      }
      showToast(`Mock report ${action === 'dismiss' ? 'dismissed' : 'resolved'}`);
      return;
    }

    try {
      // Confirmed only after Firestore resolves successfully
      await resolveReportInFirestore(reportId, action, targetReport.postId);

      if (action === 'delete') {
        setPosts((prev) => prev.filter((p) => p.id !== targetReport.postId));
        showToast('Flagged post removed and report marked as reviewed in Firestore', 'success');
      } else {
        showToast('Report dismissed successfully in Firestore', 'success');
      }

      setReports((prev) =>
        prev.map((r) =>
          r.id === reportId
            ? { ...r, status: action === 'dismiss' ? ('dismissed' as const) : ('reviewed' as const) }
            : r
        )
      );
    } catch (err: any) {
      console.error('Failed to resolve report in Firestore:', err);
      const isPermissionDenied =
        err?.code === 'permission-denied' ||
        (typeof err?.message === 'string' &&
          (err.message.includes('insufficient permissions') ||
           err.message.includes('permission-denied') ||
           err.message.includes('Missing or insufficient permissions')));

      if (isPermissionDenied) {
        setRulesErrorPath(`reports/${reportId}`);
        setRulesModalOpen(true);
        showToast('Firestore Permission Denied: Admin rules for /reports must be published in Firebase Console.', 'error');
      } else {
        showToast(`Could not resolve report: ${err?.message || 'Error'}`, 'error');
      }
    }
  };

  const savedPostsCount = posts.filter((p) => p.isSaved).length;

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 flex flex-col antialiased">
      {/* Toast notifications */}
      <Toast toasts={toasts} onDismiss={dismissToast} />

      {/* Share post modal */}
      <ShareModal
        post={shareModalPost}
        onClose={() => setShareModalPost(null)}
        onToast={(msg) => showToast(msg, 'info')}
      />

      {/* Media Preview Modal (Images, Videos, PDFs, Code Files) */}
      <MediaPreviewModal
        media={previewMedia}
        onClose={() => setPreviewMedia(null)}
        onToast={showToast}
      />

      {/* Firestore Security Rules Guidance Modal */}
      <FirestoreRulesModal
        isOpen={rulesModalOpen}
        onClose={() => setRulesModalOpen(false)}
        errorPath={rulesErrorPath}
      />

      {/* Sticky Top Navigation Bar */}
      <Navbar
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'profile') setViewedUser(currentUser);
          setCurrentView(view);
        }}
        currentUser={currentUser}
        users={users}
        onOpenSearch={() => setCurrentView('search')}
        searchQuery={searchQuery}
        onSearchChange={(q) => {
          setSearchQuery(q);
          if (currentView !== 'search') {
            setCurrentView('search');
          }
        }}
        onSearchSubmit={(q) => {
          setSearchQuery(q);
          setCurrentView('search');
        }}
        isLoggedIn={isLoggedIn}
        isAdminVerified={isAdminVerified}
        onToggleAuth={() => {
          if (isLoggedIn) {
            handleLogout();
          } else {
            setCurrentView('auth');
          }
        }}
      />

      {/* Main Content Area */}
      {currentView === 'landing' ? (
        <LandingView
          creators={users}
          onGetStarted={() => setCurrentView('auth')}
          onLogin={() => setCurrentView('auth')}
          onSelectCategory={(cat) => {
            setActiveExploreCategory(cat);
            setSelectedSubject(cat);
            setCurrentView('explore');
          }}
          onSelectCreator={(u) => {
            setViewedUser(u);
            setCurrentView('profile');
          }}
          onExploreFeed={() => setCurrentView('feed')}
        />
      ) : currentView === 'auth' ? (
        <AuthView
          onAuthenticate={handleAuthenticate}
          onCancel={() => setCurrentView('landing')}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full pb-28 md:pb-24">
          <div className="flex gap-6 items-start justify-center">
            
            {/* Desktop Left Sidebar */}
            <Sidebar
              currentView={currentView}
              onNavigate={(v) => {
                if (v === 'profile') setViewedUser(currentUser);
                setCurrentView(v);
              }}
              currentUser={currentUser}
              selectedSubject={selectedSubject}
              onSelectSubject={(subj) => {
                setSelectedSubject(subj);
                if (currentView !== 'feed') setCurrentView('feed');
              }}
              savedCount={savedPostsCount}
              isAdminVerified={isAdminVerified}
              pendingReportsCount={reports.filter((r) => r.status === 'pending').length}
            />

            {/* Central Main Stage */}
            <main className="flex-1 max-w-2xl w-full min-w-0">
              {currentView === 'feed' && (
                <FeedView
                  posts={posts}
                  currentUser={currentUser}
                  selectedSubject={selectedSubject}
                  onSelectSubject={setSelectedSubject}
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onFollowToggle={handleFollowToggle}
                  onShare={(p) => setShareModalPost(p)}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSelectUser={handleSelectUser}
                  onSelectCategory={handleSelectCategory}
                  onOpenCreate={() => setCurrentView('create')}
                  onPreviewMedia={(m) => setPreviewMedia(m)}
                  onToast={showToast}
                  isLoading={isFeedLoading}
                  error={feedError}
                  onRetry={loadFeedPosts}
                  followedUserIds={followedUserIds}
                  onDiscoverCreators={() => setCurrentView('creators')}
                />
              )}

              {currentView === 'explore' && (
                <ExploreView
                  activeCategory={activeExploreCategory}
                  onSelectCategory={setActiveExploreCategory}
                  posts={posts}
                  creators={users}
                  currentUser={currentUser}
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onFollowToggle={handleFollowToggle}
                  onShare={(p) => setShareModalPost(p)}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSelectUser={handleSelectUser}
                  onPreviewMedia={(m) => setPreviewMedia(m)}
                  onToast={showToast}
                  isAdminVerified={isAdminVerified}
                />
              )}

              {currentView === 'creators' && (
                <CreatorDiscoveryView
                  creators={users}
                  currentUser={currentUser}
                  posts={posts}
                  followedUserIds={followedUserIds}
                  onFollowToggle={handleFollowToggle}
                  onSelectUser={handleSelectUser}
                  onSelectCategory={handleSelectCategory}
                  onToast={showToast}
                />
              )}

              {currentView === 'profile' && (
                <ProfileView
                  user={viewedUser}
                  currentUser={currentUser}
                  allPosts={posts}
                  creators={users}
                  followedUserIds={followedUserIds}
                  onFollowToggle={handleFollowToggle}
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onShare={(p) => setShareModalPost(p)}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSelectUser={handleSelectUser}
                  onSelectCategory={handleSelectCategory}
                  onBackToFeed={() => setCurrentView('feed')}
                  onPreviewMedia={(m) => setPreviewMedia(m)}
                  onToast={showToast}
                  isAdminVerified={isAdminVerified}
                  onUpdateProfile={handleUpdateProfile}
                />
              )}

              {currentView === 'create' && (
                <CreatePostView
                  currentUser={currentUser}
                  isAuthenticated={!!auth.currentUser}
                  onSignIn={() => {
                    showToast('Please sign in or register to publish to Cloud Firestore', 'info');
                    setCurrentView('auth');
                  }}
                  onPublishPost={handlePublishPost}
                  onCancel={() => setCurrentView('feed')}
                  isPublishing={isPublishing}
                />
              )}

              {currentView === 'search' && (
                <SearchView
                  initialQuery={searchQuery}
                  posts={posts}
                  creators={users}
                  currentUser={currentUser}
                  followedUserIds={followedUserIds}
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onFollowToggle={handleFollowToggle}
                  onShare={(p) => setShareModalPost(p)}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSelectUser={handleSelectUser}
                  onSelectCategory={handleSelectCategory}
                  onPreviewMedia={(m) => setPreviewMedia(m)}
                  onToast={showToast}
                  isAdminVerified={isAdminVerified}
                />
              )}

              {currentView === 'saved' && (
                <SavedView
                  savedPosts={posts.filter((p) => p.isSaved)}
                  currentUser={currentUser}
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onFollowToggle={handleFollowToggle}
                  onShare={(p) => setShareModalPost(p)}
                  onAddComment={handleAddComment}
                  onDeleteComment={handleDeleteComment}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSelectUser={handleSelectUser}
                  onSelectCategory={handleSelectCategory}
                  onExplore={() => {
                    setActiveExploreCategory(null);
                    setCurrentView('explore');
                  }}
                  onPreviewMedia={(m) => setPreviewMedia(m)}
                  onToast={showToast}
                  isAdminVerified={isAdminVerified}
                />
              )}

              {currentView === 'admin' && (
                !isAdminVerified ? (
                  <div className="bg-white rounded-2xl border border-rose-200 p-8 text-center shadow-sm">
                    <div className="w-16 h-16 bg-rose-50 text-rose-600 rounded-full flex items-center justify-center mx-auto mb-4 border border-rose-100">
                      <ShieldAlert className="w-8 h-8" />
                    </div>
                    <h2 className="text-xl font-bold text-slate-900 mb-2">Admin Access Restricted</h2>
                    <p className="text-sm text-slate-600 max-w-md mx-auto mb-6">
                      The LearnNova Admin Dashboard is strictly restricted to verified system administrators and appointed moderators.
                      You are currently active as <span className="font-semibold text-slate-800">{currentUser.name}</span> ({currentUser.email || 'Guest / Unverified User'}).
                    </p>
                    <div className="bg-slate-50 border border-slate-200 rounded-xl p-3.5 max-w-md mx-auto mb-6 text-xs text-slate-600 text-left space-y-1">
                      <p className="font-semibold text-slate-700">Security Verification Protocol:</p>
                      <p>• Super Admin Account: <code className="text-indigo-600 font-mono">ecode2544@gmail.com</code></p>
                      <p>• Role Delegations: Verified via Cloud Firestore <code className="text-slate-700 font-mono">/admins/{'{uid}'}</code></p>
                      <p>• Client-side role spoofing is strictly rejected by Firestore security rules.</p>
                    </div>
                    <button
                      onClick={() => setCurrentView('feed')}
                      className="px-5 py-2.5 bg-indigo-600 hover:bg-indigo-700 text-white rounded-xl text-sm font-semibold transition-colors shadow-sm"
                    >
                      Return to Home Feed
                    </button>
                  </div>
                ) : (
                  <AdminDashboardView
                    users={users}
                    posts={posts}
                    reports={reports}
                    currentAdmin={currentUser}
                    onToggleUserVerification={handleToggleUserVerification}
                    onUpdateUserRole={handleUpdateUserRole}
                    onDeleteUser={handleDeleteUser}
                    onToggleFeaturedPost={handleToggleFeaturedPost}
                    onDeletePost={handleDeletePost}
                    onResolveReport={handleResolveReport}
                    onSelectUser={handleSelectUser}
                    onPreviewPost={(post) => setPreviewMedia(post.media || post.attachments?.[0] || null)}
                    onToast={showToast}
                  />
                )
              )}
            </main>

            {/* Desktop Right Sidebar */}
            <RightSidebar
              creators={users}
              currentUserId={currentUser.id}
              onFollowToggle={handleFollowToggle}
              onSelectUser={handleSelectUser}
              onSelectSubject={(subj) => {
                setSelectedSubject(subj);
                setCurrentView('feed');
              }}
            />

          </div>
        </div>
      )}

      {/* Bottom Navigation Bar */}
      {currentView !== 'landing' && currentView !== 'auth' && (
        <MobileNav
          currentView={currentView}
          onNavigate={(view) => {
            if (view === 'profile') setViewedUser(currentUser);
            setCurrentView(view);
          }}
          savedCount={savedPostsCount}
        />
      )}
    </div>
  );
}
