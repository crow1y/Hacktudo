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
};

// Valores possíveis do check-in de humor rápido no fim do módulo.
export const MOOD_VALUES = ["otimo", "bem", "cansado", "confuso"];

// Duração padrão (ms) de um módulo de "modo aula" antes do lembrete de pausa.
export const MODO_AULA_DURATION_MS = 15 * 60 * 1000;
