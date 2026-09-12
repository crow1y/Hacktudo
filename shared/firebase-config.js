// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAnalytics } from "firebase/analytics";
// TODO: Add SDKs for Firebase products that you want to use
// https://firebase.google.com/docs/web/setup#available-libraries

// Your web app's Firebase configuration
// For Firebase JS SDK v7.20.0 and later, measurementId is optional
const firebaseConfig = {
  apiKey: "AIzaSyAlelnq04Ey-pSYcYOVuIZwJE2Vg9GB0ho",
  authDomain: "viva-livro.firebaseapp.com",
  databaseURL: "https://viva-livro-default-rtdb.firebaseio.com",
  projectId: "viva-livro",
  storageBucket: "viva-livro.firebasestorage.app",
  messagingSenderId: "720979063788",
  appId: "1:720979063788:web:62f0ffa72120f89f7f86c9",
  measurementId: "G-PSJY32XEQ5"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const analytics = getAnalytics(app);