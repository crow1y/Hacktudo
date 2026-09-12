import { initAR } from "./ar.js";

// Chamado por auth-gate.js só depois do aluno estar autenticado.
export function startApp() {
  initAR();
}
