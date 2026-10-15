# coursary-api

API serverless de uma plataforma de cursos: Lambda, API Gateway, Cognito e DynamoDB em single-table design, com Serverless Framework e TypeScript.

É um projeto de estudo. O objetivo é usar cada skill de DynamoDB, Cognito, Serverless e TypeScript instalada num caso real e anotar onde ela acertou ou falhou.

## Documentação

- [Planejamento e decisões](PLANNING.md)
- [Modelo de dados](docs/data-model.md)
- [Achados sobre as skills](docs/skill-findings.md)
- [Registro do processo de planejamento](docs/process-log.md)

## Requisitos

- Node.js 24 (`.nvmrc`)
- pnpm 12

## Comandos

| Comando | O que faz |
|---|---|
| `pnpm install` | Instala as dependências e os hooks de git |
| `pnpm typecheck` | Checa os tipos |
| `pnpm lint` | Roda o ESLint |
| `pnpm format` | Formata com o Prettier |
