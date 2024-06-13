import { initializeApp } from 'firebase/app';
import { getAuth } from "firebase/auth";
import { getFirestore } from 'firebase/firestore';
import { getStorage, ref, uploadBytes, getDownloadURL } from 'firebase/storage';

const firebaseConfig = {
    apiKey: "AIzaSyAnrqwqvj5Xt-oqMuXmD3rvwAybmVqEwbU",
    authDomain: "is-takip-sistemi-3e94f.firebaseapp.com",
    projectId: "is-takip-sistemi-3e94f",
    storageBucket: "is-takip-sistemi-3e94f.appspot.com",
    messagingSenderId: "473707908580",
    appId: "1:473707908580:web:179627dc55ad3f05cf8bf1",
    measurementId: "G-D35Q2W70SG"
};

const app = initializeApp(firebaseConfig);

export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app);

export const uploadFile = async (file) => {
    const storageRef = ref(storage, `files/${file.name}`);
    await uploadBytes(storageRef, file);
    const url = await getDownloadURL(storageRef);
    return url;
};
