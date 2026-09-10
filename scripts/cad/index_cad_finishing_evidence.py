"""Hash local audit screenshots and link their indexed review ownership."""
import hashlib
import json
from pathlib import Path
from PIL import Image

ROOT = Path(__file__).resolve().parents[2]
E = ROOT / 'artifacts/browser/cad-finishing-audit'

def main():
    references = {}
    def walk(value, document, owner=None):
        if isinstance(value, dict):
            owner = value.get('id', value.get('parentId', value.get('group', owner)))
            for child in value.values():
                walk(child, document, owner)
        elif isinstance(value, list):
            for child in value:
                walk(child, document, owner)
        elif isinstance(value, str) and value.endswith('.png'):
            for p in [Path(value), ROOT / value, document.parent / value]:
                if p.is_file():
                    relative = str(p.resolve().relative_to(ROOT))
                    entry = {'index': str(document.relative_to(ROOT)), 'owner': owner}
                    if entry not in references.setdefault(relative, []):
                        references[relative].append(entry)
                    break
    for document in sorted(E.rglob('*.json')):
        if document.name != 'evidence-index.json':
            walk(json.loads(document.read_text()), document)
    records = []
    for p in sorted(E.rglob('*.png')):
        data = p.read_bytes()
        with Image.open(p) as im:
            width, height = im.size
            image_format = im.format
            im.verify()
        path = str(p.relative_to(ROOT))
        records.append({'path': path, 'bytes': len(data), 'sha256': hashlib.sha256(data).hexdigest(),
                        'width': width, 'height': height, 'actualImageFormat': image_format, 'references': references.get(path, []),
                        'status': 'indexed evidence; consult owning review for acceptance/limits' if path in references else 'supplementary or superseded capture; not counted as an individual review'})
    result = {'scope': 'Ignored local screenshots only; no public assets or original CAD copied',
              'screenshots': len(records), 'indexedScreenshots': sum(bool(r['references']) for r in records),
              'bytes': sum(r['bytes'] for r in records), 'files': records}
    (E / 'evidence-index.json').write_text(json.dumps(result, indent=2) + '\n')
    print(json.dumps({k: v for k, v in result.items() if k != 'files'}, indent=2))

if __name__ == '__main__':
    main()
