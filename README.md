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
it is hidden in production. Direct `/workshop` access remains available.
Fresh direct visits choose a difficulty on Workshop; valid saves resume.
Workshop is excluded from indexing and the sitemap.

## Explore the workbench

The homepage’s **Explore it in first person** invitation introduces `/bench`: a
first-person, miniature-scale view of the static movement, its holders and detached
watch parts. It opens `/bench` directly, where the controls appear while the scene
loads. **Start exploring** captures the mouse only after an explicit action.
This experience requires a keyboard and mouse. Touch-only devices show
**Explore on desktop** instead; direct visits explain the requirement without
loading the scene. Local holder files
and the Blender environment must be prepared first; see the
[bench setup, controls, design decisions and testing strategy](docs/BENCH_EXPERIENCE.md).
Holder downloads and generated bench assets stay out of Git; hosted delivery
requires an approved asset source and the applicable release gates.

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
`develop`; after one-time app setup, **Release to production** on `main` opens
and merges a checked `develop` → `main` PR and synchronizes the branches. See [branching and releases](docs/BRANCHING_AND_RELEASES.md).

The root `vercel.json` packages `npm --prefix explorer run build:vercel` output
for Vercel's Git integration. Canonical/social URLs are set in
`explorer/src/content/seo.ts` and `explorer/app/sitemap.ts`; review them before
hosting a fork. Building locally does not authorize publication.

Hosted Bench is opt-in: set `BENCH_ASSET_BASE_URL` to an approved HTTPS storage
directory containing `movement.glb`, `dial.glb` and `environment.glb`. If required,
set `BENCH_ASSET_TOKEN` as a sensitive Vercel build environment variable; requests
use Bearer authentication. The build checks all three files against recorded
runtime hashes and fails on missing or corrupt files. Holder STLs stay private; CI
converts the recorded originals and checks geometry and transfer-size savings. Redirects are not followed.
Without the URL, the hosted homepage omits the Bench invitation and `/bench`
shows an unavailable message. See [Bench deployment](docs/BENCH_EXPERIENCE.md#hosted-delivery).

## Licensing and source assets

Guillem Galindo's original code and documentation use the standard
[MIT License](LICENSE). Third-party code retains its upstream licenses;
[notices](explorer/public/third-party-notices.txt) ship at `/third-party-notices.txt`.

Marco Lang / Atelier Marco Lang owns the watch design and supplied CAD.
CAD, derived runtime geometry/metadata and reconstruction images are **excluded**
from this MIT grant. Public redistribution permission is not established by the
recorded evidence. Repository visibility is recorded in
[PROGRESS.md](PROGRESS.md); public visibility does not clear the
[publication gates](docs/RELEASE_GATES.md). This independent project
is not affiliated with or endorsed by the maker.

The [publication inventory](assets/source-manifest/publication-inventory.json)
records remote-reachable asset versions. The gates include a reviewable history
remediation plan and a code-only setup alternative; the
[permission request](docs/ASSET_PERMISSION_REQUEST.md) is an unsent draft.

Source URLs and hashes live in `assets/source-manifest/`; authored decisions
live in `assets/authored/`. Original CAD, reference imagery, environments and
build/evidence output remain ignored. [CAD notes](docs/CAD_NOTES.md) document
source defects, recoveries and interpretation limits.

See [current status](PROGRESS.md) for verified results and remaining work, and
the [repository review](docs/REPOSITORY_REVIEW.md) for the maintenance map, cleanup
evidence and deferred architectural decisions.
