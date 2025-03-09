importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-app-compat.js');
importScripts('https://www.gstatic.com/firebasejs/9.6.10/firebase-messaging-compat.js');

const firebaseConfig = {
  apiKey: "AIzaSyAnrqwqvj5Xt-oqMuXmD3rvwAybmVqEwbU",
  authDomain: "is-takip-sistemi-3e94f.firebaseapp.com",
  projectId: "is-takip-sistemi-3e94f",
  storageBucket: "is-takip-sistemi-3e94f.appspot.com",
  messagingSenderId: "473707908580",
  appId: "1:473707908580:web:29c2275548b2ddcccf8bf1",
  measurementId: "G-HM5FSCQFYJ"
};

firebase.initializeApp(firebaseConfig);

const messaging = firebase.messaging();

messaging.onBackgroundMessage(function(payload) {
  // Customize notification here
  const notificationTitle = 'Background Message Title';
  const notificationOptions = {
    body: 'Background Message body.',
    icon: '/firebase-logo.png'
  };

  self.registration.showNotification(notificationTitle,
    notificationOptions);
});
