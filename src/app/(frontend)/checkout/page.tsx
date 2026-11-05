import type { Metadata } from 'next'
import React from 'react'

import { Checkout } from './Checkout'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPage() {
  return (
    <div className="px-4 pt-28 md:px-6">
      <h1 className="t-wide text-[clamp(2.25rem,6vw,4.5rem)]">Checkout</h1>
      <Checkout />
    </div>
  )
}
