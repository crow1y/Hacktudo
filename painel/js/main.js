import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS } from "../../shared/constants.js";
import { initPresenceView } from "./presence.js";

const listaEl = document.getElementById("animais-lista");
const detalheEl = document.getElementById("animal-detalhe");

let animals = [];
let animalsById = new Map();
// animalAtivoId (DB_PATHS.activeAnimal) só serve hoje pra escolher qual
// animal abre sozinho no painel de detalhes quando um aluno escaneia —
// "selecionado" é o que de fato aparece lá (segue o ativo automaticamente,
// mas o professor pode clicar noutro da lista pra consultar sem perder o
// que já tinha aparecido). O selo "🔴 Ativo agora" NÃO usa mais
// animalAtivoId (ver temAlguemAoVivo() abaixo, baseado em session/viewers).
let animalAtivoId = null;
let animalSelecionadoId = null;
// Quem está vendo cada modelo agora (session/viewers, ver aluno/js/ar.js):
// Map<animalId, Array<{nome, matricula}>>. "expandidos" guarda quais
// blocos o professor abriu, pra não fechar sozinho a cada atualização
// (a lista de Animais é recriada via innerHTML em toda renderLista()).
let viewersByAnimalId = new Map();
const viewersExpandidos = new Set();

async function loadAnimals() {
  const response = await fetch("../content/animals.json");
  const data = await response.json();
  animals = data.animals;
  animalsById = new Map(animals.map((animal) => [animal.id, animal]));
}

// Conteúdo de Astronomia (orrery, sistema solar) vem do mesmo
// content/animals.json e do mesmo DB_PATHS.activeAnimal que os animais
// de verdade — só o campo "materia" diferencia. A lista/detalhe de
// "Animais" só mostra quem não é astronomia; astronomia tem seu próprio
// jeito de indicar "ativo agora" (ver atualizarBadgesAstronomia), porque
// já são cards fixos com <model-viewer>, não uma lista.
function isAstronomia(animal) {
  return animal.materia === "astronomia";
}

// Mesma ideia de isAstronomia(), só que pro card fixo de Física
// (#buraco-negro-info) em vez do de Astronomia.
function isFisica(animal) {
  return animal.materia === "fisica";
}

// "Ativo agora" precisa ser por modelo (alguém vendo ESSE agora), não o
// DB_PATHS.activeAnimal global — esse só guarda o último animal
// escaneado por QUALQUER aluno e nunca é limpo se o aluno fechar o app
// sem clicar "Escanear outro" (sem onDisconnect nesse path), então
// ficava "grudado" mostrando ativo pra sempre. session/viewers já tem
// onDisconnect (ver aluno/js/ar.js) — usar ele aqui resolve isso de
// graça, e de quebra já suporta vários animais "ativos" ao mesmo tempo
// (um aluno em cada), o que activeAnimal (um valor só) nunca conseguiria.
function temAlguemAoVivo(animalId) {
  return (viewersByAnimalId.get(animalId)?.length ?? 0) > 0;
}

// Bloco reaproveitado tanto nos itens da lista de Animais (gerados aqui)
// quanto nos cards fixos de Astronomia/Física (já no HTML, ver
// painel/index.html) — os dois só levam data-viewers-for="<animalId>",
// atualizarViewersBlocos() abaixo escreve o conteúdo real dos dois iguais.
function viewersBlocoHtml(animalId) {
  return `
    <div class="viewers-bloco" data-viewers-for="${animalId}">
      <button type="button" class="btn-link viewers-toggle" data-viewers-toggle="${animalId}">👀 Ninguém ao vivo agora</button>
      <ul class="viewers-lista" hidden></ul>
    </div>
  `;
}

function cardAnimalHtml(animal) {
  const imagemHtml = animal.imagem
    ? `<img src="${animal.imagem}" alt="" />`
    : `<span class="animal-link__sem-foto">${animal.nome.charAt(0)}</span>`;
  const classes = ["animal-link"];
  if (animal.id === animalSelecionadoId) classes.push("animal-link--selecionado");

  return `
    <li>
      <button type="button" class="${classes.join(" ")}" data-animal-id="${animal.id}">
        ${imagemHtml}
        <span class="animal-link__nome">${animal.nome}</span>
        ${temAlguemAoVivo(animal.id) ? '<span class="animal-link__badge">🔴 Ativo agora</span>' : ""}
      </button>
      ${viewersBlocoHtml(animal.id)}
    </li>
  `;
}

function renderLista() {
  listaEl.innerHTML = animals
    .filter((animal) => !isAstronomia(animal) && !isFisica(animal))
    .map(cardAnimalHtml)
    .join("");
  atualizarViewersBlocos();
}

// Escreve o conteúdo real (contagem + lista de nomes) em todo
// .viewers-bloco da página, seja o gerado dinamicamente (Animais) ou o
// fixo no HTML (Astronomia/Física) — chamado sempre que session/viewers
// muda OU a lista de Animais é recriada (senão os blocos novos ficam no
// texto padrão "Ninguém ao vivo agora").
function atualizarViewersBlocos() {
  document.querySelectorAll(".viewers-bloco[data-viewers-for]").forEach((blocoEl) => {
    const animalId = blocoEl.dataset.viewersFor;
    const viewers = viewersByAnimalId.get(animalId) ?? [];
    const expandido = viewersExpandidos.has(animalId);

    const botao = blocoEl.querySelector(".viewers-toggle");
    botao.textContent =
      viewers.length > 0 ? `👀 Ver quem está ao vivo (${viewers.length})` : "👀 Ninguém ao vivo agora";

    const lista = blocoEl.querySelector(".viewers-lista");
    lista.innerHTML = viewers
      .map((v) => `<li>${v.nome ?? "Aluno"} <span>${v.matricula ?? ""}</span></li>`)
      .join("");
    lista.hidden = !(expandido && viewers.length > 0);
  });
}

document.addEventListener("click", (event) => {
  const botao = event.target.closest("[data-viewers-toggle]");
  if (!botao) return;
  const animalId = botao.dataset.viewersToggle;

  if (viewersExpandidos.has(animalId)) viewersExpandidos.delete(animalId);
  else viewersExpandidos.add(animalId);

  atualizarViewersBlocos();
});

// Acende/apaga o selo "🔴 Ativo agora" nos cards fixos de Astronomia
// (painel/index.html, #astronomia-info) — equivalente ao badge da lista
// de Animais, mas sem lista nenhuma pra re-renderizar.
function atualizarBadgesAstronomia() {
  document.querySelectorAll(".astronomia-card[data-astronomia-id]").forEach((card) => {
    const badge = card.querySelector(".astronomia-card__badge");
    if (badge) badge.hidden = !temAlguemAoVivo(card.dataset.astronomiaId);
  });
}

// Mesma ideia de atualizarBadgesAstronomia(), pro card fixo de Física
// (#buraco-negro-info) — atributo separado (data-fisica-id) de propósito,
// pra não misturar com o seletor de Astronomia acima.
function atualizarBadgesFisica() {
  document.querySelectorAll(".astronomia-card[data-fisica-id]").forEach((card) => {
    const badge = card.querySelector(".astronomia-card__badge");
    if (badge) badge.hidden = !temAlguemAoVivo(card.dataset.fisicaId);
  });
}

function fichaItemHtml(rotulo, valor) {
  return valor ? `<div class="ficha-item"><dt>${rotulo}</dt><dd>${valor}</dd></div>` : "";
}

function renderDetalhe(animalId) {
  const animal = animalId ? animalsById.get(animalId) : null;

  if (!animal) {
    detalheEl.innerHTML = `<p id="animal-placeholder">Escolha um animal na lista ao lado, ou aguarde um aluno escanear um.</p>`;
    return;
  }

  const info = animal.info ?? {};
  const fichaHtml = [
    fichaItemHtml("Nome científico", info.nomeCientifico),
    fichaItemHtml("Classificação", info.classificacao),
    fichaItemHtml("Habitat", info.habitat),
    fichaItemHtml("Alimentação", info.alimentacao),
    fichaItemHtml("Tamanho", info.tamanho),
    fichaItemHtml("Tempo de vida", info.tempoDeVida),
  ].join("");

  const curiosidadesHtml = (info.curiosidades ?? []).map((curiosidade) => `<li>${curiosidade}</li>`).join("");
  const imagemHtml = animal.imagem
    ? `<button type="button" class="animal-detalhe__foto-btn" data-imagem="${animal.imagem}" data-nome="${animal.nome}">
         <img class="animal-detalhe__foto" src="${animal.imagem}" alt="${animal.nome}" />
         <span class="animal-detalhe__foto-hint">🔍 Ver imagem completa</span>
       </button>`
    : "";

  detalheEl.innerHTML = `
    ${imagemHtml}
    <h2>${animal.nome}</h2>
    ${info.comportamento ? `<p>${info.comportamento}</p>` : ""}
    ${fichaHtml ? `<dl class="ficha">${fichaHtml}</dl>` : ""}
    ${curiosidadesHtml ? `<h3>Curiosidades</h3><ul>${curiosidadesHtml}</ul>` : ""}
  `;
}

listaEl.addEventListener("click", (event) => {
  const botao = event.target.closest("button[data-animal-id]");
  if (!botao) return;
  animalSelecionadoId = botao.dataset.animalId;
  renderLista();
  renderDetalhe(animalSelecionadoId);
});

// Modal de imagem em tela cheia (sem o corte do CSS do card) — é a
// mesma foto usada no card, então também serve como a imagem de
// verdade pra projetar/escanear com a turma.
const imagemModalEl = document.getElementById("imagem-modal");
const imagemModalFotoEl = document.getElementById("imagem-modal-foto");

function abrirImagemModal(src, alt) {
  imagemModalFotoEl.src = src;
  imagemModalFotoEl.alt = alt;
  imagemModalEl.hidden = false;
}

function fecharImagemModal() {
  imagemModalEl.hidden = true;
}

// No document inteiro (não só detalheEl) porque os cards fixos de
// Astronomia (#astronomia-info) reaproveitam a mesma classe de botão de
// foto, fora da árvore do #animal-detalhe.
document.addEventListener("click", (event) => {
  const botao = event.target.closest(".animal-detalhe__foto-btn");
  if (!botao) return;
  abrirImagemModal(botao.dataset.imagem, botao.dataset.nome);
});

document.getElementById("imagem-modal-fechar").addEventListener("click", fecharImagemModal);
imagemModalEl.addEventListener("click", (event) => {
  if (event.target === imagemModalEl) fecharImagemModal();
});
document.addEventListener("keydown", (event) => {
  if (event.key === "Escape") fecharImagemModal();
});

// Menu de subtópico: só troca qual .conteudo-materia fica visível — cada
// subtópico já tem seu conteúdo pronto no HTML (estático, como
// astronomia) ou alimentado por um listener próprio (como animais).
// Escopado por .conteudo-materia-grupo (uma matéria) de propósito: agora
// que Física também tem um subtópico próprio (Buraco Negro), um seletor
// global pegaria os `.subtopico-btn`/`.conteudo-materia` das duas
// matérias juntos, e clicar num subtópico de Ciências esconderia por
// engano o conteúdo de Física (mesmas classes CSS nas duas, sem esse
// escopo).
function initMateriasNav() {
  document.querySelectorAll(".conteudo-materia-grupo").forEach((grupo) => {
    const botoes = grupo.querySelectorAll(".subtopico-btn");
    const conteudos = grupo.querySelectorAll(".conteudo-materia");

    botoes.forEach((botao) => {
      botao.addEventListener("click", () => {
        const subtopico = botao.dataset.subtopico;

        botoes.forEach((b) => b.classList.toggle("subtopico-btn--active", b === botao));
        conteudos.forEach((conteudo) => {
          conteudo.hidden = conteudo.dataset.conteudo !== subtopico;
        });
      });
    });
  });
}

initMateriasNav();

// Troca qual matéria fica visível (Ciências, Gramática, Geografia...).
// Cada matéria nova entra só com o placeholder "Em breve..." (igual
// Astronomia já fazia dentro de Ciências) até ganhar conteúdo de
// verdade — nesse caso não precisa mexer em JS nenhum, só HTML (ver
// CLAUDE.md). Ciências é a única com subtópicos próprios por dentro
// (initMateriasNav acima), então ela guarda um segundo nível de nav.
function initMateriaTabs() {
  const botoes = document.querySelectorAll(".materia-btn");
  const grupos = document.querySelectorAll("[data-materia-conteudo]");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const materia = botao.dataset.materia;

      botoes.forEach((b) => b.classList.toggle("materia-btn--active", b === botao));
      grupos.forEach((grupo) => {
        grupo.hidden = grupo.dataset.materiaConteudo !== materia;
      });
    });
  });
}

initMateriaTabs();

// Abas de topo do painel: "Matérias" (menu de disciplinas de sempre) e
// "Presenças" (acompanhamento do professor) — são vistas separadas de
// propósito, sem misturar com o .materias-nav de dentro de "Matérias".
function initPainelTabs() {
  const botoes = document.querySelectorAll(".painel-tab-btn");
  const paineis = document.querySelectorAll("[data-painel-view]");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const view = botao.dataset.painelTab;

      botoes.forEach((b) => b.classList.toggle("painel-tab-btn--active", b === botao));
      paineis.forEach((painel) => {
        painel.hidden = painel.dataset.painelView !== view;
      });
    });
  });
}

initPainelTabs();

// Chamado por auth-gate.js só depois do professor estar autenticado e
// liberado pelo admin.
export async function startApp() {
  initPresenceView();

  await loadAnimals();
  renderLista();
  renderDetalhe(null);
  atualizarBadgesAstronomia();
  atualizarBadgesFisica();

  // session/viewers/<animalId>/<uid> inteiro de uma vez (poucos alunos
  // simultâneos no hackathon, não compensa um listener por animal) —
  // reconstrói o Map inteiro a cada mudança e atualiza todos os blocos.
  onValue(ref(db, DB_PATHS.viewers), (snapshot) => {
    const data = snapshot.val() ?? {};
    viewersByAnimalId = new Map(
      Object.entries(data).map(([animalId, porUid]) => [animalId, Object.values(porUid ?? {})])
    );
    // Os badges "🔴 Ativo agora" (lista de Animais e cards fixos) também
    // dependem de viewersByAnimalId agora — precisam recalcular junto.
    renderLista();
    atualizarBadgesAstronomia();
    atualizarBadgesFisica();
  });

  onValue(ref(db, DB_PATHS.activeAnimal), (snapshot) => {
    animalAtivoId = snapshot.val();
    const animalAtivo = animalAtivoId ? animalsById.get(animalAtivoId) : null;
    const ativoTemAbaPropria = animalAtivo && (isAstronomia(animalAtivo) || isFisica(animalAtivo));

    // Só avança a seleção da aba Animais quando o ativo é de fato um
    // animal — astronomia/física têm seu próprio indicador (badge nos
    // cards fixos), não devem "roubar" o painel de detalhe dos animais
    // nem aparecer lá. Se o aluno soltar a captura (activeAnimal vira
    // null), o painel continua mostrando o último animal em vez de
    // voltar pro placeholder vazio.
    if (animalAtivoId && !ativoTemAbaPropria) {
      animalSelecionadoId = animalAtivoId;
    }
    renderLista();
    renderDetalhe(animalSelecionadoId);
    atualizarBadgesAstronomia();
    atualizarBadgesFisica();
  });
}
