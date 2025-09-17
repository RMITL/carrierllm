import React, { useEffect, useState } from 'react';
import { Button, Card } from '@carrierllm/ui';
import { PricingCard } from '../components/PricingCard';
import { SignIn, SignUp, useClerk, useUser } from '@clerk/clerk-react';
import ContactModal from '../components/ContactModal';

const features = [
  {
    title: 'Smart carrier matching',
    description: 'AI-powered analysis of client profiles to identify optimal carrier placement opportunities with evidence-based scoring.'
  },
  {
    title: 'Comprehensive knowledge base',
    description: 'Access to curated underwriting guidelines with version control and transparent citation sourcing.'
  },
  {
    title: 'Performance tracking',
    description: 'Monitor placement success rates and optimize your workflow with detailed analytics and insights.'
  }
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
      // Already signed in, go to app
      window.location.href = import.meta.env.VITE_APP_URL || 'https://app.carrierllm.com';
    } else {
      setAuthMode('sign-in');
      setShowAuthModal(true);
    }
  };

  const handleRequestDemo = () => {
    setShowContactModal(true);
  };

  const openLink = (url: string) => () => {
    if (url.includes('cal.com')) {
      // Open Calendly/Cal.com in modal or new tab
      window.open(url, '_blank', 'noopener,width=800,height=600');
    } else {
      window.open(url, '_blank', 'noopener');
    }
  };

  return (
    <div className="bg-white text-[color:var(--color-gray-900)]">
      <header className="border-b border-[color:var(--color-gray-100)]">
        <div className="mx-auto flex max-w-6xl items-center justify-between px-6 py-5">
          <span className="text-lg font-semibold text-[color:var(--color-primary)]">CarrierLLM</span>
          <nav className="flex items-center gap-4 text-sm">
            <a href="#features" className="text-[color:var(--color-gray-500)] hover:text-[color:var(--color-gray-900)]">
              Features
            </a>
            <a href="#pricing" className="text-[color:var(--color-gray-500)] hover:text-[color:var(--color-gray-900)]">
              Pricing
            </a>
            <a href="#compliance" className="text-[color:var(--color-gray-500)] hover:text-[color:var(--color-gray-900)]">
              Compliance
            </a>
          </nav>
          <Button onClick={handleSignIn}>
            {user ? 'Go to Dashboard' : 'Sign In'}
          </Button>
        </div>
      </header>

      <main>
        <section className="bg-[color:var(--color-gray-100)]">
          <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
            <div className="space-y-6">
              <h1 className="text-4xl font-bold text-[color:var(--color-gray-900)]">
                AI-powered carrier placement for insurance professionals.
              </h1>
              <p className="text-lg text-[color:var(--color-gray-500)]">
                CarrierLLM analyzes client profiles and matches them with optimal carriers using advanced AI and comprehensive underwriting knowledge, delivering transparent recommendations in seconds.
              </p>
              <div className="flex flex-wrap gap-3">
                <Button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>View Pricing</Button>
                <Button variant="secondary" onClick={handleRequestDemo}>
                  Request demo
                </Button>
              </div>
            </div>
            <div className="rounded-base border border-[color:var(--color-gray-100)] bg-white p-6 shadow-card">
              <h2 className="text-xl font-semibold">Key outcomes</h2>
              <ul className="mt-4 space-y-3 text-sm text-[color:var(--color-gray-500)]">
                <li>✓ Client intake to carrier recommendations in under 60 seconds</li>
                <li>✓ Evidence-based recommendations with source citations</li>
                <li>✓ Comprehensive placement analytics and performance tracking</li>
              </ul>
            </div>
          </div>
        </section>

        <section id="features" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold">Built for insurance agents and distribution teams</h2>
          <div className="mt-10 grid gap-6 md:grid-cols-3">
            {features.map((feature) => (
              <Card key={feature.title} title={feature.title} description={feature.description} />
            ))}
          </div>
        </section>

        <section id="pricing" className="bg-[color:var(--color-gray-100)]">
          <div className="mx-auto max-w-6xl px-6 py-20">
            <h2 className="text-3xl font-semibold">Simple pricing that scales</h2>
            <div className="mt-10 grid gap-6 md:grid-cols-3">
              <PricingCard planKey="individual" />
              <PricingCard planKey="team" isPopular={true} />
              <PricingCard planKey="enterprise" />
            </div>
            <div className="mt-8 text-center text-sm text-[color:var(--color-gray-500)]">
              All plans include a 3-day free trial. No credit card required to start.
            </div>
          </div>
        </section>

        <section id="compliance" className="mx-auto max-w-6xl px-6 py-20">
          <h2 className="text-3xl font-semibold">Compliance-first architecture</h2>
          <div className="mt-8 grid gap-6 md:grid-cols-2">
            <Card
              title="Privacy by design"
              description="Collect only essential underwriting data with strict data minimization and privacy protection protocols."
            />
            <Card
              title="Transparent methodology"
              description="Every recommendation includes detailed citations and source references for complete transparency and validation."
            />
            <Card
              title="Access controls"
              description="Enterprise-grade authentication and role-based permissions ensure data security and compliance."
            />
            <Card
              title="Comprehensive audit trail"
              description="Complete logging of all inputs, recommendations, and outcomes for regulatory compliance and review."
            />
          </div>
        </section>

        <section className="bg-[color:var(--color-primary)] text-white">
          <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
            <div>
              <h2 className="text-3xl font-semibold">Ready to transform your placement process?</h2>
              <p className="mt-2 text-sm text-white/80">
                Book a demo to see our AI-powered carrier matching, analytics dashboard, and enterprise integrations in action.
              </p>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button variant="secondary" onClick={() => setShowContactModal(true)}>
                Talk to sales
              </Button>
              <Button onClick={() => document.getElementById('pricing')?.scrollIntoView({ behavior: 'smooth' })}>Get Started</Button>
            </div>
          </div>
        </section>
      </main>

      <footer className="border-t border-[color:var(--color-gray-100)] bg-white">
        <div className="mx-auto flex max-w-6xl flex-col gap-4 px-6 py-10 text-sm text-[color:var(--color-gray-500)] md:flex-row md:items-center md:justify-between">
          <span>&copy; {new Date().getFullYear()} CarrierLLM. All rights reserved.</span>
          <div className="flex gap-4">
            <a href="#">Privacy</a>
            <a href="#">Terms</a>
            <a href="mailto:info@carrierllm.com">Support</a>
          </div>
        </div>
      </footer>

      {/* Auth Modal */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/50" onClick={() => setShowAuthModal(false)}>
          <div className="relative w-full max-w-md" onClick={(e) => e.stopPropagation()}>
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute -top-10 right-0 text-white hover:text-gray-300"
            >
              ✕ Close
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
                    Sign up
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