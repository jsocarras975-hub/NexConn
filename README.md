# NEXCON 2.0

A full-stack digital studio platform starter: public website, service catalog, product marketplace, client portal, owner console, PostgreSQL data model, and secure server-side account provisioning.

## Important status

This is a runnable foundation, not a production-certified deployment. Stripe checkout, object storage, outbound email, ticket workflows, and richer order fulfillment are intentionally not enabled until real provider credentials and business rules are supplied. The product descriptions and case studies seeded here are placeholders and must be replaced before launch.

## Requirements

- Windows 11, macOS, or Linux
- Node.js 20.9+
- Docker Desktop (recommended for local PostgreSQL)
- npm

## 1. Install

```powershell
# Extract ZIP, open PowerShell in the nexcon-2 folder
npm install
Copy-Item .env.example .env
```

Generate a strong `AUTH_SECRET` (PowerShell):

```powershell
$bytes = New-Object byte[] 48
[Security.Cryptography.RandomNumberGenerator]::Fill($bytes)
[Convert]::ToBase64String($bytes)
```

Paste the result into `.env` as `AUTH_SECRET`.

## 2. Start PostgreSQL

```powershell
docker compose up -d
```

The default local database URL is already in `.env.example`. Change the local development password if exposing the database beyond localhost.

## 3. Create the database schema

```powershell
npx prisma generate
npx prisma migrate dev --name init
npm run db:seed
```

## 4. Create the first owner

Do not use public registration to create an owner. Public registration always creates CLIENT accounts.

In PowerShell, set temporary environment variables for the owner provisioning script:

```powershell
$env:OWNER_NAME = "Your Name"
$env:OWNER_EMAIL = "you@example.com"
$env:OWNER_PASSWORD = "Use-a-unique-password-at-least-16-chars"
npm run owner:create
Remove-Item Env:OWNER_NAME, Env:OWNER_EMAIL, Env:OWNER_PASSWORD
```

The script creates a privileged OWNER account only when run by someone with database access. Keep database credentials private.

## 5. Run locally

```powershell
npm run dev
```

Open http://localhost:3000.

## Included routes

- `/` corporate homepage
- `/services` service catalog
- `/work` case-study placeholders
- `/about` company page
- `/journal` publication placeholder
- `/lab` interactive local demos
- `/marketplace` database-backed product catalog
- `/contact` project inquiry form (persists to PostgreSQL)
- `/login`, `/register`
- `/portal` client dashboard
- `/admin` owner dashboard
- `/admin/inquiries` inquiry review
- `/api/health`, `/api/products`, `/api/inquiries`
- `/api/auth/register`, `/api/auth/login`, `/api/auth/logout`, `/api/auth/me`

## Security notes before production

1. Set a unique 48+ character `AUTH_SECRET`; never commit `.env`.
2. Use managed PostgreSQL with TLS, backups, restricted network access, and least-privilege credentials.
3. Add distributed rate limiting to registration, login, and inquiry endpoints (for example Upstash Redis or an edge/WAF provider). The starter does not yet include distributed rate limiting.
4. Add CAPTCHA or equivalent abuse controls to public forms.
5. Configure email verification, password reset, and account recovery before accepting customers.
6. Configure a real email provider and alerting.
7. Configure private object storage with signed, short-lived download URLs. Never expose private product files as public static assets.
8. Configure `STRIPE_SECRET_KEY`, `STRIPE_WEBHOOK_SECRET`, and `APP_URL`; register `/api/webhooks/stripe` in Stripe. Test successful, cancelled, duplicate, and refunded payment scenarios before launch.
9. Add CSRF/origin checks to state-changing routes and review cookie/session rotation policy.
10. Add audit logging to every owner mutation and implement granular permissions if staff accounts are introduced.
11. Add automated tests, dependency scanning, security headers, CSP, and production monitoring.
12. Replace placeholder products, case studies, policies, prices, and contact information with verified business content.

## Architecture

- Next.js App Router + React Server Components
- TypeScript
- Tailwind CSS v4
- PostgreSQL + Prisma
- Signed, HTTP-only JWT session cookie using `jose`
- Password hashing with bcrypt
- Zod request validation
- Owner provisioning via a private CLI script

## Current limitations

- Marketplace browsing is database-backed. Server-priced Stripe Checkout sessions and signed webhooks update order status. Paid customers can request five-minute S3-compatible signed download URLs when a private object key is attached to the product.
- Product download delivery is not implemented.
- Client portal displays project/order data and includes customer ticket creation and threaded replies. Owner console includes project creation/progress updates and support inbox replies.
- Direct file uploads are not implemented. Upload digital files to a private S3-compatible bucket through a trusted operator workflow and set the product `downloadKey`; customer access is checked against paid order ownership and uses a five-minute signed URL. Optional inquiry notification email can be configured with Resend (`RESEND_API_KEY`, `EMAIL_FROM`, `OWNER_EMAIL`).
- Inquiry form currently stores records; configure notifications and rate limiting before production.
- The case studies are sample concepts, not claims of completed client engagements.


## NEXCON 2.2 additions

- Owner analytics page: `/admin/analytics`
- Customer directory: `/admin/customers`
- Project task management: embedded in `/admin/projects`
- Invoice creation and customer invoice list: `/admin/invoices`, `/portal/invoices`
- Business settings: `/admin/settings`
- Optional inquiry notification email via Resend environment variables

After updating the project, run a new Prisma migration:

```powershell
npx prisma migrate dev --name operations_22
npx prisma generate
```

The analytics dashboard is an operational snapshot, not audited financial reporting. Multi-currency revenue must be normalized before accounting use. Invoices are currently records only, not payment instruments. Configure and test email delivery before relying on notifications.


### NEXCON 2.3 additions

- Private paid-order download endpoint: `/api/orders/[id]/downloads`
- Five-minute presigned S3-compatible object URLs; the endpoint checks the signed-in customer owns a paid/fulfilled order.
- Owner product catalog: `/admin/products` (create drafts, publish/unpublish).
- Product download keys are private object keys, not public URLs. Do not store public file URLs in `downloadKey`.
- Configure `S3_BUCKET`, `S3_REGION`, `S3_ENDPOINT` (if needed), `S3_ACCESS_KEY_ID`, and `S3_SECRET_ACCESS_KEY`.

After updating the Prisma model:

```powershell
npx prisma migrate dev --name private_product_downloads
npx prisma generate
npm install
```

The owner product UI currently creates drafts and toggles publication. Add a secure product edit form for descriptions, prices, and object keys before production; never expose storage credentials in browser code.
