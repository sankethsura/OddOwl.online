# OddOwl.online

The shop for OddOwl's 3D-printed objects. Next.js and Tailwind on the front, Payload CMS for products, stock, pricing and orders, Razorpay for payment.

## Run it

```bash
npm install
cp .env.example .env     # then set PAYLOAD_SECRET with: openssl rand -hex 32
npm run seed             # first time only: adds the starter products
npm run dev -- --port 3000
```

- Shop: http://localhost:3000
- CMS: http://localhost:3000/admin (the first visit asks you to create your login)

## Running the shop from the CMS

| To do this | Go to |
| --- | --- |
| Add a product, change a price or stock count | Catalogue → Products |
| Hide a product | Set its Status to Draft |
| See orders and mark them shipped | Store → Orders |
| Cancel an order and put its units back in stock | Set the order's Status to Cancelled |
| Change shipping, the low-stock level, your story or contact links | Store → Store settings |
| Publish shipping, returns, terms, privacy and contact pages | Store → Policies |

The dashboard shows total units, stock value, orders to ship and anything running low.

Each product has a day and a night photo, and the site swaps them with its light switch. Transparent cutouts are optional and are used on the shelf.

## How stock works

1. Checkout takes the units from stock before the payment form opens, so two buyers can never pay for the last one.
2. If the buyer closes the payment form, the units go back straight away. If they just vanish, the units go back after 30 minutes.
3. A payment is only accepted with a valid Razorpay signature, from either the browser or the webhook. Both can arrive, in either order.
4. If a payment lands after its stock has sold to someone else, the order is flagged **needs attention** on the dashboard, for you to refund or print more.

Refunds are issued from the Razorpay dashboard. Then cancel the order here to restock it.

## Switching on Razorpay

1. Copy your keys from https://dashboard.razorpay.com/app/keys into `.env` as `RAZORPAY_KEY_ID` and `RAZORPAY_KEY_SECRET`. Use the `rzp_test_` keys first.
2. Once the site has a public address, add a webhook in the Razorpay dashboard:
   - URL: `https://YOUR-DOMAIN/api/razorpay/webhook`
   - Events: `order.paid` and `payment.captured`
   - Put the secret you choose into `.env` as `RAZORPAY_WEBHOOK_SECRET`.
3. Keep automatic capture on in Razorpay's payment settings. The shop treats a verified payment as paid.
4. Razorpay asks for shipping, refund, terms, privacy and contact pages before it activates a live account. Drafts are waiting in Store → Policies. Fill them in, then publish.

## Deploying

The database is a SQLite file and uploads are stored in `media/`, so the host needs a persistent disk, such as a small VPS. Serverless hosts like Vercel lose both between requests. Moving there means switching to Postgres or Turso, and to cloud storage for uploads.

```bash
npm run migrate   # creates the database tables
npm run seed      # optional, first time only
npm run build
npm start
```

Set `NEXT_PUBLIC_SITE_URL` to the real address. Back up `oddowl.db` and `media/`, because they hold every order and photo.

When you change a collection's fields, run `npx payload migrate:create` and commit the result. Local development updates its own tables automatically, but production only changes through migrations.
