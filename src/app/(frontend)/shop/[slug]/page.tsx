import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { AddToBag } from '@/components/store/Bag'
import { ModePicture, Picture } from '@/components/store/Pictures'
import { SwitchFrame } from '@/components/store/SwitchFrame'
import { toBagProduct } from '@/lib/bag-line'
import { getProduct, getSettings, media, rupees, stockLine } from '@/lib/store'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const product = await getProduct((await params).slug)
  if (!product) return {}
  const image = media(product.photoNight)
  return {
    title: product.name,
    description: product.oneLiner,
    openGraph: image?.url ? { images: [image.url] } : undefined,
  }
}

export default async function ProductPage({ params }: Props) {
  const product = await getProduct((await params).slug)
  if (!product) notFound()
  const settings = await getSettings()

  const day = media(product.photoDay)
  const night = media(product.photoNight)
  const off = media(product.switchOff)
  const on = media(product.switchOn)
  const gallery = (product.gallery ?? []).map(({ image }) => media(image)).filter((image) => image !== null)

  return (
    <article className="grid md:grid-cols-12">
      <div className="pt-[4.25rem] md:col-span-7">
        {day && night && (
          <ModePicture day={day} night={night} sizes="(max-width: 767px) 100vw, 58vw" priority className="block h-auto w-full" />
        )}
      </div>

      <div className="px-4 pt-8 md:col-span-5 md:row-span-2 md:px-10 md:pt-28">
        <div className="md:sticky md:top-28">
          <h1 className="t-wide text-[clamp(2.75rem,5.6vw,5.5rem)]">{product.name}</h1>
          <p className="t-prose mt-6 text-2xl leading-snug">{product.oneLiner}</p>

          <div className="mt-8 flex items-baseline gap-4">
            <span className="t-tight text-3xl font-semibold">{rupees(product.price)}</span>
            {product.compareAtPrice ? (
              <s className="t-tight text-xl text-muted">{rupees(product.compareAtPrice)}</s>
            ) : null}
          </div>
          <p className="t-tight mt-1 text-muted">{stockLine(product, settings.lowStockAt ?? 3)}</p>

          <AddToBag product={toBagProduct(product)} className="mt-6 w-full" />

          <div className="t-prose mt-10 text-lg">
            {product.description.split(/\n\s*\n/).map((paragraph) => (
              <p key={paragraph}>{paragraph}</p>
            ))}
          </div>

          {(product.specs?.length ?? 0) > 0 && (
            <dl className="t-tight mt-10 border-t border-line">
              {product.specs!.map((spec) => (
                <div key={spec.id ?? spec.label} className="flex justify-between gap-6 border-b border-line py-3">
                  <dt className="text-muted">{spec.label}</dt>
                  <dd className="text-right">{spec.value}</dd>
                </div>
              ))}
            </dl>
          )}
        </div>
      </div>

      <div className="mt-2 flex flex-col gap-2 md:col-span-7">
        {off && on && <SwitchFrame off={off} on={on} sizes="(max-width: 767px) 100vw, 58vw" />}
        {gallery.map((image) => (
          <Picture key={image.id} image={image} sizes="(max-width: 767px) 100vw, 58vw" className="block h-auto w-full" />
        ))}
      </div>
    </article>
  )
}
