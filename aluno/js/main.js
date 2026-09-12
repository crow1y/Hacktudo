import { initAR } from "./ar.js";
import { iniciarCheckinsDeAula } from "./checkin.js";

// Orquestra AR + check-in de presença. Chamado por auth-gate.js só depois
// do aluno estar autenticado, com { uid, nome, matricula } do perfil dele.
export function startApp(aluno) {
  initAR();
  iniciarCheckinsDeAula(aluno);
}
