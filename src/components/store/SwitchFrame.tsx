'use client'

import React, { useState } from 'react'

import type { Media } from '@/payload-types'

import { Picture } from './Pictures'

/** The same shot, lit and unlit, stacked so that pressing the button feels like the real switch. */
export const SwitchFrame = ({ off, on, sizes }: { off: Media; on: Media; sizes: string }) => {
  const [lit, setLit] = useState(false)

  return (
    <figure className="switch-frame relative" data-on={lit}>
      <Picture image={off} sizes={sizes} className="block h-auto w-full" />
      <div data-lit className="absolute inset-0">
        <Picture image={on} sizes={sizes} className="block h-auto w-full" />
      </div>
      <button
        type="button"
        role="switch"
        aria-checked={lit}
        onClick={() => setLit(!lit)}
        className="t-tight absolute bottom-4 left-4 cursor-pointer bg-(--stage) px-4 py-3 font-semibold text-(--stage-ink) transition-opacity hover:opacity-85"
      >
        {lit ? 'Switch it off' : 'Switch it on'}
      </button>
    </figure>
  )
}
