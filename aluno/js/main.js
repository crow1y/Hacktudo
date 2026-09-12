import { initAR } from "./ar.js";
import { startModoAulaTimer } from "./session-timer.js";

// Orquestra AR + camada de uso consciente. Chamado por auth-gate.js só
// depois do aluno estar autenticado.
export function startApp() {
  initAR();
  startModoAulaTimer();
}
