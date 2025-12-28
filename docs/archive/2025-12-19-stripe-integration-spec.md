# Stripe Integration Specification

**Last Modified**: 2025-12-28 13:48 EST
**Status**: Research Complete - Implementation Pending

## Overview

This document outlines the Stripe integration approach for MetaDJ Nexus, enabling subscription-based premium features and one-time purchases.

## Replit + Stripe Integration

### Platform Support

Replit has direct integration support for Stripe, allowing:
- Secure payment processing
- Subscription management
- Invoicing and complex billing scenarios
- Comprehensive transaction reporting

### Key 2025 Developments

- Stripe announced embedded sandboxes for platforms like Replit and Vercel
- Stripe is working with Replit, Vercel, Anthropic, and others on agentic commerce solutions
- AI-assisted setup through Replit Agent for streamlined implementation

## Technical Implementation

### Environment Variables Required

```env
STRIPE_PUBLISHABLE_KEY=pk_live_xxx
STRIPE_SECRET_KEY=sk_live_xxx
STRIPE_WEBHOOK_SECRET=whsec_xxx
```

### Checkout Flow (Next.js)

1. **Create Checkout Session** (`/api/checkout/session`)
   ```typescript
   const session = await stripe.checkout.sessions.create({
     payment_method_types: ['card'],
     line_items: [{ price: priceId, quantity: 1 }],
     mode: 'subscription', // or 'payment' for one-time
     success_url: `${origin}/success?session_id={CHECKOUT_SESSION_ID}`,
     cancel_url: `${origin}/pricing`,
   });
   ```

2. **Handle Webhooks** (`/api/webhooks/stripe`)
   - `checkout.session.completed` - Activate subscription
   - `customer.subscription.updated` - Handle plan changes
   - `customer.subscription.deleted` - Handle cancellation
   - `invoice.payment_failed` - Handle payment failures

### Subscription Tiers (Proposed)

| Tier | Price | Features |
|------|-------|----------|
| General Admission (Free) | $0 | Core platform access: music, Cinema, Wisdom, playlists, basic MetaDJai |
| VIP | TBD | Everything in Free + expanded MetaDJai + monthly track downloads with content‑creation rights + 10% marketplace discount |
| DJ / Digital Jockey | TBD | Everything in VIP + higher download limits + performance/remix rights + 20% marketplace discount + future DJ/creator tools |

## Integration Points in MetaDJ Nexus

### Protected Features (Premium)
- Expanded MetaDJai capabilities (longer sessions, advanced tools)
- MetaDJai image generation (future)
- Muse Board ideation space (future)
- AI DJ Mode / Radio curation tools (future)
- Monthly music downloads with tiered rights (VIP+)
- Marketplace discounts (VIP 10%, DJ 20%)

### User Flow
1. User clicks "Upgrade" in-app
2. Redirect to Stripe Checkout
3. Success callback updates user subscription status
4. Premium features unlock immediately

## Webhook Security

```typescript
// Verify webhook signature
const event = stripe.webhooks.constructEvent(
  body,
  signature,
  process.env.STRIPE_WEBHOOK_SECRET
);
```

## Database Schema Additions

```typescript
interface UserSubscription {
  userId: string;
  stripeCustomerId: string;
  stripeSubscriptionId: string;
  status: 'active' | 'cancelled' | 'past_due' | 'trialing';
  tier: 'general_admission' | 'vip' | 'dj';
  currentPeriodEnd: Date;
  cancelAtPeriodEnd: boolean;
}
```

## Known Considerations

### Replit-Specific Issues
- POST requests may become unreachable in production (monitor deployment)
- Webhook URLs must be publicly accessible
- Test mode vs. production mode switching

### Best Practices
- Always verify webhook signatures
- Use idempotency keys for payment operations
- Handle race conditions in subscription updates
- Implement graceful degradation for payment failures

## Implementation Phases

### Phase 1: Foundation
- [ ] Set up Stripe account and API keys
- [ ] Create checkout session API route
- [ ] Implement webhook handler
- [ ] Add basic subscription status tracking

### Phase 2: Integration
- [ ] Connect subscription status to feature flags
- [ ] Add upgrade prompts in UI
- [ ] Implement subscription management page
- [ ] Add billing history view

### Phase 3: Enhancement
- [ ] Add multiple payment methods
- [ ] Implement usage-based billing (if needed)
- [ ] Add promotional codes/discounts
- [ ] Implement free trial flow

## Resources

- [Stripe Billing Quickstart](https://stripe.com/docs/billing/quickstart)
- [Replit Checkout Tutorial](https://docs.replit.com/tutorials/nodejs/online-store-checkout-process)
- [Stripe Next.js Guide](https://makerkit.dev/blog/tutorials/guide-nextjs-stripe)
- [Stripe Checkout Sessions API](https://stripe.com/docs/api/checkout/sessions)
