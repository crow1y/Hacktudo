import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS } from "../../shared/constants.js";

const listaEl = document.getElementById("animais-lista");
const detalheEl = document.getElementById("animal-detalhe");

let animals = [];
let animalsById = new Map();
// Dois estados separados de propósito: "ativo" é o que o Firebase diz que
// algum aluno escaneou agora; "selecionado" é o que aparece no painel de
// detalhes (segue o ativo automaticamente, mas o professor pode clicar
// noutro animal da lista pra consultar sem perder o que já apareceu).
let animalAtivoId = null;
let animalSelecionadoId = null;

async function loadAnimals() {
  const response = await fetch("../content/animals.json");
  const data = await response.json();
  animals = data.animals;
  animalsById = new Map(animals.map((animal) => [animal.id, animal]));
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
        ${animal.id === animalAtivoId ? '<span class="animal-link__badge">🔴 Ativo agora</span>' : ""}
      </button>
    </li>
  `;
}

function renderLista() {
  listaEl.innerHTML = animals.map(cardAnimalHtml).join("");
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
    ? `<img class="animal-detalhe__foto" src="${animal.imagem}" alt="${animal.nome}" />`
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

// Menu de matérias: só troca qual .conteudo-materia fica visível — cada
// subtópico já tem seu conteúdo pronto no HTML (estático, como
// astronomia) ou alimentado por um listener próprio (como animais).
function initMateriasNav() {
  const botoes = document.querySelectorAll(".subtopico-btn");
  const conteudos = document.querySelectorAll(".conteudo-materia");

  botoes.forEach((botao) => {
    botao.addEventListener("click", () => {
      const subtopico = botao.dataset.subtopico;

      botoes.forEach((b) => b.classList.toggle("subtopico-btn--active", b === botao));
      conteudos.forEach((conteudo) => {
        conteudo.hidden = conteudo.dataset.conteudo !== subtopico;
      });
    });
  });
}

initMateriasNav();

// Chamado por auth-gate.js só depois do professor estar autenticado e
// liberado pelo admin.
export async function startApp() {
  await loadAnimals();
  renderLista();
  renderDetalhe(null);

  onValue(ref(db, DB_PATHS.activeAnimal), (snapshot) => {
    animalAtivoId = snapshot.val();
    // Só avança a seleção quando tem um animal ativo de verdade — se o
    // aluno soltar a captura (activeAnimal vira null), o painel continua
    // mostrando o último animal em vez de voltar pro placeholder vazio.
    if (animalAtivoId) {
      animalSelecionadoId = animalAtivoId;
    }
    renderLista();
    renderDetalhe(animalSelecionadoId);
  });
}
