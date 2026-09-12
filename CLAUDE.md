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
  (`aluno/js/ar.js` e assets), outra no check-in de presença + conteúdo
  (`aluno/js/checkin.js`, `content/animals.json`). O outro dev também usa
  Claude Code na própria máquina, em paralelo.
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
- **Hospedagem**: Vercel, deploy automático a cada push na `main` (site
  estático, sem build — ver `vercel.json`), porque o código usa imports
  relativos entre `aluno/`, `painel/`, `shared/` e `content/` que
  precisam estar todos acessíveis a partir da mesma raiz.
- **Login/cadastro**: Firebase Authentication (email/password provider,
  precisa estar ativado no Firebase Console), com matrícula sintetizada em
  e-mail interno por `shared/auth.js` — ver `AUTH_EMAIL_SUFFIX` em
  `shared/constants.js`. Perfil (nome, matrícula, CPF, `liberado`) fica no
  Realtime Database, não no Firebase Auth. `admin/` libera professores
  (gate por `ADMIN_ACCESS_CODE`, não é segurança real).

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
- **Cartão de prévia** (`aluno/js/ar.js`, `#preview-model`): quando o
  MindAR reconhece um animal, ele NÃO aparece ancorado na página nem anda
  em círculo — vira um "cartão" centralizado na tela (modelo parado
  tocando animação reciclada dos próprios clipes, ex: "Walk" tocando no
  lugar), grudado na câmera (não no alvo rastreado) com um círculo atrás
  (`#preview-platform`) e o nome do animal, câmera escurecida nas bordas
  (`#ar-vignette`, gradiente radial). Botão "🔄 Escanear outro" solta a
  captura pra reconhecer um animal diferente. Isso substitui uma
  abordagem antiga (bicho "saindo da página" e andando em círculo via um
  componente `wander`) — removida por decisão do produto: focar a
  experiência "real"/imersiva no modo WebXR abaixo, e usar o MindAR só
  como reconhecimento + prévia apresentável, não fingir ser RA de
  verdade sem rastreamento de mundo.
  ⚠️ **Gotcha real encontrado**: ao mostrar o MESMO animal de novo depois
  de "escanear outro", NÃO redefinir o atributo `gltf-model` se o animal
  já é o que está carregado (`loadedModelAnimalId` em `ar.js`) — depois
  do primeiro carregamento bem-sucedido, o A-Frame reescreve esse
  atributo pra URL já resolvida (não mais `#model-id`); setar de novo
  com `#model-id` conta como "mudou" e dispara um recarregamento que
  falha silenciosamente (mesh some pra sempre, sem erro no console).
- **Modo WebXR avançado** (`aluno/js/webxr-mode.js`): depois que o MindAR
  reconhece um animal, em aparelhos com suporte a WebXR + hit-test
  (Android/Chrome com ARCore — não existe no Safari/iPhone) aparece um
  botão "Fixar no chão" que planta o modelo num ponto real da sala em
  **escala real** (metros, campo `alturaRealMetros` no
  `content/animals.json`, com teto de segurança `MAX_HEIGHT_METERS = 2`
  pra não estourar o teto). MindAR sempre continua sendo quem reconhece
  qual animal é — WebXR só cuida de ancorar no mundo real depois. Os dois
  não rodam ao mesmo tempo (disputam a câmera): `aluno/js/ar.js` chama
  `mindarSystem.stop()`/`.start()` ao entrar/sair do modo WebXR.
  Roda em **Three.js puro** (não A-Frame), importado via import map em
  `aluno/index.html` — é uma instância separada da que o A-Frame usa
  internamente (gera um warning inofensivo "Multiple instances of
  Three.js" no console, esperado).
  **Tentamos antes** um modelo "grudado na câmera" (companion) pra
  resolver isso sem WebXR — foi descartado porque sem saber onde é o
  chão de verdade, o animal sempre parecia flutuando/errado, quebrando a
  imersão. Não reintroduzir essa abordagem.
  **Testado em dispositivo real** (Motorola Edge 20 Pro): hit-test,
  filtro de chão (`isFloorLike`), escala real e o botão "❌ Sair da RA"
  (via `dom-overlay` — sessão WebXR não vem com botão de sair garantido
  pelo navegador) confirmados funcionando.
  **Oclusão real por profundidade (Depth API) foi tentada e ABANDONADA**:
  mesmo só pedindo o recurso `depth-sensing` sem usar pra nada, a aba do
  Chrome travava ao encerrar a sessão nesse aparelho — não era bug do
  cálculo de oclusão (chegou a ser testado isoladamente, matemática
  confirmada correta), o próprio recurso se mostrou instável nessa
  combinação de hardware/navegador. **Não pedir `depth-sensing` de novo
  sem investigar antes se é uma limitação conhecida** — ver histórico do
  git (branch `feature/webxr-occlusion`, descartada) se for retomar essa
  investigação depois do hackathon. Resultado: o animal plantado no chão
  não respeita objetos reais na frente dele (ex: uma mão passando não o
  oclui) — limitação aceita, não um bug pendente.

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
- `alturaRealMetros`: altura real aproximada do animal em pé, em metros —
  usada só pelo modo WebXR (`aluno/js/webxr-mode.js`) pra escala real no
  chão. Não afeta o modo MindAR normal.
- **Reconhecimento é por imagem pré-cadastrada, não por IA/classificação**
  — o MindAR só compara contra a imagem exata que foi compilada no
  `.mind`, não "entende" que é um leão. Isso importa pra qualquer "banco
  de teste"/vitrine pros avaliadores: o `.mind` é **binário, não dá pra
  exibir como imagem**. Se for feita uma tela onde o avaliador escolhe um
  animal e vê a imagem-alvo pra apontar a câmera, `content/animals.json`
  vai precisar de um campo novo com a **imagem-fonte original** de cada
  alvo (a foto/página usada pra compilar o `.mind`), separado do
  `targetSrc` compilado.

## Firebase Realtime Database — schema

```
session/
  activeAnimal        → string: id do animal ativo (ou null)
  checkins/
    <push-id>/
      uid: string        → uid do Firebase Auth do aluno
      nome: string
      matricula: string
      timestamp: number
```

Paths vêm de `shared/constants.js` (`DB_PATHS`) — sempre importar de lá,
nunca hardcodear strings soltas nos dois lados (`aluno/` e `painel/`).
`AULA_DURATION_MS`/`CHECKIN_INTERVAL_MS` (também em `constants.js`)
controlam por quanto tempo e com que frequência `aluno/js/checkin.js` pede
check-in.

```
users/
  professores/
    <uid>/  → nome, matricula, cpf, liberado: boolean, criadoEm: number
  alunos/
    <uid>/  → nome, matricula, criadoEm: number
```

`<uid>` é o uid do Firebase Auth (não a matrícula) — sempre resolver o uid
via sessão autenticada (`ouvirSessao`/`ouvirPerfil` em `shared/auth.js`),
nunca assumir que a matrícula em si é a chave.
