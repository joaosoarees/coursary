type Compensation = () => Promise<void>;

export class Saga {
  private readonly compensations: Compensation[] = [];

  addCompensation(compensation: Compensation): void {
    this.compensations.unshift(compensation);
  }

  async run<TResult>(work: () => Promise<TResult>): Promise<TResult> {
    try {
      return await work();
    } catch (error) {
      await this.compensate();
      throw error;
    }
  }

  private async compensate(): Promise<void> {
    for (const compensation of this.compensations) {
      try {
        await compensation();
      } catch (error) {
        console.error(
          JSON.stringify({
            event: 'CompensationFailed',
            error: error instanceof Error ? error.message : String(error),
          }),
        );
      }
    }
  }
}
