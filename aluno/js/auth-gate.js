// Tela de login/cadastro do aluno. Só libera o app (AR) depois de
// autenticado — ver startApp() em main.js.
import { cadastrarAluno, entrar, sair, ouvirSessao, traduzErroAuth } from "../../shared/auth.js";
import { requisitosSenhaFaltando } from "../../shared/validators.js";
import { ativarToggleDeSenha } from "../../shared/ui.js";
import { startApp } from "./main.js";

ativarToggleDeSenha();

const ROLE = "aluno";

const gateEl = document.getElementById("auth-gate");
const appContentEl = document.getElementById("app-content");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginError = document.getElementById("login-error");
const signupError = document.getElementById("signup-error");
const logoutBtn = document.getElementById("logout-btn");

let appStarted = false;

document.getElementById("to-signup")?.addEventListener("click", () => {
  loginForm.hidden = true;
  signupForm.hidden = false;
});

document.getElementById("to-login")?.addEventListener("click", () => {
  signupForm.hidden = true;
  loginForm.hidden = false;
});

loginForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  loginError.textContent = "";

  try {
    await entrar(ROLE, loginForm.matricula.value, loginForm.senha.value);
  } catch (error) {
    loginError.textContent = traduzErroAuth(error);
  }
});

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  signupError.textContent = "";

  const nome = signupForm.nome.value.trim();
  const matricula = signupForm.matricula.value.trim();
  const senha = signupForm.senha.value;
  const confirmarSenha = signupForm.confirmarSenha.value;

  const faltando = requisitosSenhaFaltando(senha);
  if (faltando.length > 0) {
    signupError.textContent = `A senha precisa ter: ${faltando.join(", ")}.`;
    return;
  }
  if (senha !== confirmarSenha) {
    signupError.textContent = "As senhas não coincidem.";
    return;
  }

  try {
    await cadastrarAluno({ nome, matricula, senha });
  } catch (error) {
    signupError.textContent = traduzErroAuth(error);
  }
});

logoutBtn?.addEventListener("click", () => sair());

ouvirSessao((user) => {
  gateEl.hidden = Boolean(user);
  appContentEl.hidden = !user;

  if (user && !appStarted) {
    appStarted = true;
    startApp(user);
  }
});
