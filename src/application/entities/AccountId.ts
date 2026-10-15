import KSUID from 'ksuid';

export type AccountId = string & { readonly __brand: 'AccountId' };

const KSUID_PATTERN = /^[0-9A-Za-z]{27}$/;

export function isAccountId(value: string): value is AccountId {
  return KSUID_PATTERN.test(value);
}

export function toAccountId(value: string): AccountId {
  if (!isAccountId(value)) {
    throw new TypeError(`Not an account id: ${JSON.stringify(value)}`);
  }

  return value;
}

export function newAccountId(): AccountId {
  return toAccountId(KSUID.randomSync().string);
}
