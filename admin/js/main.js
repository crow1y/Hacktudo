// Painel do dono do sistema: aprova (ou revoga) o acesso de professores
// cadastrados. Gate por código fixo (ver ADMIN_ACCESS_CODE em
// shared/constants.js) — não é segurança real, só evita cliques acidentais
// durante o hackathon (mesma ressalva das regras abertas do Realtime
// Database).
import { ref, onValue, update } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS, ADMIN_ACCESS_CODE } from "../../shared/constants.js";
import { ativarToggleDeSenha } from "../../shared/ui.js";

ativarToggleDeSenha();

const SESSION_KEY = "vivalivro-admin-autenticado";

const gateEl = document.getElementById("admin-gate");
const panelEl = document.getElementById("admin-panel");
const codeForm = document.getElementById("code-form");
const codeError = document.getElementById("code-error");
const pendingListEl = document.getElementById("pending-list");
const approvedListEl = document.getElementById("approved-list");

function itemHtml(professor) {
  const acao = professor.liberado ? "revogar" : "liberar";
  const rotulo = professor.liberado ? "Revogar acesso" : "Liberar acesso";
  return `
    <li>
      <span><strong>${professor.nome}</strong> — matrícula ${professor.matricula} — CPF ${professor.cpf ?? "—"}</span>
      <button type="button" data-uid="${professor.uid}" data-acao="${acao}">${rotulo}</button>
    </li>
  `;
}

function renderProfessores(professoresPorUid) {
  const professores = Object.entries(professoresPorUid ?? {}).map(([uid, dados]) => ({
    uid,
    ...dados,
  }));

  const pendentes = professores.filter((p) => !p.liberado);
  const liberados = professores.filter((p) => p.liberado);

  pendingListEl.innerHTML = pendentes.length
    ? pendentes.map(itemHtml).join("")
    : "<li>Nenhum professor aguardando.</li>";

  approvedListEl.innerHTML = liberados.length
    ? liberados.map(itemHtml).join("")
    : "<li>Nenhum professor liberado ainda.</li>";
}

function alternarLiberacao(uid, liberar) {
  update(ref(db, `${DB_PATHS.professores}/${uid}`), { liberado: liberar });
}

for (const listEl of [pendingListEl, approvedListEl]) {
  listEl.addEventListener("click", (event) => {
    const button = event.target.closest("button[data-uid]");
    if (!button) return;
    alternarLiberacao(button.dataset.uid, button.dataset.acao === "liberar");
  });
}

function mostrarPainel() {
  gateEl.hidden = true;
  panelEl.hidden = false;
  onValue(ref(db, DB_PATHS.professores), (snapshot) => renderProfessores(snapshot.val()));
}

if (sessionStorage.getItem(SESSION_KEY) === "1") {
  mostrarPainel();
}

codeForm.addEventListener("submit", (event) => {
  event.preventDefault();
  const codigo = document.getElementById("access-code").value;

  if (codigo === ADMIN_ACCESS_CODE) {
    sessionStorage.setItem(SESSION_KEY, "1");
    mostrarPainel();
  } else {
    codeError.textContent = "Código incorreto.";
  }
});
