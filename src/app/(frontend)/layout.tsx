import type { Metadata, Viewport } from 'next'
import { Anybody, Spectral } from 'next/font/google'
import React from 'react'

import { BagProvider } from '@/components/store/Bag'
import { EyeTracker } from '@/components/store/Eyes'
import { Footer } from '@/components/store/Footer'
import { Header } from '@/components/store/Header'
import { getPolicies, getSettings } from '@/lib/store'

import './styles.css'

const anybody = Anybody({
  subsets: ['latin'],
  axes: ['wdth'],
  variable: '--font-anybody',
  display: 'swap',
})

const spectral = Spectral({
  subsets: ['latin'],
  weight: ['400'],
  style: ['normal', 'italic'],
  variable: '--font-spectral',
  display: 'swap',
})

// The header and footer read the CMS, so nothing here can be built without a database.
export const dynamic = 'force-dynamic'

export const metadata: Metadata = {
  metadataBase: new URL(process.env.NEXT_PUBLIC_SITE_URL || 'http://localhost:3000'),
  title: { default: 'OddOwl: odd objects, printed one layer at a time', template: '%s · OddOwl' },
  description: 'Lamps and sculpture, made on a 3D printer in small numbers.',
}

export const viewport: Viewport = {
  themeColor: [{ color: '#070707' }],
}

// Applies the saved mode before first paint, so a day visitor never sees a flash of night.
const modeScript = `try{var m=localStorage.getItem('oddowl-mode');if(m==='day'||m==='night')document.documentElement.dataset.mode=m}catch(e){}`

export default async function FrontendLayout({ children }: { children: React.ReactNode }) {
  const [settings, policies] = await Promise.all([getSettings(), getPolicies()])

  return (
    <html lang="en-IN" data-mode="night" className={`${anybody.variable} ${spectral.variable}`} suppressHydrationWarning>
      <head>
        <script dangerouslySetInnerHTML={{ __html: modeScript }} />
      </head>
      <body>
        <a
          href="#main"
          className="t-tight sr-only focus:not-sr-only focus:absolute focus:left-4 focus:top-4 focus:z-(--z-modal) focus:bg-accent focus:p-3 focus:text-on-accent"
        >
          Skip to content
        </a>
        <BagProvider>
          <EyeTracker />
          <Header />
          <main id="main">{children}</main>
          <Footer settings={settings} policies={policies} />
        </BagProvider>
      </body>
    </html>
  )
}
