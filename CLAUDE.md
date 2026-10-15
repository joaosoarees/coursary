# Coursary API

API serverless de uma plataforma de cursos (Lambda + DynamoDB single-table). O projeto existe para exercitar as skills instaladas e registrar onde cada uma acerta ou falha.

## Onde está cada coisa

- `PLANNING.md`: todas as decisões, numeradas (Q1, Q2…). Antes de propor algo, confira se já foi decidido.
- `docs/data-model.md`: ERD, padrões de acesso, quadro de entidades, índices, cópias e contadores.
- `docs/skill-findings.md`: achados sobre as skills e skills que faltam.
- `docs/process-log.md`: o método de planejamento, para uma futura skill de projeto novo.
- Quadro de tarefas: https://claude.ai/artifact/2Q6GjZ5cPXusYktJJw4LNj

## Como trabalhar

- **"Começar tarefa X.X"**: atualizar a `develop`, criar `feat/X.X-<slug>` a partir dela, propor as sub-imp e só implementar depois do acordo.
- **Commits pequenos**, um por passo coeso, em Conventional Commits e em inglês. Nada de commit em `main` ou `develop` (ruleset e hook recusam). Branch, commit, push e PR para a `develop` são livres; **o merge só com a autorização do o autor** (merge commit, sem squash). O merge na `develop` deploya `dev` pelo CI (Q131).
- **Necessidade → implementação** (Q112): nenhuma abstração, operação, índice ou permissão antes da história que a usa.
- **A aplicação é a fonte da verdade** (Q38): serviços externos ficam atrás de portas.
- **Comentários só quando muito úteis.**
- Toda rota nova entra em `docs/api/coursary-api.postman_collection.json` (importável no Yaak) no mesmo PR.
- Ao fechar uma sub-imp: registrar os achados no quadro e em `docs/skill-findings.md`; atualizar `docs/data-model.md` se alguma chave ou item mudou.
- Confie no código, não em documentação antiga: nenhum `CLAUDE.md` por pasta (Q107).

## Comandos

```bash
pnpm install
pnpm typecheck
pnpm lint
pnpm format
```
