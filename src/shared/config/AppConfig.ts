function requiredEnv(name: string): string {
  const value = process.env[name];

  if (!value) {
    throw new Error(`Environment variable ${name} is not set.`);
  }

  return value;
}

export class AppConfig {
  get mainTableName(): string {
    return requiredEnv('MAIN_TABLE_NAME');
  }

  get cognitoPoolId(): string {
    return requiredEnv('COGNITO_POOL_ID');
  }

  get cognitoClientId(): string {
    return requiredEnv('COGNITO_CLIENT_ID');
  }

  get cognitoClientSecret(): string {
    return requiredEnv('COGNITO_CLIENT_SECRET');
  }
}
