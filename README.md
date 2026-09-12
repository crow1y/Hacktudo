# Professor de Realidade Virtual — Hacktudo

Aluno aponta a câmera do celular pra uma imagem de animal em um livro
didático de biologia → um modelo 3D animado "sai" do livro via Web AR
(sem instalar app). Em paralelo, um painel web no computador/projetor do
professor mostra em tempo real qual animal foi ativado e informações
didáticas sobre ele para a turma toda.

## Stack

- **AR / reconhecimento de imagem**: MindAR + Three.js (ou A-Frame) — roda
  100% no navegador do celular do aluno.
- **Sincronização em tempo real**: Firebase Realtime Database — client-side
  puro, sem servidor próprio pra manter.
- **Hospedagem**: estática, na Hostinger, com HTTPS.

## Estrutura do projeto

```
aluno/     → app que roda no celular (câmera, AR, camada de uso consciente)
painel/    → app que roda no computador/projetor do professor
shared/    → config do Firebase + constantes usadas pelos dois lados
content/   → dados didáticos dos animais (JSON), sem lógica
```

Veja os comentários `TODO` dentro de cada arquivo — eles marcam exatamente
onde cada parte da implementação entra.

## Setup

### 1. Instalar dependências (só o servidor de dev local)

```bash
npm install
```

### 2. Criar o projeto no Firebase

1. Acesse https://console.firebase.google.com e crie um projeto.
2. Ative o **Realtime Database** (modo de teste está OK para o hackathon —
   lembrem de restringir as regras se sobrar tempo).
3. Em "Configurações do projeto > Seus apps", crie um app Web e copie o
   objeto de config.
4. Cole os valores em `shared/firebase-config.js` (substitua os `"TODO"`).

### 3. Rodar localmente

```bash
npm run dev:aluno    # http://localhost:8080
npm run dev:painel   # http://localhost:8081
```

**Importante:** acesso à câmera do celular exige HTTPS (ou `localhost`, que
só funciona testando no próprio computador). Para testar no celular durante
o desenvolvimento, exponham o `dev:aluno` local via um túnel HTTPS (ex:
`ngrok http 8080`) até fazer o deploy real na Hostinger.

### 4. Deploy

Subir `aluno/` e `painel/` como sites estáticos na Hostinger (cada um pode
ser um subdomínio ou subpasta, ex: `seudominio.com/aluno` e
`seudominio.com/painel`). Não esquecer que `shared/` e `content/` também
precisam estar acessíveis a partir dos caminhos relativos usados nos
imports (`../../shared/...`) — ou seja, subam a raiz do projeto inteira,
não só as pastas `aluno/` e `painel/` isoladas.

## Próximos passos (onde continuar)

**Núcleo obrigatório do MVP:**
- [ ] Escolher/gerar as imagens-alvo (`.mind` files do MindAR) a partir das
      páginas do livro didático que vão ser usadas.
- [ ] Conseguir/gerar os modelos 3D animados (`.glb`) dos animais.
- [ ] Implementar `aluno/js/ar.js`: setup do MindAR, carregar target/model
      por animal (via `content/animals.json`), exibir o modelo ao detectar
      o alvo.
- [ ] Ao detectar um animal, escrever o id em `DB_PATHS.activeAnimal` no
      Firebase (`aluno/js/ar.js`).
- [ ] Implementar `painel/js/main.js`: buscar `content/animals.json`,
      cruzar com o id recebido do Firebase, renderizar as infos didáticas
      em `#animal-info`.
- [ ] Preencher `content/animals.json` com os animais reais do
      livro/turma (nome, comportamento, curiosidades, paths dos assets).
- [ ] Definir e configurar as regras de segurança do Firebase Realtime
      Database antes de usar em sala de aula de verdade.

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
mudar nomes de paths ali).
