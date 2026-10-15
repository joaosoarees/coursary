import { type AccountId, newAccountId } from '@application/entities/AccountId';

export const accountRoles = {
  Student: 'student',
  Instructor: 'instructor',
  Admin: 'admin',
} as const;

export type AccountRole = (typeof accountRoles)[keyof typeof accountRoles];

export const accountStatuses = {
  Pending: 'PENDING',
  Active: 'ACTIVE',
  Disabled: 'DISABLED',
} as const;

export type AccountStatus =
  (typeof accountStatuses)[keyof typeof accountStatuses];

export interface AccountAttributes {
  id: AccountId;
  externalId: string | undefined;
  email: string;
  name: string;
  role: AccountRole;
  status: AccountStatus;
  createdAt: Date;
}

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class Account {
  readonly id: AccountId;
  externalId: string | undefined;
  readonly email: string;
  name: string;
  role: AccountRole;
  status: AccountStatus;
  readonly createdAt: Date;

  constructor(attributes: AccountAttributes) {
    this.id = attributes.id;
    this.externalId = attributes.externalId;
    this.email = normalizeEmail(attributes.email);
    this.name = attributes.name;
    this.role = attributes.role;
    this.status = attributes.status;
    this.createdAt = attributes.createdAt;
  }

  static create({ name, email }: { name: string; email: string }): Account {
    return new Account({
      id: newAccountId(),
      externalId: undefined,
      email,
      name: name.trim(),
      role: accountRoles.Student,
      status: accountStatuses.Pending,
      createdAt: new Date(),
    });
  }
}
