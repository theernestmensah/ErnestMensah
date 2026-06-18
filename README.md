# Ernest Mensah Portfolio

A highly art-directed developer portfolio for Ernest Abel Nanabanyin Mensah. The site presents selected work, packages services, collects qualified project briefs, and includes a Paystack-powered “Send a Cookie” support flow.

## What Makes It Strong

- Editorial personal brand direction with deliberate typography, motion, and asymmetric layouts.
- GSAP 3.13 and ScrollTrigger choreography with reduced-motion and no-CDN fallbacks.
- Responsive project presentation powered by JSON data.
- Clear service positioning for strategy, design, development, and product audits.
- Secure Paystack transaction initialization and verification through the Node backend.
- Safer client-side project rendering with DOM APIs instead of raw HTML templates.
- Contact form that stores project type, timeline, message, and sender details.
- Basic HTTP security headers, static file safety checks, and input validation.
- No build step or framework lock-in.

## Project Structure

```text
backend/
  data/
    messages.json
    projects.json
  server.js
css/
  style.css
index.html
javascript/
  script.js
media/
  images and project screenshots
package.json
```

## Run Locally

```bash
npm start
```

Then open:

```text
http://127.0.0.1:5175
```

## Checks

```bash
npm run check
```

This validates the Node server and browser JavaScript syntax.

## API

```text
GET  /api/health
GET  /api/projects
POST /api/contact
POST /api/paystack/initialize
GET  /api/paystack/verify?reference=...
```

Contact submissions are stored in `backend/data/messages.json`. Confirmed Paystack transactions are recorded in `backend/data/donations.json` without storing card details.

## Paystack Setup

Set the following environment variables before starting the server:

```text
PAYSTACK_SECRET_KEY=sk_test_your_key_here
PAYSTACK_PUBLIC_KEY=pk_test_your_key_here
PUBLIC_URL=https://your-domain.com
```

Use Paystack test keys locally. Switch to live keys only on the production host. `PUBLIC_URL` provides the return URL after Paystack checkout. See `.env.example` for the full configuration shape. The server automatically loads the git-ignored local `.env` file; hosting-provider environment variables can override it.

## Deployment Notes

- Set `PORT` and `HOST` through environment variables if needed.
- Set `PAYSTACK_SECRET_KEY` in the hosting provider's encrypted environment settings; never add it to frontend JavaScript or commit it to source control.
- Set `PUBLIC_URL` to the final HTTPS origin before accepting live payments.
- Keep `backend/data/messages.json` writable on the host.
- Put the site behind HTTPS in production.
- Replace placeholder or concept project links with live case studies as they become available.
- Back up contact submissions before redeploying to a clean server.
