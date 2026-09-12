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

// Comportamento de "andar sozinho" (ver setupAnimalControl): passos
// pequenos, aleatórios, com pausas paradas entre eles.
const WANDER_STEP_MIN_METERS = 0.3;
const WANDER_STEP_MAX_METERS = 0.7;
const RUN_CHANCE = 0.3;
const ARRIVE_THRESHOLD_METERS = 0.03;
const IDLE_MIN_MS = 1200;
const IDLE_MAX_MS = 2800;

// Não temos mapeamento real do ambiente (nada de plane-detection nem
// depth — ver nota de Depth API acima), então não tem como saber onde
// tem parede de verdade. Em vez disso, tanto o andar sozinho quanto o
// controle manual (analógico) ficam presos dentro desse raio ao redor
// do ponto onde o chão foi tocado — mesma lógica de "chute seguro" do
// MAX_HEIGHT_METERS acima, só que pro plano horizontal.
const LEASH_RADIUS_METERS = 1.2;

const WALK_SPEED_MPS = 0.3;
const RUN_SPEED_MPS = 0.9;
const ANIMATION_CROSSFADE_S = 0.3;

// Analógico virtual (dom-overlay, estilo dos efeitos de RA "estilo
// TikTok"): controla o animal relativo à câmera — empurrar "pra cima"
// sempre afasta o animal de quem tá segurando o celular, não importa o
// ângulo. Ver setupAnimalControl.
const JOYSTICK_MAX_RADIUS_PX = 65;
const JOYSTICK_DEADZONE = 0.15;
const MANUAL_RUN_THRESHOLD = 0.75;

function isFloorLike(pose) {
  const { x, y, z, w } = pose.transform.orientation;
  const up = WORLD_UP.clone().applyQuaternion(new THREE.Quaternion(x, y, z, w));
  return up.dot(WORLD_UP) > FLOOR_UP_DOT_THRESHOLD;
}

function findClip(animations, name) {
  return animations.find((clip) => clip.name.toLowerCase() === name.toLowerCase()) ?? null;
}

// Dá vida ao modelo já plantado no chão: por padrão ele anda sozinho
// (wander) dentro de LEASH_RADIUS_METERS, mas o aluno pode assumir o
// controle a qualquer momento pelo analógico, ou pausar tudo pelo botão
// de "Parar". Devolve uma função update(delta) chamada a cada frame do
// loop de render.
//
// Se o glTF não tiver os clipes "Walk"/"Survey" (nomes usados no
// Fox.glb de teste), não tem como andar de forma reconhecível — toca só
// o primeiro clipe disponível parado, sem criar nenhum controle, igual
// ao comportamento antigo (cobre animais futuros sem esses nomes).
function setupAnimalControl(model, mixer, animations, camera, container) {
  const walkClip = findClip(animations, "Walk");
  const runClip = findClip(animations, "Run");
  const idleClip = findClip(animations, "Survey") ?? animations[0];

  if (!walkClip || !idleClip) {
    mixer.clipAction(animations[0]).play();
    return () => {};
  }

  const walkAction = mixer.clipAction(walkClip);
  const runAction = runClip ? mixer.clipAction(runClip) : null;
  const idleAction = mixer.clipAction(idleClip);

  let currentAction = idleAction.play();

  function setAction(nextAction) {
    if (!nextAction || nextAction === currentAction) return;
    nextAction.reset().fadeIn(ANIMATION_CROSSFADE_S).play();
    currentAction.fadeOut(ANIMATION_CROSSFADE_S);
    currentAction = nextAction;
  }

  const origin = model.position.clone();

  function clampToLeash(position) {
    const offset = position.clone().sub(origin);
    offset.y = 0;
    if (offset.length() > LEASH_RADIUS_METERS) {
      offset.setLength(LEASH_RADIUS_METERS);
      position.x = origin.x + offset.x;
      position.z = origin.z + offset.z;
    }
    return position;
  }

  // --- Modo automático: anda sozinho, alternando passos e pausas ---

  let autoWanderEnabled = true;
  let wanderTarget = null;
  let wanderSpeed = 0;
  let idleUntil = performance.now() + IDLE_MIN_MS;

  function pickWanderTarget() {
    const stepDistance = WANDER_STEP_MIN_METERS + Math.random() * (WANDER_STEP_MAX_METERS - WANDER_STEP_MIN_METERS);

    let target = null;
    for (let attempt = 0; attempt < 5; attempt++) {
      const angle = Math.random() * Math.PI * 2;
      const candidate = model.position.clone().add(new THREE.Vector3(Math.sin(angle) * stepDistance, 0, Math.cos(angle) * stepDistance));
      const offset = candidate.clone().sub(origin);
      offset.y = 0;
      if (offset.length() <= LEASH_RADIUS_METERS) {
        target = candidate;
        break;
      }
    }
    // Não achou um ângulo aleatório dentro do raio (já tá na borda) —
    // mira de volta pro centro em vez de insistir, senão fica preso
    // tentando sair repetidamente.
    if (!target) {
      const towardOrigin = origin.clone().sub(model.position);
      towardOrigin.y = 0;
      towardOrigin.setLength(Math.min(stepDistance, towardOrigin.length() || stepDistance));
      target = model.position.clone().add(towardOrigin);
    }

    wanderTarget = target;
    const running = runAction && Math.random() < RUN_CHANCE;
    wanderSpeed = running ? RUN_SPEED_MPS : WALK_SPEED_MPS;
    setAction(running ? runAction : walkAction);
  }

  function updateAuto(delta) {
    const now = performance.now();

    if (wanderSpeed === 0) {
      if (now >= idleUntil) pickWanderTarget();
      return;
    }

    const toTarget = wanderTarget.clone().sub(model.position);
    toTarget.y = 0;
    const distance = toTarget.length();

    if (distance < ARRIVE_THRESHOLD_METERS) {
      wanderSpeed = 0;
      idleUntil = now + IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
      setAction(idleAction);
      return;
    }

    toTarget.normalize();
    model.position.add(toTarget.multiplyScalar(Math.min(wanderSpeed * delta, distance)));
    // Fox.glb olha pro +Z por padrão — se ela andar de costas no teste
    // real, trocar esse atan2 pra Math.atan2(-toTarget.x, -toTarget.z).
    model.rotation.y = Math.atan2(toTarget.x, toTarget.z);
  }

  function stopAutoImmediately() {
    wanderSpeed = 0;
    setAction(idleAction);
  }

  function resumeAuto() {
    wanderSpeed = 0;
    idleUntil = performance.now() + IDLE_MIN_MS + Math.random() * (IDLE_MAX_MS - IDLE_MIN_MS);
  }

  // Agrupa o botão de pausar e o analógico num único container flex —
  // eles ficam empilhados verticalmente sem precisar calcular posições
  // fixas separadas (foi exatamente isso que fez os dois se sobreporem
  // na primeira versão: o "bottom" do botão não considerava a altura
  // real do analógico).
  const controlsEl = document.createElement("div");
  controlsEl.id = "wander-controls";
  container.appendChild(controlsEl);

  // --- Botão "Parar"/"Andar sozinha": pausa o modo automático de propósito ---

  const toggleBtn = document.createElement("button");
  toggleBtn.id = "wander-toggle-btn";
  toggleBtn.textContent = "⏸ Parar";
  controlsEl.appendChild(toggleBtn);

  toggleBtn.addEventListener("click", () => {
    autoWanderEnabled = !autoWanderEnabled;
    toggleBtn.textContent = autoWanderEnabled ? "⏸ Parar" : "▶ Andar sozinha";
    if (autoWanderEnabled) {
      resumeAuto();
    } else if (!dragging) {
      stopAutoImmediately();
    }
  });

  // --- Analógico: controle manual, relativo à câmera ---

  const joystickBase = document.createElement("div");
  joystickBase.id = "joystick-base";
  const joystickKnob = document.createElement("div");
  joystickKnob.id = "joystick-knob";
  joystickBase.appendChild(joystickKnob);
  controlsEl.appendChild(joystickBase);

  let dragging = false;
  let joyX = 0;
  let joyY = 0;
  let baseCenterX = 0;
  let baseCenterY = 0;

  function updateKnob(clientX, clientY) {
    let dx = clientX - baseCenterX;
    let dy = clientY - baseCenterY;
    const magnitude = Math.hypot(dx, dy);
    if (magnitude > JOYSTICK_MAX_RADIUS_PX) {
      dx = (dx / magnitude) * JOYSTICK_MAX_RADIUS_PX;
      dy = (dy / magnitude) * JOYSTICK_MAX_RADIUS_PX;
    }
    joystickKnob.style.transform = `translate(${dx}px, ${dy}px)`;
    joyX = dx / JOYSTICK_MAX_RADIUS_PX;
    // Y da tela cresce pra baixo — inverte pra "empurrar pra cima" virar
    // magnitude positiva (mover pra frente).
    joyY = -dy / JOYSTICK_MAX_RADIUS_PX;
  }

  function endDrag() {
    if (!dragging) return;
    dragging = false;
    joyX = 0;
    joyY = 0;
    joystickKnob.style.transform = "translate(0, 0)";
    if (autoWanderEnabled) resumeAuto();
  }

  joystickBase.addEventListener("pointerdown", (event) => {
    dragging = true;
    const rect = joystickBase.getBoundingClientRect();
    baseCenterX = rect.left + rect.width / 2;
    baseCenterY = rect.top + rect.height / 2;
    joystickBase.setPointerCapture(event.pointerId);
    updateKnob(event.clientX, event.clientY);
  });
  joystickBase.addEventListener("pointermove", (event) => {
    if (dragging) updateKnob(event.clientX, event.clientY);
  });
  joystickBase.addEventListener("pointerup", endDrag);
  joystickBase.addEventListener("pointercancel", endDrag);

  const cameraForward = new THREE.Vector3();
  const cameraRight = new THREE.Vector3();

  function updateManual(delta) {
    const magnitude = Math.min(Math.hypot(joyX, joyY), 1);

    if (magnitude < JOYSTICK_DEADZONE) {
      setAction(idleAction);
      return;
    }

    // Direção relativa à câmera (não ao mundo): "pra cima" no analógico
    // sempre afasta o animal de quem segura o celular, do jeito que um
    // controle de jogo/efeito de RA costuma funcionar.
    cameraForward.set(0, 0, -1).applyQuaternion(camera.quaternion);
    cameraForward.y = 0;
    cameraForward.normalize();
    cameraRight.set(1, 0, 0).applyQuaternion(camera.quaternion);
    cameraRight.y = 0;
    cameraRight.normalize();

    const moveDir = cameraForward.multiplyScalar(joyY).add(cameraRight.multiplyScalar(joyX)).normalize();

    const running = runAction && magnitude > MANUAL_RUN_THRESHOLD;
    setAction(running ? runAction : walkAction);

    const speed = running ? RUN_SPEED_MPS : WALK_SPEED_MPS;
    const nextPosition = model.position.clone().addScaledVector(moveDir, speed * delta * magnitude);
    model.position.copy(clampToLeash(nextPosition));
    model.rotation.y = Math.atan2(moveDir.x, moveDir.z);
  }

  return function update(delta) {
    if (dragging) {
      updateManual(delta);
    } else if (autoWanderEnabled) {
      updateAuto(delta);
    } else {
      setAction(idleAction);
    }
  };
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

  // O ARCore precisa de movimento da câmera pra mapear o ambiente antes
  // de conseguir reconhecer superfícies — ficar parado apontando pro
  // chão demora bem mais do que mover o celular devagar. Essa dica some
  // assim que o chão é encontrado (ou o animal é plantado).
  const scanHintEl = document.createElement("div");
  scanHintEl.id = "webxr-scan-hint";
  scanHintEl.textContent = "Mova o celular bem devagar, apontando pro chão, até aparecer o círculo verde.";
  container.appendChild(scanHintEl);

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
  let updateAnimalControlFrame = () => {};
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
    // Para o loop de render ANTES de mexer no DOM/WebGL — se um frame
    // ainda em voo tentasse renderizar depois do innerHTML="" ou do
    // dispose(), poderia travar em vez de só dar erro.
    renderer.setAnimationLoop(null);
    container.hidden = true;
    container.innerHTML = "";
    renderer.dispose();
    // dispose() libera os recursos, mas não força a GPU a soltar o
    // contexto WebGL de verdade — forceContextLoss() garante isso,
    // relevante numa página que entra/sai desse modo várias vezes.
    renderer.forceContextLoss();
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
    scanHintEl.hidden = true;
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
        // Orientação não vem daqui: quem manda no rotation.y a partir de
        // agora é o andar sozinho/analógico (setupAnimalControl).

        scene.add(model);

        if (gltf.animations?.length > 0) {
          mixer = new THREE.AnimationMixer(model);
          updateAnimalControlFrame = setupAnimalControl(model, mixer, gltf.animations, camera, container);
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
          scanHintEl.hidden = true;
          reticle.matrix.fromArray(floorPose.transform.matrix);
        } else {
          reticle.visible = false;
          scanHintEl.hidden = false;
        }
      }
    }

    if (mixer) {
      const delta = clock.getDelta();
      mixer.update(delta);
      updateAnimalControlFrame(delta);
    }
    renderer.render(scene, camera);
  });
}
