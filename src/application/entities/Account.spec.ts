import { describe, expect, it } from 'vitest';

import { Account, normalizeEmail } from '@application/entities/Account';
import { isAccountId } from '@application/entities/AccountId';

describe('Account.create', () => {
  it('should start as a pending student', () => {
    const account = Account.create({ name: 'Ana', email: 'ana@example.com' });

    expect(account.role).toBe('student');
    expect(account.status).toBe('PENDING');
    expect(account.externalId).toBeUndefined();
  });

  it('should give the account a KSUID', () => {
    const account = Account.create({ name: 'Ana', email: 'ana@example.com' });

    expect(isAccountId(account.id)).toBe(true);
  });

  it('should trim the name and normalize the e-mail', () => {
    const account = Account.create({
      name: '  Ana Souza ',
      email: ' Ana@Example.COM ',
    });

    expect(account.name).toBe('Ana Souza');
    expect(account.email).toBe('ana@example.com');
  });
});

describe('normalizeEmail', () => {
  it('should trim and lower-case the address', () => {
    expect(normalizeEmail('  Rui@Example.com')).toBe('rui@example.com');
  });
});
