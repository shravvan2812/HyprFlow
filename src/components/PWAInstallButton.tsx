import React, { useState } from 'react';
import { Download, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC<{ compact?: boolean }> = ({ compact = false }) => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  // If already running as an installed PWA, hide the button
  if (isInstalled) {
    return null;
  }

  // Chromium / Android / Desktop flow
  if (isInstallable) {
    return (
      <button
        onClick={install}
        title="Install native desktop app / PWA"
        className={`flex items-center gap-1.5 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 hover:text-white hover:bg-zinc-800 transition font-mono cursor-pointer ${
          compact ? 'px-2 py-1 text-xs' : 'px-3 py-1.5 text-xs font-medium'
        }`}
      >
        <Download className="w-3.5 h-3.5" />
        <span>Install</span>
      </button>
    );
  }

  // iOS Safari flow
  if (isIOS) {
    return (
      <>
        <button
          onClick={() => setShowIOSGuide(true)}
          title="Install on iOS Safari"
          className="flex items-center gap-1.5 rounded-lg bg-zinc-900 text-zinc-300 border border-zinc-800 px-2 py-1 text-xs hover:text-white hover:bg-zinc-800 transition font-mono cursor-pointer"
        >
          <Download className="w-3.5 h-3.5" />
          <span>Install</span>
        </button>

        {showIOSGuide && (
          <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-xs p-4 font-sans text-white">
            <div className="w-full max-w-sm rounded-2xl bg-zinc-950 border border-zinc-800 p-6 shadow-2xl space-y-4">
              <div className="flex items-center justify-between">
                <h3 className="text-sm font-semibold text-white">Install on iOS</h3>
                <button
                  onClick={() => setShowIOSGuide(false)}
                  className="p-1 text-zinc-400 hover:text-white cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-xs text-zinc-400 leading-relaxed font-mono">
                1. Tap the Share button in Safari.<br />
                2. Select "Add to Home Screen".
              </p>
              <button
                onClick={() => setShowIOSGuide(false)}
                className="w-full py-2 bg-white text-black font-semibold rounded-xl text-xs hover:bg-zinc-200 transition cursor-pointer"
              >
                Done
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
