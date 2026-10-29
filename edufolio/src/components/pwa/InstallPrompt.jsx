import { useEffect, useState } from 'react';
import { Download, Share, PlusSquare } from 'lucide-react';

function isIOS() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent) && !window.MSStream;
}

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [installed, setInstalled] = useState(false);
  const ios = isIOS();

  useEffect(() => {
    function onBeforeInstall(e) {
      e.preventDefault();
      setDeferredPrompt(e);
    }
    function onInstalled() {
      setInstalled(true);
      setDeferredPrompt(null);
    }
    window.addEventListener('beforeinstallprompt', onBeforeInstall);
    window.addEventListener('appinstalled', onInstalled);
    return () => {
      window.removeEventListener('beforeinstallprompt', onBeforeInstall);
      window.removeEventListener('appinstalled', onInstalled);
    };
  }, []);

  async function handleInstall() {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    setDeferredPrompt(null);
  }

  if (installed) {
    return (
      <div className="glass-surface rounded-2xl border border-status-success/30 p-6 text-sm text-status-success">
        Edufolio is installed on this device.
      </div>
    );
  }

  return (
    <div className="glass-surface rounded-2xl border border-glass p-6">
      <div className="mb-4 flex h-12 w-12 items-center justify-center rounded-xl bg-aurora-gradient">
        <Download size={22} className="text-white" />
      </div>
      <h3 className="font-display text-lg font-semibold text-text-primary">Install Edufolio</h3>
      <p className="mt-1 text-sm text-text-secondary">
        Get quick access from your home screen with an app-like, offline-friendly experience.
      </p>

      {ios ? (
        <div className="mt-4 space-y-2 text-sm text-text-secondary">
          <p className="flex items-center gap-2">
            <Share size={16} /> Tap the Share icon in Safari.
          </p>
          <p className="flex items-center gap-2">
            <PlusSquare size={16} /> Choose &quot;Add to Home Screen&quot;.
          </p>
        </div>
      ) : (
        <button
          type="button"
          data-cursor-hover
          onClick={handleInstall}
          disabled={!deferredPrompt}
          className="mt-4 w-full rounded-xl bg-aurora-gradient py-3 text-sm font-semibold text-white shadow-glow-violet transition-opacity hover:opacity-90 disabled:opacity-50"
        >
          {deferredPrompt ? 'Install Edufolio App' : 'Install option not available yet'}
        </button>
      )}
    </div>
  );
}
