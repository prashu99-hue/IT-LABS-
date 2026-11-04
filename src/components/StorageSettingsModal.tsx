import React, { useState } from 'react';
import {
  Cloud,
  CheckCircle,
  AlertCircle,
  ExternalLink,
  X,
  Server,
  UploadCloud,
  Sparkles,
  Key
} from 'lucide-react';
import { getStorageConfig, saveStorageConfig, StorageConfig } from '../services/storageService';

interface StorageSettingsModalProps {
  isOpen: boolean;
  onClose: () => void;
  onSaved?: () => void;
}

export const StorageSettingsModal: React.FC<StorageSettingsModalProps> = ({
  isOpen,
  onClose,
  onSaved,
}) => {
  const [config, setConfig] = useState<StorageConfig>(getStorageConfig());
  const [testStatus, setTestStatus] = useState<'idle' | 'testing' | 'success' | 'error'>('idle');
  const [testMessage, setTestMessage] = useState('');

  if (!isOpen) return null;

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    saveStorageConfig(config);
    if (onSaved) onSaved();
    onClose();
  };

  const handleTestConnection = async () => {
    setTestStatus('testing');
    setTestMessage('Testing storage endpoints...');

    try {
      // 1. If Cloudinary is configured, test Cloudinary
      if (config.cloudinaryCloudName && config.cloudinaryUploadPreset) {
        const formData = new FormData();
        // 1x1 test image
        const blob = new Blob(
          [Uint8Array.from(atob('R0lGODlhAQABAIAAAAAAAP///yH5BAEAAAAALAAAAAABAAEAAAIBRAA7'), (c) => c.charCodeAt(0))],
          { type: 'image/gif' }
        );
        formData.append('file', blob);
        formData.append('upload_preset', config.cloudinaryUploadPreset);

        const res = await fetch(`https://api.cloudinary.com/v1_1/${config.cloudinaryCloudName}/image/upload`, {
          method: 'POST',
          body: formData,
        });

        if (res.ok) {
          const data = await res.json();
          setTestStatus('success');
          setTestMessage(`Connected to Cloudinary! Test URL: ${data.secure_url}`);
          return;
        } else {
          const err = await res.text();
          throw new Error(`Cloudinary test error (${res.status}): ${err}`);
        }
      }

      // 2. Otherwise test local server storage
      const res = await fetch('/api/health');
      if (res.ok) {
        setTestStatus('success');
        setTestMessage('IT LABS Server Storage is online and ready for persistent uploads.');
      } else {
        throw new Error(`Server returned status ${res.status}`);
      }
    } catch (err: any) {
      setTestStatus('error');
      setTestMessage(err.message || 'Connection test failed');
    }
  };

  return (
    <div
      role="dialog"
      aria-modal="true"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-xs animate-in fade-in duration-200"
    >
      <div className="bg-white rounded-3xl max-w-lg w-full p-6 sm:p-7 shadow-2xl border border-slate-200">
        <div className="flex items-center justify-between pb-4 border-b border-slate-100">
          <div className="flex items-center gap-2.5">
            <div className="w-10 h-10 rounded-2xl bg-blue-50 text-blue-600 border border-blue-100 flex items-center justify-center">
              <Cloud className="w-5 h-5" />
            </div>
            <div>
              <h3 className="text-base font-bold text-slate-900">
                Persistent Image Storage Settings
              </h3>
              <p className="text-xs text-slate-500">
                Configure permanent media hosting for IT LABS
              </p>
            </div>
          </div>
          <button
            onClick={onClose}
            className="p-1.5 text-slate-400 hover:text-slate-600 rounded-xl hover:bg-slate-100 transition-colors"
          >
            <X className="w-4 h-4" />
          </button>
        </div>

        <form onSubmit={handleSave} className="space-y-4 pt-4">
          {/* Active Provider Indicator */}
          <div className="p-3.5 bg-blue-50/70 border border-blue-200 rounded-2xl flex items-start gap-3">
            <Server className="w-4 h-4 text-blue-600 shrink-0 mt-0.5" />
            <div className="text-xs text-blue-900">
              <p className="font-bold">Zero-Budget Storage Pipeline Active</p>
              <p className="text-[11px] text-blue-700 mt-0.5 leading-relaxed">
                Images are automatically saved via the server backend into permanent static URLs (<code className="bg-blue-100 px-1 rounded font-mono">/uploads/img_*.png</code>).
                Optionally, connect a free Cloudinary account for global CDN delivery.
              </p>
            </div>
          </div>

          {/* Cloudinary Section */}
          <div className="space-y-3 pt-1">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <UploadCloud className="w-3.5 h-3.5 text-indigo-600" />
                <span>Cloudinary Free Tier (Optional CDN)</span>
              </label>
              <a
                href="https://cloudinary.com/users/register_free"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Free 25GB Signup</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Cloud Name
                </label>
                <input
                  type="text"
                  value={config.cloudinaryCloudName || ''}
                  onChange={(e) => setConfig({ ...config, cloudinaryCloudName: e.target.value.trim() })}
                  placeholder="e.g. it-labs-media"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>

              <div>
                <label className="block text-[11px] font-medium text-slate-600 mb-1">
                  Unsigned Preset
                </label>
                <input
                  type="text"
                  value={config.cloudinaryUploadPreset || ''}
                  onChange={(e) => setConfig({ ...config, cloudinaryUploadPreset: e.target.value.trim() })}
                  placeholder="e.g. it_labs_preset"
                  className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
                />
              </div>
            </div>
          </div>

          {/* ImgBB Section */}
          <div className="space-y-2 pt-2 border-t border-slate-100">
            <div className="flex items-center justify-between">
              <label className="text-xs font-bold text-slate-800 flex items-center gap-1.5">
                <Key className="w-3.5 h-3.5 text-teal-600" />
                <span>ImgBB API Key (Optional)</span>
              </label>
              <a
                href="https://api.imgbb.com/"
                target="_blank"
                rel="noreferrer"
                className="text-[11px] text-blue-600 hover:underline flex items-center gap-1"
              >
                <span>Get Free Key</span>
                <ExternalLink className="w-3 h-3" />
              </a>
            </div>
            <input
              type="text"
              value={config.imgbbApiKey || ''}
              onChange={(e) => setConfig({ ...config, imgbbApiKey: e.target.value.trim() })}
              placeholder="e.g. 7e02198a847aa98d0a2a..."
              className="w-full px-3 py-2 bg-slate-50 border border-slate-200 rounded-xl text-xs font-mono text-slate-900 focus:outline-hidden focus:bg-white focus:border-blue-500"
            />
          </div>

          {/* Connection Test Output */}
          {testStatus !== 'idle' && (
            <div
              className={`p-3 rounded-xl border text-xs flex items-start gap-2 ${
                testStatus === 'success'
                  ? 'bg-emerald-50 border-emerald-200 text-emerald-800'
                  : testStatus === 'error'
                  ? 'bg-rose-50 border-rose-200 text-rose-800'
                  : 'bg-slate-50 border-slate-200 text-slate-600'
              }`}
            >
              {testStatus === 'success' && <CheckCircle className="w-4 h-4 text-emerald-600 shrink-0 mt-0.5" />}
              {testStatus === 'error' && <AlertCircle className="w-4 h-4 text-rose-600 shrink-0 mt-0.5" />}
              {testStatus === 'testing' && <Sparkles className="w-4 h-4 text-blue-600 animate-spin shrink-0 mt-0.5" />}
              <div className="break-all leading-relaxed">{testMessage}</div>
            </div>
          )}

          {/* Action Buttons */}
          <div className="pt-3 flex items-center justify-between gap-3">
            <button
              type="button"
              onClick={handleTestConnection}
              className="px-3.5 py-2 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl text-xs font-semibold transition-colors"
            >
              Test Connection
            </button>
            <div className="flex items-center gap-2">
              <button
                type="button"
                onClick={onClose}
                className="px-4 py-2 text-slate-600 hover:text-slate-800 text-xs font-medium"
              >
                Cancel
              </button>
              <button
                type="submit"
                className="px-5 py-2 bg-blue-600 hover:bg-blue-700 text-white rounded-xl text-xs font-semibold shadow-xs transition-colors"
              >
                Save Settings
              </button>
            </div>
          </div>
        </form>
      </div>
    </div>
  );
};
