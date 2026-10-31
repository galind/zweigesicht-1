"""Read-only two-barrel source audit; no motion law or replacement CAD is invented.

Uses the hash-checked source/cache and existing authored phases. Outputs remain
private under artifacts/power-source. Run with the retained .venv-cad Python.
"""
from interfaces import *
from friction_connections import surfaces, metadata, load_step
from OCP.GeomAbs import GeomAbs_Plane
from OCP.BRepAdaptor import BRepAdaptor_Surface

DEST = ROOT / 'artifacts/power-source'
PREFIX = 'p_0_1_1_1__0_1_1_1_4__0_1_1_83_'
MEMBERS = {
    'drumII': '1__0_1_1_84_1', 'lidII': '1__0_1_1_84_2',
    'arborII': '1__0_1_1_84_3', 'springII': '1__0_1_1_84_4',
    'drumI': '2__0_1_1_89_1', 'lidI': '2__0_1_1_89_2',
    'arborI': '2__0_1_1_89_3', 'springI': '2__0_1_1_89_4',
    'ratchetI': '14', 'ratchetII': '15', 'screwII': '49', 'screwI': '50',
    'crownWheel': '74', 'click': '80', 'clickSpring': '76',
    'couplingWheel': '5', 'stem': '27', 'clutch': '28', 'transfer': '4',
}

def run():
    DEST.mkdir(exist_ok=True)
    rows = {r['id']: r for r in assembly()}
    parts = {name: rows[PREFIX + suffix] for name, suffix in MEMBERS.items()}
    original = {r['id']: r for r in json.loads((ROOT/'explorer/public/models/assembly-manifest.json').read_text())['instances']}
    report = {'sourceSha256': SOURCE_SHA, 'ocpVersion': OCP.__version__,
              'phaseSha256': digest(ROOT/'assets/authored/wheel-display-poses.json'),
              'scope': 'Current source solids and authored poses; no new moving/deforming interface',
              'members': {}, 'interfaces': [], 'springs': {}}
    for name, r in parts.items():
        report['members'][name] = {
            'id': r['id'], 'definition': r['n'], 'name': r['name'],
            'sourceOccurrencePath': original[r['id']].get('sourceInstanceId'),
            'sourceMatrix': original[r['id']]['worldTransform'],
            'displayMatrix': r['matrix'].tolist(), 'boundsMm': r['bounds'].tolist(),
            'valid': r['valid'], 'solidCount': len(items(r['shape'], TopAbs_SOLID)),
            'volumeMm3': vol(r['shape']),
        }
    pairs = [('drumI','crownWheel'), ('crownWheel','click'), ('click','clickSpring'),
             ('drumI','drumII'), ('ratchetI','ratchetII'), ('drumII','transfer')]
    for suffix in ['I', 'II']:
        pairs += [(a+suffix,b+suffix) for a,b in [
            ('spring','arbor'), ('spring','drum'), ('spring','lid'),
            ('arbor','ratchet'), ('arbor','drum'), ('arbor','lid'),
            ('arbor','screw'), ('ratchet','screw'), ('drum','lid')]]
    for a,b in pairs:
        sa,sb = parts[a]['shape'],parts[b]['shape']
        sh = boolean(sa,sb,BRepAlgoAPI_Common).Shape()
        row = {'pair':[a,b], 'gapMm':dist(sa,sb),
               'commonMm3':sum(vol(s) for s in items(sh,TopAbs_SOLID)),
               'commonValid':BRepCheck_Analyzer(sh).IsValid()}
        report['interfaces'].append(row)
        print(row, flush=True)
    # Record every planar face; do not infer endpoints from a nominal thickness
    # in the filename. This source is a simplified strip with additional end detail.
    for suffix in ['I', 'II']:
        r = parts['spring'+suffix]; planes=[]
        for i,face in enumerate(items(r['shape'],TopAbs_FACE,TopoDS.Face_s),1):
            surface = BRepAdaptor_Surface(face, True)
            if surface.GetType() != GeomAbs_Plane: continue
            prop=GProp_GProps(); BRepGProp.SurfaceProperties_s(face,prop)
            entry={'face':i,'areaMm2':prop.Mass(),'centerMm':xyz(prop.CentreOfMass()).tolist(),
                   'normal':xyz(surface.Plane().Axis().Direction()).tolist(),
                   'boundsMm':bounds(face).tolist()}
            # Vertical faces include strip ends and the outer terminal detail.
            if abs(entry['normal'][2]) < 1e-8:
                entry['distancesMm']={key:dist(face,parts[key+suffix]['shape']) for key in ['arbor','drum','lid']}
            planes.append(entry)
        z=float(np.mean(r['bounds'][:,2]))
        poly=section(r['shape'],z,tol=.00002)
        (DEST/('spring'+suffix+'.wkt')).write_text(poly.wkt)
        outlines={key:section(parts[key+suffix]['shape'],z,tol=.00002).wkt for key in ['drum','arbor']}
        from shapely.geometry import Point
        section_gaps=[]
        for face in planes:
            if 'distancesMm' not in face: continue
            point=Point(face['centerMm'][:2])
            section_gaps.append({'face':face['face'], 'faceCenterToSectionMm':{
                key:point.distance(shapely.from_wkt(wkt)) for key,wkt in outlines.items()}})
        report['springs'][suffix]={'sectionZMm':z,'sectionAreaMm2':poly.area,
            'sectionPerimeterMm':poly.length,'sectionInteriorRings':len(poly.interiors),
            'sectionNeighborGapsMm':{key:poly.distance(shapely.from_wkt(wkt)) for key,wkt in outlines.items()},
            'sectionValid':poly.is_valid,'sectionGeometry':poly.geom_type,'planarFaces':planes,
            'sectionFaceCenters':section_gaps,
            'outlines':outlines,'localSurfaces':surfaces(r['definition'])}
    incoming=DEST/'spring.stp'
    if incoming.exists():
        sh=load_step(incoming);src=parts['springI']['definition']
        differences=[]
        for a,b in [(src,sh),(sh,src)]:
            cut=boolean(a,b,BRepAlgoAPI_Cut).Shape()
            assert BRepCheck_Analyzer(cut).IsValid()
            differences.append(sum(vol(s) for s in items(cut,TopAbs_SOLID)))
        report['standaloneSpring']={'sha256':digest(incoming),
            'valid':BRepCheck_Analyzer(sh).IsValid(),'solidCount':len(items(sh,TopAbs_SOLID)),
            'sourceVolumeMm3':vol(src),'downloadVolumeMm3':vol(sh),
            'sourceMinusDownloadMm3':differences[0],'downloadMinusSourceMm3':differences[1],
            'metadata':metadata(incoming)}
    report['stepMetadata']=metadata(ROOT/'assets/source-originals/ml01-zweigesicht.stp')
    (DEST/'source.json').write_text(json.dumps(report,indent=2,allow_nan=False)+'\n')
    import matplotlib
    matplotlib.use('Agg')
    import matplotlib.pyplot as plt
    fig,axs=plt.subplots(1,2,figsize=(11,5))
    for ax,suffix in zip(axs,['I','II']):
        info=report['springs'][suffix]
        for key,wkt,color in [(k,w,'grey' if k=='drum' else 'darkred') for k,w in info['outlines'].items()]+[
                ('spring',(DEST/('spring'+suffix+'.wkt')).read_text(),'steelblue')]:
            poly=shapely.from_wkt(wkt)
            for p in (poly.geoms if hasattr(poly,'geoms') else [poly]):
                if p.is_empty: continue
                ax.fill(*p.exterior.xy,alpha=.65,color=color,label=key)
                for hole in p.interiors: ax.fill(*hole.xy,color='white')
        for f in info['planarFaces']:
            if abs(f['normal'][2])<1e-8: ax.annotate(str(f['face']),f['centerMm'][:2])
        ax.set_aspect('equal');ax.set_title('Barrel '+suffix+' supplied mid-height section')
        ax.set_xlabel('world X / mm');ax.set_ylabel('world Y / mm');ax.legend()
    fig.tight_layout();fig.savefig(DEST/'sections.png',dpi=160)
    print('saved',DEST/'source.json',flush=True)

if __name__ == '__main__': run()
