var __defProp = Object.defineProperty;
var __name = (target, value) => __defProp(target, "name", { value, configurable: true });

// src/clerk-email-notifications.ts
async function sendOrganizationWelcomeEmail(org, env) {
  if (!env.RESEND_API_KEY) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: "admin@carrierllm.com",
        // You'd get this from the org admin
        subject: `\u{1F389} Welcome to CarrierLLM! Your organization "${org.name}" is ready`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">Welcome to CarrierLLM!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Congratulations! Your organization <strong>${org.name}</strong> has been successfully created and is ready to use.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">\u{1F680} What's Next?</h3>
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
                Get Started \u2192
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
    console.error("Failed to send organization welcome email:", error);
    return false;
  }
}
__name(sendOrganizationWelcomeEmail, "sendOrganizationWelcomeEmail");
async function sendTeamWelcomeEmail(membership, env) {
  if (!env.RESEND_API_KEY || !membership.public_user_data?.user_id) return false;
  try {
    const userEmail = membership.public_user_data?.identifier || "team@carrierllm.com";
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: userEmail,
        subject: `\u{1F44B} Welcome to ${membership.organization.name} on CarrierLLM!`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">Welcome to the team!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${membership.public_user_data?.first_name || "there"},<br><br>
              You've been added to <strong>${membership.organization.name}</strong> on CarrierLLM! 
              You now have access to our intelligent carrier recommendation platform.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">\u{1F3AF} Your Role: ${membership.role_name}</h3>
              <p style="color: #4b5563; line-height: 1.6;">
                As a ${membership.role_name.toLowerCase()}, you can:
                ${membership.permissions?.map((perm) => `<li style="margin: 8px 0;">${formatPermission(perm)}</li>`).join("")}
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/dashboard" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Access Dashboard \u2192
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
    console.error("Failed to send team welcome email:", error);
    return false;
  }
}
__name(sendTeamWelcomeEmail, "sendTeamWelcomeEmail");
async function sendOrganizationInvitationEmail(invitation, env) {
  if (!env.RESEND_API_KEY) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: invitation.email_address,
        subject: `\u{1F3AF} You're invited to join ${invitation.organization?.name || "a team"} on CarrierLLM`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">You're Invited!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              You've been invited to join <strong>${invitation.organization?.name || "a team"}</strong> on CarrierLLM, 
              the intelligent carrier recommendation platform for insurance professionals.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">\u{1F3AF} Your Role: ${invitation.role_name}</h3>
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
                Accept Invitation \u2192
              </a>
            </div>

            <div style="background: #fef3c7; padding: 20px; border-radius: 8px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <p style="color: #92400e; margin: 0; font-weight: 600;">
                \u23F0 This invitation expires on ${new Date(invitation.expires_at).toLocaleDateString()}
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
    console.error("Failed to send invitation email:", error);
    return false;
  }
}
__name(sendOrganizationInvitationEmail, "sendOrganizationInvitationEmail");
async function sendTrialEndingEmail(item, env) {
  if (!env.RESEND_API_KEY || !item.payer?.user_id) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: item.payer.email,
        subject: `\u23F0 Your CarrierLLM trial is ending soon`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b; font-size: 28px; margin-bottom: 20px;">Trial Ending Soon</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${item.payer.first_name || "there"},<br><br>
              Your free trial for <strong>${item.plan.name}</strong> is ending soon. 
              Don't lose access to your carrier recommendations and team collaboration features!
            </p>

            <div style="background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">\u23F0 Trial Details</h3>
              <p style="color: #92400e; margin: 4px 0;"><strong>Plan:</strong> ${item.plan.name}</p>
              <p style="color: #92400e; margin: 4px 0;"><strong>Price:</strong> ${formatPrice(item.plan.amount, item.plan.currency)}</p>
              <p style="color: #92400e; margin: 4px 0;"><strong>Billing:</strong> ${item.interval}</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/billing" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Continue Subscription \u2192
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
    console.error("Failed to send trial ending email:", error);
    return false;
  }
}
__name(sendTrialEndingEmail, "sendTrialEndingEmail");
async function sendPaymentConfirmationEmail(payment, env) {
  if (!env.RESEND_API_KEY || !payment.payer?.user_id) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: payment.payer.email,
        subject: `\u2705 Payment Confirmed - CarrierLLM`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #10b981; font-size: 28px; margin-bottom: 20px;">Payment Confirmed!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${payment.payer.first_name || "there"},<br><br>
              Thank you! Your payment has been successfully processed and your CarrierLLM subscription is now active.
            </p>

            <div style="background: #f0fdf4; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #10b981;">
              <h3 style="color: #166534; margin-top: 0;">\u{1F4B0} Payment Details</h3>
              <p style="color: #166534; margin: 4px 0;"><strong>Amount:</strong> ${payment.totals.grand_total.amount_formatted}</p>
              <p style="color: #166534; margin: 4px 0;"><strong>Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
              <p style="color: #166534; margin: 4px 0;"><strong>Status:</strong> ${payment.status}</p>
            </div>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #1a1a1a; margin-top: 0;">\u{1F389} You now have access to:</h4>
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
                Access Dashboard \u2192
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
    console.error("Failed to send payment confirmation email:", error);
    return false;
  }
}
__name(sendPaymentConfirmationEmail, "sendPaymentConfirmationEmail");
function formatPermission(permission) {
  return permission.replace(/org:/g, "").replace(/:/g, " ").split(" ").map((word) => word.charAt(0).toUpperCase() + word.slice(1)).join(" ");
}
__name(formatPermission, "formatPermission");
async function sendUserWelcomeEmail(user, env) {
  if (!env.RESEND_API_KEY || !user.email_addresses?.[0]?.email_address) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: user.email_addresses[0].email_address,
        subject: `\u{1F389} Welcome to CarrierLLM!`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">Welcome to CarrierLLM!</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${user.first_name || "there"},<br><br>
              Welcome to CarrierLLM! You now have access to our intelligent carrier recommendation platform 
              that helps insurance professionals find the best carriers for their clients.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">\u{1F680} Getting Started</h3>
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
                Get Started \u2192
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
    console.error("Failed to send user welcome email:", error);
    return false;
  }
}
__name(sendUserWelcomeEmail, "sendUserWelcomeEmail");
async function sendRoleChangeNotification(membership, env) {
  if (!env.RESEND_API_KEY || !membership.public_user_data?.user_id) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: membership.public_user_data.identifier,
        subject: `\u{1F514} Role Update - ${membership.organization.name}`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #3b82f6; font-size: 28px; margin-bottom: 20px;">Role Update</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${membership.public_user_data.first_name || "there"},<br><br>
              Your role in <strong>${membership.organization.name}</strong> has been updated to <strong>${membership.role_name}</strong>.
            </p>

            <div style="background: #eff6ff; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1e40af; margin-top: 0;">\u{1F3AF} Your New Permissions</h3>
              <ul style="color: #4b5563; line-height: 1.8;">
                ${membership.permissions?.map((perm) => `<li>${formatPermission(perm)}</li>`).join("")}
              </ul>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/dashboard" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Access Dashboard \u2192
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
    console.error("Failed to send role change notification:", error);
    return false;
  }
}
__name(sendRoleChangeNotification, "sendRoleChangeNotification");
async function sendSecurityNotification(session, env) {
  if (!env.RESEND_API_KEY || !session.user_id) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: "security@carrierllm.com",
        // You'd get this from user data
        subject: `\u{1F512} Security Alert - Session Revoked`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444; font-size: 28px; margin-bottom: 20px;">Security Alert</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              A session has been revoked for security reasons.
            </p>

            <div style="background: #fef2f2; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #dc2626; margin-top: 0;">\u26A0\uFE0F Session Details</h3>
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
    console.error("Failed to send security notification:", error);
    return false;
  }
}
__name(sendSecurityNotification, "sendSecurityNotification");
async function sendPaymentReminderEmail(item, env) {
  if (!env.RESEND_API_KEY || !item.payer?.user_id) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: item.payer.email,
        subject: `\u26A0\uFE0F Payment Required - CarrierLLM Subscription`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #f59e0b; font-size: 28px; margin-bottom: 20px;">Payment Required</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${item.payer.first_name || "there"},<br><br>
              Your CarrierLLM subscription payment is past due. Please update your payment method to avoid service interruption.
            </p>

            <div style="background: #fef3c7; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #f59e0b;">
              <h3 style="color: #92400e; margin-top: 0;">\u{1F4B0} Payment Details</h3>
              <p style="color: #92400e; margin: 4px 0;"><strong>Plan:</strong> ${item.plan.name}</p>
              <p style="color: #92400e; margin: 4px 0;"><strong>Amount:</strong> ${formatPrice(item.plan.amount, item.plan.currency)}</p>
              <p style="color: #92400e; margin: 4px 0;"><strong>Status:</strong> Past Due</p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/billing" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Update Payment Method \u2192
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
    console.error("Failed to send payment reminder email:", error);
    return false;
  }
}
__name(sendPaymentReminderEmail, "sendPaymentReminderEmail");
async function sendCancellationConfirmationEmail(item, env) {
  if (!env.RESEND_API_KEY || !item.payer?.user_id) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: item.payer.email,
        subject: `\u{1F4DD} Subscription Cancelled - CarrierLLM`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #6b7280; font-size: 28px; margin-bottom: 20px;">Subscription Cancelled</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${item.payer.first_name || "there"},<br><br>
              Your CarrierLLM subscription has been successfully cancelled. We're sorry to see you go!
            </p>

            <div style="background: #f9fafb; padding: 24px; border-radius: 12px; margin: 24px 0;">
              <h3 style="color: #1a1a1a; margin-top: 0;">\u{1F4CB} Cancellation Details</h3>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Plan:</strong> ${item.plan.name}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Cancelled:</strong> ${new Date(item.updated_at).toLocaleDateString()}</p>
              <p style="color: #4b5563; margin: 4px 0;"><strong>Access Until:</strong> ${new Date(item.period_end).toLocaleDateString()}</p>
            </div>

            <div style="background: #eff6ff; padding: 20px; border-radius: 8px; margin: 24px 0;">
              <h4 style="color: #1a1a1a; margin-top: 0;">\u{1F4BE} Your Data</h4>
              <p style="color: #4b5563; line-height: 1.6;">
                Your data will be preserved for 30 days. If you change your mind, you can reactivate your subscription 
                before ${new Date(Date.now() + 30 * 24 * 60 * 60 * 1e3).toLocaleDateString()}.
              </p>
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/billing" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Reactivate Subscription \u2192
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
    console.error("Failed to send cancellation confirmation email:", error);
    return false;
  }
}
__name(sendCancellationConfirmationEmail, "sendCancellationConfirmationEmail");
async function sendPaymentFailedEmail(payment, env) {
  if (!env.RESEND_API_KEY || !payment.payer?.user_id) return false;
  try {
    const response = await fetch("https://api.resend.com/emails", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${env.RESEND_API_KEY}`
      },
      body: JSON.stringify({
        from: env.FROM_EMAIL || "noreply@mail.carrierllm.com",
        to: payment.payer.email,
        subject: `\u274C Payment Failed - CarrierLLM`,
        html: `
          <div style="font-family: system-ui, -apple-system, sans-serif; max-width: 600px; margin: 0 auto;">
            <h1 style="color: #ef4444; font-size: 28px; margin-bottom: 20px;">Payment Failed</h1>
            
            <p style="color: #4b5563; font-size: 16px; line-height: 1.6;">
              Hi ${payment.payer.first_name || "there"},<br><br>
              We were unable to process your payment for your CarrierLLM subscription. Please update your payment method to continue service.
            </p>

            <div style="background: #fef2f2; padding: 24px; border-radius: 12px; margin: 24px 0; border-left: 4px solid #ef4444;">
              <h3 style="color: #dc2626; margin-top: 0;">\u{1F4B3} Payment Details</h3>
              <p style="color: #dc2626; margin: 4px 0;"><strong>Amount:</strong> ${payment.totals.grand_total.amount_formatted}</p>
              <p style="color: #dc2626; margin: 4px 0;"><strong>Date:</strong> ${new Date(payment.created_at).toLocaleDateString()}</p>
              <p style="color: #dc2626; margin: 4px 0;"><strong>Status:</strong> Failed</p>
              ${payment.failed_reason ? `<p style="color: #dc2626; margin: 4px 0;"><strong>Reason:</strong> ${payment.failed_reason}</p>` : ""}
            </div>

            <div style="text-align: center; margin: 32px 0;">
              <a href="${env.APP_URL}/billing" 
                 style="background: #3b82f6; color: white; padding: 12px 24px; border-radius: 8px; text-decoration: none; font-weight: 600;">
                Update Payment Method \u2192
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
    console.error("Failed to send payment failed email:", error);
    return false;
  }
}
__name(sendPaymentFailedEmail, "sendPaymentFailedEmail");

// src/comprehensive-worker.ts
function corsHeaders() {
  return {
    "Access-Control-Allow-Origin": "*",
    "Access-Control-Allow-Methods": "GET, POST, PUT, DELETE, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization, X-User-Id, X-Organization-Id",
    "Content-Type": "application/json"
  };
}
__name(corsHeaders, "corsHeaders");
async function populateCarriersFromDocuments(env) {
  try {
    const existingCarriers = await env.DB.prepare("SELECT COUNT(*) as count FROM carriers").first();
    if (existingCarriers && existingCarriers.count > 0) {
      return;
    }
    console.log("Populating carriers table from existing documents...");
    const list = await env.DOCS_BUCKET.list();
    const carriers = /* @__PURE__ */ new Map();
    for (const obj of list.objects) {
      const filename = obj.key;
      const carrierInfo = extractCarrierInfo(filename);
      if (carrierInfo && !carriers.has(carrierInfo.id)) {
        carriers.set(carrierInfo.id, carrierInfo);
      }
    }
    for (const carrier of carriers.values()) {
      try {
        await env.DB.prepare(`
          INSERT OR IGNORE INTO carriers (id, name, am_best, portal_url, agent_phone, preferred_tier_rank, available_states)
          VALUES (?, ?, ?, ?, ?, ?, ?)
        `).bind(
          carrier.id,
          carrier.name,
          carrier.amBest,
          carrier.portalUrl,
          carrier.agentPhone,
          carrier.preferredTierRank,
          JSON.stringify(carrier.availableStates)
        ).run();
      } catch (error) {
        console.error(`Error inserting carrier ${carrier.id}:`, error);
      }
    }
    console.log(`Populated ${carriers.size} carriers from documents`);
  } catch (error) {
    console.error("Error populating carriers from documents:", error);
  }
}
__name(populateCarriersFromDocuments, "populateCarriersFromDocuments");
function extractCarrierInfo(filename) {
  const nameWithoutExt = filename.replace(/\.(pdf|doc|docx|txt)$/i, "");
  const parts = nameWithoutExt.split(/[-_\s]+/).filter((part) => part.length > 0);
  if (parts.length === 0) return null;
  const carrierName = parts[0];
  const carrierId = carrierName.toLowerCase().replace(/[^a-z0-9]/g, "");
  return {
    id: carrierId,
    name: carrierName,
    amBest: "A+",
    // Default value
    portalUrl: `https://${carrierId}.com`,
    // Default URL
    agentPhone: "1-800-CARRIER",
    // Default phone
    preferredTierRank: 1,
    // Default rank
    availableStates: ["All States"]
    // Default states
  };
}
__name(extractCarrierInfo, "extractCarrierInfo");
var comprehensive_worker_default = {
  async fetch(request, env, ctx) {
    const url = new URL(request.url);
    const path = url.pathname;
    const method = request.method;
    if (method === "OPTIONS") {
      return new Response(null, {
        status: 204,
        headers: corsHeaders()
      });
    }
    try {
      if (path === "/api/health") {
        return new Response(JSON.stringify({
          status: "healthy",
          timestamp: (/* @__PURE__ */ new Date()).toISOString(),
          path
        }), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/analytics/summary" && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        const now = /* @__PURE__ */ new Date();
        const currentMonth = now.toISOString().slice(0, 7);
        const monthStart = new Date(now.getFullYear(), now.getMonth(), 1).toISOString();
        let stats = {
          totalIntakes: 0,
          averageFitScore: 0,
          placementRate: 0,
          remainingRecommendations: 0
        };
        let topCarriers = [];
        let trends = [];
        try {
          const intakesResult = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM (
              SELECT id FROM intakes
              UNION ALL
              SELECT id FROM intake_submissions
            )
          `).first();
          stats.totalIntakes = intakesResult?.count || 0;
          if (userId) {
            try {
              const userUsage = await env.DB.prepare(`
                SELECT COUNT(*) as used
                FROM recommendations
                WHERE user_id = ?
                  AND created_at >= ?
              `).bind(userId, monthStart).first();
              const used = userUsage?.used || 0;
              const userProfile = await env.DB.prepare(
                "SELECT recommendations_limit FROM user_profiles WHERE user_id = ?"
              ).bind(userId).first();
              const limit = userProfile?.recommendations_limit || 0;
              stats.remainingRecommendations = Math.max(0, limit - used);
            } catch (e) {
              console.log("Could not get user usage:", e);
            }
            try {
              const avgScore = await env.DB.prepare(`
                SELECT AVG(fit_score) as avg
                FROM recommendations
                WHERE user_id = ?
              `).bind(userId).first();
              if (avgScore?.avg) {
                stats.averageFitScore = Math.round(avgScore.avg);
              } else {
                stats.averageFitScore = 0;
              }
            } catch (e) {
              console.log("Could not get average score:", e);
            }
            try {
              const topCarriersResult = await env.DB.prepare(`
                SELECT carrier_name, COUNT(*) as count
                FROM recommendations
                WHERE user_id = ?
                GROUP BY carrier_name
                ORDER BY count DESC
                LIMIT 5
              `).bind(userId).all();
              topCarriers = topCarriersResult.results || [];
            } catch (e) {
              console.log("Could not get top carriers:", e);
            }
            try {
              const trendsResult = await env.DB.prepare(`
                SELECT 
                  strftime('%Y-%m', created_at) as month,
                  COUNT(*) as count
                FROM recommendations
                WHERE user_id = ?
                  AND created_at >= date('now', '-6 months')
                GROUP BY strftime('%Y-%m', created_at)
                ORDER BY month
              `).bind(userId).all();
              trends = trendsResult.results || [];
            } catch (e) {
              console.log("Could not get trends:", e);
            }
          }
          try {
            const placements = await env.DB.prepare(`
              SELECT 
                COUNT(CASE WHEN status = 'approved' OR status = 'placed' THEN 1 END) as placed,
                COUNT(*) as total
              FROM outcomes
            `).first();
            if (placements?.total > 0) {
              const placementData = placements;
              stats.placementRate = Math.round(placementData.placed / placementData.total * 100);
            } else {
              stats.placementRate = 0;
            }
          } catch (e) {
            console.log("Could not get placement rate:", e);
          }
        } catch (dbError) {
          console.error("Database error in analytics:", dbError);
        }
        return new Response(JSON.stringify({
          stats,
          topCarriers,
          trends
        }), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/carriers/with-preferences" && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        await populateCarriersFromDocuments(env);
        const carriers = await env.DB.prepare("SELECT * FROM carriers ORDER BY name").all();
        const userPreferences = await env.DB.prepare(
          "SELECT carrier_id, enabled FROM user_carrier_preferences WHERE user_id = ?"
        ).bind(userId).all();
        const organizationId = request.headers.get("X-Organization-Id");
        let orgSettings = { results: [] };
        if (organizationId) {
          orgSettings = await env.DB.prepare(
            "SELECT carrier_id, enabled FROM organization_carrier_settings WHERE organization_id = ?"
          ).bind(organizationId).all();
        }
        const carriersWithPreferences = carriers.results.map((carrier) => {
          const userPref = userPreferences.results.find((pref) => pref.carrier_id === carrier.id);
          const orgSetting = orgSettings.results.find((setting) => setting.carrier_id === carrier.id);
          const userEnabled = userPref ? userPref.enabled : true;
          const organizationEnabled = orgSetting ? orgSetting.enabled : true;
          const isOrganizationControlled = organizationId && orgSetting && !orgSetting.enabled;
          return {
            id: carrier.id,
            name: carrier.name,
            amBest: carrier.am_best,
            portalUrl: carrier.portal_url,
            agentPhone: carrier.agent_phone,
            preferredTierRank: carrier.preferred_tier_rank,
            availableStates: carrier.available_states ? JSON.parse(carrier.available_states) : [],
            userEnabled,
            organizationEnabled,
            isOrganizationControlled
          };
        });
        return new Response(JSON.stringify(carriersWithPreferences), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/carriers/preferences" && method === "POST") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        const { carrierId, enabled } = await request.json();
        if (!carrierId || typeof enabled !== "boolean") {
          return new Response(JSON.stringify({ error: "carrierId and enabled are required" }), {
            status: 400,
            headers: corsHeaders()
          });
        }
        await env.DB.prepare(`
          INSERT INTO user_carrier_preferences (user_id, carrier_id, enabled, created_at, updated_at)
          VALUES (?, ?, ?, datetime('now'), datetime('now'))
          ON CONFLICT(user_id, carrier_id) DO UPDATE SET
            enabled = excluded.enabled,
            updated_at = datetime('now')
        `).bind(userId, carrierId, enabled).run();
        return new Response(JSON.stringify({ success: true }), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/documents/user" && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        const documents = await env.DB.prepare(`
          SELECT id, filename, carrier_id, carrier_name, effective_date, file_size, file_type, 
                 created_at, processed
          FROM user_documents 
          WHERE user_id = ? 
          ORDER BY created_at DESC
        `).bind(userId).all();
        return new Response(JSON.stringify(documents.results), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/documents/upload" && method === "POST") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        const formData = await request.formData();
        const file = formData.get("file");
        const carrierId = formData.get("carrierId");
        const carrierName = formData.get("carrierName");
        const effectiveDate = formData.get("effectiveDate");
        if (!file || !carrierId || !carrierName) {
          return new Response(JSON.stringify({ error: "file, carrierId, and carrierName are required" }), {
            status: 400,
            headers: corsHeaders()
          });
        }
        const allowedTypes = ["application/pdf", "application/msword", "application/vnd.openxmlformats-officedocument.wordprocessingml.document", "text/plain"];
        if (!allowedTypes.includes(file.type)) {
          return new Response(JSON.stringify({ error: "Invalid file type. Only PDF, DOC, DOCX, and TXT files are allowed." }), {
            status: 400,
            headers: corsHeaders()
          });
        }
        if (file.size > 10 * 1024 * 1024) {
          return new Response(JSON.stringify({ error: "File size too large. Maximum size is 10MB." }), {
            status: 400,
            headers: corsHeaders()
          });
        }
        const timestamp = (/* @__PURE__ */ new Date()).toISOString().replace(/[:.]/g, "-");
        const fileExtension = file.name.split(".").pop();
        const filename = `${carrierId}_${timestamp}.${fileExtension}`;
        const r2Key = `user-documents/${userId}/${filename}`;
        const fileBuffer = await file.arrayBuffer();
        await env.DOCS_BUCKET.put(r2Key, fileBuffer, {
          httpMetadata: {
            contentType: file.type
          }
        });
        const result = await env.DB.prepare(`
          INSERT INTO user_documents (user_id, filename, carrier_id, carrier_name, effective_date, 
                                    file_size, file_type, r2_key, created_at, processed)
          VALUES (?, ?, ?, ?, ?, ?, ?, ?, datetime('now'), 0)
        `).bind(
          userId,
          file.name,
          carrierId,
          carrierName,
          effectiveDate || (/* @__PURE__ */ new Date()).toISOString().split("T")[0],
          file.size,
          file.type,
          r2Key
        ).run();
        return new Response(JSON.stringify({
          success: true,
          documentId: result.meta.last_row_id,
          message: `Successfully uploaded ${file.name} for ${carrierName}`
        }), {
          headers: corsHeaders()
        });
      }
      if (path === "/api/user/history" && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          let history;
          try {
            history = await env.DB.prepare(`
              SELECT 
                r.id,
                r.submission_id,
                r.carrier_name,
                r.fit_score,
                r.created_at,
                i.data as intake_data
              FROM recommendations r
              LEFT JOIN intakes i ON r.submission_id = i.id
              WHERE r.user_id = ?
              ORDER BY r.created_at DESC
              LIMIT 50
            `).bind(userId).all();
          } catch (tableError) {
            console.log("Recommendations table not found, trying intakes table:", tableError);
            history = await env.DB.prepare(`
              SELECT 
                id,
                id as submission_id,
                'Unknown Carrier' as carrier_name,
                0 as fit_score,
                created_at,
                data as intake_data
              FROM intakes
              WHERE user_id = ?
              ORDER BY created_at DESC
              LIMIT 50
            `).bind(userId).all();
          }
          const formattedHistory = history.results.map((item) => ({
            id: item.id,
            submissionId: item.submission_id,
            carrierName: item.carrier_name,
            fitScore: item.fit_score,
            createdAt: item.created_at,
            intakeData: item.intake_data ? JSON.parse(item.intake_data) : null
          }));
          return new Response(JSON.stringify(formattedHistory), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error fetching user history:", error);
          return new Response(JSON.stringify([]), {
            headers: corsHeaders()
          });
        }
      }
      if (path === "/api/intake/submit" && method === "POST") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          const intakeData = await request.json();
          console.log("Received intake data:", JSON.stringify(intakeData, null, 2));
          const submissionId = `sub_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
          await env.DB.prepare(`
            INSERT INTO intakes (id, tenant_id, payload_json, validated, tier2_triggered, user_id, created_at)
            VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
          `).bind(
            submissionId,
            request.headers.get("X-Organization-Id") || "default",
            JSON.stringify(intakeData),
            intakeData.validated || false,
            intakeData.tier2Triggered || false,
            userId
          ).run();
          const recommendations = [];
          for (const rec of recommendations) {
            try {
              await env.DB.prepare(`
                INSERT INTO recommendations (user_id, submission_id, carrier_name, fit_score, 
                                          reasons, advisories, created_at)
                VALUES (?, ?, ?, ?, ?, ?, datetime('now'))
              `).bind(
                userId,
                submissionId,
                rec.carrierName,
                rec.fitScore,
                JSON.stringify(rec.reasons),
                JSON.stringify(rec.advisories)
              ).run();
            } catch (e) {
              console.log("Could not store recommendation:", e);
            }
          }
          return new Response(JSON.stringify({
            submissionId,
            recommendations
          }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error processing intake:", error);
          console.error("Error stack:", error instanceof Error ? error.stack : "No stack trace");
          return new Response(JSON.stringify({
            error: "Failed to process intake",
            details: error instanceof Error ? error.message : String(error),
            stack: error instanceof Error ? error.stack : void 0
          }), {
            status: 500,
            headers: corsHeaders()
          });
        }
      }
      if (path.startsWith("/api/recommendations/") && method === "GET") {
        const submissionId = path.split("/")[3];
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          const recommendations = await env.DB.prepare(`
            SELECT carrier_name, fit_score, reasons, advisories, created_at
            FROM recommendations
            WHERE submission_id = ? AND user_id = ?
            ORDER BY fit_score DESC
          `).bind(submissionId, userId).all();
          const formattedRecommendations = recommendations.results.map((rec) => ({
            carrierName: rec.carrier_name,
            fitScore: rec.fit_score,
            reasons: rec.reasons ? JSON.parse(rec.reasons) : [],
            advisories: rec.advisories ? JSON.parse(rec.advisories) : [],
            createdAt: rec.created_at
          }));
          return new Response(JSON.stringify({
            submissionId,
            recommendations: formattedRecommendations
          }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error fetching recommendations:", error);
          return new Response(JSON.stringify({ error: "Failed to fetch recommendations" }), {
            status: 500,
            headers: corsHeaders()
          });
        }
      }
      if (path === "/api/outcomes" && method === "POST") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          const { submissionId, carrierName, status, notes } = await request.json();
          await env.DB.prepare(`
            INSERT INTO outcomes (user_id, submission_id, carrier_name, status, notes, created_at)
            VALUES (?, ?, ?, ?, ?, datetime('now'))
          `).bind(userId, submissionId, carrierName, status, notes || "").run();
          return new Response(JSON.stringify({ success: true }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error logging outcome:", error);
          return new Response(JSON.stringify({ error: "Failed to log outcome" }), {
            status: 500,
            headers: corsHeaders()
          });
        }
      }
      if (path === "/webhook" && method === "POST") {
        try {
          const svixId = request.headers.get("svix-id");
          const svixTimestamp = request.headers.get("svix-timestamp");
          const svixSignature = request.headers.get("svix-signature");
          if (!svixId || !svixTimestamp || !svixSignature) {
            console.error("Missing Clerk webhook headers");
            return new Response("Missing webhook headers", {
              status: 400,
              headers: corsHeaders()
            });
          }
          const clientIP = request.headers.get("cf-connecting-ip") || "unknown";
          const rateLimitKey = `webhook_rate_limit_${clientIP}`;
          const rateLimitCheck = await env.DB.prepare(`
            SELECT COUNT(*) as count FROM webhook_rate_limits 
            WHERE ip_address = ? AND created_at > datetime('now', '-1 minute')
          `).bind(clientIP).first();
          if (rateLimitCheck?.count > 10) {
            console.error(`Rate limit exceeded for IP: ${clientIP}`);
            return new Response("Rate limit exceeded", {
              status: 429,
              headers: corsHeaders()
            });
          }
          await env.DB.prepare(`
            INSERT INTO webhook_rate_limits (ip_address, created_at)
            VALUES (?, datetime('now'))
          `).bind(clientIP).run();
          const body = await request.text();
          const event = JSON.parse(body);
          console.log(`Received Clerk webhook: ${event.type} from IP: ${clientIP}`);
          switch (event.type) {
            // User Events
            case "user.created": {
              const user = event.data;
              console.log(`New user created: ${user.email_addresses?.[0]?.email_address || "unknown"} (${user.id})`);
              if (env.RESEND_API_KEY && user.email_addresses?.[0]?.email_address) {
                await sendUserWelcomeEmail(user, env);
              }
              break;
            }
            case "user.updated": {
              const user = event.data;
              console.log(`User updated: ${user.email_addresses?.[0]?.email_address || "unknown"} (${user.id})`);
              await logUserChanges(user, env);
              break;
            }
            // Organization Events
            case "organization.created": {
              const org = event.data;
              console.log(`New organization created: ${org.name} (${org.id})`);
              if (env.RESEND_API_KEY && org.created_by) {
                await sendOrganizationWelcomeEmail(org, env);
              }
              break;
            }
            case "organizationMembership.created": {
              const membership = event.data;
              console.log(`User ${membership.public_user_data?.identifier} joined organization ${membership.organization.name}`);
              if (env.RESEND_API_KEY && membership.public_user_data?.user_id) {
                await sendTeamWelcomeEmail(membership, env);
              }
              break;
            }
            case "organizationMembership.updated": {
              const membership = event.data;
              console.log(`Organization membership updated: ${membership.public_user_data?.identifier} role changed to ${membership.role_name}`);
              if (env.RESEND_API_KEY && membership.public_user_data?.user_id) {
                await sendRoleChangeNotification(membership, env);
              }
              break;
            }
            case "organizationInvitation.created": {
              const invitation = event.data;
              console.log(`Invitation sent to ${invitation.email_address} for organization`);
              if (env.RESEND_API_KEY) {
                await sendOrganizationInvitationEmail(invitation, env);
              }
              break;
            }
            // Session Events
            case "session.created": {
              const session = event.data;
              console.log(`Session created for user ${session.user_id}`);
              await trackUserSession(session, env);
              break;
            }
            case "session.revoked": {
              const session = event.data;
              console.log(`Session revoked for user ${session.user_id}`);
              if (env.RESEND_API_KEY) {
                await sendSecurityNotification(session, env);
              }
              break;
            }
            // Subscription Events
            case "subscriptionItem.freeTrialEnding": {
              const item = event.data;
              console.log(`Free trial ending for subscription ${item.subscription_id}`);
              if (env.RESEND_API_KEY && item.payer?.user_id) {
                await sendTrialEndingEmail(item, env);
              }
              break;
            }
            case "subscriptionItem.pastDue": {
              const item = event.data;
              console.log(`Subscription past due for ${item.subscription_id}`);
              if (env.RESEND_API_KEY && item.payer?.user_id) {
                await sendPaymentReminderEmail(item, env);
              }
              break;
            }
            case "subscriptionItem.canceled": {
              const item = event.data;
              console.log(`Subscription canceled for ${item.subscription_id}`);
              if (env.RESEND_API_KEY && item.payer?.user_id) {
                await sendCancellationConfirmationEmail(item, env);
              }
              break;
            }
            // Payment Events
            case "paymentAttempt.created": {
              const payment = event.data;
              console.log(`Payment attempt created: ${payment.status}`);
              if (env.RESEND_API_KEY && payment.status === "paid" && payment.payer?.user_id) {
                await sendPaymentConfirmationEmail(payment, env);
              }
              break;
            }
            case "paymentAttempt.updated": {
              const payment = event.data;
              console.log(`Payment attempt updated: ${payment.status}`);
              if (env.RESEND_API_KEY && payment.status === "failed" && payment.payer?.user_id) {
                await sendPaymentFailedEmail(payment, env);
              }
              break;
            }
            default:
              console.log(`Unhandled webhook event: ${event.type}`);
          }
          await logWebhookEvent(event, env);
          return new Response(JSON.stringify({ received: true }), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Webhook processing error:", error);
          return new Response(JSON.stringify({
            error: "Webhook processing failed",
            details: error instanceof Error ? error.message : String(error)
          }), {
            status: 500,
            headers: corsHeaders()
          });
        }
      }
      if (path.startsWith("/api/subscriptions/") && method === "GET") {
        const userId = request.headers.get("X-User-Id");
        if (!userId) {
          return new Response(JSON.stringify({ error: "User ID required" }), {
            status: 401,
            headers: corsHeaders()
          });
        }
        try {
          const subscriptionData = {
            plan: { name: "Free" },
            subscription: { status: "active" },
            usage: {
              current: 0,
              limit: 5
            }
          };
          return new Response(JSON.stringify(subscriptionData), {
            headers: corsHeaders()
          });
        } catch (error) {
          console.error("Error fetching subscription data:", error);
          return new Response(JSON.stringify({
            error: "Failed to fetch subscription data",
            details: error instanceof Error ? error.message : String(error)
          }), {
            status: 500,
            headers: corsHeaders()
          });
        }
      }
      return new Response(JSON.stringify({
        message: "Not found",
        path
      }), {
        status: 404,
        headers: corsHeaders()
      });
    } catch (error) {
      console.error("Worker error:", error);
      return new Response(JSON.stringify({
        error: "Internal server error",
        details: error instanceof Error ? error.message : "Unknown error"
      }), {
        status: 500,
        headers: corsHeaders()
      });
    }
  }
};
async function logUserChanges(user, env) {
  try {
    await env.DB.prepare(`
      INSERT INTO user_audit_log (user_id, action, changes, created_at)
      VALUES (?, 'profile_updated', ?, datetime('now'))
    `).bind(user.id, JSON.stringify(user)).run();
  } catch (error) {
    console.error("Failed to log user changes:", error);
  }
}
__name(logUserChanges, "logUserChanges");
async function trackUserSession(session, env) {
  try {
    await env.DB.prepare(`
      INSERT INTO user_sessions (user_id, session_id, ip_address, user_agent, created_at)
      VALUES (?, ?, ?, ?, datetime('now'))
    `).bind(
      session.user_id,
      session.id,
      session.latest_activity?.ip_address || "unknown",
      session.latest_activity?.browser_name || "unknown"
    ).run();
  } catch (error) {
    console.error("Failed to track user session:", error);
  }
}
__name(trackUserSession, "trackUserSession");
async function logWebhookEvent(event, env) {
  try {
    await env.DB.prepare(`
      INSERT INTO webhook_events (event_id, event_type, user_id, payload, status, created_at)
      VALUES (?, ?, ?, ?, 'processed', datetime('now'))
    `).bind(
      event.id,
      event.type,
      event.data?.id || event.data?.user_id || null,
      JSON.stringify(event)
    ).run();
  } catch (error) {
    console.error("Failed to log webhook event:", error);
  }
}
__name(logWebhookEvent, "logWebhookEvent");

// ../../../../../Users/cinef/AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-ensure-req-body-drained.ts
var drainBody = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } finally {
    try {
      if (request.body !== null && !request.bodyUsed) {
        const reader = request.body.getReader();
        while (!(await reader.read()).done) {
        }
      }
    } catch (e) {
      console.error("Failed to drain the unused request body.", e);
    }
  }
}, "drainBody");
var middleware_ensure_req_body_drained_default = drainBody;

// ../../../../../Users/cinef/AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/middleware-miniflare3-json-error.ts
function reduceError(e) {
  return {
    name: e?.name,
    message: e?.message ?? String(e),
    stack: e?.stack,
    cause: e?.cause === void 0 ? void 0 : reduceError(e.cause)
  };
}
__name(reduceError, "reduceError");
var jsonError = /* @__PURE__ */ __name(async (request, env, _ctx, middlewareCtx) => {
  try {
    return await middlewareCtx.next(request, env);
  } catch (e) {
    const error = reduceError(e);
    return Response.json(error, {
      status: 500,
      headers: { "MF-Experimental-Error-Stack": "true" }
    });
  }
}, "jsonError");
var middleware_miniflare3_json_error_default = jsonError;

// .wrangler/tmp/bundle-sMlhmP/middleware-insertion-facade.js
var __INTERNAL_WRANGLER_MIDDLEWARE__ = [
  middleware_ensure_req_body_drained_default,
  middleware_miniflare3_json_error_default
];
var middleware_insertion_facade_default = comprehensive_worker_default;

// ../../../../../Users/cinef/AppData/Local/npm-cache/_npx/d77349f55c2be1c0/node_modules/wrangler/templates/middleware/common.ts
var __facade_middleware__ = [];
function __facade_register__(...args) {
  __facade_middleware__.push(...args.flat());
}
__name(__facade_register__, "__facade_register__");
function __facade_invokeChain__(request, env, ctx, dispatch, middlewareChain) {
  const [head, ...tail] = middlewareChain;
  const middlewareCtx = {
    dispatch,
    next(newRequest, newEnv) {
      return __facade_invokeChain__(newRequest, newEnv, ctx, dispatch, tail);
    }
  };
  return head(request, env, ctx, middlewareCtx);
}
__name(__facade_invokeChain__, "__facade_invokeChain__");
function __facade_invoke__(request, env, ctx, dispatch, finalMiddleware) {
  return __facade_invokeChain__(request, env, ctx, dispatch, [
    ...__facade_middleware__,
    finalMiddleware
  ]);
}
__name(__facade_invoke__, "__facade_invoke__");

// .wrangler/tmp/bundle-sMlhmP/middleware-loader.entry.ts
var __Facade_ScheduledController__ = class ___Facade_ScheduledController__ {
  constructor(scheduledTime, cron, noRetry) {
    this.scheduledTime = scheduledTime;
    this.cron = cron;
    this.#noRetry = noRetry;
  }
  static {
    __name(this, "__Facade_ScheduledController__");
  }
  #noRetry;
  noRetry() {
    if (!(this instanceof ___Facade_ScheduledController__)) {
      throw new TypeError("Illegal invocation");
    }
    this.#noRetry();
  }
};
function wrapExportedHandler(worker) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return worker;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  const fetchDispatcher = /* @__PURE__ */ __name(function(request, env, ctx) {
    if (worker.fetch === void 0) {
      throw new Error("Handler does not export a fetch() function.");
    }
    return worker.fetch(request, env, ctx);
  }, "fetchDispatcher");
  return {
    ...worker,
    fetch(request, env, ctx) {
      const dispatcher = /* @__PURE__ */ __name(function(type, init) {
        if (type === "scheduled" && worker.scheduled !== void 0) {
          const controller = new __Facade_ScheduledController__(
            Date.now(),
            init.cron ?? "",
            () => {
            }
          );
          return worker.scheduled(controller, env, ctx);
        }
      }, "dispatcher");
      return __facade_invoke__(request, env, ctx, dispatcher, fetchDispatcher);
    }
  };
}
__name(wrapExportedHandler, "wrapExportedHandler");
function wrapWorkerEntrypoint(klass) {
  if (__INTERNAL_WRANGLER_MIDDLEWARE__ === void 0 || __INTERNAL_WRANGLER_MIDDLEWARE__.length === 0) {
    return klass;
  }
  for (const middleware of __INTERNAL_WRANGLER_MIDDLEWARE__) {
    __facade_register__(middleware);
  }
  return class extends klass {
    #fetchDispatcher = /* @__PURE__ */ __name((request, env, ctx) => {
      this.env = env;
      this.ctx = ctx;
      if (super.fetch === void 0) {
        throw new Error("Entrypoint class does not define a fetch() function.");
      }
      return super.fetch(request);
    }, "#fetchDispatcher");
    #dispatcher = /* @__PURE__ */ __name((type, init) => {
      if (type === "scheduled" && super.scheduled !== void 0) {
        const controller = new __Facade_ScheduledController__(
          Date.now(),
          init.cron ?? "",
          () => {
          }
        );
        return super.scheduled(controller);
      }
    }, "#dispatcher");
    fetch(request) {
      return __facade_invoke__(
        request,
        this.env,
        this.ctx,
        this.#dispatcher,
        this.#fetchDispatcher
      );
    }
  };
}
__name(wrapWorkerEntrypoint, "wrapWorkerEntrypoint");
var WRAPPED_ENTRY;
if (typeof middleware_insertion_facade_default === "object") {
  WRAPPED_ENTRY = wrapExportedHandler(middleware_insertion_facade_default);
} else if (typeof middleware_insertion_facade_default === "function") {
  WRAPPED_ENTRY = wrapWorkerEntrypoint(middleware_insertion_facade_default);
}
var middleware_loader_entry_default = WRAPPED_ENTRY;
export {
  __INTERNAL_WRANGLER_MIDDLEWARE__,
  middleware_loader_entry_default as default
};
//# sourceMappingURL=comprehensive-worker.js.map
