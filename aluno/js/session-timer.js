// Camada de saúde mental / uso consciente do MVP:
//   - timer de "modo aula" (tempo de uso com propósito educacional)
//   - lembrete de pausa/respiração entre módulos
//   - check-in rápido de humor no fim da aula (agregado no painel)
// TODO: implementar a lógica. Assinaturas abaixo definem o contrato esperado.

import { MODO_AULA_DURATION_MS, DB_PATHS, MOOD_VALUES } from "../../shared/constants.js";
import { db } from "../../shared/firebase-config.js";

/**
 * Inicia a contagem do "modo aula" e atualiza a UI em #modo-aula-timer.
 * Ao atingir MODO_AULA_DURATION_MS, deve disparar showPausaLembrete().
 */
export function startModoAulaTimer() {
  // TODO
}

/**
 * Exibe o lembrete de pausa/respiração em #pausa-lembrete.
 */
export function showPausaLembrete() {
  // TODO
}

/**
 * Exibe o check-in de humor (#mood-checkin) com as opções de MOOD_VALUES
 * e grava a resposta em DB_PATHS.moodCheckins no Firebase.
 */
export function showMoodCheckin() {
  // TODO
}
