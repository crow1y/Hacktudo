# Professor de Realidade Virtual — Hacktudo

Aluno aponta a câmera do celular pra uma imagem de animal em um livro
didático de biologia → um modelo 3D animado "sai" do livro via Web AR
(sem instalar app). Em paralelo, um painel web no computador/projetor do
professor mostra em tempo real qual animal foi ativado e informações
didáticas sobre ele para a turma toda.

## Stack

- **AR / reconhecimento de imagem**: MindAR + A-Frame — roda 100% no
  navegador do celular do aluno.
- **Sincronização em tempo real**: Firebase Realtime Database — client-side
  puro, sem servidor próprio pra manter.
- **Login/cadastro**: Firebase Authentication (matrícula + senha), client-side
  puro.
- **Hospedagem**: estática, na Vercel, com HTTPS automático.

## Estrutura do projeto

```
aluno/     → app que roda no celular (login/cadastro, câmera, AR, camada de uso consciente)
painel/    → app que roda no computador/projetor do professor (login/cadastro + dashboard)
admin/     → tela do dono do sistema pra liberar o acesso de professores cadastrados
shared/    → config do Firebase, auth, validadores e constantes usadas pelos dois lados
content/   → dados didáticos dos animais (JSON), sem lógica
ia/        → contexto do projeto e prompts prontos para ferramentas de IA
```

Veja os comentários `TODO` dentro de cada arquivo — eles marcam exatamente
onde cada parte da implementação entra.

## Setup

### 1. Instalar dependências (só o servidor de dev local)

```bash
npm install
```

### 2. Firebase

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

### 3. Rodar localmente

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

**Importante:** acesso à câmera do celular exige HTTPS (ou `localhost`, que
só funciona testando no próprio computador — um IP de rede local tipo
`http://192.168.x.x:8080` não é considerado contexto seguro pelo navegador).
Para testar no celular durante o desenvolvimento, exponham o `dev:aluno`
local via um túnel HTTPS (ex: `ngrok http 8080`) até fazer o deploy real na
Vercel.

### 4. Deploy

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

- `https://<projeto>.vercel.app/aluno/`
- `https://<projeto>.vercel.app/painel/`

HTTPS já vem ativado por padrão na Vercel — obrigatório pra câmera
funcionar no celular do aluno. Um domínio próprio pode ser adicionado
depois em Project Settings → Domains.

## Próximos passos (onde continuar)

**Núcleo obrigatório do MVP:**
- [x] Configurar o Firebase Realtime Database (projeto `viva-livro`, regras
      abertas para o hackathon).
- [x] Implementar `painel/js/main.js`: busca `content/animals.json`, escuta
      o Firebase e renderiza `#animal-info` + agregação de humor em tempo
      real. Testado ponta a ponta.
- [x] Implementar `aluno/js/ar.js`: MindAR + A-Frame, carrega target/model
      do primeiro animal de `content/animals.json`, escreve o id em
      `DB_PATHS.activeAnimal` ao detectar/perder o alvo. **Hoje ainda usa
      um alvo e modelo de exemplo públicos** (entrada `teste-pipeline` em
      `content/animals.json`) só para validar a pipeline — testado no
      navegador (scripts, Firebase e download do modelo confirmados
      funcionando; falta testar detecção de imagem num celular/webcam
      real, que a automação de teste não tem).
- [ ] Escolher/gerar as imagens-alvo (`.mind` files do MindAR) a partir das
      páginas reais do livro didático.
- [ ] Conseguir/gerar os modelos 3D animados (`.glb`) reais dos animais —
      ver `ia/prompts/gerar-modelo-3d.md`. Ao ter os assets do leão
      prontos, preencher `target`/`model` na entrada `exemplo-leao` de
      `content/animals.json` e remover (ou mover para depois) a entrada
      `teste-pipeline` — `aluno/js/ar.js` sempre usa o primeiro item da
      lista.
- [ ] Testar a detecção de imagem de verdade num celular (via `ngrok http
      8080` ou já no deploy da Vercel).
- [ ] Ajustar posição/escala do modelo 3D em `aluno/js/ar.js` visualmente
      (o valor atual, `scale="0.05 0.05 0.05"`, é um chute inicial).
- [ ] Preencher `content/animals.json` com os demais animais reais do
      livro/turma (usar `ia/prompts/gerar-conteudo-animais.md`).
- [ ] Definir e configurar as regras de segurança do Firebase Realtime
      Database antes de usar em sala de aula de verdade (hoje está
      totalmente aberto, incluindo os nós `users/professores` e
      `users/alunos` criados pelo login/cadastro).
- [ ] Suporte a múltiplos alvos simultâneos: hoje só o primeiro animal do
      JSON vira alvo de AR. Múltiplos animais ao mesmo tempo exigem
      compilar todas as imagens num único `.mind` e mapear `targetIndex`
      → id do animal em `aluno/js/ar.js`.

**Login / cadastro / hierarquia:**
- [x] Cadastro e login por matrícula/senha (Firebase Authentication) em
      `aluno/` e `painel/`, com validação de senha (mínimo 8 caracteres,
      maiúscula, minúscula, número e caractere especial) em
      `shared/validators.js`.
- [x] Cadastro de professor pede Nome, Matrícula e CPF (com validação de
      dígito verificador) além da senha; conta nasce com `liberado: false`.
- [x] Tela "Aguardando liberação de conteúdos" no painel enquanto
      `liberado` for `false` — atualiza em tempo real quando o admin libera.
- [x] `admin/`: tela do dono do sistema pra liberar/revogar professores
      (gate por código fixo em `ADMIN_ACCESS_CODE`, `shared/constants.js`
      — **trocar esse código antes de uso real**, é só uma trava contra
      cliques acidentais, não segurança de verdade).
- [x] Sessão não persiste entre fechamentos do navegador
      (`browserSessionPersistence` em `shared/auth.js`) — aluno/professor
      precisa logar de novo com matrícula/senha a cada nova sessão do
      navegador.
- [ ] Trocar `ADMIN_ACCESS_CODE` pelo valor real antes do hackathon/demo.

**Camada de saúde mental / uso consciente:**
- [x] Implementar `aluno/js/session-timer.js`: contagem do "modo aula",
      lembrete de pausa/respiração ao atingir `MODO_AULA_DURATION_MS`,
      check-in de humor no fim do módulo.
- [x] Escrever os check-ins de humor em `DB_PATHS.moodCheckins`.
- [x] Implementar a agregação de humor da turma em `painel/js/main.js`
      (`#mood-summary`).
- [x] Decidir e implementar a UI real de `#modo-aula-timer`,
      `#pausa-lembrete` e `#mood-checkin`.

**Se sobrar tempo:**
- [ ] Suporte a múltiplos animais/matérias simultâneos.
- [ ] Histórico de uso por aluno/turma.
- [ ] Estatísticas mais elaboradas no painel.

## Divisão de trabalho sugerida

Como a separação `aluno/` vs `painel/` é limpa, cada pessoa do time pode
tocar um lado sem conflitar com o outro — só cuidado ao mexer em
`shared/constants.js`, que é compartilhado (avisem um ao outro antes de
mudar nomes de paths ali), e em `content/animals.json`, onde os ids dos
animais precisam bater entre quem gera o target/model e quem escreve o
conteúdo didático.
