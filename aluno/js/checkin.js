// Check-in de presença: comprova que o aluno está participando da aula.
//
// Fluxo: iniciarCheckinsDeAula() registra o primeiro check-in automaticamente
// (sem interação) assim que o aluno entra na área dele. A partir daí, a cada
// CHECKIN_INTERVAL_MS aparece um aviso pedindo confirmação manual, até
// completar AULA_DURATION_MS — depois disso a aula "acabou" e não pede mais.
import { AULA_DURATION_MS, CHECKIN_INTERVAL_MS, DB_PATHS } from "../../shared/constants.js";
import { db } from "../../shared/firebase-config.js";
import { ref, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

const TOAST_DURATION_MS = 3000;

const checkinToastEl = document.getElementById("checkin-toast");
const checkinAvisoEl = document.getElementById("checkin-aviso");

let proximoAvisoId = null;
let aulaEndsAt = null;

export function iniciarCheckinsDeAula(aluno) {
  aulaEndsAt = Date.now() + AULA_DURATION_MS;
  registrarCheckin(aluno);
  mostrarToast("Presença registrada ✅");
  agendarProximoAviso(aluno);
}

function agendarProximoAviso(aluno) {
  clearTimeout(proximoAvisoId);

  const restante = aulaEndsAt - Date.now();
  if (restante <= 0) return;

  proximoAvisoId = setTimeout(() => mostrarAvisoCheckin(aluno), Math.min(CHECKIN_INTERVAL_MS, restante));
}

function mostrarAvisoCheckin(aluno) {
  checkinAvisoEl.hidden = false;
  checkinAvisoEl.innerHTML = `
    <div id="checkin-card">
      <p id="checkin-titulo">Confirme sua presença</p>
      <p id="checkin-texto">Toque no botão abaixo pra continuar participando da aula.</p>
      <button id="checkin-btn" type="button">Check de aula ✅</button>
    </div>
  `;

  checkinAvisoEl.querySelector("#checkin-btn").addEventListener("click", () => {
    checkinAvisoEl.hidden = true;
    registrarCheckin(aluno);
    agendarProximoAviso(aluno);
  });
}

function mostrarToast(mensagem) {
  checkinToastEl.hidden = false;
  checkinToastEl.textContent = mensagem;
  setTimeout(() => {
    checkinToastEl.hidden = true;
  }, TOAST_DURATION_MS);
}

function registrarCheckin(aluno) {
  push(ref(db, DB_PATHS.checkins), {
    uid: aluno.uid,
    nome: aluno.nome,
    matricula: aluno.matricula,
    timestamp: serverTimestamp(),
  });
}
