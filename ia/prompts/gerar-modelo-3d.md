# Prompt: gerar modelos 3D dos animais (sem experiência em modelagem)

Como o time não tem experiência com Unity/modelagem 3D, o caminho mais
rápido para o hackathon é usar uma ferramenta de texto-para-3D (ex: Meshy,
Tripo3D, Luma AI Genie) e exportar direto em `.glb`.

## Requisitos técnicos (importantes para performance em Web AR mobile)

- Formato final: **`.glb`** (glTF binário — formato que Three.js/A-Frame
  carregam nativamente).
- **Baixo número de polígonos** (idealmente < 30k triângulos) — celular
  precisa renderizar em tempo real junto com a câmera.
- Textura única, resolução até 2048x2048 (evitar múltiplos materiais
  pesados).
- Se a ferramenta gerar animação (idle/walk), exportar com a animação
  embutida no `.glb` — o Three.js consegue tocar `AnimationClip`s direto
  do arquivo.
- Escala e orientação "neutras" (o modelo de pé, olhando para +Z) facilita
  o posicionamento depois no MindAR.

## Prompt sugerido para a ferramenta de geração

```
A realistic low-poly 3D model of a [NOME DO ANIMAL EM INGLÊS], standing
pose, suitable for real-time mobile AR rendering. Clean single texture,
neutral lighting baked into the texture, T-pose or natural standing idle
pose, no background, no pedestal. Optimized topology, under 30k triangles.
```

Se a ferramenta suportar animação, complementar com:

```
Include a simple looping idle animation (subtle breathing/head movement)
and, if possible, a walk cycle.
```

## Depois de gerar

1. Exportar/baixar como `.glb`.
2. Salvar em `aluno/assets/models/<id-do-animal>.glb` (o `id` precisa
   bater com o usado em `content/animals.json`).
3. Testar o tamanho do arquivo — se passar de alguns MB, considerar
   comprimir com [gltf-transform](https://gltf-transform.dev/) (`gltf-transform
   optimize entrada.glb saida.glb`) antes de subir pra Hostinger, pra não
   pesar o carregamento no celular do aluno em rede móvel.
