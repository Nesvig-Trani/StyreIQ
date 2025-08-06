import { env } from '@/config/env'

export const resetPasswordEmailBody = ({ name }: { name: string }) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa;">
      <h1 style="color: #222; font-size: 24px;">Hello ${name || 'User'},</h1>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        We wanted to let you know that your account password was successfully changed.
      </p>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        If you made this change, no further action is required. If you did <strong>not</strong> change your password, please reset your password immediately or contact our support team.
      </p>

      <p style="text-align: center; margin: 30px 0;">
        <a href="${env.NEXT_PUBLIC_BASE_URL}/forgot-password" style="
          background-color: #e94e77;
          color: #fff;
          text-decoration: none;
          padding: 12px 20px;
          border-radius: 4px;
          display: inline-block;
          font-size: 16px;
        ">
          Reset Your Password
        </a>
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

      <p style="font-size: 12px; color: #bbb; text-align: center;">
        &copy; ${new Date().getFullYear()} StyreIq. All rights reserved.
      </p>
    </div>
  `
}
