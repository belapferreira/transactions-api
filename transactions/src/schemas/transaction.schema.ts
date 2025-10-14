// src/schemas/transaction.schema.ts
import { z } from 'zod'

export const transactionSchema = z.object({
  id: z.string().uuid(),
  title: z.string(),
  amount: z.number(),
  created_at: z.string(),
  session_id: z.string().uuid().optional(),
})

export const transactionArraySchema = z.object({
  transactions: z.array(transactionSchema),
})

export const transactionResponseSchema = z.object({
  transaction: transactionSchema,
})

export const createTransactionBodySchema = z.object({
  title: z.string(),
  amount: z.number(),
  type: z.enum(['credit', 'debit']),
})

export const updateTransactionBodySchema = z.object({
  title: z.string(),
  amount: z.number(),
  type: z.enum(['credit', 'debit']),
})

export const transactionParamsSchema = z.object({
  id: z.string().uuid(),
})

export const summaryResponseSchema = z.object({
  summary: z.object({
    amount: z.number(),
  }),
})

export const errorResponseSchema = z.object({
  error: z.string(),
})

export const noContentResponseSchema = (describe: string) => {
  return z.null().describe(describe)
}
