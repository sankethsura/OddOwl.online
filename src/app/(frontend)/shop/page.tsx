import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { ModePicture } from '@/components/store/Pictures'
import { getProducts, getSettings, media, rupees, stockLine } from '@/lib/store'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'Shop' }

export default async function ShopPage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()])

  return (
    <div className="px-4 pt-28 md:px-6">
      <h1 className="t-wide text-[clamp(2.75rem,9vw,6rem)]">The shelf</h1>

      {products.length === 0 ? (
        <p className="t-prose mt-10 text-xl">The printer is warming up. Nothing is listed just yet.</p>
      ) : (
        <ul className="mt-14 grid gap-x-8 gap-y-16 [grid-template-columns:repeat(auto-fit,minmax(min(100%,20rem),1fr))]">
          {products.map((product, index) => {
            const day = media(product.cutoutDay) ?? media(product.photoDay)
            const night = media(product.cutoutNight) ?? media(product.cutoutDay) ?? media(product.photoNight)
            return (
              <li key={product.id}>
                <Link href={`/shop/${product.slug}`} className="group block">
                  <div className="flex h-[min(62svh,34rem)] items-end justify-center border-b-[3px] border-ink [&_img]:h-full [&_img]:w-auto [&_img]:max-w-full [&_img]:object-contain [&_img]:object-bottom [&_img]:transition-transform [&_img]:duration-700 [&_img]:ease-out-expo group-hover:[&_img]:-translate-y-2">
                    {day && night && <ModePicture day={day} night={night} sizes="(max-width: 767px) 80vw, 40vw" priority={index < 2} />}
                  </div>
                  <div className="mt-4 flex items-baseline justify-between gap-4">
                    <h2 className="t-wide text-2xl group-hover:text-accent md:text-3xl">{product.name}</h2>
                    <span className="t-tight text-lg">{rupees(product.price)}</span>
                  </div>
                  <p className="t-tight mt-1 text-muted">{stockLine(product, settings.lowStockAt ?? 3)}</p>
                </Link>
              </li>
            )
          })}
        </ul>
      )}
    </div>
  )
}
