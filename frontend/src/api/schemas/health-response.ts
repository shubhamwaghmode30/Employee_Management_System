import { z } from 'zod';

/** Mirrors backend app/schemas/health_response.py. */
export const healthResponseSchema = z.object({
  status: z.literal('ok'),
});

export type HealthResponse = z.infer<typeof healthResponseSchema>;
