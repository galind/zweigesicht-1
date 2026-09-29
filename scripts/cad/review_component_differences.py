#!/usr/bin/env python3
"""Read-only BRep difference review. Never applies replacements to the runtime."""
import sys, json
from pathlib import Path
from OCP.BRepAlgoAPI import BRepAlgoAPI_Cut
from OCP.TDF import TDF_Label,TDF_LabelSequence,TDF_Tool
from OCP.BRepCheck import BRepCheck_Analyzer
ROOT=Path(__file__).resolve().parents[2]
sys.path[:0]=[str(ROOT/'scripts/cad'),str(ROOT/'scripts/preflight')]
from cad_probe import load_xcaf
from compare_component_sources import metrics, OUT, save_mesh, sha


def main():
    ledger=json.loads((ROOT/'docs/cad-component-ledger.json').read_text())
    provenance=json.loads((ROOT/'assets/source-manifest/component-fidelity-sources.json').read_text())
    assert sha(ROOT/'assets/source-originals/ml01-zweigesicht.stp')==ledger['assemblySha256']
    doc,tool=load_xcaf(ROOT/'assets/source-originals/ml01-zweigesicht.stp')
    records=[]
    # Bounded review targets: numerical clutch discrepancy and the plate slot.
    # Invalid sources cannot establish compatibility through booleans.
    rows=[r for r in ledger['definitions'] if r['definitionId'] in ('d_0_1_1_144','d_0_1_1_195')]
    # The catalog buckle screw differs in both head and shoulder dimensions.
    buckle=next(r for r in ledger['definitions'] if r['definitionId']=='d_0_1_1_61')
    candidate=next(f for f in provenance['files'] if f['filename']=='010-linzylans s120x160 k220x120 a140x50.stp')
    rows.append(dict(buckle,source=candidate))
    for row in rows:
        key=row['definitionId']
        cached=OUT/(key+'-difference.json')
        assert sha(ROOT/row['source']['path'])==row['source']['sha256']
        if cached.exists():
            record=json.loads(cached.read_text())
            assert record['assemblySha256']==ledger['assemblySha256']
            assert record['source']['sha256']==row['source']['sha256']
            records.append(record);continue
        label=TDF_Label();TDF_Tool.Label_s(doc.GetData(),key.removeprefix('d_').replace('_',':'),label,False)
        a=tool.GetShape_s(label);sd,st=load_xcaf(ROOT/row['source']['path']);roots=TDF_LabelSequence();st.GetFreeShapes(roots);b=st.GetShape_s(roots.Value(1))
        record=dict(definitionId=key,assemblySha256=ledger['assemblySha256'],source=row['source'],validAssembly=bool(BRepCheck_Analyzer(a).IsValid()),validIndividual=bool(BRepCheck_Analyzer(b).IsValid()))
        for name,shape in [('assembly',a),('individual',b)]:
            result,_=metrics(shape)
            record[name]={k:v for k,v in result.items() if k not in ('faces','cylinders')}
        for name,left,right in [('assemblyOnly',a,b),('individualOnly',b,a)]:
            try:
                cut=BRepAlgoAPI_Cut(left,right);cut.Build()
                if not cut.IsDone():raise RuntimeError('Boolean cut failed')
                shape=cut.Shape();result,mesh=metrics(shape)
                record[name]={k:v for k,v in result.items() if k not in ('faces','cylinders')}
                if len(mesh.faces):save_mesh(key+'-'+name,mesh)
            except Exception as error:record[name]=dict(error=str(error))
        (OUT/(key+'-difference.json')).write_text(json.dumps(record,indent=2)+'\n');records.append(record)
        print(key,json.dumps(record),flush=True)
    (OUT/'difference-review.json').write_text(json.dumps(records,indent=2)+'\n')

if __name__=='__main__':main()
