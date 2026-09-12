import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS, MOOD_VALUES, MOOD_LABELS } from "../../shared/constants.js";

const animalInfoEl = document.getElementById("animal-info");
const moodListEl = document.getElementById("mood-list");

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

function renderMoodSummary(checkins) {
  const counts = Object.fromEntries(MOOD_VALUES.map((mood) => [mood, 0]));

  for (const checkin of Object.values(checkins ?? {})) {
    if (checkin.mood in counts) {
      counts[checkin.mood] += 1;
    }
  }

  moodListEl.innerHTML = MOOD_VALUES.map(
    (mood) => `<li>${MOOD_LABELS[mood]}: ${counts[mood]}</li>`
  ).join("");
}

async function main() {
  await loadAnimals();

  onValue(ref(db, DB_PATHS.activeAnimal), (snapshot) => {
    renderAnimal(snapshot.val());
  });

  onValue(ref(db, DB_PATHS.moodCheckins), (snapshot) => {
    renderMoodSummary(snapshot.val());
  });
}

main();
