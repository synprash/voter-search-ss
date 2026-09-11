'use client';

import React, { useEffect, useState, useSyncExternalStore } from 'react';
import { Download, WifiOff, X } from 'lucide-react';

interface BeforeInstallPromptEvent extends Event {
  prompt: () => Promise<void>;
  userChoice: Promise<{ outcome: 'accepted' | 'dismissed'; platform: string }>;
}

function subscribeOnline(callback: () => void) {
  window.addEventListener('online', callback);
  window.addEventListener('offline', callback);
  return () => {
    window.removeEventListener('online', callback);
    window.removeEventListener('offline', callback);
  };
}

function getOnlineSnapshot(): boolean {
  return typeof navigator !== 'undefined' && typeof navigator.onLine === 'boolean'
    ? navigator.onLine
    : true;
}

function getOnlineServerSnapshot(): boolean {
  return true;
}

function subscribeStandalone(callback: () => void) {
  const mql = window.matchMedia('(display-mode: standalone)');
  mql.addEventListener('change', callback);
  return () => mql.removeEventListener('change', callback);
}

function getStandaloneSnapshot(): boolean {
  if (typeof window === 'undefined') return false;
  return (
    window.matchMedia('(display-mode: standalone)').matches ||
    (window.navigator as unknown as { standalone?: boolean }).standalone === true
  );
}

function getStandaloneServerSnapshot(): boolean {
  return false;
}

export const PwaController: React.FC = () => {
  const isOnline = useSyncExternalStore(
    subscribeOnline,
    getOnlineSnapshot,
    getOnlineServerSnapshot
  );

  const isStandalone = useSyncExternalStore(
    subscribeStandalone,
    getStandaloneSnapshot,
    getStandaloneServerSnapshot
  );

  const [deferredPrompt, setDeferredPrompt] = useState<BeforeInstallPromptEvent | null>(null);
  const [showInstallBanner, setShowInstallBanner] = useState<boolean>(false);

  useEffect(() => {
    // 1. Service Worker Registration
    if ('serviceWorker' in navigator) {
      window.addEventListener('load', () => {
        navigator.serviceWorker
          .register('/sw.js')
          .then((registration) => {
            console.log('[PWA] Service Worker registered with scope:', registration.scope);
          })
          .catch((error) => {
            console.warn('[PWA] Service Worker registration failed:', error);
          });
      });
    }

    // 2. Listen for PWA Install Prompt
    const handleBeforeInstallPrompt = (e: Event) => {
      e.preventDefault();
      setDeferredPrompt(e as BeforeInstallPromptEvent);
      const dismissed = sessionStorage.getItem('pwa_install_dismissed');
      if (!dismissed) {
        setShowInstallBanner(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // 3. Track successful installation
    const handleAppInstalled = () => {
      setShowInstallBanner(false);
      setDeferredPrompt(null);
      console.log('[PWA] App successfully installed');
    };

    window.addEventListener('appinstalled', handleAppInstalled);

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
      window.removeEventListener('appinstalled', handleAppInstalled);
    };
  }, []);

  const handleInstallClick = async () => {
    if (!deferredPrompt) return;
    await deferredPrompt.prompt();
    const choiceResult = await deferredPrompt.userChoice;
    if (choiceResult.outcome === 'accepted') {
      console.log('[PWA] User accepted installation prompt');
    }
    setDeferredPrompt(null);
    setShowInstallBanner(false);
  };

  const handleDismissInstall = () => {
    setShowInstallBanner(false);
    sessionStorage.setItem('pwa_install_dismissed', 'true');
  };

  return (
    <>
      {/* Offline Toast Banner - Only shown when genuinely offline */}
      {!isOnline && (
        <aside
          role="alert"
          aria-live="assertive"
          className="fixed top-0 inset-x-0 z-50 bg-red-600 text-white px-4 py-2 text-center text-xs sm:text-sm font-semibold shadow-lg flex items-center justify-center gap-2"
        >
          <WifiOff className="w-4 h-4 shrink-0 animate-pulse" />
          <span>आपण ऑफलाइन आहात. इंटरनेट कनेक्शन पूर्ववत झाल्यावर डेटा अपडेट होईल.</span>
        </aside>
      )}

      {/* Floating Install App Promotion for Mobile/Desktop */}
      {showInstallBanner && !isStandalone && (
        <aside
          role="complementary"
          aria-label="ॲप इन्स्टॉल करा"
          className="fixed bottom-4 right-4 left-4 sm:left-auto sm:max-w-md z-40 bg-white border-2 border-orange-500 rounded-2xl shadow-2xl p-3.5 sm:p-4 text-slate-800 transition-all duration-300 animate-in fade-in slide-in-from-bottom-4"
        >
          <div className="flex items-start gap-3">
            <div className="h-10 w-10 rounded-xl bg-orange-600 flex items-center justify-center text-white shrink-0 shadow-md">
              <Download className="w-5 h-5" />
            </div>
            <div className="flex-1 min-w-0">
              <h4 className="text-sm font-bold text-slate-900 leading-snug">
                शिवसेना मतदार शोध ॲप इन्स्टॉल करा
              </h4>
              <p className="text-xs text-slate-600 mt-0.5">
                चांदवड शहराची मतदार यादी सहज शोधण्यासाठी मोबाइलवर इन्स्टॉल करा.
              </p>
              <div className="mt-2.5 flex items-center gap-2">
                <button
                  type="button"
                  onClick={handleInstallClick}
                  className="px-3 py-1.5 bg-orange-600 hover:bg-orange-700 text-white rounded-lg text-xs font-bold shadow-sm transition-colors cursor-pointer"
                >
                  इन्स्टॉल करा (Install)
                </button>
                <button
                  type="button"
                  onClick={handleDismissInstall}
                  className="px-2.5 py-1.5 text-slate-500 hover:text-slate-800 text-xs font-medium cursor-pointer"
                >
                  नंतर करा
                </button>
              </div>
            </div>
            <button
              type="button"
              onClick={handleDismissInstall}
              className="text-slate-400 hover:text-slate-600 p-1 cursor-pointer"
              aria-label="बंद करा"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </aside>
      )}
    </>
  );
};
