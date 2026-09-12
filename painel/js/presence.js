import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS, PRESENCA_STATUS } from "../../shared/constants.js";

const dataInputEl = document.getElementById("presenca-data");
const listaEl = document.getElementById("presencas-lista");
const vazioEl = document.getElementById("presencas-vazio");

let pararDeOuvir = null;

function dataDeHoje() {
  const agora = new Date();
  const pad = (n) => String(n).padStart(2, "0");
  return `${agora.getFullYear()}-${pad(agora.getMonth() + 1)}-${pad(agora.getDate())}`;
}

function formatarDuracao(ms) {
  const totalMin = Math.round((ms ?? 0) / 60000);
  const h = Math.floor(totalMin / 60);
  const min = totalMin % 60;
  return h > 0 ? `${h}h ${min}min` : `${min}min`;
}

function formatarHora(timestamp) {
  if (!timestamp) return "—";
  return new Date(timestamp).toLocaleTimeString("pt-BR", { hour: "2-digit", minute: "2-digit" });
}

const STATUS_LABEL = {
  [PRESENCA_STATUS.PENDENTE]: "⏳ Pendente",
  [PRESENCA_STATUS.CONFIRMADA]: "✅ Confirmada",
  [PRESENCA_STATUS.REJEITADA]: "❌ Não presente",
};

function presencaItemHtml(uid, presenca) {
  const status = presenca.status ?? PRESENCA_STATUS.PENDENTE;

  return `
    <li class="presenca-item">
      <div class="presenca-item__aluno">
        <strong>${presenca.nome ?? "Aluno"}</strong>
        <span>${presenca.matricula ?? ""}</span>
      </div>
      <div class="presenca-item__tempos">
        <span>Entrada: ${formatarHora(presenca.entrada)}</span>
        <span>Tempo em aula: ${formatarDuracao(presenca.duracaoMs)}</span>
        ${presenca.online ? '<span class="presenca-item__online">🟢 Na aula agora</span>' : ""}
      </div>
      <div class="presenca-item__validacao">
        <span class="presenca-badge presenca-badge--${status}">${STATUS_LABEL[status]}</span>
        <div class="presenca-item__acoes">
          <button type="button" class="btn-secondary" data-acao="confirmar" data-uid="${uid}">Confirmar</button>
          <button type="button" class="btn-link" data-acao="rejeitar" data-uid="${uid}">Não presente</button>
        </div>
      </div>
    </li>
  `;
}

function renderPresencas(presencas) {
  const entradas = Object.entries(presencas ?? {}).sort(
    (a, b) => (a[1].entrada ?? 0) - (b[1].entrada ?? 0)
  );

  vazioEl.hidden = entradas.length > 0;
  listaEl.innerHTML = entradas.map(([uid, presenca]) => presencaItemHtml(uid, presenca)).join("");
}

function ouvirPresencasDoDia(data) {
  if (pararDeOuvir) pararDeOuvir();
  pararDeOuvir = onValue(ref(db, `${DB_PATHS.presencas}/${data}`), (snapshot) => {
    renderPresencas(snapshot.val());
  });
}

listaEl.addEventListener("click", (event) => {
  const botao = event.target.closest("button[data-acao]");
  if (!botao) return;

  const status =
    botao.dataset.acao === "confirmar" ? PRESENCA_STATUS.CONFIRMADA : PRESENCA_STATUS.REJEITADA;

  update(ref(db, `${DB_PATHS.presencas}/${dataInputEl.value}/${botao.dataset.uid}`), { status });
});

dataInputEl.addEventListener("change", () => ouvirPresencasDoDia(dataInputEl.value));

// Chamado por main.js depois que o professor está autenticado e liberado.
export function initPresenceView() {
  dataInputEl.value = dataDeHoje();
  dataInputEl.max = dataDeHoje();
  ouvirPresencasDoDia(dataInputEl.value);
}
