# Nimbrial website

Marketing site for Nimbrial, a Cape Town studio building business systems, AI automation, premium websites and secure cloud operations.

Built with Next.js (static export), React, TypeScript, Tailwind CSS, three.js and anime.js. Hosted on Render as a static site.

## Getting started

Requires Node.js 22 (see `.nvmrc`).

```bash
npm install
npm run dev
```

Open http://localhost:3000.

## Scripts

| Command | What it does |
| --- | --- |
| `npm run dev` | Development server with live reload |
| `npm run build` | Static export to `out/`, then post-build steps (see below) |
| `npm run lint` | ESLint (warnings fail the build) |
| `npm run typecheck` | TypeScript type-check |
| `npm run test:e2e` | Playwright smoke tests against `out/` (run `npm run build` first) |

First time running the tests on a machine: `npx playwright install chromium`.

To preview the production build exactly as Render serves it, including its security headers:

```bash
npm run build
node tests/static-server.mjs out 4173
```

Then open http://127.0.0.1:4173.

## Project structure

```
src/app/            Pages: / (home), /services, /about; layout, global styles, icons
src/components/     UI and motion components
  HeroCanvas.tsx           3D hero scene
  FluidParticleEmblem.tsx  GPU particle emblem driven by a fluid simulation (tuning at the top)
  ParticleEmblem.tsx       CPU particle fallback for devices without GPU simulation support
  fluidField.ts            2D fluid simulation the pointer stirs
  brandPaths.ts            Logo vector paths
scripts/            Post-build steps
  flatten-segment-files.mjs  Fixes a Next.js bug in Windows builds (see the file header)
  add-csp.mjs                Adds a hash-based Content-Security-Policy to every page
tests/              Playwright smoke tests and the static server they run against
public/brand/       Logo files for use outside the site
render.yaml         Render deployment, including security headers
```

## Design tokens

Colours, spacing and radii live in `src/app/globals.css` (`@theme`) and use the same names as the Figma variables, so a change in one place carries through every page.

## Branching and releases

- `main` is what's live. It only changes through pull requests from `dev`.
- `dev` is the integration branch. Every change arrives by pull request from a short-lived branch (`feature/…`, `fix/…`, `chore/…`, `ci/…`, `test/…`, `security/…`).
- Pull requests must pass CI (lint, type-check, build, smoke tests, CodeQL, npm audit) before merging.
- Render deploys `main` automatically, only after all checks pass.

## Security

See [SECURITY.md](SECURITY.md) for how to report a vulnerability.
