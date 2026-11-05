import { markOrderPaid } from '@/lib/orders'
import { verifyWebhookSignature } from '@/lib/razorpay'
import { payloadClient } from '@/lib/store'

// The backstop for a buyer whose tab closes between paying and returning to the
// site. Razorpay retries on any non-2xx, and may deliver events out of order.
export const POST = async (request: Request) => {
  const rawBody = await request.text()
  const signature = request.headers.get('x-razorpay-signature') ?? ''

  if (!verifyWebhookSignature(rawBody, signature)) {
    return new Response('Invalid signature', { status: 400 })
  }

  const event = JSON.parse(rawBody) as {
    event: string
    payload?: { payment?: { entity?: { id?: string; order_id?: string } } }
  }

  if (event.event === 'order.paid' || event.event === 'payment.captured') {
    const payment = event.payload?.payment?.entity
    if (payment?.id && payment.order_id) {
      const payload = await payloadClient()
      await markOrderPaid(payload, payment.order_id, payment.id)
    }
  }

  return new Response('ok')
}
