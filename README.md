# StitchDesk

Workshop management for fashion designers and tailors. Built on the GlowDesk foundation (Next.js 14, Firebase, Paystack) and reshaped around how a fashion business actually runs: measurements, orders with deadlines, deposits and balances, and keeping clients updated.

## What it does

**For the designer**
- **Measurement book.** Female and male sheets grouped by top, sleeves and bottom, inches or centimetres, custom fields, and several dated sets per client (Standard, Wedding and so on). Copy the last set to re measure.
- **Orders.** Each order has a style, quantity, notes, style photos, fabric source, price, discount, ready date, fitting date, the tailor assigned, and a snapshot of the measurements used. Numbered SD-0001 onwards.
- **Pipeline.** Received, cutting, sewing, fitting, finishing, ready, collected (or cancelled). List view with filters (in progress, due this week, overdue, ready, balance owed, collected) and a production board.
- **Money.** Deposit at order time, part payments by MoMo, cash, bank or card, live balance, owner only payment removal. Receipt PDF.
- **Job card.** A4 PDF with measurements, style notes, fabric and sign off boxes for the workshop.
- **Client messages.** One tap WhatsApp messages for order confirmation, fitting reminder, ready for pickup and balance reminder. Ghana numbers are converted for wa.me automatically.
- **Automatic messages (optional).** Settings → Orders and messages. When on, StitchDesk sends a "ready" message when an order is marked ready, and a fitting reminder the day before.
- **Styles and prices.** A price list with photos, starting price and usual turnaround. Picking a style fills in a new order.
- **Dashboard.** In progress, overdue, ready for pickup, money owed, payments this month, workshop stage counts, fittings in the next three days, recent payments.
- Kept from GlowDesk: staff and roles, apprentices, expenses (with a Fabric category), branches, notifications, subscription billing, platform admin.

**For the client**
- **Tracking page** at `/track/<token>`. Shows first name only, the order, its stage with dates, ready and fitting dates, total, paid and balance, and buttons to WhatsApp or call the shop. Not indexed by search engines.

## Data model (Firestore)

| Collection | Notes |
|---|---|
| `tenants`, `users`, `settings` | As GlowDesk. Settings adds `autoMessages` (`off`, `sms`, `whatsapp`) and `measurementUnit` (`in`, `cm`). Tenants add `paidUntil`. |
| `clients` | Adds `gender`. |
| `measurements` | `clientId`, `label`, `gender`, `unit`, `values` (field key → number), `custom[]`, `notes`, `takenAt`. |
| `orders` | See `Order` in `lib/types.ts`. Payments and status history live on the order. |
| `catalogue` | Styles and prices. |
| `counters/{tenantId}` | `orderSeq` for order numbers. |
| `billingPayments/{reference}` | Each Paystack reference used for a subscription, so it cannot be reused. |

No composite indexes are needed: every query uses equality filters only.

## Setup

1. **Firebase.** Create a new project (keep StitchDesk separate from GlowDesk). Turn on Authentication (Email and password), Firestore and Storage. Create a service account key for the admin variables.
2. **Rules.** `firebase deploy --only firestore:rules,storage` deploys `firestore.rules` (all client access denied, the server does everything) and `storage.rules` (each business can only upload images to its own folder).
3. **Environment.** Copy `.env.example` to `.env.local` and fill it in. In production `PAYSTACK_PLATFORM_SECRET_KEY` and `CRON_SECRET` are required.
4. **Run.** `npm install`, then `npm run dev`.
5. **Deploy to Vercel.** Add the same environment variables. `vercel.json` schedules `/api/cron` daily at 09:00 UTC for fitting reminders and due date notifications.
6. **Domains.** The middleware serves the marketing site on `stitchdeskapp.online` and `www.stitchdeskapp.online`, and the app everywhere else (for example `app.stitchdeskapp.online`). Change the domain with `NEXT_PUBLIC_MARKETING_HOSTS`, and update `SITE_URL` and `APP_URL` in `lib/marketing/site.ts`.
7. **Paystack.** Prices live in `lib/billing/plans.ts` (Starter GHS 99, Pro GHS 199, Fashion House GHS 399). Each verified payment extends the account by one month.

## Security notes

- Every server action that reads or writes a record by id checks it belongs to the signed in business (`getOwnedDoc` and `assertOwned` in `lib/auth.ts`).
- Settings can only be changed by the owner, and only whitelisted fields.
- Subscription payments are verified with Paystack for status, currency, amount, the paying business and single use of the reference.
- The cron endpoint refuses to run without `CRON_SECRET`.
- Tracking tokens are 12 random URL safe characters per order.

## Not built yet

- Plan limits (team accounts, branches, automatic messages) are described on the pricing page but not enforced in code, the same as GlowDesk.
- Clients cannot book or pay online yet. Payments are recorded by the designer.
- No bulk import of clients from a spreadsheet.
