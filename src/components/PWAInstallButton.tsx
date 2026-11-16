import React, { useState } from 'react';
import { Download, Share, X } from 'lucide-react';
import { usePWAInstall } from '../hooks/usePWAInstall';

export const PWAInstallButton: React.FC = () => {
  const { isInstallable, isInstalled, isIOS, install } = usePWAInstall();
  const [showIOSGuide, setShowIOSGuide] = useState(false);

  if (isInstalled) {
    return null;
  }

  if (isInstallable) {
    return (
      <button
        type="button"
        onClick={install}
        className="w-full px-3.5 py-2.5 rounded-xl bg-[#1A73E8] hover:bg-[#1967D2] text-left text-sm font-medium text-white flex items-center justify-between cursor-pointer transition-colors"
      >
        <span className="flex items-center gap-2.5">
          <Download className="w-4 h-4" />
          <span>Install GMessages App</span>
        </span>
        <span className="text-[11px] opacity-85">Offline ready</span>
      </button>
    );
  }

  if (isIOS) {
    return (
      <>
        <button
          type="button"
          onClick={() => setShowIOSGuide(true)}
          className="w-full px-3.5 py-2.5 rounded-xl bg-[#2A2A2A] hover:bg-[#323232] text-left text-sm text-[#E8EAED] flex items-center gap-2.5 cursor-pointer"
        >
          <Share className="w-4 h-4 text-[#669DF6]" />
          <span>Install on iPhone / iPad</span>
        </button>

        {showIOSGuide && (
          <div
            className="fixed inset-0 z-[60] flex items-center justify-center bg-black/70 p-4"
            onClick={() => setShowIOSGuide(false)}
          >
            <div
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-sm rounded-3xl bg-[#202020] border border-white/10 p-5 shadow-2xl space-y-3"
            >
              <div className="flex items-center justify-between">
                <h3 className="text-base font-medium text-[#E8EAED]">
                  Install GMessages on iOS
                </h3>
                <button
                  type="button"
                  aria-label="Close install instructions"
                  onClick={() => setShowIOSGuide(false)}
                  className="w-8 h-8 rounded-full flex items-center justify-center text-[#9AA0A6] hover:bg-white/10 cursor-pointer"
                >
                  <X className="w-4 h-4" />
                </button>
              </div>
              <p className="text-sm text-[#B0B3B8] leading-relaxed">
                1. Tap the <strong className="text-[#E8EAED]">Share</strong>{' '}
                button in Safari&apos;s toolbar.
                <br />
                2. Scroll down and tap{' '}
                <strong className="text-[#E8EAED]">Add to Home Screen</strong>.
              </p>
              <button
                type="button"
                onClick={() => setShowIOSGuide(false)}
                className="w-full h-10 rounded-full bg-[#F4A7B9] text-[#121212] text-xs font-semibold cursor-pointer"
              >
                Got it
              </button>
            </div>
          </div>
        )}
      </>
    );
  }

  return null;
};
