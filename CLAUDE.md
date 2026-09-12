# CLAUDE.md

Instruções de projeto para o Claude Code neste repositório.

## Workflow de Git

- **Mudanças grandes** (nova funcionalidade, vários arquivos, mudança de
  comportamento): criar uma branch nova, commitar, dar push, e abrir PR
  para o `main`.
- **Mudanças pequenas** (fix pontual, ajuste de configuração, correção
  rápida): commitar e dar push direto no `main`, para não atrasar o fluxo
  do hackathon.
- Na dúvida se uma mudança é grande ou pequena, perguntar antes de decidir.

## Trabalho em equipe

- Time de 2 pessoas, cada uma dividindo a stack: uma na pipeline de RA
  (`aluno/js/ar.js` e assets), outra na camada de uso consciente +
  conteúdo (`aluno/js/session-timer.js`, `content/animals.json`). O outro
  dev também usa Claude Code na própria máquina, em paralelo.
- **Antes de começar qualquer tarefa nova**, rodar `git fetch origin` e
  conferir `git log HEAD..origin/main --oneline` — o outro pode já ter
  commitado/aberto PR em cima do que você ia mexer.
- **Nunca implementar uma tarefa que já foi combinada como de outra
  pessoa**, mesmo que esteja tecnicamente desbloqueada — perguntar antes.
  Isso já aconteceu uma vez (`aluno/js/session-timer.js` foi implementado
  e teve que ser descartado) e causou fricção desnecessária.

## Stack e arquitetura

- **AR**: MindAR + A-Frame (não Three.js puro) — CDNs carregadas direto
  no `aluno/index.html` (aframe, mind-ar, aframe-extras para tocar
  animação de glTF via `animation-mixer`). Sem bundler/build step de
  propósito.
- **Realtime sync**: Firebase Realtime Database, projeto `viva-livro`.
  Regras hoje estão **abertas** (leitura/escrita pública) — ok para o
  hackathon, mas listado no README como pendência de segurança antes de
  uso real em sala de aula.
- **Hospedagem**: Hostinger, deploy via Git direto do hPanel (branch
  `main`, raiz do repo — não uma subpasta), porque o código usa imports
  relativos entre `aluno/`, `painel/`, `shared/` e `content/` que
  precisam estar todos acessíveis a partir da mesma raiz.

## Gotchas técnicos importantes

- **Servidor de dev sempre a partir da raiz do projeto**, nunca de dentro
  de `aluno/`/`painel/` isoladas — os scripts `dev:aluno`/`dev:painel`
  em `package.json` já fazem isso certo (`live-server --open=/aluno/`
  rodado da raiz). Rodar de dentro da subpasta quebra os imports
  `../../shared/...` com 503.
- **Câmera exige HTTPS** (ou `localhost`). Para testar no celular físico
  durante o dev, usar **Cloudflare Tunnel** (`cloudflared`, já instalado
  na máquina via winget): `cloudflared tunnel --url http://localhost:<porta>`.
  Não usar ngrok — exige criar conta/token, o Cloudflare "quick tunnel"
  não precisa de login.
- **Nunca ter dois arquivos que só diferem em maiúscula/minúscula** no
  repositório (ex: `README.md` e `README.MD`) — no Windows eles colidem
  no mesmo arquivo físico, e apagar um do índice do git pode apagar o
  conteúdo real do disco (já aconteceu uma vez, recuperado via
  `git checkout HEAD -- README.md`).
- **Escala de modelo 3D não é chute** — antes de definir `scale` no
  `<a-gltf-model>`, inspecionar o bounding box real do glTF (baixar o
  `.glb`, ler o JSON chunk, pegar `min`/`max` do accessor POSITION do
  mesh) para calcular a escala certa. O `Fox.glb` de teste tem ~79
  unidades de altura nativa; `scale="0.005"` dá ~0.4 unidades no espaço
  do alvo MindAR.
- **MindAR emite evento `arError`** com `{error: "VIDEO_FAIL"}` no
  `<a-scene>` quando a câmera falha — é assim que `aluno/js/ar.js` mostra
  a mensagem em português em `#ar-error`, em vez da tela de erro padrão
  (em inglês) do MindAR.
- **Rodar num monitor/tela em vez de imprimir a imagem-alvo deixa o
  rastreamento instável** (brilho/refresh da tela atrapalha o MindAR) —
  imagem impressa em papel funciona bem melhor.

## Schema do `content/animals.json`

- `targetSrc`: um único `.mind` compartilhado por **todos** os animais —
  compilado com todas as imagens-alvo juntas (ferramenta oficial:
  https://hiukim.github.io/mind-ar-js-doc/tools/compile). A ordem de
  upload na hora de compilar define o índice de cada imagem.
- Cada animal tem `targetIndex` (posição dele dentro desse `.mind`
  compartilhado) em vez de um target próprio.
- `aluno/js/ar.js` filtra (`isAssetReady`) animais cujo `model` ainda
  contém `"TODO"` — eles ficam no JSON normalmente, só não viram alvo de
  AR até o asset real existir (evita travar o `<a-assets>` tentando
  carregar um arquivo inexistente).
- Hoje existe uma entrada `teste-pipeline` usando alvo/modelo públicos de
  exemplo (card do MindAR + `Fox.glb` do KhronosGroup) só para validar a
  pipeline — trocar pelos assets reais quando estiverem prontos (ver
  `ia/prompts/gerar-modelo-3d.md` e `ia/prompts/gerar-conteudo-animais.md`).

## Firebase Realtime Database — schema

```
session/
  activeAnimal        → string: id do animal ativo (ou null)
  moodCheckins/
    <push-id>/
      mood: "otimo" | "bem" | "cansado" | "confuso"
      timestamp: number
```

Paths e valores vêm de `shared/constants.js` (`DB_PATHS`, `MOOD_VALUES`,
`MOOD_LABELS`) — sempre importar de lá, nunca hardcodear strings soltas
nos dois lados (`aluno/` e `painel/`).
