import React from 'react'

const Mark = ({ size }: { size: number }) => (
  <svg width={size} height={size * 0.62} viewBox="0 0 42 26" fill="none" aria-hidden="true">
    <circle cx="13" cy="13" r="11.5" stroke="currentColor" strokeWidth="3" />
    <circle cx="13" cy="13" r="4" fill="currentColor" />
    <circle cx="34" cy="16" r="6.5" stroke="currentColor" strokeWidth="3" />
    <circle cx="34" cy="16" r="2.2" fill="currentColor" />
  </svg>
)

export const Logo = () => (
  <span style={{ alignItems: 'center', display: 'inline-flex', fontSize: 28, fontWeight: 700, gap: 14 }}>
    <Mark size={64} />
    OddOwl
  </span>
)

export const Icon = () => <Mark size={18} />
