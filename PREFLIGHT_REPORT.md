# Marco Lang unattended-build preflight

Updated 9 September 2026 (Europe/Madrid). Scope: preparation and access verification only. No Goal was activated, no automation was scheduled, no production website was started, no Site was registered, and nothing was published.

## Decision

**Ready for the first CAD/prototype build stage: YES.** The real assembly is downloaded and verified, an isolated Open Cascade toolchain can recover assembly instances and placements, a real catalog component converts to GLB, Blender is installed and can import it, and the real mesh rendered and responded to orbit/rotation controls in the in-app browser.

Later publishing and release gates remain separate. GitHub publishing is blocked until this directory is intentionally initialized as a repository and given a real SSH remote. Public distribution of source or derived CAD is also blocked until the applicable reuse terms are established. Site creation/deployment was deliberately not tested because preflight was required to remain read-only for hosting.

## Capability matrix

| Capability | Result | Evidence |
|---|---|---|
| Read project instructions | PASS | `IMPLEMENTATION_PLAN.md` (345 lines), `UNATTENDED_RUN.md` (106), and `PROGRESS.md` (32 before this update) were read. |
| Project file writes | PASS | Created this report, manifests, scripts, conversion artifacts, and the isolated smoke test. |
| Temporary staging | PASS | `mktemp -d "$PWD/.preflight-staging.XXXXXX"`, file creation, and cleanup succeeded. |
| Node/package managers | PASS | Node, npm, and pnpm paths and versions below. A clean offline `npm ci` installed the pinned smoke dependency. |
| Python | PASS | Default Python 3.13 is available; bundled Python 3.12.14 was selected for CAD compatibility. |
| Shell network access | PASS | Manufacturer pages, three STEP files, Python packages, and Blender were fetched after normal, narrowly scoped approval. Sandboxed DNS is restricted; network commands may require approval. |
| Web browsing | PASS | Manufacturer, PyPI, Blender, OpenAI, and Apple documentation were retrieved through the web tool. |
| Source CAD access | PASS | Real assembly plus two representative STEP components downloaded; envelope, byte count, and SHA-256 checks pass. |
| STEP/Open Cascade conversion | PASS | OCP/XCAF read the 43.7 MB assembly and recovered 426 instances, 255 unique definitions, and 388 non-identity placements. |
| Browser mesh export | PASS | Catalog screw exported to a valid 25,736-byte GLB with 515 triangles and 1,545 source STL vertices. |
| Blender | PASS | Blender 5.2.1 LTS installed at `/Applications/Blender.app`; headless import of the real GLB created four scene objects. Its Metal probe requires the approved outside-sandbox execution path. |
| FreeCAD | NOT TESTED | Not installed. It is not required for the proven OCP pipeline; install later only if a GUI CAD inspection gap appears. |
| Local server | PASS | Python 3.12 loopback server returned HTTP 200 for the page and GLB. Binding requires the already reviewed loopback permission. |
| Actual browser render | PASS | In-app browser visibly rendered the gold-toned real screw; DOM status reported `PASS — GLB loaded; 0.898 × 0.889 × 1.298 mm`. |
| Browser interaction | PASS | Automatic rotation pause/resume changed state and a pointer drag changed the camera view. Visual screenshots were captured in the preparation task transcript. |
| Long-running process | PASS | The smoke server remained listening on `127.0.0.1:4173` across browser and dependency checks. It was stopped after verification. |
| Git executable | PASS | `/opt/homebrew/bin/git`, version 2.55.0. |
| Local Git repository/remote | BLOCKED | `git status`, `git remote -v`, and `git rev-parse --show-toplevel` report that this directory is not a Git repository. This does not block local CAD/prototype work. |
| GitHub SSH authentication | PASS | Non-mutating `ssh -T` authenticated as the existing GitHub account; no known-hosts file was written. GitHub returns exit 1 by design because it offers no shell. |
| GitHub app/connector | PASS | Read-only authenticated-profile call succeeded. No `gh` command was used. |
| Sites tools/account | PASS | Read-only `list_sites(limit: 1)` succeeded, establishing connector availability and account access. |
| Site registration/version/deployment | NOT TESTED | Intentionally not called. Every Sites deployment URL is production; creation and deployment belong to implementation/release, not this preflight. |
| Delegation | PASS | One read-only subagent independently read all three instructions and reported its cwd and runtime inventory without changes or network access. |
| Subagent model/reasoning ID | NOT TESTED | The concrete runtime model and effort were not exposed to the subagent. No value was inferred. |
| Host power source | PASS | Mac mini (M4, 24 GB) is on AC power. |
| Current sleep prevention | PASS | `pmset -g assertions` showed an active `ChatGPT` `NoIdleSleepAssertion` during this run. |
| Persistent app sleep setting | PASS | Computer Use could not inspect the ChatGPT settings UI directly; the user confirmed the Mac/app configuration is correct on 9 September 2026. |
| Release/device/mechanical validation | NOT TESTED | Mobile devices, sustained performance, human comprehension, and expert mechanical review belong to later gates. |

Machine-readable summaries are in `artifacts/preflight/browser-smoke.json` and `artifacts/preflight/access-checks.json`.

## Tool locations and versions

| Tool | Verified location | Version |
|---|---|---|
| Node | `/Users/guillemgalindo/.nvm/versions/node/v24.19.0/bin/node` | 24.19.0 |
| npm | `/Users/guillemgalindo/.nvm/versions/node/v24.19.0/bin/npm` | 11.17.0 |
| pnpm | `/Users/guillemgalindo/.cache/codex-runtimes/codex-primary-runtime/dependencies/bin/fallback/pnpm` | 11.19.0 |
| Default Python | `/Users/guillemgalindo/.pyenv/shims/python3` | 3.13.0 |
| Bundled CAD Python | `/Users/guillemgalindo/.cache/codex-runtimes/codex-primary-runtime/dependencies/python/bin/python3` | 3.12.14 |
| CAD virtualenv Python | `.venv-cad/bin/python` | 3.12.14 |
| Open Cascade bindings | `.venv-cad` | OCP 7.9.3.1 |
| CadQuery | `.venv-cad` | 2.8.0 |
| trimesh | `.venv-cad` | 5.1.0 |
| git | `/opt/homebrew/bin/git` | 2.55.0 |
| CMake | `/opt/homebrew/bin/cmake` | 4.4.0 |
| uv | `/Users/guillemgalindo/.local/bin/uv` | 0.12.8 |
| Homebrew | `/opt/homebrew/bin/brew` | 6.0.22 after update |
| Blender | `/opt/homebrew/bin/blender` and `/Applications/Blender.app` | 5.2.1 LTS |
| Three.js smoke dependency | `scripts/preflight/smoke/node_modules/three` | 0.186.0 |

The app also exposes bundled Node 24 at `/Users/guillemgalindo/.cache/codex-runtimes/codex-primary-runtime/dependencies/node/bin/node`. FreeCAD, OpenSCAD, and assimp were not found. A stale app registration for Autodesk Fusion was visible to app discovery, but no executable path was found, so it was not treated as a verified CAD tool.

## Source CAD and hashes

Original downloads are isolated under `assets/source-originals/` and ignored by Git. Generated artifacts are elsewhere. Canonical machine-readable provenance is in `assets/source-manifest/sources.json`.

| Source | Bytes | SHA-256 |
|---|---:|---|
| `assets/source-originals/ml01-zweigesicht.stp` | 43,720,596 | `f34148903818c273e20deeb0e70d3dc7782e08a413bc0e420f30d8c209aa4a2b` |
| `assets/source-originals/010-linsenk-s60x105-k90x25.stp` | 17,484 | `a9049e784f8e50a44fb08f72b4583b35ff7eb712f10848bb160dfa0c2b9160cc` |
| `assets/source-originals/030-g_160x240x30.stp` | 9,766 | `229023546dab56d8befe214573d762627692acb12d97af3eff9085f63d019b78` |

All three begin with `ISO-10303-21;`, end with `END-ISO-10303-21;`, and match their manifest byte counts and hashes; they are not HTML error pages. Source pages:

- Movement catalog: <https://www.marcolangwatches.com/en/cad-2/zweigesicht-1/movement/>
- Complete assembly: <https://www.marcolangwatches.com/cad/ml01-zweigesicht-2/>
- Screw component: <https://www.marcolangwatches.com/cad/010-linsenk-s60x105-k90x25/>
- Jewel component: <https://www.marcolangwatches.com/cad/030-g_160x240x30/>

## CAD proof

The real assembly imports through STEPCAF/XCAF as one named free root, `ml01 zweigesicht`, with five direct components. Recursive traversal found 426 named component instances and 255 referenced definitions. Repeated definitions and distinct placements are preserved: for example, two `Applik Punkt 80` instances refer to the same definition label but have different world translations. Full local/world 4×4 transforms and stable XCAF label paths are in `artifacts/preflight/assembly-inventory.json`.

OCP emitted a non-fatal source-healing diagnostic (`FixShape ... gp_Dir2d() - input vector has zero norm`) while reading the component STEP. Transfer, assembly traversal, tessellation, GLB validation, the browser render, and Blender import still completed. Keep the warning visible during the full CAD audit rather than suppressing it.

The component proof output is:

- `scripts/preflight/smoke/public/real-component.glb` — 25,736 bytes in the verified run (generated output; source hashes above are the reproducibility anchors)
- `scripts/preflight/smoke/public/real-component.stl` — intermediate tessellation
- `artifacts/preflight/component-mesh-stats.json` — bounds, extents, and triangle counts

## Reproduce the checks

From `/Users/guillemgalindo/projects/marco-lang`:

```sh
# Recreate the isolated Python 3.12 CAD environment from the hash-pinned lock.
scripts/preflight/setup_cad_env.sh

# Verify original downloads without network access.
scripts/preflight/verify_sources.py

# Re-read the real assembly and regenerate inventory plus GLB.
scripts/preflight/run_cad_probe.sh

# Reinstall the isolated browser dependency exactly from package-lock.json.
(cd scripts/preflight/smoke && npm ci --ignore-scripts --no-audit --no-fund)

# Serve only the smoke-test directory, then open http://127.0.0.1:4173/.
scripts/preflight/run_smoke_server.sh
```

The server bind, a fresh dependency download, and Blender's Metal-backed headless startup may trigger already-reviewed narrow approvals. Sandboxed shell processes cannot necessarily see the outside-sandbox loopback listener; browser automation and approved loopback `curl` did.

## Exact diagnostic commands used

Key commands (all run from the project unless a subshell changes directory):

```sh
command -v <tool>; <tool> --version
find /Applications "$HOME/Applications" -maxdepth 2 -iname '*FreeCAD*' -o -iname '*Blender*'
python3 -c 'import importlib.util'  # checked OCP/OCC/cadquery/build123d/trimesh/numpy
git status --short --branch
git remote -v
git rev-parse --show-toplevel
pmset -g custom
pmset -g batt
pmset -g assertions
system_profiler SPHardwareDataType
file assets/source-originals/*
wc -c assets/source-originals/*
shasum -a 256 assets/source-originals/*
ssh -T -o BatchMode=yes -o ConnectTimeout=15 -o StrictHostKeyChecking=no -o UserKnownHostsFile=/dev/null git@github.com
UV_CACHE_DIR="$PWD/.cache/uv" uv venv --python <bundled-python-3.12> .venv-cad
UV_CACHE_DIR="$PWD/.cache/uv" uv pip install --python .venv-cad/bin/python cadquery==2.8.0 trimesh
UV_CACHE_DIR="$PWD/.cache/uv" uv pip compile scripts/preflight/requirements-cad.in --python .venv-cad/bin/python --python-platform aarch64-apple-darwin --generate-hashes --output-file scripts/preflight/requirements-cad.lock
UV_CACHE_DIR="$PWD/.cache/uv" uv pip sync --python .venv-cad/bin/python --require-hashes --offline --dry-run scripts/preflight/requirements-cad.lock
scripts/preflight/run_cad_probe.sh
npm view three version
(cd scripts/preflight/smoke && npm install --ignore-scripts --no-audit --no-fund)
(cd scripts/preflight/smoke && npm ci --ignore-scripts --no-audit --no-fund --offline)
python3 -m http.server 4173 --bind 127.0.0.1
curl -I http://127.0.0.1:4173/
curl -I http://127.0.0.1:4173/public/real-component.glb
brew install --cask blender
blender --background --factory-startup --python-expr <real-GLB-import-check>
```

Non-shell checks used the in-app browser to open the smoke URL, pause/resume rotation, drag the orbit control, and capture screenshots. Read-only connector checks were GitHub `get_profile({})` and Sites `list_sites({limit: 1})`.

## Host preparation for unattended work

Current official OpenAI guidance says to enable **Prevent sleep while running** for local work and keep the workspace available. In ChatGPT, open **Settings** with Cmd+, and verify **General → Prevent sleep while running** is on: <https://learn.chatgpt.com/docs/long-running-work> and <https://learn.chatgpt.com/docs/reference/settings>.

The current process already owns a `NoIdleSleepAssertion`. Computer Use could not inspect the settings UI itself, but the user confirmed the Mac/app configuration is correct on 9 September 2026. Apple documents the optional system-level setting under **System Settings → Energy** on a desktop Mac: enable **Prevent automatic sleeping when the display is off** if you want a second layer of protection: <https://support.apple.com/en-gb/guide/mac-help/-mchle41a6ccd/mac>.

For a run you intend to leave unattended:

1. Keep this Mac mini connected to power and a stable network.
2. Keep ChatGPT running and this project volume mounted; do not log out, restart, or quit the app.
3. Leave the confirmed sleep-prevention configuration enabled while the Goal runs.
4. Enable completion/input notifications if you want to notice an approval or blocker; do not assume a Goal broadens sandbox or approval access.
5. Start the future Goal only after deciding the Git/release path. This preflight did not activate it.

## Remaining actions, in priority order

### Required before the first CAD/prototype Goal

No technical setup action remains. Leave power, network, the app, and the confirmed sleep-prevention configuration available during unattended work.

### Required only before later GitHub publishing

1. Decide whether this directory should become a repository.
2. Provide or choose the real GitHub repository/SSH remote; do not invent one.
3. Resolve CAD/source redistribution terms before committing or publishing originals or derived models.

SSH identity and the connected GitHub app are already ready. No `gh` fallback is needed or permitted.

### Required only before later Sites deployment

No account connection action is currently indicated. The required native capabilities are present: list/get/create Site, issue a source-repository credential, save a version, deploy privately or to an approved audience, and poll deployment status. Site creation, asset-size validation, version saving, access selection, and deployment remain intentionally deferred to the implementation/release workflow. The Sites connector is available and authenticated.
