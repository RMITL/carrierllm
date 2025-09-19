/**
 * Clerk webhook email notifications
 * Handles sending rich email notifications for Clerk events
 */

interface EmailEnv {
  RESEND_API_KEY?: string;
  FROM_EMAIL?: string;
  ADMIN_EMAIL?: string;
  APP_URL?: string;
}

/**
 * Send organization welcome email to admin
 */
export async function sendOrganizationWelcomeEmail(
  org: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: 'admin@carrierllm.com', // You'd get this from the org admin
        subject: `🎉 Welcome to CarrierLLM! Your organization "${org.name}" is ready`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">Welcome to CarrierLLM!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Congratulations! Your organization <strong>${org.name}</strong> has been successfully created and is ready to use.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">🚀 What's Next?</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Invite your team members to collaborate</li>
                <li>Upload your carrier underwriting documents</li>
                <li>Configure carrier preferences for your organization</li>
                <li>Start getting intelligent carrier recommendations</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/carriers" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Get Started →
              </a>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #1a1a1a; margin-top: 0;">Organization Details:</h4>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Name:</strong> ${org.name}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Created:</strong> ${new Date(org.created_at).toLocaleDateString()}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Member Limit:</strong> ${org.max_allowed_memberships}</p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Need help? Contact our support team at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send organization welcome email:', error);
    return false;
  }
}

/**
 * Send team welcome email to new member
 */
export async function sendTeamWelcomeEmail(
  membership: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !membership.public_user_data?.user_id) return false;

  try {
    // Get user email from membership data or fetch from Clerk API
    const userEmail = membership.public_user_data?.identifier || 'team@carrierllm.com';

    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: userEmail,
        subject: `👋 Welcome to ${membership.organization.name} on CarrierLLM!`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">Welcome to the team!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${membership.public_user_data?.first_name || 'there'},<br><br>
              You've been added to <strong>${membership.organization.name}</strong> on CarrierLLM! 
              You now have access to our intelligent carrier recommendation platform.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">🎯 Your Role: ${membership.role_name}</h3>
              <p style="color: #4b5563; line-height: 1.6;">
                As a ${membership.role_name.toLowerCase()}, you can:
                ${membership.permissions?.map((perm: string) => `<li style="margin: 8px 0;">${formatPermission(perm)}</li>`).join('')}
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/dashboard" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Access Dashboard →
              </a>
            </div>

            <div style="background: #f9fafb; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #1a1a1a; margin-top: 0;">Quick Start Guide:</h4>
              <ol style="color: #4b5563; line-height: 1.8;">
                <li>Review your organization's carrier preferences</li>
                <li>Submit your first intake form to get recommendations</li>
                <li>Explore the analytics dashboard</li>
                <li>Upload additional carrier documents if needed</li>
              </ol>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Questions? Reach out to your team admin or contact us at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send team welcome email:', error);
    return false;
  }
}

/**
 * Send organization invitation email
 */
export async function sendOrganizationInvitationEmail(
  invitation: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: invitation.email_address,
        subject: `🎯 You're invited to join ${invitation.organization?.name || 'a team'} on CarrierLLM`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">You're Invited!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You've been invited to join <strong>${invitation.organization?.name || 'a team'}</strong> on CarrierLLM, 
              the intelligent carrier recommendation platform for insurance professionals.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">🎯 Your Role: ${invitation.role_name}</h3>
              <p style="color: #4b5563; line-height: 1.6;">
                You'll have access to:
              </p>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Intelligent carrier matching and recommendations</li>
                <li>Team collaboration and shared carrier preferences</li>
                <li>Analytics and reporting dashboard</li>
                <li>Document management and upload capabilities</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${invitation.url}" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Accept Invitation →
              </a>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-weight: 600;">
                ⏰ This invitation expires on ${new Date(invitation.expires_at).toLocaleDateString()}
              </p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Questions about this invitation? Contact us at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send invitation email:', error);
    return false;
  }
}

/**
 * Send trial ending notification email
 */
export async function sendTrialEndingEmail(
  item: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !item.payer?.user_id) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: item.payer.email,
        subject: `⏰ Your CarrierLLM trial is ending soon`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b; font-size: 28px; margin-bottom: 20px;">Trial Ending Soon</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${item.payer.first_name || 'there'},<br><br>
              Your free trial for <strong>${item.plan.name}</strong> is ending soon. 
              Don't lose access to your carrier recommendations and team collaboration features!
            </p>

            <div style="background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">⏰ Trial Details</h3>
              <p style="color: #92400e; margin: 4px 0;"><strong>Plan:</strong> ${item.plan.name}</p>
              <p style="color: #92400e; margin: 4px 0;"><strong>Price:</strong> ${formatPrice(item.plan.amount, item.plan.currency)}</p>
              <p style="color: #92400e; margin: 4px 0;"><strong>Billing:</strong> ${item.interval}</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/billing" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Continue Subscription →
              </a>
            </div>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #1a1a1a; margin-top: 0;">What happens if you don't upgrade?</h4>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Access to premium carrier recommendations will be limited</li>
                <li>Team collaboration features will be disabled</li>
                <li>Advanced analytics will no longer be available</li>
                <li>Your data will be preserved for 30 days</li>
              </ul>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Questions about billing? Contact us at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send trial ending email:', error);
    return false;
  }
}

/**
 * Send payment confirmation email
 */
export async function sendPaymentConfirmationEmail(
  payment: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !payment.payer?.user_id) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: payment.payer.email,
        subject: `✅ Payment Confirmed - CarrierLLM`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981; font-size: 28px; margin-bottom: 20px;">Payment Confirmed!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${payment.payer.first_name || 'there'},<br><br>
              Thank you! Your payment has been successfully processed and your CarrierLLM subscription is now active.
            </p>

            <div style="background: #f0fdf4; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #166534; margin-top: 0;">💰 Payment Details</h3>
              <p style="color: #166534; margin: 4px 0;"><strong>Amount:</strong> ${payment.totals.grand_total.amount_formatted}</p>
              <p style="color: #166534; margin: 4px 0;"><strong>Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
              <p style="color: #166534; margin: 4px 0;"><strong>Status:</strong> ${payment.status}</p>
            </div>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #1a1a1a; margin-top: 0;">🎉 You now have access to:</h4>
              <ul style="color: #4b5563; line-height: 1.8;">
                <li>Unlimited carrier recommendations</li>
                <li>Advanced analytics and reporting</li>
                <li>Team collaboration features</li>
                <li>Priority support</li>
                <li>Document upload and management</li>
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/dashboard" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Access Dashboard →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Need help? Contact our support team at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send payment confirmation email:', error);
    return false;
  }
}

// Helper functions
function formatPermission(permission: string): string {
  return permission
    .replace(/org:/g, '')
    .replace(/:/g, ' ')
    .split(' ')
    .map(word => word.charAt(0).toUpperCase() + word.slice(1))
    .join(' ');
}

/**
 * Send user welcome email
 */
export async function sendUserWelcomeEmail(
  user: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !user.email_addresses?.[0]?.email_address) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: user.email_addresses[0].email_address,
        subject: `🎉 Welcome to CarrierLLM!`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">Welcome to CarrierLLM!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${user.first_name || 'there'},<br><br>
              Welcome to CarrierLLM! You now have access to our intelligent carrier recommendation platform 
              that helps insurance professionals find the best carriers for their clients.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">🚀 Getting Started</h3>
              <ol style="color: #4b5563; line-height: 1.8;">
                <li>Complete your profile setup</li>
                <li>Configure your carrier preferences</li>
                <li>Submit your first intake form</li>
                <li>Get intelligent carrier recommendations</li>
              </ol>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/dashboard" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Get Started →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Need help? Contact our support team at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send user welcome email:', error);
    return false;
  }
}

/**
 * Send role change notification
 */
export async function sendRoleChangeNotification(
  membership: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !membership.public_user_data?.user_id) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: membership.public_user_data.identifier,
        subject: `🔔 Role Update - ${membership.organization.name}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">Role Update</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${membership.public_user_data.first_name || 'there'},<br><br>
              Your role in <strong>${membership.organization.name}</strong> has been updated to <strong>${membership.role_name}</strong>.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">🎯 Your New Permissions</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                ${membership.permissions?.map((perm: string) => `<li>${formatPermission(perm)}</li>`).join('')}
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/dashboard" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Access Dashboard →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Questions about your new role? Contact your team admin or reach out to us at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send role change notification:', error);
    return false;
  }
}

/**
 * Send security notification for revoked sessions
 */
export async function sendSecurityNotification(
  session: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !session.user_id) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: 'security@carrierllm.com', // You'd get this from user data
        subject: `🔒 Security Alert - Session Revoked`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444; font-size: 28px; margin-bottom: 20px;">Security Alert</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              A session has been revoked for security reasons.
            </p>

            <div style="background: #fef2f2; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #dc2626; margin-top: 0;">⚠️ Session Details</h3>
              <p style="color: #dc2626; margin: 4px 0;"><strong>User ID:</strong> ${session.user_id}</p>
              <p style="color: #dc2626; margin: 4px 0;"><strong>Session ID:</strong> ${session.id}</p>
              <p style="color: #dc2626; margin: 4px 0;"><strong>Revoked:</strong> ${new Date(session.updated_at).toLocaleString()}</p>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              This is an automated security notification from CarrierLLM.
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send security notification:', error);
    return false;
  }
}

/**
 * Send payment reminder email
 */
export async function sendPaymentReminderEmail(
  item: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !item.payer?.user_id) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: item.payer.email,
        subject: `⚠️ Payment Required - CarrierLLM Subscription`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b; font-size: 28px; margin-bottom: 20px;">Payment Required</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${item.payer.first_name || 'there'},<br><br>
              Your CarrierLLM subscription payment is past due. Please update your payment method to avoid service interruption.
            </p>

            <div style="background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">💰 Payment Details</h3>
              <p style="color: #92400e; margin: 4px 0;"><strong>Plan:</strong> ${item.plan.name}</p>
              <p style="color: #92400e; margin: 4px 0;"><strong>Amount:</strong> ${formatPrice(item.plan.amount, item.plan.currency)}</p>
              <p style="color: #92400e; margin: 4px 0;"><strong>Status:</strong> Past Due</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/billing" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Update Payment Method →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Questions about billing? Contact us at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send payment reminder email:', error);
    return false;
  }
}

/**
 * Send cancellation confirmation email
 */
export async function sendCancellationConfirmationEmail(
  item: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !item.payer?.user_id) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: item.payer.email,
        subject: `📝 Subscription Cancelled - CarrierLLM`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6b7280; font-size: 28px; margin-bottom: 20px;">Subscription Cancelled</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${item.payer.first_name || 'there'},<br><br>
              Your CarrierLLM subscription has been successfully cancelled. We're sorry to see you go!
            </p>

            <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1a1a1a; margin-top: 0;">📋 Cancellation Details</h3>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Plan:</strong> ${item.plan.name}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Cancelled:</strong> ${new Date(item.updated_at).toLocaleDateString()}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Access Until:</strong> ${new Date(item.period_end).toLocaleDateString()}</p>
            </div>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #1a1a1a; margin-top: 0;">💾 Your Data</h4>
              <p style="color: #4b5563; line-height: 1.6;">
                Your data will be preserved for 30 days. If you change your mind, you can reactivate your subscription 
                before ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1000).toLocaleDateString()}.
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/billing" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Reactivate Subscription →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              We'd love to hear your feedback. Contact us at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send cancellation confirmation email:', error);
    return false;
  }
}

/**
 * Send payment failed email
 */
export async function sendPaymentFailedEmail(
  payment: any,
  env: EmailEnv
): Promise<boolean> {
  if (!env.RESEND_API_KEY || !payment.payer?.user_id) return false;

  try {
    const response = await fetch('https://api.resend.com/emails', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || 'noreply@mail.carrierllm.com',
        to: payment.payer.email,
        subject: `❌ Payment Failed - CarrierLLM`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444; font-size: 28px; margin-bottom: 20px;">Payment Failed</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${payment.payer.first_name || 'there'},<br><br>
              We were unable to process your payment for your CarrierLLM subscription. Please update your payment method to continue service.
            </p>

            <div style="background: #fef2f2; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #dc2626; margin-top: 0;">💳 Payment Details</h3>
              <p style="color: #dc2626; margin: 4px 0;"><strong>Amount:</strong> ${payment.totals.grand_total.amount_formatted}</p>
              <p style="color: #dc2626; margin: 4px 0;"><strong>Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
              <p style="color: #dc2626; margin: 4px 0;"><strong>Status:</strong> Failed</p>
              ${payment.failed_reason ? `<p style="color: #dc2626; margin: 4px 0;"><strong>Reason:</strong> ${payment.failed_reason}</p>` : ''}
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/billing" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Update Payment Method →
              </a>
            </div>

            <p style="color: #6b7280; font-size: 14px; margin-top: 32px;">
              Need help? Contact our billing team at <a href="mailto:info@carrierllm.com" style="color: #3b82f6;">info@carrierllm.com</a>
            </p>
          </div>
        `
      })
    });

    return response.ok;
  } catch (error) {
    console.error('Failed to send payment failed email:', error);
    return false;
  }
}

