import React, { useState, useEffect } from 'react';
import { Wifi, WifiOff } from 'lucide-react';
import { useTranslation } from 'react-i18next';

/**
 * Phase 1 — Offline Awareness
 * Shows a sticky banner at the top of the screen when the device loses internet.
 * Because Firestore offline persistence is now enabled, the cashier can still
 * ring up orders; this banner simply informs them of the connection state.
 */
function NetworkStatus() {
  const { t } = useTranslation();
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [showReconnected, setShowReconnected] = useState(false);

  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      // Briefly show a "reconnected" confirmation then hide it
      setShowReconnected(true);
      setTimeout(() => setShowReconnected(false), 4000);
    };

    const handleOffline = () => {
      setIsOnline(false);
      setShowReconnected(false);
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Nothing to show when fully online and no recent reconnect
  if (isOnline && !showReconnected) return null;

  return (
    <div
      className={`fixed top-0 left-0 right-0 z-[9999] flex items-center justify-center gap-3 py-2.5 text-sm font-semibold shadow-lg transition-all duration-500 ${
        isOnline
          ? 'bg-green-500 text-white'
          : 'bg-red-600 text-white animate-pulse'
      }`}
    >
      {isOnline ? (
        <>
          <Wifi size={16} />
          <span>
            {t('network.reconnected', {
              defaultValue: '✅ Back online — data is syncing automatically.'
            })}
          </span>
        </>
      ) : (
        <>
          <WifiOff size={16} />
          <span>
            {t('network.offline', {
              defaultValue:
                '⚠️ No internet connection. You can still place orders — they will sync when reconnected.'
            })}
          </span>
        </>
      )}
    </div>
  );
}

export default NetworkStatus;
