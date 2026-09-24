import { env } from '@/config/env'
import { SUPPORT_EMAIL } from '@/shared/constants'
import { Tenant } from '@/types/payload-types'

type WelcomeEmailTenant = Pick<Tenant, 'name' | 'adminContactName' | 'adminContactEmail'>

type WelcomeEmailProps = {
  name: string
  tenant?: WelcomeEmailTenant | null
  instructions: string
  responsibilities: { responsibility: string }[]
  policyLinks: { title: string; url: string }[]
}

const DEFAULT_RESPONSIBILITIES: WelcomeEmailProps['responsibilities'] = [
  { responsibility: 'Respond to governance or account-verification requests' },
  { responsibility: 'Complete assigned tasks or training' },
  { responsibility: 'Review and acknowledge policies assigned in StyreIQ' },
  { responsibility: 'Keep profile and account information current' },
]
const FALLBACK_ORGANIZATION = 'Your organization'

const COLORS = {
  orange: '#fb8506',
  blue: '#1d73bf',
  deepBlue: '#1e3544',
  coolOffWhite: '#ecf0ff',
  warmOffWhite: '#fff9ec',
  text: '#333333',
  muted: '#6b7280',
  border: '#e5e7eb',
  white: '#ffffff',
}

const FONT_STACK = "'Atkinson Hyperlegible', Arial, Helvetica, sans-serif"
const FONT_URL =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap'
const LOGO_PATH = '/email/styreiq-logo.png'
const LOGO_WIDTH = 160
const MAX_WIDTH = 640
const FALLBACK_NAME = 'there'

const paragraphStyle = `font-size: 16px; line-height: 1.6; color: ${COLORS.text}; margin: 0 0 16px;`

const toParagraphs = (text: string) =>
  text
    .split(/\r?\n+/)
    .map((line) => line.trim())
    .filter(Boolean)
    .map((paragraph) => `<p style="${paragraphStyle}">${paragraph}</p>`)
    .join('')

const renderIntro = (tenant: WelcomeEmailProps['tenant']) => {
  const organization = tenant?.name || FALLBACK_ORGANIZATION
  const contact =
    tenant?.adminContactName && tenant?.adminContactEmail
      ? `<p style="${paragraphStyle}">
        If you have questions about your role, responsibilities, or ${organization}'s social media
        requirements, please contact <strong>${tenant.adminContactName} at ${tenant.adminContactEmail}</strong>.
      </p>`
      : ''

  return `<p style="${paragraphStyle}">
        <strong>${organization} uses StyreIQ to help coordinate social media responsibilities across campus.</strong>
        You've been added because you manage or support one or more institutional social media accounts.
      </p>
      ${contact}`
}

const renderResponsibilities = (responsibilities: WelcomeEmailProps['responsibilities']) => {
  const items = (responsibilities.length > 0 ? responsibilities : DEFAULT_RESPONSIBILITIES)
    .map(
      (r) =>
        `<li style="font-size: 15px; line-height: 1.6; color: ${COLORS.text}; margin: 0 0 6px;">${r.responsibility}</li>`,
    )
    .join('')

  return `
      <div style="background-color: ${COLORS.coolOffWhite}; border-radius: 8px; padding: 20px 24px; margin: 24px 0;">
        <h2 style="font-size: 18px; font-weight: 700; color: ${COLORS.deepBlue}; margin: 0 0 12px;">Your responsibilities</h2>
        <ul style="margin: 0; padding-left: 20px; color: ${COLORS.blue};">${items}</ul>
      </div>`
}

const renderPolicyLinks = (policyLinks: WelcomeEmailProps['policyLinks']) => {
  if (policyLinks.length === 0) return ''

  const links = policyLinks
    .map(
      (p) =>
        `<a href="${p.url}" style="color: ${COLORS.blue}; font-weight: 700; text-decoration: none;">${p.title}</a>`,
    )
    .join(`<span style="color: ${COLORS.muted}; margin: 0 10px;">|</span>`)

  return `
      <div style="margin: 24px 0;">
        <h3 style="font-size: 16px; font-weight: 700; color: ${COLORS.deepBlue}; margin: 0 0 8px;">Additional resources</h3>
        <p style="font-size: 15px; line-height: 1.8; margin: 0;">${links}</p>
      </div>`
}

export const welcomeEmailBody = ({
  name,
  tenant,
  instructions,
  responsibilities,
  policyLinks,
}: WelcomeEmailProps) => {
  const loginLink = `${env.NEXT_PUBLIC_BASE_URL}/login`
  const logoUrl = `${env.NEXT_PUBLIC_BASE_URL}${LOGO_PATH}`

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="${FONT_URL}" rel="stylesheet" />
    <title>Welcome to StyreIQ</title>
  </head>
  <body style="margin: 0; padding: 24px 12px; background-color: #f5f7fb; font-family: ${FONT_STACK};">
    <div style="max-width: ${MAX_WIDTH}px; margin: 0 auto; background-color: ${COLORS.white}; border: 1px solid ${COLORS.border}; border-radius: 8px; padding: 32px;">
      <div style="border-bottom: 3px solid ${COLORS.orange}; padding-bottom: 16px; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="StyreIQ" width="${LOGO_WIDTH}" style="display: block; width: ${LOGO_WIDTH}px; height: auto; border: 0;" />
      </div>

      <h1 style="font-size: 26px; font-weight: 700; color: ${COLORS.deepBlue}; margin: 0 0 16px;">Welcome to StyreIQ, ${name || FALLBACK_NAME}</h1>

      ${renderIntro(tenant)}

      ${toParagraphs(instructions)}

      <p style="margin: 28px 0;">
        <a href="${loginLink}" style="display: inline-block; background-color: ${COLORS.orange}; color: ${COLORS.white}; font-size: 20px; font-weight: 700; line-height: 1.3; text-align: center; text-decoration: none; padding: 16px 44px; border-radius: 6px;">Access<br />StyreIQ</a>
      </p>

      <p style="${paragraphStyle}">
        Use the Access StyreIQ button above to get started. On your first visit, select
        <strong>Reset password</strong> to create your password.
      </p>
      <p style="${paragraphStyle}">
        Once you're logged in, head to <strong>My Tasks</strong> to see anything currently assigned to you.
      </p>

      ${renderResponsibilities(responsibilities)}

      ${renderPolicyLinks(policyLinks)}

      <div style="background-color: ${COLORS.warmOffWhite}; border-radius: 8px; padding: 14px 20px; margin-top: 32px; font-size: 14px; color: ${COLORS.text};">
        Need help using StyreIQ? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${COLORS.blue}; text-decoration: none;">${SUPPORT_EMAIL}</a>
      </div>

      <p style="font-size: 12px; color: ${COLORS.muted}; text-align: center; margin: 20px 0 0;">
        &copy; ${new Date().getFullYear()} StyreIQ. All rights reserved.
      </p>
    </div>
  </body>
</html>`
}
