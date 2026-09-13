// Tela de login/cadastro do professor. Depois de autenticado, só libera o
// painel (startApp() em main.js) se o admin já tiver aprovado o acesso
// (perfil.liberado === true) — enquanto isso, mostra a tela de espera.
import {
  cadastrarProfessor,
  entrar,
  sair,
  ouvirSessao,
  ouvirPerfil,
  traduzErroAuth,
} from "../../shared/auth.js";
import { requisitosSenhaFaltando, cpfValido } from "../../shared/validators.js";
import { ativarToggleDeSenha } from "../../shared/ui.js";
import { TEST_LOGIN } from "../../shared/constants.js";
import { startApp } from "./main.js";

ativarToggleDeSenha();

const ROLE = "professor";

const gateEl = document.getElementById("auth-gate");
const pendingEl = document.getElementById("pending-approval");
const appContentEl = document.getElementById("app-content");
const loginForm = document.getElementById("login-form");
const signupForm = document.getElementById("signup-form");
const loginError = document.getElementById("login-error");
const signupError = document.getElementById("signup-error");

let appStarted = false;
let pararDeOuvirPerfil = null;

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

document.getElementById("login-teste-btn")?.addEventListener("click", () => {
  loginForm.matricula.value = TEST_LOGIN[ROLE].matricula;
  loginForm.senha.value = TEST_LOGIN[ROLE].senha;
  loginForm.requestSubmit();
});

signupForm?.addEventListener("submit", async (event) => {
  event.preventDefault();
  signupError.textContent = "";

  const nome = signupForm.nome.value.trim();
  const matricula = signupForm.matricula.value.trim();
  const cpf = signupForm.cpf.value.trim();
  const senha = signupForm.senha.value;
  const confirmarSenha = signupForm.confirmarSenha.value;

  if (!cpfValido(cpf)) {
    signupError.textContent = "CPF inválido.";
    return;
  }

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
    await cadastrarProfessor({ nome, matricula, cpf, senha });
  } catch (error) {
    signupError.textContent = traduzErroAuth(error);
  }
});

document.querySelectorAll("[data-logout]").forEach((btn) => {
  btn.addEventListener("click", () => sair());
});

function mostrarEstado(estado) {
  gateEl.hidden = estado !== "auth";
  pendingEl.hidden = estado !== "pending";
  appContentEl.hidden = estado !== "app";
}

ouvirSessao((user) => {
  if (pararDeOuvirPerfil) {
    pararDeOuvirPerfil();
    pararDeOuvirPerfil = null;
  }

  if (!user) {
    mostrarEstado("auth");
    return;
  }

  pararDeOuvirPerfil = ouvirPerfil(ROLE, user.uid, (perfil) => {
    if (!perfil?.liberado) {
      mostrarEstado("pending");
      return;
    }

    mostrarEstado("app");
    if (!appStarted) {
      appStarted = true;
      startApp();
    }
  });
});
