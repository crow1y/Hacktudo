// Reconhecimento de imagem + renderização do modelo 3D, via MindAR + A-Frame.
//
// Suporta múltiplos animais/alvos simultâneos: todos compartilham o mesmo
// arquivo .mind (targetSrc em content/animals.json), e cada animal aponta
// pro seu targetIndex dentro desse arquivo. Ver o comentário
// "_comment_targetSrc" em content/animals.json para como compilar isso.
//
// Ainda usa o alvo e o modelo de exemplo públicos (entrada "teste-pipeline")
// só para validar a pipeline inteira (câmera → detecção → modelo 3D →
// Firebase) antes dos assets reais dos animais estarem prontos.

import { ref, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS } from "../../shared/constants.js";

// Animais com model ainda "TODO" (placeholder) são ignorados na cena AR —
// senão o <a-assets> tenta carregar um arquivo inexistente e atrasa a
// inicialização da cena inteira. Continuam em content/animals.json
// normalmente, só não viram alvo até o asset real existir.
function isAssetReady(animal) {
  return !animal.model.includes("TODO");
}

export async function initAR() {
  const response = await fetch("../content/animals.json");
  const { targetSrc, animals } = await response.json();
  const readyAnimals = animals.filter(isAssetReady);

  const assetsHtml = readyAnimals
    .map((animal) => `<a-asset-item id="model-${animal.id}" src="${animal.model}"></a-asset-item>`)
    .join("");

  const targetsHtml = readyAnimals
    .map(
      (animal) => `
        <a-entity class="ar-target" data-animal-id="${animal.id}" mindar-image-target="targetIndex: ${animal.targetIndex}">
          <!-- Posição/escala/rotação são um chute inicial — ajustar visualmente
               testando no celular, cada modelo tem proporções diferentes. -->
          <a-gltf-model
            src="#model-${animal.id}"
            position="0 0 0"
            scale="0.05 0.05 0.05"
            animation-mixer
          ></a-gltf-model>
        </a-entity>
      `
    )
    .join("");

  document.getElementById("ar-container").innerHTML = `
    <a-scene
      mindar-image="imageTargetSrc: ${targetSrc}; autoStart: true; uiScanning: no;"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      renderer="colorManagement: true"
      embedded
    >
      <a-assets>${assetsHtml}</a-assets>
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      ${targetsHtml}
    </a-scene>
  `;

  const sceneEl = document.querySelector("a-scene");

  sceneEl.addEventListener("arError", (event) => {
    showCameraError(event.detail?.error);
  });

  for (const targetEl of document.querySelectorAll(".ar-target")) {
    const animalId = targetEl.dataset.animalId;

    targetEl.addEventListener("targetFound", () => {
      set(ref(db, DB_PATHS.activeAnimal), animalId);
    });

    targetEl.addEventListener("targetLost", () => {
      set(ref(db, DB_PATHS.activeAnimal), null);
    });
  }
}

function showCameraError() {
  const errorEl = document.getElementById("ar-error");
  errorEl.hidden = false;
  errorEl.textContent =
    "Não conseguimos acessar a câmera. Verifique se você deu permissão pro navegador e se está acessando por HTTPS (ou localhost), depois recarregue a página.";
}
