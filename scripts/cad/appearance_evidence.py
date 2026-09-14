#!/usr/bin/env python3
"""Index existing local browser evidence; never captures or modifies images."""
from pathlib import Path
import hashlib
import html
import json

ROOT = Path(__file__).resolve().parents[2]
OUT = ROOT / 'artifacts/browser/component-appearance-audit'
pairs = [('movement', 'Whole movement'), ('dial', 'Opposite movement side'),
         ('dpl', 'DPL RBR — warm cap'), ('setting', 'Diamond and original chaton'),
         *[(f'clamp-screw-{n}', f'Werkhaltelasche screw P{n}') for n in (43, 44, 45)]]
paired = {f'{phase}-{key}.png' for key, _ in pairs for phase in ('before', 'after')}

def figure(name, caption):
    assert (OUT / name).is_file(), name
    return f'<figure><a href="{html.escape(name)}"><img loading="lazy" src="{html.escape(name)}" alt="{html.escape(caption)}"></a><figcaption>{html.escape(caption)}</figcaption></figure>'

body = '''<h1>Component appearance — visual evidence</h1>
<p>9 September 2026 · Local review only · Original maker CAD</p>
<p><a href="../../../docs/CAD_NOTES.md">Audit and limitations</a> ·
<a href="../../../docs/appearance/ledger.json">365-instance ledger</a> ·
<a href="evidence-manifest.json">File hashes</a></p>
<p>55 verified, 287 inferred, 23 unresolved assignments. Verification concerns visible
identity and material family, not every concealed surface or measured finish.</p>
<p>The before images precede product edits at commit 00ae9d3. Paired views repeat the
same source selection, side and isolation workflow at 1280×720. Framing is matched
for comparison, not registered pixel-for-pixel: the initial browser used DPR 1.5,
later captures DPR 1; some images show the collapsed inspection control. Lighting
and camera presets are retained. Gold selection boxes are UI, not source geometry.</p>
<p>The recovered diamond uses the maker's original simplified eightfold STL and
unchanged placement. It is not a reconstructed photographic brilliant cut; internal
bounces and dispersion are not simulated. The final screw-head macro replaced a
rejected intermediate annotation. All six reveals were captured again after that fix.</p>'''
for key, label in pairs:
    body += '<h2>' + html.escape(label) + '</h2><div class="pair">'
    body += figure(f'before-{key}.png', 'Before — ' + label)
    body += figure(f'after-{key}.png', 'After — ' + label) + '</div>'
body += '<h2>Accepted inspection views</h2><div class="grid">'
for p in sorted(OUT.glob('*.png')):
    if p.name not in paired and not p.name.startswith('candidate-'):
        body += figure(p.name, p.stem.replace('-', ' '))
body += '</div><h2>Rejected intermediate candidates</h2><p>Preserved as review history; these are not the accepted result.</p><div class="grid">'
for p in sorted(OUT.glob('candidate-*.png')):
    body += figure(p.name, p.stem.replace('-', ' '))
body += '</div><h2>Primary reference evidence</h2>'
body += '''<p>Maker whole-movement photograph and SJX macro photographs establish visible
appearance. Maker component renders establish identity/form and display-color intent;
their RGB is not a calibrated material measurement. The requested attachment directory
contained goal text only; no missing image is claimed as reviewed.</p>
<p><a href="../../../assets/reference/finishing/maker-Front_2_Werk-6000x4496.jpg">Maker whole-movement photograph</a> ·
<a href="../../../assets/reference/finishing/sjx-movement-detail-4.jpg">SJX macro 4</a> ·
<a href="../../../assets/reference/finishing/sjx-movement-detail-5.jpg">SJX macro 5</a> ·
<a href="../../../assets/source-manifest/component-appearance-references.json">Maker component URLs, attributions and hashes</a> ·
<a href="../../../assets/source-manifest/finishing-references.json">Existing reference index</a></p>
<h2>Measured evidence</h2><p>29 CPU source/asset checks and four state tests pass. Six
real-browser checks pass: exact reassembly, interrupted reveals, visibility, stable
resources and zero idle redraws. Graphics recovery retains the recovered diamond and
all 58 annotation definitions. Narrow 390 and 320 px layouts have no document overflow.
These are sampled browser actions, not calibrated photography, temporal-AA certification
or physical-device thermal tests. Tight macros intentionally crop surrounding context;
original coarse CAD facets remain visible at extreme magnification.</p>'''
for p in sorted(OUT.glob('*.json')):
    if p.name != 'evidence-manifest.json':
        body += f'<p><a href="{p.name}">{p.name}</a></p>'
page = '''<!doctype html><html lang="en"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Component appearance evidence</title><style>
body{margin:0 auto;padding:36px 24px;max-width:1500px;background:#11191d;color:#edf0f0;font:16px/1.6 system-ui}h1,h2{font-family:Georgia,serif}h1{font-size:38px}h2{margin-top:44px}p{max-width:1000px}a{color:#dec68e}figure{margin:0}img{display:block;width:100%;height:auto;border:1px solid #374247}figcaption{padding:9px 0 24px;color:#bbc8ca}.pair,.grid{display:grid;grid-template-columns:1fr 1fr;gap:18px}.grid img{max-height:520px;object-fit:contain;background:#0b1114}@media(max-width:800px){.pair,.grid{grid-template-columns:1fr}body{padding:20px 12px}}
</style>''' + body + '</html>'
(OUT / 'index.html').write_text(page)
files = [p for p in sorted(OUT.iterdir()) if p.is_file() and p.name != 'evidence-manifest.json']
manifest = [{'file': p.name, 'bytes': p.stat().st_size,
             'sha256': hashlib.sha256(p.read_bytes()).hexdigest()} for p in files]
(OUT / 'evidence-manifest.json').write_text(json.dumps({'scope': 'local-only browser evidence', 'files': manifest}, indent=2) + '\n')
print(f'Indexed {len(files)} preserved files')
