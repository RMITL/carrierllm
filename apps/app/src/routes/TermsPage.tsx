import { Card } from '@carrierllm/ui';

export const TermsPage = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-white py-12">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-4">Terms of Service</h1>
          <p className="text-sm text-gray-600">Effective Date: January 1, 2025</p>
        </div>

        <Card className="p-8">
          <div className="prose prose-gray max-w-none">
            <h2 className="text-2xl font-semibold text-gray-900 mb-4">1. Acceptance of Terms</h2>
            <p className="mb-4 text-gray-700">
              By accessing or using CarrierLLM ("the Service"), you agree to be bound by these Terms of Service ("Terms").
              If you disagree with any part of these terms, you do not have permission to access the Service.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">2. Description of Service</h2>
            <p className="mb-4 text-gray-700">
              CarrierLLM is an AI-powered insurance carrier recommendation platform that helps insurance agents identify
              suitable carriers for their clients based on underwriting criteria and client information. The Service includes:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Intake form processing and analysis</li>
              <li>AI-generated carrier recommendations with confidence scores</li>
              <li>Evidence-based citations from carrier underwriting guides</li>
              <li>Analytics and reporting features</li>
              <li>Integration capabilities via API (Enterprise plans)</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">3. Account Registration</h2>
            <p className="mb-4 text-gray-700">
              To use CarrierLLM, you must register for an account through our authentication provider, Clerk.
              You agree to:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Provide accurate, current, and complete information during registration</li>
              <li>Maintain the security of your account credentials</li>
              <li>Promptly notify us of any unauthorized use of your account</li>
              <li>Accept responsibility for all activities that occur under your account</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">4. Acceptable Use Policy</h2>
            <p className="mb-4 text-gray-700">You agree NOT to use the Service to:</p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Violate any applicable laws, regulations, or insurance industry standards</li>
              <li>Submit false, misleading, or fraudulent information</li>
              <li>Attempt to access unauthorized areas of the Service or its systems</li>
              <li>Interfere with or disrupt the Service or its servers</li>
              <li>Reverse engineer, decompile, or attempt to extract the source code</li>
              <li>Use automated systems or software to extract data ("scraping")</li>
              <li>Resell or redistribute the Service without explicit permission</li>
              <li>Impersonate another person or entity</li>
              <li>Use the Service for any unlawful or harmful purpose</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">5. Subscription Plans and Billing</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">5.1 Plans</h3>
            <p className="mb-4 text-gray-700">
              CarrierLLM offers multiple subscription tiers:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li><strong>Free User:</strong> Limited to 5 recommendations per month</li>
              <li><strong>Individual ($50/month):</strong> 100 recommendations per month with advanced features</li>
              <li><strong>Free Organization:</strong> 10 recommendations per month for up to 2 team members</li>
              <li><strong>Enterprise ($150/month):</strong> Unlimited recommendations with 5 team seats included</li>
              <li><strong>Additional Seats ($30/month):</strong> For organizations needing more team members</li>
            </ul>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">5.2 Payment Terms</h3>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>All paid plans include a 3-day free trial</li>
              <li>Billing is processed through Stripe via Clerk</li>
              <li>Subscriptions automatically renew monthly unless canceled</li>
              <li>Upgrades take effect immediately; downgrades at the next billing cycle</li>
              <li>No refunds for partial months or unused recommendations</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">6. Data Privacy and Security</h2>
            <p className="mb-4 text-gray-700">
              We take data protection seriously. Please review our Privacy Policy for detailed information about how we
              collect, use, and protect your data. Key points include:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>We comply with HIPAA requirements for protected health information</li>
              <li>Client data is encrypted in transit and at rest</li>
              <li>We do not sell or share personal information with third parties</li>
              <li>You retain ownership of all client data you submit</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">7. Intellectual Property</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">7.1 Our Property</h3>
            <p className="mb-4 text-gray-700">
              The Service, including its original content, features, and functionality, is owned by CarrierLLM and
              protected by international copyright, trademark, patent, trade secret, and other intellectual property laws.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">7.2 Your Content</h3>
            <p className="mb-4 text-gray-700">
              You retain all rights to the client information and data you submit to the Service. By using the Service,
              you grant us a limited license to process and analyze this data solely to provide the Service to you.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">8. Disclaimers and Limitations</h2>
            <h3 className="text-xl font-semibold text-gray-800 mb-2">8.1 No Professional Advice</h3>
            <p className="mb-4 text-gray-700">
              <strong>IMPORTANT:</strong> CarrierLLM provides AI-generated recommendations based on the information provided.
              These recommendations are NOT a substitute for professional underwriting judgment. Always verify carrier
              requirements and consult with carrier representatives before submitting applications.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">8.2 Accuracy of Information</h3>
            <p className="mb-4 text-gray-700">
              While we strive to maintain accurate and up-to-date carrier information, we cannot guarantee the accuracy,
              completeness, or timeliness of all carrier underwriting guidelines. Carrier requirements may change without notice.
            </p>

            <h3 className="text-xl font-semibold text-gray-800 mb-2">8.3 Service Availability</h3>
            <p className="mb-4 text-gray-700">
              We aim for 99.9% uptime but do not guarantee uninterrupted access to the Service. We may perform maintenance
              or updates that temporarily affect availability.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">9. Limitation of Liability</h2>
            <p className="mb-4 text-gray-700">
              TO THE MAXIMUM EXTENT PERMITTED BY LAW, CARRIERLLM SHALL NOT BE LIABLE FOR ANY INDIRECT, INCIDENTAL,
              SPECIAL, CONSEQUENTIAL, OR PUNITIVE DAMAGES, INCLUDING BUT NOT LIMITED TO:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Loss of profits or revenue</li>
              <li>Loss of business opportunities</li>
              <li>Errors in carrier placement decisions</li>
              <li>Rejected insurance applications</li>
              <li>Data loss or corruption</li>
            </ul>
            <p className="mb-4 text-gray-700">
              Our total liability shall not exceed the amount paid by you for the Service in the 12 months preceding
              the claim.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">10. Indemnification</h2>
            <p className="mb-4 text-gray-700">
              You agree to indemnify and hold harmless CarrierLLM, its officers, directors, employees, and agents from
              any claims, damages, losses, or expenses (including legal fees) arising from:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Your use of the Service</li>
              <li>Your violation of these Terms</li>
              <li>Your violation of any third-party rights</li>
              <li>Any client claims related to insurance placement decisions</li>
            </ul>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">11. Termination</h2>
            <p className="mb-4 text-gray-700">
              We may terminate or suspend your account immediately, without prior notice or liability, for any reason,
              including:
            </p>
            <ul className="list-disc pl-6 mb-4 text-gray-700">
              <li>Breach of these Terms</li>
              <li>Non-payment of subscription fees</li>
              <li>Fraudulent or illegal activity</li>
              <li>At our sole discretion</li>
            </ul>
            <p className="mb-4 text-gray-700">
              Upon termination, your right to use the Service will cease immediately. You may delete your account at
              any time through your account settings.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">12. Modifications to Terms</h2>
            <p className="mb-4 text-gray-700">
              We reserve the right to modify these Terms at any time. We will notify you of any changes by posting the
              new Terms on this page and updating the "Effective Date." Your continued use of the Service after changes
              constitutes acceptance of the modified Terms.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">13. Governing Law</h2>
            <p className="mb-4 text-gray-700">
              These Terms shall be governed and construed in accordance with the laws of the United States and the
              State of Delaware, without regard to its conflict of law provisions. Any disputes shall be resolved
              through binding arbitration in accordance with the rules of the American Arbitration Association.
            </p>

            <h2 className="text-2xl font-semibold text-gray-900 mb-4 mt-8">14. Contact Information</h2>
            <p className="mb-4 text-gray-700">
              For questions about these Terms, please contact us at:
            </p>
            <ul className="list-none mb-4 text-gray-700">
              <li>Email: legal@carrierllm.com</li>
              <li>Phone: 1-800-CARRIER (1-800-227-7437)</li>
              <li>Address: CarrierLLM, Inc.</li>
              <li>123 Insurance Blvd, Suite 500</li>
              <li>Wilmington, DE 19801</li>
            </ul>

            <div className="mt-12 pt-8 border-t border-gray-200">
              <p className="text-sm text-gray-600 text-center">
                © 2025 CarrierLLM, Inc. All rights reserved.
              </p>
            </div>
          </div>
        </Card>
      </div>
    </div>
  );
};