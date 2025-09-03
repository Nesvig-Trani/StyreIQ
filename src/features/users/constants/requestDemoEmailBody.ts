type RequestDemoEmailProps = {
  name: string
  email: string
  company?: string
}

export const requestDemoEmailBody = ({ name, email, company }: RequestDemoEmailProps) => {
  return `
    <div style="font-family: Arial, sans-serif; color: #333; max-width: 600px; margin: auto; padding: 20px; border: 1px solid #eee; border-radius: 8px; background-color: #fafafa;">
      <h2 style="color: #222; font-size: 20px; margin-bottom: 16px;">New Demo Request</h2>

      <p style="font-size: 16px; line-height: 1.5; color: #555;">
        A new demo has been requested. Here are the details:
      </p>

      <ul style="font-size: 15px; color: #444; margin: 20px 0; padding: 0; list-style: none;">
        <li><strong>Name:</strong> ${name}</li>
        <li><strong>Email:</strong> ${email}</li>
        <li><strong>Company:</strong> ${company || 'Not provided'}</li>
      </ul>

      <p style="font-size: 14px; color: #999; line-height: 1.5;">
        Please follow up with the requester as soon as possible.
      </p>

      <hr style="border: none; border-top: 1px solid #eee; margin: 20px 0;" />

      <p style="font-size: 12px; color: #bbb; text-align: center;">
        &copy; ${new Date().getFullYear()} StyreIQ. All rights reserved.
      </p>
    </div>
  `
}
