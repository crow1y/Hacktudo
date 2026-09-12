// Config compartilhada do Firebase — usada tanto pelo app do aluno (aluno/)
// quanto pelo painel do professor (painel/). Mantenha só um lugar com esses
// valores para os dois lados nunca apontarem para bancos diferentes.
//
// TODO: criar um projeto em https://console.firebase.google.com,
// ativar o "Realtime Database" (modo de teste é suficiente para o hackathon)
// e colar aqui o objeto de config (Configurações do projeto > Seus apps > Web).
import { initializeApp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-app.js";
import { getDatabase } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const firebaseConfig = {
  apiKey: "TODO",
  authDomain: "TODO",
  databaseURL: "TODO",
  projectId: "TODO",
  storageBucket: "TODO",
  messagingSenderId: "TODO",
  appId: "TODO",
};

export const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
