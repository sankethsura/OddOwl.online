export type MissingEnv = { name: string; why: string }

const isSet = (name: string) => Boolean(process.env[name]?.trim())

/** Settings the site cannot run without. Only names and reasons are ever shown, never values. */
export const missingRequiredEnv = (): MissingEnv[] => {
  const missing: MissingEnv[] = []

  if (!isSet('PAYLOAD_SECRET')) {
    missing.push({
      name: 'PAYLOAD_SECRET',
      why: 'Secures CMS logins. Generate a value with: openssl rand -hex 32',
    })
  }

  // Locally the database falls back to a file, but a Vercel server does not keep files.
  const database = process.env.DATABASE_URL?.trim() ?? ''
  if (process.env.VERCEL && (!database || database.startsWith('file:'))) {
    missing.push({
      name: 'DATABASE_URL',
      why: 'Vercel cannot keep a database file. Use a hosted database address, such as libsql://… from Turso.',
    })
  }

  if (database.startsWith('libsql:') && !database.includes('authToken=') && !isSet('DATABASE_AUTH_TOKEN')) {
    missing.push({ name: 'DATABASE_AUTH_TOKEN', why: 'The access token for the hosted database.' })
  }

  return missing
}

/** Settings without which checkout cannot take a payment. The rest of the site still works. */
export const missingPaymentEnv = (): MissingEnv[] =>
  [
    { name: 'RAZORPAY_KEY_ID', why: 'Opens the Razorpay payment form.' },
    { name: 'RAZORPAY_KEY_SECRET', why: 'Creates Razorpay orders and verifies payments.' },
  ].filter(({ name }) => !isSet(name))

/** Settings that are not needed to run, but that a live shop should have. */
export const missingRecommendedEnv = (): MissingEnv[] =>
  [
    {
      name: 'RAZORPAY_WEBHOOK_SECRET',
      why: 'Marks an order paid if the buyer closes the tab right after paying.',
    },
    { name: 'NEXT_PUBLIC_SITE_URL', why: 'The public address, used in links shared from the site.' },
  ].filter(({ name }) => !isSet(name))

export const envFixHint = () =>
  process.env.VERCEL
    ? 'Add these in Vercel under Settings → Environment Variables, then redeploy.'
    : 'Add these to .env, then restart the server.'
