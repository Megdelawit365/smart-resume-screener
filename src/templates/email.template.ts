export interface ApplicationEmailProps {
    candidateName: string;
    jobTitle: string;
    applicationId: string;
}

export function applicationConfirmationTemplate(props: ApplicationEmailProps): string {
    return `
    <!DOCTYPE html>
    <html>
      <head>
        <meta charset="utf-8">
        <style>
          body { font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif; background-color: #f8fafc; margin: 0; padding: 20px; }
          .card { max-width: 560px; margin: 0 auto; background: #ffffff; border-radius: 8px; border: 1px solid #e2e8f0; overflow: hidden; }
          .header { background: #0284c7; padding: 24px; text-align: center; color: #ffffff; }
          .content { padding: 24px; color: #1e293b; line-height: 1.6; }
          .detail-box { background: #f0f9ff; border-left: 4px solid #0284c7; padding: 14px; margin: 18px 0; border-radius: 0 6px 6px 0; }
          .footer { background: #f1f5f9; padding: 16px; text-align: center; font-size: 12px; color: #64748b; }
        </style>
      </head>
      <body>
        <div class="card">
          <div class="header">
            <h1 style="margin: 0; font-size: 20px;">Resume Screener API</h1>
          </div>
          <div class="content">
            <h2 style="margin-top: 0; font-size: 18px; color: #0f172a;">Application Received</h2>
            <p>Hello <strong>${props.candidateName}</strong>,</p>
            <p>We have received your application. Our team will review it shortly.</p>
            <div class="detail-box">
              <p style="margin: 4px 0;"><strong>Position:</strong> ${props.jobTitle}</p>
              <p style="margin: 4px 0;"><strong>Reference ID:</strong> <code>${props.applicationId}</code></p>
            </div>
          </div>
          <div class="footer">
            <p style="margin: 0;">Resume Screener API</p>
          </div>
        </div>
      </body>
    </html>
  `;
}

export function statusUpdateTemplate(candidateName: string, jobTitle: string, status: string,): string {
    return `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #0284c7;">Application Update</h2>
      <p>Hi ${candidateName},</p>
      <p>Your application for <strong>${jobTitle}</strong> is now: <strong>${status}</strong>.</p>
    </div>
  `;
}

export function shortlistInviteTemplate(candidateName: string, jobTitle: string): string {
    return `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #0284c7;">You have been shortlisted</h2>
      <p>Hi ${candidateName},</p>
      <p>Congratulations! You have been shortlisted for <strong>${jobTitle}</strong>. Our team will reach out with next steps.</p>
    </div>
  `;
}

export function welcomeEmailTemplate(name: string): string {
    return `
    <div style="font-family: sans-serif; padding: 20px; color: #1e293b;">
      <h2 style="color: #0284c7;">Welcome to Resume Screener, ${name}!</h2>
      <p>Your account is ready. You can now browse jobs and apply.</p>
    </div>
  `;
}