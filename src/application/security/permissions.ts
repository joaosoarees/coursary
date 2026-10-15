import { type Account, accountRoles } from '@application/entities/Account';

export const permissions = {
  UsersList: 'users:list',
  UsersRead: 'users:read',
  UsersChangeRole: 'users:change-role',
  UsersChangeStatus: 'users:change-status',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

const instructorPermissions = [] as const satisfies readonly Permission[];

export const rolePermissions = {
  [accountRoles.Student]: [],
  [accountRoles.Instructor]: instructorPermissions,
  [accountRoles.Admin]: [
    ...instructorPermissions,
    permissions.UsersList,
    permissions.UsersRead,
    permissions.UsersChangeRole,
    permissions.UsersChangeStatus,
  ],
} as const satisfies Record<Account.Role, readonly Permission[]>;

export const Permissions = {
  allows(role: Account.Role, permission: Permission): boolean {
    const granted: readonly Permission[] = rolePermissions[role];

    return granted.includes(permission);
  },
};
