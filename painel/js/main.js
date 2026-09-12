import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS } from "../../shared/constants.js";

const animalInfoEl = document.getElementById("animal-info");

let animalsById = new Map();

async function loadAnimals() {
  const response = await fetch("../content/animals.json");
  const data = await response.json();
  animalsById = new Map(data.animals.map((animal) => [animal.id, animal]));
}

function renderAnimal(animalId) {
  const animal = animalId ? animalsById.get(animalId) : null;

  if (!animal) {
    animalInfoEl.innerHTML = `<p id="animal-placeholder">Aguardando aluno escanear um animal…</p>`;
    return;
  }

  const curiosidadesHtml = animal.info.curiosidades
    .map((curiosidade) => `<li>${curiosidade}</li>`)
    .join("");

  animalInfoEl.innerHTML = `
    <h2>${animal.nome}</h2>
    <p>${animal.info.comportamento}</p>
    <ul>${curiosidadesHtml}</ul>
  `;
}

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

  onValue(ref(db, DB_PATHS.activeAnimal), (snapshot) => {
    renderAnimal(snapshot.val());
  });
}
