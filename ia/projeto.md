# Professor de Realidade Virtual — contexto do projeto

> Documento de referência para colar em ferramentas de IA (geração de
> modelos 3D, imagens, texto de pitch, etc.) sem precisar reexplicar o
> projeto do zero toda vez. Mantenha atualizado conforme decisões mudarem.

## O que é

Hackathon: Hacktudo. Um "professor de realidade virtual" educacional para
aulas de biologia no ensino básico.

- O aluno aponta a câmera do celular para uma imagem de um animal em um
  livro didático de biologia.
- Um modelo 3D animado desse animal aparece "saindo" do livro, via Web AR
  (sem instalar nenhum app — funciona direto no navegador).
- Ao mesmo tempo, um painel web separado, aberto no computador/projetor do
  professor, recebe em tempo real qual animal foi ativado e mostra
  informações didáticas sobre ele (comportamento, curiosidades) para a
  turma toda ver.

## Diferencial (tema do hackathon: uso consciente de tecnologia)

Além do núcleo de AR, o app do aluno tem uma camada de "uso consciente":
- Timer de "modo aula", mostrando quanto tempo o aluno usou o celular com
  propósito educacional (não é tempo de tela recreativo).
- Lembrete de pausa/respiração entre módulos.
- Check-in rápido de humor no fim da aula, que o professor vê agregado no
  painel (visão geral do estado emocional da turma, não individual).

## Stack

- **AR / reconhecimento de imagem**: MindAR + Three.js (ou A-Frame),
  rodando 100% no navegador do celular do aluno. Sem instalação de app.
- **Sincronização em tempo real**: Firebase Realtime Database. Escolhido
  por ser client-side puro (sem servidor próprio pra manter) e ter setup
  rápido — decisivo com só ~40h de hackathon e hospedagem estática.
- **Hospedagem**: estática, na Vercel, com HTTPS automático.

Time: 2 pessoas, sem experiência prévia em Unity (por isso a escolha de
Web AR em vez de app nativo), com boa experiência em desenvolvimento web.

## Estrutura do repositório

```
aluno/     → app que roda no celular (câmera, AR, camada de uso consciente)
painel/    → app que roda no computador/projetor do professor
shared/    → config do Firebase + constantes usadas pelos dois lados
content/   → dados didáticos dos animais (JSON), sem lógica
ia/        → este arquivo e outros materiais de apoio para uso com IA
```

Ver `README.md` na raiz para instruções de setup e checklist de próximos
passos técnicos.

## Escopo do MVP

**Núcleo (obrigatório):** professor escolhe um tópico → aluno vê o modelo
em RA no celular, sincronizado em tempo real com o painel.

**Camada de saúde mental / uso consciente:** timer de modo aula + lembrete
de pausa/respiração + check-in de humor agregado no painel.

**Só se sobrar tempo:** mais de um modelo/matéria, histórico de uso,
estatísticas mais elaboradas.

## Status atual

Estrutura de pastas e arquivos base criada (scaffold), sem imagens-alvo,
sem modelos 3D ainda, sem lógica de AR implementada. Ver `README.md` para
o checklist detalhado do que falta.
