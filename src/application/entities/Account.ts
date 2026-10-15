import KSUID from 'ksuid';

export const accountRoles = {
  Student: 'student',
  Instructor: 'instructor',
  Admin: 'admin',
} as const;

export const accountStatuses = {
  Pending: 'PENDING',
  Active: 'ACTIVE',
  Disabled: 'DISABLED',
} as const;

export function normalizeEmail(email: string): string {
  return email.trim().toLowerCase();
}

export class Account {
  readonly id: string;
  externalId: string | undefined;
  readonly email: string;
  name: string;
  role: Account.Role;
  status: Account.Status;
  readonly createdAt: Date;

  constructor(attributes: Account.Attributes) {
    this.id = attributes.id;
    this.externalId = attributes.externalId;
    this.email = normalizeEmail(attributes.email);
    this.name = attributes.name;
    this.role = attributes.role;
    this.status = attributes.status;
    this.createdAt = attributes.createdAt;
  }

  activate(): void {
    this.status = accountStatuses.Active;
  }

  static create({ name, email }: { name: string; email: string }): Account {
    return new Account({
      id: KSUID.randomSync().string,
      externalId: undefined,
      email,
      name: name.trim(),
      role: accountRoles.Student,
      status: accountStatuses.Pending,
      createdAt: new Date(),
    });
  }
}

export namespace Account {
  export type Role = (typeof accountRoles)[keyof typeof accountRoles];

  export type Status = (typeof accountStatuses)[keyof typeof accountStatuses];

  export interface Attributes {
    id: string;
    externalId: string | undefined;
    email: string;
    name: string;
    role: Role;
    status: Status;
    createdAt: Date;
  }
}
