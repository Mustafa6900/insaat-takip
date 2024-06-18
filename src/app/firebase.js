// firebase.js
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytesResumable, getDownloadURL } from 'firebase/storage';
import { getMessaging, getToken as fetchToken, onMessage } from 'firebase/messaging';

const firebaseConfig = {
  apiKey: "AIzaSyAnrqwqvj5Xt-oqMuXmD3rvwAybmVqEwbU",
  authDomain: "is-takip-sistemi-3e94f.firebaseapp.com",
  projectId: "is-takip-sistemi-3e94f",
  storageBucket: "is-takip-sistemi-3e94f",
  messagingSenderId: "473707908580",
  appId: "1:473707908580:web:179627dc55ad3f05cf8bf1",
  measurementId: "G-D35Q2W70SG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);
export let messaging;

if (typeof window !== 'undefined' && 'serviceWorker' in navigator) {
  navigator.serviceWorker.register('/firebase-messaging-sw.js')
    .then((registration) => {
      //console.log('Service Worker registration successful with scope: ', registration.scope);
      messaging = getMessaging(app);
    })
    .catch((err) => {
      // console.log('Service Worker registration failed: ', err);
    });
}

export const getToken = async () => {
  try {
    const currentToken = await fetchToken(messaging, { vapidKey: 'BDmbmI_S0YTeSzGLde8e2ryIGKjz_BXbhcRvzACvdPFMK2zCD0AaPziB5G1fAvOdQh3CRflUzf5WfzlUKar9Ntk' });
    if (currentToken) {
      //console.log('Current token for client: ', currentToken);
      // Token'ı sunucunuza gönderin
    } else {
      //console.log('No registration token available. Request permission to generate one.');
    }
  } catch (err) {
    // console.log('An error occurred while retrieving token. ', err);
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

// File upload function
export const uploadFile = async (file) => {
  try {
    const storageRef = ref(storage, `files/${file.name}`);
    const uploadTask = uploadBytesResumable(storageRef, file);

    return new Promise((resolve, reject) => {
      uploadTask.on(
        'state_changed',
        (snapshot) => {
          // Observe state change events such as progress, pause, and resume
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          //console.log(`Upload is ${progress}% done`);
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
  } catch (error) {
    console.error("Error uploading file:", error);
    throw error;
  }
};
