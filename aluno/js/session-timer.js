// Camada de saúde mental / uso consciente do MVP:
//   - timer de "modo aula" (tempo de uso com propósito educacional)
//   - lembrete de pausa/respiração entre módulos
//   - check-in rápido de humor no fim da aula (agregado no painel)
//
// Fluxo de um módulo: startModoAulaTimer() conta MODO_AULA_DURATION_MS ->
// ao zerar, dispara showPausaLembrete() -> ao continuar, dispara
// showMoodCheckin() -> ao responder, grava no Firebase e reinicia o timer
// pro próximo módulo.

import { MODO_AULA_DURATION_MS, DB_PATHS, MOOD_VALUES, MOOD_LABELS } from "../../shared/constants.js";
import { db } from "../../shared/firebase-config.js";
import { ref, push, serverTimestamp } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";

// Duração sugerida da pausa/respiração antes de avançar automaticamente pro check-in.
const PAUSA_DURATION_MS = 60 * 1000;

const modoAulaTimerEl = document.getElementById("modo-aula-timer");
const pausaLembreteEl = document.getElementById("pausa-lembrete");
const moodCheckinEl = document.getElementById("mood-checkin");

let timerIntervalId = null;
let timerEndsAt = null;

function formatMMSS(ms) {
  const totalSeconds = Math.max(0, Math.ceil(ms / 1000));
  const minutes = Math.floor(totalSeconds / 60);
  const seconds = totalSeconds % 60;
  return `${minutes}:${String(seconds).padStart(2, "0")}`;
}

/**
 * Inicia a contagem do "modo aula" e atualiza a UI em #modo-aula-timer.
 * Ao atingir MODO_AULA_DURATION_MS, deve disparar showPausaLembrete().
 */
export function startModoAulaTimer() {
  clearInterval(timerIntervalId);
  timerEndsAt = Date.now() + MODO_AULA_DURATION_MS;

  modoAulaTimerEl.hidden = false;
  modoAulaTimerEl.innerHTML = `
    <span id="modo-aula-label">Modo aula</span>
    <span id="modo-aula-time"></span>
  `;
  const timeEl = modoAulaTimerEl.querySelector("#modo-aula-time");

  const tick = () => {
    const remaining = timerEndsAt - Date.now();
    if (remaining <= 0) {
      clearInterval(timerIntervalId);
      modoAulaTimerEl.hidden = true;
      showPausaLembrete();
      return;
    }
    timeEl.textContent = formatMMSS(remaining);
  };

  tick();
  timerIntervalId = setInterval(tick, 1000);
}

/**
 * Exibe o lembrete de pausa/respiração em #pausa-lembrete.
 */
export function showPausaLembrete() {
  pausaLembreteEl.hidden = false;
  pausaLembreteEl.innerHTML = `
    <div id="pausa-card">
      <p id="pausa-titulo">Hora de uma pausa 🌿</p>
      <p id="pausa-texto">Respire fundo 3 vezes antes de continuar explorando.</p>
      <button id="pausa-continuar" type="button">Continuar</button>
    </div>
  `;

  const avancar = () => {
    clearTimeout(autoAdvanceId);
    pausaLembreteEl.hidden = true;
    showMoodCheckin();
  };

  const autoAdvanceId = setTimeout(avancar, PAUSA_DURATION_MS);
  pausaLembreteEl.querySelector("#pausa-continuar").addEventListener("click", avancar);
}

/**
 * Exibe o check-in de humor (#mood-checkin) com as opções de MOOD_VALUES
 * e grava a resposta em DB_PATHS.moodCheckins no Firebase.
 */
export function showMoodCheckin() {
  moodCheckinEl.hidden = false;

  const optionsHtml = MOOD_VALUES.map(
    (mood) => `<button class="mood-option" type="button" data-mood="${mood}">${MOOD_LABELS[mood]}</button>`
  ).join("");

  moodCheckinEl.innerHTML = `
    <div id="mood-card">
      <p id="mood-titulo">Como você está se sentindo?</p>
      <div id="mood-options">${optionsHtml}</div>
    </div>
  `;

  moodCheckinEl.querySelectorAll(".mood-option").forEach((button) => {
    button.addEventListener("click", () => {
      push(ref(db, DB_PATHS.moodCheckins), {
        mood: button.dataset.mood,
        timestamp: serverTimestamp(),
      });
      moodCheckinEl.hidden = true;
      startModoAulaTimer();
    });
  });
}
