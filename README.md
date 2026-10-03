# Zweigesicht-1

An interactive 3D explorer of Marco Lang's Zweigesicht-1 / ML-01 watch movement,
built with React, TypeScript and Three.js from the maker's CAD assembly.

Inspect and isolate components, explore six mechanism groups, separate the
assembly, and choose case, dial and hand appearances. A separate Workshop at
`/workshop` offers Easy and Hard assembly puzzles with optional placement help,
Undo and local saves. This is static construction exploration; movement timing,
assembly paths and finishes are interpretations, not a servicing guide.

## Run locally

Use Node.js 24 (minimum 22.13). Run from the repository root:

```sh
npm ci --prefix explorer
npm --prefix explorer run dev
```

Open <http://127.0.0.1:4173/>. Tracked runtime models are sufficient to run the
application; original CAD and Python are needed only to regenerate assets.

To build and serve the production application locally:

```sh
npm --prefix explorer run build
npm --prefix explorer start -- --hostname 127.0.0.1 --port 4176
```

Workshop's homepage entry appears in development and Vercel Preview builds;
it is hidden in production. Direct `/workshop` access remains available and
`/play` redirects there. Workshop is excluded from indexing and the sitemap.

## Check changes

```sh
node --test tests/*.test.mjs
node scripts/play/validate-inventory.mjs
npm --prefix explorer run typecheck
npm --prefix explorer run lint
npm --prefix explorer run build
# With the production server running:
node explorer/scripts/check-seo.mjs http://127.0.0.1:4176
```

See [architecture and extended checks](docs/LOCAL_ARCHITECTURE.md) for browser
and loading suites, and [CAD notes](docs/CAD_NOTES.md) for asset reproduction.
Desktop browser checks do not establish physical-device, accessibility or
mechanical certification.

## Deployment

`develop` is integration/staging and `main` is production. Feature PRs target
`develop`; the manual release workflow verifies a reviewed commit before
fast-forwarding `main`. See [branching and releases](docs/BRANCHING_AND_RELEASES.md).

The root `vercel.json` packages `npm --prefix explorer run build:vercel` output
for Vercel's Git integration. Canonical/social URLs are set in
`explorer/src/content/seo.ts` and `explorer/app/sitemap.ts`; review them before
hosting a fork. Building locally does not authorize publication.

## Licensing and source assets

Guillem Galindo's original code and documentation use the standard
[MIT License](LICENSE). Third-party code retains its upstream licenses;
[notices](explorer/public/third-party-notices.txt) ship at `/third-party-notices.txt`.

Marco Lang / Atelier Marco Lang owns the watch design and supplied CAD.
CAD, derived runtime geometry/metadata and reconstruction images are **excluded**
from this MIT grant. Public redistribution permission is not established by the
recorded evidence. Keep the repository private until the
[publication gates](docs/RELEASE_GATES.md) are cleared. This independent project
is not affiliated with or endorsed by the maker.

Source URLs and hashes live in `assets/source-manifest/`; authored decisions
live in `assets/authored/`. Original CAD, reference imagery, environments and
build/evidence output remain ignored. [CAD notes](docs/CAD_NOTES.md) document
source defects, recoveries and interpretation limits.

See [current status](PROGRESS.md) for verified results and remaining work.
