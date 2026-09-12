# Prompt: gerar conteúdo didático dos animais

Use este prompt em qualquer LLM (Claude, ChatGPT, etc.) pra gerar o
conteúdo de `content/animals.json` rapidamente. Troque a lista de animais
pelos que vocês realmente vão usar na aula, cole a resposta direto no
JSON e depois só preencha os campos `target` e `model` com os paths reais
dos assets.

---

```
Você vai gerar conteúdo didático para um app de realidade aumentada
educacional voltado a alunos do ensino básico em aulas de biologia.

Para cada animal da lista abaixo, gere um objeto JSON seguindo EXATAMENTE
este schema (sem campos extras, sem comentários):

{
  "id": "kebab-case-sem-acento",
  "nome": "Nome popular em português",
  "target": "aluno/assets/targets/TODO.mind",
  "model": "aluno/assets/models/TODO.glb",
  "info": {
    "comportamento": "2-3 frases sobre comportamento e habitat, em linguagem simples para adolescentes",
    "curiosidades": ["3 a 5 curiosidades curtas, uma por item, factualmente corretas e interessantes para engajar a turma"]
  }
}

Retorne todos os objetos dentro de um array JSON válido, pronto para
colar no campo "animals" de content/animals.json.

Animais: [SUBSTITUA PELA LISTA REAL, ex: onça-pintada, tartaruga-marinha, arara-azul]
```

---

**Depois de colar o resultado:** confira os fatos gerados (LLMs erram
detalhes biológicos às vezes) antes de usar em sala de aula de verdade.
