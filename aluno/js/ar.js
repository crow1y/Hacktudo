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
//
// Fluxo de "captura": a primeira vez que um alvo é detectado, o modelo é
// escondido na página e um "companion" (mesmo modelo, mesma escala) passa
// a ficar grudado na câmera — assim o aluno pode andar pela sala com o
// animal na tela sem precisar manter a página apontada. O botão
// "Escanear outro animal" solta a captura e libera o app pra detectar um
// novo alvo. Isso não usa rastreamento de mundo/WebXR (que não existe no
// Safari do iPhone) — o companion só acompanha rigidamente a câmera, não
// respeita móveis/paredes de verdade (ver CLAUDE.md).

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

// Faz o modelo "andar" num pequeno círculo ao redor do próprio ponto de
// ancoragem, de frente pra direção do movimento. Fica no filho (o
// a-gltf-model), nunca na a-entity do alvo (mindar-image-target) — o
// MindAR sobrescreve a matriz da entidade do alvo a cada frame de
// rastreamento, então qualquer posição definida ali seria imediatamente
// perdida.
if (!AFRAME.components["wander"]) {
  AFRAME.registerComponent("wander", {
    schema: {
      radius: { default: 0.12 },
      speed: { default: 0.5 },
    },
    tick(time) {
      const angle = (time / 1000) * this.data.speed;
      const x = Math.cos(angle) * this.data.radius;
      const z = Math.sin(angle) * this.data.radius;
      this.el.object3D.position.set(x, 0, z);
      this.el.object3D.rotation.y = -angle - Math.PI / 2;
    },
  });
}

// Escolhe, entre os clipes de animação carregados do glTF, um pra
// "andar" (contínuo, usado com o componente wander acima) e outro pra
// "reagir" ao toque — por nome quando possível (convenção comum tipo
// Mixamo: Walk/Run/Idle/Attack), com fallback pros primeiros/últimos
// clipes disponíveis para modelos com nomes diferentes.
function pickClips(clipNames) {
  const findByPattern = (pattern) => clipNames.find((name) => pattern.test(name));

  const walk = findByPattern(/walk/i) ?? clipNames[0];
  const react =
    findByPattern(/run|jump|attack|eat|bite|roar/i) ??
    clipNames.find((name) => name !== walk) ??
    walk;

  return { walk, react };
}

function setupInteraction(gltfEl) {
  let reacting = false;
  let clips = null;

  gltfEl.addEventListener("model-loaded", (event) => {
    const clipNames = (event.detail.model.animations ?? []).map((clip) => clip.name);
    if (clipNames.length === 0) return;

    clips = pickClips(clipNames);
    gltfEl.setAttribute("animation-mixer", `clip: ${clips.walk}; loop: repeat`);
  });

  gltfEl.addEventListener("click", () => {
    if (!clips || reacting || clips.react === clips.walk) return;

    reacting = true;
    gltfEl.setAttribute("animation-mixer", `clip: ${clips.react}; loop: repeat`);

    setTimeout(() => {
      gltfEl.setAttribute("animation-mixer", `clip: ${clips.walk}; loop: repeat`);
      reacting = false;
    }, 2500);
  });
}

export async function initAR() {
  const response = await fetch("../content/animals.json");
  const { targetSrc, animals } = await response.json();
  const readyAnimals = animals.filter(isAssetReady);

  // scale é um chute inicial por animal — cada modelo tem proporções
  // diferentes, ajustar testando no celular. O valor abaixo (0.005) foi
  // calculado para o Fox.glb de teste (~79 unidades de altura nativa);
  // outros modelos vão precisar de outro valor.
  const scaleByAnimalId = Object.fromEntries(readyAnimals.map((animal) => [animal.id, "0.005 0.005 0.005"]));

  const assetsHtml = readyAnimals
    .map((animal) => `<a-asset-item id="model-${animal.id}" src="${animal.model}"></a-asset-item>`)
    .join("");

  const targetsHtml = readyAnimals
    .map(
      (animal) => `
        <a-entity class="ar-target" data-animal-id="${animal.id}" mindar-image-target="targetIndex: ${animal.targetIndex}">
          <a-gltf-model
            class="clickable animal-model"
            src="#model-${animal.id}"
            position="0 0 0"
            scale="${scaleByAnimalId[animal.id]}"
            wander
            animation-mixer
          ></a-gltf-model>
        </a-entity>
      `
    )
    .join("");

  document.getElementById("ar-container").innerHTML = `
    <a-scene
      mindar-image="imageTargetSrc: ${targetSrc}; autoStart: true; uiScanning: no; missTolerance: 60;"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      renderer="colorManagement: true"
      embedded
    >
      <a-assets>${assetsHtml}</a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false">
        <!-- "Companion": modelo grudado na câmera depois da primeira
             captura (ver comentário no topo do arquivo). Posição é um
             chute inicial (mais baixo na tela pra parecer "andando no
             chão") — ajustar testando no celular. -->
        <a-entity
          id="companion-model"
          class="clickable"
          position="0 -0.3 -0.7"
          wander="radius: 0.06; speed: 0.6"
          animation-mixer
          visible="false"
        ></a-entity>
      </a-camera>

      <a-entity cursor="rayOrigin: mouse; fuse: false" raycaster="objects: .clickable"></a-entity>
      ${targetsHtml}
    </a-scene>
  `;

  const sceneEl = document.querySelector("a-scene");
  const companionEl = document.getElementById("companion-model");
  const resetBtn = document.getElementById("reset-scan-btn");

  setupInteraction(companionEl);
  for (const gltfEl of document.querySelectorAll(".animal-model")) {
    setupInteraction(gltfEl);
  }

  sceneEl.addEventListener("arError", (event) => {
    showCameraError(event.detail?.error);
  });

  let capturedAnimalId = null;

  resetBtn.addEventListener("click", () => {
    if (!capturedAnimalId) return;

    document.querySelector(`.ar-target[data-animal-id="${capturedAnimalId}"] .animal-model`).setAttribute("visible", true);
    companionEl.setAttribute("visible", false);
    resetBtn.hidden = true;
    capturedAnimalId = null;

    set(ref(db, DB_PATHS.activeAnimal), null);
  });

  for (const targetEl of document.querySelectorAll(".ar-target")) {
    const animalId = targetEl.dataset.animalId;

    targetEl.addEventListener("targetFound", () => {
      if (capturedAnimalId) return; // já tem um animal capturado — ignora novas detecções até "escanear outro"

      capturedAnimalId = animalId;
      targetEl.querySelector(".animal-model").setAttribute("visible", false);

      companionEl.setAttribute("gltf-model", `#model-${animalId}`);
      companionEl.setAttribute("scale", scaleByAnimalId[animalId]);
      companionEl.setAttribute("visible", true);
      resetBtn.hidden = false;

      set(ref(db, DB_PATHS.activeAnimal), animalId);
    });
  }
}

function showCameraError() {
  const errorEl = document.getElementById("ar-error");
  errorEl.hidden = false;
  errorEl.textContent =
    "Não conseguimos acessar a câmera. Verifique se você deu permissão pro navegador e se está acessando por HTTPS (ou localhost), depois recarregue a página.";
}
