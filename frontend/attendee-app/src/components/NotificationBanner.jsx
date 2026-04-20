import React, { useEffect } from 'react';
import { getMessaging as getFCM, getToken as getFCMToken, onMessage as onFCMMessage } from 'firebase/messaging';
import { app } from '../config/firebase';
import toast, { Toaster } from 'react-hot-toast';

export const NotificationBanner = () => {
  useEffect(() => {
    const setupFCM = async () => {
      try {
        if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
          const messaging = getFCM(app);
          const permission = await Notification.requestPermission();
          
          if (permission === 'granted') {
            const vapidKey = import.meta.env.VITE_FCM_VAPID_KEY;
            if (!vapidKey || vapidKey === 'YOUR_VAPID_KEY_HERE' || vapidKey === 'REPLACE_ME') {
              console.error(
                '[NotificationBanner] VITE_FCM_VAPID_KEY is not set.\n' +
                'FCM push token registration is disabled.\n' +
                'Set the variable in .env.local (dev) or as a Cloud Run env var (prod).'
              );
              return; // bail out — do not attempt token fetch with an invalid key
            }
            try {
              const currentToken = await getFCMToken(messaging, { vapidKey });
              if (currentToken) {
                console.log('[NotificationBanner] FCM token retrieved successfully.');
              } else {
                console.warn('[NotificationBanner] No FCM token available — check VAPID key and service-worker registration.');
              }
            } catch (tokenErr) {
              console.error('[NotificationBanner] FCM token fetch failed:', tokenErr.message);
            }

            onFCMMessage(messaging, (payload) => {
              const { title, body } = payload.notification || {};
              if (title || body) {
                toast(
                  (t) => (
                    <div className="flex flex-col gap-1">
                      <span className="font-bold text-gray-900">{title}</span>
                      <span className="text-sm text-gray-600">{body}</span>
                    </div>
                  ),
                  {
                    duration: 5000,
                    position: 'top-center',
                    style: {
                      background: '#fff',
                      color: '#333',
                      boxShadow: '0 4px 6px -1px rgba(0, 0, 0, 0.1), 0 2px 4px -1px rgba(0, 0, 0, 0.06)',
                      borderRadius: '0.5rem',
                      padding: '1rem',
                      borderLeft: '4px solid #3b82f6'
                    },
                  }
                );
              }
            });
          }
        }
      } catch (err) {
        // Silently skip
        console.warn('FCM setup failed', err);
      }
    };

    setupFCM();
  }, []);

  return (
    <div aria-live="polite">
      <Toaster />
    </div>
  );
};
