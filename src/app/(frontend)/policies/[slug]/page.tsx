import type { Metadata } from 'next'
import { notFound } from 'next/navigation'
import React from 'react'

import { getPolicies } from '@/lib/store'

export const dynamic = 'force-dynamic'

type Props = { params: Promise<{ slug: string }> }

const find = async (slug: string) => (await getPolicies()).find((policy) => policy.slug === slug)

export const generateMetadata = async ({ params }: Props): Promise<Metadata> => {
  const policy = await find((await params).slug)
  return policy ? { title: policy.title } : {}
}

export default async function PolicyPage({ params }: Props) {
  const policy = await find((await params).slug)
  if (!policy) notFound()

  return (
    <article className="px-4 pt-28 md:px-6">
      <h1 className="t-wide text-[clamp(2.25rem,6vw,4.5rem)]">{policy.title}</h1>
      <div className="t-prose mt-10 text-lg">
        {policy.body.split(/\n\s*\n/).map((paragraph) => (
          <p key={paragraph}>{paragraph}</p>
        ))}
      </div>
    </article>
  )
}
