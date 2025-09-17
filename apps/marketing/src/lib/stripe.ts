import { loadStripe } from '@stripe/stripe-js';

const stripePublishableKey = import.meta.env.VITE_STRIPE_PUBLISHABLE_KEY || 'pk_live_51S85Ug4wVNPeZ6jeGKzTqHZuNMBpXrISVe7xpLtzREpavRw6jGJFH27q7XtUqU5bCBEEj26xn5t9sFEFxnkyjv6L00mtAFiZfD';

export const stripe = loadStripe(stripePublishableKey);

export const PRICING_PLANS = {
  individual: {
    name: 'Individual',
    price: '$50',
    priceId: 'price_1QcLrK4wVNPeZ6jeaZXNwKXN', // Individual Plan - $50/mo, 1 seat
    seats: 1,
    features: [
      'Single agent license',
      'Up to 200 recommendations / mo',
      'Email support',
      'Basic analytics dashboard'
    ]
  },
  team: {
    name: 'Team',
    price: '$150',
    priceId: 'price_1QcLs14wVNPeZ6jeTxBGNy0v', // Team Plan - $150/mo, 5 seats
    seats: 5,
    features: [
      'Up to 5 agent seats',
      'Unlimited recommendations',
      'Shared analytics dashboard',
      'Priority support + onboarding',
      'Team collaboration tools'
    ]
  },
  enterprise: {
    name: 'Enterprise',
    price: 'Custom',
    priceId: 'enterprise', // Custom handling
    seats: -1, // Unlimited
    features: [
      'White-label UI',
      'SSO + CRM integrations',
      'Dedicated success manager',
      'Custom carrier integrations',
      'Advanced analytics & reporting'
    ]
  }
} as const;

export type PlanKey = keyof typeof PRICING_PLANS;

export const createCheckoutSession = async (
  priceId: string,
  successUrl: string,
  cancelUrl: string,
  userId?: string
) => {
  const apiUrl = import.meta.env.VITE_API_BASE_URL || 'https://carrierllm-worker.wandering-pine-b19a.workers.dev';

  const response = await fetch(`${apiUrl}/api/stripe/create-checkout-session`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      priceId,
      successUrl,
      cancelUrl,
      userId,
      metadata: {
        plan: Object.keys(PRICING_PLANS).find(key =>
          PRICING_PLANS[key as PlanKey].priceId === priceId
        )
      }
    }),
  });

  if (!response.ok) {
    throw new Error('Failed to create checkout session');
  }

  return response.json();
};