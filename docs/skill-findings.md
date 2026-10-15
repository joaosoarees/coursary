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

## Skills que faltam

| Tema | Onde apareceu |
|---|---|
| ESLint e Prettier em projeto TypeScript | PLAN-6 |
| commitlint, hooks de git, lint-staged | PLAN-6 |
| URL ou cookie assinado do CloudFront para arquivos privados | Q54, Q69 |
| Vídeo em streaming adaptativo (HLS, MediaConvert) | Q54 |
| Permissões mínimas para deployar com o Serverless (role de deploy por projeto, permissions boundary para as roles que o deploy cria, role por função com o boundary) | Q118, Q121, 1.4.g |
| Role da AWS para GitHub Actions por OIDC (inclui o `sub` imutável `repo:<owner>@<id>/<repo>@<id>:…`, padrão neste repositório) | 1.1.c |
