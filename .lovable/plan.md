# Kiscsibe Modern Kifőzde – homepage implementation

## Goal
Rebuild the public homepage around the supplied desktop and mobile food photography, with a warm editorial Budapest-kifőzde character. Preserve every existing data source, ordering flow, theme control, route, and hidden five-click admin entry.

## Implementation
1. **Hero assets and responsive delivery**
   - Convert both supplied images to optimized WebP and AVIF variants and store them through the project asset flow.
   - Use responsive `<picture>` sources with fixed intrinsic dimensions to prevent layout shift.
   - Replace the dark hero with the supplied composition: readable copy in the quiet area, requested Hungarian text and CTAs, live opening hours/address, and a real-data-only daily-menu teaser with a useful unavailable state.
   - Add one slow image-drift/reveal effect, disabled by reduced-motion preferences.

2. **Editorial design system**
   - Define semantic paper, ink, tomato-red, Kiscsibe-yellow, and large-scale gingham tokens in the global theme.
   - Add subtle paper texture, thin print rules, strong focus states, restrained square geometry, and typography rules using Sofia selectively.
   - Keep dark-theme support coherent rather than removing the existing toggle.

3. **Navigation**
   - Restyle the desktop and mobile navigation for the paper/ink/red/yellow system.
   - Preserve all current links, Facebook, cart count and dialog, theme behavior, dynamic hours, and the exact five-click logo route to `/auth`.
   - Maintain compact mobile sizing and at least 44px interaction targets.

4. **Homepage sections**
   - Recompose the existing homepage bands with alternating paper, ink, yellow, and oversized gingham treatments.
   - Improve spacing, headings, separators, image presentation, and calls to action without deleting sections or changing their data or business behavior.
   - Reduce floating-card styling in the visible homepage components in favor of editorial rows and clear boundaries.

5. **Verification**
   - Run the project typecheck and focused lint checks.
   - Test the homepage in Chromium at desktop and mobile widths, including overflow, hero source selection, links, cart/menu controls, and the five-click admin navigation.
   - Confirm the current external Supabase 402 state fails gracefully and report it as an external limitation, not a design failure.

## Scope safeguards
- No database, Supabase, auth, RLS, order logic, prices, admin pages, or publishing changes.
- No invented menu dishes, reviews, metrics, or operational claims.
- Existing functionality and Hungarian content remain intact unless the brief explicitly supplies replacement wording.
