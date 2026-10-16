import { describe, expect, it } from 'vitest';

import { accountRoles } from '@application/entities/account/Account';
import {
  Permissions,
  permissions,
  rolePermissions,
} from '@application/security/permissions';

describe('Permissions', () => {
  it('should let an admin manage users', () => {
    expect(Permissions.allows(accountRoles.Admin, permissions.UsersList)).toBe(
      true,
    );
    expect(
      Permissions.allows(accountRoles.Admin, permissions.UsersChangeRole),
    ).toBe(true);
  });

  it('should not let a student or an instructor manage users', () => {
    expect(
      Permissions.allows(accountRoles.Student, permissions.UsersList),
    ).toBe(false);
    expect(
      Permissions.allows(accountRoles.Instructor, permissions.UsersRead),
    ).toBe(false);
  });

  it('should give the admin every action of the instructor', () => {
    expect(rolePermissions.admin).toEqual(
      expect.arrayContaining([...rolePermissions.instructor]),
    );
  });
});
