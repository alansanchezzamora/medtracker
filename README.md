# Medtracker
WhatsApp notification program to improve medical adherence (Twilio WhatsApp Sandbox).

## WhatsApp setup (Twilio Sandbox)

1. Sign up at [twilio.com/try-twilio](https://www.twilio.com/try-twilio) and copy Account SID + Auth Token.
2. Activate the WhatsApp Sandbox: Console → Messaging → Try it out → Send a WhatsApp message.
3. On your phone, text `join <your-code>` to **+1 415 523 8886**.
4. Put credentials in `.env`:

```bash
TWILIO_ACCOUNT_SID=ACxxxxxxxx
TWILIO_AUTH_TOKEN=xxxxxxxx
TWILIO_WHATSAPP_FROM=whatsapp:+14155238886
TWILIO_WHATSAPP_CONTENT_SID=HXb5b62575e6e4ff6129ad7c8efe1f983e
CRON_SECRET=your-random-secret
```

5. Start the app: `npm run dev`
6. In **Settings**, save your E.164 phone and use **Send test WhatsApp**.

Reminders do **not** send themselves when the clock hits the time. Something must call the dispatcher:

1. **While MedTracker is open in the browser** — an in-app ticker runs every **10 seconds** (keep a signed-in tab open) so due doses send near the scheduled time.
2. **Background (optional)** — with Next running (also every 10s by default):

```bash
npm run reminders:watch
```

3. **Manual** — `curl -H "Authorization: Bearer $CRON_SECRET" http://127.0.0.1:3000/api/cron/dispatch-reminders`
4. **Production** — Vercel Cron (`vercel.json`) every 5 minutes after deploy (platform minimum). For near real-time in prod, keep the app open or run a short-interval worker.

## Quote
"Like a financial debt, the technical debt incurs interest payments, which come in the form of the extra effort that we have to do in future development because of the quick and dirty design choice." - Martin Fowler


## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
