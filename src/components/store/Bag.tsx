'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { createContext, useCallback, useContext, useEffect, useMemo, useRef, useState } from 'react'

export type BagLine = {
  id: string
  slug: string
  name: string
  price: number
  image: string | null
  stock: number
  quantity: number
}

type BagValue = {
  lines: BagLine[]
  count: number
  subtotal: number
  add: (line: Omit<BagLine, 'quantity'>) => void
  setQuantity: (id: string, quantity: number) => void
  replace: (lines: BagLine[]) => void
  open: () => void
}

const BagContext = createContext<BagValue | null>(null)
const KEY = 'oddowl-bag'

export const useBag = () => {
  const value = useContext(BagContext)
  if (!value) throw new Error('useBag must be used inside BagProvider')
  return value
}

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`

export const BagProvider = ({ children }: { children: React.ReactNode }) => {
  const [lines, setLines] = useState<BagLine[]>([])
  const [ready, setReady] = useState(false)
  const dialog = useRef<HTMLDialogElement>(null)

  useEffect(() => {
    try {
      const saved = localStorage.getItem(KEY)
      if (saved) setLines(JSON.parse(saved))
    } catch {}
    setReady(true)
  }, [])

  useEffect(() => {
    if (!ready) return
    try {
      localStorage.setItem(KEY, JSON.stringify(lines))
    } catch {}
  }, [lines, ready])

  const open = useCallback(() => dialog.current?.showModal(), [])

  const value = useMemo<BagValue>(
    () => ({
      lines,
      count: lines.reduce((sum, line) => sum + line.quantity, 0),
      subtotal: lines.reduce((sum, line) => sum + line.quantity * line.price, 0),
      open,
      replace: setLines,
      add: (line) => {
        setLines((current) => {
          const existing = current.find((item) => item.id === line.id)
          if (!existing) return [...current, { ...line, quantity: 1 }]
          return current.map((item) =>
            item.id === line.id
              ? { ...item, ...line, quantity: Math.min(item.quantity + 1, line.stock) }
              : item,
          )
        })
        open()
      },
      setQuantity: (id, quantity) =>
        setLines((current) =>
          quantity <= 0
            ? current.filter((item) => item.id !== id)
            : current.map((item) =>
                item.id === id ? { ...item, quantity: Math.min(quantity, item.stock) } : item,
              ),
        ),
    }),
    [lines, open],
  )

  const close = () => dialog.current?.close()

  return (
    <BagContext.Provider value={value}>
      {children}
      <dialog
        ref={dialog}
        aria-label="Your bag"
        className="drawer"
        onClick={(event) => {
          if (event.target === dialog.current) close()
        }}
      >
        <div className="flex h-full flex-col p-5 md:p-7">
          <div className="flex items-start justify-between">
            <h2 className="t-wide text-3xl">Bag</h2>
            <button type="button" onClick={close} className="t-tight min-h-11 cursor-pointer px-2 underline underline-offset-4">
              Close
            </button>
          </div>

          {lines.length === 0 ? (
            <div className="flex flex-1 flex-col justify-center">
              <p className="t-prose text-xl">Nothing in here yet.</p>
              <Link href="/shop" onClick={close} className="t-tight mt-3 inline-flex min-h-11 items-center self-start underline underline-offset-4">
                See what is on the shelf
              </Link>
            </div>
          ) : (
            <>
              <ul className="mt-8 flex-1 divide-y divide-line overflow-y-auto">
                {lines.map((line) => (
                  <li key={line.id} className="flex gap-4 py-4">
                    {line.image && (
                      <Image src={line.image} alt="" width={72} height={96} className="h-24 w-[4.5rem] object-contain" />
                    )}
                    <div className="flex flex-1 flex-col justify-between">
                      <div className="flex justify-between gap-3">
                        <Link href={`/shop/${line.slug}`} onClick={close} className="t-tight inline-flex min-h-11 items-start text-lg font-semibold underline-offset-4 hover:underline">
                          {line.name}
                        </Link>
                        <span className="t-tight">{rupees(line.price * line.quantity)}</span>
                      </div>
                      <div className="t-tight flex items-center gap-1">
                        <button
                          type="button"
                          aria-label={`One fewer ${line.name}`}
                          onClick={() => value.setQuantity(line.id, line.quantity - 1)}
                          className="grid size-11 cursor-pointer place-items-center text-2xl"
                        >
                          −
                        </button>
                        <span aria-live="polite" className="w-6 text-center">{line.quantity}</span>
                        <button
                          type="button"
                          aria-label={`One more ${line.name}`}
                          disabled={line.quantity >= line.stock}
                          onClick={() => value.setQuantity(line.id, line.quantity + 1)}
                          className="grid size-11 cursor-pointer place-items-center text-2xl disabled:cursor-not-allowed disabled:opacity-40"
                        >
                          +
                        </button>
                        <button
                          type="button"
                          onClick={() => value.setQuantity(line.id, 0)}
                          className="ml-auto min-h-11 cursor-pointer px-2 text-sm text-muted underline underline-offset-4"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  </li>
                ))}
              </ul>
              <div className="border-t border-line pt-5">
                <div className="t-tight flex justify-between text-lg">
                  <span>Subtotal</span>
                  <span>{rupees(value.subtotal)}</span>
                </div>
                <Link
                  href="/checkout"
                  onClick={close}
                  className="t-tight mt-4 block bg-accent py-4 text-center text-lg font-semibold text-on-accent transition-opacity hover:opacity-85"
                >
                  Checkout
                </Link>
              </div>
            </>
          )}
        </div>
      </dialog>
    </BagContext.Provider>
  )
}

export const AddToBag = ({
  product,
  className = '',
}: {
  product: Omit<BagLine, 'quantity'>
  className?: string
}) => {
  const { add } = useBag()
  const soldOut = product.stock === 0

  return (
    <button
      type="button"
      disabled={soldOut}
      onClick={() => add(product)}
      className={`t-tight cursor-pointer bg-accent px-8 py-4 text-lg font-semibold text-on-accent transition-opacity hover:opacity-85 disabled:cursor-not-allowed disabled:bg-transparent disabled:text-muted disabled:outline disabled:outline-1 disabled:outline-line ${className}`}
    >
      {soldOut ? 'Sold out' : 'Add to bag'}
    </button>
  )
}
