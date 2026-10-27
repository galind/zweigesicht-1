"""Reuse the qualified train section/solid algorithms for conditional display ratios.
Does not install coupling: interface acceptance and provenance are separate.
"""
from motion_works import *
from fractions import Fraction
import train_coupling as train

PAIRS=[(137,210,12,36,-1.3,'cannon1','motion1'),
       (211,141,10,40,-.82,'motion1','hour1'),
       (210,213,36,36,-1.3,'motion1','motion2'),
       (183,216,8,24,-5.2,'cannon2','motion3'),
       (217,187,8,32,-5.48,'motion3','hour2')]
RATIOS={'cannon1':Fraction(-1,540),'motion1':Fraction(1,1620),'hour1':Fraction(-1,6480),
        'motion2':Fraction(-1,1620),'motion3':Fraction(-1,1620),'cannon2':Fraction(1,540),'hour2':Fraction(1,6480)}
train.TRAIN=OUTPUT;train.MEMBERS=MEMBERS;train.PAIRS=PAIRS;train.RATIOS=RATIOS

if __name__=='__main__':
 import argparse
 p=argparse.ArgumentParser();p.add_argument('stage',choices=['initial','periods','solids','neighbors']);args=p.parse_args()
 if args.stage=='initial':train.initial()
 elif args.stage=='periods':
  import train_periods;train_periods.run(subdivisions=192)
 elif args.stage=='solids':
  import train_solids;train_solids.run()
 else:
  import train_neighbors;train_neighbors.run()
