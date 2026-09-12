// Reconhecimento de imagem + renderização do modelo 3D (MindAR + Three.js/A-Frame).
// TODO: implementar depois. Nada aqui ainda é funcional.

import { DB_PATHS } from "../../shared/constants.js";
import { db } from "../../shared/firebase-config.js";

/**
 * Inicializa a cena AR e registra o listener de detecção de alvo (imagem do animal).
 * Quando um alvo for reconhecido, deve:
 *   1. Exibir o modelo 3D animado correspondente (ver content/animals.json).
 *   2. Escrever o id do animal ativo em DB_PATHS.activeAnimal no Firebase,
 *      para o painel do professor atualizar em tempo real.
 */
export function initAR() {
  // TODO: setup do MindAR (image tracking), carregar targets/models de
  // content/animals.json, e disparar update no Firebase via `db` a cada
  // detecção/perda de alvo.
}
