import Link from 'next/link'
import React from 'react'

import { AddToBag } from '@/components/store/Bag'
import { Descent } from '@/components/store/Descent'
import { ModePicture, Picture } from '@/components/store/Pictures'
import { PriceList } from '@/components/store/PriceList'
import { toBagProduct } from '@/lib/bag-line'
import { getProducts, getSettings, media, rupees, stockLine } from '@/lib/store'
import type { Media, Product } from '@/payload-types'

export const dynamic = 'force-dynamic'

const Paragraphs = ({ text }: { text: string }) =>
  text.split(/\n\s*\n/).map((paragraph) => <p key={paragraph}>{paragraph}</p>)

const Price = ({ product }: { product: Product }) => (
  <span className="t-tight text-2xl font-semibold">
    {rupees(product.price)}
    {product.compareAtPrice ? (
      <s className="ml-3 font-normal text-muted">{rupees(product.compareAtPrice)}</s>
    ) : null}
  </span>
)

const STRIPS = 4

const unique = (images: (Media | null)[]) => {
  const seen = new Set<string>()
  return images.filter((image): image is Media => {
    if (!image || seen.has(image.id)) return false
    seen.add(image.id)
    return true
  })
}

/** Deals each product's photos out across the strips in turn, for each mode. */
const heroStrips = (products: Product[]) => {
  if (products.length === 0) return []

  const pools = products.map((product) => {
    const gallery = (product.gallery ?? []).map(({ image }) => media(image))
    const day = media(product.photoDay)
    const night = media(product.photoNight)
    const on = media(product.switchOn)
    return {
      product,
      day: unique([day, on, ...gallery, night]),
      night: unique([night, ...gallery, on, day]),
    }
  })

  return Array.from({ length: STRIPS }, (_, index) => {
    const pool = pools[index % pools.length]
    const turn = Math.floor(index / pools.length)
    return {
      product: pool.product,
      day: pool.day[turn % pool.day.length],
      night: pool.night[turn % pool.night.length],
    }
  }).filter(({ day, night }) => day && night)
}

const Hero = ({ products }: { products: Product[] }) => (
  <section className="relative flex min-h-svh flex-col justify-end overflow-hidden px-4 pb-5 md:px-6">
    <div className="strips">
      {heroStrips(products).map(({ product, day, night }, index) => (
        <Link
          key={index}
          href={`/shop/${product.slug}`}
          aria-label={`${product.name}, ${rupees(product.price)}`}
          className="strip print-up"
          style={{ '--i': index } as React.CSSProperties}
        >
          <span className="strip-photo">
            <ModePicture day={day} night={night} sizes="(max-width: 767px) 118vw, 70vw" priority />
          </span>
          <span className="strip-label t-tight">
            {product.name}, {rupees(product.price)}
          </span>
        </Link>
      ))}
    </div>

    <div className="pointer-events-none relative">
      <h1>
        <span className="wordmark">
          <span>ODD</span> <span>OWL</span>
        </span>
        <span className="sr-only">: odd objects, printed one layer at a time</span>
      </h1>
      <div className="mt-5 flex flex-wrap items-baseline justify-between gap-x-10 gap-y-2">
        <p className="t-prose max-w-none text-[clamp(1.25rem,2vw,1.75rem)] leading-snug">
          Odd objects, printed one layer at a time.
        </p>
        <Link
          href="/shop"
          className="t-tight pointer-events-auto inline-flex min-h-11 items-center text-lg underline underline-offset-4 transition-colors hover:text-accent"
        >
          See the shelf
        </Link>
      </div>
    </div>
  </section>
)

const Feature = ({ product, lowStockAt }: { product: Product; lowStockAt: number }) => {
  const day = media(product.photoDay)
  const night = media(product.photoNight)
  if (!day || !night) return null

  return (
    <section className="relative grid items-center md:grid-cols-12">
      <Link href={`/shop/${product.slug}`} className="block md:col-span-7" aria-label={`See ${product.name}`}>
        <ModePicture day={day} night={night} sizes="(max-width: 767px) 100vw, 60vw" className="block h-auto w-full" />
      </Link>
      <div className="relative px-4 pt-8 md:col-span-5 md:px-10 md:pt-0">
        <h2 className="t-wide text-[clamp(3rem,7.4vw,6rem)] md:-ml-[34%]">
          {product.name.split(' ').map((word) => (
            <span key={word} className="block">
              {word}
            </span>
          ))}
        </h2>
        <p className="t-prose mt-8 text-xl">{product.oneLiner}</p>
        <div className="mt-8 flex flex-wrap items-center gap-x-8 gap-y-4">
          <AddToBag product={toBagProduct(product)} />
          <div>
            <Price product={product} />
            <p className="t-tight text-muted">{stockLine(product, lowStockAt)}</p>
          </div>
        </div>
        <Link href={`/shop/${product.slug}`} className="t-tight mt-6 inline-flex min-h-11 items-center underline underline-offset-4">
          Watch it switch on
        </Link>
      </div>
    </section>
  )
}

const DescentSection = ({ product, lowStockAt }: { product: Product; lowStockAt: number }) => {
  const cutout = media(product.cutoutNight) ?? media(product.cutoutDay)
  if (!cutout) return null

  return (
    <Descent
      image={<Picture image={cutout} sizes="(max-width: 767px) 100vw, 60vw" />}
      captions={(product.descentCaptions ?? []).map(({ line }) => line)}
    >
      <h2 className="t-wide text-[clamp(2.25rem,5vw,4.5rem)]">{product.name}</h2>
      <div className="mt-5 flex flex-wrap items-center gap-x-8 gap-y-4">
        <AddToBag product={toBagProduct(product)} />
        <div>
          <Price product={product} />
          <p className="t-tight text-(--stage-muted)">{stockLine(product, lowStockAt)}</p>
        </div>
      </div>
      <Link href={`/shop/${product.slug}`} className="t-tight mt-4 inline-flex min-h-11 items-center underline underline-offset-4">
        More about her
      </Link>
    </Descent>
  )
}

export default async function HomePage() {
  const [products, settings] = await Promise.all([getProducts(), getSettings()])
  const lowStockAt = settings.lowStockAt ?? 3

  const hero = products.find((product) => product.homeTreatment === 'hero')
  const descent = products.find((product) => product.homeTreatment === 'descent')

  return (
    <>
      <Hero products={products} />

      <div className="layer-lines h-16" aria-hidden="true" />

      {hero && <Feature product={hero} lowStockAt={lowStockAt} />}

      {descent && (
        <div className="mt-[clamp(5rem,12vw,10rem)]">
          <DescentSection product={descent} lowStockAt={lowStockAt} />
        </div>
      )}

      <section className="px-4 pt-[clamp(5rem,12vw,10rem)] md:px-6">
        <h2 className="t-wide mb-10 text-[clamp(2rem,5vw,4.5rem)]">On the shelf</h2>
        {products.length === 0 ? (
          <p className="t-prose text-xl">The printer is warming up. Nothing is listed just yet.</p>
        ) : (
          <PriceList
            rows={products.map((product) => ({
              id: product.id,
              slug: product.slug,
              name: product.name,
              kind: typeof product.category === 'object' ? (product.category?.name ?? '') : '',
              price: rupees(product.price),
              stock: stockLine(product, lowStockAt),
              preview: media(product.cutoutNight)?.url ?? media(product.photoNight)?.url ?? null,
            }))}
          />
        )}
      </section>

      {settings.makerNote && (
        <section className="px-4 pt-[clamp(5rem,12vw,10rem)] md:ml-[33%] md:px-6">
          <div className="t-prose text-[clamp(1.375rem,2.4vw,2rem)] leading-snug">
            <Paragraphs text={settings.makerNote} />
          </div>
        </section>
      )}
    </>
  )
}
