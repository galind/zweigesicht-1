#!/usr/bin/env python3
"""Acquire maker catalog CAD locally; preserve originals and hashed provenance.

No source files are tracked or redistributed. Reruns reuse hash-verified files.
"""
import concurrent.futures as futures
import datetime as dt
import hashlib
import html
import json
import re
import subprocess
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
BASE = 'https://www.marcolangwatches.com'
EVIDENCE = ROOT / 'artifacts/cad/component-fidelity/catalog'
ORIGINALS = ROOT / 'assets/source-originals/component-fidelity'
MANIFEST = ROOT / 'assets/source-manifest/component-fidelity-sources.json'


def fetch(url, path):
    path.parent.mkdir(parents=True, exist_ok=True)
    result = subprocess.run(['curl', '-fsSL', '--retry', '2', '--max-time', '45', url, '-o', str(path)], capture_output=True)
    if result.returncode:
        raise RuntimeError(result.stderr.decode().strip())
    return path.read_bytes()


def links(data):
    return [html.unescape(u) for u in re.findall(r'href=[\'\"]([^\'\"]+)', data.decode())]


def main():
    EVIDENCE.mkdir(parents=True, exist_ok=True)
    prior = json.loads(MANIFEST.read_text()) if MANIFEST.exists() else {'files': [], 'pages': []}
    known = {f['downloadUrl']: f for f in prior['files']}
    # Also reuse earlier acquisitions, including the requested starting screw.
    for name, key in [('sources.json', 'files'), ('component-appearance-references.json', 'downloads')]:
        for f in json.loads((ROOT / 'assets/source-manifest' / name).read_text())[key]:
            if f['path'].lower().endswith(('.stp', '.stl')):
                known[f.get('download_url', f.get('url'))] = dict(path=f['path'], sha256=f['sha256'], bytes=f['bytes'], retrievedAt=json.loads((ROOT / 'assets/source-manifest' / name).read_text()).get('retrieved_at', json.loads((ROOT / 'assets/source-manifest' / name).read_text()).get('accessed')), originalProvenance='assets/source-manifest/' + name)
    pages, failures, sources, page_cache = [], [], [], {}
    def page(url):
        if url in page_cache:
            return page_cache[url]
        path = EVIDENCE / (hashlib.sha256(url.encode()).hexdigest()[:16] + '.html')
        data = fetch(url, path)
        pages.append(dict(url=url, path=str(path.relative_to(ROOT)), sha256=hashlib.sha256(data).hexdigest(), retrievedAt=dt.datetime.now(dt.timezone.utc).isoformat()))
        page_cache[url] = data
        return data
    index = BASE + '/en/cad-2/zweigesicht-1/'
    categories = sorted(set(u for u in links(page(index)) if u.startswith(index) and u != index and '?' not in u and '#' not in u))
    catalogs = set(categories)
    for url in categories:
        try:
            data = page(url)
            # Enumerate every page below, including gaps hidden by ellipses.
        except Exception as e:
            failures.append(dict(url=url, error=str(e)))
    component_pages = set()
    for url in sorted(catalogs):
        try:
            data = page(url)
            # Pagination may expose pages omitted by the first-page ellipsis.
            maxpage = max([int(v) for v in re.findall(r'[?&]cp=(\d+)', data.decode())] or [1])
            for n in range(1, maxpage + 1):
                more = data if n == 1 else page(url.split('?')[0] + '?cp=' + str(n))
                component_pages.update(u for u in links(more) if u.startswith(BASE + '/cad/') and 'wpdmdl' not in u)
        except Exception as e:
            failures.append(dict(url=url, error=str(e)))
    def component(url):
        acquired = []
        try:
            data = page(url).decode()
            for filename, download in re.findall(r'<strong[^>]*>([^<]+\.(?:stp|step|stl))</strong>.*?href=[\'\"]([^\'\"]+)', data, re.I | re.S):
                filename, download = html.unescape(filename), html.unescape(download)
                if 'wpdmdl=' not in download:
                    continue
                old = known.get(download)
                path = ROOT / old['path'] if old else ORIGINALS / filename
                if old and path.exists() and hashlib.sha256(path.read_bytes()).hexdigest() == old['sha256']:
                    payload, retrieved = path.read_bytes(), old['retrievedAt']
                else:
                    if path.exists():
                        raise RuntimeError('Refusing to overwrite an unverified existing original: ' + str(path))
                    payload, retrieved = fetch(download, path), dt.datetime.now(dt.timezone.utc).isoformat()
                if filename.lower().endswith(('.stp', '.step')) and not payload.startswith(b'ISO-10303-21'):
                    raise RuntimeError('Download is not STEP: ' + filename)
                acquired.append(dict(pageUrl=url, downloadUrl=download, filename=filename, path=str(path.relative_to(ROOT)), bytes=len(payload), sha256=hashlib.sha256(payload).hexdigest(), retrievedAt=retrieved, **({'originalProvenance':old['originalProvenance']} if old and old.get('originalProvenance') else {})))
            return acquired
        except Exception as e:
            failures.append(dict(url=url, error=str(e)))
            return acquired
    with futures.ThreadPoolExecutor(max_workers=4) as pool:
        for i, files in enumerate(pool.map(component, sorted(component_pages)), 1):
            sources.extend(files)
            print(f'{i}/{len(component_pages)} pages; {len(sources)} CAD files', flush=True)
            MANIFEST.write_text(json.dumps(dict(schemaVersion=1, catalogUrl=index, checkedAt=dt.datetime.now(dt.timezone.utc).isoformat(), files=sorted(sources, key=lambda f:f['path']), pages=sorted(pages,key=lambda p:p['url']), failures=failures, redistribution='Local audit only; no new redistribution authorized'), indent=2) + '\n')
    print(json.dumps(dict(categories=categories, componentPages=len(component_pages), files=len(sources), failures=failures)))


if __name__ == '__main__':
    main()
