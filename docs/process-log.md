# Registro do processo: como um projeto novo é planejado

Este arquivo guarda o **método**, não as decisões do Coursary (essas ficam em `PLANNING.md`). Ele é a matéria-prima de uma futura skill de "quero criar um projeto novo": cada etapa diz o objetivo, o que precisa estar fechado antes, as perguntas genéricas (com o exemplo do Coursary), as skills que alimentam a etapa, quando pular ou adaptar, e as lições.

Atualizado ao fim de cada história do Épico 0.

## Regras que valem em todas as etapas

- **Grilling em rodadas.** Cada rodada traz só as perguntas cujos pré-requisitos já estão fechados, numeradas e com uma recomendação. Perguntas que dependem de outra aberta ficam para a rodada seguinte.
- **Ler as skills antes de recomendar.** Fatos (o que existe no ambiente, o que uma skill diz) são trabalho do assistente; decisões são do dono do projeto.
- **Discutir antes de criar.** Nada de arquivo, tarefa ou página sem pedido explícito.
- **Commits pequenos.** Cada decisão fechada entra no documento de planejamento em um commit, com push. O histórico do git é o registro do projeto.
- **Princípios valem mais que recomendações.** Quando o dono declara um princípio (no Coursary: "a aplicação é a fonte da verdade"), registrá-lo como decisão e reabrir as decisões que ele contradiz.

## Etapa 1: objetivo, domínio e superfície

- **Objetivo**: saber por que o projeto existe e como se mede o sucesso.
- **Pré-requisitos**: nenhum.
- **Perguntas**: qual é o objetivo (produto, estudo, prova de conceito)? Qual é o domínio, e por que não outro? Qual é a superfície (só API, API e front, CLI)? Onde roda (local, nuvem real)? Qual é o tamanho e como se divide em entregas? Precisa de autenticação de verdade?
  - *Coursary*: campo de prova das skills; plataforma de cursos (e-commerce descartado por ser o exemplo das próprias skills); API em Lambda; deploy real na AWS; algumas semanas em fases; auth real.
- **Skills**: nenhuma específica. `choosing-rendering-strategy` e `hosting-static-frontends` se houver front.
- **Adaptar**: um projeto que é produto mede sucesso por uso, não por cobertura de skills.
- **Lição**: escolher um domínio que não seja o exemplo das skills evita copiar o exemplo em vez de aplicar a skill.

## Etapa 2: domínio, atores e padrões de acesso iniciais

- **Objetivo**: entidades, atores, ciclos de vida e uma primeira lista de padrões de acesso.
- **Pré-requisitos**: etapa 1.
- **Perguntas**: quem são os atores e o que cada um faz? Qual é a hierarquia das entidades? Que estados uma entidade atravessa? O que fica de fora? Quais leituras cada tela ou rota faz?
  - *Coursary*: aluno, instrutor e admin; Curso → Módulo → Aula; rascunho → publicado → arquivado; 15 padrões de acesso.
- **Skills**: `defining-access-patterns`, `dynamodb-single-table-design`.
- **Lição**: a lista de padrões é revisada na modelagem (etapa 7), depois que o escopo final é conhecido.

## Etapa 3: projeto de referência

- **Objetivo**: decidir se parte de um projeto existente e o que se traz, corrige ou deixa.
- **Pré-requisitos**: etapa 1.
- **Perguntas**: existe um projeto anterior com a mesma stack? O que se reaproveita? Que defeitos dele não podem entrar?
  - *Coursary*: foodiary lido por inteiro; listas "Trazer", "Corrigir na entrada" e "Não trazer".
- **Lição**: confiar no código do projeto de referência, não na documentação dele, que estava defasada.

## Etapa 4: escopo cruzado com as skills instaladas

- **Objetivo**: descobrir o que as skills disponíveis permitem acrescentar ao que já foi combinado.
- **Pré-requisitos**: etapas 1 e 2.
- **Como**: listar as skills instaladas, agrupar por área, e para cada área propor uma funcionalidade real do domínio que a exercite. Marcar as que não encaixam (outra stack) e as que contradizem decisões fechadas.
  - *Coursary*: S3 (capa do curso com sharp, consistência do upload com TTL, CSV), SQS (fila entre o stream e os efeitos), Resend, rotas de admin, frontend, branded types e template literal types. Ficaram fora Next.js, Auth.js, Prisma e busca dentro do DynamoDB.
- **Lição**: as propostas reabrem decisões antigas (no Coursary, "fora: upload" e "só backend"). Listar explicitamente quais.

## Etapa 5: fases

- **Objetivo**: ordenar o escopo em fases entregáveis sozinhas.
- **Pré-requisitos**: etapa 4.
- **Perguntas**: o que entra em cada fase? O que é opcional? Qual é a ordem de dependência?
  - *Coursary*: 6 fases mais um grupo opcional (`PLANNING.md`, Q27).

## Etapa 6: onde ficam as tarefas e o template

- **Objetivo**: decidir a ferramenta e o formato das tarefas.
- **Pré-requisitos**: etapa 5.
- **Perguntas**: onde ficam (Jira, Notion, página do claude.ai, arquivo)? Qual é a hierarquia (épico → história → sub-imp)? Que campos toda história tem?
  - *Coursary*: página do claude.ai com banco de dados; história = entrega visível pela API; sub-imp por camada; campos fase, padrões de acesso, skills (label), critério de pronto; seção "Achados sobre a skill" (Q28, Q29).
- **Lições**:
  - Se o conector do Jira é da conta da empresa, não criar projeto pessoal nele.
  - **Não criar as tarefas das fases antes da modelagem**: elas nasceriam desatualizadas. Primeiro um épico de planejamento (Épico 0) com histórias de decisão.
  - Padrões do projeto (lint, commitlint, CI) entram como uma história de decisão do Épico 0 e como a primeira história de implementação da fase 1.

## Etapa 7: identidade e papéis (em andamento)

- **Objetivo**: decidir quem é o usuário para a aplicação, como se cadastra e como o papel é verificado.
- **Pré-requisitos**: etapas 2 e 4. Vem **antes** da modelagem, porque mexe na entidade de usuário e nos padrões de acesso dela.
- **Perguntas**: qual é o id do usuário (o do provedor ou um próprio)? Onde vive a unicidade do e-mail? Quando nasce o registro do usuário e o que acontece com contas não confirmadas? Como se confirma o cadastro? Quanto dura o token? Onde vive o papel e quanto tempo ele pode ficar desatualizado? Quem envia os e-mails de autenticação?
  - *Coursary*: ver Q32 a Q40 e Q20 em `PLANNING.md`.
- **Skills**: `cognito-user-pools`, `cognito-user-pool-iac`, `cognito-sign-up-and-confirmation`, `cognito-sign-in-and-refresh-tokens`, `cognito-user-groups`, `cognito-role-in-custom-attribute`, `cognito-role-based-route-protection`, `cognito-custom-message-lambda-trigger`, `dynamodb-time-to-live`.
- **Lições**:
  - Uma recomendação feita antes das skills existirem (Q20) mudou quando elas apareceram, e mudou de novo quando o dono declarou o princípio da fonte da verdade. **Perguntar pelos princípios do dono antes das perguntas de identidade**: "o provedor de identidade pode ser trocado?", "quem é a fonte da verdade?".
  - As skills tendem a recomendar o recurso do provedor (grupos, unicidade do Cognito). Pesar isso contra o acoplamento que o dono aceita.

## Etapas seguintes (ainda não percorridas)

8. Modelagem de dados: ERD → lista de padrões de acesso → quadro de entidades (PK/SK) → GSIs → desnormalização e contadores → validação.
9. Arquitetura de execução.
10. Registro de achados e critério de pronto.
11. Padrões do projeto.
12. Criar as tarefas.
