import { RequestDemoInput } from '@/shared/schemas/requestDemoSchema'
import {
  EMAIL_COLORS,
  emailHeadingStyle,
  emailParagraphStyle,
  escapeHtml,
  renderEmailButton,
  renderEmailLayout,
} from './emailTheme'

const NOT_PROVIDED = 'Not provided'

const detailLineStyle = `font-size: 15px; line-height: 1.7; color: ${EMAIL_COLORS.text}; margin: 0;`

const renderDetail = (label: string, value?: string) =>
  `<p style="${detailLineStyle}"><strong>${label}:</strong> ${escapeHtml(value || NOT_PROVIDED)}</p>`

export const requestDemoEmailBody = ({ name, email, company, role }: RequestDemoInput) =>
  renderEmailLayout({
    title: 'New demo request',
    content: `
      <h1 style="${emailHeadingStyle}">New demo request</h1>

      <p style="${emailParagraphStyle}">A new demo request has been submitted through styreiq.com.</p>

      <div style="background-color: ${EMAIL_COLORS.coolOffWhite}; border-left: 4px solid ${EMAIL_COLORS.blue}; border-radius: 8px; padding: 16px 20px; margin: 24px 0;">
        ${renderDetail('Name', name)}
        ${renderDetail('Email', email)}
        ${renderDetail('Organization', company)}
        ${renderDetail('Role', role)}
      </div>

      ${renderEmailButton({ href: `mailto:${escapeHtml(email)}`, label: 'View Lead' })}`,
  })
