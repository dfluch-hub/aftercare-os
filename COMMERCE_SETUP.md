# AFTERCARE OS — COMMERCE SETUP

## Recommended provider
Lemon Squeezy.

Why:
- no monthly ecommerce fee
- one-time payments
- Merchant of Record
- automatic license keys
- license activation / validation API
- checkout links work from any website

## Product setup
Create one product:

**AfterCare OS Complete**
- pricing: one-time
- regular launch target: $19.90
- enable license keys
- recommended activation limit for initial launch: 3 devices
- no expiry for a one-time lifetime license unless the offer says otherwise

After the product exists, add these values to `js/config.js`:
- `checkoutUrl`
- `expectedStoreId`
- `expectedProductId`
- `expectedVariantId`

The app then verifies that an entered license:
1. activates successfully
2. belongs to the correct AfterCare store/product/variant
3. matches the purchaser email
4. can later be revalidated on-device

## Important security note
This is a static PWA. Client-side licensing is a practical first-launch deterrent, not military-grade DRM.
A determined technical user can modify client code.

If sales justify stronger protection later:
- move premium services behind an API
- use account-based entitlements
- issue signed short-lived entitlement tokens
- keep the local-first app shell

Do not add backend complexity before demand is proven.

## Etsy strategy
Do not make Etsy the technical licensing backbone.

Use:
- Direct checkout / licensing through Lemon Squeezy as the clean software channel.
- Etsy for a compatible digital companion offer only if the listing/delivery flow complies with Etsy's current marketplace rules.

If selling the full app directly on Etsy later, build an Etsy-specific fulfillment path rather than sharing one universal Complete code.
