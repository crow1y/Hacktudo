// Modo avançado de RA: usa WebXR (hit-test) pra plantar o animal num
// ponto real do chão, em escala real (metros), mantendo ele ancorado ali
// enquanto o aluno anda pela sala de qualquer ângulo. Só é chamado quando
// já confirmamos suporte (aluno/js/ar.js checa navigator.xr antes) —
// existe em Android/Chrome com ARCore, não existe no Safari/iPhone (ver
// CLAUDE.md).
//
// Roda em Three.js puro (importado sob demanda via import map em
// aluno/index.html), não A-Frame — uma sessão WebXR precisa de controle
// exclusivo da câmera, e é mais simples não misturar com o pipeline do
// MindAR pra essa parte.
//
// Testado em dispositivo real (Motorola Edge 20 Pro): hit-test, filtro
// de chão, escala real e botão de sair confirmados funcionando.
//
// Oclusão real por profundidade (Depth API) foi tentada e ABANDONADA:
// mesmo só pedindo o recurso "depth-sensing" sem usar pra nada, a sessão
// travava a aba ao encerrar nesse aparelho — não é bug de algoritmo, é o
// próprio recurso que se mostrou instável nesse aparelho/Chrome. Não
// tentar de novo sem investigar primeiro se é uma limitação conhecida
// dessa combinação de hardware/navegador. Ver histórico do git
// (commits da branch feature/webxr-occlusion, descartada) se for
// retomar essa investigação depois do hackathon.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Teto de segurança: nunca deixa o modelo passar dessa altura (metros),
// mesmo que a altura real do animal seja maior — evita um elefante em
// tamanho real "furando" o teto da sala. Ver combinação com o usuário:
// mais simples que tentar detectar se o ambiente é aberto ou fechado.
const MAX_HEIGHT_METERS = 2;

// O hit-test do WebXR detecta qualquer superfície plana — parede, mesa,
// chão — sem diferenciar. Um resultado só conta como "chão" se o eixo
// "para cima" da superfície detectada estiver bem alinhado com o "para
// cima" do mundo real (tolerância de ~35°); senão é uma parede ou uma
// superfície muito inclinada, e a mira nem aparece.
const FLOOR_UP_DOT_THRESHOLD = 0.8;
const WORLD_UP = new THREE.Vector3(0, 1, 0);

function isFloorLike(pose) {
  const { x, y, z, w } = pose.transform.orientation;
  const up = WORLD_UP.clone().applyQuaternion(new THREE.Quaternion(x, y, z, w));
  return up.dot(WORLD_UP) > FLOOR_UP_DOT_THRESHOLD;
}

export async function startFloorPlacement({ modelUrl, realHeightMeters, onExit }) {
  if (!navigator.xr) {
    throw new Error("WebXR não disponível neste navegador.");
  }

  const container = document.getElementById("webxr-container");
  container.hidden = false;
  container.innerHTML = "";

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera();

  const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });
  renderer.setPixelRatio(window.devicePixelRatio);
  renderer.setSize(window.innerWidth, window.innerHeight);
  renderer.xr.enabled = true;
  container.appendChild(renderer.domElement);

  // Sessão WebXR não vem com um botão de sair garantido pelo navegador —
  // o app precisa fornecer o próprio, via o recurso "dom-overlay" (esse
  // elemento é composto por cima da visão de RA pelo próprio navegador
  // durante a sessão).
  const exitButton = document.createElement("button");
  exitButton.textContent = "❌ Sair da RA";
  exitButton.id = "webxr-exit-btn";
  container.appendChild(exitButton);

  scene.add(new THREE.HemisphereLight(0xffffff, 0x444444, 1.5));
  const dirLight = new THREE.DirectionalLight(0xffffff, 1.5);
  dirLight.position.set(0.5, 3, 1);
  scene.add(dirLight);

  const reticle = new THREE.Mesh(
    new THREE.RingGeometry(0.08, 0.1, 32).rotateX(-Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x00ff88 })
  );
  reticle.matrixAutoUpdate = false;
  reticle.visible = false;
  scene.add(reticle);

  let hitTestSource = null;
  let hitTestSourceRequested = false;
  let placed = false;
  let mixer = null;
  const clock = new THREE.Clock();

  let session;
  try {
    session = await navigator.xr.requestSession("immersive-ar", {
      requiredFeatures: ["hit-test"],
      // Opcional de propósito: em aparelhos sem suporte, a sessão segue
      // normal, só sem o botão sobreposto (fica só a rede de segurança
      // do "pagehide" abaixo pra sair).
      optionalFeatures: ["dom-overlay"],
      domOverlay: { root: container },
    });
  } catch (error) {
    cleanup();
    throw error;
  }

  exitButton.addEventListener("click", () => session.end().catch(() => {}));

  function cleanup() {
    window.removeEventListener("pagehide", endSessionOnPageHide);
    container.hidden = true;
    container.innerHTML = "";
    renderer.setAnimationLoop(null);
    renderer.dispose();
  }

  session.addEventListener("end", () => {
    cleanup();
    onExit?.();
  });

  // Sair da PÁGINA (botão voltar do navegador/celular) com a sessão WebXR
  // ainda ativa é um desmonte mais pesado pro navegador que só encerrar a
  // sessão. Rede de segurança pra quando o aluno usa o botão voltar em
  // vez do "❌ Sair da RA": encerra a sessão explicitamente antes da
  // página descarregar.
  function endSessionOnPageHide() {
    session.end().catch(() => {});
  }
  window.addEventListener("pagehide", endSessionOnPageHide);

  renderer.xr.setReferenceSpaceType("local");
  await renderer.xr.setSession(session);

  session.addEventListener("select", () => {
    if (placed || !reticle.visible) return;
    placed = true;
    reticle.visible = false;
    placeModel(reticle.matrix);
  });

  function placeModel(placementMatrix) {
    new GLTFLoader().load(
      modelUrl,
      (gltf) => {
        const model = gltf.scene;

        // Escala real: mede a altura nativa do modelo (unidades do
        // próprio arquivo) e escala pra bater com a altura real do
        // animal em metros, respeitando o teto de segurança.
        const box = new THREE.Box3().setFromObject(model);
        const nativeHeight = box.max.y - box.min.y || 1;
        const targetHeight = Math.min(realHeightMeters, MAX_HEIGHT_METERS);
        model.scale.setScalar(targetHeight / nativeHeight);

        const position = new THREE.Vector3();
        const quaternion = new THREE.Quaternion();
        const scale = new THREE.Vector3();
        placementMatrix.decompose(position, quaternion, scale);
        model.position.copy(position);
        model.quaternion.copy(quaternion);

        scene.add(model);

        if (gltf.animations?.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          mixer.clipAction(gltf.animations[0]).play();
        }
      },
      undefined,
      (error) => console.error("Falha ao carregar modelo no modo WebXR", error)
    );
  }

  renderer.setAnimationLoop((timestamp, frame) => {
    if (frame) {
      const referenceSpace = renderer.xr.getReferenceSpace();
      const xrSession = renderer.xr.getSession();

      if (!hitTestSourceRequested) {
        hitTestSourceRequested = true;
        xrSession.requestReferenceSpace("viewer").then((viewerSpace) => {
          xrSession.requestHitTestSource({ space: viewerSpace }).then((source) => {
            hitTestSource = source;
          });
        });
      }

      if (hitTestSource && !placed) {
        const hitTestResults = frame.getHitTestResults(hitTestSource);
        const floorPose = hitTestResults
          .map((hit) => hit.getPose(referenceSpace))
          .find((pose) => pose && isFloorLike(pose));

        if (floorPose) {
          reticle.visible = true;
          reticle.matrix.fromArray(floorPose.transform.matrix);
        } else {
          reticle.visible = false;
        }
      }
    }

    if (mixer) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
  });
}
