import { initializeApp } from 'firebase/app';
import { getFirestore } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyDlLFnc7w2fsMelzguiFQd3fJrSEHsWibk",
  authDomain: "dashboard-papa.firebaseapp.com",
  projectId: "dashboard-papa",
  storageBucket: "dashboard-papa.firebasestorage.app",
  messagingSenderId: "148237549398",
  appId: "1:148237549398:web:95cd116a184aae4e90e0f7"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const auth = getAuth(app);

// Verificación de inicialización
console.log('Firebase inicializado correctamente');
console.log('Usuario actual:', auth.currentUser?.uid || 'No hay usuario autenticado');

export { db, auth }; 