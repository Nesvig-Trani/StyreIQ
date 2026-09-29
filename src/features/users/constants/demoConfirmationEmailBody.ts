import { SUPPORT_EMAIL } from '@/shared/constants'
import {
  EMAIL_COLORS,
  EMAIL_FALLBACK_NAME,
  emailHeadingStyle,
  emailParagraphStyle,
  escapeHtml,
  renderEmailButton,
  renderEmailLayout,
} from './emailTheme'

type DemoConfirmationEmailProps = {
  name: string
  schedulingUrl: string
}

export const demoConfirmationEmailBody = ({ name, schedulingUrl }: DemoConfirmationEmailProps) =>
  renderEmailLayout({
    title: 'Thanks for your interest in StyreIQ',
    content: `
      <h1 style="${emailHeadingStyle}">Thanks for your interest in StyreIQ</h1>

      <p style="${emailParagraphStyle}">Hi ${escapeHtml(name) || EMAIL_FALLBACK_NAME},</p>

      <p style="${emailParagraphStyle}">
        Thanks for reaching out. We've received your request for a StyreIQ demo.
      </p>
      <p style="${emailParagraphStyle}">
        Choose a time that works for you using the scheduling link below.
      </p>

      ${renderEmailButton({ href: schedulingUrl, label: 'Schedule Your Demo' })}

      <p style="${emailParagraphStyle}">
        We're looking forward to learning more about how your organization manages social media
        governance and compliance.
      </p>

      <div style="background-color: ${EMAIL_COLORS.warmOffWhite}; border-radius: 8px; padding: 14px 20px; margin-top: 32px; font-size: 14px; color: ${EMAIL_COLORS.text};">
        Questions in the meantime? <a href="mailto:${SUPPORT_EMAIL}" style="color: ${EMAIL_COLORS.blue}; text-decoration: none;">${SUPPORT_EMAIL}</a>
      </div>`,
  })
