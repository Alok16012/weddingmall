# WeddingMall — Production Readiness Scorecard

Living scorecard per spec §21. Status: `Not started` · `In progress` · `Blocked by owner` · `Verified` · `N/A (reason)`.
Evidence = an artifact, test, config inspection, or reproducible command — never prose alone.

**Milestone: Phase 1 — Foundation + design-polish pass.** Last verified: 2026-07-25.

Design polish (skill-driven via `ui-ux-pro-max`, referencing `weddingmall.online`):
trust signals added (stats strip + "Why WeddingMall" verified/pricing/support section),
staggered reveal-on-mount + card hover-lift/press micro-interactions (150–420ms,
reduced-motion gated), global cursor affordance. Marketplace pattern's Trust/Safety
section now present. **Dark mode: explicitly out of scope (H-09)** — brand is a warm
light system matching the supplied mockups; revisit if a dark variant is requested.

## Weighted product score (spec §14) — baseline

| Category | Weight | Baseline | Evidence |
|---|--:|--:|---|
| Product completeness | 15 | 6 | 34-screen inventory mapped; both role shells + core couple/vendor screens built; many P0 flows still fixture-only |
| Functional UX | 15 | 8 | Discovery, search/filter/sort, shortlist (optimistic+rollback), enquiry validation, chat optimistic send, lead stage change all work |
| Visual design | 12 | 9 | Matches supplied high-fidelity mockups; tokens, Fraunces/Geist, gradient, glass, tabular nums; screenshots in report |
| Engineering quality | 13 | 9 | Typed, modular, repository abstraction, no duplicate systems, clean build + typecheck |
| Backend/data integrity | 10 | 3 | Schema + RLS migrations written & reviewable; **not yet applied**; app on fixtures |
| Security/privacy | 12 | 6 | Publishable-key-only client + boot guard; RLS positive/negative policies authored; secret-key rotation pending |
| Performance/reliability | 8 | 5 | Lazy images, skeletons, no layout shift; bundle 136 KB gzip; no measured device profile yet |
| Accessibility | 5 | 3 | 44px targets, aria labels, focus rings, reduced-motion, sr-only; no full audit yet |
| Testing/QA | 7 | 3 | 12 unit tests green (format + repository filtering/favourites/enquiry/products); no E2E yet |
| Release readiness | 3 | 1 | Capacitor deps installed; no android project/signing yet |
| **Total** | **100** | **≈53** | Rating ≈5/10 — *functional foundation, not production-ready* (honest baseline) |

## Hard gates (spec §14.1)

| Gate | Status |
|---|---|
| Production build succeeds, no critical error | ✅ Verified — `npm run build` |
| No P0 dead button / fake success in built screens | 🟡 Partial — built controls act; several screens still fixture-backed |
| Auth/session & role boundaries tested | 🔴 Pending — OTP auth is Phase 2; role switch works, no auth tests |
| RLS negative tests prove cross-user/vendor denial | 🟡 Authored (`supabase/tests/`); not executed (schema not applied) |
| No production secret in client bundle | ✅ Verified — publishable key only + `assertNoSecretKey()` boot guard |
| Couple journey passes end-to-end | 🟡 UI path complete on fixtures; real backend pending |
| Vendor journey passes end-to-end | 🟡 UI path complete on fixtures; real backend pending |
| Critical/high security defects = 0 | 🟡 1 dependency advisory (RSC-only, N/A to our SPA) documented |
| Critical accessibility blockers = 0 | 🟡 No audit run yet |
| Offline drafts/queued actions recover w/o duplication | 🔴 Pending (Phase 4/OFF-01) |
| Final responsive/visual review all widths | 🟡 Mobile verified; other widths pending |

## 96-item playbook (spec §21) — notable rows

| ID | Check | Status | Evidence |
|---|---|---|---|
| A-09 | Secrets in env/config, excluded from VCS | Verified | `.env*` gitignored; `.env.example` names only |
| A-10 | `.env.example` names/placeholders only | Verified | `.env.example` |
| A-14 | Authorisation enforced at data layer | In progress | `0002_rls_policies.sql` authored, not applied |
| A-20 | Type check passes cleanly | Verified | `npm run typecheck` |
| A-21 | Lint passes | Verified | `npm run lint` (1 non-blocking fast-refresh warning) |
| A-24 | Every major screen: loading/empty/error/recovery | In progress | Skeletons, EmptyState, ErrorState primitives + used in Explore/Favourites/Detail |
| A-27 | Design tokens replace ad-hoc values | Verified | `src/index.css` `@theme` |
| H-01..H-12 | UI 10/10 | In progress | tokens, type pairing, tabular nums, states — see report screenshots |
| F-05 | Use existing Supabase, credentials secure | In progress | connected via publishable key; secret used locally read-only for discovery |
| F-10 | Rotate any plaintext-exposed credential | **Blocked by owner** | `sb_secret_…` was pasted in chat — owner must rotate |

## Known limitations (owner / impact / unblock)

1. **Backend on fixtures** — real Supabase integration blocked until migrations are applied (owner approval) + `VITE_DATA_SOURCE=supabase`. Impact: no real persistence yet.
2. **Secret key exposed in chat** — owner must rotate `sb_secret_…` in Supabase dashboard (F-10).
3. **OTP auth not built** — Phase 2 (AUTH-01); demo session used to make both shells navigable.
4. **No Android project yet** — Phase 6 (Capacitor deps installed only).
5. **`weddingmall.online` uses a different DB** — cross-surface "single source of truth" needs owner to confirm the canonical database.
