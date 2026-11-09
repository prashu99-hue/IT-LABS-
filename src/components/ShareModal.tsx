import React, { useState } from 'react';
import { X, Copy, Check, Share2, Twitter, Linkedin, ExternalLink } from 'lucide-react';
import { Post } from '../types';

interface ShareModalProps {
  post: Post | null;
  onClose: () => void;
  onToast: (msg: string) => void;
}

export const ShareModal: React.FC<ShareModalProps> = ({ post, onClose, onToast }) => {
  const [copied, setCopied] = useState(false);

  if (!post) return null;

  const shareUrl = `${window.location.origin}/post/${post.id}`;

  const handleCopy = () => {
    navigator.clipboard.writeText(shareUrl);
    setCopied(true);
    onToast('Post link copied to clipboard!');
    setTimeout(() => setCopied(false), 2000);
  };

  const shareTwitter = () => {
    const text = encodeURIComponent(`Check out this educational post on LearnNova: "${post.title}" by ${post.author.name}`);
    window.open(`https://twitter.com/intent/tweet?text=${text}&url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  const shareLinkedin = () => {
    window.open(`https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(shareUrl)}`, '_blank');
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-xs">
      <div className="bg-white rounded-2xl max-w-md w-full shadow-2xl border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-150">
        <div className="flex items-center justify-between px-5 py-4 border-b border-slate-100">
          <div className="flex items-center gap-2">
            <Share2 className="w-4 h-4 text-blue-600" />
            <h3 className="font-semibold text-slate-900 text-sm">Share Educational Resource</h3>
          </div>
          <button
            onClick={onClose}
            className="text-slate-400 hover:text-slate-600 p-1 rounded-lg hover:bg-slate-50 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-5 space-y-4">
          <div className="p-3 bg-slate-50 rounded-xl border border-slate-100">
            <span className="text-xs font-semibold text-blue-600 tracking-wide uppercase">{post.subject}</span>
            <p className="text-sm font-medium text-slate-800 line-clamp-2 mt-0.5">{post.title}</p>
            <p className="text-xs text-slate-500 mt-1">Shared by {post.author.name}</p>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-1.5">Direct Resource Link</label>
            <div className="flex items-center gap-2">
              <input
                type="text"
                readOnly
                value={shareUrl}
                className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-lg text-xs font-mono text-slate-700 select-all focus:outline-hidden"
              />
              <button
                onClick={handleCopy}
                className="px-3 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-lg text-xs font-medium flex items-center gap-1.5 transition-colors shrink-0"
              >
                {copied ? <Check className="w-3.5 h-3.5" /> : <Copy className="w-3.5 h-3.5" />}
                <span>{copied ? 'Copied' : 'Copy'}</span>
              </button>
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-slate-600 mb-2">Share on Social & Learning Networks</label>
            <div className="grid grid-cols-2 gap-2">
              <button
                onClick={shareTwitter}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
              >
                <Twitter className="w-4 h-4 text-sky-500" />
                <span>X / Twitter</span>
              </button>
              <button
                onClick={shareLinkedin}
                className="flex items-center justify-center gap-2 px-3 py-2 border border-slate-200 rounded-xl hover:bg-slate-50 text-xs font-medium text-slate-700 transition-colors"
              >
                <Linkedin className="w-4 h-4 text-blue-700" />
                <span>LinkedIn</span>
              </button>
            </div>
          </div>
        </div>

        <div className="px-5 py-3 bg-slate-50 border-t border-slate-100 flex justify-end">
          <button
            onClick={onClose}
            className="px-4 py-1.5 text-xs font-medium text-slate-600 hover:text-slate-900 rounded-lg transition-colors"
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
};
