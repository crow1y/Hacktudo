// Reconhecimento de imagem + renderização do modelo 3D, via MindAR + A-Frame.
//
// Ainda usa o alvo de imagem e o modelo de exemplo (ver content/animals.json,
// entrada "teste-pipeline") só para validar a pipeline inteira (câmera →
// detecção → modelo 3D → Firebase) antes dos assets reais dos animais
// estarem prontos. Para testar: abra este app no celular e aponte a câmera
// para a imagem de exemplo do MindAR (o link está no comentário da entrada
// "teste-pipeline" em content/animals.json).
//
// TODO quando os assets reais chegarem: trocar target/model da entrada real
// do animal em content/animals.json — nenhuma mudança de código é
// necessária aqui, tudo é lido dinamicamente do JSON.
//
// TODO (múltiplos animais simultâneos): hoje só o primeiro animal da lista
// é carregado como alvo. Suportar vários alvos ao mesmo tempo exige
// compilar todas as imagens num único arquivo .mind (a ferramenta de
// compilação do MindAR aceita múltiplas imagens) e mapear cada
// targetIndex para o id do animal correspondente.

import { ref, set } from "https://www.gstatic.com/firebasejs/10.13.0/firebase-database.js";
import { db } from "../../shared/firebase-config.js";
import { DB_PATHS } from "../../shared/constants.js";

export async function initAR() {
  const response = await fetch("../content/animals.json");
  const { animals } = await response.json();
  const animal = animals[0];

  document.getElementById("ar-container").innerHTML = `
    <a-scene
      mindar-image="imageTargetSrc: ${animal.target}; autoStart: true; uiScanning: no;"
      vr-mode-ui="enabled: false"
      device-orientation-permission-ui="enabled: false"
      renderer="colorManagement: true"
      embedded
    >
      <a-assets>
        <a-asset-item id="animal-model" src="${animal.model}"></a-asset-item>
      </a-assets>

      <a-camera position="0 0 0" look-controls="enabled: false"></a-camera>

      <a-entity id="ar-target" mindar-image-target="targetIndex: 0">
        <!-- Posição/escala/rotação são um chute inicial — ajustar visualmente
             testando no celular, cada modelo tem proporções diferentes. -->
        <a-gltf-model
          src="#animal-model"
          position="0 0 0"
          scale="0.05 0.05 0.05"
          animation-mixer
        ></a-gltf-model>
      </a-entity>
    </a-scene>
  `;

  const targetEntity = document.getElementById("ar-target");

  targetEntity.addEventListener("targetFound", () => {
    set(ref(db, DB_PATHS.activeAnimal), animal.id);
  });

  targetEntity.addEventListener("targetLost", () => {
    set(ref(db, DB_PATHS.activeAnimal), null);
  });
}
