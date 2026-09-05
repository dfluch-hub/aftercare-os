# AfterCare OS V6 — GitHub Launch Ready

This is the first version intentionally restructured as a maintainable product foundation rather than a single-file prototype.

## What changed
- modern 4-part information architecture: Today / Plan / Check-in / More
- responsive desktop sidebar + mobile bottom navigation
- one global Quick Add action
- guided “next step” engine remains the core product behavior
- much less menu clutter
- reusable design tokens and component styles
- modular JavaScript
- storage adapter instead of direct localStorage coupling
- schema versioning and migration support from earlier versions
- entitlement abstraction for future checkout/licensing
- cloud/account/payment feature flags
- premium sheets and gates
- print report
- caregiver handoff
- 30-day organizational journey
- local-first architecture
- offline PWA service worker

## Run locally
From this folder:
`python3 -m http.server 8000`

Open:
`http://localhost:8000`

## Deploy
Suitable for:
- Netlify
- GitHub Pages
- Cloudflare Pages
- any static host

## Before selling
Still required before a real paid launch:
- connect a real payment / entitlement provider
- deploy to production domain
- add formal privacy/terms pages
- perform target-market legal / medical-device positioning review
- test on Safari iOS, Chrome Android, desktop Chrome/Safari/Edge
- test data migration with real v3 data
- add lightweight error logging before scale

## Product positioning
AfterCare OS is an **organizational tool**. It must not drift into diagnosis, treatment, urgency determination, prescribing, or automated clinical recommendations.


## V5 commerce layer
- Lemon Squeezy license provider abstraction
- purchaser email + license key activation flow
- product/store/variant validation hooks
- revalidation flow
- separate sales landing page
- commerce setup guide
- Etsy listing draft
- launch checklist

The provider is intentionally not hard-coded to a live product until the real checkout product exists.


## V6 launch layer
- GitHub Pages Actions workflow
- `.nojekyll` for static PWA hosting
- GitHub Pages setup guide
- channel strategy
- Etsy companion product plan
