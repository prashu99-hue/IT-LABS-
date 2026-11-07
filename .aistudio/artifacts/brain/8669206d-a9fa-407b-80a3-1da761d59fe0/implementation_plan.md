# Implementation Plan — IT LABS Admin Dashboard & Moderation System

## 1. Project Inspection & Current State Assessment

A thorough inspection of the existing IT LABS codebase reveals the following baseline:

1. **Admin Dashboard UI & Routes**:
   - `src/components/AdminDashboardView.tsx` currently exists as a UI prototype with 3 tabs: **User Management**, **Content Management**, and **Reported Queue**.
   - Navigation route `'admin'` is defined in `AppView` (`src/types.ts`), but the link in `Sidebar.tsx` and `MobileNav.tsx` is currently displayed to all users unconditionally.
   - Metric counters (+14,200 users, +380 verified educators, +4,890 resources) use hardcoded offsets rather than live database telemetry.

2. **Firebase Authentication**:
   - Client is connected to Firebase project `it-labs-47fb8` via `src/firebase/config.ts`.
   - `subscribeToFirebaseAuthState` in `src/services/authService.ts` tracks active sessions.
   - User registration explicitly forces `isAdmin: false` in the profile payload (`src/services/authService.ts`), correctly blocking client-side privilege self-assignment.

3. **Firestore Collections**:
   - `/users/{userId}`: User profiles keyed by Auth UID.
   - `/posts/{postId}`: Educational posts and attachments.
   - Subcollections: `/users/{userId}/following`, `/users/{userId}/followers`, `/posts/{postId}/likes`, `/posts/{postId}/comments`.

4. **Admin Role Verification & Security Rules**:
   - Current `firestore.rules` defines:
     ```javascript
     function isAdmin() {
       return isSignedIn() && (
         request.auth.token.email == 'ecode2544@gmail.com' ||
         exists(/databases/$(database)/documents/admins/$(request.auth.uid))
       );
     }
     ```
   - `/admins/{adminId}` is readable by signed-in users and writable only by administrators.
   - Root `/users/{userId}` rules already protect the `isAdmin` property from being modified by standard users (`!request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAdmin']) || isAdmin()`).
   - Root `/posts/{postId}` rules permit admins to update and delete any post.
   - **Current Gap**: The client UI relies on `currentUser.isAdmin || currentUser.email === 'ecode2544@gmail.com'`, with no real-time verification query against the trusted `/admins` collection or backend claims.

5. **Post Deletion & User Profile Management**:
   - `deletePostInFirestore` (`src/services/postService.ts`) deletes the post document and triggers server-side deletion of attached media files in `/public/uploads`.
   - `updateUserProfileInFirestore` (`src/services/authService.ts`) exists, but `handleToggleUserVerification` in `App.tsx` only updates local React state and never saves the badge change to Firestore.
   - `handleToggleFeaturedPost` in `App.tsx` only updates local React state and never saves the `isFeatured` flag to Firestore.

6. **Content Reporting System**:
   - `PostReport` type exists in `src/types.ts`.
   - In-memory reports exist in `src/data/mockData.ts` and `App.tsx`.
   - `PostCard.tsx` has a functional "Report Post" action.
   - **Current Gap**: Reports are purely in-memory and lost on refresh. No persistent Firestore `/reports` collection exists.

---

## 2. Security Architecture & Threat Model

```
┌────────────────────────────────────────────────────────┐
│                      Client Layer                      │
│  - Never trust client-side isAdmin flag                │
│  - Route guard: verifyAdminAccess(currentUser)         │
│  - Check email === 'ecode2544@gmail.com' OR            │
│    getDoc(/admins/{uid}).exists()                      │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│             Firestore Security Rules Layer             │
│  - isAdmin() helper enforces trusted check             │
│  - /admins/{uid}: Read-only except to admins           │
│  - /reports/{reportId}:                                │
│      * create: any signed-in user                      │
│      * read/update/delete: strictly isAdmin()          │
│  - /users/{userId}: only isAdmin() can update          │
│      isVerified, role, or delete profile               │
│  - /posts/{postId}: only author or isAdmin()           │
│      can delete post or toggle isFeatured              │
└──────────────────────────┬─────────────────────────────┘
                           │
                           ▼
┌────────────────────────────────────────────────────────┐
│            Backend Server (server.ts)                  │
│  - Authenticated media purge on post deletion          │
│  - Validates ownership/admin token before file removal │
└────────────────────────────────────────────────────────┘
```

1. **Zero Client Trust**:
   - The UI will never grant admin actions solely because `currentUser.isAdmin === true` in `localStorage`.
   - Access to the dashboard and moderation features will require checking the trusted server source:
     `doc(db, 'admins', auth.currentUser.uid)` or verified primary administrator email.
2. **Database Hardening**:
   - Standard users cannot read other users' reports or modify other users' badges.
   - Standard users cannot write to `/admins/{uid}`.
3. **Privacy Protection**:
   - The user management table will only display non-sensitive profile information (`name`, `username`, `role`, `institution`, `followersCount`, `isVerified`, `createdAt`).
   - Private email addresses and auth metadata will never be exposed in public views or admin lists.

---

## 3. Module Breakdown

### Module A: Admin Dashboard Overview & Real-Time Metrics
- **Live Platform Metrics**:
  - Total registered users (`getCountFromServer` / Firestore user collection query).
  - Total verified educators (`isVerified == true`).
  - Total educational posts & resources (`posts` collection count).
  - Pending reports counter (live query on `/reports` where `status == 'pending'`).
  - Storage & Media breakdown (images, videos, PDFs, code files).
- **System Health & Security Banner**:
  - Shows connected Firebase project ID (`it-labs-47fb8`).
  - Displays authenticated admin badge with verified timestamp.
  - Quick action buttons to navigate between Users, Posts, and Reports queues.

### Module B: User Management
- **User Roster Table**:
  - Live list of users fetched from Firestore.
  - Search by name, username, institution, or role.
  - Filter by role (`All`, `Student`, `Teacher / Expert`) and verification status (`All`, `Verified`, `Unverified`).
- **Moderation Actions**:
  - **Toggle Verification Badge**: Persist `isVerified: boolean` directly to `/users/{userId}` in Firestore with audit timestamp (`updatedAt`).
  - **Role Management**: Option for admins to promote verified scholars to `teacher_expert` or adjust academic titles.
  - **Account Suspension / Deletion**: Admin can delete spam accounts from `/users/{userId}` with confirmation modal (enforced by Firestore rules `allow delete: if isAdmin();`).

### Module C: Educational Post Management
- **Post Roster & Content Audit**:
  - List of educational posts from Firestore with thumbnail preview, author info, subject tag, difficulty, and creation date.
  - Search by title, author name, or keyword.
  - Filter by subject category (Java, Python, AI/ML, etc.) and difficulty.
- **Moderation Actions**:
  - **Feature Post**: Toggle `isFeatured: boolean` on `/posts/{postId}` in Firestore to showcase high-quality notes on the Home Feed.
  - **Purge Post & Attachments**: Admin delete action calling `deletePostInFirestore(postId, adminId, true)` which atomically deletes the Firestore document and server-side disk attachments.
  - **Direct Resource Inspection**: Link to open the post in full detail or preview its PDF/video/code attachments in the `MediaPreviewModal`.

### Module D: Reported Content Management
- **Persistent Firestore `/reports` Collection**:
  - Schema:
    ```typescript
    interface PostReport {
      id: string;
      postId: string;
      postTitle?: string;
      authorId?: string;
      reportedBy: string; // reporter username or uid
      reporterId: string;
      reason: string;
      category?: 'spam' | 'inaccurate_code' | 'plagiarism' | 'inappropriate';
      timestamp: any; // Firestore serverTimestamp
      status: 'pending' | 'reviewed' | 'dismissed';
      resolvedBy?: string;
      resolvedAt?: string;
    }
    ```
- **Community Reporting Flow**:
  - When a student or educator clicks "Report Post" on any `PostCard`, write the report directly to Firestore collection `/reports`.
- **Admin Review Queue**:
  - Shows pending reports with badge counter on the sidebar.
  - Displays post excerpt, reporter reason, and submission time.
  - **Actions**:
    1. **Dismiss Report**: Update report status to `'dismissed'` in Firestore.
    2. **Take Down Post**: Remove the offending post from Firestore and mark report `'reviewed'` with resolution note.

### Module E: Secure Admin Access Control
- **Security Check Helper (`adminService.ts`)**:
  - `checkIsUserAdmin(uid: string, email?: string): Promise<boolean>`
  - Checks if `email === 'ecode2544@gmail.com'` OR `getDoc(doc(db, 'admins', uid)).exists()`.
- **Navigation Guard**:
  - In `Sidebar.tsx` and `MobileNav.tsx`, only show the "Admin Dashboard" button if the current user is a verified administrator.
- **Route Guard (`App.tsx`)**:
  - If a non-admin navigates to `currentView === 'admin'`, render an "Access Denied" unauthorized screen with a button to return to the Home Feed.
  - Display admin-specific banner when active.

---

## 4. Proposed File Changes & Additions

| File | Action | Purpose |
| :--- | :--- | :--- |
| `src/services/adminService.ts` | **Create** | Dedicated service for verifying admin access, managing users, updating verification badges, fetching platform metrics, and managing reports in Firestore |
| `src/components/AdminDashboardView.tsx` | **Update** | Connect UI to real Firestore data, add live report queue actions, batch moderation, and user search/filtering |
| `src/components/Sidebar.tsx` | **Update** | Conditionally display "Admin Dashboard" nav item only to verified administrators |
| `src/components/MobileNav.tsx` | **Update** | Conditionally display admin navigation item on mobile |
| `src/App.tsx` | **Update** | Integrate `adminService`, load real-time admin status, handle report persistence, add access-control guard for `'admin'` view |
| `firestore.rules` | **Update** | Add rules for `/reports/{reportId}` collection; reinforce `/admins` and `/users` moderation privileges |
| `src/components/FirestoreRulesModal.tsx` | **Update** | Keep modal copy in sync with new `/reports` rules |
| `firebase-blueprint.json` | **Update** | Document the `reports` collection schema and permissions |

---

## 5. Required Firestore Security Rules Updates

```javascript
    // 2. Admins Collection (Restricted strictly to system administrators)
    match /admins/{adminId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    // 6. Content Moderation Reports Collection
    // Path: /reports/{reportId}
    match /reports/{reportId} {
      // Authenticated users can submit a report against a post
      allow create: if isSignedIn() &&
                       request.resource.data.reporterId == request.auth.uid &&
                       request.resource.data.postId is string &&
                       request.resource.data.reason is string &&
                       request.resource.data.reason.size() > 0 &&
                       request.resource.data.reason.size() <= 1000;

      // Only administrators can view the moderation queue
      allow read: if isAdmin();

      // Only administrators can update report status (dismiss / resolve) or delete reports
      allow update, delete: if isAdmin();
    }
```

---

## 6. Manual Firebase Console Setup

To grant administrative access to an account other than `ecode2544@gmail.com`:
1. Open the [Firebase Console Firestore Database](https://console.firebase.google.com/project/it-labs-47fb8/firestore/data).
2. Create a collection named `admins`.
3. Create a document where the **Document ID** is the user's **Firebase Authentication UID** (e.g. `admins/{uid}`).
4. Add fields:
   ```json
   {
     "email": "admin@itlabs.edu",
     "role": "super_admin",
     "grantedAt": "2026-11-04T08:00:00Z"
   }
   ```
5. Publish the updated `firestore.rules` in the Firebase Console.

---

## 7. Verification & Acceptance Criteria

1. **Access Control**:
   - Logged-in non-admin user cannot see the "Admin Dashboard" button in sidebar or mobile nav.
   - Manually setting `currentView = 'admin'` shows the "Access Denied" security screen.
   - Admin account (`ecode2544@gmail.com` or UID in `/admins`) unlocks the dashboard immediately.
2. **User Management**:
   - Clicking "Grant Verified" / "Revoke Badge" persists the change in Firestore `/users/{userId}`.
   - Refreshing the page preserves the updated badge state.
3. **Post Management**:
   - Clicking "Make Featured" updates `isFeatured: true` in Firestore; featured posts display a gold star badge across feeds.
   - Admin post deletion removes the document from Firestore and clears media from `/public/uploads`.
4. **Report Management**:
   - Submitting a post report from a regular student account writes to `/reports` in Firestore.
   - Report appears immediately in Admin Review Queue.
   - Dismissing the report or removing the post resolves the queue in real time.
5. **Regression Safety**:
   - Existing post publishing, multi-file attachments, individual attachment deletion, comments, likes, search, and follower/following features remain fully operational.

---

## 8. Implementation Status: COMPLETED ✅

All components and modules have been implemented and validated:
- `src/services/adminService.ts`: Real-time Firestore access verification, metrics, user badge/role updates, post deletion, and reports management.
- `src/components/AdminDashboardView.tsx`: Comprehensive dashboard with live metrics, User Management, Content Moderation, and Reported Queue tabs.
- `src/components/Sidebar.tsx` & `src/components/Navbar.tsx`: Secured with `isAdminVerified` guards and live pending report badges.
- `src/App.tsx`: Wired with real-time state sync, optimistic updates, error handling with rollbacks, and Route Guard blocking unauthenticated/unauthorized access.
- `firestore.rules`: Enhanced with `/reports/{reportId}` security rules, admin role enforcement, and non-self-promotion restrictions.
- `firebase-blueprint.json`: Synced with `/admins/{adminId}` and `/reports/{reportId}` collections.
- `src/components/FirestoreRulesModal.tsx`: Updated with the exact copy-pasteable rules for the user to publish in Firebase Console.
- Build & Lint check: `tsc --noEmit` and `vite build` completed with 0 errors.
