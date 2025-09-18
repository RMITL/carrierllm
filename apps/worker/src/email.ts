interface EmailEnv {
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  REPLY_TO_EMAIL?: string;
  NOTIFICATION_EMAIL?: string;
}

interface ContactFormData {
  type: 'contact' | 'demo';
  name: string;
  email: string;
  company: string;
  phone?: string;
  message?: string;
  preferredTime?: string;
  timestamp: string;
}

// Send email notification for contact form submissions
export async function sendContactNotification(data: ContactFormData, env: EmailEnv): Promise<boolean> {
  console.log('sendContactNotification called with:', {
    name: data.name,
    email: data.email,
    type: data.type,
    hasResendKey: !!env.RESEND_API_KEY
  });

  console.log('Environment debug:', {
    resendKeyLength: env.RESEND_API_KEY?.length || 0,
    resendAudienceId: env.RESEND_AUDIENCE_ID,
    allEnvKeys: Object.keys(env).filter(key => key.includes('RESEND'))
  });

  const fromEmail = env.FROM_EMAIL || 'noreply@mail.carrierllm.com';
  const replyToEmail = data.email; // Use form sender's email for easy replying
  const toEmail = env.NOTIFICATION_EMAIL || 'info@carrierllm.com';

  console.log('Email config:', { fromEmail, replyToEmail, toEmail });

  // Build email content
  const subject = data.type === 'demo'
    ? `🎯 Demo Request from ${data.name} at ${data.company}`
    : `📧 Sales Inquiry from ${data.name} at ${data.company}`;

  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <h2 style="color: #1a1a1a; border-bottom: 2px solid #3b82f6; padding-bottom: 10px;">
        ${data.type === 'demo' ? 'Demo Request' : 'Sales Inquiry'}
      </h2>

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 20px 0;">
        <p style="margin: 10px 0;"><strong>Name:</strong> ${data.name}</p>
        <p style="margin: 10px 0;"><strong>Company:</strong> ${data.company}</p>
        <p style="margin: 10px 0;"><strong>Email:</strong> <a href="mailto:${data.email}">${data.email}</a></p>
        ${data.phone ? `<p style="margin: 10px 0;"><strong>Phone:</strong> ${data.phone}</p>` : ''}
        ${data.preferredTime ? `<p style="margin: 10px 0;"><strong>Preferred Demo Time:</strong> ${data.preferredTime}</p>` : ''}
        ${data.message ? `
          <div style="margin-top: 20px;">
            <strong>Message:</strong>
            <p style="background: white; padding: 15px; border-radius: 4px; margin-top: 5px;">
              ${data.message.replace(/\n/g, '<br>')}
            </p>
          </div>
        ` : ''}
        <p style="margin: 10px 0; color: #6b7280; font-size: 12px;">
          <strong>Submitted:</strong> ${new Date(data.timestamp).toLocaleString()}
        </p>
      </div>

      ${data.type === 'demo' ? `
        <div style="background: #fef3c7; padding: 15px; border-radius: 8px; margin: 20px 0;">
          <p style="margin: 0; color: #92400e;">
            <strong>📅 Next Step:</strong> Schedule demo via
            <a href="${env.CAL_LINK || 'https://cal.com/carrierllm'}" style="color: #3b82f6;">
              ${(env.CAL_LINK || 'https://cal.com/carrierllm').replace('https://', '')}
            </a>
          </p>
        </div>
      ` : ''}

      <div style="margin-top: 30px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 12px;">
          This notification was sent from CarrierLLM's contact form.
        </p>
      </div>
    </div>
  `;

  const textContent = `
${data.type === 'demo' ? 'Demo Request' : 'Sales Inquiry'}

Name: ${data.name}
Company: ${data.company}
Email: ${data.email}
${data.phone ? `Phone: ${data.phone}` : ''}
${data.preferredTime ? `Preferred Demo Time: ${data.preferredTime}` : ''}
${data.message ? `\nMessage:\n${data.message}` : ''}

Submitted: ${new Date(data.timestamp).toLocaleString()}
${data.type === 'demo' ? `\nNext Step: Schedule demo via ${env.CAL_LINK || 'https://cal.com/carrierllm'}` : ''}
  `.trim();

  // Try to send via available email service
  if (env.RESEND_API_KEY) {
    console.log('Attempting to send via Resend with subject:', subject);
    const result = await sendViaResend(env.RESEND_API_KEY, {
      from: fromEmail,
      to: toEmail,
      subject,
      html: htmlContent,
      text: textContent,
      replyTo: replyToEmail
    });
    console.log('Resend notification result:', result);
    return result;
  } else {
    // Fallback: Log to console if no email service configured
    console.log('Contact form submission (no email service configured):');
    console.log(JSON.stringify(data, null, 2));
    return true;
  }
}

// Send confirmation email to the user
export async function sendContactConfirmation(data: ContactFormData, env: EmailEnv): Promise<boolean> {
  const fromEmail = env.FROM_EMAIL || 'noreply@mail.carrierllm.com';
  const replyToEmail = env.REPLY_TO_EMAIL || 'info@carrierllm.com';

  const subject = data.type === 'demo'
    ? 'Demo Request Received - CarrierLLM'
    : 'Thank You for Contacting CarrierLLM';

  const htmlContent = `
    <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
      <h1 style="color: #3b82f6; font-size: 24px;">CarrierLLM</h1>

      <h2 style="color: #1a1a1a; margin-top: 30px;">
        Hi ${data.name},
      </h2>

      <p style="color: #4b5563; line-height: 1.6;">
        ${data.type === 'demo'
          ? "Thank you for requesting a demo of CarrierLLM! We're excited to show you how our AI-powered carrier placement system can transform your insurance workflow."
          : "Thank you for reaching out to CarrierLLM. We've received your inquiry and our sales team will get back to you within 24 hours."
        }
      </p>

      ${data.type === 'demo' ? `
        <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 30px 0;">
          <h3 style="color: #1e40af; margin-top: 0;">What's Next?</h3>
          <ol style="color: #4b5563; line-height: 1.8;">
            <li>Our team will review your demo request</li>
            <li>You'll receive a calendar invite within 24 hours</li>
            <li>During the demo, we'll show you:
              <ul style="margin-top: 10px;">
                <li>Smart carrier matching in action</li>
                <li>The intake process and recommendation engine</li>
                <li>Analytics and reporting features</li>
                <li>Integration options for your workflow</li>
              </ul>
            </li>
          </ol>
        </div>
      ` : ''}

      <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 30px 0;">
        <h3 style="color: #1a1a1a; margin-top: 0;">Your Information:</h3>
        <p style="color: #4b5563;">
          <strong>Company:</strong> ${data.company}<br>
          <strong>Email:</strong> ${data.email}<br>
          ${data.phone ? `<strong>Phone:</strong> ${data.phone}<br>` : ''}
        </p>
      </div>

      <p style="color: #4b5563; line-height: 1.6;">
        If you have any immediate questions, feel free to reply to this email or contact us at
        <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>.
      </p>

      <div style="margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb;">
        <p style="color: #6b7280; font-size: 14px; line-height: 1.6;">
          Best regards,<br>
          The CarrierLLM Team<br>
          <a href="https://carrierllm.com" style="color: #3b82f6;">www.carrierllm.com</a>
        </p>
      </div>
    </div>
  `;

  if (env.RESEND_API_KEY) {
    return await sendViaResend(env.RESEND_API_KEY, {
      from: fromEmail,
      to: data.email,
      subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, ''),
      replyTo: replyToEmail
    });
  } else if (env.SENDGRID_API_KEY) {
    return await sendViaSendGrid(env.SENDGRID_API_KEY, {
      from: fromEmail,
      to: data.email,
      subject,
      html: htmlContent,
      text: htmlContent.replace(/<[^>]*>/g, '')
    });
  }

  return true;
}

// Send via Resend API
async function sendViaResend(apiKey: string, email: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
  replyTo?: string;
}): Promise<boolean> {
  try {
    console.log('sendViaResend called with:', {
      from: email.from,
      to: email.to,
      subject: email.subject,
      hasApiKey: !!apiKey,
      apiKeyLength: apiKey?.length || 0,
      replyTo: email.replyTo
    });

    const payload = {
      ...email,
      ...(email.replyTo && { reply_to: [email.replyTo] })
    };

    console.log('Resend API payload:', JSON.stringify(payload, null, 2));

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify(payload)
    });

    console.log('Resend API response status:', response.status);
    console.log('Resend API response headers:', Object.fromEntries(response.headers.entries()));

    const responseBody = await response.text();
    console.log('Resend API response body:', responseBody);

    if (!response.ok) {
      console.error('Resend API failed:', {
        status: response.status,
        statusText: response.statusText,
        body: responseBody
      });
    }

    return response.ok;
  } catch (error) {
    console.error('Resend email error:', error);
    return false;
  }
}

// Send via SendGrid API
async function sendViaSendGrid(apiKey: string, email: {
  from: string;
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<boolean> {
  try {
    const response = await fetch('https://api.sendgrid.com/v3/mail/send', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${apiKey}`
      },
      body: JSON.stringify({
        personalizations: [{
          to: [{ email: email.to }]
        }],
        from: { email: email.from, name: 'CarrierLLM' },
        subject: email.subject,
        content: [
          { type: 'text/plain', value: email.text },
          { type: 'text/html', value: email.html }
        ]
      })
    });

    return response.ok;
  } catch (error) {
    console.error('SendGrid email error:', error);
    return false;
  }
}