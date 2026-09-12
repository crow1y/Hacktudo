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
// NÃO TESTADO EM DISPOSITIVO REAL por quem escreveu isso (sem acesso a
// hardware com ARCore) — a lógica segue o padrão oficial documentado do
// WebXR (hit-test + reticle + select), mas comportamento fino (jitter,
// precisão do hit-test, etc.) só validado testando no celular de verdade.

import * as THREE from "three";
import { GLTFLoader } from "three/addons/loaders/GLTFLoader.js";

// Teto de segurança: nunca deixa o modelo passar dessa altura (metros),
// mesmo que a altura real do animal seja maior — evita um elefante em
// tamanho real "furando" o teto da sala. Ver combinação com o usuário:
// mais simples que tentar detectar se o ambiente é aberto ou fechado.
const MAX_HEIGHT_METERS = 2;

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
    });
  } catch (error) {
    cleanup();
    throw error;
  }

  function cleanup() {
    container.hidden = true;
    container.innerHTML = "";
    renderer.setAnimationLoop(null);
    renderer.dispose();
  }

  session.addEventListener("end", () => {
    cleanup();
    onExit?.();
  });

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
        if (hitTestResults.length > 0) {
          const pose = hitTestResults[0].getPose(referenceSpace);
          reticle.visible = true;
          reticle.matrix.fromArray(pose.transform.matrix);
        } else {
          reticle.visible = false;
        }
      }
    }

    if (mixer) mixer.update(clock.getDelta());
    renderer.render(scene, camera);
  });
}
