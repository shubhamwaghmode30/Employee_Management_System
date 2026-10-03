import type { RoleName } from './role-name';

/** The signed-in employee as the app shell displays them. */
export type SessionUser = {
  fullName: string;
  email: string;
  role: RoleName;
};
