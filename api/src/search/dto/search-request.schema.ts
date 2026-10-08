import { z } from 'zod';

export const AIRPORTS = ['GRU', 'GIG', 'BSB', 'SSA', 'REC', 'POA', 'CNF', 'FOR'] as const;

function isRealCalendarDate(iso: string): boolean {
  const [year, month, day] = iso.split('-').map(Number);
  const date = new Date(Date.UTC(year, month - 1, day));

  return (
    date.getUTCFullYear() === year &&
    date.getUTCMonth() === month - 1 &&
    date.getUTCDate() === day
  );
}

function todayIso(): string {
  const now = new Date();
  const local = new Date(now.getTime() - now.getTimezoneOffset() * 60_000);

  return local.toISOString().slice(0, 10);
}

export const searchRequestSchema = z.preprocess(
  (raw) => {
    const body = (raw ?? {}) as Record<string, unknown>;

    return {
      origin: body.origin ?? body.origem,
      destination: body.destination ?? body.destino,
      date: body.date ?? body.data,
    };
  },
  z
    .object({
      origin: z
        .string({ message: 'origin é obrigatório' })
        .trim()
        .toUpperCase()
        .length(3, 'origin deve ser o código IATA de 3 letras'),
      destination: z
        .string({ message: 'destination é obrigatório' })
        .trim()
        .toUpperCase()
        .length(3, 'destination deve ser o código IATA de 3 letras'),
      date: z
        .string({ message: 'date é obrigatório' })
        .trim()
        .regex(/^\d{4}-\d{2}-\d{2}$/, 'date deve estar no formato YYYY-MM-DD'),
    })
    .superRefine((value, ctx) => {
      if (value.origin === value.destination) {
        ctx.addIssue({
          code: 'custom',
          message: 'origin e destination devem ser diferentes',
          path: ['destination'],
        });
      }

      if (!/^\d{4}-\d{2}-\d{2}$/.test(value.date)) {
        return;
      }

      if (!isRealCalendarDate(value.date)) {
        ctx.addIssue({
          code: 'custom',
          message: 'date não é uma data existente',
          path: ['date'],
        });

        return;
      }

      if (value.date < todayIso()) {
        ctx.addIssue({
          code: 'custom',
          message: 'date não pode estar no passado',
          path: ['date'],
        });
      }
    }),
);

export type SearchRequest = z.infer<typeof searchRequestSchema>;
