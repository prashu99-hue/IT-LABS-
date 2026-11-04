import React, { useState } from 'react';
import {
  X,
  Download,
  ExternalLink,
  Copy,
  Check,
  FileText,
  Code2,
  ZoomIn,
  ZoomOut,
  Maximize2,
  Play,
  Pause,
  Volume2,
  VolumeX,
  FileCode,
  FileCheck
} from 'lucide-react';
import { MediaAttachment } from '../types';
import { downloadMediaResource } from '../utils/downloadHelper';

interface MediaPreviewModalProps {
  media: MediaAttachment | null;
  onClose: () => void;
  onToast: (msg: string, type?: 'success' | 'info' | 'error') => void;
}

export const MediaPreviewModal: React.FC<MediaPreviewModalProps> = ({
  media,
  onClose,
  onToast,
}) => {
  const [isDownloading, setIsDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState<number | null>(null);
  const [downloadStatus, setDownloadStatus] = useState<string>('');
  const [zoomLevel, setZoomLevel] = useState<number>(1);
  const [copiedCode, setCopiedCode] = useState(false);

  if (!media) return null;

  const handleDownload = async () => {
    setIsDownloading(true);
    setDownloadProgress(0);
    setDownloadStatus('Starting download...');
    try {
      await downloadMediaResource(media, (pct, status) => {
        setDownloadProgress(pct);
        setDownloadStatus(status);
      });
      onToast(`Downloaded ${media.originalName} (${media.sizeFormatted})`, 'success');
    } catch (err: any) {
      onToast(`Download error: ${err.message || 'Failed to download'}`, 'error');
    } finally {
      setTimeout(() => {
        setIsDownloading(false);
        setDownloadProgress(null);
        setDownloadStatus('');
      }, 1000);
    }
  };

  const handleCopyCode = () => {
    if (!media.codeContent) return;
    navigator.clipboard.writeText(media.codeContent);
    setCopiedCode(true);
    onToast('Code copied to clipboard', 'info');
    setTimeout(() => setCopiedCode(false), 2000);
  };

  const handleOpenSeparately = () => {
    if (media.url) {
      window.open(media.url, '_blank', 'noopener,noreferrer');
    }
  };

  const isImage = media.category === 'image';
  const isVideo = media.category === 'video';
  const isPdf = media.category === 'pdf';
  const isCode = media.category === 'code';

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-3 sm:p-5 bg-slate-950/80 backdrop-blur-sm animate-in fade-in duration-150">
      <div className="bg-white rounded-3xl max-w-4xl w-full max-h-[92vh] flex flex-col shadow-2xl border border-slate-200/80 overflow-hidden">
        
        {/* Modal Top Bar */}
        <div className="px-5 py-3.5 border-b border-slate-200/80 flex items-center justify-between gap-3 bg-white shrink-0">
          <div className="flex items-center gap-3 min-w-0">
            <div className="w-9 h-9 rounded-xl bg-blue-50 text-blue-700 flex items-center justify-center shrink-0 border border-blue-100 font-bold text-xs uppercase">
              {media.extension}
            </div>
            <div className="min-w-0">
              <h3 className="text-sm font-bold text-slate-900 truncate">
                {media.originalName}
              </h3>
              <div className="flex items-center gap-2 text-[11px] text-slate-500">
                <span className="uppercase font-semibold text-blue-600">{media.category}</span>
                <span aria-hidden="true">·</span>
                <span className="tabular-nums font-mono">{media.sizeFormatted}</span>
                <span aria-hidden="true">·</span>
                <span>{media.uploadedAt}</span>
              </div>
            </div>
          </div>

          {/* Action buttons */}
          <div className="flex items-center gap-2 shrink-0">
            {/* Download Button */}
            <button
              onClick={handleDownload}
              disabled={isDownloading}
              className="px-3.5 py-1.5 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-all flex items-center gap-1.5 disabled:bg-slate-300"
              title="Download original file"
            >
              <Download className="w-3.5 h-3.5" />
              <span>{isDownloading ? `${downloadProgress ?? 0}%` : 'Download'}</span>
            </button>

            {/* Open separate tab */}
            <button
              onClick={handleOpenSeparately}
              className="p-2 text-slate-500 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors hidden sm:flex"
              title="Open resource in new tab"
            >
              <ExternalLink className="w-4 h-4" />
            </button>

            {/* Close */}
            <button
              onClick={onClose}
              className="p-2 text-slate-400 hover:text-slate-800 hover:bg-slate-100 rounded-xl transition-colors"
              title="Close preview"
            >
              <X className="w-5 h-5" />
            </button>
          </div>
        </div>

        {/* Download progress banner if active */}
        {isDownloading && (
          <div className="px-5 py-2 bg-blue-50 border-b border-blue-100 flex items-center justify-between text-xs text-blue-800">
            <div className="flex items-center gap-2">
              <div className="w-3 h-3 rounded-full border-2 border-blue-600 border-t-transparent animate-spin" />
              <span>{downloadStatus}</span>
            </div>
            <span className="font-mono font-bold">{downloadProgress}%</span>
          </div>
        )}

        {/* Modal Body / Viewer Stage */}
        <div className="flex-1 overflow-auto bg-slate-900/5 min-h-[300px] flex items-center justify-center relative p-4">
          
          {/* 1. Image Viewer */}
          {isImage && (
            <div className="relative w-full h-full flex flex-col items-center justify-center overflow-auto min-h-[380px]">
              <div className="absolute top-2 right-2 z-10 flex items-center gap-1 bg-white/90 backdrop-blur-xs p-1 rounded-xl shadow-xs border border-slate-200">
                <button
                  onClick={() => setZoomLevel((z) => Math.max(0.5, z - 0.25))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700"
                  title="Zoom Out"
                >
                  <ZoomOut className="w-4 h-4" />
                </button>
                <span className="text-[11px] font-mono px-1 font-semibold text-slate-600">
                  {Math.round(zoomLevel * 100)}%
                </span>
                <button
                  onClick={() => setZoomLevel((z) => Math.min(2.5, z + 0.25))}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700"
                  title="Zoom In"
                >
                  <ZoomIn className="w-4 h-4" />
                </button>
                <button
                  onClick={() => setZoomLevel(1)}
                  className="p-1.5 hover:bg-slate-100 rounded-lg text-slate-700 text-[11px] font-medium"
                  title="Reset Zoom"
                >
                  Reset
                </button>
              </div>

              <img
                src={media.url}
                alt={media.originalName}
                style={{ transform: `scale(${zoomLevel})` }}
                className="max-h-[70vh] max-w-full object-contain rounded-xl shadow-md transition-transform duration-150"
              />
            </div>
          )}

          {/* 2. Video Player */}
          {isVideo && (
            <div className="w-full max-w-3xl flex flex-col items-center justify-center">
              <video
                controls
                autoPlay
                playsInline
                className="w-full max-h-[70vh] rounded-2xl shadow-xl bg-black"
                src={media.url}
              >
                Your browser does not support the video tag.
              </video>
              <p className="text-xs text-slate-500 mt-2 text-center">
                Embedded Educational Video · Format: {media.extension.toUpperCase()} · Use player controls to adjust playback & volume
              </p>
            </div>
          )}

          {/* 3. PDF Viewer */}
          {isPdf && (
            <div className="w-full h-full flex flex-col min-h-[500px]">
              <div className="flex items-center justify-between px-3 py-2 bg-slate-100 rounded-xl mb-3 text-xs text-slate-700 border border-slate-200">
                <div className="flex items-center gap-2">
                  <FileText className="w-4 h-4 text-rose-600" />
                  <span className="font-semibold">{media.originalName}</span>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={handleOpenSeparately}
                    className="flex items-center gap-1 px-2.5 py-1 bg-white hover:bg-slate-50 border border-slate-200 rounded-lg font-medium text-slate-700 transition-colors"
                  >
                    <ExternalLink className="w-3.5 h-3.5" />
                    <span>Open Document Separately</span>
                  </button>
                </div>
              </div>

              {/* Embedded Document Frame */}
              <div className="flex-1 w-full bg-white rounded-2xl border border-slate-200 shadow-inner overflow-hidden min-h-[460px] flex flex-col">
                <iframe
                  src={`${media.url}#toolbar=1&navpanes=0`}
                  title={media.originalName}
                  className="w-full flex-1 border-0 min-h-[450px]"
                />
              </div>
            </div>
          )}

          {/* 4. Code File Viewer with Syntax Formatting */}
          {isCode && (
            <div className="w-full h-full max-h-[70vh] flex flex-col bg-slate-950 rounded-2xl border border-slate-800 text-slate-100 overflow-hidden shadow-2xl">
              <div className="px-4 py-2.5 bg-slate-900 border-b border-slate-800 flex items-center justify-between text-xs">
                <div className="flex items-center gap-2">
                  <FileCode className="w-4 h-4 text-blue-400" />
                  <span className="font-mono text-slate-300 font-semibold">{media.originalName}</span>
                  <span className="text-[11px] text-slate-500 uppercase">({media.extension})</span>
                </div>

                <div className="flex items-center gap-2">
                  <button
                    onClick={handleCopyCode}
                    className="flex items-center gap-1 px-2.5 py-1 bg-slate-800 hover:bg-slate-700 text-slate-200 rounded-lg text-[11px] font-mono transition-colors"
                  >
                    {copiedCode ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
                    <span>{copiedCode ? 'Copied' : 'Copy Code'}</span>
                  </button>
                </div>
              </div>

              <div className="p-4 overflow-auto flex-1 font-mono text-xs leading-relaxed text-slate-200 select-text">
                <pre className="whitespace-pre">
                  <code>{media.codeContent || '// File content loading or empty'}</code>
                </pre>
              </div>
            </div>
          )}

        </div>

        {/* Modal Footer */}
        <div className="px-5 py-3 bg-white border-t border-slate-200/80 flex items-center justify-between text-xs text-slate-500">
          <div className="flex items-center gap-2">
            <span className="font-medium text-slate-700">{media.originalName}</span>
            <span>·</span>
            <span>{media.sizeFormatted}</span>
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={onClose}
              className="px-4 py-1.5 text-slate-600 hover:text-slate-900 font-medium rounded-xl hover:bg-slate-100 transition-colors"
            >
              Close
            </button>
            <button
              onClick={handleDownload}
              className="px-4 py-1.5 bg-blue-600 hover:bg-blue-700 text-white font-semibold rounded-xl flex items-center gap-1.5 transition-colors shadow-xs"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Download File</span>
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};
