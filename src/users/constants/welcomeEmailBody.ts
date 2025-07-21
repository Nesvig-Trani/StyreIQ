import { env } from '@/config/env'

type WelcomeEmailProps = {
  name: string
  instructions: string
  responsibilities: { responsibility: string }[]
  policyLinks: { title: string; url: string }[]
}

export const welcomeEmailBody = ({
  name,
  instructions,
  responsibilities,
  policyLinks,
}: WelcomeEmailProps) => {
  const loginLink = `${env.NEXT_PUBLIC_BASE_URL}/login`
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa;">
      <h1 style="color: #222; font-size: 24px;">Hello ${name || 'User'}!, welcome to StyreIq</h1>

     <p style="text-align: center; margin: 20px 0;">
        <a href="${loginLink}" style="
          background-color: #4a90e2;
          color: #fff;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 4px;
          display: inline-block;
          font-size: 16px;
        ">
          Go to Your Dashboard
        </a>
      </p>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        ${instructions}
      </p>

      ${
        responsibilities.length > 0
          ? `
      <h2 style="font-size: 18px; margin-top: 20px; color: #222;">Your Responsibilities:</h2>
      <ul style="font-size: 16px; color: #555; line-height: 1.6; padding-left: 20px;">
        ${responsibilities.map((r) => `<li>${r.responsibility}</li>`).join('')}
      </ul>
      `
          : ''
      }

      ${
        policyLinks.length > 0
          ? `
      <h2 style="font-size: 18px; margin-top: 20px; color: #222;">Company Policies:</h2>
      <ul style="font-size: 16px; color: #555; line-height: 1.6; padding-left: 20px;">
        ${policyLinks
          .map(
            (p) =>
              `<li><a href="${p.url}" style="color: #4a90e2; text-decoration: none;">${p.title}</a></li>`,
          )
          .join('')}
      </ul>
      `
          : ''
      }

      <p style="font-size: 14px; color: #999; line-height: 1.5; margin-top: 30px;">
        If you have any questions or need assistance, please reach out to your manager or the support team.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

      <p style="font-size: 12px; color: #bbb; text-align: center;">
        &copy; ${new Date().getFullYear()} Your Company. All rights reserved.
      </p>
    </div>
  `
}
