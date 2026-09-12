"""Method checks against analytic solids, independent of the watch geometry."""
import sys
import unittest
from pathlib import Path
sys.path.insert(0,str(Path(__file__).resolve().parents[1]/'scripts/mechanics'))
from m2_audit import pair
from m2_experiments import interior
from OCP.BRepPrimAPI import BRepPrimAPI_MakeBox
from OCP.gp import gp_Pnt

class Method(unittest.TestCase):
    def box(self,x): return BRepPrimAPI_MakeBox(gp_Pnt(x,0,0),1,1,1).Shape()
    def test_separation(self):
        r=pair(self.box(0),self.box(1.02))
        self.assertEqual(r['classification'],'separation')
        self.assertAlmostEqual(r['distanceRefinementMm'][-1],.02,12)
        self.assertTrue(all(c['volumeMm3']==0 for c in r['common']))
    def test_tangent_is_not_accepted_contact(self):
        r=pair(self.box(0),self.box(1))
        self.assertEqual(r['classification'],'numerically inconclusive')
        self.assertEqual(r['distanceRefinementMm'][-1],0)
        self.assertTrue(all(c['solids']==0 for c in r['common']))
        self.assertTrue(r['witnesses'][0]['aFaces'])
    def test_penetration_and_interior_depth(self):
        a,b=self.box(0),self.box(.8);r=pair(a,b);i=interior(a,b)
        for c in r['common']: self.assertAlmostEqual(c['volumeMm3'],.2,12)
        self.assertEqual(i['classification'],'penetration corroborated')
        self.assertAlmostEqual(i['interiorBallRadiusMm'],.1,12)
    def test_sub_budget_gap_stays_inconclusive(self):
        self.assertEqual(pair(self.box(0),self.box(1.0005))['classification'],'numerically inconclusive')

if __name__=='__main__': unittest.main()
