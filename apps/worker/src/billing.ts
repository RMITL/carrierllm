// DEPRECATED: This file is no longer used - Clerk Billing handles all subscription management
//
// Clerk Billing provides:
// - Automatic Stripe integration
// - Subscription management through Clerk Dashboard
// - Built-in checkout and billing portal UI components
// - Automatic sync of subscription status to user/org publicMetadata
//
// To configure:
// 1. Go to Clerk Dashboard > Configure > Subscription Plans
// 2. Add your plans with features
// 3. Enable billing
// 4. Use <PricingTable /> component in your React app
//
// The subscription data is automatically available in:
// - user.publicMetadata.plan_name
// - user.publicMetadata.plan_slug
// - user.publicMetadata.stripe_subscription_status
// - organization.publicMetadata (for org plans)

export {};