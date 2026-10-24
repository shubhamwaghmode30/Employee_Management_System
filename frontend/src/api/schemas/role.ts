import { z } from 'zod';

import { roleNames } from '../../auth/roles';

/** Mirrors RoleRead in backend app/schemas/role.py. Role ids come from the database. */
export const roleSchema = z.object({
  id: z.number().int().positive(),
  name: z.enum(roleNames),
  description: z.string(),
});

export type Role = z.infer<typeof roleSchema>;
