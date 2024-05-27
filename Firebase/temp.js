






// Import the necessary modules from 'react-native-firebase'
import { initializeApp } from 'firebase/app';
import { getAuth, setPersistence } from 'firebase/auth'; // Updated import for getAuth and setPersistence
import { getReactNativePersistence } from '@react-native-firebase/auth';
import ReactNativeAsyncStorage from '@react-native-async-storage/async-storage';
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

// Initialize Firebase Auth with AsyncStorage persistence
const auth = getAuth(firebaseApp);
const persistence = getReactNativePersistence(ReactNativeAsyncStorage);

// Handle persistence separately
if (persistence) {
  // Set persistence if available
  setPersistence(auth, persistence);
}

const database = getDatabase(firebaseApp);
const firestore = getFirestore(firebaseApp);
export { auth, database, firestore };
