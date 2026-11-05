import { sql } from '@payloadcms/db-sqlite'
import type { PayloadRequest } from 'payload'

export type StockLine = { id: number; quantity: number }

type Runner = { run: (query: ReturnType<typeof sql>) => Promise<{ rowsAffected: number }> }
type StockReq = Pick<PayloadRequest, 'payload' | 'transactionID'>

// Raw SQL so the check and the decrement are one statement: two buyers racing
// for the last unit cannot both succeed. Must join the caller's transaction,
// or it would wait on the very lock that transaction is holding.
const runner = async ({ payload, transactionID }: StockReq) => {
  const adapter = payload.db as unknown as {
    drizzle: Runner
    sessions: Record<string | number, { db: Runner } | undefined>
  }
  const session = transactionID ? adapter.sessions[await transactionID] : undefined
  return session?.db ?? adapter.drizzle
}

/** Takes every line from stock. Returns the id of the first line that came up short, or null. */
export const reserveStock = async (req: StockReq, lines: StockLine[]) => {
  const db = await runner(req)
  const taken: StockLine[] = []

  for (const line of lines) {
    const result = await db.run(
      sql`UPDATE products SET stock = stock - ${line.quantity} WHERE id = ${line.id} AND stock >= ${line.quantity}`,
    )
    if (result.rowsAffected === 0) {
      for (const done of taken) {
        await db.run(sql`UPDATE products SET stock = stock + ${done.quantity} WHERE id = ${done.id}`)
      }
      return line.id
    }
    taken.push(line)
  }

  return null
}

export const returnStock = async (req: StockReq, lines: StockLine[]) => {
  const db = await runner(req)
  for (const line of lines) {
    await db.run(sql`UPDATE products SET stock = stock + ${line.quantity} WHERE id = ${line.id}`)
  }
}
