import { Injectable } from '@kernel/decorators/Injectable';

function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} is not set.`);
  }

  return value;
}

@Injectable()
export class AppConfig {
  get mainTableName(): string {
    return requiredEnv('MAIN_TABLE_NAME');
  }
}
