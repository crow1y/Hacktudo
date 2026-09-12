# Vivalivros

Aluno aponta a câmera do celular pra uma imagem de animal no livro
didático → o bicho "ganha vida" em 3D na tela, ali mesmo, na hora, sem
precisar instalar nenhum app. Projeto criado no Hacktudo.

**Sumário**
- [O que o projeto faz](#o-que-o-projeto-faz) — pra quem quer entender a
  ideia e o que já funciona hoje (professor, coordenador, patrocinador,
  banca não-técnica).
- [Documentação técnica](#documentação-técnica) — pra quem vai mexer no
  código.

---

## O que o projeto faz

### Em uma frase

O aluno usa o celular pra "escanear" uma imagem do livro de Ciências, e
um bicho animado em 3D aparece na tela — como se tivesse saído da
página. Ao mesmo tempo, a tela do professor (projetada pra turma) mostra
informações sobre aquele bicho em tempo real.

### Como funciona, do ponto de vista do aluno

1. **Entra com matrícula e senha** (não precisa de e-mail) — se ainda
   não tem conta, cria uma na hora, pela própria tela do celular.
2. **Aponta a câmera pra imagem do animal** no livro didático.
3. Em segundos, o bicho aparece **animado, num cartão na tela**, com o
   nome dele e uma animação (ele se move, olha ao redor, etc.), como se
   fosse um cartão de figurinha que ganhou vida.
4. Se o celular for compatível (ver abaixo), aparece um botão extra:
   **"Fixar no chão"**. Ao tocar, é só apontar a câmera pro chão de
   verdade da sala — o bicho aparece parado ali, **no tamanho real dele**
   (sem elefante do tamanho de um rato nem formiga gigante), e passa a
   **andar sozinho pela sala**, como se estivesse ali de verdade. Dá pra
   andar ao redor dele e ver de qualquer ângulo.
5. Nesse modo avançado, o aluno também pode:
   - **Assumir o controle do bicho** com uma espécie de "controle de
     videogame" que aparece na tela (um círculo que você arrasta com o
     dedo pra guiar ele pra onde quiser, podendo até fazer ele correr).
   - **Deixar ele paradinho** com um botão de pausa — útil na hora de
     prestar atenção numa explicação sem o bicho ficando andando de um
     lado pro outro.
6. Um botão "🔄 Escanear outro" solta o bicho atual e libera pra
   escanear um animal diferente.

### Como funciona, do ponto de vista do professor

O professor também entra com matrícula e senha (conta de professor
precisa ser aprovada por um administrador do sistema antes de poder ser
usada — ver avisos abaixo). A tela do professor (pensada pra ficar
aberta no computador ligado ao projetor da sala) mostra um **menu de
matérias**: Ciências (com conteúdo real, dois assuntos — **Animais** e
**Astronomia**) e Física (um assunto — **Buraco Negro**), mais Gramática,
Geografia, História, Artes e Química (ainda sem conteúdo, mostram um
aviso de "em breve"). Dentro de Astronomia tem dois modelos giratórios
lado a lado na tela do professor: uma réplica mecânica do sistema solar
(um "orrery", mostrando a órbita relativa de cada planeta) e um sistema
solar com texturas realistas do Sol, planetas e a Lua — os dois também
escaneáveis pelo aluno no celular, exatamente como os animais (ver
abaixo), incluindo o modo de "Fixar no chão"; o sistema solar realista
tem uma variação: em vez de ficar em pé no chão, fica flutuando no ar
numa altura que o próprio aluno ajusta com dois botões, já que
representa o espaço, não um bicho. Física mostra um modelo giratório de
um buraco negro, junto com a mesma foto real usada pelo Event Horizon
Telescope pra tirar a primeira foto de um buraco negro da história — o
card já está pronto, mas ainda não é escaneável pelo aluno (falta
recompilar o arquivo de reconhecimento de imagem, ver pendências
abaixo).

Dentro de Animais, cada bicho é um **link com foto** numa lista. Clicando
num deles, aparece uma ficha completa (nome científico, classificação,
habitat, alimentação, tamanho, tempo de vida, comportamento e
curiosidades) — informação suficiente pra o professor explicar de
verdade, não só um resumo de uma linha. A lista também **segue
automaticamente** o que o aluno está escaneando no celular naquele
momento (um selo "🔴 Ativo agora" aparece no card correspondente), mas o
professor pode clicar em qualquer outro animal a qualquer momento pra
consultar, sem perder o que já apareceu. Clicando na foto, ela abre em
tela cheia sem corte — útil tanto pra explicar melhor quanto pra
projetar a mesma imagem pra turma escanear.

### O que já dá pra usar hoje vs. o que ainda tá em construção

**Já funciona, testado em celular de verdade:**
- Reconhecer a imagem do livro e mostrar o bicho animado na tela — hoje
  com **três animais reais simultâneos**: raposa, elefante e leão (ver
  abaixo).
- O modo avançado de "plantar" o bicho no chão em tamanho real. Raposa e
  elefante andam sozinhos com transição suave entre parado/andando/
  correndo; o elefante em especial vem de um modelo com 28 clipes de
  animação originais (só 3 usados hoje: parado/andar/correr; os outros
  25, tipo comer/dormir/atacar, são candidatos a uma futura feature de
  "ações extras"). O leão anda sozinho também, mas com uma limitação:
  o modelo dele só tem 1 clipe de animação (sem "parado" separado), então
  as pernas continuam em ciclo de caminhada mesmo nas pausas — aceito
  como troca pelo visual bem melhor que as alternativas gratuitas
  disponíveis (ver `CLAUDE.md`).
- Cadastro/login por matrícula e senha, com aprovação de professor por
  um administrador.
- Painel do professor com o menu de matérias, a lista de animais (foto +
  ficha completa) atualizando em tempo real, Astronomia com dois
  modelos 3D giratórios (orrery mecânico + sistema solar realista), e
  Física com o card do buraco negro (giratório + foto real + ficha).
- Página inicial de apresentação do projeto (a que você provavelmente
  está vendo agora, se não estiver direto no app).

**Implementado, ainda sem confirmação em celular de verdade:**
- Astronomia também escaneável pelo aluno, igual um animal: orrery (fica
  em pé no chão) e sistema solar realista (fica flutuando no ar, numa
  altura que o aluno ajusta com dois botões — primeiro conteúdo do
  projeto que não fica "em pé", já que representa o espaço). Validado
  num Three.js isolado simulando a mesma lógica do modo WebXR, mas ainda
  não testado numa sessão de RA de verdade no celular.

**Ainda em construção:**
- **Três animais têm conteúdo/RA completos hoje**: raposa (modelo 3D de
  exemplo, mas foto e conteúdo educativo reais), elefante e leão (modelo,
  imagem e ficha próprios) — a base do sistema já entende vários animais
  ao mesmo tempo, só falta completar o conteúdo de mais espécies.
- Gramática, Geografia, História, Artes e Química já existem como abas
  no painel do professor, mas ainda sem conteúdo (aviso de "em breve").
- Física tem conteúdo real (Buraco Negro: modelo, foto e ficha), mas
  ainda não é reconhecido pela câmera do aluno — falta recompilar o
  arquivo de reconhecimento de imagem incluindo essa foto (ver
  pendências abaixo). O card já aparece completo no painel.
- Algumas ilustrações da página inicial (ícones do carrossel) ainda são
  espaços reservados, sem arte final.
- Sem patrocínio confirmado ainda — em vez de logos placeholder, a seção
  "Nos apoie" já lista formas concretas de ajudar (indicar escola
  parceira, apoio financeiro, divulgação).

### Avisos importantes

- **O modo de "plantar no chão" só existe em alguns celulares Android**
  com o Chrome mais novo — ainda não existe em iPhone. O reconhecimento
  normal (apontar pro livro) funciona em qualquer celular com câmera.
- **O bicho plantado no chão não desvia de pessoas ou objetos reais** na
  frente dele (o celular não consegue "entender" a profundidade da sala
  o suficiente pra isso) — e também não afasta muito do lugar onde foi
  colocado, já que o celular não sabe onde estão as paredes de verdade.
  São limitações conhecidas, não bugs.
- **O código que libera acesso de professores é só uma trava simples**
  contra cliques sem querer, não é segurança de verdade — precisa ser
  trocado por alguém técnico antes de qualquer uso real numa escola.
- **Os números da seção "Pra onde a gente quer ir"** (tipo "+1.000
  alunos") são objetivos/sonhos do time, não números reais já
  alcançados — o projeto acabou de sair de um hackathon.
- **Não há patrocínio confirmado até agora** — a seção "Nos apoie" é um
  convite real pra quem quiser ajudar (escola parceira, apoio
  financeiro, divulgação), não uma lista de apoiadores existentes.

---

## Documentação técnica

### Stack

- **AR / reconhecimento de imagem**: MindAR + A-Frame — roda 100% no
  navegador do celular do aluno, sem instalar nada.
- **Cartão de prévia do animal**: [`<model-viewer>`](https://modelviewer.dev/)
  (Web Component do Google), um motor 3D independente da cena
  MindAR/A-Frame — ver gotcha detalhado no `CLAUDE.md` sobre por que essa
  separação foi necessária.
- **Modo avançado (chão real)**: WebXR (`hit-test` + `dom-overlay`), em
  Three.js puro (`aluno/js/webxr-mode.js`), separado do A-Frame. Suporta
  Android/Chrome com ARCore; não existe em Safari/iPhone. O bicho anda
  sozinho (máquina de estados simples: anda/corre/para) dentro de um
  raio de segurança em torno do ponto onde o chão foi tocado — não há
  detecção real de paredes (WebXR Plane Detection/Depth API foram
  avaliadas; Depth API foi tentada e abandonada por instabilidade, ver
  `CLAUDE.md`). Também dá pra controlar manualmente via um analógico
  virtual (relativo à câmera) e pausar o andar automático.
- **Sincronização em tempo real**: Firebase Realtime Database —
  client-side puro, sem servidor próprio pra manter.
- **Login/cadastro**: Firebase Authentication (matrícula + senha),
  client-side puro.
- **Design**: CSS puro com tokens compartilhados (`shared/theme.css`) —
  sem framework/build step. Tema claro único, visual lúdico/colorido
  (público de 7 a 15 anos), tipografia Quicksand/Nunito (Google Fonts),
  espaçamento fluido via `clamp()`.
- **Hospedagem**: estática, na Vercel, com HTTPS automático.

### Estrutura do projeto

```
index.html, css/site.css, js/site.js → landing page pública na raiz (apresentação do projeto + CTA pra aluno/painel)
assets/img/  → imagens reais já usadas no projeto (hero e logo da landing page)
aluno/       → app que roda no celular (login/cadastro, câmera, AR, modo WebXR)
painel/      → app que roda no computador/projetor do professor (login/cadastro + menu de matérias)
admin/       → tela do dono do sistema pra liberar o acesso de professores cadastrados
shared/      → config do Firebase, auth, validadores, design system (theme.css) e constantes usadas por todos os apps
content/     → dados didáticos dos animais (JSON), sem lógica
ia/          → contexto do projeto e prompts prontos para ferramentas de IA
```

### Setup

#### 1. Instalar dependências (só o servidor de dev local)

```bash
npm install
```

#### 2. Firebase

Já configurado (projeto `viva-livro`, config em `shared/firebase-config.js`,
regras do Realtime Database abertas para o hackathon). Se precisarem
recriar do zero: Firebase Console > Realtime Database > ativar > copiar
config do app Web > colar em `shared/firebase-config.js`.

**Login/cadastro precisa do provedor Email/Password ativado**: Firebase
Console > Authentication > Sign-in method > ativar "Email/Password". Sem
isso, `cadastrarAluno`/`cadastrarProfessor`/`entrar` (`shared/auth.js`) falham
com `auth/operation-not-allowed`.

O cadastro pede matrícula (não e-mail), mas o Firebase Auth exige e-mail —
`shared/auth.js` sintetiza um e-mail interno a partir da matrícula + papel
(`matricula@aluno.viva-livro.app` / `matricula@professor.viva-livro.app`),
nunca exibido pro usuário.

#### 3. Rodar localmente

```bash
npm run dev:aluno    # abre http://localhost:8080/aluno/
npm run dev:painel   # abre http://localhost:8081/painel/
```

Os dois scripts servem a partir da **raiz do projeto** (não das subpastas
isoladas) — isso é necessário porque o código usa imports relativos tipo
`../../shared/firebase-config.js`, que só resolvem corretamente quando
`aluno/`, `painel/`, `shared/` e `content/` estão acessíveis a partir da
mesma raiz (igual vai ficar em produção). Se a porta padrão (8080/8081)
estiver ocupada, o live-server avisa no terminal e sobe em outra — só
prestar atenção na mensagem `Serving "..." at http://127.0.0.1:XXXXX`.

Pra ver a landing page (`index.html` na raiz) ou o `admin/` localmente,
não há script dedicado ainda — rodem `npx live-server --ignore=node_modules`
direto na raiz do projeto (mesma lógica: precisa ser servido a partir da
raiz).

**Importante:** acesso à câmera do celular exige HTTPS (ou `localhost`, que
só funciona testando no próprio computador — um IP de rede local tipo
`http://192.168.x.x:8080` não é considerado contexto seguro pelo navegador).
Para testar no celular durante o desenvolvimento, exponham o `dev:aluno`
local via um túnel HTTPS. Usamos o **Cloudflare Tunnel**
(`cloudflared tunnel --url http://localhost:8080`, sem precisar criar
conta) em vez do ngrok, que exige login.

#### 4. Deploy

Hospedado na [Vercel](https://vercel.com) como site estático (sem build —
ver `vercel.json`). `ia/`, `teste`, `node_modules/` e `package-lock.json`
ficam fora do deploy via `.vercelignore`.

Para publicar:

1. Importar o repositório no [dashboard da Vercel](https://vercel.com/new)
   (New Project → conectar o repo `crow1y/Hacktudo`). A Vercel detecta o
   `vercel.json` e não roda build nenhum.
2. Todo push em `main` gera um deploy novo automaticamente em produção;
   pushes em outras branches geram preview deployments.

Fica acessível em:

- `https://<projeto>.vercel.app/` — landing page pública.
- `https://<projeto>.vercel.app/aluno/`
- `https://<projeto>.vercel.app/painel/`
- `https://<projeto>.vercel.app/admin/`

HTTPS já vem ativado por padrão na Vercel — obrigatório pra câmera
funcionar no celular do aluno. Um domínio próprio pode ser adicionado
depois em Project Settings → Domains.

### Schema do `content/animals.json`

- `targetSrc`: um único `.mind` compartilhado por **todos** os animais,
  salvo localmente em `aluno/assets/targets/targets.mind` — compilado
  com todas as imagens-alvo juntas (ferramenta oficial:
  https://hiukim.github.io/mind-ar-js-doc/tools/compile). A ordem de
  upload na hora de compilar define o índice de cada imagem, e **não é
  cumulativa entre compilações**: pra adicionar um alvo novo sem quebrar
  os que já existem, re-suba as imagens-fonte de todos os animais já
  prontos (nas mesmas posições) junto com a nova, e recompile.
- Cada animal tem `targetIndex` (posição dele dentro desse `.mind`
  compartilhado) em vez de um target próprio. Hoje: raposa = 0, elefante
  = 1, leão = 2 — os três já compilados de verdade no mesmo `.mind`.
- `aluno/js/ar.js` filtra (`isAssetReady`) animais cujo `model` ainda
  contém `"TODO"` — eles ficam no JSON normalmente, só não viram alvo de
  AR até o asset real existir (evita travar tentando carregar um arquivo
  inexistente). Hoje nenhum animal está nessa situação (os três reais já
  têm modelo).
- `model`: URL ou caminho pro `.glb`. Caminhos locais devem ser
  **root-relative** (`/aluno/assets/models/...`, com `/` na frente) —
  sem isso, resolvem errado quando usados a partir de páginas dentro de
  `aluno/` (ex: viraria `aluno/aluno/...`).
- `imagem` (opcional): foto ilustrativa usada nos cards do `painel/` —
  não é a imagem-alvo de RA (essa fica binária dentro do `.mind` e não
  dá pra exibir). Pode ter um `_comment_imagemCredito` do lado pra
  documentar a licença/autor de fotos de terceiros.
- `info`: objeto livre, mas os campos que o painel sabe renderizar numa
  ficha estruturada são `nomeCientifico`, `classificacao`, `habitat`,
  `alimentacao`, `tamanho`, `tempoDeVida`, `comportamento` (parágrafo) e
  `curiosidades` (lista) — todos opcionais, o painel só mostra o que
  existir (ver `painel/js/main.js` → `renderDetalhe`).
- `alturaRealMetros`: altura real do animal em pé, em metros — usada só
  pelo modo WebXR (`aluno/js/webxr-mode.js`) pra escala real no chão e
  pro raio de segurança do andar sozinho (respeitando o teto
  `MAX_HEIGHT_METERS = 2`). Não afeta o modo MindAR normal.
- Hoje existem três animais com pipeline de RA completa (`teste-pipeline`
  = raposa, `Fox.glb` do KhronosGroup; `elefante` e `leao`, ambos modelo
  CC Attribution via Sketchfab) — ver `ia/prompts/gerar-modelo-3d.md` e
  `ia/prompts/gerar-conteudo-animais.md` pra adicionar mais espécies.
- **Antes de adicionar um modelo animado novo**, rodar
  `npm run check-model -- caminho/do/modelo.glb` — checa se a hierarquia
  de ossos tem fatores de escala muito desproporcionais entre si (o tipo
  de problema, não o tamanho do arquivo, que já causou um travamento
  intermitente real no modo WebXR — ver CLAUDE.md). Não substitui testar
  no celular, só reduz o risco antes de investir tempo integrando. Se os
  clipes de animação não vierem com os nomes que `aluno/js/webxr-mode.js`
  procura (`Walk`/`Run`/`Survey`), `npm run rename-clips -- modelo.glb
  "NomeAntigo=Walk"` renomeia direto no `.glb`. Processo completo de
  adicionar um animal novo (achar modelo → checar → renomear clipe →
  validar visual → recompilar `targets.mind` → JSON) documentado em
  `CLAUDE.md` → "Como adicionar um animal/modelo 3D novo".
- `assets/img/raposa.jpg`, `assets/img/elefante.jpg` e `assets/img/leao.jpg`
  cumprem dois papéis ao mesmo tempo: são a foto ilustrativa exibida no
  `painel/` **e** a imagem de verdade que a câmera precisa reconhecer pra
  ativar cada animal (compiladas nessas mesmas fotos, nessa ordem, dentro
  de `targets.mind`, via a ferramenta oficial
  https://hiukim.github.io/mind-ar-js-doc/tools/compile). Recompilar
  esse arquivo é obrigatório toda vez que um animal entra/sai — não é
  aditivo, precisa subir as fotos de todos de novo, juntas.

### Firebase Realtime Database — schema

```
session/
  activeAnimal        → string: id do animal ativo (ou null)
```

```
users/
  professores/
    <uid>/  → nome, matricula, cpf, liberado: boolean, criadoEm: number
  alunos/
    <uid>/  → nome, matricula, criadoEm: number
```

Paths vêm de `shared/constants.js` (`DB_PATHS`) — sempre importar de lá,
nunca hardcodear strings soltas nos dois lados (`aluno/` e `painel/`).
`<uid>` é o uid do Firebase Auth (não a matrícula) — sempre resolver o uid
via sessão autenticada (`ouvirSessao`/`ouvirPerfil` em `shared/auth.js`),
nunca assumir que a matrícula em si é a chave.

### Próximos passos (onde continuar)

**Conteúdo (bloqueador pra uso real):**
- [x] Testar múltiplos animais simultâneos de verdade — raposa
      (targetIndex 0) e elefante (targetIndex 1) compiladas juntas no
      mesmo `.mind`, confirmado funcionando.
- [x] Raposa: conteúdo educativo real (ficha completa) + foto real,
      substituindo o texto de "modelo de teste".
- [x] Elefante: modelo 3D animado, com Survey/Walk/Run renomeados a
      partir de 3 dos 28 clipes originais (CC Attribution, Sketchfab) +
      foto real (CC BY-SA 4.0, Wikimedia) + ficha completa — substitui a
      girafa (removida: a hierarquia de ossos dela tinha fatores de
      escala muito desproporcionais entre si, causando travamento
      intermitente no WebXR — ver CLAUDE.md; validado com
      `npm run check-model` antes de integrar). Andar sozinho, correr e
      analógico já funcionam igual a raposa. Os outros 25 clipes originais
      (attack/eating/sleep/death/etc, mantidos sem uso no arquivo) são
      candidatos a uma futura feature de "ações extras aleatórias"
      durante as pausas.
- [x] Leão: modelo 3D animado (glTF original, não convertido de FBX —
      passou limpo em `npm run check-model`) + foto real (CC BY-SA 4.0,
      Wikimedia, foto destacada) + alvo compilado (targetIndex 2) + ficha
      completa. Achado depois de descartar um modelo pago sem licença
      livre e um gratuito com juba visualmente ruim. Só tem 1 clipe de
      animação no arquivo (renomeado pra "Walk" com
      `npm run rename-clips`) — sem um clipe de idle separado, então
      durante as pausas do andar sozinho as pernas continuam em ciclo de
      caminhada; aceito como troca pelo visual bem melhor que as
      alternativas gratuitas.
- [ ] Escolher/gerar as imagens-alvo a partir das páginas reais do livro
      didático (hoje raposa, elefante e leão usam fotos de banco de
      imagem — nenhuma delas é uma página de livro de verdade ainda).
- [ ] Buraco Negro (Física): modelo 3D ("Black hole" da extinta Google
      Poly, CC BY 3.0, baixado direto de static.poly.pizza sem precisar
      de login — o modelo pedido originalmente, do Sketchfab, exige login
      pra baixar mesmo sendo CC BY 4.0 gratuito) + foto real (Event
      Horizon Telescope, primeira foto de um buraco negro já tirada, CC
      BY 4.0) + ficha completa já prontos em `content/animals.json`
      (`materia: "fisica"`). **Falta só recompilar
      `aluno/assets/targets/targets.mind`** incluindo essa foto como 6ª
      imagem, junto com as 5 já compiladas (ver
      `_comment_targetIndexPendente` na entrada `buraco-negro` do JSON
      pra ordem exata) — até lá o card aparece completo no painel, mas
      não é reconhecido pela câmera do aluno (`targetIndex: null`).

**Segurança antes de uso real em sala de aula:**
- [ ] Trocar `ADMIN_ACCESS_CODE` (`shared/constants.js`) pelo valor real —
      continua sendo só uma trava client-side (não é login de verdade),
      as regras abaixo já limitam o dano de alguém adivinhar/vazar esse
      código, mas trocar o valor padrão continua necessário.
- [x] Regras de segurança do Realtime Database escritas em
      `database.rules.json` (**ainda não aplicadas** — precisa colar no
      Firebase Console > Realtime Database > Regras, e publicar; o
      arquivo no repo não é aplicado sozinho, o projeto não tem
      Firebase CLI configurado). Resumo do que elas fazem, e o que
      **ainda** fica aberto de propósito:
  - `users/alunos`: só o próprio aluno lê/escreve seu perfil.
  - `users/professores`: leitura continua aberta pra qualquer um (a tela
    `/admin/` lê a lista inteira sem login — ver limitação do
    `ADMIN_ACCESS_CODE` acima) — **CPF continua exposto** enquanto
    `/admin/` não tiver login de verdade. Escrita é por campo: só o
    próprio professor grava nome/matrícula/cpf/liberado inicial (`false`)
    no cadastro; depois disso, só o campo `liberado` de um professor que
    **já existe** pode ser trocado sem login — mesma limitação de hoje,
    só que restrita a esse único campo em vez do banco inteiro. Isso
    inclui o **próprio professor podendo se auto-aprovar** (chamando a
    escrita direto, não pela UI de `/admin/`) — só fecha de verdade
    quando `/admin/` tiver login real.
  - `presencas`: exige estar logado pra ler. Escrita liberada pro próprio
    aluno (seu próprio registro) ou por qualquer professor com
    `liberado: true` (pra validar `status`) — como não há regra por
    campo aqui, um aluno tecnicamente ainda consegue escrever no próprio
    `status` direto pela API do Firebase (não pela UI) sem passar pelo
    professor; aceito por ora, endurecer isso é trabalho futuro (ver
    `CLAUDE.md`).
  - `session/activeAnimal`: exige estar logado pra ler/escrever.

  **Como aplicar**: Firebase Console > Realtime Database > aba "Regras"
  > colar o conteúdo de `database.rules.json` > Publicar. **Antes de
  publicar**, vale testar no "Playground" da própria aba de Regras
  (não precisa instalar nada) pelo menos:
  - Não autenticado lendo `users/alunos/<qualquer-uid>` → deve **negar**.
  - Não autenticado lendo `users/professores` → deve **permitir**
    (esperado, é o que a tela `/admin/` depende).
  - Autenticado como aluno A escrevendo em
    `presencas/<data>/<uid-do-aluno-B>/status` → deve **negar**.
  - Autenticado como professor com `liberado: true` escrevendo em
    `presencas/<data>/<qualquer-uid>/status` → deve **permitir**.
  - Não autenticado escrevendo `users/professores/<uid-novo>` (que não
    existe ainda) → deve **negar** (não dá pra fabricar professor do
    zero sem login).
  Essas regras não foram testadas contra o banco de verdade nesta sessão
  (sem Firebase CLI/emulador disponível) — só verificadas na leitura do
  código; testar no Playground antes de confiar 100%.

**Painel do professor:**
- [x] Lista de animais trocada de texto simples pra links com foto,
      cada um abrindo uma ficha completa (`painel/js/main.js` →
      `renderLista`/`renderDetalhe`), lendo os campos estruturados de
      `info` no JSON.
- [x] Sincronização em tempo real mantida como "segue automaticamente"
      (badge "🔴 Ativo agora"), sem travar a navegação manual do
      professor pelos outros animais.
- [x] Botão "ver imagem completa" na foto (abre em modal, sem o corte
      do `object-fit: cover` do card) — pensado tanto pra o professor
      ver melhor quanto pra projetar a mesma imagem pra turma escanear.
- [ ] `session/activeAnimal` não limpa sozinho se o aluno fechar a aba
      sem clicar em "Escanear outro" (fica com o último valor pra
      sempre) — daria pra resolver com `onDisconnect()` do Firebase,
      não implementado ainda.

**Landing page:**
- [x] Ilustração real do hero (grupo de alunos, não um aluno sozinho —
      trocada de propósito pra combinar com o discurso de uso em grupo)
      e logo da marca já adicionadas (`assets/img/HeroVivaLivros.jpg`,
      `assets/img/logo-mark.png`).
- [x] **Reposicionamento pós-mentoria**: o discurso da página mudou de
      "olha que tecnologia legal" pra responder de frente 3 pontos que a
      banca levantou — celular na escola (uso pontual, guiado pelo
      professor), quem não tem celular próprio (não precisa de um por
      aluno) e "por que isso e não uma rede social" (descoberta em
      grupo, não feed infinito). Isso aparece em vários pontos da
      página (hero, carrossel, seção nova "Feito pra ser vivido em
      grupo"), não só num bloco isolado — de propósito, pra não parecer
      remendo. Público declarado: crianças e adolescentes, sem excluir
      quem mais gostar.
- [x] Seção "Quem apoia esse projeto" (logos placeholder) virou "Nos
      apoie" — formas concretas de ajudar (escola parceira, apoio
      financeiro, divulgação) em vez de placeholders de patrocinador
      inexistente.
- [ ] Ícones/ilustrações do carrossel ainda são `.img-placeholder`
      (exceto o slide de descoberta em grupo, que já reaproveita o
      ícone de sorriso existente).
- [x] Texto da landing page corrigido: não menciona mais "check-in de
      presença" (a feature foi removida do app antes, mas o texto de
      marketing tinha ficado pra trás).
- [ ] QA visual em todos os apps (mobile e desktop) — revisão até agora
      foi maior no fluxo do aluno (AR/WebXR) e no hero/logo da landing
      page.

**Débito técnico pequeno:**
- [ ] Console de debug **Eruda**, carregado em `aluno/index.html`
      (marcado `TEMPORÁRIO` no HTML) — decidir se remove ou mantém como
      ferramenta de debug permanente pra quando não há cabo USB-C
      disponível pra inspecionar o celular.

**Se sobrar tempo:**
- [ ] Mais matérias/subtópicos no painel (hoje só Ciências existe).
- [ ] Histórico de uso por aluno/turma.
- [ ] Estatísticas mais elaboradas no painel.

### Divisão de trabalho sugerida

Como a separação `aluno/` vs `painel/` é limpa, cada pessoa do time pode
tocar um lado sem conflitar com o outro — uma na pipeline de RA
(`aluno/js/ar.js`, `aluno/js/webxr-mode.js` e assets), outra no menu de
matérias do painel + conteúdo (`painel/js/main.js`,
`content/animals.json`). Só cuidado ao mexer em `shared/constants.js`,
que é compartilhado (avisem um ao outro antes de mudar nomes de paths
ali), e em `content/animals.json`, onde os ids dos animais precisam
bater entre quem gera o target/model e quem escreve o conteúdo
didático.
