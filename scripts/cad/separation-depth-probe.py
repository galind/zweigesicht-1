#!/usr/bin/env python3
"""Measure original axial body depths; run with .venv-cad/bin/python after explode_probe.py."""
import sys, json, hashlib
from pathlib import Path
import numpy as np
ROOT = Path(__file__).resolve().parents[2]
sys.path.insert(0, str(ROOT / 'scripts/preflight'))
from cad_probe import load_xcaf
from OCP.BRepAdaptor import BRepAdaptor_Surface
from OCP.BRepGProp import BRepGProp
from OCP.GProp import GProp_GProps
from OCP.GeomAbs import GeomAbs_Plane
from OCP.TDF import TDF_Label, TDF_Tool
from OCP.TopAbs import TopAbs_FACE
from OCP.TopExp import TopExp_Explorer
from OCP.TopoDS import TopoDS
from OCP.XCAFDoc import XCAFDoc_ShapeTool
m = json.load(open(ROOT / 'assets/generated/assembly-manifest.json'))
mount = json.load(open(ROOT / 'artifacts/explode-cad/source-mounts.json'))['occurrences']
screws = json.load(open(ROOT / 'artifacts/explode-cad/screw-directions.json'))['screws']
doc, _ = load_xcaf(ROOT / 'assets/source-originals/ml01-zweigesicht.stp')
cache = {}
out = {}
for p in m['instances']:
    if p['id'] not in mount:
        continue
    did = p['definitionId']
    mat = np.array(p['worldTransform'])
    if did not in cache:
        label = TDF_Label()
        TDF_Tool.Label_s(doc.GetData(), did.removeprefix('d_').replace('_', ':'), label, False)
        shape = XCAFDoc_ShapeTool.GetShape_s(label)
        ex = TopExp_Explorer(shape, TopAbs_FACE)
        faces = []
        idx = 0
        while ex.More():
            idx += 1
            face = TopoDS.Face_s(ex.Current())
            ex.Next()
            a = BRepAdaptor_Surface(face)
            if a.GetType() != GeomAbs_Plane:
                continue
            props = GProp_GProps()
            BRepGProp.SurfaceProperties_s(face, props)
            c = props.CentreOfMass()
            d = a.Plane().Axis().Direction()
            faces.append({'face': idx, 'areaMm2': props.Mass(), 'center': [c.X(), c.Y(), c.Z()], 'normal': [d.X(), d.Y(), d.Z()]})
        cache[did] = faces
    planes = []
    for f in cache[did]:
        n = mat[:3, :3] @ f['normal']
        c = mat @ [*f['center'], 1]
        if abs(n[2]) > 0.99:
            planes.append({'face': f['face'], 'areaMm2': f['areaMm2'], 'zMm': float(c[2])})
    bins = {}
    for f in planes:
        key = round(f['zMm'], 5)
        b = bins.setdefault(key, {'faces': [], 'areaMm2': 0, 'zMm': f['zMm']})
        b['faces'].append(f['face'])
        b['areaMm2'] += f['areaMm2']
    planes = list(bins.values())
    planes.sort(key=lambda f: f['areaMm2'], reverse=True)
    bounds = [b[2] for b in p['boundsWorldMm']] if p['boundsWorldMm'] else [float(mat[2, 3]), float(mat[2, 3])]
    method = 'bounds-midpoint fallback'
    evidence = []
    confidence = 'low'
    anchor = sum(bounds) / 2
    if planes:
        major = [f for f in planes if f['areaMm2'] >= planes[0]['areaMm2'] * 0.45]
        anchor = sum((f['zMm'] * f['areaMm2'] for f in major)) / sum((f['areaMm2'] for f in major))
        method = 'area-weighted major coplanar axial surface groups (>=45% largest exact BRep coplanar group area)'
        evidence = major
        confidence = 'medium'
    if p['id'] in screws:
        s = screws[p['id']]
        head = s['headFace']
        anchor = sum((v[2] for v in head['axisEndpointsWorldMm'])) / 2
        method = 'reviewed screw head cylinder axial midpoint'
        evidence = [head]
        confidence = 'high'
    out[p['id']] = {'boundsWorldMm': p['boundsWorldMm'], 'name': p['name'], 'definitionId': did, 'anchorZMm': anchor, 'boundsZMm': bounds, 'method': method, 'confidence': confidence, 'evidence': evidence, 'largestAxialPlanes': planes[:6]}
import struct
raw = (ROOT / 'explorer/public/models/diamond-c74ee2731a1f.stl').read_bytes()
sha = hashlib.sha256(raw).hexdigest()
assert sha == 'c74ee2731a1f6d6d5dfdcbab42bb90b4d9e0ed6d578d5f8f916f8c9ebccc8c2a'
did = 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_59__0_1_1_221_3__0_1_1_223_2'
p = next((p for p in m['instances'] if p['id'] == did))
mat = np.array(p['worldTransform'])
verts = []
planes = []
for i in range(struct.unpack_from('<I', raw, 80)[0]):
    t = struct.unpack_from('<12fH', raw, 84 + i * 50)
    v = np.array(t[3:12]).reshape(3, 3)
    v = np.array([(mat @ [*x, 1])[:3] for x in v])
    verts.extend(v.tolist())
    n = np.cross(v[1] - v[0], v[2] - v[0])
    area = np.linalg.norm(n) / 2
    if area and abs(n[2]) / (2 * area) > 0.99:
        planes.append({'triangle': i, 'areaMm2': area, 'zMm': float(np.mean(v[:, 2]))})
a = np.array(verts)
r = out[did]
r['boundsWorldMm'] = [a.min(axis=0).tolist(), a.max(axis=0).tolist()]
r['boundsZMm'] = [float(a[:, 2].min()), float(a[:, 2].max())]
r['anchorZMm'] = sum(r['boundsZMm']) / 2
r['method'] = 'accepted maker STL world-bounds midpoint (empty STEP definition)'
r['confidence'] = 'medium'
r['sourceRecoverySha256'] = sha
r['evidence'] = [{'stl': 'explorer/public/models/diamond-c74ee2731a1f.stl', 'triangles': len(verts) // 3, 'worldTransform': 'unchanged original occurrence matrix'}]
output = ROOT / 'artifacts/explode-depth-audit/anchors.json'
output.parent.mkdir(parents=True, exist_ok=True)
output.write_text(json.dumps({'sourceSha256': m['source']['sha256'], 'units': 'mm', 'coordinateSystem': 'unchanged STEP world Z', 'count': len(out), 'method': 'Exact original STEP BRep planar face areas; major-plane area-weighted centroid. Explicit reviewed screw-head override. Anchors are presentation ordering hints, not disassembly certification.', 'occurrences': out}, indent=2) + '\n')
print(output, len(out))
for id, r in out.items():
    if abs(r['anchorZMm'] - sum(r['boundsZMm']) / 2) > 0.5 or r['confidence'] == 'low':
        print(id.split('83_')[-1], r['name'], round(r['anchorZMm'], 3), tuple((round(z, 3) for z in r['boundsZMm'])), r['method'])
