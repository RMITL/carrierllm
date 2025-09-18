export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6 lg:px-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-8">Terms of Service</h1>
        <div className="prose prose-gray max-w-none space-y-6">
          <p className="text-gray-600">Effective Date: {new Date().toLocaleDateString()}</p>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">1. Acceptance of Terms</h2>
            <p className="text-gray-700">
              By accessing or using CarrierLLM ("Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part of these terms, you do not have permission to access the Service.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">2. Description of Service</h2>
            <p className="text-gray-700">
              CarrierLLM is an AI-powered insurance carrier recommendation platform that helps insurance agents find
              optimal carrier matches for their clients based on risk profiles and requirements.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">3. User Accounts</h2>
            <p className="text-gray-700">
              You must provide accurate, current, and complete information during registration. You are responsible
              for safeguarding your account password and for all activities that occur under your account.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">4. Subscription Plans</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Free Plan: 5 recommendations per month</li>
              <li>Individual Plan: $50/month for 100 recommendations</li>
              <li>Enterprise Plan: $150/month for unlimited recommendations with 5 seats</li>
              <li>Additional seats: $30/month per seat</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">5. Professional Use Only</h2>
            <p className="text-gray-700">
              This Service is intended for use by licensed insurance professionals only. By using the Service,
              you represent that you are properly licensed and authorized to conduct insurance business in your jurisdiction.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">6. Data Accuracy</h2>
            <p className="text-gray-700">
              While we strive for accuracy, CarrierLLM recommendations are AI-generated and should be independently
              verified. You are responsible for ensuring all carrier requirements and underwriting guidelines are met.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">7. Privacy and Data Protection</h2>
            <p className="text-gray-700">
              Your use of the Service is also governed by our Privacy Policy. We maintain strict data protection
              standards including HIPAA compliance where applicable.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">8. Prohibited Uses</h2>
            <ul className="list-disc list-inside text-gray-700 space-y-2">
              <li>Using the Service for any unlawful purpose</li>
              <li>Attempting to bypass usage limits or security measures</li>
              <li>Sharing account credentials with unauthorized users</li>
              <li>Using automated systems to access the Service</li>
              <li>Misrepresenting carrier information or client data</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">9. Intellectual Property</h2>
            <p className="text-gray-700">
              The Service and its original content, features, and functionality are owned by CarrierLLM and are
              protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">10. Limitation of Liability</h2>
            <p className="text-gray-700">
              CarrierLLM shall not be liable for any indirect, incidental, special, consequential, or punitive damages
              resulting from your use or inability to use the Service. Our total liability shall not exceed the amount
              paid by you in the past twelve months.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">11. Termination</h2>
            <p className="text-gray-700">
              We may terminate or suspend your account immediately, without prior notice, for conduct that we believe
              violates these Terms or is harmful to other users, us, or third parties, or for any other reason.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">12. Changes to Terms</h2>
            <p className="text-gray-700">
              We reserve the right to modify these Terms at any time. We will provide notice of any changes by
              posting the new Terms on this page and updating the "Effective Date" above.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-semibold text-gray-900 mt-8 mb-4">13. Contact Information</h2>
            <p className="text-gray-700">
              For questions about these Terms, please contact us at:<br />
              Email: legal@carrierllm.com<br />
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