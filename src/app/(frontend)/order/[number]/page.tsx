import type { Metadata } from 'next'
import Link from 'next/link'
import { notFound } from 'next/navigation'
import React from 'react'

import { Eyes } from '@/components/store/Eyes'
import { payloadClient, rupees } from '@/lib/store'
import type { Order } from '@/payload-types'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Your order', robots: { index: false } }

const HEADLINES: Record<Order['status'], { title: string; note: string }> = {
  awaiting_payment: {
    title: 'Waiting on your payment',
    note: 'If you have already paid, this page updates once Razorpay confirms it. Refresh in a minute.',
  },
  paid: { title: 'It is yours', note: 'Payment received. It goes in the post next.' },
  shipped: { title: 'On its way', note: 'Your order has left the shelf.' },
  delivered: { title: 'Delivered', note: 'Enjoy it.' },
  cancelled: {
    title: 'Order cancelled',
    note: 'This order did not go through, and the pieces went back on the shelf.',
  },
}

export default async function OrderPage({ params }: { params: Promise<{ number: string }> }) {
  const { number } = await params
  const payload = await payloadClient()
  const { docs } = await payload.find({
    collection: 'orders',
    where: { number: { equals: number } },
    limit: 1,
    depth: 0,
  })
  const order = docs[0]
  if (!order) notFound()

  const { title, note } = HEADLINES[order.status]

  // Anyone holding this link can see it, so it never shows the street address or contact details.
  return (
    <div className="px-4 pt-28 md:px-6">
      <Eyes className="h-16 w-auto text-accent" />
      <h1 className="t-wide mt-8 text-[clamp(2.25rem,6vw,4.5rem)]">{title}</h1>
      <p className="t-prose mt-5 text-xl">{note}</p>

      <div className="t-tight mt-12 max-w-xl">
        <p className="text-muted">Order {order.number}</p>
        <ul className="mt-3 divide-y divide-line border-y border-line">
          {order.items.map((item) => (
            <li key={item.id} className="flex justify-between gap-4 py-3">
              <span>{item.name} × {item.quantity}</span>
              <span>{rupees(item.unitPrice * item.quantity)}</span>
            </li>
          ))}
          <li className="flex justify-between gap-4 py-3">
            <span>Shipping</span>
            <span>{order.shipping === 0 ? 'Free' : rupees(order.shipping)}</span>
          </li>
        </ul>
        <p className="mt-3 flex justify-between text-xl font-semibold">
          <span>Total</span>
          <span>{rupees(order.total)}</span>
        </p>
        <p className="mt-4 text-muted">Going to {order.address.city}, {order.address.state}.</p>
        {order.trackingNote && <p className="mt-1">{order.trackingNote}</p>}
      </div>

      <Link href="/shop" className="t-tight mt-10 inline-flex min-h-11 items-center underline underline-offset-4">
        Back to the shelf
      </Link>
    </div>
  )
}
