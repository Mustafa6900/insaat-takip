importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

firebase.initializeApp({
  apiKey: "AIzaSyAnrqwqvj5Xt-oqMuXmD3rvwAybmVqEwbU",
  authDomain: "is-takip-sistemi-3e94f.firebaseapp.com",
  projectId: "is-takip-sistemi-3e94f",
  storageBucket: "is-takip-sistemi-3e94f.appspot.com",
  messagingSenderId: "473707908580",
  appId: "1:473707908580:web:29c2275548b2ddcccf8bf1"
});

const messaging = firebase.messaging();

// Arka plan mesajlarını işle
messaging.onBackgroundMessage((payload) => {
  
  const notificationTitle = payload.notification.title;
  const notificationOptions = {
    body: payload.notification.body,
    icon: '/icons/icon-192x192.png',
    badge: '/icons/icon-192x192.png',
    data: payload.data,
    tag: 'notification-1' // Bildirimleri gruplamak için
  };

  return self.registration.showNotification(notificationTitle, notificationOptions);
});
