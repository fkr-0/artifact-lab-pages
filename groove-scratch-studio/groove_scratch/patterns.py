"""Preset scratch trajectories, matching the browser's v1.3 rectangle generator.

The rectangle produces baked position and crossfader curves. Pattern metadata is
informational: playback uses the baked curves to remain version-independent.
"""
import math

KINDS = ('baby', 'forward', 'chirp', 'stab', 'flare1', 'orbit1', 'flare2', 'orbit2')


def generate(kind, t0, t1, p0, p1, repeats=1, sharpness=1.0, bias=0.5, cut_width=1.0):
    if kind not in KINDS:
        raise ValueError(f'Unsupported pattern: {kind}. Choose one of {", ".join(KINDS)}')
    vals = (t0, t1, p0, p1)
    if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in vals):
        raise ValueError('Rectangle coordinates must be finite')
    if not (t1 > t0 >= 0 and 0 <= p0 < p1 <= 1):
        raise ValueError('Require 0 <= timeStart < timeEnd and 0 <= sampleStart < sampleEnd <= 1')
    if not isinstance(repeats, int) or not 1 <= repeats <= 8:
        raise ValueError('repeats must be an integer between 1 and 8')
    if not all(isinstance(v, (int, float)) and math.isfinite(v) for v in (sharpness, bias, cut_width)):
        raise ValueError('Pattern shaping must be finite')
    if not (1 <= sharpness <= 3.5 and .25 <= bias <= .75 and .5 <= cut_width <= 2.5):
        raise ValueError('Pattern shaping out of supported range')
    xy, fader = [], []
    def add_pos(u, v):
        xy.append({'t': t0 + u * (t1 - t0), 'p': p0 + (p1 - p0) * v})
    def pos_stroke(start, end, from_value, to_value):
        if sharpness > 1.0001:
            hold = (1-1/sharpness)*.5
            duration = end-start
            add_pos(start, from_value)
            add_pos(start+duration*hold, from_value)
            add_pos(end-duration*hold, to_value)
            add_pos(end, to_value)
        else:
            add_pos(start, from_value)
            add_pos(end, to_value)
    def add_gain(u, v):
        fader.append({'t': t0 + u * (t1 - t0), 'v': v})
    forward_only = kind in ('forward', 'stab', 'flare1', 'flare2')
    cuts = 1 if kind in ('flare1', 'orbit1') else 2 if kind in ('flare2', 'orbit2') else 0
    span = t1 - t0
    def stroke_gate(start, end, number):
        width = max(.001, min(.003*cut_width/span, min(.045, (end-start)/14)))
        for j in range(1, number + 1):
            mid = start + (end-start) * j/(number+1)
            add_gain(max(start, mid-width*1.5), 1)
            add_gain(max(start, mid-width*.5), 0)
            add_gain(min(end, mid+width*.5), 0)
            add_gain(min(end, mid+width*1.5), 1)
    for k in range(repeats):
        a, b = k/repeats, (k+1)/repeats
        mid = a+(b-a)*bias
        if kind == 'stab':
            hit=a+(b-a)*max(.13,min(.41,.27+(bias-.5)*.36))
            release=a+(b-a)*max(.21,min(.50,.35+(bias-.5)*.36))
            pos_stroke(a,hit,0,1); add_pos(release,1); pos_stroke(release,b,1,0)
            add_gain(a,0); add_gain(a+(b-a)*.02,1); add_gain(a+(b-a)*.26,1); add_gain(a+(b-a)*.30,0); add_gain(b,0)
        elif kind == 'forward':
            hit=a+(b-a)*max(.43,min(.88,.69+(bias-.5)*.65))
            pos_stroke(a,hit,0,1); pos_stroke(hit,b,1,0)
            add_gain(a,1); add_gain(a+(hit-a)*(.66/.69),1); add_gain(min(b,hit+(b-a)*.01),0); add_gain(b,0)
        else:
            pos_stroke(a,mid,0,1); pos_stroke(mid,b,1,0)
            add_gain(a,1)
            if kind == 'chirp':
                w=(b-a)*.05*cut_width
                add_gain(mid-w,1); add_gain(mid-w*.3,0); add_gain(mid+w*.3,0); add_gain(mid+w,1)
            elif cuts:
                stroke_gate(a,mid,cuts)
                if not forward_only:
                    stroke_gate(mid,b,cuts)
                else:
                    add_gain(mid-(b-a)*.012,1); add_gain(mid,0); add_gain(b,0)
            if kind in ('baby', 'chirp') or not forward_only:
                add_gain(b,1)
    def ordered(pts, key):
        out=[]
        for pt in sorted(pts,key=lambda x:x['t']):
            value = {'t':max(t0,min(t1,pt['t'])),key:max(0,min(1,pt[key]))}
            if out and abs(out[-1]['t']-value['t'])<1e-7:
                out[-1]=value
            else:
                out.append(value)
        return out
    return ordered(xy,'p'),ordered(fader,'v')


def interpolate(points, t, key, default):
    if not points: return default
    if t <= points[0]['t']: return points[0][key]
    if t >= points[-1]['t']: return points[-1][key]
    lo,hi=0,len(points)-1
    while hi-lo>1:
        mid=(lo+hi)//2
        if points[mid]['t']<=t:lo=mid
        else: hi=mid
    a,b=points[lo],points[hi]
    return a[key]+(b[key]-a[key])*(t-a['t'])/(b['t']-a['t'])


def splice(original, inserted, t0, t1, key, default, duration):
    """Preserve neighboring values outside the interval, matching UI behavior."""
    epsilon=min(.002,(t1-t0)/300)
    before=max(0,t0-epsilon)
    after=min(duration,t1+epsilon)
    left=interpolate(original,before,key,default)
    right=interpolate(original,after,key,default)
    out=[p.copy() for p in original if p['t']<before or p['t']>after]
    # Do not restore the pre-existing position/gain at the end of the
    # timeline. Doing so silently replaced the final scratch knot and
    # produced an audible speed/pitch spike at the boundary.
    out += ([{'t':before,key:left}] if t0 > 0 else []) + inserted
    if t1 < duration:
        out.append({'t':after,key:right})
    out.sort(key=lambda p:p['t'])
    result=[]
    for p in out:
        if result and abs(result[-1]['t']-p['t'])<1e-9:
            result[-1]=p
        else:result.append(p)
    return result
