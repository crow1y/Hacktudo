import { ref, onValue } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS } from "../../shared/constants.js";

// Ponto de entrada do painel do professor.
// TODO:
//   1. Carregar content/animals.json (fetch) para ter nome/info por id.
//   2. Assinar DB_PATHS.activeAnimal com onValue() e renderizar em #animal-info.
//   3. Assinar DB_PATHS.moodCheckins com onValue() e renderizar agregação em #mood-summary.

onValue(ref(db, DB_PATHS.activeAnimal), (snapshot) => {
  const animalId = snapshot.val();
  // TODO: buscar animalId em animals.json e atualizar #animal-info
  console.log("Animal ativo:", animalId);
});
