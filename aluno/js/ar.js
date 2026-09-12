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
// MindAR é sempre quem RECONHECE qual animal é (funciona em qualquer
// celular). O resultado é mostrado como um "cartão de prévia": modelo
// parado no centro da tela (grudado na câmera, não na página — não fica
// preso a manter a imagem no quadro), com um círculo atrás e o nome do
// animal, câmera escurecida nas bordas ao redor. Isso substitui a ideia
// antiga de "sai da página e anda pela sala", que sempre parecia
// flutuando de um jeito ou de outro sem rastreamento de mundo de verdade.
//
// Em aparelhos com suporte a WebXR + hit-test (Android/Chrome com ARCore
// — não existe no Safari/iPhone, ver CLAUDE.md), a partir da prévia
// aparece um botão pra "plantar" o animal em escala real num chão de
// verdade (aluno/js/webxr-mode.js). Os dois modos não rodam ao mesmo
// tempo — precisam de controle exclusivo da câmera — por isso o MindAR é
// parado antes de entrar em WebXR e reiniciado ao sair.

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

// Mantém a posição de um filho da câmera fixa num ponto (center), redefinida
// a cada frame via tick(). Existe porque, por algum motivo não totalmente
// entendido (possivelmente ligado a como o MindAR recalibra a câmera do
// A-Frame depois de rastrear um alvo), um filho da câmera com "position"
// definido só uma vez via atributo estático simplesmente não renderizava
// em teste real (confirmado: objeto 3D correto em tudo — visível, mesh
// carregado, pai certo — mas invisível na tela). Reafirmar a posição a
// cada frame via object3D.position.set(), do jeito que já era feito antes
// (era usado pra fazer o modelo andar em círculo), contorna o problema.
if (!AFRAME.components["hold-position"]) {
  AFRAME.registerComponent("hold-position", {
    schema: {
      center: { type: "vec3", default: { x: 0, y: 0, z: 0 } },
    },
    tick() {
      this.el.object3D.position.set(this.data.center.x, this.data.center.y, this.data.center.z);
    },
  });
}

// Escolhe, entre os clipes de animação carregados do glTF, um pra tocar
// "parado" (contínuo, ex: Walk/Idle tocando no lugar — recicla o que o
// modelo já tem, sem mover a posição) e outro pra "reagir" ao toque — por
// nome quando possível (convenção comum tipo Mixamo: Walk/Run/Idle/
// Attack), com fallback pros primeiros/últimos clipes disponíveis para
// modelos com nomes diferentes.
function pickClips(clipNames) {
  const findByPattern = (pattern) => clipNames.find((name) => pattern.test(name));

  const idle = findByPattern(/walk|idle/i) ?? clipNames[0];
  const react =
    findByPattern(/run|jump|attack|eat|bite|roar/i) ??
    clipNames.find((name) => name !== idle) ??
    idle;

  return { idle, react };
}

function setupInteraction(gltfEl) {
  let reacting = false;
  let clips = null;

  gltfEl.addEventListener("model-loaded", (event) => {
    const clipNames = (event.detail.model.animations ?? []).map((clip) => clip.name);
    if (clipNames.length === 0) return;

    clips = pickClips(clipNames);
    gltfEl.setAttribute("animation-mixer", `clip: ${clips.idle}; loop: repeat`);
  });

  gltfEl.addEventListener("click", () => {
    if (!clips || reacting || clips.react === clips.idle) return;

    reacting = true;
    gltfEl.setAttribute("animation-mixer", `clip: ${clips.react}; loop: repeat`);

    setTimeout(() => {
      gltfEl.setAttribute("animation-mixer", `clip: ${clips.idle}; loop: repeat`);
      reacting = false;
    }, 2500);
  });
}

async function supportsAdvancedAR() {
  if (!navigator.xr) return false;
  try {
    return await navigator.xr.isSessionSupported("immersive-ar");
  } catch {
    return false;
  }
}

export async function initAR() {
  const response = await fetch("../content/animals.json");
  const { targetSrc, animals } = await response.json();
  const readyAnimals = animals.filter(isAssetReady);
  const animalsById = new Map(readyAnimals.map((animal) => [animal.id, animal]));

  // scale é um chute inicial por animal — cada modelo tem proporções
  // diferentes, ajustar testando no celular. O valor abaixo (0.005) foi
  // calculado para o Fox.glb de teste (~79 unidades de altura nativa);
  // outros modelos vão precisar de outro valor. Só usada no cartão de
  // prévia — o modo WebXR calcula a escala em metros reais na hora.
  const scaleByAnimalId = Object.fromEntries(readyAnimals.map((animal) => [animal.id, "0.005 0.005 0.005"]));

  const advancedArAvailable = await supportsAdvancedAR();

  const assetsHtml = readyAnimals
    .map((animal) => `<a-asset-item id="model-${animal.id}" src="${animal.model}"></a-asset-item>`)
    .join("");

  // Um único alvo (mindar-image-target) por animal, sem filho visual —
  // só existe pra disparar targetFound/targetLost. O que aparece na tela
  // é sempre a prévia abaixo, grudada na câmera.
  const targetsHtml = readyAnimals
    .map((animal) => `<a-entity data-animal-id="${animal.id}" mindar-image-target="targetIndex: ${animal.targetIndex}"></a-entity>`)
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
        <!-- Cartão de prévia: círculo (halo/pedestal) atrás do modelo,
             ambos grudados na câmera (não na página) pra ficarem sempre
             centralizados na tela, parados. Escondidos até um animal ser
             reconhecido. -->
        <a-circle
          id="preview-platform"
          hold-position="center: 0 0 -0.62"
          radius="0.32"
          color="#ffffff"
          opacity="0.15"
          visible="false"
        ></a-circle>
        <a-entity
          id="preview-model"
          class="clickable"
          hold-position="center: 0 0 -0.6"
          animation-mixer
          visible="false"
        ></a-entity>
      </a-camera>

      <a-entity cursor="rayOrigin: mouse; fuse: false" raycaster="objects: .clickable"></a-entity>
      ${targetsHtml}
    </a-scene>
  `;

  const sceneEl = document.querySelector("a-scene");
  const previewModelEl = document.getElementById("preview-model");
  const previewPlatformEl = document.getElementById("preview-platform");
  const vignetteEl = document.getElementById("ar-vignette");
  const previewNameEl = document.getElementById("preview-name");
  const placeFloorBtn = document.getElementById("place-floor-btn");
  const scanAnotherBtn = document.getElementById("scan-another-btn");

  setupInteraction(previewModelEl);

  sceneEl.addEventListener("arError", (event) => {
    showCameraError(event.detail?.error);
  });

  let capturedAnimalId = null;
  let loadedModelAnimalId = null; // qual animal está de fato carregado no previewModelEl agora

  function showPreview(animal) {
    capturedAnimalId = animal.id;

    // Só redefine "gltf-model" se for um animal DIFERENTE do que já está
    // carregado. Depois do primeiro carregamento bem-sucedido, o A-Frame
    // reescreve esse atributo pra URL já resolvida (não mais "#model-id")
    // — redefinir com "#model-id" de novo conta como "mudou" e dispara um
    // recarregamento que falhava silenciosamente (mesh sumia pra sempre).
    // Reconhecer o mesmo animal de novo agora só reaproveita o que já
    // está carregado, sem precisar recarregar nada.
    if (loadedModelAnimalId !== animal.id) {
      previewModelEl.setAttribute("gltf-model", `#model-${animal.id}`);
      loadedModelAnimalId = animal.id;
    }
    previewModelEl.setAttribute("scale", scaleByAnimalId[animal.id]);
    previewModelEl.setAttribute("visible", true);
    previewPlatformEl.setAttribute("visible", true);
    vignetteEl.hidden = false;
    previewNameEl.hidden = false;
    previewNameEl.textContent = animal.nome;
    scanAnotherBtn.hidden = false;

    if (advancedArAvailable) {
      placeFloorBtn.hidden = false;
      placeFloorBtn.onclick = () => enterFloorPlacement(sceneEl, placeFloorBtn, animal);
    }

    set(ref(db, DB_PATHS.activeAnimal), animal.id);

    // DEBUG temporário: modelo/plataforma não estavam aparecendo em teste
    // real mesmo com tudo indicando sucesso (sem erro no console) — esse
    // log reporta o estado de verdade do objeto 3D pra achar a causa em
    // vez de continuar chutando. Ver Eruda > Console. Remover depois.
    setTimeout(() => {
      const cam = sceneEl.camera?.el?.object3D ?? sceneEl.querySelector("a-camera")?.object3D;
      console.log(
        "[preview-debug]",
        JSON.stringify({
          modelVisible: previewModelEl.object3D.visible,
          modelPos: previewModelEl.object3D.position.toArray(),
          modelParent: previewModelEl.object3D.parent?.el?.tagName,
          modelChildren: previewModelEl.object3D.children.length,
          modelMeshLoaded: !!previewModelEl.getObject3D("mesh"),
          platformVisible: previewPlatformEl.object3D.visible,
          camChildren: cam?.children.length,
          camWorldPos: cam?.getWorldPosition(new AFRAME.THREE.Vector3()).toArray(),
        })
      );
    }, 1500);
  }

  function hidePreview() {
    capturedAnimalId = null;

    previewModelEl.setAttribute("visible", false);
    previewPlatformEl.setAttribute("visible", false);
    vignetteEl.hidden = true;
    previewNameEl.hidden = true;
    placeFloorBtn.hidden = true;
    scanAnotherBtn.hidden = true;

    set(ref(db, DB_PATHS.activeAnimal), null);
  }

  scanAnotherBtn.addEventListener("click", hidePreview);

  for (const targetEl of document.querySelectorAll("[data-animal-id]")) {
    const animalId = targetEl.dataset.animalId;

    targetEl.addEventListener("targetFound", () => {
      if (capturedAnimalId) return; // já tem uma prévia mostrada — ignora novas detecções até "escanear outro"
      showPreview(animalsById.get(animalId));
    });
  }
}

// Depois que a sessão WebXR termina, o navegador leva um instante pra
// liberar a câmera de volta — pedir getUserMedia de novo cedo demais
// (via mindarSystem.start()) faz o MindAR travar no spinner de
// carregamento indefinidamente. Essa pausa dá tempo do sistema soltar o
// hardware antes da próxima tentativa.
const CAMERA_HANDOFF_DELAY_MS = 800;

function restartMindAR(mindarSystem) {
  setTimeout(() => mindarSystem.start(), CAMERA_HANDOFF_DELAY_MS);
}

async function enterFloorPlacement(sceneEl, placeFloorBtn, animal) {
  placeFloorBtn.hidden = true;

  const mindarSystem = sceneEl.systems["mindar-image-system"];
  mindarSystem.stop(); // libera a câmera de vez — WebXR precisa de controle exclusivo dela

  const { startFloorPlacement } = await import("./webxr-mode.js");

  try {
    await startFloorPlacement({
      modelUrl: animal.model,
      realHeightMeters: animal.alturaRealMetros,
      onExit: () => restartMindAR(mindarSystem),
    });
  } catch (error) {
    console.error("Falha ao iniciar o modo WebXR", error);
    restartMindAR(mindarSystem);
  }
}

function showCameraError() {
  const errorEl = document.getElementById("ar-error");
  errorEl.hidden = false;
  errorEl.textContent =
    "Não conseguimos acessar a câmera. Verifique se você deu permissão pro navegador e se está acessando por HTTPS (ou localhost), depois recarregue a página.";
}
