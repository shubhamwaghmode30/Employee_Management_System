import { z } from 'zod';

/** Error payload the backend returns for domain errors (code, message). */
export const errorResponseSchema = z.object({
  code: z.string(),
  message: z.string(),
});

export type ErrorResponse = z.infer<typeof errorResponseSchema>;
