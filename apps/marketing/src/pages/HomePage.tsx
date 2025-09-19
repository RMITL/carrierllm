import React, { useEffect, useState } from 'react';
import { Button, Card } from '@carrierllm/ui';
import { ClerkPricingSection } from '../components/ClerkPricingSection';
import { SignIn, SignUp, useClerk, useUser } from '@clerk/clerk-react';
import ContactModal from '../components/ContactModal';

const features = [
  {
    title: 'AI-Powered Matching',
    description: 'Advanced algorithms analyze 50+ underwriting factors to identify optimal carriers with 95% accuracy.',
    icon: '🤖'
  },
  {
    title: 'Evidence-Based Citations',
    description: 'Every recommendation includes direct quotes from carrier guidelines with page references and effective dates.',
    icon: '📚'
  },
  {
    title: 'Real-Time Analytics',
    description: 'Track placement rates, carrier performance, and ROI with comprehensive dashboards updated in real-time.',
    icon: '📊'
  }
];

const stats = [
  { value: '95%', label: 'Accuracy Rate' },
  { value: '< 60s', label: 'Processing Time' },
  { value: '3.5x', label: 'Placement Improvement' },
  { value: '50+', label: 'Carriers Indexed' }
];

interface HomePageProps {
  scrollTo?: string;
}

const HomePage: React.FC<HomePageProps> = ({ scrollTo }) => {
  const { openSignIn, openSignUp } = useClerk();
  const { user } = useUser();
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [authMode, setAuthMode] = useState<'sign-in' | 'sign-up'>('sign-in');
  const [showContactModal, setShowContactModal] = useState(false);

  useEffect(() => {
    if (scrollTo) {
      const element = document.getElementById(scrollTo);
      if (element) {
        element.scrollIntoView({ behavior: 'smooth' });
      }
    }
  }, [scrollTo]);

  const handleSignIn = () => {
    if (user) {
      window.location.href = import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com';
    } else {
      setAuthMode('sign-in');
      setShowAuthModal(true);
    }
  };

  const handleGetStarted = () => {
    if (user) {
      window.location.href = import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com';
    } else {
      setAuthMode('sign-up');
      setShowAuthModal(true);
    }
  };

  return (
    <div className="bg-white text-[color:var(--color-gray-900)]">
      {/* Header */}
      <header className="border-b border-[color:var(--color-gray-100)] sticky top-0 bg-white/95 backdrop-blur z-40">
        <div className="mx-auto flex max-w-7xl items-center justify-between px-6 py-4">
          <div className="flex items-center gap-3">
            <img src="/images/logomark_primary_512.png" alt="CarrierLLM" className="h-8 w-8" />
            <span className="text-xl font-bold text-[color:var(--color-primary)]">CarrierLLM</span>
            <span className="hidden sm:inline-block px-2 py-0.5 text-xs bg-blue-100 text-blue-700 rounded-full">Beta</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
            <a href="#features" className="text-[color:var(--color-gray-600)] hover:text-[color:var(--color-gray-900)] transition">
              Features
            </a>
            <a href="#how-it-works" className="text-[color:var(--color-gray-600)] hover:text-[color:var(--color-gray-900)] transition">
              How It Works
            </a>
            <a href="#pricing" className="text-[color:var(--color-gray-600)] hover:text-[color:var(--color-gray-900)] transition">
              Individual Pricing
            </a>
            <a href="/organization-pricing" className="text-[color:var(--color-gray-600)] hover:text-[color:var(--color-gray-900)] transition">
              Organization Pricing
            </a>
          </nav>
          <div className="flex items-center gap-3">
            <Button variant="secondary" onClick={handleSignIn}>
              {user ? 'Dashboard' : 'Sign In'}
            </Button>
            <Button onClick={handleGetStarted} className="hidden sm:inline-flex">
              Get Started Free
            </Button>
          </div>
        </div>
      </header>

      <main>
        {/* Hero Section */}
        <section className="bg-gradient-to-br from-blue-50 via-white to-purple-50 overflow-hidden">
          <div className="mx-auto max-w-7xl px-6 py-20 lg:py-28">
            <div className="grid gap-12 lg:grid-cols-2 lg:gap-16 items-center">
              <div className="space-y-8">
                <div className="inline-flex items-center gap-2 px-3 py-1 bg-blue-100 text-blue-700 rounded-full text-sm font-medium">
                  <span>🚀</span>
                  <span>Trusted by 500+ insurance agents</span>
                </div>
                <h1 className="text-5xl lg:text-6xl font-bold text-[color:var(--color-gray-900)] leading-tight">
                  Find the perfect carrier match in{' '}
                  <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-purple-600">
                    seconds
                  </span>
                </h1>
                <p className="text-xl text-[color:var(--color-gray-600)] leading-relaxed">
                  CarrierLLM uses advanced AI to analyze client profiles against comprehensive underwriting guidelines,
                  delivering evidence-based carrier recommendations with source citations.
                </p>
                <div className="flex flex-wrap gap-4">
                  <Button size="lg" onClick={handleGetStarted}>
                    Start Free Trial →
                  </Button>
                  <Button size="lg" variant="secondary" onClick={() => setShowContactModal(true)}>
                    Watch Demo
                  </Button>
                </div>
                <div className="flex items-center gap-6 pt-4">
                  <div className="flex -space-x-2">
                    {[1,2,3,4,5].map(i => (
                      <div key={i} className="w-10 h-10 rounded-full bg-gradient-to-br from-blue-400 to-purple-400 border-2 border-white" />
                    ))}
                  </div>
                  <div>
                    <div className="flex items-center gap-1">
                      {[1,2,3,4,5].map(i => (
                        <span key={i} className="text-yellow-500">★</span>
                      ))}
                    </div>
                    <p className="text-sm text-gray-600">4.9/5 from 200+ reviews</p>
                  </div>
                </div>
              </div>
              <div className="relative">
                <div className="absolute -inset-4 bg-gradient-to-r from-blue-500/20 to-purple-500/20 blur-3xl" />
                <Card className="relative p-8 shadow-2xl border-gray-200">
                  <h3 className="text-lg font-semibold mb-6">Live Demo Results</h3>
                  <div className="space-y-4">
                    <div className="flex items-center justify-between p-3 bg-green-50 rounded-lg">
                      <span className="font-medium">F&G Life</span>
                      <span className="text-green-600 font-bold">95% Match</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-blue-50 rounded-lg">
                      <span className="font-medium">Protective</span>
                      <span className="text-blue-600 font-bold">88% Match</span>
                    </div>
                    <div className="flex items-center justify-between p-3 bg-yellow-50 rounded-lg">
                      <span className="font-medium">Mutual of Omaha</span>
                      <span className="text-yellow-600 font-bold">82% Match</span>
                    </div>
                  </div>
                  <div className="mt-6 pt-6 border-t">
                    <div className="flex items-center justify-between text-sm">
                      <span className="text-gray-600">Processing time</span>
                      <span className="font-semibold text-green-600">0.8 seconds</span>
                    </div>
                    <div className="flex items-center justify-between text-sm mt-2">
                      <span className="text-gray-600">Citations found</span>
                      <span className="font-semibold">12 sources</span>
                    </div>
                  </div>
                </Card>
              </div>
            </div>
          </div>
        </section>

        {/* Stats Section */}
        <section className="border-y border-gray-100 bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-16">
            <div className="grid grid-cols-2 gap-8 md:grid-cols-4">
              {stats.map((stat) => (
                <div key={stat.label} className="text-center">
                  <div className="text-3xl md:text-4xl font-bold text-blue-600">{stat.value}</div>
                  <div className="mt-2 text-sm text-gray-600">{stat.label}</div>
                </div>
              ))}
            </div>
          </div>
        </section>

        {/* Features Section */}
        <section id="features" className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Powerful features for modern agencies</h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Everything you need to streamline carrier placement and improve client outcomes
            </p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} className="text-center p-8">
                <div className="text-4xl mb-4">{feature.icon}</div>
                <h3 className="text-xl font-semibold mb-3">{feature.title}</h3>
                <p className="text-gray-600">{feature.description}</p>
              </Card>
            ))}
          </div>
        </section>

        {/* How It Works */}
        <section id="how-it-works" className="bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">How CarrierLLM Works</h2>
              <p className="text-xl text-gray-600">Three simple steps to better placements</p>
            </div>
            <div className="grid gap-8 md:grid-cols-3">
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  1
                </div>
                <h3 className="text-xl font-semibold mb-3">Submit Client Profile</h3>
                <p className="text-gray-600">
                  Enter basic underwriting information through our streamlined 8-question intake form
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  2
                </div>
                <h3 className="text-xl font-semibold mb-3">AI Analysis</h3>
                <p className="text-gray-600">
                  Our AI evaluates 50+ carriers against current underwriting guidelines in real-time
                </p>
              </div>
              <div className="text-center">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 text-blue-600 rounded-full flex items-center justify-center text-2xl font-bold">
                  3
                </div>
                <h3 className="text-xl font-semibold mb-3">Get Recommendations</h3>
                <p className="text-gray-600">
                  Receive ranked carrier matches with confidence scores and source citations
                </p>
              </div>
            </div>
          </div>
        </section>

        {/* Pricing Section */}
        <ClerkPricingSection />

        {/* Compliance Section */}
        <section id="compliance" className="bg-gray-50">
          <div className="mx-auto max-w-7xl px-6 py-20">
            <div className="text-center mb-12">
              <h2 className="text-4xl font-bold mb-4">Built for compliance & security</h2>
              <p className="text-xl text-gray-600 max-w-3xl mx-auto">
                Enterprise-grade security and compliance features to protect your data
              </p>
            </div>
            <div className="grid gap-8 md:grid-cols-2 lg:grid-cols-4">
              <Card className="p-6">
                <div className="text-3xl mb-4">🔒</div>
                <h3 className="font-semibold mb-2">HIPAA Compliant</h3>
                <p className="text-sm text-gray-600">
                  Full HIPAA compliance with BAAs available for enterprise clients
                </p>
              </Card>
              <Card className="p-6">
                <div className="text-3xl mb-4">🛡️</div>
                <h3 className="font-semibold mb-2">SOC 2 Type II</h3>
                <p className="text-sm text-gray-600">
                  Annual audits ensure data security and availability standards
                </p>
              </Card>
              <Card className="p-6">
                <div className="text-3xl mb-4">🔐</div>
                <h3 className="font-semibold mb-2">End-to-End Encryption</h3>
                <p className="text-sm text-gray-600">
                  AES-256 encryption at rest and TLS 1.3 in transit
                </p>
              </Card>
              <Card className="p-6">
                <div className="text-3xl mb-4">📝</div>
                <h3 className="font-semibold mb-2">Audit Trail</h3>
                <p className="text-sm text-gray-600">
                  Complete audit logging for compliance and review
                </p>
              </Card>
            </div>
          </div>
        </section>

        {/* Testimonials */}
        <section className="mx-auto max-w-7xl px-6 py-20">
          <div className="text-center mb-12">
            <h2 className="text-4xl font-bold mb-4">Loved by insurance professionals</h2>
            <p className="text-xl text-gray-600">See what our users are saying</p>
          </div>
          <div className="grid gap-8 md:grid-cols-3">
            <Card className="p-6">
              <div className="flex mb-4">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "CarrierLLM has transformed how we place clients. What used to take hours now takes minutes,
                and the citation feature gives us confidence in every recommendation."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-blue-400 to-purple-400 rounded-full" />
                <div>
                  <div className="font-semibold">Sarah Johnson</div>
                  <div className="text-sm text-gray-600">Senior Agent, Liberty Insurance</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex mb-4">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "The accuracy is incredible. We've seen our placement rate increase by 40% since implementing
                CarrierLLM. It's like having an expert underwriter available 24/7."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-green-400 to-blue-400 rounded-full" />
                <div>
                  <div className="font-semibold">Michael Chen</div>
                  <div className="text-sm text-gray-600">Agency Owner, Premier Partners</div>
                </div>
              </div>
            </Card>
            <Card className="p-6">
              <div className="flex mb-4">
                {[1,2,3,4,5].map(i => (
                  <span key={i} className="text-yellow-500">★</span>
                ))}
              </div>
              <p className="text-gray-700 mb-4">
                "The ROI was immediate. We're processing 3x more applications with the same team,
                and our clients love the faster turnaround times."
              </p>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-gradient-to-br from-purple-400 to-pink-400 rounded-full" />
                <div>
                  <div className="font-semibold">Emily Rodriguez</div>
                  <div className="text-sm text-gray-600">VP Sales, National Insurance Group</div>
                </div>
              </div>
            </Card>
          </div>
        </section>

        {/* CTA Section */}
        <section className="bg-gradient-to-br from-blue-600 to-purple-600 text-white">
          <div className="mx-auto max-w-4xl px-6 py-20 text-center">
            <h2 className="text-4xl font-bold mb-6">
              Ready to revolutionize your carrier placement?
            </h2>
            <p className="text-xl mb-8 text-blue-100">
              Join 500+ agencies using CarrierLLM to improve placements and grow revenue
            </p>
            <div className="flex flex-wrap gap-4 justify-center">
              <Button size="lg" variant="secondary" onClick={handleGetStarted}>
                Start Free Trial
              </Button>
              <Button
                size="lg"
                variant="secondary"
                className="bg-white/20 text-white border-white hover:bg-white/30"
                onClick={() => setShowContactModal(true)}
              >
                Schedule Demo
              </Button>
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
              <div className="flex items-center gap-2 mb-4">
                <img src="/images/logomark_primary_512.png" alt="CarrierLLM" className="h-6 w-6" />
                <span className="text-lg font-bold text-blue-600">CarrierLLM</span>
              </div>
              <p className="text-sm text-gray-600">
                AI-powered carrier placement for modern insurance agencies.
              </p>
              <div className="flex gap-4 mt-4">
                <a href="https://twitter.com/carrierllm" className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">Twitter</span>
                  𝕏
                </a>
                <a href="https://linkedin.com/company/carrierllm" className="text-gray-400 hover:text-gray-600">
                  <span className="sr-only">LinkedIn</span>
                  in
                </a>
              </div>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Product</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="#features" className="hover:text-gray-900">Features</a></li>
                <li><a href="#pricing" className="hover:text-gray-900">Individual Pricing</a></li>
                <li><a href="/organization-pricing" className="hover:text-gray-900">Organization Pricing</a></li>
                <li><a href="#how-it-works" className="hover:text-gray-900">How it Works</a></li>
                <li><a href="https://app.carrierllm.com" className="hover:text-gray-900">Sign In</a></li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-sm text-gray-600">
                <li><a href="/about" className="hover:text-gray-900">About</a></li>
                <li><button onClick={() => setShowContactModal(true)} className="hover:text-gray-900 text-left">Contact</button></li>
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

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50 p-4" onClick={() => setShowAuthModal(false)}>
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-12 right-0 text-white hover:text-gray-300 text-xl font-bold"
            >
              ✕
            </button>
            {authMode === 'sign-in' ? (
              <SignIn
                afterSignInUrl={import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com'}
                appearance={{
                  elements: {
                    rootBox: 'mx-auto',
                    card: 'shadow-2xl',
                  }
                }}
              />
            ) : (
              <SignUp
                afterSignUpUrl="/success"
                appearance={{
                  elements: {
                    rootBox: 'mx-auto',
                    card: 'shadow-2xl',
                  }
                }}
              />
            )}
            <div className="mt-4 text-center text-white">
              {authMode === 'sign-in' ? (
                <p>
                  Don't have an account?{' '}
                  <button
                    onClick={() => setAuthMode('sign-up')}
                    className="underline hover:text-gray-300"
                  >
                    Sign up for free
                  </button>
                </p>
              ) : (
                <p>
                  Already have an account?{' '}
                  <button
                    onClick={() => setAuthMode('sign-in')}
                    className="underline hover:text-gray-300"
                  >
                    Sign in
                  </button>
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Contact Modal */}
      {showContactModal && (
        <ContactModal onClose={() => setShowContactModal(false)} />
      )}
    </div>
  );
};

export default HomePage;