# Achados sobre as skills

O que cada skill acertou, errou, deixou ambíguo ou não cobriu durante o Coursary. Matéria-prima para corrigir o repositório de skills. Formato decidido na Q99 de `PLANNING.md`.

Cada achado:

```
### <data> · <tarefa> · <tipo: erro | lacuna | ambíguo | acerto>
- **A skill diz**:
- **O que aconteceu**:
- **Sugestão**:
```

## Achados do planejamento

### `cognito-user-groups`, `cognito-role-based-route-protection`

#### 2026-10-14 · PLAN-2 · ambíguo
- **A skill diz**: "Use groups for roles."
- **O que aconteceu**: num projeto em que a aplicação é a fonte da verdade (Q38), o papel foi para o item da conta no DynamoDB, copiado para o token pelo trigger de pre token (Q20). A recomendação não discute o acoplamento ao provedor.
- **Sugestão**: acrescentar a comparação "papel no provedor ou nos dados da aplicação" e quando cada um vence.

### `dynamodb-stream-event-filters`, `dynamodb-streams`

#### 2026-10-14 · PLAN-4 · acerto
- **A skill diz**: no máximo dois consumidores por fragmento do stream.
- **O que aconteceu**: a regra mudou a topologia planejada (Q90): os dois consumidores ficaram direto no stream e a SQS foi para os jobs.
- **Sugestão**: nenhuma.

### `typescript-enums-and-alternatives`

#### 2026-10-14 · PLAN-4 · acerto
- **A skill diz**: objeto `as const` com tipo derivado em vez de `enum`.
- **O que aconteceu**: atendeu o pedido de constantes nomeadas do dono (Q98), com valores vindos do token e do banco como string pura.
- **Sugestão**: nenhuma.

### `typescript-decorators-metadata`

#### 2026-10-15 · 1.0.c · lacuna
- **A skill diz**: lista os compiladores que emitem `design:paramtypes` (`tsc` com `experimentalDecorators` e `emitDecoratorMetadata`; `tsx` e esbuild não emitem) e só observou o `tsc` 6.0.
- **O que aconteceu**: com o TypeScript 7.0.2, o `tsc` aceita a configuração e checa o projeto, mas o pacote `typescript` não exporta mais a API de JavaScript (só `version`, `versionMajorMinor` e o caminho do executável). O `esbuild-plugin-tsc` 0.6.0, que é o que faz o esbuild emitir os metadados, quebra com `Cannot read properties of undefined (reading 'fileExists')` em `typescript.sys.fileExists`. Com o 6.0.3 a mesma classe saiu com `["Clock","String"]`.
- **Sugestão**: acrescentar uma linha "TypeScript 7 + esbuild-plugin-tsc: não funciona (sem API JS)" na tabela de compiladores, e a recomendação de fixar o 6 em projetos que dependem de metadados no bundle.

### `serverless-framework-setup`, `serverless-deploy-and-logs`, `serverless-typescript-esbuild`

#### 2026-10-15 · 1.1.c · lacuna
- **A skill diz**: o `sls package` gera o template sem deployar; o v4 exige autenticação do Serverless em todo comando.
- **O que aconteceu**: o `sls package` também exige credencial **real da AWS**: sem ela para em `AWS credentials missing`; com uma credencial falsa, em `Failed to resolve AWS account ID`, porque consulta a conta pelo STS. No CI isso pede uma role (aqui, uma role sem permissões assumida por OIDC).
- **Sugestão**: dizer que o `package` do v4 consulta a AWS e mostrar a role sem permissões para o CI.

#### 2026-10-15 · 1.1.d · lacuna
- **A skill diz**: nada sobre o bucket de deploy compartilhado do v4.
- **O que aconteceu**: com uma role de deploy restrita, o v4 achou o bucket no parâmetro `/serverless-framework/deployment/s3-bucket` e mesmo assim tentou `s3:CreateBucket`. Com `provider.deploymentBucket.name` explícito, ele usa o bucket e grava em `serverless/<service>/<stage>/`. O valor do parâmetro é um JSON (`{"bucketName", "bucketRegion"}`), então `${ssm:...}` não serve como nome do bucket; o nome ficou escrito em `sls/custom.yml`.
- **Sugestão**: uma seção "deploy com permissão mínima" com o `deploymentBucket` explícito, o prefixo `serverless/<service>/*` e o formato do parâmetro.

#### 2026-10-15 · 1.1.d · ambíguo
- **A skill diz**: o login fica em `~/.serverlessrc`.
- **O que aconteceu**: a sessão passou a responder `Forbidden` em todo comando, inclusive no `sls login`, que tenta usar a sessão guardada antes de logar de novo. Resolveu com outra org e login novo.
- **Sugestão**: acrescentar `sls logout` seguido de `sls login` como saída para um `Forbidden` no passo "Authenticating".

### `typescript-decorators-metadata`, `typescript-di-container`

#### 2026-10-15 · 1.3.a · acerto
- **A skill diz**: o Vitest 5 sem plugin emite `design:paramtypes`.
- **O que aconteceu**: confirmado no projeto (Vitest 5.0.4): um teste lê `[Clock]` dos metadados de uma classe decorada, sem SWC.
- **Sugestão**: nenhuma. Nota: num teste, duas classes que se referem uma à outra pelo construtor quebram com `Cannot access 'Second' before initialization` (a classe ainda não existe quando os metadados são gravados); o ciclo foi testado gravando os metadados à mão.

#### 2026-10-15 · 1.3.a · ambíguo
- **A skill diz**: por padrão, `resolve` cria uma instância nova a cada chamada; `singleton` é opção.
- **O que aconteceu**: o projeto inverteu o padrão (tudo compartilhado), porque use cases, repositórios e gateways não guardam estado e o que guarda estado vem por fábrica (Q87).
- **Sugestão**: dizer quando inverter o padrão faz sentido.

### `cognito-role-in-custom-attribute`, `cognito-user-pool-iac`

#### 2026-10-15 · 1.4.c · acerto
- **A skill diz**: o atributo em que a aplicação confia fica fora do `WriteAttributes` de todo client; um `SignUp` com atributo não gravável recebe `NotAuthorizedException` e não cria o usuário.
- **O que aconteceu**: a recusa descrita obrigou a rever a Q42 antes do deploy: o `custom:internalId` é enviado no `SignUp`, então precisa estar na lista.
- **Sugestão**: nenhuma.

#### 2026-10-15 · 1.4.c · lacuna
- **A skill diz**: a tabela "Who can write" cobre o usuário, o `SignUp` de qualquer um, o provedor de identidade e o código com credencial de admin.
- **O que aconteceu**: falta o atributo gravado uma vez pelo servidor no próprio `SignUp`, como o `internalId`. Ele precisa ser gravável pelo client; a proteção vem de `Mutable: false` (ninguém o altera depois) e do client com secret (ninguém chama o `SignUp` por fora da API).
- **Sugestão**: acrescentar esse caso à tabela, com as duas condições.

#### 2026-10-15 · 1.4.g · acerto
- **A skill diz**: com `RefreshTokenRotation` o client não aceita `REFRESH_TOKEN_AUTH`; ele renova com `GetTokensFromRefreshToken` e tira `ALLOW_REFRESH_TOKEN_AUTH` da lista.
- **O que aconteceu**: o template listou os dois, o `sls package` aceitou, e o deploy em `dev` falhou no `UserPoolClient` com `ALLOW_REFRESH_TOKEN_AUTH is not a permitted ExplicitAuthFlow when refresh token rotation is enabled` (rollback automático). Erro de implementação, não da skill.
- **Sugestão**: citar a mensagem do deploy junto da regra e dizer que o `sls package` não a pega.

#### 2026-10-15 · 1.4.g · acerto
- **A skill diz**: `!GetAtt UserPoolClient.ClientSecret` funciona, embora não esteja na página de referência.
- **O que aconteceu**: usado assim na variável só da função de sign-up (Q129).
- **Sugestão**: nenhuma.

### `serverless-typescript-esbuild`, `typescript-decorators-metadata`

#### 2026-10-15 · 1.4.b · lacuna
- **A skill diz**: a `typescript-decorators-metadata` diz que o esbuild não emite `design:paramtypes`; a `serverless-typescript-esbuild` mostra o `configFile` como o caminho para plugins do esbuild.
- **O que aconteceu**: nenhuma das duas liga uma à outra. O build embutido do Serverless v4 precisou do `esbuild-plugin-tsc` no `configFile` para o container resolver dependências pelos tipos, e de `keepNames` junto com `minify`.
- **Sugestão**: uma seção "decorators com metadados no build do Serverless" com esse `configFile`.

#### 2026-10-15 · 1.4.b · acerto
- **A skill diz**: uma dependência CommonJS embutida num bundle ESM falha na partida com `Dynamic require of "…" is not supported`; a saída é o banner com `createRequire`. O Vitest e o `node -e` escondem a falha; confira importando o handler empacotado de um `.mjs` num processo `node` separado.
- **O que aconteceu**: a conferência da 1.4.b com um handler descartável não seguiu esse método e concluiu que o `ksuid` funcionava. Na primeira chamada real em `dev`, o sign-up caiu na partida com `Dynamic require of "crypto" is not supported`. Com o banner, o zip do `sls package` carregou num processo `node` separado; sem ele, o mesmo teste reproduziu o erro.
- **Sugestão**: nenhuma na regra. Talvez trazer o banner para o `configFile` de exemplo de todo projeto ESM, já que quase todo projeto tem alguma dependência CommonJS.

### `wiring-dependencies`, `injecting-dependencies`

#### 2026-10-15 · 1.4.e · acerto
- **A skill diz**: objetos que guardam dados da operação em andamento são criados por chamada, por fábrica.
- **O que aconteceu**: a regra corrigiu o `Saga` do foodiary, que acumulava compensações entre execuções numa Lambda quente.
- **Sugestão**: nenhuma.

### `cognito-sign-up-and-confirmation`

#### 2026-10-15 · 1.4.d · lacuna
- **A skill diz**: `UsernameExistsException` vira 409.
- **O que aconteceu**: nada cobre o sign-up gravado em duas fontes (banco e Cognito) quando a aplicação é a fonte da verdade: o usuário órfão `UNCONFIRMED` é apagado e o `SignUp` repetido; um usuário confirmado sem reserva nunca é apagado e vira 409 com log de inconsistência (Q41, Q130); cada passo anterior é compensado.
- **Sugestão**: uma seção sobre sign-up com o banco da aplicação, órfãos e compensações.

### `cognito-sign-up-and-confirmation` (1.5)

#### 2026-10-15 · 1.5.b · acerto
- **A skill diz**: um só 400 para código errado, expirado, usuário inexistente e já confirmado; o reenvio responde 204 em todo caso; o código é texto.
- **O que aconteceu**: aplicado como está (Q141), com `TooManyFailedAttemptsException` junto dos limites.
- **Sugestão**: nenhuma.

#### 2026-10-15 · 1.5.c · lacuna
- **A skill diz**: a confirmação é só o `ConfirmSignUp`.
- **O que aconteceu**: com o banco da aplicação como fonte da verdade, faltou: conferir a conta pendente antes de chamar o Cognito (senão um órfão vira usuário confirmado sem conta, Q138); a ordem Cognito → banco e o reparo quando o banco falha depois do Cognito confirmar (a nova tentativa recebe `NotAuthorizedException`; `AdminGetUser` diz se o usuário já está `CONFIRMED`, Q139); e não chamar o `ResendConfirmationCode` sem conta pendente, para não gastar a cota do e-mail padrão (Q140).
- **Sugestão**: a mesma seção sugerida na 1.4.d (sign-up em duas fontes) cobrindo a confirmação e o reenvio.

### `dynamodb-time-to-live`, `dynamodb-read-consistency`

#### 2026-10-15 · 1.5.a · acerto
- **A skill diz**: para manter um item, `REMOVE` do atributo com condição; um `Get` não filtra, então o vencido é tratado como ausente no código (`getLive`).
- **O que aconteceu**: a ativação remove o `expiresAt` da conta e da reserva numa transação condicionada a `PENDING`; a leitura pela reserva usa `getLive` com `ConsistentRead: true` (Q142). Um teste com a reserva vencida e a conta ainda viva confirmou o filtro (mutação: sem ele, o teste falha).
- **Sugestão**: nenhuma.

### `cognito-role-in-custom-attribute`, `cognito-sign-in-and-refresh-tokens` (1.6)

#### 2026-10-15 · 1.6.b · acerto
- **A skill diz**: o trigger de pre token versão 2 (Essentials) põe claims no access token; YAML com `UserPoolTier`, `LambdaConfig.PreTokenGenerationConfig` e a permissão.
- **O que aconteceu**: funcionou no primeiro deploy; o access token trouxe `internalId` e `role`, também depois do refresh.
- **Sugestão**: nenhuma.

#### 2026-10-15 · 1.6.b · lacuna
- **A skill diz**: "a throwing trigger fails the sign-in".
- **O que aconteceu**: faltou como recusar tokens de propósito e reconhecer isso na rota. Em `dev`, o erro lançado pelo trigger chegou ao `InitiateAuth` e ao `GetTokensFromRefreshToken` como `UserLambdaValidationException` com a mensagem `PreTokenGeneration failed with error ACCOUNT_UNAVAILABLE.`: o texto do erro passa adiante, e a rota o usa para responder 403 em vez de 500 (Q146).
- **Sugestão**: uma seção "recusar tokens no trigger" com esse formato de mensagem e o mapeamento na rota.

#### 2026-10-15 · 1.6.c · acerto
- **A skill diz**: com rotação, refresh por `GetTokensFromRefreshToken`, novo refresh token na resposta, reuso do antigo dá `RefreshTokenReuseException`; num client com secret, essa operação leva o secret em si.
- **O que aconteceu**: tudo confirmado em `dev`, inclusive o 401 no reuso; sem precisar do `sub` no corpo.
- **Sugestão**: nenhuma.

### `typescript-di-container`, `wiring-dependencies`

#### 2026-10-15 · Q152 · lacuna
- **A skill diz**: um container com `bind` num ponto de composição único.
- **O que aconteceu**: em Lambda, um arquivo único de bindings importado por todo handler faz cada função carregar todas as implementações (o `signIn` levava o repositório do DynamoDB, o trigger levava o gateway do Cognito), e o container exigiu metadados de decorator no build (`esbuild-plugin-tsc`, `keepNames`). Com os testes recebendo fakes pelo construtor, o container não pagava esse custo; o projeto trocou por fábricas à mão por função.
- **Sugestão**: na `typescript-di-container`, dizer quando não usar um container (uma função por rota, bundles por função) e mostrar a composição por função da `wiring-dependencies` como alternativa.

### `cognito-custom-message-lambda-trigger`, `cognito-password-reset`, `cognito-user-pools` (1.7)

#### 2026-10-15 · 1.7.b · acerto
- **A skill diz**: o trigger só vale com o pool no SES (`DEVELOPER`); com o envio padrão, o Cognito recusa a resposta e todo e-mail falha. O trigger não pode ter variável nem permissão que cite o pool.
- **O que aconteceu**: por isso o pool só passa para o SES e só ganha o trigger quando o stage traz o remetente e a identidade (`Fn::If` na mesma condição); sem os valores, nada muda. O trigger ficou sem variáveis e com a role padrão.
- **Sugestão**: mostrar essa forma condicional, que deixa o `sls package` de PR e o local funcionando sem os valores do stage.

#### 2026-10-15 · 1.7.a · lacuna
- **A skill diz**: qualquer motor de template serve; 20.000 caracteres é o limite, acima do qual o Cognito manda o texto padrão sem erro.
- **O que aconteceu**: com React Email e Tailwind renderizados no trigger, cada e-mail deu ~4.500 caracteres, e o zip do trigger 804 KB. Um teste guarda o marcador `{####}` e o limite. Não há skill de React Email; o projeto seguiu o exemplo do foodiary.
- **Sugestão**: na skill do trigger, o teste do marcador e do tamanho como receita; e uma skill de React Email (templates, Tailwind, render no Lambda e o custo no cold start).

#### 2026-10-15 · 1.7.d · acerto
- **A skill diz**: o "esqueci a senha" responde 204 sempre; depois da redefinição, `AdminUserGlobalSignOut`, cuja falha não derruba a rota.
- **O que aconteceu**: aplicado como está; aqui, além disso, o código só é pedido para conta `ACTIVE` no banco da aplicação (Q162).
- **Sugestão**: nenhuma.

### `cognito-api-gateway-jwt-authorizer` (1.8)

#### 2026-10-15 · 1.8.a · acerto
- **A skill diz**: o authorizer aceita o id token e o access token, a menos que a rota exija o escopo `aws.cognito.signin.user.admin`; ele não consulta o Cognito, então um token de conta desativada passa até expirar.
- **O que aconteceu**: as rotas privadas exigiam o escopo (Q163), e as de `/me` conferiam a conta no banco (Q165). Depois a Q169 tirou o escopo, e o adapter recusa o id token por não ter `internalId` (401). A skill (revista em 2026-10-14) prefere manter o escopo, que dá 403 `insufficient_scope`: ver a revisão de 2026-10-16.
- **Sugestão**: nenhuma.

### `cognito-custom-message-lambda-trigger` (variáveis globais)

#### 2026-10-15 · Q176 · acerto
- **A skill diz** (`built-arn.md`): com as variáveis do pool em `provider.environment`, ligar o trigger por um ARN montado com o nome da função evita o ciclo; marcado como não testado, por depender de o pool aceitar o ARN de uma função que ainda não existe.
- **O que aconteceu**: um stage criado do zero (`envtest`) com o pool apontando para `preTokenGeneration` e `customMessage` por `!Sub …:function:<service>-<stage>-<nome>` subiu sem erro; o cadastro chamou o `customMessage` e o sign-in chamou o `preTokenGeneration` (claims no token). O stage foi removido depois.
- **Sugestão**: tirar a marca de "não testado" e registrar que vale também para o trigger de pre token versão 2.

### `cognito-role-based-route-protection`, `typescript-satisfies` (1.10)

#### 2026-10-15 · 1.10.b · acerto
- **A skill diz**: checar o papel como primeira instrução do handler, antes de validar a entrada, com um 403 único que não diz qual papel serviria; papel desatualizado no token é aceitável para leitura, e a ação sensível relê o papel na fonte. `as const satisfies Record<Role, readonly Permission[]>`, com o `readonly` no tipo.
- **O que aconteceu**: o `Controller` declara a ação, e o `execute` checa antes de validar `params`, `queryParams` e corpo (Q184); a troca de papel relê o chamador dentro da transação (Q181). Um teste de auditoria lê os `sls/functions/*.yml` e chama cada rota `/admin` com token de aluno, esperando 403; tirar a `permission` de um controller fez o teste falhar.
- **Sugestão**: mostrar o teste de auditoria que deriva as rotas da IaC, em vez de listá-las à mão.

### `dynamodb-query-pagination` (1.10)

#### 2026-10-15 · 1.10.c · acerto
- **A skill diz**: com `FilterExpression`, ler `Limit + 1` uma vez só pode encerrar a lista cedo; ler em blocos com teto de requisições, aceitar página curta ou vazia com cursor, e o cursor é a chave do último item devolvido, validada por `z.strictObject` contra a query.
- **O que aconteceu**: a Q89 do projeto ("lendo `Limit + 1`") estava incompleta, e a skill a corrigiu (Q185). Os atributos da chave do cursor saem do próprio schema estrito, uma fonte só. Para provar a página vazia com cursor no teste, os itens mantidos precisam estar a mais de `3 × (limit + 1)` posições de distância.
- **Sugestão**: nenhuma.

### `dynamodb-item-operations` (1.10)

#### 2026-10-15 · 1.10.d · lacuna
- **A skill diz**: condições na própria escrita; transações entre itens aparecem só como menção (a `dynamodb-read-consistency` diz que estão fora dela).
- **O que aconteceu**: a regra "o último admin não pode ser rebaixado" saiu de um `ConditionCheck` sobre o chamador (outro item) na transação que muda o papel do alvo, sem contador nem query (Q181); o índice em `CancellationReasons` separa o chamador (403) do alvo (409). Dois admins rebaixando um ao outro em paralelo sempre deixam um admin (5 de 5 no DynamoDB Local).
- **Sugestão**: cobrir `ConditionCheck` como guarda de autorização ou de invariante em outro item, e a leitura de `CancellationReasons` por posição.

### `dynamodb-key-design` (1.10)

#### 2026-10-15 · 1.10.e · lacuna
- **A skill diz**: um id que ordena por tempo (ULID, KSUID, UUID v7) faz a coleção voltar em ordem de criação.
- **O que aconteceu**: o KSUID guarda o tempo em segundos (ULID e UUID v7, em milissegundos); contas e mudanças de papel criadas no mesmo segundo voltaram na ordem da parte aleatória, e os testes que esperavam ordem de criação falharam.
- **Sugestão**: dizer a resolução de cada formato e que, dentro dela, a ordem é a da parte aleatória.

### `dynamodb-index-overloading` (1.10)

#### 2026-10-15 · 1.10.a · acerto
- **A skill diz**: a entidade escreve os atributos genéricos do índice que usa; o cursor de uma query num GSI leva os quatro atributos de chave.
- **O que aconteceu**: o `AccountItem` gravava `GSI1PK`/`GSI1SK` desde a 1.3, então o `GSI1` nasceu preenchido no deploy; o cursor da lista de usuários valida `GSI1PK` como o papel pedido.
- **Sugestão**: nenhuma.

### `serverless-resources-and-iam` (1.10)

#### 2026-10-15 · 1.10.f · lacuna
- **A skill diz**: cada função recebe só as ações de que precisa.
- **O que aconteceu**: o `ConditionCheck` da troca de papel exige `dynamodb:ConditionCheckItem`, que a role compartilhada não tinha; a primeira troca real em `dev` respondeu 500 (`AccessDeniedException`) e nada foi gravado. Os testes passaram porque o DynamoDB Local não confere IAM. Corrigido no PR #23.
- **Sugestão**: listar a ação IAM de cada operação de `TransactWriteItems` (`Put` → `PutItem`, `Update` → `UpdateItem`, `Delete` → `DeleteItem`, `ConditionCheck` → `ConditionCheckItem`) e lembrar que só a chamada real pega a falta.

### `dynamodb-secondary-indexes` (1.10)

#### 2026-10-15 · 1.10.f · acerto
- **A skill diz** (`changing-indexes.md`): o CloudFormation conclui o deploy sem esperar o backfill; suba o índice antes do código que o consulta.
- **O que aconteceu**: o `GSI1` e as rotas que o consultam foram no mesmo deploy, e o índice ficou em `CREATING` por mais de cinco minutos depois do deploy concluído. As chamadas só começaram com o índice `ACTIVE`, então nada falhou, mas a ordem da skill não foi seguida. O `GSI2` (1.14) vai num deploy antes do código.
- **Sugestão**: nenhuma.

### `cognito-api-gateway-jwt-authorizer`, `cognito-role-based-route-protection` (1.11)

#### 2026-10-15 · 1.11.a · acerto
- **A skill diz**: o authorizer só confere assinatura, emissor, audiência e tempo; um token de conta desativada passa até expirar, e a rota em que uma hora é demais precisa perguntar à fonte a cada requisição.
- **O que aconteceu**: o autor pediu que nenhuma conta que não possa trafegar chegue ao recurso (Q197). O adapter das rotas privadas lê a conta atual no Dynamo com `ConsistentRead` antes do controller, e a permissão passa a usar o papel do banco, não a claim. A skill pergunta ao Cognito (`GetUser`); aqui a fonte é o Dynamo (Q38), o mesmo princípio. Um teste de auditoria chama cada rota privada com uma conta `DISABLED` (403) e cada rota `/admin` com um aluno (403); tirar a checagem de conta ativa fez 5 de 6 rotas falharem.
- **Sugestão**: mostrar a variante em que a fonte da verdade da conta é o banco da aplicação, no adapter, e o custo medido (uma leitura por requisição).

### `cognito-user-pools` (1.11)

#### 2026-10-15 · 1.11.c · lacuna
- **A skill diz**: nada sobre desativar e reativar usuários como operação; `AdminDisableUser` só aparece, em outras skills, pelo efeito sobre tokens.
- **O que aconteceu**: desativar ficou em duas etapas sem `Saga` (Q193): o Dynamo muda primeiro e o Cognito acompanha; se o Cognito falha, a conta fica no estado pedido (já bloqueada pelo adapter e pelo trigger de pre token) e a nova chamada repara o Cognito.
- **Sugestão**: cobrir `AdminDisableUser`/`AdminEnableUser`, o que cada um faz com sessões e refresh tokens, e a ordem com uma base de dados própria.

### `cognito-sign-in-and-refresh-tokens` (1.11)

#### 2026-10-15 · 1.11.e · ambíguo
- **A skill diz**: conta que não pode entrar é recusada pelo trigger de pre token (`UserLambdaValidationException`).
- **O que aconteceu**: com o usuário desativado também no Cognito (`AdminDisableUser`), o Cognito recusa o sign-in antes do trigger, com `NotAuthorizedException` "User is disabled.", que a Q147 mapeia para `401 INVALID_CREDENTIALS`, e não para o `403 ACCOUNT_UNAVAILABLE` da Q146. O refresh deu `401 INVALID_SESSION`. Em `dev`: desativar → `/me` com o token antigo 403 na hora, refresh 401, sign-in 401; reativar → o token antigo volta a passar (o Dynamo decide) e o sign-in 200.
- **Sugestão**: dizer qual barreira responde primeiro quando o usuário está desativado no pool e qual exceção o cliente vê.

### `cognito-sign-in-and-refresh-tokens`, `cognito-api-gateway-jwt-authorizer` (1.12)

#### 2026-10-15 · 1.12 · lacuna
- **A skill diz**: revogar um token é com `RevokeToken`/`GlobalSignOut`, e o authorizer continua aceitando o access token até expirar; a saída é perguntar à fonte em cada requisição.
- **O que aconteceu**: o autor pediu sessão única (Q210): um sign-in derruba os anteriores, um refresh derruba os access tokens anteriores. A primeira proposta (o trigger de pre token gerando um `sessionId` a cada emissão) tinha um buraco: o dispositivo antigo, ao fazer refresh, retomava a sessão. A versão final guarda na conta o `jti` do access token atual e o SHA-256 do refresh token atual; o refresh só gira a sessão com condição sobre o hash do token recebido, e o adapter compara a claim `jti`. Com isso o Cognito deixou de ser barreira (saíram `AdminDisableUser`, `AdminEnableUser` e `AdminUserGlobalSignOut`), o que só vale porque o client tem secret e ninguém chama o Cognito por fora da API.
- **Sugestão**: cobrir "uma sessão por usuário" como receita, com o `jti` e o hash do refresh token na base da aplicação, e o aviso de que gerar a sessão no trigger deixa o dispositivo antigo voltar.

### `cognito-sign-up-and-confirmation` (1.12)

#### 2026-10-15 · Q218 · lacuna
- **A skill diz**: confirmar um usuário já confirmado responde `NotAuthorizedException`.
- **O que aconteceu**: depois de `AdminConfirmSignUp`, um `ConfirmSignUp` com código errado respondeu `CodeMismatchException` (o 400 `INVALID_CODE` da rota), não `NotAuthorizedException`; o reparo da Q139 só roda com o código certo. O teste automatizado contra `dev` ativa a conta escrevendo o que a confirmação escreve.
- **Sugestão**: dizer que a exceção depende do código enviado, e mostrar como testar contra um ambiente real sem caixa de e-mail (simulador do SES, `AdminConfirmSignUp`).

### `typescript-branded-types` (1.13)

#### 2026-10-15 · 1.13.a · acerto
- **A skill diz**: o brand é `string & { readonly __brand }`, concedido só por uma função que valida antes.
- **O que aconteceu**: `Account.Id` e `Course.Id` com `toId` (formato KSUID) e `isId` como guard. Trocar só o tipo do campo deu 4 erros: um id com brand entra onde se espera `string`, então a proteção só aparece quando as assinaturas (repositórios, use cases, `Controller.Request`) pedem o brand. Id de rota malformado vira 400 no Zod, e id de token malformado vira 401, sem leitura no banco.
- **Sugestão**: dizer que a migração começa pelas assinaturas que recebem o id, não pelo campo da entidade.

### `dynamodb-denormalization` (1.13)

#### 2026-10-15 · 1.13.d · acerto
- **A skill diz**: cada cópia tem um dono que a mantém, e quem escreve sabe onde estão as cópias.
- **O que aconteceu**: o `instructorName` do curso é mantido pelo `PATCH /me`, que acha os cursos pelo `GSI1` (`INSTRUCTOR#<id>`, só `PK` e `SK` projetados) e grava em transações de até 100 `Update` condicionados ao `instructorId`. Repetir o mesmo nome completa o que uma falha deixou.
- **Sugestão**: nenhuma.

### `dynamodb-item-operations`, `dynamodb-one-to-many-relationships` (1.14)

#### 2026-10-15 · 1.14.a · lacuna
- **A skill diz**: transações aparecem como ferramenta (itens que existem juntos), sem um padrão para juntar escritas de repositórios diferentes.
- **O que aconteceu**: nasceu a `UnitOfWork` (Q87, Q224): cada repositório devolve operações opacas para a aplicação, cada uma com o erro de domínio da sua condição; a unidade envia tudo numa `TransactWriteItems`, repete `TransactionConflict` até 3 vezes e traduz `ConditionalCheckFailed` pelo índice do `CancellationReasons`. Criar uma aula grava sumário, conteúdo e `ADD lessonCount` no curso na mesma transação.
- **Sugestão**: uma skill de unidade de trabalho em DynamoDB (operações por repositório, limite de 100, retry de conflito, tradução por índice).

#### 2026-10-15 · 1.14.e · acerto
- **A skill diz**: a ordem de uma coleção que o usuário reordena é um atributo, não a chave; mover entre pais com chave hierárquica é delete + put.
- **O que aconteceu**: o `PUT /outline` grava só o que mudou de lugar (reposicionar = 1 operação, trocar de módulo = 2) e recusa mais de 100. Um fake em memória que devolvia uma operação por movimentação escondeu o limite: um fake que conta operações precisa devolver as mesmas que o repositório real.
- **Sugestão**: nenhuma.

### `dynamodb-secondary-indexes` (1.15)

#### 2026-10-15 · 1.15.a · acerto
- **A skill diz** (`changing-indexes.md`): suba o índice antes do código que o consulta; o deploy termina antes do backfill.
- **O que aconteceu**: o `GSI2` foi num PR e num deploy próprios (Q236). O deploy terminou com o índice em `CREATING`, e ele só ficou `ACTIVE` uns 20 minutos depois, numa tabela com poucas dezenas de itens. O PR do código só abriu depois. As contas, que já gravavam `GSI2PK = EMAIL#…`, entraram no índice sem efeito.
- **Sugestão**: registrar que até uma tabela pequena leva dezenas de minutos para criar um índice, para ninguém ler o `CREATING` como erro.

#### 2026-10-15 · 1.15.b · acerto
- **A skill diz**: um índice esparso só recebe os itens com os atributos de chave.
- **O que aconteceu**: só o curso publicado tem `GSI2PK`/`GSI2SK` (`CATALOG` / `<publishedAt>#<id>`), gravados no mesmo `Update` do status; arquivar remove as duas chaves. Com `ReturnValuesOnConditionCheckFailure: 'ALL_OLD'`, o item antigo diz por que a condição falhou (sem item, arquivado, rascunho sem aula). O `Item` do erro vem como `AttributeValue` (`status.S`) mesmo pelo DocumentClient.
- **Sugestão**: avisar que o `Item` de `ConditionalCheckFailedException` não é desserializado pelo DocumentClient.

### `using-test-doubles`, `designing-testable-code` (R.2)

#### 2026-10-16 · R.2 · erro
- **A skill diz**: quando o comportamento depende de estado (gravar e depois ler), use um fake, como um repositório em memória, e mantenha o teste unitário. Ela justifica: um repositório real não responde "não encontrado" de forma confiável.
- **O que aconteceu**: o `InMemoryAccountRepository` reimplementava à mão as condições que o DynamoDB avalia (admin ativo no `ConditionCheck`, papel e status anteriores, hash do refresh token na rotação). Os testes conferiam o objeto que o próprio fake tinha mutado, não o que ficou gravado. Contra o DynamoDB Local, os mesmos casos provam a condição real, e ids KSUID aleatórios e e-mails únicos tornam o "não encontrado" estável. A recusa de quem deixou de ser admin ativo ao trocar o status nunca tinha sido testada. Ficaram 14 arquivos de teste no DynamoDB Local, 193 linhas de fake a menos, e falhas de infraestrutura simuladas com `vi.spyOn` no repositório real.
- **Sugestão**: quando o repositório põe regra na escrita (condição, transação) e a base tem emulador local, testar contra o emulador; reservar o fake para serviços sem emulador (aqui, o Cognito). Um fake de repositório condicional é uma segunda implementação das regras, sem teste que prove que as duas concordam.

### `dynamodb-many-to-many-relationships`, `dynamodb-denormalization` (2.1)

#### 2026-10-16 · 2.1.a · lacuna
- **A skill diz**: um item de associação por par, com as chaves invertidas no `GSI1`, e o contador escrito na mesma transação do par.
- **O que aconteceu**: a matrícula é um par que sai e volta (cancelamento lógico, Q49). Só a ativa tem `GSI1PK`/`GSI1SK`, o que torna a lista de alunos do curso um índice esparso. Cancelar remove as duas chaves; rematricular as regrava com o `enrolledAt` original, e o aluno volta ao mesmo lugar da lista. O contador é assimétrico: `+1` exige o curso `PUBLISHED`, mas `-1` exige só que o curso exista, para que o aluno possa sair de um curso arquivado.
- **Sugestão**: cobrir o par com estado (ativo/cancelado): o índice esparso na direção invertida, a regravação das chaves ao reativar e a condição diferente para cada sentido do contador.

#### 2026-10-16 · 2.1.c · lacuna
- **A skill diz** (`dynamodb-denormalization`): propague a cópia pelos itens que a carregam, achados pelo índice.
- **O que aconteceu**: o índice de alunos só tem as matrículas ativas. Propagar o `studentName` por ele deixaria as canceladas com o nome antigo, e elas voltam à lista na rematrícula. A propagação lê a partição do aluno (`ACCOUNT#a`, `begins_with ENROLLMENT#`), onde estão todas, em transações de até 100.
- **Sugestão**: avisar que propagar por um índice esparso só alcança os itens que estão nele; propague pela coleção que contém todas as cópias.

### `dynamodb-many-to-many-relationships`, `dynamodb-query-pagination` (2.2)

#### 2026-10-16 · 2.2.a · lacuna
- **A skill diz**: o lado da tabela de um par lê a coleção com uma Query; um filtro tira os itens que não interessam.
- **O que aconteceu**: o SK da matrícula é `ENROLLMENT#<courseId>`, então a Query da tabela ordena pelo curso, não pela data da matrícula, e paga pelas canceladas que o filtro descarta. Um segundo índice esparso (`GSI2`, só ativas, `<enrolledAt>#<courseId>`) deu a ordem pedida e páginas sem leitura desperdiçada. O custo é uma escrita de índice por matrícula, que compensa numa lista lida muito mais do que escrita.
- **Sugestão**: quando a ordem pedida não é a do SK, ou o filtro descarta boa parte, comparar o custo de leitura com o de um índice esparso na direção da tabela, e não só na direção invertida.

#### 2026-10-16 · 2.2.b · acerto
- **A skill diz**: busque os itens referenciados com `BatchGetItem` e peça de novo as `UnprocessedKeys`.
- **O que aconteceu**: uma página tem no máximo 100 matrículas, então os cursos dela cabem num `BatchGet`. As chaves não processadas são pedidas de novo até três vezes; se ainda sobrar alguma, a requisição falha em vez de devolver uma lista incompleta como se estivesse completa. A ação IAM `BatchGetItem` entrou no mesmo commit (Q192).
- **Sugestão**: nenhuma.

### `dynamodb-read-consistency` (2.3)

#### 2026-10-16 · 2.3.c · acerto
- **A skill diz**: leia com consistência forte o item que decide um acesso logo depois de uma escrita; o índice só lê eventual.
- **O que aconteceu**: abrir aula lê a matrícula pela chave da tabela (`ACCOUNT#a` / `ENROLLMENT#c`) com `ConsistentRead`, nunca pelo `GSI2` da lista, então quem acabou de se matricular abre a aula na mesma hora. As três leituras (curso, matrícula, conteúdo) não dependem uma da outra e saem em paralelo; nada é devolvido antes da regra de acesso (Q275).
- **Sugestão**: nenhuma.

### `serverless-http-api-events` (2.3)

#### 2026-10-16 · 2.3 · lacuna
- **A skill diz**: declare a rota em `events.httpApi` com `{param}` no caminho; o Framework cria a rota e a permissão.
- **O que aconteceu**: renomear `{id}` para `{accountId}` (Q272) quebrou o deploy, com `ConflictException: conflicting variable on the same hierarchical level`. O nome da variável faz parte do id lógico da rota, então o CloudFormation cria a rota nova antes de apagar a antiga, e o HTTP API não aceita duas variáveis diferentes no mesmo nível. A stack voltou atrás. A saída foram dois deploys: um sem as rotas e outro com os nomes novos (Q277).
- **Sugestão**: avisar que o nome do parâmetro de rota não muda num deploy só; escolher os nomes certos desde a primeira rota, ou planejar a troca em dois deploys.

### `dynamodb-item-operations`, `dynamodb-denormalization` (2.4)

#### 2026-10-16 · 2.4.a · acerto
- **A skill diz**: "uma vez só" é um Put com `attribute_not_exists`; o contador sobe na mesma transação, então uma repetição não conta duas vezes.
- **O que aconteceu**: concluir aula é uma transação com o `Put` condicional do progresso, o `ADD completedLessons 1` na matrícula `ACTIVE` e um `ConditionCheck` no conteúdo da aula (`courseId` igual ao da rota), que prova que a aula é do curso sem precisar do módulo. Quando quem falha é o `Put`, a falha vira `AlreadyCompleted`, e o use case responde 200 sem gravar nada. A operação fica idempotente sem uma leitura antes.
- **Sugestão**: mostrar que a condição que falhou, identificada pela posição em `CancellationReasons`, pode virar a resposta idempotente, em vez de exigir uma leitura prévia.

#### 2026-10-16 · 2.4.d · acerto
- **A skill diz**: transação só quando duas escritas precisam andar juntas; ela custa o dobro.
- **O que aconteceu**: salvar a posição, a rota mais chamada (a cada 15 a 30 s), lê a matrícula com consistência forte e faz um `Put` simples: 2 RCU (a conta, que o adapter lê em toda rota privada, e a matrícula) + 1 WCU, contra cerca de 4 WCU com `ConditionCheck` em transação. A primeira conta deu 1 RCU porque esqueceu a leitura da conta; o curso, que custava mais 0,5, só é lido quando a matrícula não está ativa (R.4). Se o aluno cancelar no meio, sobra só uma posição gravada a mais, sem dano.
- **Sugestão**: nenhuma.

### `dynamodb-denormalization`, `dynamodb-many-to-many-relationships` (2.5)

#### 2026-10-16 · 2.5.a · acerto
- **A skill diz**: a soma e a contagem ficam no pai e mudam com `ADD` na mesma transação; editar soma a diferença; a média é calculada na leitura.
- **O que aconteceu**: criar uma avaliação soma a nota e 1; editar soma só a diferença, com o `Update` condicionado à nota lida (uma trava otimista: duas edições ao mesmo tempo não aplicam a mesma diferença duas vezes). A matrícula ativa entra como `ConditionCheck` na transação, e não como leitura antes, porque a avaliação é rara e mexe num número público. Os cursos antigos não têm `ratingSum`/`ratingCount`, que são lidos como 0, e o `ADD` cria os atributos na primeira avaliação.
- **Sugestão**: mostrar a trava otimista na edição de um valor que alimenta um contador; sem ela, a diferença é calculada a partir de uma leitura velha.

#### 2026-10-16 · 2.5.d · lacuna
- **A skill diz**: o lado invertido no `GSI1` lista os pares de um item.
- **O que aconteceu**: a lista pública não pode expor o `accountId`, que está no SK do índice (`REVIEW#<createdAt>#<accountId>`) e no cursor. O item da resposta é montado sem o id. O cursor, porém, é a chave codificada em base64url e carrega o `accountId` do último item da página.
- **Sugestão**: avisar que o cursor de uma lista pública carrega a chave da tabela, mesmo quando a lista vem de um índice. Se um id não deve sair da API, ou ele fica fora da chave, ou o cursor é cifrado. Aqui o risco foi aceito (Q286).

### Revisão de 2026-10-16: skills de DynamoDB nunca registradas e `/code-review` de `src/` (R.4)

#### 2026-10-16 · revisão · lacuna (`dynamodb-capacity-and-pricing`)
- **A skill diz**: a escrita é cobrada pelo item inteiro, não pela mudança; uma transação custa o dobro; um índice `ALL` soma as unidades da entrada.
- **O que aconteceu**: os contadores do curso ficam no item que carrega a descrição (até 5.000 caracteres). Cada matrícula ou avaliação reescreve esse item inteiro, em dobro, mais as entradas do `GSI1` e do `GSI2`: de 8 a 24 WCU só no curso. A conta da rota mais chamada (salvar a posição) esqueceu a leitura da conta que o adapter faz em toda rota privada. Separar a descrição ficou para a fase 3 (Q287).
- **Sugestão**: uma tabela de unidades por operação de transação, com `ConditionCheck` e escrita em índice; e o aviso de que contadores quentes devem morar num item pequeno.

#### 2026-10-16 · revisão · acerto (`dynamodb-document-client`)
- **A skill diz**: um cliente único, comandos do `lib-dynamodb`, exceções do `client-dynamodb`.
- **O que aconteceu**: tudo isso está em `src/infra/clients/dynamoClient.ts` e só na infraestrutura. A lacuna do `Item` em `AttributeValue` no erro já está registrada na 1.15.b.
- **Sugestão**: nenhuma.

#### 2026-10-16 · revisão · acerto (`dynamodb-queries`)
- **A skill diz** (`prefix-queries.md`): um prefixo sem separador final casa ids mais longos, a menos que os ids tenham tamanho fixo.
- **O que aconteceu**: o progresso lê `begins_with PROGRESS#<courseId>` sem `#` final de propósito, para trazer junto a posição (`PROGRESS#c`). É seguro porque o KSUID tem 27 caracteres fixos.
- **Sugestão**: nenhuma.

#### 2026-10-16 · revisão · acerto e erro de processo (`dynamodb-schema-evolution`)
- **A skill diz**: atributo novo ganha valor padrão no mapper; item que precisa aparecer num índice novo pede backfill.
- **O que aconteceu**: `ratingSum`/`ratingCount` e o `lessonCount` do módulo têm padrão 0 no mapper, e o `ADD` cria o atributo na primeira escrita. Quando o `GSI2` entrou na matrícula (2.2), o backfill não foi planejado; só a consulta a `dev` mostrou que não havia matrícula a migrar. O mesmo se repetiu com o contador do módulo (R.4), agora conferido antes.
- **Sugestão**: no `process-log`, a etapa de "índice ou atributo novo" passa a ter a pergunta "o que já está gravado precisa entrar?".

#### 2026-10-16 · revisão · acerto (`dynamodb-one-to-one-relationships`)
- **A skill diz**: "Keep two items when one part… changes much more often… on a hot path".
- **O que aconteceu**: a posição do aluno (`PROGRESS#c`), gravada a cada 15 a 30 s, é um 1:1 com a matrícula num item à parte; não reescreve a matrícula nem os seus dois índices.
- **Sugestão**: nenhuma.

#### 2026-10-16 · revisão · acerto (`dynamodb-single-table-design`, `dynamodb-tables-and-keys`)
- **A skill diz**: uma tabela, chaves genéricas `PK`/`SK`, padrões de acesso primeiro.
- **O que aconteceu**: os padrões 1 a 22 do `data-model` são servidos por chave ou por dois GSIs genéricos, sem scan; a tabela (`MainTable.yml`) e a do DynamoDB Local seguem a regra de `KeyType` revista em 2026-10-14.
- **Sugestão**: nenhuma.

#### 2026-10-16 · R.4 · lacuna (`dynamodb-read-consistency`)
- **A skill diz**: leitura eventual por padrão; forte onde a leitura decide uma escrita.
- **O que aconteceu**: o editor de outline decidia sobre uma leitura eventual ("o módulo está vazio?", "o módulo existe?", "os itens batem?"), e a escrita não segurava a decisão. Uma aula podia ficar num módulo apagado, invisível mas contada no curso. A correção foi um contador no módulo, segurado pelas próprias transações, e leitura forte nas rotas de edição (Q288). O `/code-review` achou; as auditorias por skill, não.
- **Sugestão**: avisar que uma checagem de "vazio" ou "existe" feita por query precisa ser segurada na escrita (contador condicional ou `ConditionCheck`), não só lida com consistência forte.

### `serverless-lambda-functions` (R.4)

#### 2026-10-16 · Q291 · acerto
- **A skill diz**: não deixar rotas simples no padrão de 1024 MB; baixar a memória em passos, comparando a duração.
- **O que aconteceu**: medido em `dev` com o `e2e:dev` (linhas `REPORT` no Logs Insights, por função). 512 MB deu as mesmas durações que 1024 MB. 256 MB deixou 34 de 37 funções de 1,5 a 3,2 vezes mais lentas (as 3 que esperam o Cognito, de 14% a 17%), porque a CPU acompanha a memória e o trabalho é CPU (SDK, JSON, Zod). Com o dobro do tempo e metade da memória, o custo empata e a latência dobra. Ficou 512 MB, com metade do custo de 1024 MB. O pico de memória usada (cerca de 156 MB) não decide o valor; quem decide é a CPU.
- **Sugestão**: dizer que o passo é julgado por função, e não no agregado; e que, abaixo do ponto em que a duração dobra, a economia some.

## Skills que faltam

| Tema | Onde apareceu |
|---|---|
| ESLint e Prettier em projeto TypeScript | PLAN-6 |
| commitlint, hooks de git, lint-staged | PLAN-6 |
| URL ou cookie assinado do CloudFront para arquivos privados | Q54, Q69 |
| Vídeo em streaming adaptativo (HLS, MediaConvert) | Q54 |
| Permissões mínimas para deployar com o Serverless (role de deploy por projeto, permissions boundary para as roles que o deploy cria, role por função com o boundary) | Q118, Q121, 1.4.g |
| Role da AWS para GitHub Actions por OIDC (inclui o `sub` imutável `repo:<owner>@<id>/<repo>@<id>:…`, padrão neste repositório) | 1.1.c |
| Domínio próprio no API Gateway HTTP API (ACM por DNS, `DomainName`, `ApiMapping`, registro alias, desligar o endpoint padrão) | Q157 |
| GitHub Environments com OIDC da AWS (o `sub` vira `environment:<nome>`; a trust policy e a restrição de branch do Environment) | Q158 |
| React Email em Lambda (templates, Tailwind, render no trigger, tamanho do bundle) | Q161 |
| Manter a tabela do DynamoDB Local igual à IaC (`MainTable.yml`) nos testes de integração | Q189, 1.10.a |
| Testes de ponta a ponta contra um stage deployado com contas descartáveis (sem caixa de e-mail, limpeza no fim) | Q218 |
| Unidade de trabalho em DynamoDB entre repositórios (operações, limite de 100, retry de `TransactionConflict`, tradução de `CancellationReasons`) | 1.14 |
| E-mail transacional pelo SES em Lambda (`sesv2`, saída da sandbox, configuration set, bounce e complaint pelo SNS, lista de supressão) | Q37, Q161, fase 3 |
| Fan-out de um stream do DynamoDB para várias filas (Lambda roteadora ou EventBridge Pipes) | Q90 |
| Configuração do índice Algolia como código (`searchableAttributes`, `customRanking`, réplicas, facets) | Q66, Q91 |
| Alarmes de consumidor de stream (`IteratorAge`, `Errors` da Lambda) | Q90, Q92 |
| Job longo em lotes além de 15 min (estado, continuação reenfileirada, `DeleteObjects`) | Q86 |
| URL pré-assinada para `<video>` (requisições por faixa, validade, sessão da role) | Q54 |
| Write sharding de partição quente de GSI e leitura scatter-gather com cursor mesclado | Q75, Q101 |
| Cookie `HttpOnly` de refresh no HTTP API com SPA em outro subdomínio (`SameSite`, CORS com credenciais) | Q149 |
