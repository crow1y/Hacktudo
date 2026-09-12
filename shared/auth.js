// Autenticação por matrícula/senha (Firebase Auth) + perfil de conta
// (Realtime Database), compartilhada entre aluno/ e painel/.
//
// O Firebase Auth exige e-mail/senha — como o cadastro pede matrícula (não
// e-mail), sintetizamos um e-mail interno a partir da matrícula + papel
// (ver AUTH_EMAIL_SUFFIX em constants.js). Isso nunca é mostrado pro
// usuário, só existe pra satisfazer a API do Auth.
import {
  setPersistence,
  browserSessionPersistence,
  createUserWithEmailAndPassword,
  signInWithEmailAndPassword,
  signOut,
  onAuthStateChanged,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-auth.js";
import { ref, set, get, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { auth, db } from "./firebase-config.js";
import { DB_PATHS, ROLES, AUTH_EMAIL_SUFFIX } from "./constants.js";

// Sessão só dura enquanto a aba/navegador está aberto — fechar o site exige
// login de novo com matrícula e senha, como pedido no fluxo de uso consciente.
const persistenciaPronta = setPersistence(auth, browserSessionPersistence);

function matriculaParaEmail(role, matricula) {
  return `${matricula.trim().toLowerCase()}${AUTH_EMAIL_SUFFIX[role]}`;
}

function perfilPath(role, uid) {
  const base = role === ROLES.PROFESSOR ? DB_PATHS.professores : DB_PATHS.alunos;
  return `${base}/${uid}`;
}

export async function cadastrarProfessor({ nome, matricula, cpf, senha }) {
  await persistenciaPronta;
  const email = matriculaParaEmail(ROLES.PROFESSOR, matricula);
  const { user } = await createUserWithEmailAndPassword(auth, email, senha);
  await set(ref(db, perfilPath(ROLES.PROFESSOR, user.uid)), {
    nome,
    matricula,
    cpf,
    liberado: false,
    criadoEm: Date.now(),
  });
  return user;
}

export async function cadastrarAluno({ nome, matricula, senha }) {
  await persistenciaPronta;
  const email = matriculaParaEmail(ROLES.ALUNO, matricula);
  const { user } = await createUserWithEmailAndPassword(auth, email, senha);
  await set(ref(db, perfilPath(ROLES.ALUNO, user.uid)), {
    nome,
    matricula,
    criadoEm: Date.now(),
  });
  return user;
}

export async function entrar(role, matricula, senha) {
  await persistenciaPronta;
  const email = matriculaParaEmail(role, matricula);
  const { user } = await signInWithEmailAndPassword(auth, email, senha);
  return user;
}

export function sair() {
  return signOut(auth);
}

// Chama callback(user | null) no login/logout/refresh da página.
export function ouvirSessao(callback) {
  return onAuthStateChanged(auth, callback);
}

// Chama callback(perfil | null) agora e a cada mudança (ex: admin liberando
// o professor em tempo real enquanto ele está na tela de espera).
export function ouvirPerfil(role, uid, callback) {
  return onValue(ref(db, perfilPath(role, uid)), (snapshot) => callback(snapshot.val()));
}

// Lê o perfil uma única vez (ex: pegar nome/matrícula pra anexar num
// registro, sem manter um listener vivo).
export async function obterPerfil(role, uid) {
  const snapshot = await get(ref(db, perfilPath(role, uid)));
  return snapshot.val();
}

export function traduzErroAuth(error) {
  switch (error?.code) {
    case "auth/email-already-in-use":
      return "Essa matrícula já tem conta cadastrada.";
    case "auth/invalid-credential":
    case "auth/wrong-password":
    case "auth/user-not-found":
      return "Matrícula ou senha inválida.";
    case "auth/weak-password":
      return "Senha muito fraca.";
    default:
      return "Não foi possível concluir. Tente novamente.";
  }
}
