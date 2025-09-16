import { Button, Card } from '@carrierllm/ui';

const features = [
  {
    title: 'Carrier fit scoring',
    description: 'Run the 8 knockout questions to generate a ranked list of carriers with citations in seconds.'
  },
  {
    title: 'Underwriting sources',
    description: 'Curated, versioned carrier docs accessible inside the workflow with transparent sourcing.'
  },
  {
    title: 'Placement analytics',
    description: 'Track approvals vs. submissions to continually improve intake prompts and RAG retrieval.'
  }
];

const pricingTiers = [
  {
    name: 'Individual',
    price: '$50/mo',
    bullets: ['Single agent license', 'Up to 200 recommendations / mo', 'Email support']
  },
  {
    name: 'Team',
    price: '$150/mo',
    bullets: ['Up to 5 seats', 'Shared analytics dashboard', 'Priority support + onboarding']
  },
  {
    name: 'Enterprise',
    price: 'Talk to us',
    bullets: ['White-label UI', 'SSO + CRM integrations', 'Dedicated success manager']
  }
];

const openLink = (url: string) => () => {
  window.open(url, '_blank', 'noopener');
};

const App = () => (
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
        <Button onClick={openLink('https://app.carrierllm.com')}>Start free trial</Button>
      </div>
    </header>

    <main>
      <section className="bg-[color:var(--color-gray-100)]">
        <div className="mx-auto grid max-w-6xl gap-10 px-6 py-20 md:grid-cols-2">
          <div className="space-y-6">
            <h1 className="text-4xl font-bold text-[color:var(--color-gray-900)]">
              Match new insurance applications to the right carriers instantly.
            </h1>
            <p className="text-lg text-[color:var(--color-gray-500)]">
              CarrierLLM pairs a fine-tuned local LLM with your underwriting library to deliver transparent fit scores, citations, and placement workflows in seconds.
            </p>
            <div className="flex flex-wrap gap-3">
              <Button onClick={openLink('https://app.carrierllm.com/onboarding')}>Start free trial</Button>
              <Button variant="secondary" onClick={openLink('https://cal.com/carrierllm/demo')}>
                Request demo
              </Button>
            </div>
          </div>
          <div className="rounded-base border border-[color:var(--color-gray-100)] bg-white p-6 shadow-card">
            <h2 className="text-xl font-semibold">Key outcomes</h2>
            <ul className="mt-4 space-y-3 text-sm text-[color:var(--color-gray-500)]">
              <li>✓ Intake to carrier recommendations in under 60 seconds.</li>
              <li>✓ 1-click access to source underwriting guidelines.</li>
              <li>✓ Track approval and placement analytics across teams.</li>
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
            {pricingTiers.map((tier) => (
              <Card
                key={tier.name}
                title={tier.name}
                description={tier.price}
                footer={
                  <Button variant="secondary" className="w-full" onClick={openLink('mailto:sales@carrierllm.com')}>
                    Contact sales
                  </Button>
                }
              >
                <ul className="mt-2 space-y-2 text-sm text-[color:var(--color-gray-500)]">
                  {tier.bullets.map((bullet) => (
                    <li key={bullet}>• {bullet}</li>
                  ))}
                </ul>
              </Card>
            ))}
          </div>
        </div>
      </section>

      <section id="compliance" className="mx-auto max-w-6xl px-6 py-20">
        <h2 className="text-3xl font-semibold">Compliance-first architecture</h2>
        <div className="mt-8 grid gap-6 md:grid-cols-2">
          <Card
            title="Data minimization"
            description="Collect only the underwriting essentials. Sensitive health or financial data stays out of the AI loop."
          />
          <Card
            title="Transparent citations"
            description="Every recommendation includes the excerpt and doc reference so agents can validate reasoning."
          />
          <Card
            title="Role-based controls"
            description="SSO and role-based permissions keep carrier content and client data limited to authorized users."
          />
          <Card
            title="Audit-ready logs"
            description="Track intake inputs, AI outputs, and placement outcomes for regulator or carrier reviews."
          />
        </div>
      </section>

      <section className="bg-[color:var(--color-primary)] text-white">
        <div className="mx-auto flex max-w-6xl flex-col items-start gap-6 px-6 py-16 md:flex-row md:items-center md:justify-between">
          <div>
            <h2 className="text-3xl font-semibold">Ready to accelerate carrier placements?</h2>
            <p className="mt-2 text-sm text-white/80">
              Book a demo to see the full RAG pipeline, analytics, and enterprise integrations in action.
            </p>
          </div>
          <div className="flex flex-wrap gap-3">
            <Button variant="secondary" onClick={openLink('mailto:hello@carrierllm.com')}>
              Talk to sales
            </Button>
            <Button onClick={openLink('https://app.carrierllm.com/onboarding')}>Start now</Button>
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
          <a href="mailto:support@carrierllm.com">Support</a>
        </div>
      </div>
    </footer>
  </div>
);

export default App;
