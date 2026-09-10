"""Assemble reviewed evidence without touching production; --verify requires completeness.

Run after the independent source, pipeline, reference and browser reviews. This
joins human observations; it never manufactures a pixel-review pass from a capture.
"""
import argparse
import collections
import hashlib
import json
from pathlib import Path

ROOT = Path(__file__).resolve().parents[2]
E = ROOT / 'artifacts/browser/cad-finishing-audit'
S = ROOT / 'artifacts/cad-finishing-audit'
OUT = ROOT / 'docs/appearance/cad-finishing-audit.json'

def read(p):
    return json.loads(p.read_text())

def rel(p):
    return str(p.resolve().relative_to(ROOT))

def resolve(p, base):
    for candidate in [Path(p), ROOT / p, base / p]:
        if candidate.is_file():
            return rel(candidate)
    raise AssertionError(f'Missing evidence: {p} relative to {base}')

def image_references(value):
    if isinstance(value, dict):
        for v in value.values():
            yield from image_references(v)
    elif isinstance(value, list):
        for v in value:
            yield from image_references(v)
    elif isinstance(value, str) and value.endswith('.png'):
        yield value

def main():
    parser = argparse.ArgumentParser(description=__doc__)
    parser.add_argument('--verify', action='store_true')
    args = parser.parse_args()
    source = read(S / 'source/source-audit.json')
    pipeline = read(S / 'pipeline/pipeline.json')
    reference = read(S / 'reference/reference-review.json')
    verification = read(S / 'pipeline/verification.json')
    manifest = read(ROOT / 'explorer/public/models/assembly-manifest.json')
    nodes = {p['id']: p for p in manifest['instances']}
    leaves = {p['id']: p for p in manifest['instances'] if not p['isAssembly']}
    sd = {d['id']: d for d in source['definitions']}
    pd = {d['id']: d for d in pipeline['definitions']}
    rd = {d['definitionId']: d for d in reference['definitions']}
    so = {p['id']: p for p in source['occurrences']}
    assert len(sd) == len(source['definitions']) == len(pd) == len(rd) == 202
    assert set(sd) == set(pd) == set(rd) == {p['definitionId'] for p in leaves.values()}
    assert set(so) == set(leaves) == {p['id'] for p in pipeline['occurrences']}
    tranches = [('', 'index.json', 'visual-notes.json'),
                ('catalog', 'capture-index.json', 'visual-notes.json'),
                ('catalog-second', 'index.json', 'pixel-notes.json'),
                ('movement-second', 'capture-index.json', 'visual-notes.json'),
                ('movement-middle', 'capture-index.json', 'visual-notes.json')]
    captures, notes = {}, {}
    for folder, index, note in tranches:
        base = E / folder
        if not (base / index).exists():
            continue
        records = read(base / index)
        for r in records:
            assert r['id'] not in captures, f'Duplicate capture ownership: {r["id"]}'
            views = []
            for v in r.get('shots', r.get('views', [])):
                path = resolve(v.get('path', v.get('file')), base)
                views.append({**{k: value for k, value in v.items() if k not in ['state', 'lastMeasuredState', 'view', 'label', 'path', 'file']},
                              'view': v.get('view', v.get('label')), 'path': path})
            captures[r['id']] = {'index': rel(base / index), 'views': views}
        if not (base / note).exists():
            continue
        nn = read(base / note)
        if isinstance(nn, dict):
            nn = [{'id': k, 'observation': v} for k, v in nn.items()]
        for n in nn:
            if 'id' not in n:
                n['id'] = next(r['id'] for r in records if r['index'] == n['index'])
            assert n['id'] not in notes, f'Duplicate review: {n["id"]}'
            observation = n.get('observation', n.get('observations', ''))
            assert isinstance(observation, str) and len(observation) > 60, n
            assert 'same as above' not in observation.lower(), n
            # Include axial/macro supplements and validate parent references too.
            for image_path in image_references(n):
                resolve(image_path, base)
            for key in ['supplementalEvidence', 'supplementaryEvidence', 'evidencePaths']:
                for image_path in image_references(n.get(key, [])):
                    path = resolve(image_path, base)
                    if path not in {v['path'] for v in captures[n['id']]['views']}:
                        captures[n['id']]['views'].append({'view': 'individual reviewed supplement', 'path': path})
            notes[n['id']] = {**n, 'evidenceIndex': rel(base / note)}
    assert set(captures) <= set(leaves) and set(notes) <= set(captures)
    catalog_contexts = []
    for folder in ['catalog', 'catalog-second']:
        context_path = E / folder / 'parent-index.json'
        if context_path.exists():
            for context in read(context_path):
                paths = [resolve(path, context_path.parent) for path in image_references(context)]
                assert paths and len(context.get('observation', '')) > 40
                catalog_contexts.append({**context, 'resolvedEvidencePaths': paths, 'evidenceIndex': rel(context_path)})
    definitions = []
    for id, d in sd.items():
        r, p = rd[id], pd[id]
        assert set(d['occurrenceIds']) == {x for x, l in leaves.items() if l['definitionId'] == id}
        assert d['occurrenceCount'] == len(d['occurrenceIds'])
        groups = []
        annotation = {f['faceId']: f for f in (p.get('annotation') or {}).get('faces', [])}
        assert set(annotation) <= {f['id'] for f in d['faces']}
        assert r['sourceTransparent'] == d['sourceTransparent']
        assert r['sourceFaceAppearanceGroupCount'] == len(d['faceAppearanceGroups'])
        face_groups = {}
        for g in d['faceAppearanceGroups']:
            for f in g['faceIds']:
                assert f not in face_groups
                face_groups[f] = g['id']
            groups.append({**g, 'review': r['substantiveReview'],
                           'physicalIdentity': 'Unclassified unless explicitly supported in the definition review; CAD RGBA is not measured alloy or optical data.',
                           'runtimeRoles': sorted({role['role'] for f in g['faceIds'] for role in annotation.get(f, {}).get('roles', [])})})
        assert set(face_groups) == {f['id'] for f in d['faces']}
        body_faces = collections.Counter(f for b in d['bodies'] for f in b['faceIds'])
        assert set(body_faces) == set(face_groups) and all(n == 1 for n in body_faces.values())
        faces = []
        for f in d['faces']:
            # RGBA/inheritance is losslessly represented by group plus body/definition.
            face = {k: v for k, v in f.items() if k not in ['inheritanceChain', 'directColors', 'effectiveSurfaceAppearance', 'material']}
            face['appearanceGroupId'] = face_groups[f['id']]
            face['runtimeRoles'] = annotation.get(f['id'], {}).get('roles', [])
            face['runtimeAnnotationStatus'] = ('annotated' if face['runtimeRoles'] else
                                               'not tessellated; no runtime annotation vertices' if f['missingTriangulation'] else
                                               'unannotated; generic material/normal shading')
            faces.append(face)
        visual_ids = [x for x in d['occurrenceIds'] if x in notes]
        correction = {'action': r['recommendation'], 'implementationAuthorized': False,
                      'scope': {'definitionId': id, 'occurrenceIds': d['occurrenceIds']},
                      'currentFamily': p['assignment']['family'],
                      'sourceRegionEvidence': [{'groupId': g['id'], 'faceIds': g['faceIds']} for g in groups],
                      'annotationChange': 'None authorized; determine only after exact regional intent is approved',
                      'verification': 'Review all listed occurrences, both opposing surfaces, oblique light/dark, edge, macro and assembled context; preserve correction locks.',
                      'risk': 'Do not broaden this definition or face-group decision to neighboring parts or exact steel overrides.',
                      'decision': 'Retain pending approval' if r['sourceReferenceDisposition'] != 'Match' else 'Retain existing appearance',
                      'planReference': 'docs/CAD_FINISHING_IMPLEMENTATION_PLAN.md'}
        if id == 'd_0_1_1_21':
            correction.update({'proposalId': 'A1-D21', 'bodyIds': [1, 2], 'faceIds': sorted(face_groups),
                               'current': 'Raw catalog enamel red 0x6c2031; fitted small dial cobalt with transmission .58',
                               'proposed': 'Blue color family for raw d21, preserving separate genuinely red d4 and current fitted blue. Do not infer measured transmission from source alpha.',
                               'annotationChange': False, 'existingShaderSystem': True})
        definitions.append({'id': id, 'name': d['name'], 'occurrenceIds': d['occurrenceIds'],
                            'occurrenceCount': d['occurrenceCount'],
                            'source': {**{k: v for k, v in d.items() if k not in ['id', 'name', 'occurrenceIds', 'occurrenceCount', 'subshapeLabels', 'faces', 'faceAppearanceGroups']}, 'faceAppearanceGroups': groups, 'faces': faces},
                            'runtime': {k: v for k, v in p.items() if k not in ['sourceSummary', 'priorLedger']}, 'sourceReferenceReview': r['substantiveReview'],
                            'disposition': r['sourceReferenceDisposition'], 'confidence': r['confidence'],
                            'confidenceReason': r['substantiveReview'] + ' Confidence applies to this evidence comparison, not measured physical finish.', 'evidence': r['evidence'],
                            'userCorrectionLocks': r['userCorrectionLocks'], 'proposedCorrection': correction,
                            'visualReviewedOccurrenceIds': visual_ids,
                            'visualEvidence': [v for x in visual_ids for v in captures[x]['views']],
                            'reviewComplete': len(visual_ids) == d['occurrenceCount']})
    dd = {d['id']: d for d in definitions}
    occurrences = []
    for p in pipeline['occurrences']:
        id, did = p['id'], p['definitionId']
        d = dd[did]
        disposition = 'Intentional override' if p['exactInstanceOverride'] else d['disposition']
        # The exact instance override is the primary reason to differ from a reused base.
        row = {k: v for k, v in p.items() if k != 'priorLedger'}
        ancestry = []
        parent = p['parentId']
        while parent:
            node = nodes[parent]
            assert parent not in {a['id'] for a in ancestry}, 'Assembly cycle'
            ancestry.append({'id': parent, 'name': node['name']})
            parent = node.get('parentId')
        row.update({'source': so[id], 'sourceDefinitionRef': did,
                    'assemblyAncestry': list(reversed(ancestry)),
                    'sourceReview': d['sourceReferenceReview'],
                    'visualReview': notes.get(id), 'visualEvidence': captures.get(id),
                    'catalogParentContexts': [{'id': c.get('id', c.get('parentId')), 'observation': c['observation'], 'evidenceIndex': c['evidenceIndex'], 'paths': c['resolvedEvidencePaths']} for c in catalog_contexts if id in c.get('occurrenceIds', [])],
                    'disposition': disposition, 'confidence': 'high' if p['exactInstanceOverride'] else d['confidence'],
                    'confidenceReason': 'Exact steel override is explicitly preserved; source orientation and individual pixels recorded. Numeric finish remains authored.' if p['exactInstanceOverride'] else d['confidenceReason'],
                    'orientationRelevance': {'worldLocalZ': p['worldLocalZ'], 'worldTransform': p['worldTransform'],
                                              'review': 'Camera labels are movement-relative, not guaranteed part-axis normals; see individual edge/axial supplements and recorded visibility limits.'},
                    'regionalAssessmentRef': did + '/source/faceAppearanceGroups',
                    'finishAssessment': {'evidence': d['sourceReferenceReview'],
                                         'numericalStatus': 'Color, roughness, grain period, anisotropy and optical constants are authored; no measured finish certification.'},
                    'proposedCorrection': d['proposedCorrection'], 'reviewComplete': id in notes})
        if p['exactInstanceOverride']:
            row['proposedCorrection'] = {'action': 'Retain this exact steel occurrence override; do not broaden a blue definition correction to this instance.', 'occurrenceId': id, 'implementationAuthorized': False}
        occurrences.append(row)
    counts = {'definitions': len(definitions), 'occurrences': len(occurrences),
              'capturedOccurrences': len(captures), 'pixelReviewedOccurrences': len(notes),
              'sourceBodies': sum(len(d['source']['bodies']) for d in definitions),
              'sourceFaces': sum(len(d['source']['faces']) for d in definitions),
              'sourceAppearanceGroups': sum(len(d['source']['faceAppearanceGroups']) for d in definitions),
              'leafScreenshots': sum(len(c['views']) for c in captures.values()),
              'nonSettledTransitionScreenshots': sum('Not accepted' in v.get('settledViewAcceptance', '') for c in captures.values() for v in c['views']),
              'definitionDispositions': dict(collections.Counter(d['disposition'] for d in definitions)),
              'occurrenceDispositions': dict(collections.Counter(o['disposition'] for o in occurrences)),
              'definitionConfidence': dict(collections.Counter(d['confidence'] for d in definitions)),
              'occurrenceConfidence': dict(collections.Counter(o['confidence'] for o in occurrences))}
    complete = set(notes) == set(leaves)
    baseline = read(S / 'baseline-hashes.json')
    changed = [path for path, sha in baseline['files'].items()
               if hashlib.sha256((ROOT / path).read_bytes()).hexdigest() != sha]
    assert not changed, f'Baseline production/user files changed: {changed}'
    assert set(pipeline['roleCoverage']) == {str(i) for i in range(11)}
    assert all(pipeline['roleCoverage'].values())
    assert len(pipeline['exactOverrides']) == 29
    assert len([d for d in pipeline['repeatedDefinitions'] if d['differingTreatment']]) == 4
    assert len(verification['checks']) == 58
    assert all(c['sourceSidecarHashMatched'] and c['roleCountsMatchPackagerReport'] and c['normalRoleEntriesValid'] for c in verification['checks'])
    assert len(verification['fallbackProbes']) == 13
    runtime_checks = read(S / 'runtime-validation.json')
    assert len(runtime_checks['results']) == 64 and all(c['status'] == 'pass' for c in runtime_checks['results'])
    result = {'schemaVersion': 1, 'status': 'assembled; final verification/signoff required' if complete else 'in progress; not ready for approval',
              'scope': 'Local investigation only. No production changes authorized or performed.',
              'evidenceHierarchy': reference['evidenceHierarchy'], 'counts': counts,
              'sourceInventory': source['summary'], 'sourceMethod': source['method'],
              'transverseSourceAxes': [{'id': p['id'], 'definitionId': p['definitionId'], 'worldLocalZ': p['worldLocalZ']} for p in pipeline['occurrences'] if abs(p['worldLocalZ'][2]) < .9],
              'sourceValidation': read(S / 'source/validation.json'),
              'sourceProvenance': source['source'], 'sourceLimitations': source['limitations'],
              'pipeline': {k: v for k, v in pipeline.items() if k not in ['definitions', 'occurrences']},
              'pipelineVerification': verification,
              'runtimeRegressionChecks': runtime_checks,
              'preservationVerification': {'baselineHead': baseline['head'], 'filesChecked': len(baseline['files']), 'changedFiles': changed, 'baselineEvidence': 'artifacts/cad-finishing-audit/baseline-hashes.json'},
              'userCorrectionLocks': reference['userCorrectionLocks'],
              'previousLedgerReconciliation': reference['previousLedgerReconciliation'],
              'staleHistoricalClaims': reference['staleHistoricalClaims'],
              'reviewedReferenceImages': reference['reviewedReferenceImages'],
              'mechanismContextEvidence': read(E / 'contexts/index.json'),
              'catalogParentContextEvidence': catalog_contexts,
              'fittedDialEvidence': read(E / 'contexts/dials.json'),
              'supplementalContextEvidence': read(E / 'contexts/supplemental-index.json'),
              'finalBrowserState': read(E / 'contexts/final-state.json'),
              'finalBrowserConsole': read(E / 'contexts/final-console.json'),
              'definitions': definitions, 'occurrences': occurrences}
    for presentation in result['pipeline']['configurationPresentations']:
        presentation['auditAssessment'] = 'Captured current authored metadata. Its claim that raw d21 is source-red is stale: fresh XCAF bodies are blue. Preserve fitted blue; see A1-D21 and staleHistoricalClaims.'
    assert len({o['id'] for o in occurrences}) == len(occurrences) == 365
    assert counts['sourceBodies'] == 204 and counts['sourceFaces'] == 25228 and counts['sourceAppearanceGroups'] == 276
    assert len(result['previousLedgerReconciliation']) == 365
    assert reference['coverage']['notesFallbackCount'] == 0
    result['referenceReviewCoverage'] = reference['coverage']
    assert all(len(d['sourceReferenceReview']) > 40 for d in definitions)
    if args.verify:
        assert complete, f'Unreviewed leaves: {len(leaves) - len(notes)}'
        assert all(d['reviewComplete'] for d in definitions)
        assert all(len(o['visualEvidence']['views']) >= 7 for o in occurrences)
        assert all(o['catalogParentContexts'] for o in occurrences if o['scope'] == 'optional catalog'), 'Catalog parent context is incomplete'
        signoffs = read(S / 'review-signoffs.json')
        assert all(signoffs.get(k) is True for k in ['lead', 'source_audit', 'pipeline_audit', 'evidence_review'])
        result['reviewSignoffs'] = signoffs
        for block in ['mechanismContextEvidence', 'fittedDialEvidence', 'supplementalContextEvidence']:
            for image_path in image_references(result[block]):
                resolve(image_path, E)
        result['status'] = 'complete audit; approval required before implementation'
    OUT.parent.mkdir(parents=True, exist_ok=True)
    OUT.write_text(json.dumps(result, ensure_ascii=False, separators=(',', ':')) + '\n')
    (S / 'assembled-counts.json').write_text(json.dumps(counts, indent=2) + '\n')
    print(json.dumps(counts, indent=2))
    if args.verify:
        report = ROOT / 'docs/CAD_FINISHING_AUDIT.md'
        text = report.read_text().split('<!-- GENERATED VERIFIED APPENDIX -->')[0]
        text = text.replace('**Audit assembly in progress. This draft is not yet the approval checkpoint.**', '**Complete local audit; ready for user approval before implementation.**')
        text = text.replace('The final coverage and verification appendix is generated only after all individual browser reviews are present.', 'All individual browser reviews and the programmatic coverage gates passed.')
        text = text.replace('The final generated appendix follows after all reviews pass `python3 scripts/cad/assemble_cad_finishing_audit.py --verify`.', 'Verified with `python3 scripts/cad/assemble_cad_finishing_audit.py --verify`. The 64 existing source/asset checks also pass; they are not physical-finish certification.')
        lines = ['<!-- GENERATED VERIFIED APPENDIX -->', '',
                 f"Exact review: **{counts['definitions']}/202 definitions; {counts['pixelReviewedOccurrences']}/365 individually reviewed occurrences; {counts['sourceBodies']} bodies; {counts['sourceFaces']:,} faces; {counts['sourceAppearanceGroups']} exact face partitions; {counts['leafScreenshots']:,} indexed leaf screenshots**, plus separately indexed mechanism, parent and fitted-mode evidence.", '',
                 '| Disposition | Definitions | Occurrences |', '|---|---:|---:|']
        for label in ['Match', 'Intentional override', 'Definite mismatch', 'Probable mismatch', 'Unresolved conflict', 'Technical limitation', 'Not renderable/excluded']:
            lines.append(f"| {label} | {counts['definitionDispositions'].get(label, 0)} | {counts['occurrenceDispositions'].get(label, 0)} |")
        lines += ['', '| Confidence | Definitions | Occurrences |', '|---|---:|---:|']
        for level in ['high', 'medium', 'low']:
            lines.append(f"| {level} | {counts['definitionConfidence'].get(level, 0)} | {counts['occurrenceConfidence'].get(level, 0)} |")
        lines += ['', 'Confidence is confidence in the recorded evidence comparison. Medium does not certify composition; the substantive reason and visible limits are retained in each row. A technical limitation can coexist with a correct material family. Inactive alternatives were deliberately selected and reviewed, so none was omitted as unrenderable. d225 was reviewed through its explicit separate recovery.', '',
                  f"Preservation check: {len(baseline['files'])} baseline production/provenance/user files retain their SHA-256 hashes. The current source, model binaries, original attributes and runtime sidecars are unchanged. All 29 exact overrides, 58 annotated definitions, 11 roles, 13 synthetic fallback branches and four differing repeated definitions reconcile. All 18 correction locks and 365 prior-ledger reconciliation records are present.", '',
                  '### Every definition', '',
                  'Full IDs use prefix `d_0_1_1_`; each row below points to the equally numbered definition in the JSON. All occurrence IDs, matrices, current profiles, exact face groups and individual observations are in that record and its occurrence rows.', '',
                  '| Definition | Occurrences reviewed | Disposition | Source/reference assessment |', '|---|---:|---|---|']
        for d in definitions:
            note = d['sourceReferenceReview'].replace('|', '\\|').replace('\n', ' ')
            lines.append(f"| {d['id']} — {d['name'].replace('|', '/')} | {len(d['visualReviewedOccurrenceIds'])}/{d['occurrenceCount']} | {d['disposition']} | {note} |")
        parents = collections.defaultdict(list)
        for o in occurrences:
            parents[o['parentId']].append(o)
        lines += ['', '### Coverage by actual source parent', '',
                  '| Actual parent name and ID | Leaf rows | Reviewed |', '|---|---:|---:|']
        for parent, rows in parents.items():
            lines.append(f"| {nodes[parent]['name'].replace('|', '/')} — {parent} | {len(rows)} | {sum(o['reviewComplete'] for o in rows)} |")
        report.write_text(text.rstrip() + '\n\n' + '\n'.join(lines) + '\n')

if __name__ == '__main__':
    main()
