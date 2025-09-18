import { Card } from '@carrierllm/ui';

export const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Privacy Policy</h1>
          <p className="text-sm text-gray-600">Effective Date: January 1, 2025</p>
          <p className="text-sm text-gray-600">Last Updated: January 1, 2025</p>
        </div>

        <Card className="p-8">
          <div className="prose prose-gray max-w-none">
            <div className="mb-8 p-4 bg-blue-50 rounded-lg border border-blue-200">
              <p className="text-sm text-blue-900 font-semibold mb-2">HIPAA Compliance Notice</p>
              <p className="text-sm text-blue-800">
                CarrierLLM is committed to protecting health information in accordance with HIPAA regulations.
                This Privacy Policy describes how we collect, use, and safeguard your information.
              </p>
            </div>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Information We Collect</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">1.1 Account Information</h3>
            <p className="mb-4 text-gray-700">When you register for CarrierLLM, we collect:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Name and email address</li>
              <li>Company name and insurance license number (optional)</li>
              <li>Phone number (optional)</li>
              <li>Billing information (processed securely through Stripe)</li>
              <li>Authentication credentials (managed by Clerk)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">1.2 Client Information</h3>
            <p className="mb-4 text-gray-700">
              When you submit intake forms, we process the following client information solely for generating recommendations:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Age and state of residence</li>
              <li>Height and weight measurements</li>
              <li>Tobacco and substance use history</li>
              <li>Medical conditions and medications</li>
              <li>Driving history and risk activities</li>
              <li>Coverage requirements and preferences</li>
            </ul>
            <p className="mb-4 text-gray-700">
              <strong>Important:</strong> We do NOT collect or store personally identifiable information (PII) about
              your clients, such as names, SSNs, or contact details.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">1.3 Usage Data</h3>
            <p className="mb-4 text-gray-700">We automatically collect:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Log data (IP address, browser type, access times)</li>
              <li>Device information (operating system, device ID)</li>
              <li>Usage patterns (features used, recommendations generated)</li>
              <li>Performance metrics (page load times, API response times)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">1.4 Cookies and Tracking</h3>
            <p className="mb-4 text-gray-700">We use cookies and similar technologies for:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Authentication and session management</li>
              <li>Remembering user preferences</li>
              <li>Analytics and performance monitoring</li>
              <li>Security and fraud prevention</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">2. How We Use Information</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">2.1 Primary Uses</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Providing carrier recommendations based on intake data</li>
              <li>Processing and managing your subscription</li>
              <li>Communicating service updates and important notices</li>
              <li>Improving our AI models and recommendation accuracy</li>
              <li>Providing customer support</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">2.2 AI Model Training</h3>
            <p className="mb-4 text-gray-700">
              We may use anonymized and aggregated data to improve our AI models. This process:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Removes all identifying information</li>
              <li>Aggregates data across multiple users</li>
              <li>Focuses on patterns rather than individual cases</li>
              <li>Is subject to strict internal review processes</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">3. Information Sharing and Disclosure</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">3.1 We Do NOT Sell Your Data</h3>
            <p className="mb-4 text-gray-700">
              CarrierLLM does not sell, trade, or rent your personal information or client data to third parties.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">3.2 Service Providers</h3>
            <p className="mb-4 text-gray-700">We share information with trusted service providers who assist us:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Cloudflare:</strong> Infrastructure and content delivery</li>
              <li><strong>Clerk:</strong> Authentication and user management</li>
              <li><strong>Stripe:</strong> Payment processing</li>
              <li><strong>Resend:</strong> Email communications</li>
            </ul>
            <p className="mb-4 text-gray-700">
              All service providers are bound by strict confidentiality agreements and are only authorized to use
              information as necessary to provide services to us.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">3.3 Legal Requirements</h3>
            <p className="mb-4 text-gray-700">We may disclose information if required to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Comply with legal obligations or court orders</li>
              <li>Protect our rights, property, or safety</li>
              <li>Prevent fraud or security threats</li>
              <li>Enforce our Terms of Service</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">4. Data Security</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">4.1 Security Measures</h3>
            <p className="mb-4 text-gray-700">We implement industry-standard security measures including:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>TLS/SSL encryption for all data in transit</li>
              <li>AES-256 encryption for data at rest</li>
              <li>Regular security audits and penetration testing</li>
              <li>Access controls and authentication requirements</li>
              <li>Regular backups and disaster recovery procedures</li>
              <li>Employee training on data protection</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">4.2 HIPAA Compliance</h3>
            <p className="mb-4 text-gray-700">For protected health information (PHI), we maintain:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Administrative safeguards (policies, training, access controls)</li>
              <li>Physical safeguards (facility access controls, device security)</li>
              <li>Technical safeguards (encryption, audit logs, integrity controls)</li>
              <li>Business Associate Agreements (BAAs) where required</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">4.3 Incident Response</h3>
            <p className="mb-4 text-gray-700">
              In the event of a data breach, we will:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Notify affected users within 72 hours</li>
              <li>Provide details about the nature and scope of the breach</li>
              <li>Offer guidance on protective measures</li>
              <li>Cooperate with regulatory authorities as required</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">5. Data Retention</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">5.1 Retention Periods</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Account data:</strong> Retained while account is active plus 90 days</li>
              <li><strong>Intake data:</strong> 7 years for compliance purposes</li>
              <li><strong>Analytics data:</strong> 2 years in aggregated form</li>
              <li><strong>Log data:</strong> 90 days for security purposes</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">5.2 Data Deletion</h3>
            <p className="mb-4 text-gray-700">
              You can request deletion of your data at any time. Upon account closure:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Personal information is deleted within 30 days</li>
              <li>Anonymized data may be retained for analytics</li>
              <li>Legally required records are retained per regulations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">6. Your Rights and Choices</h2>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">6.1 Access and Control</h3>
            <p className="mb-4 text-gray-700">You have the right to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request data portability</li>
              <li>Delete your account and data</li>
              <li>Opt-out of marketing communications</li>
              <li>Disable cookies (may affect functionality)</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">6.2 California Privacy Rights (CCPA)</h3>
            <p className="mb-4 text-gray-700">California residents have additional rights including:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Right to know what information is collected</li>
              <li>Right to delete personal information</li>
              <li>Right to opt-out of data sales (we don't sell data)</li>
              <li>Right to non-discrimination for exercising privacy rights</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">6.3 European Privacy Rights (GDPR)</h3>
            <p className="mb-4 text-gray-700">EU residents have rights under GDPR including:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Right to be informed about data processing</li>
              <li>Right of access to personal data</li>
              <li>Right to rectification of inaccurate data</li>
              <li>Right to erasure ("right to be forgotten")</li>
              <li>Right to restrict processing</li>
              <li>Right to data portability</li>
              <li>Right to object to processing</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">7. Children's Privacy</h2>
            <p className="mb-4 text-gray-700">
              CarrierLLM is not intended for use by individuals under 18 years of age. We do not knowingly collect
              personal information from children. If we become aware that we have collected information from a child
              under 18, we will delete that information immediately.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">8. International Data Transfers</h2>
            <p className="mb-4 text-gray-700">
              Your information may be transferred to and processed in the United States and other countries. We ensure
              appropriate safeguards are in place for international transfers, including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Standard contractual clauses approved by the European Commission</li>
              <li>Compliance with Privacy Shield principles where applicable</li>
              <li>Adequate security measures regardless of location</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">9. Third-Party Links</h2>
            <p className="mb-4 text-gray-700">
              Our Service may contain links to third-party websites or services. We are not responsible for the privacy
              practices of these third parties. We encourage you to review their privacy policies before providing any
              personal information.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">10. Changes to This Policy</h2>
            <p className="mb-4 text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any material changes by:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Posting the new policy on this page</li>
              <li>Updating the "Last Updated" date</li>
              <li>Sending an email notification for significant changes</li>
              <li>Obtaining consent where legally required</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">11. Contact Information</h2>
            <p className="mb-4 text-gray-700">
              For privacy-related questions or to exercise your rights, contact our Privacy Officer:
            </p>
            <ul className="list-none mb-4 text-gray-700">
              <li><strong>Email:</strong> privacy@carrierllm.com</li>
              <li><strong>Phone:</strong> 1-800-CARRIER (1-800-227-7437)</li>
              <li><strong>Mail:</strong> Privacy Officer</li>
              <li>CarrierLLM, Inc.</li>
              <li>123 Insurance Blvd, Suite 500</li>
              <li>Wilmington, DE 19801</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">12. Data Protection Officer</h2>
            <p className="mb-4 text-gray-700">
              For EU residents, our Data Protection Officer can be reached at:
            </p>
            <ul className="list-none mb-4 text-gray-700">
              <li><strong>Email:</strong> dpo@carrierllm.com</li>
              <li><strong>Phone:</strong> +44 20 1234 5678</li>
            </ul>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                © 2025 CarrierLLM, Inc. All rights reserved. | Your privacy is our priority.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};