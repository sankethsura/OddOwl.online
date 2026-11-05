'use client'

import React, { useEffect, useRef, useState } from 'react'

type Mode = 'day' | 'night'

const currentMode = (): Mode =>
  document.documentElement.dataset.mode === 'day' ? 'day' : 'night'

export const PullCord = () => {
  const [mode, setMode] = useState<Mode>('night')
  const [pulled, setPulled] = useState(false)
  const button = useRef<HTMLButtonElement>(null)

  useEffect(() => setMode(currentMode()), [])

  const toggle = () => {
    const next: Mode = currentMode() === 'night' ? 'day' : 'night'

    setPulled(true)
    window.setTimeout(() => setPulled(false), 120)

    const apply = () => {
      document.documentElement.dataset.mode = next
      setMode(next)
      try {
        localStorage.setItem('oddowl-mode', next)
      } catch {}
    }

    const still = window.matchMedia('(prefers-reduced-motion: reduce)').matches
    if (!document.startViewTransition || still) {
      apply()
      return
    }

    // The new mode spreads out as a circle of light from the cord.
    const rect = button.current!.getBoundingClientRect()
    const x = rect.left + rect.width / 2
    const y = rect.top + rect.height / 2
    const radius = Math.hypot(Math.max(x, innerWidth - x), Math.max(y, innerHeight - y))

    document.startViewTransition(apply).ready.then(() => {
      document.documentElement.animate(
        { clipPath: [`circle(0px at ${x}px ${y}px)`, `circle(${radius}px at ${x}px ${y}px)`] },
        { duration: 800, easing: 'cubic-bezier(0.16, 1, 0.3, 1)', pseudoElement: '::view-transition-new(root)' },
      )
    })
  }

  return (
    <button
      ref={button}
      type="button"
      role="switch"
      aria-checked={mode === 'night'}
      aria-label="Lights. Switches the site and its photos between day and night."
      onClick={toggle}
      data-pulled={pulled}
      className="cord-pull group absolute right-3 top-0 z-(--z-cord) flex h-24 w-11 cursor-pointer flex-col items-center md:right-6"
    >
      <span className="h-[4.4rem] w-px bg-ink transition-[height] duration-500 ease-out-expo group-hover:h-[5rem]" />
      <span className="size-3.5 rounded-full bg-accent" />
    </button>
  )
}
