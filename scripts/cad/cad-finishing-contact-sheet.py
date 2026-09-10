"""Local audit evidence layout only; never modifies production/source images."""
import argparse,json
from pathlib import Path
from PIL import Image,ImageDraw
p=argparse.ArgumentParser();p.add_argument('start',type=int);p.add_argument('end',type=int,nargs='?');args=p.parse_args()
root=Path(__file__).resolve().parents[2]/'artifacts/browser/cad-finishing-audit'
for n in range(args.start,(args.end or args.start)+1):
 files=sorted(root.glob(f'{n:03}-*.png'))
 out=Image.new('RGB',(1600,((len(files)+3)//4)*260),'#e8e8e8');d=ImageDraw.Draw(out)
 for i,f in enumerate(files):
  im=Image.open(f);w,h=im.size;im=im.crop((int(w*.20),90,int(w*.82),h-185));im.thumbnail((400,230));x=(i%4)*400;y=(i//4)*260;out.paste(im,(x,y+24));d.text((x+5,y+5),f.stem,fill='black')
 out.save(root/f'{n:03}-sheet.jpg')
