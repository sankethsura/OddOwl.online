import { NextResponse } from 'next/server'

import { envFixHint, missingRequiredEnv, type MissingEnv } from './lib/env'

const setupPage = (missing: MissingEnv[]) => `<!doctype html>
<html lang="en-IN">
<head>
<meta charset="utf-8">
<meta name="viewport" content="width=device-width, initial-scale=1">
<meta name="robots" content="noindex">
<title>Setup needed · OddOwl</title>
<style>
  :root { color-scheme: dark; }
  body { background: oklch(0.13 0 0); color: oklch(0.96 0 0); font: 1.0625rem/1.5 system-ui, sans-serif; margin: 0; padding: clamp(2rem, 8vw, 6rem) 1rem; }
  main { margin: 0 auto; max-width: 40rem; }
  h1 { color: oklch(0.8 0.16 78); font-size: clamp(2rem, 7vw, 3rem); line-height: 1.05; margin: 0 0 1rem; }
  ul { list-style: none; margin: 2rem 0; padding: 0; }
  li { border-top: 1px solid oklch(0.96 0 0 / 0.22); padding: 1rem 0; }
  code { color: oklch(0.8 0.16 78); display: block; font: 600 1rem ui-monospace, Menlo, monospace; margin-bottom: 0.25rem; overflow-wrap: anywhere; }
  p { margin: 0; }
  li p, .hint { color: oklch(0.76 0 0); }
</style>
</head>
<body>
<main>
  <h1>Setup needed</h1>
  <p>The site cannot start until ${missing.length === 1 ? 'this setting is' : 'these settings are'} added.</p>
  <ul>
    ${missing.map(({ name, why }) => `<li><code>${name}</code><p>${why}</p></li>`).join('\n    ')}
  </ul>
  <p class="hint">${envFixHint()}</p>
</main>
</body>
</html>`

// Runs before any page, the CMS or the API, all of which would crash without these settings.
export function proxy() {
  const missing = missingRequiredEnv()
  if (missing.length === 0) return NextResponse.next()

  return new NextResponse(setupPage(missing), {
    status: 503,
    headers: { 'Cache-Control': 'no-store', 'Content-Type': 'text/html; charset=utf-8' },
  })
}

export const config = {
  matcher: '/((?!_next/).*)',
}
