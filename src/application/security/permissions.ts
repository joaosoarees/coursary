import { type Account, accountRoles } from '@application/entities/Account';

export const permissions = {
  UsersList: 'users:list',
  UsersRead: 'users:read',
  UsersChangeRole: 'users:change-role',
  UsersChangeStatus: 'users:change-status',
  CoursesCreate: 'courses:create',
  CoursesUpdate: 'courses:update',
  CoursesUpdateAny: 'courses:update-any',
  CoursesListOwn: 'courses:list-own',
  CoursesPublish: 'courses:publish',
  CoursesArchive: 'courses:archive',
} as const;

export type Permission = (typeof permissions)[keyof typeof permissions];

const instructorPermissions = [
  permissions.CoursesCreate,
  permissions.CoursesUpdate,
  permissions.CoursesListOwn,
  permissions.CoursesPublish,
  permissions.CoursesArchive,
] as const satisfies readonly Permission[];

export const rolePermissions = {
  [accountRoles.Student]: [],
  [accountRoles.Instructor]: instructorPermissions,
  [accountRoles.Admin]: [
    ...instructorPermissions,
    permissions.UsersList,
    permissions.UsersRead,
    permissions.UsersChangeRole,
    permissions.UsersChangeStatus,
    permissions.CoursesUpdateAny,
  ],
} as const satisfies Record<Account.Role, readonly Permission[]>;

export const Permissions = {
  allows(role: Account.Role, permission: Permission): boolean {
    const granted: readonly Permission[] = rolePermissions[role];

    return granted.includes(permission);
  },
};
