import Link from 'next/link'
import React from 'react'

import type { Policy, StoreSetting } from '@/payload-types'

import { Eyes } from './Eyes'

const link = 't-tight flex min-h-11 items-center underline-offset-4 hover:underline'

export const Footer = ({ settings, policies }: { settings: StoreSetting; policies: Policy[] }) => (
  <footer className="mt-[clamp(5rem,12vw,10rem)] px-4 pb-8 md:px-6">
    <div className="layer-lines mb-10 h-10" aria-hidden="true" />
    <div className="flex flex-wrap items-end justify-between gap-10">
      <Eyes className="h-[clamp(5rem,16vw,13rem)] w-auto text-ink" />
      <div className="flex flex-wrap gap-x-14 gap-y-6">
        <div>
          <Link href="/shop" className={link}>Shop</Link>
          <Link href="/about" className={link}>About</Link>
        </div>
        {policies.length > 0 && (
          <div>
            {policies.map((policy) => (
              <Link key={policy.id} href={`/policies/${policy.slug}`} className={link}>
                {policy.title}
              </Link>
            ))}
          </div>
        )}
        {(settings.contactEmail || settings.whatsapp || settings.instagram) && (
          <div>
            {settings.contactEmail && <a href={`mailto:${settings.contactEmail}`} className={link}>Email</a>}
            {settings.whatsapp && <a href={`https://wa.me/${settings.whatsapp}`} className={link}>WhatsApp</a>}
            {settings.instagram && <a href={`https://instagram.com/${settings.instagram}`} className={link}>Instagram</a>}
          </div>
        )}
      </div>
    </div>
    <p className="t-tight mt-10 text-sm text-muted">© {new Date().getFullYear()} OddOwl. Prices in rupees.</p>
  </footer>
)
