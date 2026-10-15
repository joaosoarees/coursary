# Modelo de dados

Documento da história PLAN-3. Segue o processo de `dynamodb-single-table-design`: ERD → lista de padrões de acesso → quadro de entidades (PK/SK) → índices secundários → desnormalização e contadores → validação.

As decisões que justificam cada parte estão em `PLANNING.md` (número da pergunta entre parênteses).

## 1. ERD

Tipos genéricos e sem chaves: as chaves saem do passo 3. O item de unicidade `EMAIL#` e os itens de idempotência da fila são físicos e não aparecem aqui.

```mermaid
erDiagram
  ACCOUNT ||--o{ COURSE : instrui
  ACCOUNT ||--o{ ENROLLMENT : "se matricula"
  COURSE ||--o{ ENROLLMENT : recebe
  COURSE ||--o{ MODULE : tem
  MODULE ||--o{ LESSON : tem
  ENROLLMENT ||--o{ LESSON_PROGRESS : registra
  LESSON ||--o{ LESSON_PROGRESS : "concluída em"
  ACCOUNT ||--o{ REVIEW : escreve
  COURSE ||--o{ REVIEW : recebe
  ACCOUNT ||--o{ ROLE_CHANGE : "sofre ou faz"
  ACCOUNT ||--o{ FILE : "é dono de"
  COURSE ||--o{ FILE : "é dono de"
  LESSON ||--o{ FILE : "é dono de"
  COURSE ||--o{ STUDENT_EXPORT : gera

  ACCOUNT {
    string id
    string externalId
    string email
    string name
    string role
    string status
    string createdAt
  }
  COURSE {
    string id
    string instructorId
    string title
    string description
    string status
    number lessonCount
    number enrollmentCount
    number ratingSum
    number ratingCount
    string publishedAt
    string createdAt
  }
  MODULE {
    string id
    string courseId
    string title
    number position
  }
  LESSON {
    string id
    string moduleId
    string title
    string body
    number durationMinutes
    number position
  }
  ENROLLMENT {
    string accountId
    string courseId
    string status
    number completedLessons
    string lastLessonId
    number lastPositionSeconds
    string enrolledAt
  }
  LESSON_PROGRESS {
    string accountId
    string courseId
    string lessonId
    string completedAt
  }
  REVIEW {
    string accountId
    string courseId
    number rating
    string comment
    string createdAt
    string updatedAt
  }
  ROLE_CHANGE {
    string id
    string accountId
    string changedBy
    string fromRole
    string toRole
    string changedAt
  }
  FILE {
    string id
    string ownerType
    string ownerId
    string purpose
    string status
    string originalKey
    string variants
    string contentType
    number size
    number position
    string createdAt
  }
  STUDENT_EXPORT {
    string id
    string courseId
    string requestedBy
    string status
    string fileKey
    string createdAt
  }
```

### Valores fechados

| Atributo | Valores | Decisão |
|---|---|---|
| `Account.role` | `student`, `instructor`, `admin` | Q20, Q43 |
| `Account.status` | `PENDING`, `ACTIVE`, `DISABLED` (`DELETED` como evolução) | Q39, Q56 |
| `Course.status` | `DRAFT`, `PUBLISHED`, `ARCHIVED` | Q10 |
| `Enrollment.status` | `ACTIVE`, `CANCELLED` | Q49 |
| `File.ownerType` | `account`, `course`, `lesson` | Q53 |
| `File.purpose` | `avatar` (conta), `cover` (curso), `attachment` e `video` (aula) | Q53, Q54 |
| `File.status` | `PENDING`, `UPLOADED`, `PROCESSED`, `FAILED` | Q53 |

### Regras que o modelo precisa respeitar

- Uma avaliação por par aluno + curso, que sobrevive ao cancelamento (Q47).
- Rematrícula reativa a mesma matrícula e mantém o progresso (Q49).
- Curso publicado ganha aulas, não perde; curso em rascunho pode ser apagado com módulos e aulas, sem progresso a perder (Q24, Q51).
- Avatar e capa: um atual por dono; trocar apaga os arquivos antigos (Q50, Q53).
- Só matrícula `ACTIVE` acessa material e vídeo (Q58).
- Sem versionamento de curso (Q59).
