import type { Metadata } from 'next'
import Link from 'next/link'
import React from 'react'

import { ModePicture } from '@/components/store/Pictures'
import { getProducts, getSettings, media } from '@/lib/store'

export const dynamic = 'force-dynamic'
export const metadata: Metadata = { title: 'About' }

export default async function AboutPage() {
  const [settings, products] = await Promise.all([getSettings(), getProducts()])
  const showcase = products.find((product) => product.homeTreatment === 'descent') ?? products[0]
  const day = media(showcase?.photoDay)
  const night = media(showcase?.photoNight)

  return (
    <div className="grid items-start md:grid-cols-12">
      <div className="px-4 pt-28 md:col-span-6 md:px-6">
        <h1 className="t-wide text-[clamp(2.75rem,7vw,6rem)]">Why odd</h1>
        <div className="t-prose mt-10 text-2xl leading-snug">
          {(settings.makerNote ?? '').split(/\n\s*\n/).map((paragraph) => (
            <p key={paragraph}>{paragraph}</p>
          ))}
        </div>
        <Link href="/shop" className="t-tight mt-8 inline-flex min-h-11 items-center text-lg underline underline-offset-4">
          See what is on the shelf
        </Link>
      </div>
      <div className="mt-12 md:col-span-6 md:mt-0">
        {day && night && (
          <ModePicture day={day} night={night} sizes="(max-width: 767px) 100vw, 50vw" priority className="block h-auto w-full" />
        )}
      </div>
    </div>
  )
}
