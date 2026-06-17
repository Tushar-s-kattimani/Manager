import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';

const firebaseConfig = {
  apiKey: "AIzaSyDiKwvM0UBrMQLgxlXnIgJONi3B55Pwb4s",
  authDomain: "studio-9395478922-e9cc8.firebaseapp.com",
  projectId: "studio-9395478922-e9cc8",
  storageBucket: "studio-9395478922-e9cc8.firebasestorage.app",
  messagingSenderId: "315051266084",
  appId: "1:315051266084:web:b2c3da69113984d0dcc8b1"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);

export { db };
