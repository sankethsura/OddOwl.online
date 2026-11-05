export type MissingEnv = { name: string; why: string }

const isSet = (name: string) => Boolean(process.env[name]?.trim())

/** Until this is on, the site shows the built-in catalogue and never touches a database. */
export const databaseEnabled = () => process.env.DATABASE_ENABLED === 'true'

/** Settings the site cannot run without. Only names and reasons are ever shown, never values. */
export const missingRequiredEnv = (): MissingEnv[] => {
  const missing: MissingEnv[] = []
  if (!databaseEnabled()) return missing

  if (!isSet('PAYLOAD_SECRET')) {
    missing.push({
      name: 'PAYLOAD_SECRET',
      why: 'Secures CMS logins. Generate a value with: openssl rand -hex 32',
    })
  }

  if (!/^mongodb(\+srv)?:\/\//.test(process.env.DATABASE_URL?.trim() ?? '')) {
    missing.push({
      name: 'DATABASE_URL',
      why: 'Must be a MongoDB address starting with mongodb+srv:// or mongodb://.',
    })
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
