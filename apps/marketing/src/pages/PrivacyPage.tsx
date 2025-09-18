export const PrivacyPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Privacy Policy</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600">Effective Date: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Information We Collect</h2>
            <p className="text-gray-700">We collect information you provide directly to us:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
              <li>Account information (name, email, company, license number)</li>
              <li>Client intake data for carrier matching</li>
              <li>Usage data and analytics</li>
              <li>Communications and support requests</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. How We Use Your Information</h2>
            <p className="text-gray-700">We use the information we collect to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
              <li>Provide and improve our carrier recommendation services</li>
              <li>Process transactions and send related information</li>
              <li>Send technical notices and support messages</li>
              <li>Respond to your comments and questions</li>
              <li>Monitor and analyze trends and usage</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. HIPAA Compliance</h2>
            <p className="text-gray-700">
              For health insurance-related data, we maintain HIPAA compliance standards. Protected Health Information
              (PHI) is encrypted at rest and in transit, and access is strictly controlled and audited.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Data Security</h2>
            <p className="text-gray-700">
              We implement industry-standard security measures including:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
              <li>256-bit AES encryption for data at rest</li>
              <li>TLS 1.3 for data in transit</li>
              <li>Multi-factor authentication</li>
              <li>Regular security audits and penetration testing</li>
              <li>SOC 2 Type II compliance</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Data Sharing</h2>
            <p className="text-gray-700">
              We do not sell, trade, or rent your personal information. We may share your information only:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
              <li>With your explicit consent</li>
              <li>To comply with legal obligations</li>
              <li>To protect rights, property, or safety</li>
              <li>With service providers under strict confidentiality agreements</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Retention</h2>
            <p className="text-gray-700">
              We retain your information for as long as your account is active or as needed to provide services.
              Intake data is retained for 7 years to comply with insurance regulations. You may request deletion
              of your data at any time, subject to legal retention requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Your Rights</h2>
            <p className="text-gray-700">You have the right to:</p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
              <li>Access your personal information</li>
              <li>Correct inaccurate data</li>
              <li>Request deletion of your data</li>
              <li>Export your data in a portable format</li>
              <li>Opt-out of marketing communications</li>
              <li>Lodge a complaint with a supervisory authority</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Cookies and Tracking</h2>
            <p className="text-gray-700">
              We use cookies and similar technologies to analyze trends, administer the website, track users'
              movements, and gather demographic information. You can control cookies through your browser settings.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Third-Party Services</h2>
            <p className="text-gray-700">
              We use the following third-party services that may collect data:
            </p>
            <ul className="list-disc list-inside text-gray-700 space-y-1 mt-2">
              <li>Clerk for authentication</li>
              <li>Stripe for payment processing</li>
              <li>Cloudflare for infrastructure and security</li>
              <li>Resend for transactional emails</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Children's Privacy</h2>
            <p className="text-gray-700">
              Our Service is not directed to individuals under 18. We do not knowingly collect personal information
              from children. If you become aware that a child has provided us with personal information, please contact us.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. International Data Transfers</h2>
            <p className="text-gray-700">
              Your information may be transferred to and maintained on servers located outside your state, province,
              country, or jurisdiction. We ensure appropriate safeguards are in place for such transfers.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. California Privacy Rights</h2>
            <p className="text-gray-700">
              California residents have additional rights under the CCPA, including the right to know what personal
              information is collected, used, shared, or sold, and the right to opt-out of the sale of personal information.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Updates to Privacy Policy</h2>
            <p className="text-gray-700">
              We may update this Privacy Policy from time to time. We will notify you of any changes by posting
              the new Privacy Policy on this page and updating the "Effective Date" above.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">14. Contact Us</h2>
            <p className="text-gray-700">
              For privacy-related questions or to exercise your rights, contact us at:<br />
              Email: privacy@carrierllm.com<br />
              Data Protection Officer: dpo@carrierllm.com<br />
              Address: 123 Insurance Way, Suite 100, San Francisco, CA 94105
            </p>
          </section>
        </div>

        <div className="mt-12 pt-8 border-t border-gray-200">
          <a href="/" className="text-blue-600 hover:text-blue-800">← Back to Home</a>
        </div>
      </div>
    </div>
  );
};