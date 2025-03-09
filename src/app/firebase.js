// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore, collection, doc, setDoc } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken as fetchToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAnrqwqvj5Xt-oqMuXmD3rvwAybmVqEwbU",
  authDomain: "is-takip-sistemi-3e94f.firebaseapp.com",
  projectId: "is-takip-sistemi-3e94f",
  storageBucket: "is-takip-sistemi-3e94f.appspot.com",
  messagingSenderId: "473707908580",
  appId: "1:473707908580:web:29c2275548b2ddcccf8bf1",
  measurementId: "G-HM5FSCQFYJ"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let messaging;

export const notificationsCollection = collection(db, "notifications");

export const uploadFile = async (file) => {
  const storageRef = ref(storage, `files/${file.name}`);
  const uploadTask = uploadBytesResumable(storageRef, file);

  return new Promise((resolve, reject) => {
    uploadTask.on(
      'state_changed',
      (snapshot) => {
        // Observe state change events such as progress, pause, and resume
        const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
      
      },
      (error) => {
        // Handle unsuccessful uploads
        reject(error);
      },
      async () => {
        // Handle successful uploads on complete
        const downloadURL = await getDownloadURL(uploadTask.snapshot.ref);
        resolve(downloadURL);
      }
    );
  });
};

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      messaging = getMessaging(app);
    })
    .catch((err) => {
      console.error('Service Worker registration failed: ', err);
    });
}

// FCM token'ı veritabanında saklamak için bir fonksiyon
export const saveUserFCMToken = async (userId, token) => {
  try {

    if (!userId) {
      throw new Error('User ID is required');
    }

    const userTokenRef = doc(db, "userTokens", userId);
    
    const tokenData = {
      fcmToken: token,
      updatedAt: new Date(),
      userId: userId, // userId'yi de kaydedelim
    };

    await setDoc(userTokenRef, tokenData, { merge: true });
    
  } catch (error) {
    console.error("Token kaydetme hatası:", error);
    // Hatayı yukarı fırlatalım ki, çağıran fonksiyon handle edebilsin
    throw error;
  }
};

export const getToken = async (userId) => {
  try {
    if (!messaging) {
      const registration = await navigator.serviceWorker.register('/firebase-messaging-sw.js', {
        scope: '/'
      });
      messaging = getMessaging(app);
    }

    let permission = Notification.permission;

    if (permission === 'default') {
      permission = await Notification.requestPermission();
    }

    if (permission !== 'granted') {
      return null;
    }

    try {
      const currentToken = await fetchToken(messaging, { 
        vapidKey: 'BCXQJSr4NLEG8JmWGsjCKavjoQ7fJYQ9N8JNbOZwLabosNRXfmlBgNm6ubJerDCtC0msXPA2tybe8CBTdXq1y1s'
      });

      if (currentToken) {
        try {
          await saveUserFCMToken(userId, currentToken);
          return currentToken;
        } catch (saveError) {
          console.error('Token kaydedilemedi:', saveError);
          // Token kaydedilemese bile token'ı döndürelim
          return currentToken;
        }
      } else {
        return null;
      }
    } catch (error) {
      console.error('Token alma hatası:', error);
      return null;
    }
  } catch (err) {
    console.error('Genel hata:', err);
    return null;
  }
};

export const onMessageListener = () => 
  new Promise((resolve, reject) => {
    if (messaging) {
      onMessage(messaging, (payload) => {
        resolve(payload);
      });
    } else {
      reject(new Error("Messaging is not initialized"));
    }
  });
