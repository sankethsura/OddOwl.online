'use client'

import Image from 'next/image'
import Link from 'next/link'
import React, { useRef, useState } from 'react'

export type PriceRow = {
  id: number
  slug: string
  name: string
  kind: string
  price: string
  stock: string
  preview: string | null
}

/** The shop as a plain list. On a fine pointer, the piece follows the cursor over its row. */
export const PriceList = ({ rows }: { rows: PriceRow[] }) => {
  const [active, setActive] = useState<PriceRow | null>(null)
  const floating = useRef<HTMLDivElement>(null)

  const onMove = (event: React.PointerEvent) => {
    if (floating.current) {
      floating.current.style.transform = `translate(${event.clientX + 24}px, ${event.clientY - 140}px)`
    }
  }

  return (
    <div onPointerMove={onMove} onPointerLeave={() => setActive(null)}>
      <ul className="border-t border-line">
        {rows.map((row) => (
          <li key={row.id} className="border-b border-line">
            <Link
              href={`/shop/${row.slug}`}
              onPointerEnter={(event) => {
                if (event.pointerType === 'mouse') setActive(row)
              }}
              className="group grid grid-cols-[1fr_auto] items-baseline gap-x-6 gap-y-1 py-5 transition-colors hover:text-accent md:grid-cols-[1fr_9rem_14rem_7rem] md:py-7"
            >
              <span className="t-wide text-[clamp(1.5rem,4.4vw,3.75rem)]">{row.name}</span>
              <span className="t-tight text-right text-lg md:order-last">{row.price}</span>
              <span className="t-tight text-muted group-hover:text-accent">{row.kind}</span>
              <span className="t-tight col-span-2 text-muted group-hover:text-accent md:col-span-1">{row.stock}</span>
            </Link>
          </li>
        ))}
      </ul>
      <div
        ref={floating}
        aria-hidden="true"
        className="pointer-events-none fixed left-0 top-0 z-(--z-sticky) hidden w-56 md:block"
      >
        {active?.preview && (
          <Image src={active.preview} alt="" width={224} height={300} className="h-auto w-full" />
        )}
      </div>
    </div>
  )
}
