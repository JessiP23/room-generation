// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
import {getFirestore} from "firebase/firestore";
import {getAuth} from 'firebase/auth';

// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyDbuXD7cuW8MpIcSbBEUxUj9hkjfX6ReSE",
  authDomain: "room-generation-4a82e.firebaseapp.com",
  projectId: "room-generation-4a82e",
  storageBucket: "room-generation-4a82e.appspot.com",
  messagingSenderId: "958789203387",
  appId: "1:958789203387:web:6bb3584646387588b8009e",
  measurementId: "G-S6JE4KHZVP"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);
const analytics = getAnalytics(app);

export {db, auth};