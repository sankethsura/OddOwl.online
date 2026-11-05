'use server'

import {
  CHECKOUT_WINDOW_SECONDS,
  MAX_PER_LINE,
  OutOfStockError,
  cancelOrder,
  createOrderWithReservation,
  markOrderPaid,
  releaseExpiredReservations,
  shippingFor,
} from '@/lib/orders'
import { createRazorpayOrder, razorpayConfigured, verifyPaymentSignature } from '@/lib/razorpay'
import { payloadClient } from '@/lib/store'

type CartInput = { id: string; quantity: number }[]

const loadLines = async (cart: CartInput) => {
  const payload = await payloadClient()
  const ids = cart.map((line) => String(line.id)).filter((id) => /^[0-9a-f]{24}$/.test(id))
  const { docs } = await payload.find({
    collection: 'products',
    where: { and: [{ id: { in: ids } }, { status: { equals: 'published' } }] },
    limit: 100,
    depth: 0,
  })
  return { payload, docs }
}

export type Quote = {
  lines: { id: string; name: string; price: number; stock: number; quantity: number; requested: number }[]
  subtotal: number
  shipping: number
  total: number
}

/** The bag lives in the browser, so the server re-prices it against the CMS. */
export const quoteBag = async (cart: CartInput): Promise<Quote> => {
  const { payload, docs } = await loadLines(cart)
  const settings = await payload.findGlobal({ slug: 'store-settings' })

  const lines = cart.flatMap((line) => {
    const product = docs.find((doc) => doc.id === line.id)
    if (!product) return []
    const requested = Math.max(0, Math.floor(line.quantity))
    return {
      id: product.id,
      name: product.name,
      price: product.price,
      stock: product.stock,
      requested,
      quantity: Math.min(requested, product.stock, MAX_PER_LINE),
    }
  })

  const subtotal = lines.reduce((sum, line) => sum + line.price * line.quantity, 0)
  const shipping = subtotal > 0 ? shippingFor(subtotal, settings) : 0
  return { lines, subtotal, shipping, total: subtotal + shipping }
}

export type CheckoutForm = {
  name: string
  email: string
  phone: string
  line1: string
  line2: string
  city: string
  state: string
  pincode: string
  website: string
  idempotencyKey: string
}

export type CheckoutResult =
  | { ok: false; error: string; field?: keyof CheckoutForm }
  | {
      ok: true
      keyId: string
      razorpayOrderId: string
      amountPaise: number
      number: string
      name: string
      email: string
      phone: string
      timeoutSeconds: number
    }

const validate = (form: CheckoutForm): { error: string; field: keyof CheckoutForm } | null => {
  if (form.name.trim().length < 2) return { field: 'name', error: 'Please enter your full name.' }
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
    return { field: 'email', error: 'That email address does not look right.' }
  }
  if (!/^(\+?91[\s-]?)?[6-9]\d{9}$/.test(form.phone.replace(/[\s-]/g, ''))) {
    return { field: 'phone', error: 'Please enter a 10-digit Indian mobile number.' }
  }
  if (form.line1.trim().length < 3) return { field: 'line1', error: 'Please enter your street address.' }
  if (form.city.trim().length < 2) return { field: 'city', error: 'Please enter your city.' }
  if (form.state.trim().length < 2) return { field: 'state', error: 'Please enter your state.' }
  if (!/^[1-9]\d{5}$/.test(form.pincode.trim())) {
    return { field: 'pincode', error: 'A PIN code has 6 digits.' }
  }
  return null
}

export const startCheckout = async (cart: CartInput, form: CheckoutForm): Promise<CheckoutResult> => {
  // A field that is hidden from people and only bots fill in.
  if (form.website) return { ok: false, error: 'Something went wrong. Please try again.' }

  const invalid = validate(form)
  if (invalid) return { ok: false, ...invalid }

  if (!razorpayConfigured()) {
    return { ok: false, error: 'Online payment is not switched on yet. Nothing has been charged.' }
  }

  const { payload, docs } = await loadLines(cart)
  await releaseExpiredReservations(payload)

  const items = cart.flatMap((line) => {
    const product = docs.find((doc) => doc.id === line.id)
    const quantity = Math.floor(line.quantity)
    return product && quantity > 0 ? [{ product, quantity }] : []
  })

  if (items.length === 0 || items.length !== cart.length) {
    return { ok: false, error: 'Something in your bag is no longer for sale. Please check it and try again.' }
  }
  if (items.some(({ quantity }) => quantity > MAX_PER_LINE)) {
    return { ok: false, error: `Please order ${MAX_PER_LINE} or fewer of each piece, or get in touch for more.` }
  }

  const subtotal = items.reduce((sum, { product, quantity }) => sum + product.price * quantity, 0)
  const settings = await payload.findGlobal({ slug: 'store-settings' })

  let order
  try {
    order = await createOrderWithReservation(payload, {
      customer: { name: form.name.trim(), email: form.email.trim(), phone: form.phone.trim() },
      address: {
        line1: form.line1.trim(),
        line2: form.line2.trim(),
        city: form.city.trim(),
        state: form.state.trim(),
        pincode: form.pincode.trim(),
      },
      items,
      shipping: shippingFor(subtotal, settings),
      idempotencyKey: form.idempotencyKey,
    })
  } catch (error) {
    if (error instanceof OutOfStockError) {
      const name = docs.find((doc) => doc.id === error.productId)?.name ?? 'A piece in your bag'
      return { ok: false, error: `${name} just sold out, or there are fewer left than you asked for.` }
    }
    throw error
  }

  const amountPaise = Math.round(order.total * 100)

  try {
    const razorpayOrder = await createRazorpayOrder({ amountPaise, receipt: order.number })
    await payload.update({
      collection: 'orders',
      id: order.id,
      data: { razorpayOrderId: razorpayOrder.id },
    })

    return {
      ok: true,
      keyId: process.env.RAZORPAY_KEY_ID!,
      razorpayOrderId: razorpayOrder.id,
      amountPaise,
      number: order.number,
      name: order.customer.name,
      email: order.customer.email,
      phone: order.customer.phone,
      timeoutSeconds: CHECKOUT_WINDOW_SECONDS,
    }
  } catch (error) {
    payload.logger.error({ err: error, msg: `Could not start payment for ${order.number}` })
    await cancelOrder(payload, order)
    return { ok: false, error: 'The payment service did not respond. Nothing has been charged. Please try again.' }
  }
}

export const confirmPayment = async (input: {
  razorpayOrderId: string
  razorpayPaymentId: string
  signature: string
}): Promise<{ ok: boolean; number?: string }> => {
  if (!verifyPaymentSignature(input)) return { ok: false }

  const payload = await payloadClient()
  const order = await markOrderPaid(payload, input.razorpayOrderId, input.razorpayPaymentId)
  return order ? { ok: true, number: order.number } : { ok: false }
}

/** The buyer closed the payment form, so their stock goes back on the shelf right away. */
export const abandonCheckout = async (number: string) => {
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { number: { equals: number } },
    limit: 1,
    depth: 0,
  })
  if (docs[0]) await cancelOrder(payload, docs[0])
}
