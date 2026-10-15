import { MalformedBody } from '@application/errors/MalformedBody';

export function lambdaBodyParser(body: string | undefined): unknown {
  if (!body) {
    return {};
  }

  try {
    return JSON.parse(body) as unknown;
  } catch {
    throw new MalformedBody();
  }
}
