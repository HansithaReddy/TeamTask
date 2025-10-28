import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getFirestore } from 'firebase/firestore';

// TODO: replace with your firebase config
const firebaseConfig = {
  apiKey: "AIzaSyBg-5hvcfjvmK8qsmmGWPmmxW2n6wG7NCM",
  authDomain: "task-manager-d8cd4.firebaseapp.com",
  projectId: "task-manager-d8cd4",
  storageBucket: "task-manager-d8cd4.firebasestorage.app",
  messagingSenderId: "565701396437",
  appId: "1:565701396437:web:0756e62cc091c84dacdf5c",
  measurementId: "G-RMWC8ZELZH"
};

const app = initializeApp(firebaseConfig);
export const auth = getAuth(app);
export const db = getFirestore(app);
export default app;