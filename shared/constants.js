// Vocabulário compartilhado entre aluno/ e painel/.
// Qualquer nome de path ou valor de enum usado dos dois lados vive aqui,
// para os dois nunca divergirem (ex: um lado escrevendo "animalId" e o
// outro lendo "animal_id").

// Paths no Realtime Database.
export const DB_PATHS = {
  // Qual animal está ativo no momento (aluno escreve, painel escuta).
  activeAnimal: "session/activeAnimal",
  // Check-ins de humor da turma (aluno escreve um por sessão, painel agrega).
  moodCheckins: "session/moodCheckins",
  // Perfis de conta, indexados por uid do Firebase Auth.
  professores: "users/professores",
  alunos: "users/alunos",
};

// Papéis de conta suportados pelo cadastro/login.
export const ROLES = {
  PROFESSOR: "professor",
  ALUNO: "aluno",
};

// Sufixo de e-mail sintético usado para autenticar por matrícula no Firebase
// Auth (que exige e-mail/senha) — namespaced por papel pra um professor e um
// aluno poderem usar a mesma matrícula sem colidir.
export const AUTH_EMAIL_SUFFIX = {
  [ROLES.PROFESSOR]: "@professor.viva-livro.app",
  [ROLES.ALUNO]: "@aluno.viva-livro.app",
};

// Código de acesso da tela /admin/ que libera professores cadastrados.
// Isso NÃO é segurança de verdade (é uma string visível no bundle do
// navegador, igual as regras do Realtime Database hoje abertas) — é só uma
// trava contra cliques acidentais durante o hackathon. Troquem antes de
// qualquer uso real em sala de aula, junto com o hardening das regras do
// Realtime Database (ver pendência no README).
export const ADMIN_ACCESS_CODE = "vivalivro-admin-2026";

// Valores possíveis do check-in de humor rápido no fim do módulo.
export const MOOD_VALUES = ["otimo", "bem", "cansado", "confuso"];

// Label exibido (aluno/ na hora de escolher, painel/ na hora de agregar).
export const MOOD_LABELS = {
  otimo: "😄 Ótimo",
  bem: "🙂 Bem",
  cansado: "😴 Cansado",
  confuso: "😕 Confuso",
};

// Duração padrão (ms) de um módulo de "modo aula" antes do lembrete de pausa.
export const MODO_AULA_DURATION_MS = 15 * 60 * 1000;
