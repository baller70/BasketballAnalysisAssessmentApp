"""D2 disagrees with grade 24's diagnosis under my estimator. Before keeping or
refusing the change on the story rather than the number, find out whether the
disagreement is the SEGMENTATION (my n=9 against their n=23) or the RUN."""
import numpy as np, sys
from PIL import Image
def lum(p): return np.asarray(Image.open(p).convert("RGB"), dtype=np.float64).mean(axis=2)
C = lum("docs/shotiq/grading/canonical/005-verify-email.png")
def ink(a,r0,r1,c0,c1):
    w=a[r0:r1,c0:c1]; paper=np.percentile(w,95)
    return np.clip((paper-w)/max(paper-w.min(),1e-9),0,1)
def segs(col,thr,gap):
    on=col>thr; out=[]; i=0; n=len(on)
    while i<n:
        if on[i]:
            j=i;k=i
            while j<n:
                if on[j]: k=j; j+=1
                elif j-k<=gap: j+=1
                else: break
            out.append((i,k+1)); i=j
        else: i+=1
    return out
def dx(r,c,lo,hi,span=2.0):
    x=np.arange(lo-4,hi+4); rr=r[lo-4:hi+4]; cc=c[lo-4:hi+4]
    best=bd=None
    for d in np.arange(-span,span+1e-9,0.01):
        e=float(((np.interp(x,x+d,rr)-cc)**2).sum())
        if best is None or e<best: best,bd=e,d
    return bd
def run(R,r0,r1,c0,c1,gap,thr,label):
    pr=ink(R,r0,r1,c0,c1).sum(axis=0); pc=ink(C,r0,r1,c0,c1).sum(axis=0)
    pr/=max(pr.max(),1e-9); pc/=max(pc.max(),1e-9)
    ss=[s for s in segs(pr,thr,gap) if s[1]-s[0]>=3 and s[0]>=5 and s[1]<=len(pr)-5]
    d=np.array([dx(pr,pc,a,b) for a,b in ss])
    # WHOLE-RUN registration too: one dx over the entire profile, which cannot
    # be blamed on segmentation at all.
    whole=dx(pr,pc,5,len(pr)-5,span=2.0)
    print(f"  {label:26s} n={len(d):3d} mean {d.mean():+.3f} med {np.median(d):+.3f} sd {d.std():.3f}   WHOLE-RUN {whole:+.3f}")
for tag,p in (("shipped","docs/shotiq/grading/render/005-verify-email.png"),
              ("round 39",sys.argv[1])):
    R=lum(p); print(f"\n{tag}")
    for gap,thr in ((0,0.10),(1,0.08),(2,0.06)):
        run(R,1502,1580,160,530,gap,thr,f"help3 gap={gap} thr={thr}")
    for gap,thr in ((0,0.10),(2,0.06)):
        run(R,1400,1472,160,680,gap,thr,f"help2 gap={gap} thr={thr}")
