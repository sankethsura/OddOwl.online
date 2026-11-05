import type { PayloadRequest } from 'payload'

export type StockLine = { id: string; quantity: number }

type StockReq = Pick<PayloadRequest, 'payload' | 'transactionID'>
type Filter = { _id: string; stock?: { $gte: number } }
type Products = {
  updateOne: (
    filter: Filter,
    update: { $inc: { stock: number } },
    options: { session?: unknown },
  ) => Promise<{ matchedCount: number }>
}

// One atomic update, so the check and the decrement cannot be split: two buyers
// racing for the last unit cannot both succeed. Must join the caller's transaction,
// or the caller could roll back and leave the stock taken.
const changeStock = async ({ payload, transactionID }: StockReq, filter: Filter, stock: number) => {
  const adapter = payload.db as unknown as {
    collections: { products: Products }
    sessions: Record<string | number, unknown>
  }
  const session = transactionID ? adapter.sessions[await transactionID] : undefined
  return adapter.collections.products.updateOne(filter, { $inc: { stock } }, { session })
}

/** Takes every line from stock. Returns the id of the first line that came up short, or null. */
export const reserveStock = async (req: StockReq, lines: StockLine[]) => {
  const taken: StockLine[] = []

  for (const line of lines) {
    const result = await changeStock(
      req,
      { _id: line.id, stock: { $gte: line.quantity } },
      -line.quantity,
    )
    if (result.matchedCount === 0) {
      await returnStock(req, taken)
      return line.id
    }
    taken.push(line)
  }

  return null
}

export const returnStock = async (req: StockReq, lines: StockLine[]) => {
  for (const line of lines) {
    await changeStock(req, { _id: line.id }, line.quantity)
  }
}

export const isWriteConflict = (error: unknown) => {
  const { code, hasErrorLabel } = error as {
    code?: number
    hasErrorLabel?: (label: string) => boolean
  }
  return code === 112 || Boolean(hasErrorLabel?.call(error, 'TransientTransactionError'))
}

/** MongoDB fails a transaction that touches a document another one is changing, rather than making it wait. */
export const retryOnConflict = async <T>(work: () => Promise<T>): Promise<T> => {
  for (let attempt = 1; ; attempt++) {
    try {
      return await work()
    } catch (error) {
      if (attempt === 8 || !isWriteConflict(error)) throw error
      await new Promise((resolve) => setTimeout(resolve, Math.random() * 100 * attempt))
    }
  }
}
