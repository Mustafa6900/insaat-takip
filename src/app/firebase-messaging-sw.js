importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

const firebaseConfig = {
    apiKey: "AIzaSyAnrqwqvj5Xt-oqMuXmD3rvwAybmVqEwbU",
    authDomain: "is-takip-sistemi-3e94f.firebaseapp.com",
    projectId: "is-takip-sistemi-3e94f",
    storageBucket: "is-takip-sistemi-3e94f",
    messagingSenderId: "473707908580",
    appId: "1:473707908580:web:179627dc55ad3f05cf8bf1",
    measurementId: "G-D35Q2W70SG"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  // console.log('[firebase-messaging-sw.js] Received background message ', payload);
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
