'use client';

import { useEffect } from 'react';
import { onMessageListener } from './firebase';
import { toast } from 'react-toastify';

export default function ClientSideLogic() {
  useEffect(() => {
    // Bildirim izinlerini kontrol et
    if ('Notification' in window) {
      if (Notification.permission === 'default') {
        Notification.requestPermission();
      }
    }

    // Ön planda bildirim dinleyicisi
    const unsubscribe = onMessageListener()
      .then((payload) => {
        // Bildirim geldiğinde toast göster
        toast.info(payload.notification.body, {
          toastId: payload.data?.notificationId || 'notification',
          onClick: () => {
            // Bildirime tıklandığında yönlendirme yapılabilir
            if (payload.data?.projectId) {
              window.location.href = `/projects/${payload.data.projectId}${
                payload.data.categoryId ? '/' + payload.data.categoryId : ''
              }`;
            }
          },
        });
      })
      .catch((err) => {
        console.error('Bildirim dinleme hatası:', err);
      });

    return () => {
      if (unsubscribe && typeof unsubscribe === 'function') {
        unsubscribe();
      }
    };
  }, []);

  return null;
} 