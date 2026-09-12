// Vocabulário compartilhado entre aluno/ e painel/.
// Qualquer nome de path ou valor de enum usado dos dois lados vive aqui,
// para os dois nunca divergirem (ex: um lado escrevendo "animalId" e o
// outro lendo "animal_id").

// Paths no Realtime Database.
export const DB_PATHS = {
  // Qual animal está ativo no momento (aluno escreve, painel escuta).
  activeAnimal: "session/activeAnimal",
  // Perfis de conta, indexados por uid do Firebase Auth.
  professores: "users/professores",
  alunos: "users/alunos",
  // Presença por dia: presencas/<AAAA-MM-DD>/<uid>. Aluno escreve
  // (entrada/tempo em aula), professor só lê e atualiza `status`.
  presencas: "presencas",
};

// Papéis de conta suportados pelo cadastro/login.
export const ROLES = {
  PROFESSOR: "professor",
  ALUNO: "aluno",
};

// Status de validação de uma presença — o aluno sempre entra como
// PENDENTE; só o professor muda pra CONFIRMADA/REJEITADA no painel.
export const PRESENCA_STATUS = {
  PENDENTE: "pendente",
  CONFIRMADA: "confirmada",
  REJEITADA: "rejeitada",
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
