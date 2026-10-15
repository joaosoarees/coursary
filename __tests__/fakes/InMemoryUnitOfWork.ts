import type { UnitOfWork } from '@application/contracts/UnitOfWork';

// What the in-memory repositories hand to this unit of work: every check runs
// before any change, so a refused operation leaves nothing changed.
export interface InMemoryOperation {
  check?: () => Error | undefined;
  apply: () => void;
}

export class InMemoryUnitOfWork implements UnitOfWork {
  private readonly operations: InMemoryOperation[] = [];

  add(...operations: UnitOfWork.Operation[]): void {
    this.operations.push(...(operations as unknown as InMemoryOperation[]));
  }

  commit(): Promise<void> {
    for (const operation of this.operations) {
      const error = operation.check?.();

      if (error) {
        return Promise.reject(error);
      }
    }

    for (const operation of this.operations) {
      operation.apply();
    }

    return Promise.resolve();
  }

  static operation(operation: InMemoryOperation): UnitOfWork.Operation {
    return operation as unknown as UnitOfWork.Operation;
  }
}
