import React, { useState, useEffect, useCallback } from 'react';
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
  INITIAL_USERS,
  CURRENT_USER,
  INITIAL_POSTS,
  INITIAL_REPORTS
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
import { ShareModal } from './components/ShareModal';
import { MediaPreviewModal } from './components/MediaPreviewModal';
import { FirestoreRulesModal } from './components/FirestoreRulesModal';
import { Toast, ToastMessage } from './components/Toast';
import { subscribeToFirebaseAuthState, logoutFirebase, fetchAllUsersFromFirestore } from './services/authService';
import { auth } from './firebase/config';
import {
  createPostInFirestore,
  fetchPostsFromFirestore,
  toggleLikeInFirestore,
  addCommentInFirestore,
  deletePostInFirestore,
  deleteSingleAttachmentFromPost
} from './services/postService';

export default function App() {
  const [currentView, setCurrentView] = useState<AppView>('landing');
  const [isLoggedIn, setIsLoggedIn] = useState(false);
  const [users, setUsers] = useState<User[]>(INITIAL_USERS);
  const [currentUser, setCurrentUser] = useState<User>(CURRENT_USER);
  const [posts, setPosts] = useState<Post[]>(INITIAL_POSTS);
  const [searchQuery, setSearchQuery] = useState('');
  const [isFeedLoading, setIsFeedLoading] = useState(false);
  const [feedError, setFeedError] = useState<string | null>(null);
  const [isPublishing, setIsPublishing] = useState(false);
  const [reports, setReports] = useState<PostReport[]>(INITIAL_REPORTS);
  const [selectedSubject, setSelectedSubject] = useState<SubjectCategory | 'All'>('All');
  const [activeExploreCategory, setActiveExploreCategory] = useState<SubjectCategory | null>(null);
  const [viewedUser, setViewedUser] = useState<User>(CURRENT_USER);
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
      }
    });

    return () => unsubscribe();
  }, []);

  // Fetch all registered users from Cloud Firestore for Global Search & Creator Discovery
  useEffect(() => {
    async function loadFirestoreUsers() {
      try {
        const firestoreUsers = await fetchAllUsersFromFirestore();
        if (firestoreUsers.length > 0) {
          setUsers((prev) => {
            const combined = [...firestoreUsers, ...prev];
            const seen = new Set<string>();
            return combined.filter((u) => {
              if (seen.has(u.id)) return false;
              seen.add(u.id);
              return true;
            });
          });
        }
      } catch (err) {
        console.warn('Could not load Firestore users:', err);
      }
    }
    loadFirestoreUsers();
  }, []);

  // Fetch actual educational posts from Cloud Firestore
  const loadFeedPosts = useCallback(async () => {
    setIsFeedLoading(true);
    setFeedError(null);
    try {
      const firestorePosts = await fetchPostsFromFirestore(isLoggedIn ? currentUser.id : undefined);
      setPosts(firestorePosts);
    } catch (err: any) {
      console.warn('Firestore feed load warning:', err);
      setFeedError(err?.message || 'Could not load posts from Cloud Firestore.');
    } finally {
      setIsFeedLoading(false);
    }
  }, [isLoggedIn, currentUser.id]);

  useEffect(() => {
    loadFeedPosts();
  }, [loadFeedPosts]);

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
      await toggleLikeInFirestore(postId, currentUser.id, currentlyLiked);
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

  // Save / Bookmark Toggle
  const handleSaveToggle = (postId: string) => {
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.id === postId) {
          const nextSaved = !p.isSaved;
          if (nextSaved) {
            showToast(`"${p.title.slice(0, 30)}..." added to saved resources!`);
          } else {
            showToast('Removed from saved resources', 'info');
          }
          return {
            ...p,
            isSaved: nextSaved,
            savesCount: nextSaved ? p.savesCount + 1 : Math.max(0, p.savesCount - 1),
          };
        }
        return p;
      })
    );
  };

  // Follow Toggle
  const handleFollowToggle = (userId: string) => {
    setUsers((prevUsers) =>
      prevUsers.map((u) => {
        if (u.id === userId) {
          const nextFollow = !u.isFollowing;
          showToast(nextFollow ? `You are now following ${u.name}` : `Unfollowed ${u.name}`, 'info');
          return {
            ...u,
            isFollowing: nextFollow,
            followersCount: nextFollow ? u.followersCount + 1 : Math.max(0, u.followersCount - 1),
          };
        }
        return u;
      })
    );

    // Update posts author if matches
    setPosts((prevPosts) =>
      prevPosts.map((p) => {
        if (p.author.id === userId) {
          const nextFollow = !p.author.isFollowing;
          return {
            ...p,
            author: {
              ...p.author,
              isFollowing: nextFollow,
              followersCount: nextFollow
                ? p.author.followersCount + 1
                : Math.max(0, p.author.followersCount - 1),
            },
          };
        }
        return p;
      })
    );

    if (viewedUser.id === userId) {
      setViewedUser((prev) => ({
        ...prev,
        isFollowing: !prev.isFollowing,
        followersCount: !prev.isFollowing
          ? prev.followersCount + 1
          : Math.max(0, prev.followersCount - 1),
      }));
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

  // Report Post
  const handleReportPost = (postId: string, reason: string) => {
    const newReport: PostReport = {
      id: 'rep-' + Date.now(),
      postId,
      reportedBy: currentUser.username,
      reason,
      timestamp: 'Just now',
      status: 'pending',
    };
    setReports((prev) => [newReport, ...prev]);
    showToast('Report submitted for admin review. Thank you for keeping IT LABS safe!', 'info');
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
      showToast('Educational post published to IT LABS feed!');
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
    showToast(`Welcome to IT LABS, ${authenticatedUser.name}!`);
  };

  const handleLogout = async () => {
    try {
      await logoutFirebase();
      setIsLoggedIn(false);
      setCurrentUser(CURRENT_USER);
      setCurrentView('landing');
      showToast('Signed out of IT LABS', 'info');
    } catch (error) {
      console.error('Logout error:', error);
      setIsLoggedIn(false);
      setCurrentUser(CURRENT_USER);
      setCurrentView('landing');
      showToast('Signed out of IT LABS', 'info');
    }
  };

  const handleQuickLogin = (userId: string) => {
    const target = users.find((u) => u.id === userId) || CURRENT_USER;
    setCurrentUser(target);
    setViewedUser(target);
    setIsLoggedIn(true);
    setCurrentView('feed');
    showToast(`Logged in as ${target.name} (${target.role === 'teacher_expert' ? 'Expert' : 'Student'})`);
  };

  const handleSwitchUser = (user: User) => {
    setCurrentUser(user);
    setViewedUser(user);
    showToast(`Switched active profile to ${user.name}`);
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

  // Admin actions
  const handleToggleUserVerification = (userId: string) => {
    setUsers((prev) =>
      prev.map((u) => {
        if (u.id === userId) {
          const next = !u.isVerified;
          showToast(`Updated verification badge for ${u.name}`);
          return { ...u, isVerified: next };
        }
        return u;
      })
    );
  };

  const handleToggleFeaturedPost = (postId: string) => {
    setPosts((prev) =>
      prev.map((p) => {
        if (p.id === postId) {
          const next = !p.isFeatured;
          showToast(next ? 'Post marked as Featured on Feed!' : 'Post removed from Featured');
          return { ...p, isFeatured: next };
        }
        return p;
      })
    );
  };

  const handleDeletePost = async (postId: string) => {
    const postToDelete = posts.find((p) => p.id === postId);
    const isPostAuthor = postToDelete && (postToDelete.authorId === currentUser.id || postToDelete.author.id === currentUser.id);
    const isAdminUser = !!currentUser.isAdmin || currentUser.email === 'ecode2544@gmail.com';

    if (!isPostAuthor && !isAdminUser) {
      showToast('Permission denied: You can only delete your own educational posts.', 'error');
      return;
    }

    try {
      await deletePostInFirestore(postId, currentUser.id, isAdminUser);
      setPosts((prev) => prev.filter((p) => p.id !== postId));
      setReports((prev) => prev.filter((r) => r.postId !== postId));
      showToast('Educational post deleted successfully', 'success');
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
    const isAdminUser = !!currentUser.isAdmin || currentUser.email === 'ecode2544@gmail.com';

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

  const handleResolveReport = (reportId: string, action: 'dismiss' | 'delete') => {
    const targetReport = reports.find((r) => r.id === reportId);
    if (!targetReport) return;

    if (action === 'delete') {
      handleDeletePost(targetReport.postId);
      showToast('Flagged post removed and report resolved');
    } else {
      showToast('Report dismissed');
    }

    setReports((prev) =>
      prev.map((r) => (r.id === reportId ? { ...r, status: 'reviewed' as const } : r))
    );
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
        onSwitchUser={handleSwitchUser}
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
          onQuickLogin={handleQuickLogin}
          onCancel={() => setCurrentView('landing')}
        />
      ) : (
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-6 flex-1 w-full pb-24 md:pb-12">
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
                />
              )}

              {currentView === 'explore' && (
                <ExploreView
                  activeCategory={activeExploreCategory}
                  onSelectCategory={setActiveExploreCategory}
                  posts={posts.length > 0 ? posts : INITIAL_POSTS}
                  creators={users}
                  currentUser={currentUser}
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onFollowToggle={handleFollowToggle}
                  onShare={(p) => setShareModalPost(p)}
                  onAddComment={handleAddComment}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSelectUser={handleSelectUser}
                  onPreviewMedia={(m) => setPreviewMedia(m)}
                  onToast={showToast}
                />
              )}

              {currentView === 'profile' && (
                <ProfileView
                  user={viewedUser}
                  currentUser={currentUser}
                  allPosts={posts}
                  onFollowToggle={handleFollowToggle}
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onShare={(p) => setShareModalPost(p)}
                  onAddComment={handleAddComment}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSelectUser={handleSelectUser}
                  onSelectCategory={handleSelectCategory}
                  onBackToFeed={() => setCurrentView('feed')}
                  onPreviewMedia={(m) => setPreviewMedia(m)}
                  onToast={showToast}
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
                  onLikeToggle={handleLikeToggle}
                  onSaveToggle={handleSaveToggle}
                  onFollowToggle={handleFollowToggle}
                  onShare={(p) => setShareModalPost(p)}
                  onAddComment={handleAddComment}
                  onReportPost={handleReportPost}
                  onDeletePost={handleDeletePost}
                  onDeleteAttachment={handleDeleteAttachment}
                  onSelectUser={handleSelectUser}
                  onSelectCategory={handleSelectCategory}
                  onPreviewMedia={(m) => setPreviewMedia(m)}
                  onToast={showToast}
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
                />
              )}

              {currentView === 'admin' && (
                <AdminDashboardView
                  users={users}
                  posts={posts}
                  reports={reports}
                  onToggleUserVerification={handleToggleUserVerification}
                  onToggleFeaturedPost={handleToggleFeaturedPost}
                  onDeletePost={handleDeletePost}
                  onResolveReport={handleResolveReport}
                  onSelectUser={handleSelectUser}
                />
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

      {/* Mobile Bottom Navigation Bar */}
      <MobileNav
        currentView={currentView}
        onNavigate={(view) => {
          if (view === 'profile') setViewedUser(currentUser);
          setCurrentView(view);
        }}
        savedCount={savedPostsCount}
      />
    </div>
  );
}
