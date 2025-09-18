import { Resend } from 'resend';

interface ResendEnv {
  RESEND_API_KEY?: string;
  RESEND_AUDIENCE_ID?: string;
}

interface ContactData {
  email: string;
  firstName?: string;
  lastName?: string;
  company?: string;
  phone?: string;
  source: 'intake' | 'contact_form' | 'demo_request';
  emailOptIn?: boolean;
  metadata?: Record<string, any>;
}

// Helper function to wait for a specified amount of time
function delay(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

// Add contact to Resend audience using official SDK
export async function addToResendAudience(contactData: ContactData, env: ResendEnv): Promise<boolean> {
  if (!env.RESEND_API_KEY || !env.RESEND_AUDIENCE_ID) {
    console.log('Resend API key or audience ID not configured, skipping contact addition');
    return false;
  }

  try {
    // Initialize Resend SDK
    const resend = new Resend(env.RESEND_API_KEY);

    // Parse name from full name if provided
    let firstName = contactData.firstName || '';
    let lastName = contactData.lastName || '';

    if (firstName && !lastName && firstName.includes(' ')) {
      const parts = firstName.split(' ');
      firstName = parts[0];
      lastName = parts.slice(1).join(' ');
    }

    // Wait 3 seconds after emails to respect rate limits (SDK handles this better)
    console.log('Waiting 3 seconds before contact addition (using Resend SDK)...');
    await delay(3000);

    // Use Resend SDK to create contact (handles duplicate checking automatically)
    const result = await resend.contacts.create({
      email: contactData.email,
      firstName: firstName || undefined,
      lastName: lastName || undefined,
      unsubscribed: contactData.emailOptIn === false, // If they opted out, mark as unsubscribed
      audienceId: env.RESEND_AUDIENCE_ID
    });

    if (result.data) {
      console.log('Contact added to Resend audience via SDK:', {
        email: contactData.email,
        source: contactData.source,
        contactId: result.data.id,
        optedIn: contactData.emailOptIn !== false
      });
      return true;
    } else if (result.error) {
      console.error('Failed to add contact to Resend via SDK:', {
        error: result.error,
        email: contactData.email
      });
      return false;
    }

    return false;
  } catch (error) {
    console.error('Error adding contact to Resend via SDK:', error);
    return false;
  }
}

// Add contact from intake form submission
export async function addIntakeContact(intakeData: any, env: ResendEnv): Promise<boolean> {
  // Extract contact info from intake data
  const email = intakeData.personalInfo?.email || intakeData.email;
  const fullName = intakeData.personalInfo?.name || intakeData.name;

  if (!email) {
    console.log('No email found in intake data, skipping Resend contact addition');
    return false;
  }

  // Parse name
  let firstName = '';
  let lastName = '';
  if (fullName) {
    const nameParts = fullName.trim().split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }

  const contactData: ContactData = {
    email,
    firstName,
    lastName,
    source: 'intake',
    emailOptIn: true, // Intake forms automatically opt-in for product updates
    metadata: {
      age: intakeData.core?.age,
      state: intakeData.core?.state,
      coverageAmount: intakeData.core?.coverageTarget?.amount,
      coverageType: intakeData.core?.coverageTarget?.type,
      submittedAt: new Date().toISOString()
    }
  };

  return await addToResendAudience(contactData, env);
}

// Add contact from contact form submission
export async function addContactFormContact(formData: any, env: ResendEnv): Promise<boolean> {
  if (!formData.email) {
    console.log('No email found in contact form data, skipping Resend contact addition');
    return false;
  }

  // Parse name
  let firstName = '';
  let lastName = '';
  if (formData.name) {
    const nameParts = formData.name.trim().split(' ');
    firstName = nameParts[0] || '';
    lastName = nameParts.slice(1).join(' ') || '';
  }

  const contactData: ContactData = {
    email: formData.email,
    firstName,
    lastName,
    company: formData.company,
    phone: formData.phone,
    source: formData.type === 'demo' ? 'demo_request' : 'contact_form',
    emailOptIn: formData.emailOptIn !== false, // Use form data for opt-in status
    metadata: {
      formType: formData.type,
      company: formData.company,
      phone: formData.phone,
      message: formData.message,
      preferredTime: formData.preferredTime,
      submittedAt: formData.timestamp || new Date().toISOString()
    }
  };

  return await addToResendAudience(contactData, env);
}