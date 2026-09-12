// Config compartilhada do Firebase — usada tanto pelo app do aluno (aluno/)
// quanto pelo painel do professor (painel/). Mantenha só um lugar com esses
// valores para os dois lados nunca apontarem para bancos diferentes.
//
// Importado via CDN (gstatic) porque o projeto não usa bundler — os imports
// de pacote npm (ex: "firebase/app") não funcionam em <script type="module">
// direto no navegador sem um passo de build.
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "AIzaSyAlelnq04Ey-pSYcYOVuIZwJE2Vg9GB0ho",
  authDomain: "viva-livro.firebaseapp.com",
  databaseURL: "https://viva-livro-default-rtdb.firebaseio.com",
  projectId: "viva-livro",
  storageBucket: "viva-livro.firebasestorage.app",
  messagingSenderId: "720979063788",
  appId: "1:720979063788:web:62f0ffa72120f89f7f86c9",
  measurementId: "G-PSJY32XEQ5",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);