# Coursary: planejamento (sessão de grilling em andamento)

Última atualização: 2026-10-14. Estado: **Épico 0 fechado; quadro criado; próxima: história 1.0 (discutir as sub-imp antes de codar)**. As skills de Cognito e TypeScript já existem.

## Como retomar

Abra o Claude Code e diga:

> Leia `/home/joao/projects/coursary/PLANNING.md` e continue o grilling (`/mattpocock-skills:grilling`) do ponto em que paramos.

Ao retomar, o assistente deve:

1. Ler a seção "Épico 0" e ver qual história de planejamento está aberta.
2. Ler as skills que essa história cita antes de perguntar.
3. Não refazer perguntas já fechadas.

Nada foi implementado ainda. Cada decisão fechada entra neste arquivo em um commit pequeno.

## O projeto em uma frase

Uma API serverless de plataforma de cursos (Lambda + DynamoDB single-table), cujo critério de sucesso é: cada skill de DynamoDB instalada foi usada pelo menos uma vez em um caso real, e anotamos onde a skill errou ou faltou.

## Decisões fechadas

### Raiz

| # | Decisão | Resposta |
|---|---|---|
| Q1 | Objetivo | Campo de prova das skills, com aprendizado prático de DynamoDB. Achados sobre as skills retroalimentam o repositório de skills. |
| Q2 | Domínio | Plataforma de cursos. E-commerce descartado por ser o exemplo provável das próprias skills. |
| Q3 | Superfície | Backend (API HTTP em Lambda, Serverless Framework) primeiro. *O frontend `web` entrou como fase 5 na Q27.* |
| Q4 | Onde roda | Deploy real na AWS, on-demand. Sem API rodando local. |
| Q5 | Tamanho | Algumas semanas, em fases entregáveis sozinhas. *A lista de fases foi substituída pela Q27.* |
| Q6 | Autenticação | Sim, autenticação de verdade, com o foodiary como modelo. |

### Domínio

| # | Decisão | Resposta |
|---|---|---|
| Q7 | Atores | Aluno, instrutor e admin. |
| Q8 | Hierarquia | Curso → Módulo → Aula (sort key hierárquica; curso inteiro em uma query). |
| Q9 | Progresso | Um item por aula concluída + contador de aulas concluídas na matrícula. Create único com `attribute_not_exists`, `ADD` atômico, os dois em transação. |
| Q10 | Ciclo de vida do curso | Rascunho → publicado → arquivado. Catálogo como índice esparso (só publicados têm a chave do GSI). O filtro do stream só indexa publicados e remove ao arquivar. |
| Q11 | Extras | Só avaliações (nota e comentário, com média e contagem precomputadas no curso), na fase de desnormalização. Fora: certificado, pagamento. *Upload entrou na Q27 (capa do curso na fase 4, vídeo como opcional).* |
| Q12 | Busca | Só Algolia (plano gratuito), alimentado pelo stream da tabela. Sem fase de busca dentro do DynamoDB. |
| Q21 | Papéis na prática | Todo mundo nasce aluno. O admin promove a instrutor, lista usuários e arquiva qualquer curso. O primeiro admin é criado por script. |
| Q23 | Cancelar matrícula | Apaga a matrícula e o progresso e decrementa o contador de alunos, em transação. A avaliação fica. |
| Q24 | Curso publicado | Pode acrescentar aulas, não pode remover. O curso guarda o total de aulas (contador); o percentual é calculado na leitura, nunca gravado. |

### Padrões de acesso (Q22, confirmados)

| # | Padrão | Quem |
|---|---|---|
| 1 | Buscar conta por id / por e-mail | sistema |
| 2 | Listar usuários (paginado), filtrar por papel | admin |
| 3 | Criar, editar, publicar, arquivar curso | instrutor |
| 4 | Listar cursos de um instrutor (todos os estados) | instrutor |
| 5 | Catálogo: cursos publicados, mais recentes primeiro (paginado) | público |
| 6 | Curso completo: curso + módulos + aulas em uma leitura | público |
| 7 | Criar, editar, reordenar módulos e aulas | instrutor |
| 8 | Matricular-se / cancelar matrícula | aluno |
| 9 | Minhas matrículas, com título do curso e progresso | aluno |
| 10 | Alunos matriculados em um curso (paginado) | instrutor |
| 11 | Marcar aula como concluída (uma vez só) | aluno |
| 12 | Meu progresso em um curso: quais aulas concluí | aluno |
| 13 | Avaliar curso (uma avaliação por matrícula), editar | aluno |
| 14 | Avaliações de um curso, mais recentes primeiro (paginado) | público |
| 15 | Buscar cursos por texto | público (Algolia) |

Os padrões 5 e 6 são públicos (sem login) de propósito: rotas sem authorizer ao lado das privadas.

Entidades que saem daí: Account, Course, Module, Lesson, Enrollment, LessonProgress, Review, e o item de unicidade de e-mail.

### Arquitetura

| # | Decisão | Resposta |
|---|---|---|
| Q13 | Ponto de partida | Projeto novo, trazendo do foodiary só as peças reutilizáveis e corrigindo os defeitos na entrada (lista abaixo). |
| Q14 | Container DI | Portas como **classes abstratas** (existem em runtime, aparecem em `design:paramtypes`). O container ganha `bind(Abstrata, Concreta)`. Use cases dependem da abstrata; testes passam fake em memória pelo construtor. `application` deixa de importar `infra`. |
| Q15 | Lado de leitura | Mantém a separação escrita (repositórios) / leitura (classes de query que devolvem DTOs), mas as queries também ficam atrás de porta abstrata, com implementação Dynamo em `infra`. |
| Q16/Q19 | Testes | Unitários de use cases e entidades com fakes em memória; unitários dos `*Item` (chaves e mapeamento ida e volta); integração de repositórios e queries contra **DynamoDB Local em Docker** (Vitest sobe a tabela, roda, derruba). Sem `serverless-offline`, sem autenticação simulada. Docker 29.9.0 já está instalado e rodando. |
| Q17 | Escopo da auth | Tudo como no foodiary: sign-up, sign-in, refresh, recuperação de senha com SES e template React Email. *Revisar quando as skills de Cognito existirem.* |
| Q18 | Unicidade de e-mail | Item `EMAIL#<email>` gravado na mesma transação do sign-up com `attribute_not_exists`; erro de duplicidade do Cognito mapeado para 409. |
| Q25 | Infra AWS | Mesma conta e região do foodiary (`sa-east-1`), reaproveitando a identidade SES. Sem domínio customizado no início; trazer o `CustomDomain.yml` condicional para ligar depois. |
| Q26 | Nome e local | `coursary`. *O local mudou com a Q102 (repositórios separados).* |

### Sessão de 2026-10-14

| # | Decisão | Resposta |
|---|---|---|
| Q27 | Escopo e fases (história PLAN-1) | Todas as propostas das novas skills entram, nas fases abaixo. |
| Q28 | Onde ficam as tarefas | Em uma página do claude.ai com banco de dados próprio, no formato do Jira (épico → história → sub-imp). Não no Jira nem no Notion. Quadro: https://claude.ai/artifact/2Q6GjZ5cPXusYktJJw4LNj (privado). |
| Q29 | Template das tarefas | História = entrega visível pela API. Sub-imp por camada (`*Item` e chaves, repositório/query, use case, controller e rota, IaC, testes). Campos: fase, padrões de acesso, skills (uma label por skill), critério de pronto. Toda sub-imp tem a seção "Achados sobre a skill". Um épico por fase, com vínculos "bloqueia" entre histórias. |
| Q30 | Padrões do projeto | Viram a história PLAN-6 (decisão) e a história 1.0 (esqueleto do repositório, primeira da fase 1). |
| Q31 | Registro | Toda decisão fechada entra neste arquivo em um commit pequeno. |
| Q38 | **Princípio: a aplicação é a fonte da verdade** | Identidade, unicidade e regras vivem na aplicação e no DynamoDB. Serviços externos (Cognito, SES, Algolia) ficam atrás de portas e podem ser trocados sem mudar o domínio. Toda decisão passa por este filtro. |
| Q32 | Identidade | `internalId` próprio (KSUID), gravado como `custom:internalId` no Cognito e posto no access token pelo trigger de pre token. O `sub` fica só como `externalId`. |
| Q18 | Unicidade de e-mail (confirmada pela Q38) | Item `EMAIL#<email>` com `attribute_not_exists`, na mesma transação do Account. A unicidade do Cognito é uma segunda barreira, não a regra. |
| Q34 | Quando nasce o Account | Na rota de sign-up, gravado pela aplicação. Ordem e confirmação: ver Q39. |
| Q35 | Confirmação do cadastro | Código por e-mail em todos os stages, sem auto-confirmação. |
| Q36 | Duração dos tokens | Access e id de 1 h; refresh de 30 dias com rotação. |
| Q37 | E-mails de autenticação | SES via Cognito, texto pelo trigger de custom message. O Resend talvez nem entre (a fase 3 decide). |
| Q20 | Onde vive o papel | `role` no Account (fonte da verdade), copiado para o access token pelo trigger de pre token, que lê o Dynamo. Papel desatualizado por no máximo 1 h. Rotas de admin que mudam papel leem o papel do Dynamo na hora. Grupos do Cognito descartados pela Q38. |
| Q39 | Ordem do sign-up | (1) Transação no Dynamo: Account `PENDING` e `EMAIL#`, ambos com TTL de 3 dias. (2) `SignUp` no Cognito com `custom:internalId`; se falhar, apagar os dois itens. (3) A confirmação marca `ACTIVE` e remove o TTL. Leituras ignoram itens vencidos ainda não apagados. |
| Q40 | Quem marca a confirmação | A rota de confirmação, depois do `ConfirmSignUp`. Sem trigger de post confirmation. |
| Q41 | Usuário órfão no Cognito | As duas limpezas: o stream pega o `REMOVE` do TTL (`userIdentity` = `dynamodb.amazonaws.com`) e chama `AdminDeleteUser` (fase 3); e a rota de sign-up, ao receber `UsernameExistsException` sem `EMAIL#` nosso, apaga o usuário `UNCONFIRMED` e tenta de novo (fase 1). O Dynamo decide, o Cognito obedece. |
| Q42 | O que o Cognito guarda | Só e-mail, senha e `custom:internalId` (imutável). Perfil no Account. `WriteAttributes` explícito em todo app client, sem `custom:internalId`, com teste no template. |
| Q43 | Forma do papel | Um valor por usuário (`student`, `instructor`, `admin`). Um módulo de permissões mapeia papel → ações e os handlers perguntam pela ação. O admin herda as ações do instrutor. **Fica aberto para evoluir**: haverá um painel de administradores no mesmo front, então o mapa papel → ações deve poder sair do código para dados sem mudar os handlers. |
| Q44 | Troca de papel | Só admin, `PUT /admin/users/{id}/role`. Ninguém muda o próprio papel; o último admin não pode ser rebaixado; conta `PENDING` é recusada; linha de auditoria (quem, quando, de/para). O primeiro admin vem do script da Q21, que grava `role = admin` no Account. |
| Q45 | Instrutor rebaixado | Os cursos dele ficam como estão (publicados no catálogo, matrículas mantidas); ele perde a edição; o admin pode arquivar. Nada é apagado ou transferido. |
| Q46 | Entidades do ERD | Account, Course, Module, Lesson, Enrollment, LessonProgress, Review, RoleChange (auditoria da Q44), CourseCover (fase 4), StudentExport (CSV da fase 4). `EMAIL#` e itens de idempotência são físicos, fora do ERD. |
| Q48 | O que é uma aula | Título, corpo em Markdown com limite (por exemplo 32 KB), duração em minutos e posição. Vídeo: ver a rodada em aberto. |
| Q50 | Capa do curso | Uma capa atual (0..1). Trocar substitui a anterior e apaga do S3 o original e as variantes da capa antiga. |
| Q52 | Curso arquivado | Não aceita matrículas novas; quem já está matriculado continua assistindo, marcando progresso e pode avaliar. Some do catálogo e da busca (Q10). |
| Q47 | Dono da avaliação | O par aluno + curso, não a matrícula. Uma por par, para sempre; só quem tem matrícula ativa cria ou edita. |
| Q49 | Rematrícula (revoga parte da Q23) | Cancelamento lógico: matrícula `ACTIVE` ou `CANCELLED`, progresso guardado. Cancelar marca `CANCELLED` e decrementa o contador; rematricular volta a `ACTIVE`, incrementa e continua de onde parou. Listas de matrículas e de alunos mostram só ativas, por índice esparso. |
| Q54 | Cursos em vídeo | O vídeo sai do opcional e vira a fase 5: upload multipart pelo instrutor, reprodução privada por URL pré-assinada do MP4. A aula tem vídeo opcional; o Markdown vira a descrição. HLS e URL assinada do CloudFront ficam como evolução e como skill que falta. |
| Q55 | Retomar a aula | A matrícula guarda a última aula aberta e a posição em segundos, gravadas a cada 15 a 30 s. Sem histórico. |
| Q56 | Status da conta | `PENDING`, `ACTIVE`, `DISABLED` (admin desativa; o usuário do Cognito é desativado junto; dados mantidos). Exclusão pelo próprio usuário com anonimização (LGPD) fica como evolução, com o status `DELETED`. |
| Q53 | Arquivos (substitui `COURSE_COVER` na Q46) | Entidade `FILE` com `ownerType` (conta, curso, aula), `ownerId`, `purpose` (`avatar`, `cover`, `attachment`, `video`), `status` (`PENDING`, `UPLOADED`, `PROCESSED`, `FAILED`), `originalKey`, `variants`, `contentType`, `size`, `position`, `createdAt`. Avatar e capa: 1 atual, públicos, variantes webp com sharp, presigned POST. Attachment: vários com ordem, só matriculados, presigned POST. Vídeo: 1 por aula, só matriculados, multipart. Tipos e tamanhos por finalidade num mapa no código. Trocar avatar ou capa apaga os arquivos antigos. |
| Q57 | Material da aula | Sai do opcional e entra na fase 4 (mesmo pipeline). Download por URL pré-assinada depois de verificar a matrícula. |
| Q58 | Acesso a arquivos | Só matrícula `ACTIVE` baixa material e assiste vídeo. Em curso arquivado, os ativos continuam com acesso. Nenhum arquivo é apagado por cancelamento ou arquivamento. |
| Q59 | Versões de curso | **Sem versionamento.** O curso é um só e todos os alunos, antigos e novos, veem o conteúdo atual. Reestruturar substitui o conteúdo para todos; a Q24 continua valendo (publicado pode ganhar aulas, não perder). Se um dia fizer falta guardar versões antigas, as chaves podem reservar esse nível (decidir no quadro de entidades). |
| Q65–Q68 | Padrões de acesso revisados | Lista em `docs/data-model.md`, seção 2. Catálogo no Dynamo só por mais recentes; outras ordens no Algolia. Admin busca usuário por e-mail exato e lista por papel e status. Padrões 8b e 16 marcados como críticos. |
| Q69 | Entrega de arquivos | Avatar e capa (variantes webp) pelo CloudFront com OAC; nome da variante com hash do conteúdo, cache `immutable`, sem invalidação. Material e vídeo por URL pré-assinada do S3. CloudFront com URL assinada fica como evolução (skill que falta). Fase 4. |
| Q70 | Buckets | Dois: `public-assets` (só o CloudFront lê, via OAC) e `private-files` (só URL pré-assinada). Originais no privado; só as variantes processadas vão para o público. |
| Q78 | E-mail na Account (refina a Q18) | O e-mail é atributo da Account e tem padrão próprio de busca (login, admin): `GSI2PK = EMAIL#<email>` na Account, uma partição por e-mail, uma leitura. A unicidade continua garantida por um item de reserva cuja chave é o e-mail, mas ele não é entidade: só o `AccountRepository` o grava e move, na mesma transação da Account. Índice nunca é único (`dynamodb-index-overloading`). |
| Q71 | Reordenar e escritas compostas | Posição em atributo, não na chave; SK hierárquica `MODULE#m#LESSON#l`. **Toda escrita que toca mais de um item é uma transação**: mover aula de módulo (delete + put), reordenar vários itens, contadores. |
| Q72 | Sumário e conteúdo da aula | Sumário (título, duração, posição) na partição do curso; conteúdo em `LESSON#l` / `CONTENT`, com vídeo e materiais na mesma partição. Novo padrão 22: abrir aula. |
| Q73 | Matrícula e avaliação | Na coleção do aluno (`ACCOUNT#a`), com chaves invertidas no `GSI1` para o lado do curso (`dynamodb-many-to-many-relationships`). |
| Q74 | Minhas matrículas (ajusta a Q49) | Query na coleção do aluno com filtro de ativas; índice esparso só para alunos do curso. |
| Q75 | Catálogo | Uma partição `CATALOG` no `GSI2`. Dividir em `CATALOG#0..n` fica como evolução (candidata da fase 7). |
| Q76 | Lista de usuários | Sempre por papel (abas); status por `FilterExpression`. |
| Q77 | Chave no S3 | `<ownerType>/<ownerId>/<purpose>/<fileId>/original`, montada só pelo servidor; o trigger deriva a PK/SK do `FILE` dela. |
| Q79 | Projeção dos índices | `ALL` no `GSI1` e no `GSI2` (índices genéricos, compartilhados). |
| Q80 | Minhas matrículas | Query nas matrículas + `BatchGet` dos cursos. Título, capa e total de aulas ficam como referência, não como cópia. |
| Q81 | Nome do aluno | `studentName` copiado na matrícula e na avaliação. Renomear atualiza as cópias na mesma requisição, em transações de até 100 itens (todas na partição `ACCOUNT#a`). |
| Q82 | Dados do catálogo no curso | `instructorName` (propagado como na Q81, pelos cursos do instrutor no `GSI1`), `coverVariants` (gravado pelo processador de imagem), `ratingSum` e `ratingCount`. Algolia recebe pelo stream. |
| Q83 | Contadores | `Course.enrollmentCount`, `Course.lessonCount`, `Course.ratingSum`/`ratingCount`, `Enrollment.completedLessons`: sempre `ADD` na mesma transação da escrita que os muda; refazer quando a transação é cancelada por conflito. Percentual e média só na leitura. Nenhum contador depende do stream. |
| Q84 | Retratos | Nota e comentário da avaliação, `fromRole`/`toRole`, `enrolledAt`, arquivo de exportação: nunca acompanham o original. Cada atributo copiado é classificado no modelo (exibição, retrato, contador, índice, referência) com seu dono. |
| Q85 | Avatar e capa copiados no dono | A Account ganha `avatar: { fileId, variants }` e o Course `cover: { fileId, variants }` (substitui o `coverVariants` da Q82). O mapa guarda chaves do S3, não URLs; o controller monta a URL com o domínio da CDN. O processador grava a cópia na mesma transação que marca o `FILE` como `PROCESSED`; trocar apaga o `FILE` antigo, com condição "o `fileId` atual ainda é o antigo". |
| Q86 | Operações com mais de 100 itens | Duas etapas: uma transação marca o estado (curso `DELETING`, rota responde 202, some das listas) e um job idempotente termina em lotes, com exclusões condicionais e os objetos do S3. Vale para qualquer operação futura que passe do limite de 100 ações. |
| Q87 | Unidade de trabalho e Saga | `UnitOfWork` nova a cada execução, por fábrica injetada; `commit()` envia `TransactWriteCommand`, refaz em conflito e traduz `CancellationReasons` em erros de domínio. **O `Saga` fica**, corrigido do mesmo jeito (uma instância por execução, sem estado entre invocações), e é usado na compensação do sign-up (Q39). Operações da unidade (`Put`, `Update`, `Delete`, `ConditionCheck`) e permissões IAM **são liberadas conforme o uso**, tarefa a tarefa. |
| Q88 | Consistência de leitura | Eventual por padrão. `ConsistentRead` só em: trigger de pre token lendo o papel; rota de admin lendo o papel do chamador; checagem de matrícula antes de entregar material ou vídeo. Regras de escrita ficam em condições de transação. Escritas respondem com o que gravaram ou `ReturnValues: 'ALL_NEW'`. |
| Q89 | Paginação | Cursor opaco `base64url`, validado por schema da lista (chaves, partição, prefixo); inválido → 400. Resposta `{ items, nextCursor }`. Página padrão 20, máxima 100, lendo `Limit + 1`. |
| Q90 | Topologia do stream (revisa a Q27) | Stream `NEW_AND_OLD_IMAGES` com dois consumidores filtrados: indexador do Algolia (`Course`) e limpeza do Cognito (`REMOVE` do TTL em `Account`). `maximumRetryAttempts: 2`, `bisectBatchOnFunctionError`, fila SQS de falhas com alarme e redrive; replay lê o estado atual pela chave. SQS nos jobs: imagem (S3 → SQS), CSV (202), exclusão de curso (Q86). Terceiro consumidor exige um roteador que distribui para filas. |
| Q91 | Registro no Algolia | Só publicados, `objectID = courseId`; título, descrição, `instructorName`, chave da capa, `enrollmentCount`, `ratingAverage` (calculado na indexação), `ratingCount`, `publishedAt`. Sair de `PUBLISHED` ou ser apagado remove. Reindexação por script lendo o catálogo no `GSI2`. Nota para o painel de admin: cursos não publicados iriam para um segundo índice com todos os status, alimentado pelo mesmo consumidor e consultado só por uma rota de admin no servidor (`algolia-search-api`), sem expor chave. |
| Q92 | Stages e proteção | `dev` e `prod`, mesma conta e região, recursos separados. `prod`: proteção contra exclusão na tabela e no pool, PITR, `DeletionPolicy: Retain` nos buckets. `dev`: destrutível. Alarmes nas filas de falha e dos jobs. |
| Q93 | Rotas | Auth: `POST /auth/sign-up`, `/confirm`, `/resend-code`, `/sign-in`, `/refresh`, `/forgot-password`, `/reset-password`. Conta: `GET`/`PATCH /me`, `POST /me/avatar`. Catálogo (público): `GET /courses`, `/courses/{id}`, `/courses/{id}/reviews`, `/search`. Instrutor: `GET /instructor/courses`, `POST /courses`, `PATCH /courses/{id}`, `POST /courses/{id}/publish`, `/archive`, `DELETE /courses/{id}`, CRUD de módulos e aulas, `PUT /courses/{id}/outline`, `POST /courses/{id}/cover`, `POST /lessons/{lid}/attachments`, `GET /courses/{id}/students`, `POST`/`GET /courses/{id}/exports`, `GET /exports/{id}`. Aluno: `PUT`/`DELETE /courses/{id}/enrollment`, `GET /me/enrollments`, `GET /courses/{id}/progress`, `PUT /courses/{id}/progress/position`, `POST /courses/{id}/lessons/{lid}/complete`, `GET /courses/{id}/lessons/{lid}`, `GET /lessons/{lid}/files/{fid}`, `PUT /courses/{id}/review`. Admin: `GET /admin/users`, `/admin/users/by-email`, `PUT /admin/users/{id}/role`, `POST /admin/users/{id}/disable`, `/enable`, `GET /admin/users/{id}/role-changes`. Fase 5: multipart do vídeo. Arquivar é uma rota só (dono, ou `courses:archive-any`). |
| Q94 | Permissão na rota | O controller declara a ação exigida (`Controller<'private', Body, Permissão>`); o adapter verifica antes de validar o corpo (403 sem dizer o papel); a posse fica no use case; teste de auditoria das rotas de `/admin`. Constantes conforme a Q98. |
| Q95 | 404 ou 403 | 404 quando o chamador não poderia ver o recurso (rascunho alheio); 403 quando o recurso é visível (curso publicado). |
| Q96 | Formato de erro | `{ error: { code, message, details? } }`; `details` só em validação (campos do Zod). Erros de transação viram códigos próprios (`EMAIL_IN_USE`, `ALREADY_COMPLETED`, `COURSE_NOT_PUBLISHED`). Nenhuma mensagem do AWS SDK chega ao cliente. |
| Q97 | Funções e permissões | Uma Lambda por rota (handler de seis linhas do foodiary), uma role IAM por função, permissões e variáveis de ambiente só do que a função usa, liberadas por tarefa. |
| Q98 | Constantes em vez de `enum` | Permissões, papéis e todos os valores fechados (status de conta, curso, matrícula e arquivo; finalidade do arquivo) como objeto `as const` com o tipo derivado (`(typeof x)[keyof typeof x]`). O mapa papel → permissões usa `satisfies Record<Role, readonly Permission[]>`. Nada de `enum` do TypeScript (`typescript-enums-and-alternatives`). |
| Q99 | Registro de achados | Anotado na sub-imp na hora e, no commit que fecha a tarefa, em `docs/skill-findings.md`, agrupado por skill: data, tarefa, tipo (`erro`, `lacuna`, `ambíguo`, `acerto`), o que a skill diz, o que aconteceu, sugestão. Seção final com as skills que faltam. |
| Q100 | Critério de pronto | História: deploy em `dev`; testes unitários e de integração verdes; rota chamada com token real (feliz e um erro); skills usadas e achados preenchidos (mesmo "nenhum"); `docs/data-model.md` atualizado se chave ou item mudou; commits pequenos com push. Fase: todas as histórias prontas e cobertura das skills conferida pelas labels. |
| Q101 | Evolução de schema (fase 7) | Dividir o catálogo em `CATALOG#0..n`, reescrevendo o `GSI2PK` dos cursos publicados com o sistema no ar. Reserva: `slug` único com item de reserva e preenchimento. |
| Q102 | Repositórios | **Separados**: API e `web` em repositórios próprios, para o deploy de cada um não depender do outro. Onde fica o código da API: ver a rodada em aberto. |
| Q103 | Versões fixadas | Node 24 (`.nvmrc`, `engines`, runtime `nodejs24.x` arm64); pnpm 12 (`packageManager`); Serverless Framework 4.43 (`frameworkVersion`); dependências com versão exata (`save-exact`). |
| Q104 | TypeScript | **Fica no 6** (6.0.3). Teste da 1.0.c em 2026-10-15: com o 6, esbuild + `esbuild-plugin-tsc` 0.6.0 emitiram `design:paramtypes` (`["Clock","String"]`); com o 7.0.2, o `tsc` checa o projeto, mas o pacote `typescript` não tem mais a API de JavaScript (só `version` e o caminho do executável), e o plugin quebra em `typescript.sys.fileExists`. Rever quando o 7 tiver API ou o plugin suportá-lo. |
| Q105 | Lint e formatação | ESLint flat com `typescript-eslint` `strictTypeChecked` + `stylisticTypeChecked`; Prettier sozinho como formatador, `eslint-config-prettier` para desligar conflitos (sai o `eslint-plugin-prettier`); ordenação de imports; `no-restricted-imports` por camada (`application` não importa `infra`). |
| Q106 | Fluxo de git | Branch por história (`feat/1.2-create-course`), PR para a `main`, merge sem squash. Commits de planejamento (`docs:`) podem ir direto na `main`. |
| Q107 | Documentação | `CLAUDE.md` curto na raiz só com regras de trabalho e onde está cada documento; conhecimento em `docs/`; nenhum `CLAUDE.md` por pasta. |
| Q108 | Código da API e planejamento | Este repositório é a API, com o código na raiz e `docs/` mantido; renomeado para `coursary-api`. O `web` nasce na fase 6 como `coursary-web` e aponta para o planejamento daqui. |
| Q109 | `tsconfig` | `strict`, `noUncheckedIndexedAccess`, `noImplicitOverride`; `target: es2025` e `lib: ["es2025"]` (o ano que o Node 24 implementa inteiro, conforme `typescript-project-setup`; ajustado na 1.0.b); `module: preserve` + `moduleResolution: bundler`; `rootDir`, `noEmit`, aliases do foodiary; `experimentalDecorators` + `emitDecoratorMetadata`. Sem `exactOptionalPropertyTypes`. |
| Q110 | Commits e hooks | commitlint com `config-conventional`, mensagens em inglês, escopos opcionais e livres. lefthook: commitlint no `commit-msg`; Prettier e ESLint nos arquivos alterados no `pre-commit`. Typecheck e testes só no CI. |
| Q111 | CI | GitHub Actions em PR e push na `main`: `pnpm install --frozen-lockfile`, `lint`, `typecheck`, `test` (DynamoDB Local como serviço), `sls package` de `dev`. Deploy manual da máquina local por enquanto. |
| Q113 | Formato de módulo | ES modules (`"type": "module"`). O risco de dependência CommonJS embutida num bundle ESM fica coberto pela chamada real em `dev` (Q100). |
| Q114 | Org do Serverless | `org: worldiary`, criada pelo João em 2026-10-15 (a sessão da `jsoareez` passou a responder `Forbidden`). |
| Q115 | `sls package` no CI | Fica no CI. Ele exige credencial real da AWS (resolve a conta pelo STS) além da `SERVERLESS_ACCESS_KEY`. A AWS vem de uma role sem nenhuma permissão, assumida por OIDC só por workflows deste repositório (`aws/bootstrap.yml`, stack `coursary-api-bootstrap`); o ARN fica no segredo `AWS_CI_ROLE_ARN`. A mesma role ganha permissões se um dia o deploy for pelo CI. |
| Q116 | Stage `prod` | Declarado no código (proteção e PITR), mas não deployado até a fase 6 ou decisão do João: com o `foodiary-api-dev`, seria a terceira instância do Serverless, e paga. |
| Q117 | Quando deployar | Depois da revisão dos commits e com o ok do João, antes do push; o resultado entra no último commit. Perfil da AWS: `coursary` (Q118). |
| Q118 | Perfil da AWS do projeto | Role `coursary-api-deployer` (em `aws/bootstrap.yml`), assumida a partir do `joao-master` pelo perfil `coursary` (`role_arn` + `source_profile`); `.env` com `AWS_PROFILE=coursary`. Permissões só em `coursary-api-*` (amplitude na Q122). O `joao-master` só aplica o bootstrap. Nenhuma skill cobre permissão mínima de deploy do Serverless: skill que falta. |
| Q119 | Resposta da health | `GET /health` pública, `200 { "status": "ok" }`, sem tocar na tabela. Checagem de dependências seria outra rota (`/health/deep`). |
| Q120 | Role por função | A health fica com a role padrão do Serverless (só logs). A role por função (Q97) entra na 1.3, com a primeira função que precisa de permissão. |
| Q121 | Roles criadas pelo deploy | **Permissions boundary** `coursary-api-boundary`: teto de toda role do projeto (logs e tabelas `coursary-api-*`, crescendo por história). A deployer só cria e altera roles `coursary-api-*` que tenham esse boundary, só passa roles para o Lambda, não pode remover boundary e não toca nas próprias roles (`deployer`, `ci`). Serverless: `provider.iam.role.permissionsBoundary`. |
| Q122 | Amplitude da role de deploy (revisa Q118) | Uma política só, `deploy-broad`, com os serviços do plano até a fase 6 (CloudFormation, DynamoDB, Lambda, logs, API Gateway, Cognito, S3, SQS, SNS, CloudWatch, SSM, CloudFront, ACM, leitura de SES), restrita a `coursary-api-*` onde o serviço filtra por nome. Pool do Cognito, CloudFront e ACM não filtram por nome. O boundary (Q121) acompanha. Quando o projeto estiver sólido, o bootstrap volta a ter só o que se sabe que é usado. |
| Q123 | Metadados nos testes | Confirmar com um teste do container que o Vitest 5 emite `design:paramtypes` sem plugin (como registra a `typescript-decorators-metadata`); se não emitir, plugin SWC e achado. Testes de use case não usam o container: fakes pelo construtor. |
| Q124 | Corpo e resposta do sign-up | `{ name, email, password }` → `201 { accountId }`, sem tokens (Q35). E-mail repetido → `409 EMAIL_IN_USE`. |
| Q125 | Política de senha | Mínimo de 8, com minúscula e número, igual no pool e no schema do Zod. |
| Q126 | E-mail de confirmação até a 1.7 | `COGNITO_DEFAULT`; o SES com o trigger de custom message entra na história de recuperação de senha (Q37). |
| Q127 | App client com secret | Sim: sem secret, qualquer um chama o `SignUp` direto no Cognito, por fora da API, e cria órfãos (Q38). O secret fica só nas funções que falam com o Cognito (Q97). |
| Q128 | Estilo dos tipos e dos itens | Tipos em namespaces só com tipos, como no foodiary (`Account.Role`, `AccountItem.ItemType`, `Controller.Response`); constantes `as const` no módulo; `no-namespace` desligada. `*Item` como classe no padrão do foodiary. Brands de id só quando houver dois tipos de id (1.11), já como `Account.Id`/`Course.Id`. |
| Q129 | Secret do client nas funções | `!GetAtt UserPoolClient.ClientSecret` na variável da função que precisa (como no foodiary; confirmado numa conta real pela skill, mas fora da página de referência). Se a AWS mudar o atributo, trocar para Secrets Manager com referência dinâmica. |
| Q130 | Usuário confirmado no Cognito e reserva livre | `409 EMAIL_IN_USE`, compensação apaga a reserva recém-criada, log de inconsistência. Nunca apagar automaticamente um usuário confirmado. |
| Q112 | **Princípio: necessidade → implementação** | Nenhuma abstração, operação, índice ou permissão entra antes da história que a usa. `UnitOfWork` e `Saga` nascem no sign-up; `GSI2` com a primeira leitura por e-mail; `GSI1` com a lista do admin; container com o primeiro use case com porta; DynamoDB Local no CI com o primeiro teste de integração. |

#### Fases (Q27)

| Fase | Conteúdo |
|---|---|
| 1 | Tabela, CRUD de curso/módulo/aula, auth completa com grupos, rotas de admin |
| 2 | Matrícula, progresso, avaliações (relações, índices, contadores) |
| 3 | Stream → SQS → Algolia e e-mails do domínio (idempotência, DLQ, redrive; Resend a confirmar) |
| 4 | Arquivos (avatar, capa, material da aula) com S3 e sharp, CDN para as imagens públicas, consistência do upload com TTL, CSV de alunos |
| 5 | Vídeo das aulas: upload multipart e reprodução por URL pré-assinada (Q54) |
| 6 | Frontend `web` em S3 + CloudFront |
| 7 | Evolução de schema: dividir a partição do catálogo (Q101) |
| Opcional | Google sign-in |

## Épico 0: planejamento e design

Histórias de decisão, antes de qualquer código. Ordem de dependência: PLAN-2 → PLAN-3 → PLAN-4. PLAN-6 corre em paralelo e fecha antes do primeiro commit de código.

| História | Conteúdo | Skills | Estado |
|---|---|---|---|
| PLAN-1 | Escopo e fases | | Feita (Q27) |
| PLAN-2 | Identidade e papéis: Q20, revisão de Q17 e Q18, e-mails (Cognito ou Resend) | `cognito-*` | Feita (Q18, Q20, Q32 a Q45) |
| PLAN-3 | Modelagem de dados: ERD → lista de padrões de acesso → quadro de entidades (PK/SK) → GSIs → desnormalização e contadores → validação percorrendo a lista | `designing-data-models`, `modeling-entity-relationships`, `defining-access-patterns`, `dynamodb-*` | Feita (Q46 a Q86; `docs/data-model.md`) |
| PLAN-4 | Arquitetura de execução: unidade de trabalho, consistência, paginação, stream → SQS, rotas, autorização | `dynamodb-*`, `sqs-*`, `serverless-*`, DI | Feita (Q87 a Q98) |
| PLAN-5 | Registro de achados e critério de pronto das fases | | Feita (Q99 a Q101) |
| PLAN-6 | Padrões do projeto: gerenciador de pacotes, versões fixadas, monorepo ou não, tsconfig, ESLint e Prettier, commitlint e hooks, scripts, CI, documentação | `typescript-*`, `vitest-setup`, `serverless-typescript-esbuild` (nenhuma skill cobre lint ou commitlint: anotar como skill que falta) | Feita (Q102 a Q111) |

## Fase 1: histórias

Quebra aprovada em 2026-10-14, seguindo a Q112. Em 2026-10-15 o sign-up foi dividido em 1.3 (persistência) e 1.4 (Cognito e rota), e as seguintes andaram uma casa. Cada história ganha as sub-imp quando começa, discutidas antes de codar. Durante a 1.3, a Q112 tirou dela a validação e o `esbuild-plugin-tsc` (vão para a 1.4, onde são usados) e a `UnitOfWork`: a conta e a reserva são do mesmo repositório, então a transação fica nele; a `UnitOfWork` nasce com a primeira transação entre repositórios.

| História | Entrega visível | O que nasce nela |
|---|---|---|
| 1.0 | Commit fora do padrão é recusado; CI verde | Ferramental da PLAN-6, teste do TypeScript 7 (Q104) |
| 1.1 | Deploy de `dev` com a tabela | `MainTable` só com `PK`/`SK` |
| 1.2 | `GET /health` responde | `Controller`, adapter HTTP, erros, config por função |
| 1.3 | Conta e reserva de e-mail numa transação, testadas no DynamoDB Local; e-mail repetido recusado | Container com `bind`, entidade `Account`, `AccountItem`, transação no próprio `AccountRepository`, TTL, DynamoDB Local nos testes e no CI |
| 1.4 | Sign-up (`POST /auth/sign-up`) | Validação com Zod, `ApplicationError` → HTTP no adapter, `esbuild-plugin-tsc`, user pool e client com secret, `AuthGateway`, `Saga`, primeira role por função |
| 1.5 | Confirmação e reenvio de código | |
| 1.6 | Sign-in e refresh | `GSI2` (e-mail), trigger de pre token |
| 1.7 | Recuperação de senha | SES e trigger de custom message |
| 1.8 | `GET` e `PATCH /me` | |
| 1.9 | Script do primeiro admin | Módulo de permissões |
| 1.10 | Rotas de admin | `GSI1` (papel), `RoleChange` |
| 1.11 | Curso: criar, editar, meus cursos | |
| 1.12 | Módulos e aulas: CRUD e reordenação | `UnitOfWork` (primeira transação entre repositórios: aula + contador do curso) |
| 1.13 | Publicar, arquivar, catálogo, curso completo | Índice esparso do catálogo |

Fora da fase 1 de propósito: abrir aula (fase 2, precisa de matrícula) e apagar curso em rascunho (fase 3, usa o job com fila da Q86). As fases 2 a 7 ficam só com título até começarem.

## Próximas perguntas (lista original de 2026-10-12)

| # | Tema | Onde foi resolvido |
|---|---|---|
| 1 | Tabela de chaves | Q71 a Q78; `docs/data-model.md`, seção 3 |
| 2 | Índices | Q75, Q79; seção 4 |
| 3 | Desnormalização | Q80 a Q82, Q85; seção 5 |
| 4 | Contadores | Q83 |
| 5 | Unidade de trabalho e `Saga` | Q87 |
| 6 | Consistência de leitura | Q88 |
| 7 | Paginação | Q89 |
| 8 | Stream e Algolia | Q90, Q91 |
| 9 | Rotas e formato de erro | Q93, Q96 |
| 10 | Autorização | Q94, Q95, Q98 |
| 11 | Evolução de schema (agora fase 7) | Q101 |
| 12 | Fases e critério de pronto | Q27, Q54, Q100 |
| 13 | Registro de achados sobre as skills | Q99 |
| 14 | Custo e capacidade | Q92 |

## O que a exploração do foodiary mostrou

Projeto de referência: `/home/joao/projects/foodiary/api` (lido em 2026-10-12, commit `177be03`).

### Trazer

- `kernel/`: `Registry` (container escrito à mão, cerca de 45 linhas, `reflect-metadata`), `@Injectable`, `@Schema` (Zod por decorator de classe).
- `application/contracts/Controller.ts`: `Controller<'public' | 'private', TBody>`, que tipa `accountId` como `string` ou `null`.
- `main/adapters/lambdaHttpAdapter.ts`, `main/utils/` e o modelo de handler de seis linhas.
- Hierarquia de erros e `ErrorCode`; corpo de erro `{ error: { code, message } }`.
- Padrão `shared/config` (`env.ts` com Zod + `AppConfig` injetável).
- Padrão `*Item`: `static type`, construtores de chave estáticos (`getPK`, `getSK`, `getGSI1PK`, `getGSI1SK`), `fromEntity` / `toEntity`, `id` como atributo próprio, ids KSUID.
- Convenção de repositório: `getPutCommandInput(entity)` exposto para reuso em transação.
- `AuthGateway` e os três triggers do Cognito; authorizer JWT do API Gateway; claim `internalId` (o KSUID próprio é a identidade, o `sub` do Cognito fica só como `externalId`).
- `serverless.yml` enxuto + divisão em `sls/` (config, functions, resources), incluindo `UserPool.yml`, `MainTable.yml` e `CustomDomain.yml`.
- `esbuild.config.mjs` (com `esbuild-plugin-tsc`, necessário para `design:paramtypes`), `tsconfig.json`, ESLint e Prettier.

### Corrigir na entrada

- `UnityOfWork.transactItems` e `Saga.compensations` nunca são limpos, e as instâncias vivem pelo container inteiro: em Lambda quente, uma segunda execução reenvia os itens da primeira.
- A unidade de trabalho só aceita `Put`. Avaliar, e liberar conforme utilizamos.
- Nenhuma condition expression em lugar nenhum; nenhuma paginação (`LastEvaluatedKey` nunca é lido).
- Token do container é `impl.name` com `minify: true` e sem `keepNames`: frágil.
- `application` importa classes concretas de `infra`; as queries falam direto com o `dynamoClient`.
- Unicidade de e-mail é "consulta o GSI, depois grava"; o erro do Cognito vira 500.
- Catches genéricos transformam qualquer erro do Cognito em 401 ou 400.
- `COGNITO_CLIENT_SECRET` exposto a todas as funções; `env.ts` exige todas as variáveis em toda função.
- Uma role IAM única para todas as funções.
- Sem testes, sem scripts de `lint`, `build` ou `deploy`; versão do Serverless Framework não fixada.
- Renomear a função do trigger de pre token generation quebra a ligação manual no `UserPool.yml`.
- Os `CLAUDE.md` e o `README.md` do foodiary estão defasados em relação ao código; confiar no código.

### Não trazer

Entidades e regras do domínio (`Profile`, `Goal`, `Meal`, `GoalCalculator`), `MealsFileStorageGateway` e o bucket S3, o texto e as cores do template de e-mail, `org: jsoareez` e o sufixo `joaodevdude`.

### O que o foodiary não cobre e este projeto precisa

Streams, TTL, delete, batch, paginação, condições, índice esparso, relação N:N, contadores, papéis de usuário, Algolia e testes.

## Skills que o projeto pretende exercitar

- **DynamoDB**: single-table-design, key-design, tables-and-keys, one-to-one, one-to-many, many-to-many, index-overloading, secondary-indexes, denormalization, queries, query-pagination, read-consistency, item-operations, document-client, schema-evolution, capacity-and-pricing, streams, stream-lambda-triggers, stream-event-filters.
- **Algolia**: algolia-indexing-from-dynamodb, algolia-search-api.
- **Serverless**: framework-setup, yml-basics, yml-splitting, lambda-functions, http-api-events, resources-and-iam, environment-variables, stages-regions-variables, typescript-esbuild, packaging, deploy-and-logs, cloudformation-intrinsic-functions.
- **Arquitetura e DI**: typescript-di-container, typescript-decorators-metadata, injecting-dependencies, inverting-dependencies, wiring-dependencies, structuring-use-cases, designing-testable-code.
- **Testes**: vitest-setup, vitest-writing-tests, writing-unit-tests, using-test-doubles, choosing-test-types.
- **Cognito**: user-pools, user-pool-iac, sign-up-and-confirmation, sign-in-and-refresh-tokens, password-reset, custom-message-lambda-trigger, pre-sign-up-lambda-trigger, api-gateway-jwt-authorizer, user-groups, role-based-route-protection, group-management-api. Opcionais: google-identity-provider, oauth-authorization-code-flow, oauth-token-exchange, federated-account-linking.
- **TypeScript**: tsconfig-files-and-strict, target-and-modules, on-node, branded-types, template-literal-and-conditional-types, literal-types-and-const-assertions, enums-and-alternatives, satisfies, narrowing, type-guards-and-assertion-functions, safe-indexed-access.
- **Modelagem**: designing-data-models, modeling-entity-relationships, defining-access-patterns, dynamodb-time-to-live.
- **S3 e uploads**: cloudfront-s3-distribution (imagens públicas), upload-strategies, presigned-post, bucket-cors, event-lambda-trigger, image-processing-sharp, upload-database-consistency, csv-export-from-dynamodb, presigned-download-url, lifecycle-rules; lambda-layers, lambda-native-dependencies. Opcional: multipart-upload.
- **Filas e e-mail**: sqs-queue-settings, sqs-lambda-queues, sqs-dlq-alarms-and-redrive, sqs-idempotent-consumers, transactional-email-resend, dynamodb-streams-low-level-api.
- **Frontend (fase 5)**: react-vite-setup, react-query-*, react-hook-form-* (incluindo sortable-field-array), zustand-*, motion-reorder, react-pagination-ellipsis, react-intersection-observer, react-unsaved-changes-warning, multi-step-form-design, react-stepper, hosting-static-frontends, s3-static-site-bucket, cloudfront-*.
- **Testes, extra**: vitest-mock-extended.
- **Fora (outra stack)**: Next.js, Auth.js, Prisma, normalizing-relational-schemas, node-fastify-typescript-setup, react-class-components; dynamodb-search (Q12 fechou só Algolia).