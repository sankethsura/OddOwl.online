import Link from 'next/link'
import React from 'react'

import { Eyes } from '@/components/store/Eyes'

export default function NotFound() {
  return (
    <div className="flex min-h-[70svh] flex-col justify-center px-4 pt-28 md:px-6">
      <Eyes className="h-16 w-auto self-start text-accent" />
      <h1 className="t-wide mt-8 text-[clamp(2.25rem,6vw,4.5rem)]">Nothing perched here</h1>
      <p className="t-prose mt-4 text-xl">That page does not exist, or it has flown.</p>
      <Link href="/shop" className="t-tight mt-6 self-start py-1 underline underline-offset-4">
        Go to the shelf
      </Link>
    </div>
  )
}
