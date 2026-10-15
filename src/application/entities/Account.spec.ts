import { describe, expect, it } from 'vitest';

import { Account, normalizeEmail } from '@application/entities/Account';

describe('Account.create', () => {
  it('should start as a pending student', () => {
    const account = Account.create({ name: 'Ana', email: 'ana@example.com' });

    expect(account.role).toBe('student');
    expect(account.status).toBe('PENDING');
    expect(account.externalId).toBeUndefined();
  });

  it('should give the account a KSUID', () => {
    const account = Account.create({ name: 'Ana', email: 'ana@example.com' });

    expect(account.id).toMatch(/^[0-9A-Za-z]{27}$/);
  });

  it('should give later accounts ids that sort after earlier ones', async () => {
    const first = Account.create({ name: 'Ana', email: 'ana@example.com' });
    await new Promise((resolve) => setTimeout(resolve, 1100));
    const second = Account.create({ name: 'Bia', email: 'bia@example.com' });

    expect(first.id < second.id).toBe(true);
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
