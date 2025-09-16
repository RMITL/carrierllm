# UI Library Scaffold (@carrierllm/ui)
Structure:

/packages/ui
 src/primitives/Button.tsx
 src/primitives/Badge.tsx
 src/primitives/Banner.tsx
 src/primitives/Card.tsx
 src/blocks/UsageMeter.tsx
 src/blocks/CarrierCard.tsx
Exports: Button, Badge, Banner, Card, UsageMeter, CarrierCard.

Design decisions:

Accessible props (role, aria-live, progressbar)

Contrast-safe text (black on green/amber)

ForwardRef for buttons (focus handling)

Usage example:

<CarrierCard
 carrierName="Acme Life"
 program="Accelerated UW"
 fitPct={87}
 reasons={["Stable 12mo", "BMI <= 33"]}
 onViewSource={() => {}}
 onApply={() => {}}
/>
