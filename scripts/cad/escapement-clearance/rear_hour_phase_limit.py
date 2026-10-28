"""Offline rear-hour phase ceiling. Never changes source or application poses.

Two fixed pinion orientations upper-bound the minimum running clearance.
Cover every follower phase using rigid-motion bounds, not just a phase grid.
The bound concerns retained section polygons, not analytic/manufactured teeth.
"""
from reverse_mesh_diagnosis import *
from scipy.optimize import minimize_scalar, brentq
import time

DEST = ROOT / 'artifacts/rear-hour-phase-limit'
DEST.mkdir(exist_ok=True)


def output(name, value):
    (DEST / name).write_text(json.dumps(value, indent=2, allow_nan=False) + '\n')


def load():
    prior = json.loads((ROOT / 'assets/source-manifest/reverse-mesh-diagnosis.json').read_text())
    for path, sha in prior['localEvidenceSha256'].items():
        assert digest(ROOT / path) == sha, path
    assert digest(ROOT / prior['source']['path']) == SOURCE_SHA
    motion = json.loads((ROOT / 'assets/source-manifest/motion-works-study.json').read_text())
    assert digest(OUTPUT / 'source.json') == motion['localEvidenceSha256']['source.json']
    source = json.loads((OUTPUT / 'source.json').read_text())
    pivots = [np.array(source['leaves'][str(n)]['worldTransform'])[:2, 3] for n in (217, 187)]
    delta = pivots[1] - pivots[0]
    d = float(np.linalg.norm(delta))
    fine = json.loads((OUT / 'fine-sections.json').read_text())
    original = [shapely.from_wkt(fine['polygons'][str(n)]) for n in (217, 187)]
    polygons = [frame(p, pivots[0], np.arctan2(delta[1], delta[0])) for p in original]
    radii = [float(np.linalg.norm(shapely.get_coordinates(p) - c, axis=1).max())
             for p, c in zip(polygons, ((0, 0), (d, 0)))]
    window = (d-radii[1]-.05, -radii[0]-.05, radii[0]+.05, radii[0]+.05)
    return source, pivots, d, polygons, radii, window


def phase_cover():
    start = time.monotonic()
    _, _, d, (a, b), radii, window = load()
    # Full polygons (including holes) are retained. Clipping is only a query
    # accelerator: subset distance is an upper bound on whole-set distance.
    def pair(angle, phase):
        return (shapely.clip_by_rect(rotate(a, angle, origin=(0, 0)), *window),
                shapely.clip_by_rect(rotate(b, -angle/4+phase, origin=(d, 0)), *window))

    def gap(angle, phase):
        p, q = pair(angle, phase)
        return p.distance(q)

    # Locate the two opposing pinches, then equalize their clearances. This
    # refines a candidate only; the independent cover below establishes ceiling.
    def pinch(phase, limits):
        result = minimize_scalar(lambda x: gap(x, phase), bounds=limits,
                                 method='bounded', options={'xatol':1e-10})
        return float(result.x), float(result.fun)

    def difference(phase):
        return pinch(phase, (10.9, 11.5))[1] - pinch(phase, (33.5, 34.0))[1]

    phase = brentq(difference, .2715, .2718, xtol=1e-12)
    critical = [pinch(phase, limits) for limits in [(10.9, 11.5), (33.5, 34.0)]]
    fixed = [shapely.clip_by_rect(rotate(a, angle, origin=(0, 0)), *window) for angle, _ in critical]
    # Check every hour tooth copy explicitly, with vertex AND edge correspondence.
    coords = np.array(b.exterior.coords[:-1]); center = np.array([d, 0])
    symmetry = 0.
    for k in range(1, 32):
        angle = np.deg2rad(k * 11.25)
        rotation = np.array([[np.cos(angle), -np.sin(angle)], [np.sin(angle), np.cos(angle)]])
        turned = (coords-center) @ rotation.T + center
        j = int(np.argmin(np.linalg.norm(coords-turned[0], axis=1)))
        symmetry = max(symmetry, float(np.linalg.norm(np.roll(coords, -j, axis=0)-turned, axis=1).max()))
    assert symmetry < 1e-8
    # Holes cannot reach either pinion witness, so exterior symmetry suffices.
    hole_radius = max(float(np.linalg.norm(np.array(h.coords)-center, axis=1).max()) for h in b.interiors)
    assert hole_radius < d-radii[0]
    guard = 1e-9  # numeric allowance, not a certified floating-point error bound
    target = 4.6e-5  # 46 nm global nominal polygon ceiling
    stack = [(-5.625, 5.625)]
    cells = []; evaluations = 0
    while stack:
        lo, hi = stack.pop(); mid = (lo+hi)/2
        displacement = 2*radii[1]*np.sin(np.deg2rad(hi-lo)/4)
        bounds = []; witnesses = []; collision = False
        for (angle, _), p in zip(critical, fixed):
            q = shapely.clip_by_rect(rotate(b, -angle/4+mid, origin=(d, 0)), *window)
            assert p.is_valid and q.is_valid and not p.is_empty and not q.is_empty
            evaluations += 1
            intersection = p.intersection(q)
            if intersection.area > 0:
                witness = intersection.representative_point()
                # A ball in the clipped follower is also in the full follower.
                # The fixed pinion contains the same point for this entire cell.
                if p.contains(witness) and q.contains(witness):
                    interior_radius = witness.distance(q.boundary)
                    if interior_radius > displacement + symmetry + guard:
                        collision_witness = {'fastDegrees':angle,'midpointPhaseDegrees':mid,
                            'pointXYMm':[witness.x,witness.y], 'interiorRadiusMm':interior_radius,
                            'maximumFollowerDisplacementMm':float(displacement)}
                        collision = True; break
            distance = p.distance(q)
            bounds.append(distance + displacement + symmetry + guard)
            witnesses.append({'fastDegrees':angle,'midpointPhaseDegrees':mid,
                              'midpointGapMm':distance,'maximumFollowerDisplacementMm':float(displacement)})
        if collision:
            cells.append({'lo':lo, 'hi':hi, 'kind':'persistent-intersection', 'upperMm':0.,
                          'witness':collision_witness})
        elif min(bounds) <= target:
            cells.append({'lo':lo, 'hi':hi, 'kind':'distance-upper-bound', 'upperMm':min(bounds),
                          'witness':witnesses[int(np.argmin(bounds))]})
        else:
            assert hi-lo > 1e-10, 'Ceiling not achieved; do not claim a bound'
            stack.extend([(mid, hi), (lo, mid)])
        if evaluations % 1000 < 2:
            print('cover', evaluations, 'queries,', len(cells), 'accepted cells', flush=True)
    cells.sort(key=lambda x:x['lo'])
    assert cells[0]['lo'] == -5.625 and cells[-1]['hi'] == 5.625
    assert all(x['hi'] == y['lo'] for x,y in zip(cells,cells[1:]))
    result = {'sourceSha256':SOURCE_SHA, 'pair':[217,187], 'teeth':[8,32],
              'sectionZMm':-5.48, 'phaseInvariant':'phase187 + phase217/4',
              'candidatePhaseDegrees':phase, 'criticalWitnesses':[
                  {'fastDegrees':x, 'polygonGapMm':g} for x,g in critical],
              'phaseRangeDegrees':[-5.625,5.625], 'pitchDegrees':11.25,
              'allHourPitchCopiesEdgeErrorMm':symmetry, 'hourHoleRadiusMm':hole_radius,
              'pinionMinimumReachMm':d-radii[0], 'radiiMm':radii,
              'numericGuardMm':guard, 'phaseQueryCount':evaluations,
              'globalPolygonRunningGapUpperBoundMm':max(x['upperMm'] for x in cells),
              'cells':cells, 'seconds':time.monotonic()-start,
              'scope':'Upper bound on minimum running POLYGON clearance for every invariant phase. Fixed witness orientations suffice for an upper bound; no continuous analytic-solid clearance or numerical interval-arithmetic claim.'}
    output('phase-cover.json', result)
    print(json.dumps({k:v for k,v in result.items() if k!='cells'}, indent=2), flush=True)


def source_solids(source):
    cache = ROOT / 'artifacts/escapement-interfaces-20261026'
    meta = json.loads((cache / 'source-cache.json').read_text())
    assert meta['sourceSha256'] == SOURCE_SHA and meta['ocpVersion'] == OCP.__version__
    shapes = []
    for n in (217, 187):
        name = f'd_0_1_1_{n}.brep'
        assert digest(cache / 'brep' / name) == meta['files'][name]
        shape = TopoDS_Shape()
        assert BRepTools.Read_s(shape, str(cache / 'brep' / name), BRep_Builder())
        shape = moved(shape, np.array(source['leaves'][str(n)]['worldTransform']))
        assert BRepCheck_Analyzer(shape).IsValid()
        shapes.append(shape)
    return shapes


def precision():
    from OCP.BRepAdaptor import BRepAdaptor_Surface
    source, pivots, d, _, _, _ = load()
    cover = json.loads((DEST / 'phase-cover.json').read_text())
    shapes = source_solids(source)
    phase = cover['candidatePhaseDegrees']
    angles = [w['fastDegrees'] for w in cover['criticalWitnesses']]
    result = {'sourceSha256':SOURCE_SHA, 'ocpVersion':OCP.__version__,
              'candidatePhaseDegrees':phase, 'sections':[], 'wholeSolids':[],
              'scope':'Convergence/sensitivity at selected witnesses only; no continuous solid certificate. Deflection and section sampling parameters are not manufacturing tolerances.'}
    for tolerance in [2e-7, 2e-8, 2e-9]:
        polygons = [section(shape, -5.48, tol=tolerance) for shape in shapes]
        row = {'sectionSamplingParameterMm':tolerance, 'coordinateRoundingMm':1e-9,
               'vertices':[len(p.exterior.coords) for p in polygons], 'witnesses':[]}
        for angle in angles:
            p, q = [rotate(poly, turn, origin=tuple(pivot)) for poly, turn, pivot in
                    zip(polygons, (angle, -angle/4+phase), pivots)]
            # Small world-space box enclosing the near-contact region accelerates
            # the exact polygon query; assert nearest points are off its edges.
            delta = pivots[1]-pivots[0]; theta = np.arctan2(delta[1],delta[0])
            p, q = [frame(poly, pivots[0], theta) for poly in (p,q)]
            window = (d-2.08-.05, -.67, .67, .67)
            p, q = [shapely.clip_by_rect(poly,*window) for poly in (p,q)]
            from shapely.ops import nearest_points
            points = nearest_points(p,q)
            assert all(shapely.geometry.box(*window).boundary.distance(pt) > .01 for pt in points)
            row['witnesses'].append({'fastDegrees':angle,'gapMm':p.distance(q),'overlapAreaMm2':p.intersection(q).area})
        result['sections'].append(row); output('precision.json',result)
        print('section precision', row, flush=True)
    def support(shape):
        kind = shape.ShapeType()
        answer = {'topology':str(kind)}
        if kind == TopAbs_EDGE:
            answer['geometry'] = str(BRepAdaptor_Curve(TopoDS.Edge_s(shape)).GetType())
        elif kind == TopAbs_FACE:
            answer['geometry'] = str(BRepAdaptor_Surface(TopoDS.Face_s(shape)).GetType())
        return answer
    for label, offset in [('refined',phase),('previous',.27165787111074224),
                          ('minus-0.001-degree',phase-.001),('plus-0.001-degree',phase+.001)]:
        for angle in angles:
            p, q = [moved(shape,matrix(np.r_[pivot,0],turn)) for shape,pivot,turn in
                    zip(shapes,pivots,(angle,-angle/4+offset))]
            common_shape = boolean(p,q,BRepAlgoAPI_Common).Shape()
            assert BRepCheck_Analyzer(common_shape).IsValid()
            row = {'label':label,'phaseDegrees':offset,'fastDegrees':angle,
                   'commonMm3':sum(vol(s) for s in items(common_shape,TopAbs_SOLID)), 'distances':[]}
            for deflection in [1e-7,1e-9,1e-11]:
                query = BRepExtrema_DistShapeShape(p,q,deflection)
                assert query.IsDone()
                row['distances'].append({'deflectionMm':deflection,'gapMm':query.Value(),
                    'solutions':query.NbSolution(), 'support1':support(query.SupportOnShape1(1)),
                    'support2':support(query.SupportOnShape2(1)),
                    'point1':xyz(query.PointOnShape1(1)).tolist(), 'point2':xyz(query.PointOnShape2(1)).tolist()})
            result['wholeSolids'].append(row); output('precision.json',result)
            print('whole solid',label,angle,'gap',row['distances'][-1]['gapMm'],'common',row['commonMm3'],flush=True)


def analytic():
    from OCP.BRepAdaptor import BRepAdaptor_Surface
    from OCP.GeomAbs import GeomAbs_Cylinder, GeomAbs_Circle
    source, pivots, _, _, _, _ = load()
    shapes = source_solids(source)
    cover = json.loads((DEST / 'phase-cover.json').read_text())
    phase = cover['candidatePhaseDegrees']; rows = []
    for witness in cover['criticalWitnesses']:
        angle = witness['fastDegrees']
        p,q = [moved(shape,matrix(np.r_[pivot,0],turn)) for shape,pivot,turn in
               zip(shapes,pivots,(angle,-angle/4+phase))]
        query = BRepExtrema_DistShapeShape(p,q,1e-11)
        assert query.IsDone()
        surface = BRepAdaptor_Surface(TopoDS.Face_s(query.SupportOnShape1(1)))
        curve = BRepAdaptor_Curve(TopoDS.Edge_s(query.SupportOnShape2(1)))
        assert surface.GetType() == GeomAbs_Cylinder and curve.GetType() == GeomAbs_Circle
        cylinder, circle = surface.Cylinder(), curve.Circle()
        axis1, axis2 = [xyz(x.Axis().Direction()) for x in (cylinder,circle)]
        assert np.linalg.norm(axis1[:2]) < 1e-12 and np.linalg.norm(axis2[:2]) < 1e-12
        c1,c2 = [xyz(x.Location()) for x in (cylinder,circle)]
        r1,r2 = cylinder.Radius(),circle.Radius()
        separation = float(np.linalg.norm(c1[:2]-c2[:2]))
        # Infinite cylinder / complete coplanar circle distance is a lower bound
        # for their trimmed supports. Compare with actual supported witnesses.
        support_gap = max(0.,separation-r1-r2,abs(r1-r2)-separation)
        rows.append({'fastDegrees':angle,'gapMm':query.Value(),
                     'pinionCylinder':{'center':c1.tolist(),'axis':axis1.tolist(),'radiusMm':r1},
                     'hourCircle':{'center':c2.tolist(),'axis':axis2.tolist(),'radiusMm':r2},
                     'supportCenterDistanceMm':separation,'untrimmedSupportGapMm':support_gap,
                     'distanceAgreementMm':abs(support_gap-query.Value())})
        assert abs(support_gap-query.Value()) < 1e-10
    output('analytic-witnesses.json',{'sourceSha256':SOURCE_SHA,'candidatePhaseDegrees':phase,
           'scope':'Independent analytic support distance at two selected witnesses; trimmed-domain applicability corroborated by original-solid distance, not a continuous running certificate.', 'witnesses':rows})
    print(json.dumps(rows,indent=2),flush=True)


if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('stage', choices=['cover','precision','analytic'])
    args = parser.parse_args()
    {'cover':phase_cover,'precision':precision,'analytic':analytic}[args.stage]()
