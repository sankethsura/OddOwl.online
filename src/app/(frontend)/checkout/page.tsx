import type { Metadata } from 'next'
import React from 'react'

import { envFixHint, missingPaymentEnv } from '@/lib/env'

import { Checkout } from './Checkout'

export const metadata: Metadata = { title: 'Checkout', robots: { index: false } }

export default function CheckoutPage() {
  const missing = missingPaymentEnv()

  return (
    <div className="px-4 pt-28 md:px-6">
      <h1 className="t-wide text-[clamp(2.25rem,6vw,4.5rem)]">Checkout</h1>
      {missing.length > 0 && (
        <div role="status" className="t-tight mt-6 max-w-2xl border border-error p-4 text-error">
          <p className="font-semibold">Online payment is not switched on yet. Nothing can be charged.</p>
          <p className="mt-2">Missing: {missing.map(({ name }) => name).join(', ')}</p>
          <p className="mt-2">{envFixHint()}</p>
        </div>
      )}
      <Checkout />
    </div>
  )
}
