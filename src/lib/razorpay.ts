import { createHmac, timingSafeEqual } from 'node:crypto'

const apiBase = () => process.env.RAZORPAY_API_URL || 'https://api.razorpay.com'

export const razorpayConfigured = () =>
  Boolean(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET)

const safeEqual = (a: string, b: string) => {
  const left = Buffer.from(a)
  const right = Buffer.from(b)
  return left.length === right.length && timingSafeEqual(left, right)
}

const hmac = (payload: string, secret: string) =>
  createHmac('sha256', secret).update(payload).digest('hex')

export const createRazorpayOrder = async (input: {
  amountPaise: number
  receipt: string
}): Promise<{ id: string }> => {
  const auth = Buffer.from(
    `${process.env.RAZORPAY_KEY_ID}:${process.env.RAZORPAY_KEY_SECRET}`,
  ).toString('base64')

  const response = await fetch(`${apiBase()}/v1/orders`, {
    method: 'POST',
    headers: { Authorization: `Basic ${auth}`, 'Content-Type': 'application/json' },
    body: JSON.stringify({
      amount: input.amountPaise,
      currency: 'INR',
      receipt: input.receipt,
    }),
    signal: AbortSignal.timeout(15000),
  })

  if (!response.ok) {
    throw new Error(`Razorpay order failed with ${response.status}: ${await response.text()}`)
  }

  return response.json()
}

export const verifyPaymentSignature = (input: {
  razorpayOrderId: string
  razorpayPaymentId: string
  signature: string
}) => {
  const secret = process.env.RAZORPAY_KEY_SECRET
  if (!secret) return false
  return safeEqual(
    hmac(`${input.razorpayOrderId}|${input.razorpayPaymentId}`, secret),
    input.signature,
  )
}

export const verifyWebhookSignature = (rawBody: string, signature: string) => {
  const secret = process.env.RAZORPAY_WEBHOOK_SECRET
  if (!secret) return false
  return safeEqual(hmac(rawBody, secret), signature)
}
