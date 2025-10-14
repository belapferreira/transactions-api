import crypto from 'node:crypto'
import { knex } from '../database'
import { checkSessionIdExists } from '../middlewares/check-session-id-exists'
import {
  createTransactionBodySchema,
  errorResponseSchema,
  noContentResponseSchema,
  summaryResponseSchema,
  transactionArraySchema,
  transactionParamsSchema,
  transactionResponseSchema,
  updateTransactionBodySchema,
} from '../schemas/transaction.schema'
import { FastifyTypedInstance } from '../@types'

export async function transactionsRoutes(app: FastifyTypedInstance) {
  // You can use a hook to perform a action before handling the request
  // app.addHook('preHandler', async (request) => {
  //   console.log(`[${request.method}] ${request.url}`)
  // })

  // GET /transactions
  app.get(
    '/',
    {
      preHandler: [checkSessionIdExists],
      schema: {
        tags: ['transactions'],
        description: 'Get all transactions for the current session',
        response: {
          200: transactionArraySchema,
        },
      },
    },
    async (request) => {
      const { sessionId } = request.cookies

      const transactions = await knex('transactions')
        .where('session_id', sessionId)
        .select()

      return { transactions }
    },
  )

  // GET /transactions/:id
  app.get(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
      schema: {
        tags: ['transactions'],
        description: 'Get a specific transaction by its ID',
        params: transactionParamsSchema,
        response: {
          200: transactionResponseSchema,
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const { id } = transactionParamsSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      if (!transaction) {
        return reply.status(404).send({ error: 'Transaction not found' })
      }

      return { transaction }
    },
  )

  // GET /transactions/summary
  app.get(
    '/summary',
    {
      preHandler: [checkSessionIdExists],
      schema: {
        tags: ['transactions'],
        description:
          'Get the summary of all transactions for the current session',
        response: {
          200: summaryResponseSchema,
        },
      },
    },
    async (request) => {
      const { sessionId } = request.cookies

      const summary = await knex('transactions')
        .where('session_id', sessionId)
        .sum('amount', { as: 'amount' })
        .first()

      if (!summary) {
        return { summary: { amount: 0 } }
      }

      return { summary }
    },
  )

  // POST /transactions
  app.post(
    '/',
    {
      schema: {
        tags: ['transactions'],
        description: 'Create a new transaction',
        body: createTransactionBodySchema,
        response: {
          201: noContentResponseSchema('Transaction created successfully'),
        },
      },
    },
    async (request, reply) => {
      const { title, amount, type } = createTransactionBodySchema.parse(
        request.body,
      )

      let sessionId = request.cookies.sessionId

      if (!sessionId) {
        sessionId = crypto.randomUUID()

        reply.cookie('sessionId', sessionId, {
          path: '/',
          maxAge: 60 * 60 * 24 * 7, // 7 days
        })
      }

      await knex('transactions').insert({
        id: crypto.randomUUID(),
        title,
        amount: type === 'credit' ? amount : amount * -1,
        session_id: sessionId,
      })

      return reply.status(201).send()
    },
  )

  // PUT /transactions/:id
  app.put(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
      schema: {
        tags: ['transactions'],
        description: 'Update a specific transaction by its ID',
        params: transactionParamsSchema,
        body: updateTransactionBodySchema,
        response: {
          201: noContentResponseSchema('Transaction updated successfully'),
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const { id } = transactionParamsSchema.parse(request.params)

      const { title, amount, type } = updateTransactionBodySchema.parse(
        request.body,
      )

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      if (!transaction) {
        return reply.status(404).send({ error: 'Transaction not found' })
      }

      await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .update({
          title,
          amount: type === 'credit' ? amount : amount * -1,
        })

      return reply.status(201).send()
    },
  )

  // DELETE /transactions/:id
  app.delete(
    '/:id',
    {
      preHandler: [checkSessionIdExists],
      schema: {
        tags: ['transactions'],
        description: 'Delete a specific transaction by its ID',
        params: transactionParamsSchema,
        response: {
          204: noContentResponseSchema('Transaction deleted successfully'),
          404: errorResponseSchema,
        },
      },
    },
    async (request, reply) => {
      const { sessionId } = request.cookies

      const { id } = transactionParamsSchema.parse(request.params)

      const transaction = await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .first()

      if (!transaction) {
        return reply.status(404).send({ error: 'Transaction not found' })
      }

      await knex('transactions')
        .where({
          session_id: sessionId,
          id,
        })
        .delete()

      return reply.status(204).send()
    },
  )
}
