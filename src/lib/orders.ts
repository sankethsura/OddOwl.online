import { randomBytes } from 'node:crypto'

import type { Payload } from 'payload'

import type { Order, Product, StoreSetting } from '../payload-types'
import { reserveStock } from './stock'

export const MAX_PER_LINE = 10
// A little longer than the Razorpay checkout window, so a buyer's stock is
// never released while their payment form is still open.
export const CHECKOUT_WINDOW_SECONDS = 25 * 60
const RESERVATION_MS = (CHECKOUT_WINDOW_SECONDS + 5 * 60) * 1000

const ALPHABET = 'ABCDEFGHJKLMNPQRSTUVWXYZ23456789'

export const generateOrderNumber = () =>
  'OO-' +
  Array.from(randomBytes(10), (byte) => ALPHABET[byte % ALPHABET.length]).join('')

export const shippingFor = (subtotal: number, settings: StoreSetting) => {
  const { freeShippingOver, shippingFlat } = settings
  if (typeof freeShippingOver === 'number' && subtotal >= freeShippingOver) return 0
  return shippingFlat ?? 0
}

export type OrderDraft = {
  customer: Order['customer']
  address: Order['address']
  items: { product: Product; quantity: number }[]
  shipping: number
  idempotencyKey: string
}

export class OutOfStockError extends Error {
  constructor(readonly productId: number) {
    super('Out of stock')
  }
}

/** Reserves the stock and writes the order in one transaction: both happen, or neither. */
export const createOrderWithReservation = async (payload: Payload, draft: OrderDraft) => {
  const subtotal = draft.items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
  const transactionID = (await payload.db.beginTransaction()) ?? undefined
  const req = { payload, transactionID }

  try {
    const shortOf = await reserveStock(
      req,
      draft.items.map(({ product, quantity }) => ({ id: product.id, quantity })),
    )
    if (shortOf !== null) throw new OutOfStockError(shortOf)

    const order = await payload.create({
      collection: 'orders',
      req,
      data: {
        number: generateOrderNumber(),
        items: draft.items.map(({ product, quantity }) => ({
          product: product.id,
          name: product.name,
          unitPrice: product.price,
          quantity,
        })),
        subtotal,
        shipping: draft.shipping,
        total: subtotal + draft.shipping,
        customer: draft.customer,
        address: draft.address,
        status: 'awaiting_payment',
        reservedUntil: new Date(Date.now() + RESERVATION_MS).toISOString(),
        idempotencyKey: draft.idempotencyKey,
      },
    })

    if (transactionID) await payload.db.commitTransaction(transactionID)
    return order
  } catch (error) {
    if (transactionID) await payload.db.rollbackTransaction(transactionID)
    throw error
  }
}

/** Safe to call from both the browser confirmation and the webhook, in either order. */
export const markOrderPaid = async (payload: Payload, razorpayOrderId: string, razorpayPaymentId: string) => {
  const { docs } = await payload.find({
    collection: 'orders',
    where: { razorpayOrderId: { equals: razorpayOrderId } },
    limit: 1,
  })
  const order = docs[0]
  if (!order) return null

  if (order.status !== 'awaiting_payment' && order.status !== 'cancelled') return order

  try {
    return await payload.update({
      collection: 'orders',
      id: order.id,
      data: { status: 'paid', razorpayPaymentId },
    })
  } catch {
    // A late payment on an order whose stock has since sold to someone else.
    // The money has moved, so keep the record and flag it instead of failing.
    return payload.update({
      collection: 'orders',
      id: order.id,
      data: { razorpayPaymentId, needsAttention: true },
    })
  }
}

export const cancelOrder = async (payload: Payload, order: Order) => {
  if (order.status !== 'awaiting_payment') return
  await payload.update({ collection: 'orders', id: order.id, data: { status: 'cancelled' } })
}

let lastSweep = 0

/** Gives back stock held by checkouts that were abandoned without closing the payment form. */
export const releaseExpiredReservations = async (payload: Payload) => {
  if (Date.now() - lastSweep < 60_000) return
  lastSweep = Date.now()

  const { docs } = await payload.find({
    collection: 'orders',
    where: {
      and: [
        { status: { equals: 'awaiting_payment' } },
        { reservedUntil: { less_than: new Date().toISOString() } },
      ],
    },
    limit: 50,
    depth: 0,
  })

  for (const order of docs) await cancelOrder(payload, order)
}
