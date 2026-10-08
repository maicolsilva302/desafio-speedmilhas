import { z } from 'zod';

const documentTypeSchema = z
  .string()
  .trim()
  .toLowerCase()
  .pipe(z.enum(['cpf', 'passaporte']));

const vazioComoAusente = (valor: unknown): unknown =>
  typeof valor === 'string' && valor.trim() === '' ? undefined : valor;

const textoOpcional = z.preprocess(vazioComoAusente, z.string().trim().min(1).optional());

const passengerSchema = z.union([
  z.string().trim().min(1),
  z.object({
    nome: z.string().trim().min(1).optional(),
    name: z.string().trim().min(1).optional(),
    documento: textoOpcional,
    documento_cpf: textoOpcional,
    document: textoOpcional,
    documentoTipo: z.preprocess(vazioComoAusente, documentTypeSchema.optional()),
    tipoDocumento: z.preprocess(vazioComoAusente, documentTypeSchema.optional()),
    documentType: z.preprocess(vazioComoAusente, documentTypeSchema.optional()),
    email: textoOpcional,
  }),
]);

export const createOrderSchema = z
  .object({
    quoteId: z.string({ message: 'quoteId é obrigatório' }).trim().min(1),
    passageiro: passengerSchema.optional(),
    passenger: passengerSchema.optional(),
    idempotencyKey: z
      .string({ message: 'idempotencyKey é obrigatória' })
      .trim()
      .min(1)
      .max(200),
  })
  .transform((value) => {
    const raw = value.passageiro ?? value.passenger;
    const passenger = typeof raw === 'string' ? { nome: raw } : (raw ?? {});

    const document =
      passenger.documento ?? passenger.documento_cpf ?? passenger.document ?? null;

    return {
      quoteId: value.quoteId,
      idempotencyKey: value.idempotencyKey,
      passenger: {
        name: passenger.nome ?? passenger.name ?? null,
        document: document === null ? null : document.replace(/[^a-zA-Z0-9]/g, ''),
        documentType:
          passenger.documentoTipo ??
          passenger.tipoDocumento ??
          passenger.documentType ??
          null,
        email: passenger.email ?? null,
      },
    };
  });

export type CreateOrderRequest = z.infer<typeof createOrderSchema>;
