// Presença automática do aluno: abre um registro de presença do dia ao
// entrar na área do aluno, e soma quanto tempo o app fica aberto e em
// primeiro plano (congela ao minimizar/trocar de aba, sem exibir nenhum
// cronômetro pro aluno — é um registro silencioso pro professor, não uma
// métrica de engajamento pro aluno ver). Ver "Posicionamento do produto"
// no CLAUDE.md: nada aqui deve competir pela atenção do aluno.
import {
  ref,
  runTransaction,
  update,
  onDisconnect,
  increment,
} from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS, PRESENCA_STATUS } from "../../shared/constants.js";

const HEARTBEAT_MS = 15000;

function dataDeHoje() {
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

// Chamado uma vez, depois que o aluno está autenticado e o perfil
// (nome/matrícula) já foi carregado.
export function iniciarPresenca(user, perfil) {
  const presencaRef = ref(db, `${DB_PATHS.presencas}/${dataDeHoje()}/${user.uid}`);

  // Só cria o registro do dia na primeira entrada — reabrir o app mais
  // tarde no mesmo dia continua a mesma presença (preserva entrada
  // original e o status já validado pelo professor).
  runTransaction(presencaRef, (atual) => {
    if (atual) return atual;
    return {
      nome: perfil.nome,
      matricula: perfil.matricula,
      entrada: Date.now(),
      saida: Date.now(),
      duracaoMs: 0,
      status: PRESENCA_STATUS.PENDENTE,
      online: true,
    };
  });

  // Se a conexão cair (fechar o navegador, perder rede), o Firebase marca
  // sozinho como offline, mesmo sem um beforeunload confiável.
  onDisconnect(presencaRef).update({ online: false });

  let ultimoTick = Date.now();
  let intervalo = null;

  function tick() {
    const agora = Date.now();
    const delta = agora - ultimoTick;
    ultimoTick = agora;
    update(presencaRef, { duracaoMs: increment(delta), saida: agora, online: true });
  }

  function iniciarContagem() {
    if (intervalo) return;
    ultimoTick = Date.now();
    update(presencaRef, { online: true });
    intervalo = setInterval(tick, HEARTBEAT_MS);
  }

  // "Congela": para de somar tempo, mas não zera nada — a próxima
  // contagem retoma de onde parou.
  function pausarContagem() {
    if (!intervalo) return;
    clearInterval(intervalo);
    intervalo = null;
    update(presencaRef, { online: false });
  }

  document.addEventListener("visibilitychange", () => {
    if (document.visibilityState === "visible") {
      iniciarContagem();
    } else {
      pausarContagem();
    }
  });

  window.addEventListener("pagehide", pausarContagem);

  if (document.visibilityState === "visible") iniciarContagem();
}
