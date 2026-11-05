'use client'

import React, { useEffect, useRef } from 'react'

/**
 * A tall track with a pinned stage: scrolling walks the camera into the piece,
 * and each caption has its own stretch of the track. Without motion, it renders
 * as an ordinary image followed by the captions.
 */
export const Descent = ({
  image,
  captions,
  children,
}: {
  image: React.ReactNode
  captions: string[]
  children: React.ReactNode
}) => {
  const track = useRef<HTMLElement>(null)
  const stage = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (window.matchMedia('(prefers-reduced-motion: reduce)').matches) return

    let frame = 0
    const update = () => {
      const el = track.current!
      const rect = el.getBoundingClientRect()
      const travel = el.offsetHeight - window.innerHeight
      const progress = Math.min(1, Math.max(0, -rect.top / travel))
      stage.current!.style.setProperty('--progress', progress.toFixed(4))
    }
    const onScroll = () => {
      cancelAnimationFrame(frame)
      frame = requestAnimationFrame(update)
    }

    update()
    window.addEventListener('scroll', onScroll, { passive: true })
    window.addEventListener('resize', onScroll)
    return () => {
      cancelAnimationFrame(frame)
      window.removeEventListener('scroll', onScroll)
      window.removeEventListener('resize', onScroll)
    }
  }, [])

  return (
    <section ref={track} className="descent relative">
      <div ref={stage} className="descent-stage">
        <div className="descent-image">{image}</div>
        <ol className="descent-captions">
          {captions.map((caption, index) => (
            <li
              key={caption}
              className="descent-caption t-wide"
              style={{ '--from': index / captions.length, '--count': captions.length } as React.CSSProperties}
            >
              {caption}
            </li>
          ))}
        </ol>
        <div className="descent-end">{children}</div>
      </div>
    </section>
  )
}
