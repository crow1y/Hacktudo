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
  (`aluno/js/ar.js` e assets), outra no menu de matérias do painel +
  conteúdo (`painel/js/main.js`, `content/animals.json`). O outro dev
  também usa Claude Code na própria máquina, em paralelo.
- **Antes de começar qualquer tarefa nova**, rodar `git fetch origin` e
  conferir `git log HEAD..origin/main --oneline` — o outro pode já ter
  commitado/aberto PR em cima do que você ia mexer.
- **Nunca implementar uma tarefa que já foi combinada como de outra
  pessoa**, mesmo que esteja tecnicamente desbloqueada — perguntar antes.
  Isso já aconteceu uma vez (`aluno/js/session-timer.js` foi implementado
  e teve que ser descartado) e causou fricção desnecessária.

## Posicionamento do produto (pós-mentoria — vale pra qualquer parte nova)

Numa mentoria do hackathon, a banca apontou que o projeto tinha focado
em acessibilidade **técnica** (funciona em qualquer celular) mas não
nos pontos que o tema real do hackathon cobra ("Como construir uma
relação mais consciente entre tecnologia e educação em um mundo cada
vez mais conectado e cheio de distrações?"). Três objeções concretas:

1. **Celular é restrito em escola** (lei federal 15.100/2025 no Brasil)
   — um app que assume uso livre de celular em sala não é realista.
2. **Nem todo aluno tem celular próprio** — depender de 1 aparelho por
   aluno exclui parte da turma.
3. **"Por que um adolescente escolheria isso em vez do Instagram?"** —
   tentar ser "tão chamativo quanto rede social" seria o oposto do
   tema (competir pela atenção livre, não construir uma relação mais
   consciente).

**Resposta decidida** (não é só uma seção isolada — o discurso muda em
vários pontos da `index.html`, de propósito, pra não parecer remendo):

- **Uso pontual, guiado pelo professor**, não uso livre — o celular
  entra em sala num momento específico, com começo e fim definidos pelo
  professor. Isso é compatível com a exceção pedagógica que a própria
  legislação já prevê, não é "burlar a lei".
- **Não depende de celular por aluno** — a experiência foi desenhada
  pra ser vivida **em grupo** (a matéria "ganhando vida" na tela é
  motivo pra chamar todo mundo ao redor, não pra isolar cada um). Um
  celular já basta pra reunir a turma. Isso também é a resposta pro
  ponto 3: o produto não compete com feed infinito por atenção
  individual — ele é uma descoberta coletiva, com começo e fim,
  literalmente o oposto do scroll solitário.
- **Público declarado: crianças e adolescentes, foco educacional** —
  mas **sem linguagem excludente** (nunca "só serve pra essa idade" ou
  "com a idade certa"). Testes reais mostraram que a experiência
  também agrada gente de outras idades — isso é usado como *evidência*
  de que o mecanismo de descoberta em grupo funciona, não como um pivô
  pra "todo mundo" enquanto público-alvo.
- **Precisão sobre o que a RA realmente faz**: nunca prometer que o
  bicho "sai da página" — isso não é mais verdade desde que o cartão
  de prévia usa `<model-viewer>`, desacoplado da cena MindAR/A-Frame
  (ver gotcha do "Cartão de prévia" abaixo). A descrição correta é: a
  matéria "ganha vida" num cartão na tela, e em celulares compatíveis
  dá pra ir além e plantar o animal em **tamanho real** na sala via
  WebXR — essa segunda parte é uma alegação real e ainda mais forte,
  puxa mais gente ao redor do que um cartão na telinha.

Onde isso já está implementado: `index.html` — hero (imagem trocada pra
mostrar um grupo, não uma pessoa sozinha), seção nova "Feito pra ser
vivido em grupo" (`#uso-consciente`, componente `.highlight-card` em
`css/site.css` — grade de 3 colunas colorida, não reaproveita
`.steps__grid` que é pra 4 itens), slide do carrossel reescrito, e
"Quem apoia esse projeto" (logos placeholder) virou "Nos apoie" (formas
reais de ajudar, já que não há patrocínio confirmado).

**Pra qualquer trabalho novo** (painel, conteúdo, features): manter essa
régua — não introduzir nada que leia como "competir pela atenção livre"
do aluno, não assumir 1 celular por aluno como pré-requisito, e não usar
linguagem que exclua quem não é criança pequena.

## Stack e arquitetura

- **AR**: MindAR + A-Frame (não Three.js puro) — CDNs carregadas direto
  no `aluno/index.html` (aframe, mind-ar, aframe-extras para tocar
  animação de glTF via `animation-mixer`). Sem bundler/build step de
  propósito.
- **Realtime sync**: Firebase Realtime Database, projeto `viva-livro`.
  Regras vivem em `database.rules.json` (na raiz do repo) — mas **isso é
  só o arquivo, não o deploy**: o projeto não tem Firebase CLI
  configurado, então o conteúdo desse arquivo precisa ser colado manualmente
  em Firebase Console > Realtime Database > Regras (e publicado) toda vez
  que mudar. Se o comportamento em produção não bater com o que o arquivo
  diz, suspeitar primeiro de "esqueceram de colar no Console" antes de
  qualquer outra coisa. Ver "Segurança do Realtime Database" abaixo pro
  que essas regras cobrem e o que ainda fica aberto de propósito.
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
- **Design**: tokens (cor, tipografia, espaçamento, raio, sombra) e
  componentes reutilizáveis (`.card`, `.field`, `.password-field`,
  `.btn-primary`, `.btn-secondary`, `.btn-link`, `.img-placeholder`)
  ficam em `shared/theme.css`, importado por `index.html` (landing page
  na raiz) e pelos três apps antes do CSS específico de cada um. Mudar um
  token ali afeta o projeto inteiro — não duplicar cor/espaçamento
  hardcoded nos CSS específicos, usar as `var(--...)`. Visual lúdico e
  colorido de propósito (público de 7 a 15 anos, inspirado em
  elefanteletrado.com.br) — decisão de produto, não usar tom mais neutro
  sem confirmar antes.
- **Landing page** (`index.html`, `css/site.css`, `js/site.js`): página
  pública de apresentação do projeto, com CTA pra `/aluno/` e `/painel/`.
  Hero e logo já têm arte real (`assets/img/HeroVivaLivros.jpg`,
  `assets/img/logo-mark.png`) — só ícones do carrossel ainda são
  `.img-placeholder` com `data-placeholder-label`. **Nunca listar
  patrocinador real sem confirmação** — não há patrocínio hoje, a seção
  "Nos apoie" pede ajuda de verdade (escola parceira, apoio financeiro,
  divulgação) em vez de mostrar logos placeholder. Números de impacto na
  seção de metas são objetivos, não dados reais — não virar estatística
  "alcançada" sem números de verdade. Ver "Posicionamento do produto"
  acima pro discurso/narrativa da página (mudou bastante pós-mentoria).

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
- **Antes de integrar um modelo animado (skin/ossos) novo, rodar
  `npm run check-model -- caminho/do/modelo.glb`** (`scripts/
  check-model.js`, sem dependências). Motivado por um bug real: a girafa
  travava o Chrome no modo WebXR (ver gotcha "girafa piscando" abaixo) —
  a causa **não era o tamanho do arquivo** (923 KB / 1.258 triângulos é
  irrisório pra qualquer GPU de celular), era a hierarquia de ossos ter
  fatores de escala muito desproporcionais entre si (achado: nó da malha
  com escala efetiva ~0.01 e um osso com escala local 100 — resíduo
  comum de conversão automática de FBX pra glTF no Sketchfab/Mixamo).
  Isso obriga o cálculo de skin a multiplicar números muito grandes por
  muito pequenos pra se cancelar, terreno arriscado pra precisão de
  shader em GPU de celular. O script sinaliza nó com escala fora do
  intervalo `[0.05, 20]` e a razão de escala osso/malha — rodado contra a
  girafa (achou o problema) e a raposa (`Fox.glb`, passou limpo) validou
  que a checagem funciona antes de confiar num modelo novo. **Não é
  garantia de que o modelo vai funcionar** (só reduz o risco desse tipo
  específico de bug), e não substitui testar de verdade no celular.
  A girafa em si foi **removida do projeto** depois (trocada por um
  elefante, `aluno/assets/models/elefante.glb`, que passou limpo nessa
  checagem) — os gotchas abaixo que mencionam ela ficam só como registro
  histórico de como o problema foi encontrado e corrigido, não descrevem
  mais o estado atual do repositório.
- **MindAR emite evento `arError`** com `{error: "VIDEO_FAIL"}` no
  `<a-scene>` quando a câmera falha — é assim que `aluno/js/ar.js` mostra
  a mensagem em português em `#ar-error`, em vez da tela de erro padrão
  (em inglês) do MindAR.
- **Rodar num monitor/tela em vez de imprimir a imagem-alvo deixa o
  rastreamento instável** (brilho/refresh da tela atrapalha o MindAR) —
  imagem impressa em papel funciona bem melhor.
- **Cartão de prévia** (`aluno/js/ar.js`, `#preview-card`): quando o
  MindAR reconhece um animal, ele NÃO aparece ancorado na página nem anda
  em círculo — vira um "cartão" centralizado na tela, renderizado por um
  **`<model-viewer>`** (Web Component do Google, motor 3D próprio,
  totalmente separado da cena MindAR/A-Frame), com o nome do animal e a
  câmera escurecida nas bordas (`#ar-vignette`, gradiente radial). Botão
  "🔄 Escanear outro" solta a captura pra reconhecer um animal diferente.
  Isso substitui uma abordagem antiga (bicho "saindo da página" e
  andando em círculo via um componente `wander`) — removida por decisão
  do produto: focar a experiência "real"/imersiva no modo WebXR abaixo, e
  usar o MindAR só como reconhecimento + prévia apresentável, não fingir
  ser RA de verdade sem rastreamento de mundo.
  ⚠️ **Gotcha real encontrado (histórico, motivo da escolha do
  `<model-viewer>`)**: a primeira tentativa de prévia tentava grudar o
  modelo do animal na câmera *dentro* da cena do MindAR/A-Frame (posição
  estática, depois um componente rodando a cada frame). Nunca renderizou
  em dispositivo real, apesar de todo estado introspectável reportar
  correto (`visible: true`, mesh carregado, posição certa, parent certo).
  Depuração encontrou uma causa real: `sceneEl.camera` (a câmera que o
  A-Frame de fato usa em `renderer.render(scene, camera)`) é um objeto
  **diferente** do `object3D` da `<a-camera>` declarada no HTML — ou
  seja, o conteúdo estava grudado na câmera errada. Reparentar direto
  pra `sceneEl.camera` via `object3D.add()` confirmou (via
  `renderer.info.render.triangles`) que o conteúdo passou a ser
  processado no frame renderizado — e AINDA ASSIM não aparecia na tela
  real (luz explícita também não resolveu). A causa final nunca foi
  100% identificada nesse nível. O que resolveu de fato foi abandonar
  renderização anexada à cena MindAR/A-Frame e usar um motor totalmente
  independente (`<model-viewer>`, posicionado só via CSS) — confirmado
  funcionando em dispositivo real. Lição: se algo parecido for tentado
  de novo (conteúdo grudado na câmera do A-Frame), desconfiar cedo da
  premissa "a câmera declarada é a câmera renderizada" e considerar um
  motor separado antes de investir muito tempo depurando dentro da cena
  do A-Frame. Histórico completo da investigação (incluindo as tentativas
  descartadas) está nos commits da branch `feature/preview-card`.
  O gotcha de `gltf-model`/`loadedModelAnimalId` (A-Frame reescrevendo o
  atributo pra URL resolvida e recarregar silenciosamente falhando) era
  específico da abordagem antiga baseada em `<a-gltf-model>` e não se
  aplica mais ao `<model-viewer>`.
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
  pelo navegador) confirmados funcionando na maior parte das vezes.
  ⚠️ **Histórico de um travamento intermitente ao sair** ("❌ Sair da
  RA" travando o Chrome inteiro, ANR — "o Google parou", não só a aba):
  duas tentativas por código não resolveram sozinhas — reordenar
  `cleanup()` (parar `setAnimationLoop` antes de mexer no DOM/WebGL) +
  `renderer.forceContextLoss()`, e um `setTimeout` de segurança que
  força `cleanup()`/`onExit()` mesmo se o evento nativo `"end"` nunca
  disparasse. Faziam sentido mas não miravam a causa raiz. **Causa raiz
  encontrada**: o travamento só acontecia com o animal "ativo" — ou
  seja, com o cartão de prévia (`<model-viewer>`, `autoplay`/
  `auto-rotate`) carregado. Entrar no modo WebXR só cobria o cartão
  visualmente (`#webxr-container` por cima), mas o `<model-viewer>`
  continuava rodando com o PRÓPRIO contexto WebGL o tempo inteiro,
  disputando GPU com o contexto do WebXR — dois contextos WebGL ativos
  ao mesmo tempo nesse aparelho. **Corrigido** em `enterFloorPlacement`
  (`aluno/js/ar.js`): limpa `previewModelViewerEl.src` e esconde
  `#preview-card` ao entrar no WebXR, restaura ao sair
  (`voltarPreview()`). Lição: um elemento só "escondido visualmente"
  (coberto por outro por cima) não é o mesmo que "parado" — um
  `<model-viewer>`/canvas com seu próprio loop de render continua
  consumindo GPU mesmo fora de vista, e isso importa especialmente ao
  rodar WebXR em paralelo.
  ⚠️ **Esse fix (limpar `src` + esconder) resolveu pra raposa mas não pra
  girafa** — voltou a travar ao sair, só com a girafa, com o modelo
  "piscando" antes de sumir. Só limpar `src` e esconder (`hidden`) não
  libera de fato o contexto WebGL do `<model-viewer>` — ele continua
  vivo (e, aparentemente, ainda rodando o loop de render internamente),
  só sem nada carregado. Pra um modelo leve (raposa, o `Fox.glb` de
  teste) isso nunca disputava recurso o bastante pra dar problema; a
  girafa (mais triângulos, textura maior) empurrou o uso de GPU/memória
  pra cima do limite. **Corrigido de vez** em `enterFloorPlacement`
  (`aluno/js/ar.js`): em vez de só esconder/limpar, o elemento
  `<model-viewer>` é **removido do DOM** ao entrar no WebXR (o navegador
  para o loop de render dele e libera o contexto de verdade) e um **novo
  é criado do zero** em `voltarPreview()` ao sair. Lição: "esconder e
  limpar o src" não é a mesma coisa que "destruir" — pra garantir que um
  Web Component com motor 3D próprio realmente solte a GPU, remover o
  elemento do DOM (não só do `hidden`) e recriar depois é mais seguro que
  confiar em algum método de pausa interno da lib.
  ⚠️ **Histórico: girafa "sumia" ao tocar "Fixar no chão"** (cartão de
  prévia funcionava normal, WebXR não mostrava nada): causa raiz tinha
  duas partes, as duas específicas de modelo com esqueleto (skin/bones) —
  não afetava a raposa (`Fox.glb`) porque o bind-pose dele já reflete o
  tamanho real. (1) `new THREE.Box3().setFromObject(model)` usa a
  geometria em bind-pose transformada só pela matrixWorld do próprio nó
  da malha, **sem aplicar a deformação dos ossos** — pra girafa isso deu
  uma altura ~400x menor que o tamanho real renderizado, fazendo a escala
  automática (`targetHeight / nativeHeight`) explodir. (2) a malha nem
  fica centrada na origem local do model (fica bem deslocada) — com
  aquela escala gigante multiplicando esse deslocamento, `model.position
  .copy(hitPoint)` plantava um "esqueleto vazio" no ponto certo, mas a
  malha visível ia parar a metros de distância. **Corrigido** com
  `computeWorldBox()` (usa `SkinnedMesh.applyBoneTransform` por vértice —
  o mesmo cálculo de skin que o three.js já usa internamente pro raycast
  — quando o model tem um `SkinnedMesh`, senão cai no `Box3` normal) pra
  medir a altura real, e reancorando a posição final pelo **centro do
  bounding box já escalado** em vez de só copiar o ponto do hit-test no
  root. Lição: com modelo animado por esqueleto, nunca confiar em
  `Box3().setFromObject`/`model.position` puros pra escala ou
  posicionamento — sempre validar com um teste renderizado de verdade
  (ver `_test-*.html` descartáveis usados nas outras trocas de modelo)
  antes de assumir que "carregou sem erro" significa "apareceu certo".
  **Esse fix acima não foi suficiente sozinho** — testado no celular
  depois, a girafa só "piscava" e tinha um retângulo branco no chão perto
  dela. Mais duas causas, as duas também específicas desse tipo de
  modelo/exportação: (3) a esfera de frustum culling que o three.js usa
  pra decidir o que desenhar vem da geometria em bind-pose (a mesma conta
  errada do item 1, sem aplicar os ossos) — com a escala grande que a
  girafa precisa, essa esfera fica longe de onde ela é desenhada de
  verdade (via skin, na GPU), então o three.js às vezes "cortava" o
  desenho mesmo com o bicho na frente da câmera. **Corrigido**: em
  `placeModel`, `child.frustumCulled = false` em todo `SkinnedMesh` do
  model (poucos vértices, sem custo real). (4) o modelo tem um mesh
  decorativo do Sketchfab (`ring_nofade_ADD`, um "anel de sumiço" pro
  visualizador deles) que fica invisível no `<model-viewer>` do cartão de
  prévia mas, no three.js puro sem o alpha/blend configurado, renderiza
  como um retângulo branco opaco perto do chão. **Corrigido**: em
  `placeModel`, esconde (`.visible = false`) qualquer mesh cujo
  `material.name` contenha `"nofade"` (convenção comum do Sketchfab pra
  esse tipo de prop). Lição adicional: um teste desktop (Chrome comum,
  sem WebXR) já teria pego os dois — não precisa de celular físico pra
  simular câmera girando ao redor do ponto de colocação e checar
  visualmente que nada pisca/aparece errado; só o hit-test em si (achar o
  chão de verdade) exige o aparelho real.
  ⚠️ **Histórico: girafa travando especificamente ao olhar pra cima**
  (pra ver a cabeça, depois de já plantada) — mesmo sem tocar em "Sair da
  RA". Suspeita: depois de plantado o modelo, o código já ignora o
  resultado do hit-test (`if (hitTestSource && !placed)`), mas nunca
  cancelava a busca em si — o ARCore continuava rastreando plano/chão o
  resto da sessão à toa, e essa busca fica mais pesada quando a câmera
  aponta pra uma superfície ruim pra tracking (pouca textura, longe,
  iluminação diferente) — exatamente o caso de apontar pro teto pra ver
  a cabeça de um animal alto. Somado ao resto do trabalho da cena (mesh
  pesada, skinning), suspeita forte de estourar o orçamento de frame do
  Chrome nesse momento específico. **Corrigido**: `hitTestSource.cancel()`
  assim que o modelo é plantado (no handler de `select`, e também se a
  Promise de `requestHitTestSource` resolver depois disso), e de novo em
  `cleanup()` caso a sessão termine antes de plantar. ⚠️ Ainda não
  confirmado no aparelho se resolve de vez — se persistir, o próximo
  suspeito é o hit-test em si não ser a causa e sim algo mais fundo do
  ARCore ao perder tracking apontando pra teto (mesma categoria do Depth
  API abaixo: instabilidade da combinação hardware/navegador, não bug de
  lógica).
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
- `larguraRealMetros` (opcional, número, metros): quando definido, o WebXR
  escala pelo maior eixo horizontal (X/Z) em vez de `alturaRealMetros`
  (teto de segurança `MAX_WIDTH_METERS = 2.5`, mesma ideia do
  `MAX_HEIGHT_METERS` só que pro chão). Existe porque escalar pela altura
  só funciona bem pra algo proporcionalmente mais alto que largo (bicho
  em pé) — um modelo achatado/espalhado (ex: sistema solar, anéis de
  órbita bem mais largos que altos) explode de tamanho nesse cálculo:
  escalar pra 1,5m de ALTURA um modelo 8x mais largo que alto multiplica
  esse espalhamento junto. Achado real: o `sistema-solar-realista.glb`
  tem só ~12,6 unidades nativas de altura contra ~108 de largura —
  `alturaRealMetros: 1.5` dava um sistema solar com **~13 metros de
  diâmetro** (usuário testou no celular, precisou ir pro quintal pra ter
  espaço e nem achou todos os planetas porque não cabiam). `orrery.glb`
  tinha o mesmo problema em escala menor (1,56m de LARGURA com
  `alturaRealMetros: 1.0`, mais largo que alto). Os dois ganharam
  `larguraRealMetros: 1.2` (tamanho de maquete de mesa de verdade). Sem
  esse campo, comportamento normal (escala pela altura) — é o caso de
  todo animal e do buraco negro (esse já tinha proporção ~1:1:1, sem
  esse problema).
- `flutuante` (opcional, bool): quando `true`, o WebXR planta o conteúdo
  pairando no ar numa altura ajustável (botões "🔼 Subir"/"🔽 Descer") em
  vez de em pé no chão — pra conteúdo sem "chão" próprio (ex: o sistema
  solar). Sem esse campo (ou `false`), comportamento normal de animal.
- `clipePreferido` (opcional, string): nome exato do clipe de animação a
  tocar quando o modelo não tem os clipes "Walk"/"Survey" (ou seja,
  quando não anda sozinho/não aceita analógico — `setupAnimalControl`
  cai no modo "só toca um clipe parado"). Sem isso, toca `animations[0]`
  do arquivo, que pode não ser o clipe mais ilustrativo (ex: o orrery tem
  2 órbitas diferentes disponíveis).
- `materia` (opcional, string): omitido = aparece na lista de Animais do
  painel/, ouvindo `DB_PATHS.activeAnimal` normalmente. `"astronomia"` ou
  `"fisica"` tiram a entrada dessa lista e fazem `painel/js/main.js`
  acender o selo "🔴 Ativo agora" no card fixo certo (`isAstronomia()`/
  `isFisica()`, `atualizarBadgesAstronomia()`/`atualizarBadgesFisica()`)
  em vez disso — mesmo pipeline de reconhecimento nos três casos, só
  muda pra qual aba do painel o "ativo agora" aponta. Ver "Menu de
  matérias do painel" abaixo pro card em si. **O selo em si NÃO usa mais
  `DB_PATHS.activeAnimal`** — ver "Quem está ao vivo em cada modelo"
  abaixo pro porquê e pro que mudou.
- `targetIndex: null` (em vez de um número): modelo/imagem já existem,
  mas o `.mind` compartilhado ainda **não foi recompilado** com o alvo
  dessa entrada — `isAssetReady()` em `aluno/js/ar.js` exclui esses itens
  da cena de RA até `targetIndex` virar um número real (o card ainda
  aparece completo no painel/ mesmo assim, já que o painel não exige
  `targetIndex` pronto pra mostrar nada). Foi o caso do `buraco-negro`
  entre a integração do modelo e a recompilação do `.mind` — ver
  "Menu de matérias do painel" abaixo pro estado atual.
- **Reconhecimento é por imagem pré-cadastrada, não por IA/classificação**
  — o MindAR só compara contra a imagem exata que foi compilada no
  `.mind`, não "entende" que é um leão. Isso importa pra qualquer "banco
  de teste"/vitrine pros avaliadores: o `.mind` é **binário, não dá pra
  exibir como imagem**. Se for feita uma tela onde o avaliador escolhe um
  animal e vê a imagem-alvo pra apontar a câmera, `content/animals.json`
  vai precisar de um campo novo com a **imagem-fonte original** de cada
  alvo (a foto/página usada pra compilar o `.mind`), separado do
  `targetSrc` compilado.

## Como adicionar um animal/modelo 3D novo (passo a passo)

Processo consolidado depois de trocar a girafa pelo elefante nesta
sessão (ver gotchas de escala/skin acima pra entender o "porquê" de
alguns desses passos). Vale tanto pra quem tá usando Claude Code quanto
pra fazer na mão.

1. **Achar um modelo animado e com licença livre** (Sketchfab é a fonte
   usada até agora — filtrar por "Downloadable" + licença CC). Preferir
   modelos com clipes de Idle/Walk/Run (ou nomes parecidos) já
   separados. CC Attribution/CC BY(-SA) são as licenças usadas no
   projeto até agora — exigem só crédito ao autor, sem restrição de uso
   comercial.
2. **Baixar o `.glb`** (não FBX/OBJ — o projeto usa glTF binário direto,
   sem pipeline de conversão) e rodar
   `npm run check-model -- caminho/do/modelo.glb` **antes de qualquer
   outra coisa**. Se der `⚠️`, principalmente por causa da razão
   osso/malha ou nó com escala fora de `[0.05, 20]`, desconfiar — foi
   exatamente esse padrão que quebrou a girafa (travamento intermitente
   no WebXR, não relacionado ao tamanho do arquivo). Não é garantia
   (só reduz risco), mas se der ruim aqui, procurar outro modelo antes
   de investir mais tempo.
3. **Conferir/renomear os clipes de animação** — `aluno/js/webxr-mode.js`
   procura por `Walk`, `Run` e `Survey` (case-insensitive) via
   `findClip()`; sem `Walk`+`Survey` o modelo só fica parado (sem
   quebrar nada, é um fallback silencioso). O `check-model.js` já lista
   os nomes de clipe que o arquivo tem. Se os nomes não baterem (ex.:
   `TRS|walk`, `Giraffe_Idle`), renomear com:
   ```
   node scripts/rename-clips.js caminho/do/modelo.glb "NomeAntigo=Walk" "OutroNome=Run" "OutroNome=Survey"
   ```
   (sobrescreve o arquivo in-place). Rodar `check-model.js` de novo
   depois só pra conferir que os nomes novos aparecem na lista.
4. **Validar visualmente antes de integrar de vez** — criar um
   `aluno/_test-<nome>.html` descartável (Three.js + GLTFLoader, sem
   MindAR/WebXR) que carrega o `.glb`, aplica a mesma lógica de escala
   do `placeModel` (`aluno/js/webxr-mode.js`: `computeWorldBox` +
   recentralização pelo bounding box, não só `Box3().setFromObject`
   cru) e renderiza com uma câmera orbitando o modelo por alguns
   segundos. Confirma visualmente: proporção/escala plausível, sem
   "piscar" (frustum culling), sem malha branca/sobras (props
   decorativos tipo o "ring" da girafa, que só apareciam fora do
   `<model-viewer>`). Servir pelo `python3 -m http.server` já rodando na
   raiz do projeto, abrir via Claude in Chrome. **Apagar o arquivo de
   teste no final** — nunca commitar `_test-*.html`.
5. **Sourcing de conteúdo real**: uma foto ilustrativa CC-licenciada
   (Wikimedia Commons é a fonte usada até agora — procurar "featured
   picture"/"quality image" costuma garantir licença clara e boa
   resolução) pra `imagem`, e uma ficha didática (`nomeCientifico`,
   `classificacao`, `habitat`, `alimentacao`, `tamanho`, `tempoDeVida`,
   `comportamento`, `curiosidades` — ver schema acima) escrita à mão.
6. **Adicionar a entrada em `content/animals.json`**: `id`, `nome`,
   `targetIndex` (ver passo 7 — só é definitivo depois de recompilar o
   `.mind`), `model` (root-relative, com `/` na frente), `alturaRealMetros`
   (real, mesmo que `MAX_HEIGHT_METERS` capote em 2m depois), `imagem`,
   `_comment_imagemCredito` (autor/licença/link) e `info`. Um `_comment`
   no topo da entrada documentando fonte/licença do modelo e quais
   clipes foram renomeados/ficaram sem uso ajuda muito o próximo que for
   mexer nisso (ver entrada `elefante` como exemplo).
7. **Recompilar `aluno/assets/targets/targets.mind`** — ⚠️ **isso é fácil
   de esquecer e o app "funciona" tecnicamente sem fazer isso** (o
   MindAR só reconhece o padrão visual que já estava compilado, então a
   câmera continua "achando" o alvo antigo — só que abre o conteúdo/
   modelo novo, o que fica incoerente com a foto impressa de verdade).
   A compilação **não é aditiva**: precisa subir de novo TODAS as fotos
   dos animais que já têm alvo (nas mesmas posições/ordem de sempre) +
   a foto nova, juntas, na ferramenta oficial
   (https://hiukim.github.io/mind-ar-js-doc/tools/compile), e baixar o
   `.mind` resultante por cima de `aluno/assets/targets/targets.mind`.
   Hoje a ordem é: raposa (`assets/img/raposa.jpg`) = índice 0, o novo
   animal = índice 1 (era a foto da girafa, agora é a do elefante). Se
   o Claude Code estiver fazendo isso: dá pra automatizar via
   `mcp__claude-in-chrome__file_upload` nos dois arquivos de imagem, e
   capturar o blob do botão "Download compiled" com um pequeno servidor
   HTTP local (`http.server`-like, aceitando POST com CORS liberado)
   em vez de depender da pasta de Downloads do Chrome da extensão (que
   não é a mesma do usuário) — o `javascript_tool` bloqueia retornar
   dados em base64 diretamente por segurança, então essa ponte local é
   o caminho que funcionou.
8. **Testar no celular de verdade** (câmera + WebXR) antes de considerar
   pronto — nenhum passo acima substitui isso, principalmente o
   comportamento de `placeModel`/animação em condições reais.
9. Atualizar `CLAUDE.md` (se achar algum gotcha novo) e `README.md`
   (checklist "Próximos passos" e qualquer menção ao animal antigo, se
   for uma substituição).

## Menu de matérias do painel

Dois níveis de navegação em `painel/index.html`, os dois 100% client-side
(sem Firebase envolvido na troca em si) e com o mesmo padrão visual
(`.materia-btn`/`.subtopico-btn` são estilizados igual, ver
`painel/css/style.css`):

- **Nível matéria** (`initMateriaTabs()` em `painel/js/main.js`): botões
  `.materia-btn` (`data-materia="..."`) mostram/escondem seções
  `[data-materia-conteudo="..."]`. Hoje: Ciências, Gramática, Geografia,
  História, Artes, Física, Química.
- **Nível subtópico** (`initMateriasNav()`, função separada de propósito
  — não confundir com a de cima): botões `.subtopico-btn`
  (`data-subtopico="..."`) mostram/escondem seções `.conteudo-materia`
  (`data-conteudo="..."`), escopado **por `.conteudo-materia-grupo`** (uma
  matéria) — cada matéria tem seu próprio conjunto isolado de subtópicos;
  sem esse escopo, um clique num subtópico de Ciências esconderia por
  engano o conteúdo de Física (mesmas classes CSS nas duas). Hoje:
  Ciências tem **Animais** (`#animal-info`, conteúdo real, escuta
  `DB_PATHS.activeAnimal`) e **Astronomia** (`#astronomia-info`, dois
  modelos 3D lado a lado — ver abaixo); Física tem **Buraco Negro**
  (`#buraco-negro-info`, um card fixo, mesmo padrão de Astronomia — ver
  abaixo). Gramática, Geografia, História, Artes e Química ainda não têm
  subtópico nenhum — são só um placeholder "Em breve teremos mais
  conteúdo para apresentar" dentro de `[data-materia-conteudo="..."]`.

  **Astronomia** tem os dois lados do projeto ao mesmo tempo: passa pelo
  MESMO pipeline de reconhecimento de imagem + WebXR que os animais
  (`content/animals.json`, `targetIndex`, `aluno/js/webxr-mode.js` — ver
  "Como adicionar um animal/modelo 3D novo" acima, o processo é idêntico)
  **e** aparece como visualizador giratório estático em `#astronomia-info`
  no painel (`<model-viewer>`, script adicionado no `<head>` de
  `painel/index.html`, apontando pros mesmos arquivos em
  `aluno/assets/models/` — sem duplicar o `.glb`). Dois modelos,
  escolhidos de propósito pra se complementar (confirmado com o usuário:
  "por que não os dois"):
  - `orrery.glb` — réplica de um instrumento mecânico antigo (CC
    Attribution, Sketchfab, by Smoggybeard) que mostra a órbita de cada
    planeta e a distância relativa entre eles. Tem 2 clipes de animação
    (`Earth 1 Min Orbit`, `Neptune 1 Min Orbit`); o `<model-viewer>` usa
    `animation-name="Earth 1 Min Orbit"` explicitamente, e no WebXR isso
    é o `clipePreferido` no JSON — sem isso, o fallback tocaria
    `animations[0]`, que pode não ser o mais ilustrativo (ver
    `setupAnimalControl` em `webxr-mode.js`). No WebXR fica em pé no
    chão, igual um animal (tem uma base/pedestal de verdade no modelo).
    Único caso do projeto até agora onde um modelo convertido de FBX
    passou limpo no `npm run check-model` de primeira.
  - `sistema-solar-realista.glb` — Sol, planetas e a Lua com texturas
    realistas e anéis de órbita (CC Attribution, Sketchfab, by
    Samer_Arab_S5). **`flutuante: true`** no JSON: não faz sentido esse
    plantado no chão como um bicho (é o espaço, não tem "chão"), então
    esse é o primeiro conteúdo que usa o modo "flutuante" do WebXR —
    fica pairando numa altura ajustável acima do ponto tocado (botões
    "🔼 Subir"/"🔽 Descer", `FLOAT_HEIGHT_*` em `webxr-mode.js`), em vez
    de ancorado no chão. Ideia do usuário: "e se o aluno pudesse decidir
    a altura, pra poder visualizar?". **Motivou um ajuste no
    `check-model.js`**: por não ter esqueleto (a animação é por
    transformação rígida de nó, não skin), os círculos de órbita de
    planetas distantes (Marte, Júpiter, Saturno, Urano, Netuno, Plutão)
    precisam de escala bem grande de propósito — o script antes
    sinalizava isso como suspeito (mesmo padrão numérico do bug da
    girafa), um falso positivo real. Corrigido: a checagem de "escala de
    nó fora do normal" só roda quando o arquivo tem pelo menos um
    `SkinnedMesh` (`skins.length > 0`) — sem esqueleto, essa classe de
    bug (precisão de shader no cálculo de skin) não pode ocorrer de jeito
    nenhum, então não há o que sinalizar.

**Buraco Negro** (`#buraco-negro-info`, dentro de Física) segue o mesmo
padrão de card fixo de Astronomia acima — reaproveita literalmente as
mesmas classes (`.astronomia-layout`/`.astronomia-card`/
`.astronomia-card__badge`/`.astronomia-card__legenda`), só com atributo
`data-fisica-id` em vez de `data-astronomia-id` (pra não colidir com o
seletor de `atualizarBadgesAstronomia()`) e sua própria
`atualizarBadgesFisica()`. **RA completa**: `targetIndex: 5` no JSON —
`aluno/assets/targets/targets.mind` foi recompilado incluindo
`assets/img/buraco-negro.jpg` (a foto real do Event Horizon Telescope,
primeira foto de um buraco negro já tirada, CC BY 4.0) como a 6ª imagem,
na mesma ordem das 5 já compiladas (raposa=0, elefante=1, leão=2,
orrery=3, sistema-solar=4, buraco-negro=5). **Tentei automatizar a
compilação rodando o `OfflineCompiler` do próprio pacote npm `mind-ar`
em Node** (existe, usa `canvas` pra funcionar sem navegador) — mas o
`canvas` é um addon nativo que falhou ao compilar nesta máquina Windows
(sem toolchain de build da Microsoft/Python); acabei usando a ferramenta
web mesmo. ⚠️ **Gotcha real encontrado ao automatizar isso via
Claude in Chrome**: a aba controlada pela extensão fica com
`document.hidden = true` (Page Visibility API) enquanto a janela real do
Chrome não está em primeiro plano — o compilador do MindAR usa
timers/rAF internamente, e o Chrome throttling de abas em segundo plano
deixou o progresso praticamente parado (22% depois de quase 2h). Nem um
clique programático na página mudou isso. **Resolvido** simplesmente
esperando o dono do projeto estar de volta e com a janela do Chrome em
primeiro plano — nesse caso o mesmo processo (6 imagens) terminou em
menos de 1 minuto. Lição: automação de página via extensão de browser
não substitui uma aba de verdade em primeiro plano pra qualquer coisa
que dependa de throughput de timer/rAF — para tarefas assim, ou manter a
janela focada durante a automação, ou fazer o passo manualmente.

⚠️ **Histórico: MindAR não reconhecia a foto do buraco negro de jeito
nenhum** (usuário testou em produção, "não tá reconhecendo"). Causa raiz
achada extraindo o `targets.mind` compilado (é `msgpack`, dá pra
inspecionar com `pip install msgpack` + `msgpack.unpackb`) e contando os
pontos de rastreamento (`maximaPoints`/`minimaPoints`) de cada alvo, em
todos os níveis da pirâmide de escala: raposa/elefante/leão/orrery/
sistema-solar tinham entre ~1.000 e ~3.000 pontos no total; a foto crua
do buraco negro (Event Horizon Telescope) tinha **14 pontos no total**,
praticamente zero. A foto do EHT é uma reconstrução radioastronômica
muito suave/borrada, de propósito (não é uma foto óptica normal) — sem
cantos ou bordas nítidas em lugar nenhum, exatamente o tipo de imagem
que detectores de feature tipo FREAK/DoG (o que o MindAR usa por baixo)
não conseguem ancorar, não importa a resolução do arquivo. Não era bug
de código nem de deploy (conferido: produção tinha o `.mind` e o
`animals.json` certos, byte-a-byte iguais ao local) — era a imagem em
si. **Corrigido** compondo a foto original (sem alterar nada nela)
dentro de uma moldura dourada + faixa de legenda com texto ("BURACO
NEGRO — M87*" etc., script Python com Pillow) — título/texto tem muitos
cantos nítidos, exatamente o que faltava. Depois da moldura, o mesmo
teste deu 535 pontos, na faixa dos outros alvos.

⚠️ **Essa primeira moldura (só texto) não resolveu** — usuário testou de
novo (numa tela, enquadrando a imagem inteira) e continuava sem
reconhecer, mesmo com 535 pontos.
Suspeita: **texto tem cantos repetitivos entre si** (letras parecidas
geram descritores locais parecidos), diferente da textura orgânica
(pelo de animal, anéis de órbita) dos alvos que já funcionavam bem —
"mais pontos" não é a mesma coisa que "pontos distintos o bastante pro
matching". **Corrigido de novo** adicionando um campo de estrelas real
(~2.200 pontinhos de tamanho/brilho aleatórios, gerados com
`random`+`ImageDraw.ellipse`, tema espaço combina) na moldura, mantendo
a legenda — de 535 pra **891 pontos**.

⚠️ **Ainda não resolveu de novo** — usuário testou (numa tela, apontando
pra imagem inteira com moldura+legenda visíveis) e continuava sem
reconhecer, com um detalhe importante pra isolar a causa: apontar pra
imagem da **raposa** reconheceu normalmente no mesmo teste. Isso
descartou de vez a hipótese de ter quebrado o `.mind` compartilhado
inteiro (recompilado várias vezes nesse processo) — o problema é
mesmo específico da imagem do buraco negro. Suspeita nova: as estrelas
da tentativa anterior eram pequenas (1-3px) numa moldura fina (28px) —
talvez sutis demais pra resolver na distância/resolução real de
captura, mesmo contando como "pontos" na imagem-fonte em alta resolução.
**Terceira tentativa**: moldura bem mais grossa (28px → 90px, +
legenda de 260px → 340px, mais área pra textura), campo de estrelas bem
mais denso (~5.000 pontinhos pequenos/médios + ~220 "estrelas
cintilantes" maiores com uma cruz de brilho, que também dão cantos bem
definidos), texto sobre uma placa semi-opaca pra continuar legível por
cima do fundo mais carregado. De 891 pra **2.032 pontos** — bem na
faixa da raposa (2.283) e do sistema-solar (1.919), os dois já
confirmados funcionando. `assets/img/buraco-negro.jpg` é essa versão
(moldura grossa + estrelas densas + legenda) agora — mesmo arquivo pro
card do painel e pra escanear; a foto em si nunca foi editada/cortada,
só a moldura ao redor mudou (e cresceu) a cada tentativa. **Ainda não
confirmado no celular** depois dessa terceira troca — só validado via
contagem de pontos no `.mind`. Se persistir mesmo assim, a explicação
deixa de ser "poucos pontos" (2.032 já é uma contagem saudável) e passa
a ser mais provável um problema mais fundamental de que fotos com fundo
muito escuro/baixo-contraste-geral simplesmente não são bons alvos pra
esse detector nesse hardware, mesmo com textura artificial adicionada —
nesse caso a saída seria não insistir em usar a foto real do EHT como
alvo de câmera (ela continua podendo aparecer só como imagem
ilustrativa/ficha, como as outras fotos-fonte fariam se algum dia
precisassem trocar de alvo). Lição: (1) uma imagem-alvo
"bonita"/icônica não é a mesma coisa que uma imagem *rastreável* — vale
desconfiar cedo de fotos muito suaves/borradas ou com grandes áreas
uniformes como alvo de MindAR; (2) ao "consertar" isso adicionando
elementos artificiais, preferir textura orgânica/aleatória (ruído,
pontos, padrões) a texto/formas geométricas repetitivas — quantidade de
pontos não substitui distintividade dos descritores; (3) contagem de
pontos no `.mind` é um bom primeiro filtro, mas só o teste em aparelho
real confirma de verdade (mesma lição de sempre nesse projeto).

⚠️ **Histórico: modelo do buraco negro trocado por "jatos" visualmente
quebrados** (cacos/losangos cinzas com buracos entre eles, nos polos do
disco de acreção). O primeiro modelo usado ("Black hole" da extinta
Google Poly, CC BY 3.0, via `static.poly.pizza` — pedido originalmente
com um modelo do Sketchfab que exige login mesmo sendo CC BY 4.0
gratuito, `GET /v3/models/<uid>/download` sem auth retorna 401) passava
limpo em `npm run check-model` (sem esqueleto, sem escala suspeita — não
é a mesma classe de bug da girafa) e a textura embutida não tinha canal
alpha (não é bug de transparência/corte). Conclusão: não era um bug
técnico, era só um asset gratuito com **1.572 triângulos**, poligonal
demais pra um jato cônico parecer liso num app educacional. **Trocado**
por "Blackhole" de rubykamen (Sketchfab, CC BY 4.0,
https://sketchfab.com/3d-models/blackhole-74cbeaeae2174a218fe9455d77902b5c,
**231.824 triângulos**, baixado direto em `.glb` sem passar por
conversão OBJ/FBX) — disco de acreção com lente gravitacional, visual
parecido de propósito com a própria foto do Event Horizon Telescope já
usada como imagem-alvo desse card. Tamanho de arquivo (8,5MB) na mesma
faixa do elefante/leão já usados no projeto — não é pesado demais pro
padrão já aceito. Validado com `npm run check-model` (limpo) e
visualmente no `<model-viewer>` do painel local antes de trocar. Lição:
um modelo passar limpo em `check-model.js` só descarta a classe de bug
"escala/esqueleto desproporcional" — não garante qualidade visual; baixa
contagem de triângulos pode produzir geometria que lê como "quebrada"
mesmo sem nenhum bug técnico de verdade.

Pra adicionar:
- **Matéria nova** (sem conteúdo ainda): um botão `.materia-btn` em
  `.materias-nav` + uma `<section class="card conteudo-materia-grupo"
  data-materia-conteudo="...">` com o placeholder — mesmo valor nos dois
  `data-materia`/`data-materia-conteudo`. Não precisa mexer em JS.
- **Subtópico dentro de uma matéria** (como Animais/Astronomia em
  Ciências, ou Buraco Negro em Física): um botão `.subtopico-btn` + uma
  seção `.conteudo-materia` com o mesmo valor em
  `data-subtopico`/`data-conteudo`, dentro do `.conteudo-materia-grupo`
  daquela matéria (por causa do escopo do `initMateriasNav()` acima, não
  precisa se preocupar com colisão de nomes entre matérias diferentes).
  Se o conteúdo for estático, também não precisa mexer em JS.

⚠️ Ao esconder/mostrar uma seção nova assim, cuidado pra nunca dar
`display` (flex/grid/etc.) numa classe que também leva `hidden` sem a
guarda `:not([hidden])` — regra de autor sempre ganha da regra padrão do
navegador pra `[hidden]`, e a seção fica "presa" visível. Já aconteceu
uma vez com `.painel-layout` (ver histórico do git) — `.conteudo-materia-grupo`
de propósito não tem nenhum `display` próprio no CSS pra não repetir o
mesmo bug.

## Quem está ao vivo em cada modelo (`session/viewers`)

Pedido do dono do projeto: o professor queria ver, por modelo, quais
alunos estão vendo aquilo **naquele segundo** — diferente de
`DB_PATHS.activeAnimal` (`session/activeAnimal`), que é um valor único
pro projeto inteiro (só guarda "o último animal que qualquer aluno
escaneou"), não dá pra saber quantos/quais alunos estão em cada um.

- **Schema**: `session/viewers/<animalId>/<uid>` → `{ nome, matricula,
  ts }` (ver "Firebase Realtime Database — schema" abaixo). Um nó por
  animal, um filho por aluno vendo ele agora.
- **Aluno escreve** (`aluno/js/ar.js`, `showPreview()`/`hidePreview()`):
  grava o próprio registro quando o cartão de prévia aparece pra um
  animal, remove quando clica "🔄 Escanear outro". Registra também
  `onDisconnect(viewerRef).remove()` — **crucial**, porque é o que
  garante que o registro some sozinho se o aluno só fechar a aba/
  navegador sem clicar em nada (o caso mais comum). Precisa do perfil do
  aluno (nome/matrícula) carregado antes de gravar — por isso
  `aluno/js/main.js` só chama `initAR(user, perfil)` depois que
  `ouvirPerfil()` resolve (antes, `initAR()` rodava sem esperar o
  perfil, já que só cuidava da câmera).
- **Painel lê** (`painel/js/main.js`): um único `onValue(ref(db,
  DB_PATHS.viewers), ...)` no nó inteiro (poucos alunos simultâneos no
  hackathon, não compensa um listener por animal), reconstruindo um
  `Map<animalId, Array<{nome, matricula}>>` (`viewersByAnimalId`) a cada
  mudança. Cada modelo (itens da lista de Animais E os cards fixos de
  Astronomia/Física) ganhou um bloco `.viewers-bloco` com botão
  "👀 Ver quem está ao vivo (N)" / "👀 Ninguém ao vivo agora" que
  expande uma lista de nomes (`viewersExpandidos`, um `Set` de animalId
  guardando quais o professor abriu, pra não fechar sozinho a cada
  atualização — a lista de Animais inteira é recriada via `innerHTML`
  em todo `renderLista()`).

⚠️ **Motivou um fix separado no selo "🔴 Ativo agora"**: o selo (lista de
Animais + cards fixos de Astronomia/Física) usava `animalAtivoId`
(`DB_PATHS.activeAnimal`) — só que esse valor **nunca tinha
`onDisconnect`**, então se o aluno fechasse o app sem clicar "Escanear
outro" (o normal), o valor ficava "grudado" no último animal escaneado
pra sempre, mesmo sem ninguém mais olhando (usuário percebeu isso na
raposa, testando local). **Corrigido**: `temAlguemAoVivo(animalId)` em
`painel/js/main.js` (`(viewersByAnimalId.get(animalId)?.length ?? 0) >
0`) substituiu `animal.id === animalAtivoId` nos três lugares que
acendiam o selo (`cardAnimalHtml`, `atualizarBadgesAstronomia`,
`atualizarBadgesFisica`) — como `session/viewers` já tem `onDisconnect`,
o selo agora desliga sozinho quando o aluno some, e de quebra passa a
suportar vários modelos "ativos" ao mesmo tempo (um aluno em cada), coisa
que um valor único nunca conseguiria. `animalAtivoId`/`activeAnimal`
continuam existindo só pra decidir qual animal abre sozinho no painel de
detalhes da aba Animais quando alguém escaneia — não tem mais nada a ver
com o selo.

⚠️ **Ainda depende da regra nova em `database.rules.json` ser colada no
Firebase Console** (ver gotcha "isso é só o arquivo, não o deploy" em
"Stack e arquitetura") — testado localmente sem publicar e a escrita deu
`PERMISSION_DENIED` (esperado: regras publicadas hoje não conhecem
`session/viewers`). Sem publicar, nada quebra — a escrita do aluno e a
leitura do painel só falham silenciosamente (erro só no console,
promises não aguardadas) e os blocos ficam sempre em "Ninguém ao vivo
agora"/sem selo, como se ninguém nunca escaneasse nada.

## Presenças do painel

`painel/index.html` tem uma `.painel-tabs` (`.painel-tab-btn`,
`data-painel-tab="..."`) trocando qual seção com `data-painel-view="..."`
fica visível — **separada** do `.materias-nav` de dentro da aba
"Matérias" de propósito (`initPainelTabs()` em `painel/js/main.js`, não
confundir com `initMateriasNav()`).

⚠️ **Histórico**: já existiu uma feature de check-in de presença
(`aluno/js/checkin.js`) que foi **removida por completo** numa sessão
anterior porque "não fazia sentido na nova estrutura de matérias" (na
época, presença e matérias brigavam pelo mesmo espaço de tela). A
reintrodução aqui foi decisão consciente do dono do projeto, ciente desse
histórico — o design como aba de topo separada (em vez de misturada no
menu de disciplinas) existe justamente pra não reproduzir o motivo
original da remoção. Se cogitar remover de novo, checar primeiro se o
motivo é esse mesmo conflito de espaço ou outra coisa.

⚠️ **Decisão confirmada com o usuário**: um pedido de feature por "uma
aba Check-ins mostrando quem entrou e quem saiu" foi resolvido **sem
mudar código nenhum** — essa aba "✅ Presenças" já cobre isso (entrada,
tempo em aula, "🟢 Na aula agora"). Se pedirem "Check-ins" de novo,
perguntar primeiro se não é só essa aba com outro nome antes de propor
uma tela nova.

Nada aqui aparece como cronômetro visível pro aluno — é registro
silencioso só pro professor, seguindo a régua de "não competir pela
atenção do aluno" (ver "Posicionamento do produto" acima):
`aluno/js/presence.js` cria a presença do dia automaticamente
(`iniciarPresenca()`, chamado por `startApp()` em `aluno/js/main.js`
depois do perfil carregar) e só soma tempo (`duracaoMs`) enquanto a aba
está visível (`visibilitychange`) — minimizar/trocar de aba congela a
soma, ela não é exibida em lugar nenhum do app do aluno. `painel/js/presence.js`
(`initPresenceView()`) lê `presencas/<data>` e deixa o professor confirmar
ou marcar como não presente (`status`) — só o professor escreve nesse
campo.

## Firebase Realtime Database — schema

```
session/
  activeAnimal        → string: id do animal ativo (ou null)
  viewers/
    <animalId>/
      <uid>/  → nome, matricula, ts: number (timestamp de quando o
                aluno começou a ver esse modelo)
```

Paths vêm de `shared/constants.js` (`DB_PATHS`) — sempre importar de lá,
nunca hardcodear strings soltas nos dois lados (`aluno/` e `painel/`).
Ver "Quem está ao vivo em cada modelo" acima pro porquê do `viewers` (e
por que ele NÃO é só uma versão detalhada do `activeAnimal`).

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

```
presencas/
  <AAAA-MM-DD>/
    <uid>/  → nome, matricula, entrada: number (timestamp do 1º acesso do
              dia), saida: number (timestamp do último heartbeat),
              duracaoMs: number (soma só enquanto a aba fica visível),
              status: "pendente" | "confirmada" | "rejeitada",
              online: boolean
```

Uma chave por dia por aluno — reabrir o app no mesmo dia soma na mesma
entrada (via `runTransaction` em `aluno/js/presence.js`, que preserva
`entrada`/`status` se o registro já existir). `status` começa sempre
`"pendente"` e só o professor muda (`painel/js/presence.js`).

## Segurança do Realtime Database (`database.rules.json`)

Regras reais (não mais totalmente abertas) — mas **lembrar que colar o
arquivo no Firebase Console é manual**, ver gotcha acima. Decisão
consciente do dono do projeto: manter `/admin/` sem login de verdade por
enquanto (só o `ADMIN_ACCESS_CODE` client-side de sempre), então as
regras não tentam fingir que esse fluxo é seguro — só reduzem o raio de
dano de "banco inteiro aberto" pra "esse campo específico continua
aberto, documentado".

- `users/alunos/<uid>`: só o próprio aluno lê/escreve (`auth.uid ===
  uid`). Sem exceção — nada em `painel/`/`admin/` precisa ler esse nó
  (nome/matrícula do aluno já vêm denormalizados em `presencas`).
- `users/professores/<uid>`: leitura continua **aberta pra qualquer um**
  de propósito — `/admin/js/main.js` lê a lista inteira sem estar
  autenticado. Isso significa **CPF continua exposto** publicamente
  até `/admin/` ganhar login de verdade (não fazer disso um "já
  resolvido"). Escrita é campo a campo: `nome`/`matricula`/`cpf` só o
  dono (`auth.uid === uid`); `criadoEm` só na criação; `liberado` só
  pode ser criado como `false` pelo próprio professor no cadastro, e só
  pode mudar depois (pra `true`/`false`) se o registro **já existir** —
  sem exigir login. Ou seja: **qualquer um que descubra o caminho ainda
  consegue liberar/revogar um professor sem passar pelo código do
  admin — incluindo o próprio professor se auto-aprovando**, chamando a
  escrita direto (ex: pelo console do navegador, reaproveitando o SDK já
  carregado na página) sem nunca abrir `/admin/`. Não é regressão (antes
  dessas regras o banco inteiro já era assim), mas não tratar "regras
  configuradas" como "aprovação de professor é confiável agora" — só
  fica confiável quando `/admin/` ganhar login de verdade (rejeitado por
  ora, ver decisão do dono do projeto). Mesma limitação de sempre, só
  que restrita a um campo em vez do banco inteiro. `shared/auth.js` usa
  `update()` (não `set()`) pra
  criar o perfil do professor de propósito — um `set()` no nó inteiro
  exigiria permissão de escrita ampla o bastante pra o próprio professor
  também conseguir escrever `liberado: true` em si mesmo.
- `presencas/<data>/<uid>`: exige login pra ler (`auth != null`).
  Escrita permitida pro próprio aluno (seu registro) OU por qualquer
  professor com `liberado === true` (consultado via
  `root.child('users/professores')...`) — não há regra por campo
  separando "só o professor mexe em `status`", então um aluno
  tecnicamente ainda consegue escrever no próprio `status` chamando a
  API do Firebase direto (não pela UI, que nunca faz isso). Aceito por
  ora pra não arriscar quebrar os heartbeats com uma regra em cascata
  mal testada — se for endurecer isso depois, testar bem no Simulador de
  Regras do Firebase Console antes de publicar (o comportamento de
  cascata de `.write`/`.validate` em nós aninhados é fácil de errar).
- `session/activeAnimal`: exige login pra ler/escrever (`auth != null`),
  sem diferenciar papel (aluno escreve, aluno ou professor podem ler).
- `session/viewers/<animalId>/<uid>`: leitura exige login (`auth !=
  null`) no nível `<animalId>` (o professor lê o nó `viewers` inteiro de
  uma vez, ver "Quem está ao vivo em cada modelo" acima). Escrita só do
  próprio uid (`auth.uid === $uid`), campo a campo não validado — só
  exige que o registro tenha `nome`/`matricula`/`ts`. **Regra nova,
  ainda não publicada no Firebase Console** nesta sessão — testado local
  e deu `PERMISSION_DENIED` na escrita, como esperado (ver gotcha "isso é
  só o arquivo, não o deploy" em "Stack e arquitetura"). Lembrar de colar
  o `database.rules.json` atualizado no Console antes de testar essa
  feature em produção ou até em localhost contra o banco real.
