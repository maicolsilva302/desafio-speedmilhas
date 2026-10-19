import { z } from 'zod';

const envSchema = z.object({
  DATABASE_URL: z.string().min(1, 'DATABASE_URL é obrigatória'),
  SUPPLIERS_BASE_URL: z.string().min(1, 'SUPPLIERS_BASE_URL é obrigatória'),
  PORT: z.coerce.number().int().positive().default(3000),

  SEARCH_BUDGET_MS: z.coerce.number().int().positive().default(4500),

  SUPPLIER_A_TIMEOUT_MS: z.coerce.number().int().positive().default(1500),
  SUPPLIER_B_TIMEOUT_MS: z.coerce.number().int().positive().default(8000),
  SUPPLIER_C_TIMEOUT_MS: z.coerce.number().int().positive().default(1000),

  QUOTE_TTL_SECONDS: z.coerce.number().int().positive().default(600),

  SEARCH_CACHE_TTL_SECONDS: z.coerce.number().int().positive().default(60),
});

export type Env = z.infer<typeof envSchema>;

function loadEnv(): Env {
  const parsed = envSchema.safeParse(process.env);

  if (!parsed.success) {
    const detalhes = parsed.error.issues
      .map((issue) => `  - ${issue.path.join('.')}: ${issue.message}`)
      .join('\n');

    throw new Error(`Configuração inválida em api/.env:\n${detalhes}`);
  }

  return parsed.data;
}

export const env: Env = loadEnv();
