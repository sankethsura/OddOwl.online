'use client'

import React, { useEffect } from 'react'

/** The logo: two eyes that do not match. Open at night and following the pointer, shut by day. */
export const Eyes = ({ className }: { className?: string }) => (
  <svg viewBox="0 0 42 26" fill="none" aria-hidden="true" className={className}>
    <g className="eye-open">
      <g className="eye-lid">
        <circle cx="13" cy="13" r="11.5" stroke="currentColor" strokeWidth="2.6" />
        <circle className="eye-pupil" cx="13" cy="13" r="4.4" fill="currentColor" />
      </g>
      <g className="eye-lid">
        <circle cx="34" cy="16" r="6.5" stroke="currentColor" strokeWidth="2.6" />
        <circle className="eye-pupil" cx="34" cy="16" r="2.4" fill="currentColor" />
      </g>
    </g>
    <g className="eye-shut" stroke="currentColor" strokeWidth="2.6" strokeLinecap="round">
      <path d="M2 13c3 6 19 6 22 0" />
      <path d="M28 16c1.6 3.4 10.4 3.4 12 0" />
    </g>
  </svg>
)

export const EyeTracker = () => {
  // Every logo on the page blinks together, at uneven gaps so it never looks like a loop.
  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    const root = document.documentElement
    let wait: ReturnType<typeof setTimeout>
    let end: ReturnType<typeof setTimeout>
    const schedule = () => {
      wait = setTimeout(() => {
        if (!document.hidden) {
          root.dataset.blink = ''
          end = setTimeout(() => delete root.dataset.blink, 700)
        }
        schedule()
      }, 4000 + Math.random() * 6000)
    }

    schedule()
    return () => {
      clearTimeout(wait)
      clearTimeout(end)
      delete root.dataset.blink
    }
  }, [])

  useEffect(() => {
    if (!window.matchMedia('(pointer: fine)').matches) return
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const onMove = (event: PointerEvent) => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(() => {
        const root = document.documentElement.style
        root.setProperty('--eye-x', `${((event.clientX / window.innerWidth) * 2 - 1) * 2.2}px`)
        root.setProperty('--eye-y', `${((event.clientY / window.innerHeight) * 2 - 1) * 2.2}px`)
      })
    }

    window.addEventListener('pointermove', onMove, { passive: true })
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('pointermove', onMove)
    }
  }, [])

  return null
}
