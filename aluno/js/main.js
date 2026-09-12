import { initAR } from "./ar.js";
import { iniciarPresenca } from "./presence.js";
import { ouvirPerfil } from "../../shared/auth.js";
import { ROLES } from "../../shared/constants.js";

// Chamado por auth-gate.js só depois do aluno estar autenticado.
export function startApp(user) {
  initAR();

  // ouvirPerfil dispara de novo se o perfil mudar, mas iniciarPresenca só
  // deve rodar uma vez por sessão (ela mesma já lida com reabrir o app
  // no mesmo dia via transação).
  const pararDeOuvirPerfil = ouvirPerfil(ROLES.ALUNO, user.uid, (perfil) => {
    if (!perfil) return;
    pararDeOuvirPerfil();
    iniciarPresenca(user, perfil);
  });
}
