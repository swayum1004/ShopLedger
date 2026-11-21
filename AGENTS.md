# ShopLedger

## Stack
- Node.js CommonJS application using Express 4 and body-parser JSON middleware.
- `server.js` serves `public/`, mounts API routers at `/api`, and serves printable HTML invoices.
- Persistence is the local `data/db.json` file, read and rewritten synchronously by `lib/store.js`.

## Module map
- `routes/customers.js` — customer listing and Khata settlement endpoint.
- `routes/orders.js` — order listing, lookup, placement, and cancellation endpoints.
- `routes/products.js` — product catalog and active coupon endpoints.
- `routes/reports.js` — dashboard, GST reconciliation, pricing preview, and admin export endpoints.
- `lib/coupons.js` — coupon lookup, validation, discount calculation, and active coupon listing.
- `lib/dates.js` — current date, date-key normalization, and fiscal-year helpers.
- `lib/inventory.js` — product lookup, sellable stock, stock checks, reservation, release, and summary.
- `lib/invoice.js` — invoice figure calculation and printable HTML rendering.
- `lib/ledger.js` — customer balances, Khata order charges/reversals, and settlements.
- `lib/orders.js` — order creation, lookup, cancellation, and filtered listing.
- `lib/pricing.js` — cart subtotal, coupon discount, and checkout tax/total calculation.
- `lib/reports.js` — dashboard summary and comparison of stored orders with invoice figures.
- `lib/store.js` — JSON database read/write and audit log updates.
- `lib/tax.js` — GST rate lookup by item/HSN and CGST/SGST split.

## Commands
- Start the app: `node server.js` (also declared as `npm start` in `package.json`).
- Run tests: `node --test`; no test files are currently present. The `npm test` script is a placeholder that exits with an error.

## Rules
1. Write characterization tests before changing behaviour.
2. Change only the module(s) the ticket is about.
3. Tests never read or write `data/db.json`; use in-memory data.
4. Add no dependencies.
5. Make the smallest fix that works.

## Current ticket
Invoice total and GST breakdown do not match what the customer was billed.
Allowed files: `lib/invoice.js` (`lib/tax.js` only if truly needed).