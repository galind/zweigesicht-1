#!/usr/bin/env python3
"""Label and compose unretouched CAD diagnostics; retain every original render."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFont
ROOT=Path(__file__).resolve().parents[2];OUT=ROOT/'artifacts/cad/component-fidelity/visuals'
font=ImageFont.truetype('/System/Library/Fonts/Supplemental/Arial.ttf',20)

def pair(base,left_label,right_label):
    a=Image.open(OUT/(base+'-assembly.png'));b=Image.open(OUT/(base+'-individual.png'))
    im=Image.new('RGB',(1400,770),(27,30,35));im.paste(a,(0,70));im.paste(b,(700,70));draw=ImageDraw.Draw(im)
    draw.text((20,20),left_label,fill='white',font=font);draw.text((720,20),right_label,fill='white',font=font);im.save(OUT/(base+'-paired.png'))

for n in [9,180,55,68,195]:
    pair('d_0_1_1_'+str(n),f'd{n}: assembly STEP', 'Independent maker STEP: same scale, camera, lighting')
pair('d_0_1_1_195-slot','Plate slot: assembly variant (Y = +/-1.30 mm)','Individual variant (Y = +/-1.15 mm); report only')
for occurrence in ['0_1_1_83_42','0_1_1_83_67']:
    pair('d9-context-'+occurrence,'Assembled source occurrence '+occurrence,'Same seat with equivalent individual screw; diagnostic only')
