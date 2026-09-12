// Reconhecimento de imagem, via MindAR + A-Frame — só isso, sem renderizar
// o modelo 3D dentro da cena do MindAR.
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
// O resultado do reconhecimento é mostrado num "cartão de prévia" — um
// <model-viewer> (motor 3D independente, do Google), NÃO um objeto dentro
// da cena do MindAR/A-Frame. Depois de várias tentativas (grudar o modelo
// na câmera da cena MindAR, com posição estática, com componente rodando
// a cada frame, com luz explícita, reparentando pra câmera "ativa" de
// verdade) nenhuma renderizava em dispositivo real, mesmo com o objeto 3D
// comprovadamente correto em tudo (visível, mesh carregado, até
// processado no frame renderizado) — só nunca aparecia na tela. Um motor
// separado, isolado do MindAR, evita essa fragilidade por completo. Ver
// CLAUDE.md pra mais detalhes dessa investigação.
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

  const advancedArAvailable = await supportsAdvancedAR();

  // Um único alvo (mindar-image-target) por animal, sem filho visual — só
  // existe pra disparar targetFound. O que aparece na tela é sempre o
  // cartão de prévia (<model-viewer>), independente do MindAR.
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
      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>
      ${targetsHtml}
    </a-scene>
  `;

  const sceneEl = document.querySelector("a-scene");
  const previewCardEl = document.getElementById("preview-card");
  const previewModelViewerEl = document.getElementById("preview-model-viewer");
  const vignetteEl = document.getElementById("ar-vignette");
  const previewNameEl = document.getElementById("preview-name");
  const placeFloorBtn = document.getElementById("place-floor-btn");
  const scanAnotherBtn = document.getElementById("scan-another-btn");

  sceneEl.addEventListener("arError", (event) => {
    showCameraError(event.detail?.error);
  });

  let capturedAnimalId = null;

  function showPreview(animal) {
    capturedAnimalId = animal.id;

    previewModelViewerEl.src = animal.model;
    previewModelViewerEl.alt = animal.nome;
    previewCardEl.hidden = false;
    vignetteEl.hidden = false;
    previewNameEl.textContent = animal.nome;
    scanAnotherBtn.hidden = false;

    if (advancedArAvailable) {
      placeFloorBtn.hidden = false;
      placeFloorBtn.onclick = () => enterFloorPlacement(sceneEl, placeFloorBtn, animal);
    }

    set(ref(db, DB_PATHS.activeAnimal), animal.id);
  }

  function hidePreview() {
    capturedAnimalId = null;

    previewCardEl.hidden = true;
    vignetteEl.hidden = true;
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
