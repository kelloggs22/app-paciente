import { getFirestore } from "firebase/firestore"; // Importe específico para o Banco de Dados
import { getAuth } from "firebase/auth";// Import the functions you need from the SDKs you need
// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyBdGlTK2l-AUWB2zDSFxsnSO4ARFu2fB0c",
  authDomain: "gabs-nutri.firebaseapp.com",
  projectId: "gabs-nutri",
  storageBucket: "gabs-nutri.firebasestorage.app",
  messagingSenderId: "275638010522",
  appId: "1:275638010522:web:e94e3225adeaf847aed523"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
// As exportações precisam ser individuais para os outros arquivos reconhecerem
export const db = getFirestore(app);
export const auth = getAuth(app);