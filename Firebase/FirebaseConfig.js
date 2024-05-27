// Import the individual Firebase modules
import { initializeApp } from 'firebase/app';
import { getAuth } from 'firebase/auth';
import { getDatabase } from 'firebase/database';
import { getFirestore } from 'firebase/firestore';

// Firebase configuration object
const firebaseConfig = {
  apiKey: "AIzaSyAJqQORV264heVLWGH2iA992GwCfUia5dU",
  authDomain: "let-seat-fb5dc.firebaseapp.com",
  projectId: "let-seat-fb5dc",
  storageBucket: "let-seat-fb5dc.appspot.com",
  messagingSenderId: "145511535540",
  appId: "1:145511535540:web:deb7df20d449e137d718e1",
  measurementId: "G-8TKH99S9Q6"
};

// Initialize Firebase app
const firebaseApp = initializeApp(firebaseConfig);

// Get Firebase services
const auth = getAuth(firebaseApp);
const database = getDatabase(firebaseApp);
const firestore = getFirestore(firebaseApp);
export { auth, database, firestore };

