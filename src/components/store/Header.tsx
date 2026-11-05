'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'
import React from 'react'

import { useBag } from './Bag'
import { Eyes } from './Eyes'
import { PullCord } from './PullCord'

const navLink =
  't-tight inline-flex min-h-11 items-center px-1 text-base underline-offset-4 hover:underline focus-visible:underline'

export const Header = () => {
  const { count, open } = useBag()
  const pathname = usePathname()

  return (
    <header className="absolute inset-x-0 top-0 z-(--z-sticky) flex items-center justify-between py-3 pl-4 pr-16 md:pl-6 md:pr-24">
      <Link href="/" aria-label="OddOwl home" className="py-1">
        <Eyes className="h-9 w-auto text-ink" />
      </Link>
      <nav aria-label="Main" className="flex items-center gap-3 md:gap-6">
        <Link href="/shop" className={navLink}>
          Shop
        </Link>
        <Link href="/about" className={navLink}>
          About
        </Link>
        <button type="button" onClick={open} className={`${navLink} cursor-pointer`}>
          Bag ({count})
        </button>
      </nav>
      <PullCord />
      {/* At checkout this would sit on top of the form fields. */}
      {count > 0 && pathname !== '/checkout' && (
        <button
          type="button"
          onClick={open}
          className="t-tight fixed bottom-4 right-4 cursor-pointer bg-accent px-4 py-3 font-semibold text-on-accent transition-opacity hover:opacity-85"
        >
          Bag ({count})
        </button>
      )}
    </header>
  )
}
