import React from 'react';
import { OrganizationPricingSection } from '../components/OrganizationPricingSection';

const OrganizationPricingPage: React.FC = () => {
  return (
    <div className="bg-white text-[color:var(--color-gray-900)]">
      {/* Header */}
      <header className="border-b border-[color:var(--color-gray-100)] sticky top-0 bg-white/95 backdrop-blur z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-2">
            <span className="text-xl font-bold text-[color:var(--color-primary)]">CarrierLLM</span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Beta</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="/#features" className="text-[color:var(--color-gray-600)] hover:text-[color:var(--color-gray-900)] transition">
              Features
            </a>
            <a href="/#how-it-works" className="text-[color:var(--color-gray-600)] hover:text-[color:var(--color-gray-900)] transition">
              How It Works
            </a>
            <a href="/#pricing" className="text-[color:var(--color-gray-600)] hover:text-[color:var(--color-gray-900)] transition">
              Individual Pricing
            </a>
            <a href="/organization-pricing" className="text-[color:var(--color-primary)] font-semibold">
              Organization Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <a href="/" className="text-[color:var(--color-gray-600)] hover:text-[color:var(--color-gray-900)]">
              ← Back to Home
            </a>
          </div>
        </div>
      </header>

      <main>
        {/* Organization Pricing Section */}
        <OrganizationPricingSection />

        {/* Additional Information Section */}
        <section className="py-16 bg-white">
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
            <div className="text-center mb-12">
              <h2 className="text-3xl font-bold text-gray-900 mb-4">
                Why Choose Organization Plans?
              </h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Built for teams that need to scale their carrier placement operations
              </p>
            </div>
            
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl">
                  👥
                </div>
                <h3 className="text-xl font-semibold mb-3">Team Collaboration</h3>
                <p className="text-gray-600">
                  Share recommendations, collaborate on cases, and manage team workflows efficiently
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-green-100 text-green-600 rounded-full flex items-center justify-center text-2xl">
                  📊
                </div>
                <h3 className="text-xl font-semibold mb-3">Advanced Analytics</h3>
                <p className="text-gray-600">
                  Get detailed insights into team performance, placement rates, and ROI metrics
                </p>
              </div>
              
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-purple-100 text-purple-600 rounded-full flex items-center justify-center text-2xl">
                  🔧
                </div>
                <h3 className="text-xl font-semibold mb-3">Admin Controls</h3>
                <p className="text-gray-600">
                  Manage team members, set permissions, and control access to sensitive data
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to scale your team's carrier placement?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join organizations using CarrierLLM to improve team efficiency and grow revenue
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <a 
                href="#organization-pricing" 
                className="inline-flex items-center px-6 py-3 border border-transparent text-base font-medium rounded-md text-blue-600 bg-white hover:bg-gray-50 transition-colors"
              >
                View Organization Plans
              </a>
              <a 
                href="mailto:info@carrierllm.com" 
                className="inline-flex items-center px-6 py-3 border border-white text-base font-medium rounded-md text-white hover:bg-white/20 transition-colors"
              >
                Contact Sales
              </a>
            </div>
            <p className="mt-6 text-sm text-blue-200">
              No credit card required • 3-day free trial • Cancel anytime
            </p>
          </div>
        </section>
      </main>

      {/* Footer */}
      <footer className="border-t border-gray-200 bg-white">
        <div className="mx-auto max-w-7xl px-6 py-12">
          <div className="grid gap-8 md:grid-cols-4">
            <div>
              <div className="text-lg font-bold text-blue-600 mb-4">CarrierLLM</div>
              <p className="text-sm text-gray-600">
                AI-powered carrier placement for modern insurance agencies.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/#features" className="hover:text-gray-900">Features</a></li>
                <li><a href="/#pricing" className="hover:text-gray-900">Individual Pricing</a></li>
                <li><a href="/organization-pricing" className="hover:text-gray-900">Organization Pricing</a></li>
                <li><a href="/#how-it-works" className="hover:text-gray-900">How it Works</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/about" className="hover:text-gray-900">About</a></li>
                <li><a href="mailto:info@carrierllm.com" className="hover:text-gray-900">Contact</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Legal</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/privacy" className="hover:text-gray-900">Privacy Policy</a></li>
                <li><a href="/terms" className="hover:text-gray-900">Terms of Service</a></li>
              </ul>
            </div>
          </div>
          <div className="border-t border-gray-200 mt-8 pt-8 flex flex-col md:flex-row justify-between items-center">
            <p className="text-sm text-gray-600">
              © {new Date().getFullYear()} CarrierLLM, Inc. All rights reserved.
            </p>
            <div className="flex gap-6 mt-4 md:mt-0 text-sm text-gray-600">
              <a href="/privacy" className="hover:text-gray-900">Privacy</a>
              <a href="/terms" className="hover:text-gray-900">Terms</a>
              <a href="mailto:info@carrierllm.com" className="hover:text-gray-900">Support</a>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
};

export default OrganizationPricingPage;
