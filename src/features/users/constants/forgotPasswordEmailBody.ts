import { env } from '@/config/env'

type ForgotPasswordEmailProps = {
  name?: string
  token: string
}

export const forgotPasswordEmailBody = ({ name, token }: ForgotPasswordEmailProps) => {
  const resetUrl = `${env.NEXT_PUBLIC_BASE_URL}/reset-password?token=${encodeURIComponent(token)}`

  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa;">
      <h1 style="color: #222; font-size: 24px;">Hello ${name || 'User'},</h1>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        You recently requested to reset your password. Click the button below to recover your account:
      </p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${resetUrl}" style="
          background-color: #4a90e2;
          color: #fff;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 4px;
          display: inline-block;
          font-size: 16px;
        ">
          Recover Your Password
        </a>
      </p>

      <p style="font-size: 14px; color: #999; line-height: 1.5;">
        If you did not request a password reset, please ignore this email or contact support if you have concerns.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

      <p style="font-size: 12px; color: #bbb; text-align: center;">
        &copy; ${new Date().getFullYear()} StyreIq. All rights reserved.
      </p>
    </div>
  `
}
