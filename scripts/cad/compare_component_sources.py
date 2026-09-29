#!/usr/bin/env python3
"""Compare independent maker STEP with assembly definitions in source millimetres.

No registration, scaling, replacement or topology repair is implicit. Exact mesh
and analytic-face agreement permits equivalence; other findings require review.
Evidence stays local. The ledger includes every physical occurrence and variant.
"""
import argparse
from collections import Counter
import hashlib
import json
from pathlib import Path
import re
import sys
import unicodedata
import numpy as np
import trimesh
from scipy.spatial import cKDTree
from OCP.BRepBuilderAPI import BRepBuilderAPI_MakeVertex
from OCP.BRepExtrema import BRepExtrema_DistShapeShape
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepCheck import BRepCheck_Analyzer
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.TDF import TDF_Label, TDF_LabelSequence, TDF_Tool
from OCP.TopAbs import TopAbs_FACE
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_ShapeTool
from OCP.gp import gp_Pnt

ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/preflight'))
from cad_probe import load_xcaf, label_name, matrix
from export_assembly import bbox, tessellate
OUT = ROOT / 'artifacts/cad/component-fidelity'


def norm(s):
    s = unicodedata.normalize('NFKD', s.casefold()).replace('ß', 'ss')
    return re.sub('[^a-z0-9]', '', s)


def sha(path):
    return hashlib.sha256(path.read_bytes()).hexdigest()


def metrics(shape):
    props = GProp_GProps()
    BRepGProp.VolumeProperties_s(shape, props)
    volume = props.Mass()
    BRepGProp.SurfaceProperties_s(shape, props)
    area = props.Mass()
    faces = []
    e = TopExp_Explorer(shape, TopAbs_FACE)
    while e.More():
        face = TopoDS.Face_s(e.Current())
        a = BRepAdaptor_Surface(face)
        BRepGProp.SurfaceProperties_s(face, props)
        bound = bbox(face)
        faces.append(dict(type=str(a.GetType()).split('.')[-1], areaMm2=props.Mass(), centroidMm=list(props.CentreOfMass().Coord()), boundsMm=bound.tolist() if bound is not None else None))
        e.Next()
    bounds = bbox(shape)
    mesh, nfaces, missing, cylinders = tessellate(shape, .015, .25)
    return dict(valid=bool(BRepCheck_Analyzer(shape).IsValid()), volumeMm3=volume, areaMm2=area, boundsMm=bounds.tolist() if bounds is not None else None, faces=faces, surfaceTypes=dict(Counter(f['type'] for f in faces)), cadFaces=nfaces, missingFaces=missing, triangles=len(mesh.faces), vertices=len(mesh.vertices), cylinders=cylinders), mesh


def save_mesh(name, mesh):
    np.savez_compressed(OUT / (name + '.npz'), vertices=mesh.vertices, faces=mesh.faces)


def stl_evidence(files, f, shape):
    """Test every STL vertex and triangle centroid against the independent BRep.

    Vertex agreement alone does not prove triangles follow the curved surface;
    centroid error records the tessellation sag. No alignment or scale fitting.
    """
    stl = next((x for x in files if x.get('pageUrl') == f.get('pageUrl') and x['path'].lower().endswith('.stl')), None)
    if not stl:
        return None
    path = ROOT / stl['path']
    if sha(path) != stl['sha256']: raise RuntimeError('STL hash mismatch')
    mesh = trimesh.load(path, force='mesh', process=False)
    def distance(points):
        maximum = 0.
        for p in points:
            query = BRepExtrema_DistShapeShape(BRepBuilderAPI_MakeVertex(gp_Pnt(*p)).Vertex(), shape)
            if not query.IsDone(): raise RuntimeError('STL surface distance failed')
            maximum = max(maximum, query.Value())
        return maximum
    return dict(source=stl, triangles=len(mesh.faces), boundsMm=mesh.bounds.tolist(), maxVertexToStepMm=distance(np.unique(mesh.vertices,axis=0)), maxTriangleCentroidToStepMm=distance(mesh.triangles_center), alignmentTransform=np.eye(4).tolist())


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument('--only', nargs='*', help='Optional definition numbers for investigation; full ledger still emitted')
    args = ap.parse_args()
    OUT.mkdir(parents=True, exist_ok=True)
    manifest = json.loads((ROOT / 'assets/generated/assembly-manifest.json').read_text())
    source_path = ROOT / 'assets/source-originals/ml01-zweigesicht.stp'
    if sha(source_path) != manifest['source']['sha256']:
        raise RuntimeError('Assembly hash differs from prepared manifest')
    if not re.search(r'SI_UNIT\(\s*\.MILLI\.\s*,\s*\.METRE\.\s*\)', source_path.read_text(errors='replace')):
        raise RuntimeError('Assembly does not declare expected millimetre length units')
    doc, tool = load_xcaf(source_path)
    provenance = json.loads((ROOT / 'assets/source-manifest/component-fidelity-sources.json').read_text()) if (ROOT / 'assets/source-manifest/component-fidelity-sources.json').exists() else {'files': []}
    files = provenance['files'][:]
    for f in json.loads((ROOT / 'assets/source-manifest/sources.json').read_text())['files']:
        if 'component' in f['role']:
            files.append(dict(path=f['path'], filename=Path(f['path']).name, sha256=f['sha256'], pageUrl=f['page_url'], downloadUrl=f['download_url']))
    entries = {}
    for f in files:
        if f['path'].lower().endswith(('.stp', '.step')):
            entries.setdefault(norm(Path(f['filename']).stem), f)
    # Candidate names resolve documented STEP text encoding loss only. They do
    # not imply compatibility: the same geometric comparison still applies.
    aliases = {'23':'ml01 ZB Übergangsring', '26':'ml01 ZB Außenring V2',
               '67':'Saphirglas Ø35x1,5x1', '77':'Korrektor Fuß',
               '96':'ml01 ÜFHMinRad z26 m0,15', '165':'ml01 si Klobenfuß',
               '177':'ml01 Stoppfedersäule'}
    ledger = dict(schemaVersion=1, assemblySha256=sha(source_path), units='mm', comparison='Unscaled source frame; identity alignment unless explicitly recorded. Face metrics and bidirectional tessellated vertex distances; equivalence requires exact triangulation plus analytic face metrics.', definitions=[])
    existing = ROOT / 'docs/cad-component-ledger.json'
    previous = {r['definitionId']: r for r in json.loads(existing.read_text())['definitions']} if existing.exists() else {}
    defs = [d for d in manifest['definitions'] if not d['isAssembly']]
    defs.sort(key=lambda d: (not d['name'].startswith('010-'), d['sourceLabel']))
    for d in defs:
        occurrences = [dict(id=i['id'], sourcePath=i['sourceInstanceId'], worldTransform=i['worldTransform']) for i in manifest['instances'] if i['definitionId'] == d['id'] and not i['isAssembly']]
        row = dict(definitionId=d['id'], name=d['name'], occurrences=occurrences, assemblySha256=ledger['assemblySha256'], source=None, classification='missing source', confidence='low', findings=['No independently matched maker source yet'], disposition='unchanged; no substitution authorized by evidence', evidence=[], existingExceptions=[e for e in manifest['exceptions'] if e['definitionId']==d['id']])
        if args.only and d['sourceLabel'].split(':')[-1] not in args.only:
            ledger['definitions'].append(previous.get(d['id'], row)); continue
        f = entries.get(norm(aliases.get(d['sourceLabel'].split(':')[-1], d['name'])))
        if d['sourceLabel'].split(':')[-1] in aliases:
            row['sourceNameCandidateReason'] = 'Explicit alias for corrupted assembly STEP name; verified by geometry below'
        label = TDF_Label(); TDF_Tool.Label_s(doc.GetData(), d['sourceLabel'], label, False)
        try:
            a, amesh = metrics(tool.GetShape_s(label))
            row['assemblyMetrics'] = {k:v for k,v in a.items() if k not in ('faces', 'cylinders')}
            evidence = dict(assembly=a)
            save_mesh(d['id'] + '-assembly', amesh)
            row['generatedMesh'] = {k:d.get(k) for k in ['triangles', 'vertices', 'cadFaces', 'missingTriangulatedFaces', 'boundsLocalMm']}
            cache = ROOT / f"artifacts/cad/definition-cache/{ledger['assemblySha256'][:12]}-0.015-0.25/{d['id']}.npz"
            if cache.exists():
                with np.load(cache, allow_pickle=False) as stored:
                    same = np.array_equal(stored['faces'], amesh.faces) and np.allclose(stored['vertices'], amesh.vertices, rtol=0, atol=1e-9)
                row['generatedMesh']['matchesFreshSourceTessellation'] = bool(same)
            if f:
                path = ROOT / f['path']
                if sha(path) != f['sha256']: raise RuntimeError('Individual hash mismatch')
                if not re.search(r'SI_UNIT\(\s*\.MILLI\.\s*,\s*\.METRE\.\s*\)', path.read_text(errors='replace')):
                    raise RuntimeError('Individual source length units need review')
                sd, st = load_xcaf(path); roots = TDF_LabelSequence(); st.GetFreeShapes(roots)
                if roots.Length() != 1: raise RuntimeError('Multiple free shapes require explicit source match')
                sl = roots.Value(1)
                if st.IsAssembly_s(sl): raise RuntimeError('Individual package contains an assembly; explicit leaf mapping required')
                individual_shape = st.GetShape_s(sl)
                b, bmesh = metrics(individual_shape)
                save_mesh(d['id'] + '-individual', bmesh)
                row['source'] = dict(f, sourceName=label_name(sl), sourceTransform=matrix(st.GetLocation_s(sl)))
                row['individualMetrics'] = {k:v for k,v in b.items() if k not in ('faces', 'cylinders')}
                evidence['individual'] = b
                equalmesh = amesh.vertices.shape == bmesh.vertices.shape and amesh.faces.shape == bmesh.faces.shape and np.allclose(amesh.vertices,bmesh.vertices,rtol=0,atol=1e-9) and np.array_equal(amesh.faces,bmesh.faces)
                distances = None
                if len(amesh.vertices) and len(bmesh.vertices):
                    distances = max(float(cKDTree(amesh.vertices).query(bmesh.vertices)[0].max()), float(cKDTree(bmesh.vertices).query(amesh.vertices)[0].max()))
                equalfaces = json.dumps(a['faces']) == json.dumps(b['faces'])
                row['comparison'] = dict(alignmentTransform=np.eye(4).tolist(), identicalMeshAt1eMinus9Mm=bool(equalmesh), identicalAnalyticFaceMetrics=equalfaces, maxBidirectionalVertexDistanceMm=distances, volumeDeltaMm3=b['volumeMm3']-a['volumeMm3'], areaDeltaMm2=b['areaMm2']-a['areaMm2'])
                if equalmesh and equalfaces and len(amesh.faces):
                    row.update(classification='equivalent', confidence='high', findings=['Independent maker STEP and assembly have identical analytic face metrics and tessellation in the same millimetre coordinate frame'], disposition='unchanged; no additional source detail')
                else:
                    row.update(classification='unresolved', confidence='low', findings=['Independent source differs; alignment, variant and interface review required'], disposition='unchanged pending compatibility review')
                if d['name'].startswith('010-'):
                    analytic = set(a['surfaceTypes']) <= {'GeomAbs_Plane','GeomAbs_Cylinder','GeomAbs_Cone','GeomAbs_Sphere','GeomAbs_Torus'}
                    tokens = re.findall(r'\b(?:ANNOTATION_[A-Z_]+|DRAUGHTING_[A-Z_]+|[^\s\x27;]*(?:thread|gewinde)[^\s\x27;]*)', path.read_text(errors='replace'), re.I)
                    row['threadFinding'] = dict(assembly='smooth analytic geometry; no modeled helix' if analytic else 'requires surface review', individual='same smooth analytic geometry; no modeled helix' if analytic and equalmesh and equalfaces else 'requires surface review', cosmeticMetadataTokens=sorted(set(tokens)), specification='No thread specification inferred from the name or appearance')
                    row['independentStl'] = stl_evidence(files, f, individual_shape)
            evidence_path = OUT / (d['id'] + '.json')
            evidence_path.write_text(json.dumps(evidence,indent=2)+'\n')
            row['evidence'] = [str(evidence_path.relative_to(ROOT))]
        except Exception as error:
            row.update(classification='unresolved', findings=[str(error)])
        ledger['definitions'].append(row)
        existing.write_text(json.dumps(ledger, indent=2)+'\n')
        print(d['id'], row['classification'], d['name'], flush=True)
    ledger['coverage'] = dict(uniquePhysicalDefinitions=len(defs), leafOccurrences=sum(len(r['occurrences']) for r in ledger['definitions']), classifications=dict(Counter(r['classification'] for r in ledger['definitions'])))
    existing.write_text(json.dumps(ledger,indent=2)+'\n')
    print(json.dumps(ledger['coverage']))


if __name__ == '__main__':
    main()
