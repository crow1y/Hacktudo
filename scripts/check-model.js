#!/usr/bin/env node
// Checagem rápida de sanidade pra um modelo .glb ANTES de integrar no
// projeto — motivada por um caso real: a girafa (aluno/assets/models/
// girafa.glb) causava um travamento intermitente do Chrome no modo
// WebXR só nela (a raposa de teste nunca travava). A causa não era
// "peso" do arquivo (923 KB / 1.258 triângulos é irrisório pra
// qualquer GPU de celular) — era a hierarquia de nós/ossos ter fatores
// de escala MUITO desproporcionais entre si (achado ao investigar:
// cadeia de nós com escala 0.01 multiplicada, em outro ramo da mesma
// árvore, por ~70/~100 nos ossos), resíduo comum de conversão
// automática de FBX pra glTF (Sketchfab, Mixamo, etc). Isso obriga o
// cálculo de skin (bindMatrixInverse * osso * boneInverse) a multiplicar
// números muito grandes por muito pequenos pra se cancelar — no ponto
// flutuante de precisão reduzida que GPU de celular costuma usar em
// shader, isso é terreno fértil pra valores instáveis/degenerados.
//
// Uso: node scripts/check-model.js caminho/para/modelo.glb
//
// Sem dependências (só Node puro) — de propósito, mesmo padrão do resto
// do projeto (sem bundler/build step).

const fs = require("fs");

const COMPONENT_TYPES = {
  5120: { size: 1, read: (b, o) => b.readInt8(o) },
  5121: { size: 1, read: (b, o) => b.readUInt8(o) },
  5122: { size: 2, read: (b, o) => b.readInt16LE(o) },
  5123: { size: 2, read: (b, o) => b.readUInt16LE(o) },
  5125: { size: 4, read: (b, o) => b.readUInt32LE(o) },
  5126: { size: 4, read: (b, o) => b.readFloatLE(o) },
};
const TYPE_COUNTS = { SCALAR: 1, VEC2: 2, VEC3: 3, VEC4: 4, MAT4: 16 };

// Fatores de escala fora desse intervalo (por eixo, num TRS local) já
// são estranhos o bastante pra anotar, mesmo isolados.
const SUSPICIOUS_SCALE_MIN = 0.05;
const SUSPICIOUS_SCALE_MAX = 20;

// O que realmente importa pro bug que motivou esse script: a RAZÃO
// entre a escala do próprio nó da malha (bindMatrix) e a escala dos
// ossos que a deformam. Acima disso, sinaliza risco real.
const JOINT_MESH_SCALE_RATIO_LIMIT = 15;

function parseGlb(filePath) {
  const data = fs.readFileSync(filePath);
  if (data.readUInt32LE(0) !== 0x46546c67) throw new Error("Não é um .glb válido (magic incorreto).");

  let offset = 12;
  let json = null;
  let bin = null;
  while (offset < data.length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.readUInt32LE(offset + 4);
    const chunkData = data.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === 0x4e4f534a) json = JSON.parse(chunkData.toString("utf8"));
    else if (chunkType === 0x004e4942) bin = chunkData;
    offset += 8 + chunkLength;
  }
  if (!json) throw new Error("Chunk JSON não encontrado no .glb.");
  return { gltf: json, bin, fileSize: data.length };
}

function readAccessor(gltf, bin, index) {
  const acc = gltf.accessors[index];
  const bv = gltf.bufferViews[acc.bufferView];
  const { size, read } = COMPONENT_TYPES[acc.componentType];
  const ncomp = TYPE_COUNTS[acc.type];
  const start = (bv.byteOffset || 0) + (acc.byteOffset || 0);
  const stride = bv.byteStride || ncomp * size;
  const out = [];
  for (let i = 0; i < acc.count; i++) {
    const base = start + i * stride;
    const vals = [];
    for (let c = 0; c < ncomp; c++) vals.push(read(bin, base + c * size));
    out.push(vals);
  }
  return out;
}

// --- matemática mínima de mat4 (row-major, translação na última coluna) ---

function identity() {
  return [1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1, 0, 0, 0, 0, 1];
}

function multiply(a, b) {
  const out = new Array(16).fill(0);
  for (let r = 0; r < 4; r++) {
    for (let c = 0; c < 4; c++) {
      let sum = 0;
      for (let k = 0; k < 4; k++) sum += a[r * 4 + k] * b[k * 4 + c];
      out[r * 4 + c] = sum;
    }
  }
  return out;
}

function fromColumnMajor16(flat) {
  // glTF armazena "matrix" em column-major -- transpõe pro nosso row-major.
  const out = new Array(16);
  for (let c = 0; c < 4; c++) for (let r = 0; r < 4; r++) out[r * 4 + c] = flat[c * 4 + r];
  return out;
}

function quatToMat(q) {
  const [x, y, z, w] = q;
  return [
    1 - 2 * (y * y + z * z), 2 * (x * y - z * w), 2 * (x * z + y * w), 0,
    2 * (x * y + z * w), 1 - 2 * (x * x + z * z), 2 * (y * z - x * w), 0,
    2 * (x * z - y * w), 2 * (y * z + x * w), 1 - 2 * (x * x + y * y), 0,
    0, 0, 0, 1,
  ];
}

function localMatrix(node) {
  if (node.matrix) return fromColumnMajor16(node.matrix);
  const [tx, ty, tz] = node.translation || [0, 0, 0];
  const T = [1, 0, 0, tx, 0, 1, 0, ty, 0, 0, 1, tz, 0, 0, 0, 1];
  const R = quatToMat(node.rotation || [0, 0, 0, 1]);
  const [sx, sy, sz] = node.scale || [1, 1, 1];
  const S = [sx, 0, 0, 0, 0, sy, 0, 0, 0, 0, sz, 0, 0, 0, 0, 1];
  return multiply(multiply(T, R), S);
}

// Escala "efetiva" de uma matriz de mundo: comprimento de cada eixo da
// base 3x3, condensado num único número (média geométrica) -- serve só
// pra comparar magnitudes entre nós, não precisa ser exato.
function effectiveScale(mat) {
  const axisLength = (i) => Math.hypot(mat[0 * 4 + i], mat[1 * 4 + i], mat[2 * 4 + i]);
  const sx = axisLength(0), sy = axisLength(1), sz = axisLength(2);
  return Math.cbrt(sx * sy * sz);
}

function checkModel(filePath) {
  const { gltf, bin, fileSize } = parseGlb(filePath);
  const nodes = gltf.nodes || [];

  const parentOf = {};
  nodes.forEach((n, i) => (n.children || []).forEach((c) => (parentOf[c] = i)));

  const worldCache = {};
  function worldMatrix(i) {
    if (worldCache[i]) return worldCache[i];
    const lm = localMatrix(nodes[i]);
    const wm = i in parentOf ? multiply(worldMatrix(parentOf[i]), lm) : lm;
    worldCache[i] = wm;
    return wm;
  }

  const warnings = [];
  const info = [];

  // --- stats básicos ---
  let triangleCount = 0;
  let vertexCount = 0;
  (gltf.meshes || []).forEach((mesh) => {
    mesh.primitives.forEach((prim) => {
      const posAcc = gltf.accessors[prim.attributes.POSITION];
      vertexCount += posAcc.count;
      if (prim.indices !== undefined) triangleCount += gltf.accessors[prim.indices].count / 3;
      else triangleCount += posAcc.count / 3;
    });
  });

  let textureBytes = 0;
  (gltf.images || []).forEach((img) => {
    if (img.bufferView !== undefined) textureBytes += gltf.bufferViews[img.bufferView].byteLength;
  });

  info.push(`Arquivo: ${(fileSize / 1024).toFixed(1)} KB`);
  info.push(`Triângulos: ${Math.round(triangleCount)} | Vértices: ${vertexCount}`);
  info.push(`Materiais: ${(gltf.materials || []).length} | Texturas embutidas: ${(textureBytes / 1024).toFixed(1)} KB`);
  const anims = gltf.animations || [];
  info.push(`Animações (${anims.length}): ${anims.map((a) => a.name).join(", ") || "(nenhuma)"}`);

  // --- fatores de escala esquisitos em qualquer nó, isolados ---
  nodes.forEach((node, i) => {
    if (!node.scale) return;
    const isSuspicious = node.scale.some((s) => Math.abs(s) < SUSPICIOUS_SCALE_MIN || Math.abs(s) > SUSPICIOUS_SCALE_MAX);
    if (isSuspicious) {
      warnings.push(`Nó "${node.name || i}" tem escala local fora do normal: ${JSON.stringify(node.scale)}`);
    }
  });

  // --- a checagem que importa de verdade: razão osso vs. malha, por skin ---
  const skins = gltf.skins || [];
  if (skins.length === 0) {
    info.push("Modelo sem esqueleto (SkinnedMesh) -- essa classe de bug não se aplica.");
  }
  skins.forEach((skin, skinIdx) => {
    const meshNodeIdx = nodes.findIndex((n) => n.skin === skinIdx);
    const meshScale = meshNodeIdx >= 0 ? effectiveScale(worldMatrix(meshNodeIdx)) : 1;
    let maxRatio = 0;
    let worstJointName = null;
    skin.joints.forEach((jointIdx) => {
      const jointScale = effectiveScale(worldMatrix(jointIdx));
      const ratio = Math.max(jointScale / meshScale, meshScale / jointScale);
      if (ratio > maxRatio) {
        maxRatio = ratio;
        worstJointName = nodes[jointIdx].name || jointIdx;
      }
    });
    info.push(
      `Skin #${skinIdx}: escala da malha ~${meshScale.toExponential(2)}, pior razão osso/malha ~${maxRatio.toFixed(1)}x (osso "${worstJointName}")`
    );
    if (maxRatio > JOINT_MESH_SCALE_RATIO_LIMIT) {
      warnings.push(
        `Skin #${skinIdx}: razão de escala osso/malha de ${maxRatio.toFixed(1)}x -- mesmo padrão que causou o bug da girafa (precisão de shader arriscada em GPU de celular). Evitar ou testar bem antes de confiar.`
      );
    }
  });

  return { info, warnings };
}

const filePath = process.argv[2];
if (!filePath) {
  console.error("Uso: node scripts/check-model.js caminho/para/modelo.glb");
  process.exit(1);
}

const { info, warnings } = checkModel(filePath);

console.log(`\n=== ${filePath} ===`);
info.forEach((line) => console.log("  " + line));

console.log();
if (warnings.length === 0) {
  console.log("✅ Nada suspeito encontrado -- hierarquia parece sã.");
} else {
  console.log(`⚠️  ${warnings.length} alerta(s):`);
  warnings.forEach((w) => console.log("  - " + w));
}
console.log();
