'use client'

import { useRouter } from 'next/navigation'
import Link from 'next/link'
import Script from 'next/script'
import React, { useEffect, useRef, useState } from 'react'

import { useBag } from '@/components/store/Bag'

import {
  abandonCheckout,
  confirmPayment,
  quoteBag,
  startCheckout,
  type CheckoutForm,
  type Quote,
} from '../actions'

type RazorpayResponse = {
  razorpay_order_id: string
  razorpay_payment_id: string
  razorpay_signature: string
}

declare global {
  interface Window {
    Razorpay?: new (options: Record<string, unknown>) => { open: () => void }
  }
}

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`

const FIELDS: {
  name: keyof CheckoutForm
  label: string
  autoComplete: string
  type?: string
  inputMode?: 'tel' | 'numeric' | 'email'
  optional?: boolean
  half?: boolean
}[] = [
  { name: 'name', label: 'Full name', autoComplete: 'name' },
  { name: 'email', label: 'Email', autoComplete: 'email', type: 'email', inputMode: 'email', half: true },
  { name: 'phone', label: 'Mobile', autoComplete: 'tel', type: 'tel', inputMode: 'tel', half: true },
  { name: 'line1', label: 'Address', autoComplete: 'address-line1' },
  { name: 'line2', label: 'Flat, landmark (optional)', autoComplete: 'address-line2', optional: true },
  { name: 'city', label: 'City', autoComplete: 'address-level2', half: true },
  { name: 'state', label: 'State', autoComplete: 'address-level1', half: true },
  { name: 'pincode', label: 'PIN code', autoComplete: 'postal-code', inputMode: 'numeric', half: true },
]

export const Checkout = () => {
  const router = useRouter()
  const { lines, replace } = useBag()
  const [quote, setQuote] = useState<Quote | null>(null)
  const [error, setError] = useState<{ message: string; field?: keyof CheckoutForm } | null>(null)
  const [paying, setPaying] = useState(false)
  const idempotencyKey = useRef('')

  useEffect(() => {
    idempotencyKey.current = crypto.randomUUID()
  }, [])

  const signature = lines.map((line) => `${line.id}:${line.quantity}`).join(',')

  useEffect(() => {
    let current = true
    quoteBag(lines.map(({ id, quantity }) => ({ id, quantity }))).then((result) => {
      if (current) setQuote(result)
    })
    return () => {
      current = false
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [signature])

  const shortfall = quote?.lines.filter((line) => line.quantity < line.requested) ?? []

  // Brings the bag into line with what the CMS says is actually left.
  const acceptShortfall = () => {
    if (!quote) return
    replace(
      lines.flatMap((line) => {
        const fresh = quote.lines.find((item) => item.id === line.id)
        if (!fresh || fresh.quantity === 0) return []
        return { ...line, price: fresh.price, stock: fresh.stock, quantity: fresh.quantity }
      }),
    )
  }

  const onSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (paying) return
    setError(null)
    setPaying(true)

    const values = Object.fromEntries(new FormData(event.currentTarget)) as unknown as CheckoutForm

    try {
      const result = await startCheckout(
        lines.map(({ id, quantity }) => ({ id, quantity })),
        { ...values, idempotencyKey: idempotencyKey.current },
      )

      if (!result.ok) {
        setError({ message: result.error, field: result.field })
        setPaying(false)
        // Refresh the summary in case stock is what changed.
        setQuote(await quoteBag(lines.map(({ id, quantity }) => ({ id, quantity }))))
        idempotencyKey.current = crypto.randomUUID()
        return
      }

      if (!window.Razorpay) throw new Error('Checkout script missing')

      new window.Razorpay({
        key: result.keyId,
        order_id: result.razorpayOrderId,
        amount: result.amountPaise,
        currency: 'INR',
        name: 'OddOwl',
        description: `Order ${result.number}`,
        prefill: { name: result.name, email: result.email, contact: result.phone },
        theme: { color: '#004a37' },
        timeout: result.timeoutSeconds,
        handler: async (response: RazorpayResponse) => {
          const confirmed = await confirmPayment({
            razorpayOrderId: response.razorpay_order_id,
            razorpayPaymentId: response.razorpay_payment_id,
            signature: response.razorpay_signature,
          })
          replace([])
          router.push(`/order/${confirmed.number ?? result.number}`)
        },
        modal: {
          ondismiss: async () => {
            await abandonCheckout(result.number)
            idempotencyKey.current = crypto.randomUUID()
            setPaying(false)
            setError({ message: 'Payment was not completed, and nothing has been charged. Your bag is still here.' })
          },
        },
      }).open()
    } catch {
      idempotencyKey.current = crypto.randomUUID()
      setError({ message: 'Something went wrong starting the payment. Please try again.' })
      setPaying(false)
    }
  }

  if (lines.length === 0) {
    return (
      <div className="mt-10">
        <p className="t-prose text-xl">Your bag is empty.</p>
        <Link href="/shop" className="t-tight mt-3 inline-flex min-h-11 items-center underline underline-offset-4">
          See what is on the shelf
        </Link>
      </div>
    )
  }

  return (
    <>
      <Script src="https://checkout.razorpay.com/v1/checkout.js" strategy="afterInteractive" />

      <div className="mt-12 grid gap-14 md:grid-cols-12">
        <form onSubmit={onSubmit} noValidate className="md:col-span-7">
          <div className="grid grid-cols-2 gap-x-6 gap-y-7">
            {FIELDS.map((field) => (
              <div key={field.name} className={field.half ? 'col-span-2 sm:col-span-1' : 'col-span-2'}>
                <label htmlFor={field.name} className="t-tight block text-muted">
                  {field.label}
                </label>
                <input
                  id={field.name}
                  name={field.name}
                  type={field.type ?? 'text'}
                  inputMode={field.inputMode}
                  autoComplete={field.autoComplete}
                  required={!field.optional}
                  aria-invalid={error?.field === field.name || undefined}
                  aria-describedby={error?.field === field.name ? 'checkout-error' : undefined}
                  className="field"
                />
              </div>
            ))}
            <div aria-hidden="true" className="absolute -left-[9999px]">
              <label htmlFor="website">Leave this empty</label>
              <input id="website" name="website" tabIndex={-1} autoComplete="off" />
            </div>
          </div>

          {error && (
            <p id="checkout-error" role="alert" className="t-tight mt-7 text-lg text-error">
              {error.message}
            </p>
          )}

          <button
            type="submit"
            disabled={paying || !quote || shortfall.length > 0}
            className="t-tight mt-8 w-full cursor-pointer bg-accent py-4 text-lg font-semibold text-on-accent transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:opacity-50"
          >
            {paying ? 'Opening payment…' : quote ? `Pay ${rupees(quote.total)}` : 'Checking your bag…'}
          </button>
          <p className="t-tight mt-3 text-muted">Secure payment by Razorpay: UPI, cards and netbanking.</p>
        </form>

        <aside aria-label="Order summary" className="md:col-span-4 md:col-start-9">
          <h2 className="t-wide text-2xl">Your order</h2>

          {shortfall.length > 0 && (
            <div role="alert" className="mt-5">
              <p className="t-tight text-error">
                {shortfall.map((line) => `${line.name}: ${line.quantity === 0 ? 'sold out' : `only ${line.quantity} left`}`).join('. ')}.
              </p>
              <button type="button" onClick={acceptShortfall} className="t-tight mt-2 min-h-11 cursor-pointer underline underline-offset-4">
                Update my bag
              </button>
            </div>
          )}

          {quote && (
            <>
              <ul className="t-tight mt-5 divide-y divide-line border-y border-line">
                {quote.lines.map((line) => (
                  <li key={line.id} className="flex justify-between gap-4 py-3">
                    <span>{line.name} × {line.quantity}</span>
                    <span>{rupees(line.price * line.quantity)}</span>
                  </li>
                ))}
              </ul>
              <dl className="t-tight mt-3 space-y-1">
                <div className="flex justify-between">
                  <dt className="text-muted">Subtotal</dt>
                  <dd>{rupees(quote.subtotal)}</dd>
                </div>
                <div className="flex justify-between">
                  <dt className="text-muted">Shipping</dt>
                  <dd>{quote.shipping === 0 ? 'Free' : rupees(quote.shipping)}</dd>
                </div>
                <div className="flex justify-between pt-2 text-xl font-semibold">
                  <dt>Total</dt>
                  <dd>{rupees(quote.total)}</dd>
                </div>
              </dl>
            </>
          )}
        </aside>
      </div>
    </>
  )
}
