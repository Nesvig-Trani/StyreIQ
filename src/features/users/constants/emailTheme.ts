import { env } from '@/config/env'

export const EMAIL_COLORS = {
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

export const EMAIL_FONT_STACK = "'Atkinson Hyperlegible', Tahoma, Verdana, sans-serif"
export const EMAIL_FONT_URL =
  'https://fonts.googleapis.com/css2?family=Atkinson+Hyperlegible:wght@400;700&display=swap'
export const EMAIL_LOGO_PATH = '/email/styreiq-logo.png'
export const EMAIL_LOGO_WIDTH = 160
export const EMAIL_MAX_WIDTH = 640
export const EMAIL_FALLBACK_NAME = 'there'

export const emailParagraphStyle = `font-size: 16px; line-height: 1.6; color: ${EMAIL_COLORS.text}; margin: 0 0 16px;`
export const emailHeadingStyle = `font-size: 26px; font-weight: 700; color: ${EMAIL_COLORS.deepBlue}; margin: 0 0 16px;`

const HTML_ESCAPES: Record<string, string> = {
  '&': '&amp;',
  '<': '&lt;',
  '>': '&gt;',
  '"': '&quot;',
  "'": '&#39;',
}

export const escapeHtml = (value: string) => value.replace(/[&<>"']/g, (char) => HTML_ESCAPES[char])

export const renderEmailButton = ({ href, label }: { href: string; label: string }) => `
      <p style="margin: 28px 0;">
        <a href="${href}" style="display: inline-block; background-color: ${EMAIL_COLORS.orange}; color: ${EMAIL_COLORS.white}; font-size: 20px; font-weight: 700; line-height: 1.3; text-align: center; text-decoration: none; padding: 16px 44px; border-radius: 6px;">${label}</a>
      </p>`

export const renderEmailLayout = ({ title, content }: { title: string; content: string }) => {
  const logoUrl = `${env.NEXT_PUBLIC_BASE_URL}${EMAIL_LOGO_PATH}`

  return `
<!DOCTYPE html>
<html lang="en">
  <head>
    <meta charset="utf-8" />
    <meta name="viewport" content="width=device-width, initial-scale=1" />
    <link href="${EMAIL_FONT_URL}" rel="stylesheet" />
    <title>${title}</title>
  </head>
  <body style="margin: 0; padding: 24px 12px; background-color: #f5f7fb; font-family: ${EMAIL_FONT_STACK};">
    <div style="max-width: ${EMAIL_MAX_WIDTH}px; margin: 0 auto; background-color: ${EMAIL_COLORS.white}; border: 1px solid ${EMAIL_COLORS.border}; border-radius: 8px; padding: 32px;">
      <div style="border-bottom: 3px solid ${EMAIL_COLORS.orange}; padding-bottom: 16px; margin-bottom: 24px;">
        <img src="${logoUrl}" alt="StyreIQ" width="${EMAIL_LOGO_WIDTH}" style="display: block; width: ${EMAIL_LOGO_WIDTH}px; height: auto; border: 0;" />
      </div>

      ${content}

      <p style="font-size: 12px; color: ${EMAIL_COLORS.muted}; text-align: center; margin: 20px 0 0;">
        &copy; ${new Date().getFullYear()} StyreIQ. All rights reserved.
      </p>
    </div>
  </body>
</html>`
}
