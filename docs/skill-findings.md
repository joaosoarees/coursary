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

## Skills que faltam

| Tema | Onde apareceu |
|---|---|
| ESLint e Prettier em projeto TypeScript | PLAN-6 |
| commitlint, hooks de git, lint-staged | PLAN-6 |
| URL ou cookie assinado do CloudFront para arquivos privados | Q54, Q69 |
| Vídeo em streaming adaptativo (HLS, MediaConvert) | Q54 |
| Permissões mínimas para deployar com o Serverless (role de deploy por projeto) | Q118 |
