import React, { useState } from 'react';
import { Shield, Copy, Check, ExternalLink, X, AlertTriangle } from 'lucide-react';

interface FirestoreRulesModalProps {
  isOpen: boolean;
  onClose: () => void;
  errorPath?: string | null;
}

const FIRESTORE_RULES_CONTENT = `rules_version = '2';

service cloud.firestore {
  match /databases/{database}/documents {

    function isSignedIn() {
      return request.auth != null;
    }

    function isOwner(userId) {
      return isSignedIn() && request.auth.uid == userId;
    }

    function isAdmin() {
      return isSignedIn() && (
        request.auth.token.email == 'ecode2544@gmail.com' ||
        exists(/databases/$(database)/documents/admins/$(request.auth.uid))
      );
    }

    function isValidUserProfile(data) {
      return data.name is string && data.name.size() > 0 && data.name.size() <= 120 &&
             data.email is string &&
             (data.role == 'student' || data.role == 'teacher_expert') &&
             (!('bio' in data) || (data.bio is string && data.bio.size() <= 2000)) &&
             (!('institution' in data) || (data.institution is string && data.institution.size() <= 200)) &&
             (!('title' in data) || (data.title is string && data.title.size() <= 150));
    }

    match /users/{userId} {
      allow read: if true;
      allow create: if isOwner(userId) &&
                       isValidUserProfile(request.resource.data) &&
                       request.resource.data.id == request.auth.uid &&
                       (!('isAdmin' in request.resource.data) || request.resource.data.isAdmin == false);
      allow update: if isOwner(userId) &&
                       isValidUserProfile(request.resource.data) &&
                       request.resource.data.id == resource.data.id &&
                       (!request.resource.data.diff(resource.data).affectedKeys().hasAny(['isAdmin']) || isAdmin());
      allow delete: if isAdmin();
    }

    match /admins/{adminId} {
      allow read: if isSignedIn();
      allow write: if isAdmin();
    }

    match /posts/{postId} {
      allow read: if true;
      allow create: if isSignedIn() &&
                       request.resource.data.authorId == request.auth.uid &&
                       request.resource.data.title is string &&
                       request.resource.data.title.size() > 0 &&
                       request.resource.data.description is string &&
                       request.resource.data.description.size() > 0 &&
                       (!('category' in request.resource.data) || request.resource.data.category is string) &&
                       (!('difficulty' in request.resource.data) || request.resource.data.difficulty is string);

      allow update: if isSignedIn() && (
        (resource.data.authorId == request.auth.uid && request.resource.data.authorId == resource.data.authorId) ||
        request.resource.data.diff(resource.data).affectedKeys().hasOnly(['likesCount', 'commentsCount', 'savesCount', 'updatedAt']) ||
        isAdmin()
      );

      allow delete: if isSignedIn() && (resource.data.authorId == request.auth.uid || isAdmin());

      match /likes/{userId} {
        allow read: if true;
        allow create, delete: if isSignedIn() && request.auth.uid == userId;
        allow update: if false;
      }

      match /comments/{commentId} {
        allow read: if true;
        allow create: if isSignedIn() &&
                         request.resource.data.authorId == request.auth.uid &&
                         request.resource.data.postId == postId &&
                         request.resource.data.content is string &&
                         request.resource.data.content.size() > 0;
        allow update, delete: if isSignedIn() && (resource.data.authorId == request.auth.uid || isAdmin());
      }
    }
  }
}`;

export const FirestoreRulesModal: React.FC<FirestoreRulesModalProps> = ({
  isOpen,
  onClose,
  errorPath,
}) => {
  const [copied, setCopied] = useState(false);

  if (!isOpen) return null;

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(FIRESTORE_RULES_CONTENT);
      setCopied(true);
      setTimeout(() => setCopied(false), 2500);
    } catch (e) {
      // fallback
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200">
      <div className="bg-white rounded-3xl max-w-2xl w-full p-6 sm:p-8 shadow-2xl border border-slate-200 max-h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-start justify-between gap-4 pb-4 border-b border-slate-100">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 rounded-2xl bg-amber-100 text-amber-700 flex items-center justify-center shrink-0">
              <Shield className="w-5 h-5" />
            </div>
            <div>
              <h2 className="text-base sm:text-lg font-bold text-slate-900">
                Firestore Security Rules Update Required
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Target Project: <span className="font-mono text-blue-600 font-semibold">it-labs-47fb8</span>
                {errorPath ? ` · Path: ${errorPath}` : ''}
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 rounded-lg text-slate-400 hover:text-slate-700 hover:bg-slate-100 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Instructions */}
        <div className="py-4 space-y-3 text-xs text-slate-600 flex-1 overflow-y-auto">
          <div className="p-3 rounded-xl bg-amber-50 border border-amber-200 text-amber-900 flex items-start gap-2.5">
            <AlertTriangle className="w-4 h-4 text-amber-600 shrink-0 mt-0.5" />
            <div className="leading-relaxed">
              Cloud Firestore blocked the post write because your remote Firebase project has not yet had rules published for the <span className="font-mono font-semibold">posts</span> collection. Follow the 2 steps below to enable publishing.
            </div>
          </div>

          <div className="space-y-2">
            <div className="font-semibold text-slate-800">Quick 2-Step Activation:</div>
            <ol className="list-decimal list-inside space-y-1.5 text-slate-600 pl-1">
              <li>
                Click <span className="font-semibold">Copy Rules</span> below.
              </li>
              <li>
                Open the Firebase Console, paste into the Rules tab, and click <span className="font-semibold text-blue-600">Publish</span>.
              </li>
            </ol>
          </div>

          {/* Rules code box */}
          <div className="relative rounded-2xl bg-slate-900 p-4 font-mono text-[11px] text-slate-300 overflow-x-auto max-h-56 border border-slate-800">
            <pre>{FIRESTORE_RULES_CONTENT}</pre>
          </div>
        </div>

        {/* Actions */}
        <div className="pt-4 border-t border-slate-100 flex flex-col sm:flex-row items-center justify-between gap-3">
          <a
            href="https://console.firebase.google.com/project/it-labs-47fb8/firestore/rules"
            target="_blank"
            rel="noopener noreferrer"
            className="w-full sm:w-auto inline-flex items-center justify-center gap-1.5 px-4 py-2.5 rounded-xl border border-slate-200 text-xs font-semibold text-slate-700 hover:bg-slate-50 transition-colors"
          >
            <span>Open Firebase Console Rules</span>
            <ExternalLink className="w-3.5 h-3.5 text-slate-400" />
          </a>

          <div className="w-full sm:w-auto flex items-center gap-2">
            <button
              onClick={handleCopy}
              className="flex-1 sm:flex-none inline-flex items-center justify-center gap-1.5 px-5 py-2.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-sm transition-all"
            >
              {copied ? (
                <>
                  <Check className="w-4 h-4 text-emerald-300" />
                  <span>Copied to Clipboard!</span>
                </>
              ) : (
                <>
                  <Copy className="w-4 h-4" />
                  <span>Copy Rules to Clipboard</span>
                </>
              )}
            </button>
            <button
              onClick={onClose}
              className="px-4 py-2.5 rounded-xl text-xs font-semibold text-slate-500 hover:text-slate-800 hover:bg-slate-100 transition-colors"
            >
              Dismiss
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
