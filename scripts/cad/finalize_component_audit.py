#!/usr/bin/env python3
"""Apply recorded audit dispositions to the ledger, never to CAD/runtime assets."""
from collections import Counter
import hashlib,json
from pathlib import Path
import re
ROOT=Path(__file__).resolve().parents[2]

def digest(path):return hashlib.sha256(path.read_bytes()).hexdigest()

def main():
    p=ROOT/'docs/cad-component-ledger.json';ledger=json.loads(p.read_text())
    review=json.loads((ROOT/'assets/authored/component-fidelity-review.json').read_text())
    provenance=json.loads((ROOT/'assets/source-manifest/component-fidelity-sources.json').read_text())
    source_by_path={f['path']:f for f in provenance['files']}
    assert ledger['assemblySha256']==review['assemblySha256']
    manifest=json.loads((ROOT/'assets/generated/assembly-manifest.json').read_text())
    assert len(ledger['definitions'])==len([d for d in manifest['definitions'] if not d['isAssembly']])==202
    expected={i['id']:i for i in manifest['instances'] if not i['isAssembly']}
    observed=set()
    supplemental={r['definitionId']:r for r in json.loads((ROOT/'artifacts/cad/component-fidelity/supplemental-stl.json').read_text())}
    for row in ledger['definitions']:
        for occurrence in row['occurrences']:
            assert occurrence['id'] not in observed;observed.add(occurrence['id'])
            assert expected[occurrence['id']]['definitionId']==row['definitionId']
            assert expected[occurrence['id']]['worldTransform']==occurrence['worldTransform']
        decision=review['reviews'].get(row['definitionId'])
        if decision:
            row.setdefault('automatedClassification',row['classification'])
            row.update({k:v for k,v in decision.items() if k!='evidence'})
            row['evidence']=sorted(set(row['evidence']+decision['evidence']))
        if row['source']:
            row['source'].update(source_by_path[row['source']['path']])
            assert re.search(r'SI_UNIT\(\s*\.MILLI\.\s*,\s*\.METRE\.\s*\)', (ROOT/row['source']['path']).read_text(errors='replace'))
            row['source']['declaredLengthUnit']='mm'
        if row['definitionId']=='d_0_1_1_61':
            evidence=json.loads((ROOT/'artifacts/cad/component-fidelity/d_0_1_1_61-difference.json').read_text())
            row['excludedIndividualSource']=evidence['source']
            row['excludedVariantMetrics']={k:evidence[k] for k in ['assembly','individual','assemblyOnly','individualOnly']}
        if row['definitionId'] in supplemental:
            row['independentStl']=supplemental[row['definitionId']]
        if row['definitionId']=='d_0_1_1_225':
            row['independentStlSource']=next(f for f in provenance['files'] if f['filename']=='030-Brilliant_200.stl')
            assert digest(ROOT/row['independentStlSource']['path'])==digest(ROOT/'explorer/public/models/diamond-c74ee2731a1f.stl')
        if row['name'].startswith('010-') and 'threadFinding' not in row:
            row['threadFinding']=dict(assembly='Smooth analytic faces; no modeled helical thread found',individual='No exact matched individual source',specification='No thread specification inferred')
        if row['classification']=='missing source':
            row['findings']=['No exact independent component file in the fully checked movement, dial/hands and case/buckle catalog. Catalog assemblies are not treated as independent component matches. No similar part substituted.']
            row['confidence']='medium'
        for path in row['evidence']:
            assert (ROOT/path).exists(),path
        row['evidenceHashes']={path:digest(ROOT/path) for path in row['evidence']}
    assert observed==set(expected)
    for f in provenance['files']+provenance['pages']:assert digest(ROOT/f['path'])==f['sha256'],f['path']
    screws=[r for r in ledger['definitions'] if r['name'].startswith('010-')]
    ledger['coverage']=dict(uniquePhysicalDefinitions=202,leafOccurrences=365,matchedIndividualStepDefinitions=sum(bool(r['source']) for r in ledger['definitions']),classifications=dict(Counter(r['classification'] for r in ledger['definitions'])),screwDefinitions=len(screws),screwOccurrences=sum(len(r['occurrences']) for r in screws),matchedScrewDefinitions=sum(bool(r['source']) for r in screws),implementedGeometryChanges=0)
    ledger['review']='assets/authored/component-fidelity-review.json'
    ledger['limitations']=['Missing and unresolved sources remain explicitly unchanged','No mechanical certification; no new redistribution or publication','Boolean probe was stopped after completed clutch/plate/empty-diamond results; invalid dial booleans were not used','STL vertex distances are not full interface or topology equivalence proof']
    p.write_text(json.dumps(ledger,indent=2)+'\n');print(json.dumps(ledger['coverage']))

if __name__=='__main__':main()
