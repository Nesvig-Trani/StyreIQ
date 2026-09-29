---
status: validated
ticket: GIQ-90
sprint: none
---

# GIQ-90 — Demo request routing, confirmation email and scheduling link

Linear: [GIQ-90](https://linear.app/meltstudio/issue/GIQ-90)

## Context

The landing page "Request Demo" form posts to `POST /api/users/request-demo`. Today the endpoint sends one plain email to a hard-coded, non-StyreIQ address (`tntrani@nesvigtrani.com`) and the requester gets nothing. The ticket asks for:

1. Internal notification routed to a StyreIQ address.
2. Immediate confirmation email to the requester, with a calendar scheduling link.
3. StyreIQ as the sender of both (already true through `FROM_ADDRESS` / `FROM_NAME` in `src/shared/utils/emailAdapter.ts`).

Both emails must match the mock-ups: StyreIQ logo header with an orange rule, deep-blue heading, orange CTA button. The welcome email (`src/features/users/constants/welcomeEmailBody.ts`) already has this look, but its brand constants are private to that file.

Decisions taken with the user:
- Add an optional **Role** field to the form; show it in the internal email.
- The internal **View Lead** button is a `mailto:` to the requester.
- If either email fails, the endpoint fails the request (no partial success).
- The real StyreIQ inbox and the Calendly link are not known yet. Use env variables with placeholder values; the user will supply the real values later.

Branch: `feat/giq-90-demo-request-confirmation-email` from `origin/dev`. Copy this plan to `.plans/giq-90.md` at implementation start (flat layout, same as `.plans/giq-80.md`).

## Changes

### 1. Env variables — `src/config/env.ts`, `README.md`, `.env.example`
Add two server variables:
- `DEMO_REQUEST_TO_ADDRESS` — `z.string().email()`. StyreIQ inbox for the internal notification. Placeholder: `demo@styreiq.com`.
- `DEMO_SCHEDULING_URL` — `z.string().url()`. Calendly link for the CTA. Placeholder: `https://calendly.com/styreiq/demo`.

Add both to `runtimeEnv`, to the README env table and code block, and to `.env.example`. Note for the user: set them in Vercel (preview + production) before merge, or the build fails.

### 2. Shared email theme — new `src/features/users/constants/emailTheme.ts`
Move the private constants out of `welcomeEmailBody.ts` and export them: `EMAIL_COLORS`, `EMAIL_FONT_STACK`, `EMAIL_FONT_URL`, `EMAIL_LOGO_PATH`, `EMAIL_LOGO_WIDTH`, `EMAIL_MAX_WIDTH`, `emailParagraphStyle`. Add:
- `renderEmailLayout({ title, content })` — the `<!DOCTYPE html>` document, card wrapper, logo header with the 3px orange rule, and the `&copy; year StyreIQ` footer. Content goes between header and footer.
- `renderEmailButton({ href, label })` — the orange CTA from the welcome email (`display:inline-block; background orange; white bold text; padding 16px 44px; radius 6px`).
- `escapeHtml(value: string)` — replaces `& < > " '`. Used for every user-supplied value.

Update `welcomeEmailBody.ts` to import the constants from `emailTheme.ts` and delete its private copies. Do **not** change its markup or wrap it in `renderEmailLayout` — keep this file change mechanical (imports + constant renames only).

### 3. Shared request schema — new `src/shared/schemas/requestDemoSchema.ts`
```ts
export const requestDemoSchema = z.object({
  name: z.string().trim().min(1, 'Name is required'),
  email: z.string().trim().email('Enter a valid email'),
  company: z.string().trim().optional(),
  role: z.string().trim().optional(),
})
export type RequestDemoInput = z.infer<typeof requestDemoSchema>
```
Move the schema here from `request-demo-modal.tsx`; the modal and the endpoint both import it (landing → users would be a cross-feature import, so `src/shared` is the correct place).

### 4. Form — `src/features/landing/components/request-demo-modal.tsx`
- Import `requestDemoSchema` from shared; delete the local copy.
- Add field `{ label: 'Role', name: 'role', type: 'text', placeholder: 'Your role (optional)' }` after Company; add `role: ''` to `defaultValues`.
- Success text: change "We'll be in touch soon to schedule your demo." to "Check your inbox for a link to schedule your demo."

### 5. Internal notification — rewrite `src/features/users/constants/requestDemoEmailBody.ts`
Signature: `requestDemoEmailBody({ name, email, company, role }: RequestDemoInput)`. Build with `renderEmailLayout`:
- H1 "New demo request" (deep blue), then paragraph "A new demo request has been submitted through styreiq.com."
- Details card: `background EMAIL_COLORS.coolOffWhite; border-left 4px solid EMAIL_COLORS.blue; border-radius 8px; padding 16px 20px`. Lines: **Name**, **Email**, **Organization**, **Role**. Empty `company` / `role` → "Not provided".
- `renderEmailButton({ href: \`mailto:${email}\`, label: 'View Lead' })`.
All values go through `escapeHtml`.

### 6. Confirmation email — new `src/features/users/constants/demoConfirmationEmailBody.ts`
`demoConfirmationEmailBody({ name, schedulingUrl })`. Build with `renderEmailLayout`:
- H1 "Thanks for your interest in StyreIQ".
- "Hi {name}," (fallback "there", as the welcome email does).
- "Thanks for reaching out. We've received your request for a StyreIQ demo."
- "Choose a time that works for you using the scheduling link below."
- `renderEmailButton({ href: schedulingUrl, label: 'Schedule Your Demo' })`.
- "We're looking forward to learning more about how your organization manages social media governance and compliance."
- Warm off-white box: "Questions in the meantime? `SUPPORT_EMAIL`" (import from `src/shared/constants`, same as the welcome email).

### 7. Endpoint — `src/features/users/plugins/endpoints/index.tsx`, `requestDemo` (~line 817)
- Parse the body with `requestDemoSchema.safeParse`. On failure return 400 with the Zod issues (same shape as the other 400 responses in this file).
- Keep the existing non-production redirect pattern: `to = NEXT_PUBLIC_NODE_ENV === 'production' ? <real> : env.LOCAL_EMAIL_TO_ADDRESS`. Both emails go to `LOCAL_EMAIL_TO_ADDRESS` outside production, so the user sees both in one inbox.
- Send 1 — internal: `to: env.DEMO_REQUEST_TO_ADDRESS`, `replyTo: data.email`, `subject: 'New demo request'`, `html: requestDemoEmailBody(data)`.
- Send 2 — confirmation: `to: data.email`, `subject: 'Thanks for your interest in StyreIQ'`, `html: demoConfirmationEmailBody({ name: data.name, schedulingUrl: env.DEMO_SCHEDULING_URL })`.
- Run both with `Promise.all`; keep the existing "response has no `id`" check for each result (extract it into a small `assertEmailSent(response)` local helper to avoid duplicating the check). Any failure falls into the existing `catch`, so the modal shows the error and the user can retry.
- Remove the hard-coded `tntrani@nesvigtrani.com`.

Do not change the existing `catch` that returns 500 — out of scope (noted in the ticket review).

## Out of scope (note in PR)
- Rate limiting / captcha on the public endpoint. Zod validation + `escapeHtml` cover input safety for this ticket; abuse protection is a separate ticket.
- Storing demo requests in a collection.
- Restyling the other plain-card templates (forgot/reset/perms) with `renderEmailLayout`.

## Verification
1. `pnpm type-check` and `pnpm lint` must pass (env additions and the schema move touch several files).
2. Local `.env`: set `DEMO_REQUEST_TO_ADDRESS`, `DEMO_SCHEDULING_URL`, and `LOCAL_EMAIL_TO_ADDRESS` to your inbox. Run `pnpm dev`.
3. Manual (user): open the landing page, submit Request Demo with name, email, company and role.
   - Modal shows the "Check your inbox" success text and closes.
   - Inbox receives **two** emails from `FROM_NAME <FROM_ADDRESS>`: "New demo request" (card with 4 lines; View Lead opens a `mailto:` to the requester; Reply-To is the requester) and "Thanks for your interest in StyreIQ" (Schedule Your Demo button opens `DEMO_SCHEDULING_URL`).
   - Submit with company and role empty → internal email shows "Not provided" twice.
   - Submit a name containing `<b>x</b>` → shows literally, not bold (escaping works).
   - `curl -X POST /api/users/request-demo -d '{"email":"bad"}'` → 400 with Zod issues, no email sent.
4. Before merge: add the two new env vars in Vercel; replace placeholders with the real inbox and Calendly link when the user provides them.

## Validation Results (Agent)

2026-09-29 — commit `cc889ee`.

- `tsc --noEmit`: exit 0.
- `eslint` on all changed files: exit 0.
- `next build` with the placeholder `DEMO_*` values: see the PR pre-flight note.
- `pnpm type-check` / `pnpm lint` cannot run on the dev machine (Corepack pnpm 11 vs `engines` `^9 || ^10`); the local binaries were used instead.

## Validation Results (Developer)

2026-09-29 — the developer ran the manual checks in the Verification section locally and confirmed they pass: both emails arrive, the internal card shows the four fields with "Not provided" fallbacks, `View Lead` opens a `mailto:` to the requester, `Schedule Your Demo` opens `DEMO_SCHEDULING_URL`, HTML in the name renders as text.

## Review Results (Developer)

2026-09-29 — the developer reviewed the diff and approved it as is. Decisions recorded during planning stand: optional Role field, `mailto:` View Lead, fail the request on any email error, env placeholders until the PM provides the real inbox and Calendly link.
