#!/usr/bin/env node
// Renomeia clipes de animação dentro de um .glb, in-place — feito pra
// bater com o que aluno/js/webxr-mode.js procura via findClip():
// "Survey" (parado/idle), "Walk" (andar), "Run" (correr). Modelos de
// Sketchfab/Mixamo raramente já vêm com esses nomes exatos (ex: girafa
// veio como "Giraffe_Idle"/"Giraffe_Walk"/"Giraffe_Run", elefante veio
// como "TRS|idle"/"TRS|walk"/"TRS|run") -- em vez de editar o binário
// na mão (feito via Python nas primeiras trocas de modelo desta sessão),
// esse script faz isso de forma repetível.
//
// Uso: node scripts/rename-clips.js modelo.glb "NomeAntigo=NomeNovo" ...
// Exemplo real (elefante): node scripts/rename-clips.js
//   aluno/assets/models/elefante.glb "TRS|idle=Survey" "TRS|walk=Walk"
//   "TRS|run=Run"
//
// Sobrescreve o arquivo original in-place. Rode `npm run check-model --
// modelo.glb` antes E depois pra confirmar que a troca de nome não
// mudou nada estrutural (só o JSON chunk é reescrito).
//
// Sem dependências (só Node puro) — mesmo padrão do resto do projeto.

const fs = require("fs");

function parseGlb(filePath) {
  const data = fs.readFileSync(filePath);
  if (data.readUInt32LE(0) !== 0x46546c67) throw new Error("Não é um .glb válido (magic incorreto).");

  let offset = 12;
  let json = null;
  let bin = null;
  let binChunkType = 0x004e4942;
  while (offset < data.length) {
    const chunkLength = data.readUInt32LE(offset);
    const chunkType = data.readUInt32LE(offset + 4);
    const chunkData = data.subarray(offset + 8, offset + 8 + chunkLength);
    if (chunkType === 0x4e4f534a) json = JSON.parse(chunkData.toString("utf8"));
    else if (chunkType === 0x004e4942) {
      bin = chunkData;
      binChunkType = chunkType;
    }
    offset += 8 + chunkLength;
  }
  if (!json) throw new Error("Chunk JSON não encontrado no .glb.");
  return { gltf: json, bin, binChunkType };
}

function writeGlb(filePath, gltf, bin, binChunkType) {
  const jsonBuf = Buffer.from(JSON.stringify(gltf), "utf8");
  // Padding do JSON chunk com espaço (0x20) até múltiplo de 4 bytes —
  // exigência do formato binário glTF.
  const jsonPad = (4 - (jsonBuf.length % 4)) % 4;
  const jsonPadded = Buffer.concat([jsonBuf, Buffer.alloc(jsonPad, 0x20)]);

  let binPadded = Buffer.alloc(0);
  if (bin && bin.length > 0) {
    const binPad = (4 - (bin.length % 4)) % 4;
    binPadded = Buffer.concat([bin, Buffer.alloc(binPad, 0x00)]);
  }

  const hasBin = binPadded.length > 0;
  const totalLength = 12 + 8 + jsonPadded.length + (hasBin ? 8 + binPadded.length : 0);

  const header = Buffer.alloc(12);
  header.writeUInt32LE(0x46546c67, 0); // magic "glTF"
  header.writeUInt32LE(2, 4); // version
  header.writeUInt32LE(totalLength, 8);

  const jsonChunkHeader = Buffer.alloc(8);
  jsonChunkHeader.writeUInt32LE(jsonPadded.length, 0);
  jsonChunkHeader.writeUInt32LE(0x4e4f534a, 4); // "JSON"

  const parts = [header, jsonChunkHeader, jsonPadded];

  if (hasBin) {
    const binChunkHeader = Buffer.alloc(8);
    binChunkHeader.writeUInt32LE(binPadded.length, 0);
    binChunkHeader.writeUInt32LE(binChunkType, 4); // "BIN\0"
    parts.push(binChunkHeader, binPadded);
  }

  fs.writeFileSync(filePath, Buffer.concat(parts));
}

const args = process.argv.slice(2);
const filePath = args[0];
const renameArgs = args.slice(1);

if (!filePath || renameArgs.length === 0) {
  console.error('Uso: node scripts/rename-clips.js modelo.glb "NomeAntigo=NomeNovo" ...');
  process.exit(1);
}

const renameMap = {};
for (const arg of renameArgs) {
  const idx = arg.indexOf("=");
  if (idx === -1) {
    console.error(`Argumento inválido (esperado "Antigo=Novo"): ${arg}`);
    process.exit(1);
  }
  renameMap[arg.slice(0, idx)] = arg.slice(idx + 1);
}

const { gltf, bin, binChunkType } = parseGlb(filePath);

const animations = gltf.animations || [];
console.log(`Clipes encontrados (${animations.length}):`, animations.map((a) => a.name).join(", "));

const renamed = [];
animations.forEach((anim) => {
  if (anim.name in renameMap) {
    renamed.push([anim.name, renameMap[anim.name]]);
    anim.name = renameMap[anim.name];
  }
});

if (renamed.length === 0) {
  console.error("Nenhum clipe correspondeu aos nomes pedidos -- nada foi alterado. Confira os nomes exatos acima (case-sensitive).");
  process.exit(1);
}

writeGlb(filePath, gltf, bin, binChunkType);

console.log(`Renomeados ${renamed.length}:`, renamed.map(([from, to]) => `"${from}" -> "${to}"`).join(", "));
console.log(`Arquivo reescrito: ${filePath}`);
