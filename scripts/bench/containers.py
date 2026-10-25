"""Original procedural reference-inspired closed protectors; called by exporter.
No CAD buffers are baked here. Packet bounds only guide elastic film envelopes.
"""
def add_containers(mesh, slab, material, SPEC, ROOT):
    import math,json
    parts=json.loads((ROOT/'assets/authored/bench-parts-layout.json').read_text())
    black=material('Protector black base','191D20',.48)
    def clear(name,opacity,rough):
        m=material(name,'DBE7E9',rough)
        p=m.node_tree.nodes.get('Principled BSDF');p.inputs['Alpha'].default_value=opacity
        m.diffuse_color=(*m.diffuse_color[:3],opacity)
        m.surface_render_method='DITHERED'
        return m
    shell=clear('Clear rigid shell',.11,.16)
    edge=clear('Clear moulded edge',.32,.2)
    support=clear('Clear dial suspension',.3,.32)
    film=clear('Elastic membrane',.045,.22)
    def circle(r,n=64):return [(r*math.cos(i*2*math.pi/n),r*math.sin(i*2*math.pi/n)) for i in range(n)]
    def rounded(half,r,n=8):
        return [(cx+r*math.cos(a),cz+r*math.sin(a)) for cx,cz,start in [(half-r,half-r,0),(-half+r,half-r,90),(-half+r,-half+r,180),(half-r,-half+r,270)] for a in [(start+i*90/n)*math.pi/180 for i in range(n+1)]]
    def loft(name,cx,cz,loops,mat,role='walkable'):
        # Closed polygonal section swept around outline; no internal coplanar panels.
        n=len(loops[0][0]);verts=[(cx+x,y,cz+z) for outline,y in loops for x,z in outline];faces=[]
        for j in range(len(loops)):
            k=(j+1)%len(loops)
            faces.extend((j*n+i,j*n+(i+1)%n,k*n+(i+1)%n,k*n+i) for i in range(n))
        return mesh(name,verts,faces,mat,role,smooth=True)
    for face,x in [('central',-105),('small',105)]:
        z=-35;dial=next(g for g in parts['groups'] if g['id']==face+'-dial')
        slab(face+'-protector-floor',[(x+a,z+b) for a,b in circle(22.5)],1.2,0,black)
        loft(face+'-protector-base',x,z,[(circle(22.5),1.2),(circle(22.5),3),(circle(21.6),3),(circle(21.6),1.2)],black)
        # Clear cover, flat face kept well above all dial decoration.
        loft(face+'-protector-cover-wall',x,z,[(circle(22.45),2.8),(circle(22.45),7.7),(circle(21.6),7.7),(circle(21.6),2.8)],shell)
        slab(face+'-protector-cover',[(x+a,z+b) for a,b in circle(22.45)],8,7.5,shell)
        loft(face+'-protector-seam',x,z,[(circle(22.5),2.8),(circle(22.5),3.05),(circle(22.45),3.05),(circle(22.45),2.8)],edge)
        # Three curved arms and small rear contact pins, inferred from the product photograph.
        for i,s in enumerate(dial['supports']):
            end=math.atan2(s['z']-z,s['x']-x);r=math.hypot(s['x']-x,s['z']-z)
            outline=[]
            for sign,steps in [(1,range(21)),(-1,reversed(range(21)))]:
                for j in steps:
                    t=j/20;a=end+(1-t)*.7;rr=3+(r-3)*t
                    outline.append((x+(rr+sign*.7)*math.cos(a),z+(rr+sign*.7)*math.sin(a)))
            slab(face+f'-rear-arm-{i}',outline,1.6,1.35,support,role='decor')
            # Contact tip is only .08 mm wide; rests on measured rear triangle centroid.
            slab(face+f'-rear-contact-{i}',[(s['x']+a,s['z']+b) for a,b in circle(.04,12)],s['top'],1.6,support,role='decor')
        loft(face+'-rear-hub',x,z,[(circle(3.8,32),1.35),(circle(3.8,32),1.6),(circle(2,32),1.6),(circle(2,32),1.35)],support,'decor')
        # Rounded clear membrane box, exact published outer dimensions.
        z=35;h=19.5;inner=18.7
        for half,y0,y1 in [('base',0,8.9),('lid',8.9,17.8)]:
            loft(face+'-box-'+half+'-wall',x,z,[(rounded(h,4),y0),(rounded(h,4),y1),(rounded(inner,3.2),y1),(rounded(inner,3.2),y0)],shell)
            slab(face+'-box-'+half+'-panel',[(x+a,z+b) for a,b in rounded(inner,3.2)],.8 if half=='base' else 17.8,0 if half=='base' else 17,shell)
        loft(face+'-box-seam',x,z,[(rounded(h,4),8.75),(rounded(h,4),9.05),(rounded(h-.12,3.88),9.05),(rounded(h-.12,3.88),8.75)],edge)
        packets=next(g for g in parts['groups'] if g['id']==face+'-hands')['packets']
        # Two continuous elastic sheets. A conservative smooth envelope around each
        # rigid packet prevents films cutting through blades/bushings between grid nodes.
        # A flat margin > diagonal cell size guarantees the piecewise-linear mesh clears.
        n=48;extent=18.65
        for side in [-1,1]:
            verts=[];faces=[]
            for j in range(n+1):
                for i in range(n+1):
                    lx=-extent+2*extent*i/n;lz=-extent+2*extent*j/n
                    dx=max(abs(lx)-15.5,0);dz=max(abs(lz)-15.5,0);length=math.hypot(dx,dz)
                    if length>3.15:
                        lx=math.copysign(15.5+dx*3.15/length,lx);lz=math.copysign(15.5+dz*3.15/length,lz)
                    px=x+lx;pz=z+lz
                    displacement=0
                    for p in packets:
                        lo,hi=p['bounds'];dx=max(lo[0]-px,0,px-hi[0]);dz=max(lo[2]-pz,0,pz-hi[2]);distance=math.hypot(dx,dz)
                        t=max(0,min(1,(distance-1.2)/2));weight=1-t*t*(3-2*t)
                        amplitude=(hi[1]-8.9 if side==1 else 8.9-lo[1])+.025
                        displacement=max(displacement,amplitude*weight)
                    verts.append((px,8.9+side*(.01+displacement),pz))
            for j in range(n):
                for i in range(n):
                    k=j*(n+1)+i;faces.append((k,k+1,k+n+2,k+n+1))
            o=mesh(face+('-upper-film' if side==1 else '-lower-film'),verts,faces,film,'decor',smooth=True)
            o['protectedInterior']=True
