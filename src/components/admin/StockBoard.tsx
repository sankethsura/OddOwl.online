import type { ServerComponentProps } from 'payload'
import React from 'react'

import { releaseExpiredReservations } from '../../lib/orders'

const rupees = (value: number) => `₹${value.toLocaleString('en-IN')}`

const cell: React.CSSProperties = {
  padding: 'var(--base)',
  border: '1px solid var(--theme-elevation-150)',
  borderRadius: 'var(--style-radius-m)',
}

const figure: React.CSSProperties = { fontSize: 28, fontWeight: 600, lineHeight: 1.2, margin: 0 }
const label: React.CSSProperties = { color: 'var(--theme-elevation-600)', margin: 0 }

export const StockBoard = async ({ payload }: ServerComponentProps) => {
  await releaseExpiredReservations(payload)

  const [{ docs: products }, settings, toShip, flagged] = await Promise.all([
    payload.find({ collection: 'products', limit: 500, depth: 0, sort: 'stock' }),
    payload.findGlobal({ slug: 'store-settings' }),
    payload.find({ collection: 'orders', where: { status: { equals: 'paid' } }, limit: 200, depth: 0 }),
    payload.count({ collection: 'orders', where: { needsAttention: { equals: true } } }),
  ])

  const published = products.filter((product) => product.status === 'published')
  const units = published.reduce((sum, product) => sum + product.stock, 0)
  const value = published.reduce((sum, product) => sum + product.stock * product.price, 0)
  const low = published.filter((product) => product.stock <= (settings.lowStockAt ?? 3))

  return (
    <section style={{ marginBottom: 'calc(var(--base) * 2)' }}>
      <h2 style={{ marginBottom: 'var(--base)' }}>Shelf</h2>

      <div
        style={{
          display: 'grid',
          gap: 'var(--base)',
          gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
          marginBottom: 'var(--base)',
        }}
      >
        <div style={cell}>
          <p style={figure}>{units}</p>
          <p style={label}>units in stock</p>
        </div>
        <div style={cell}>
          <p style={figure}>{rupees(value)}</p>
          <p style={label}>stock value at list price</p>
        </div>
        <a href="/admin/collections/orders?where[status][equals]=paid" style={{ ...cell, textDecoration: 'none' }}>
          <p style={figure}>{toShip.totalDocs}</p>
          <p style={label}>paid, to ship</p>
        </a>
        {flagged.totalDocs > 0 && (
          <a
            href="/admin/collections/orders?where[needsAttention][equals]=true"
            style={{ ...cell, borderColor: 'var(--theme-error-500)', textDecoration: 'none' }}
          >
            <p style={figure}>{flagged.totalDocs}</p>
            <p style={label}>paid with no stock: refund or print</p>
          </a>
        )}
      </div>

      {low.length > 0 && (
        <div style={cell}>
          <p style={{ fontWeight: 600, margin: '0 0 calc(var(--base) / 2)' }}>Running low</p>
          <ul style={{ listStyle: 'none', margin: 0, padding: 0 }}>
            {low.map((product) => (
              <li key={product.id}>
                <a href={`/admin/collections/products/${product.id}`}>{product.name}</a>:{' '}
                {product.stock === 0 ? 'sold out' : `${product.stock} left`}
              </li>
            ))}
          </ul>
        </div>
      )}
    </section>
  )
}

export default StockBoard
