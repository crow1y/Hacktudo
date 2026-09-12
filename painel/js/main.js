import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS } from "../../shared/constants.js";

const animalInfoEl = document.getElementById("animal-info");
const checkinListEl = document.getElementById("checkin-list");

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

function renderCheckins(checkins) {
  const porAluno = new Map();

  for (const checkin of Object.values(checkins ?? {})) {
    const atual = porAluno.get(checkin.uid) ?? {
      nome: checkin.nome,
      matricula: checkin.matricula,
      total: 0,
      ultimoTimestamp: 0,
    };
    atual.total += 1;
    atual.ultimoTimestamp = Math.max(atual.ultimoTimestamp, checkin.timestamp ?? 0);
    porAluno.set(checkin.uid, atual);
  }

  const alunos = [...porAluno.values()].sort((a, b) => a.nome.localeCompare(b.nome));

  if (alunos.length === 0) {
    checkinListEl.innerHTML = "<li>Nenhum check-in ainda.</li>";
    return;
  }

  checkinListEl.innerHTML = alunos
    .map((aluno) => {
      const ultimoHorario = new Date(aluno.ultimoTimestamp).toLocaleTimeString("pt-BR");
      return `<li><strong>${aluno.nome}</strong> (matrícula ${aluno.matricula}) — ${aluno.total} check-in(s), último às ${ultimoHorario}</li>`;
    })
    .join("");
}

// Chamado por auth-gate.js só depois do professor estar autenticado e
// liberado pelo admin.
export async function startApp() {
  await loadAnimals();

  onValue(ref(db, DB_PATHS.activeAnimal), (snapshot) => {
    renderAnimal(snapshot.val());
  });

  onValue(ref(db, DB_PATHS.checkins), (snapshot) => {
    renderCheckins(snapshot.val());
  });
}
