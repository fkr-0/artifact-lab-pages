"""Stable interoperable JSON v1 contract and strict semantic validation."""
from pathlib import Path
import json
import math
import hashlib
from .patterns import KINDS, generate, splice

FORMAT='groove-scratch-project'
VERSION=1
MAX_DURATION=7200
MAX_POINTS=200_000


def is_num(v):
    return type(v) in (int, float) and math.isfinite(v)


def check(project):
    """Validate independently of installed third-party audio packages."""
    def require(ok, message):
        if not ok:raise ValueError(message)
    require(isinstance(project,dict),'Project must be an object')
    require(project.get('format')==FORMAT and project.get('version')==VERSION,'Expected groove-scratch-project version 1')
    require(set(project)=={'format','version','source','selection','tempo','timeline','automation','patterns','metadata'},'Unexpected/missing top-level keys')
    s=project['source'];require(isinstance(s,dict) and set(s)=={'path','sha256'},'source must have path, sha256')
    require(isinstance(s['path'],str) and bool(s['path']) and '\x00' not in s['path'],'source.path must be nonempty filename')
    require(s['sha256'] is None or isinstance(s['sha256'],str) and len(s['sha256'])==64 and all(c in '0123456789abcdef' for c in s['sha256']),'source.sha256 must be null or lowercase SHA256')
    sel=project['selection'];require(isinstance(sel,dict) and set(sel)=={'startSeconds','endSeconds'},'Invalid selection keys')
    require(all(is_num(v) for v in sel.values()) and 0<=sel['startSeconds']<sel['endSeconds']<=MAX_DURATION,'Invalid sample interval')
    tmp=project['tempo']; require(isinstance(tmp,dict) and set(tmp)=={'bpm','beatsPerBar','subdivisionsPerBeat'},'Invalid tempo keys')
    require(is_num(tmp['bpm']) and 30<=tmp['bpm']<=300,'BPM must be 30..300')
    require(type(tmp['beatsPerBar'])==int and 1<=tmp['beatsPerBar']<=16,'Invalid beatsPerBar')
    require(tmp['beatsPerBar']==4,'v1 browser supports only 4/4; beatsPerBar must be 4')
    require(type(tmp['subdivisionsPerBeat'])==int and tmp['subdivisionsPerBeat'] in (1,2,4,8,16),'Invalid subdivisionsPerBeat')
    tl=project['timeline']; require(isinstance(tl,dict) and set(tl)=={'durationSeconds','loop'},'Invalid timeline keys')
    duration=tl['durationSeconds'];require(is_num(duration) and 0<duration<=MAX_DURATION,'Invalid timeline duration')
    require(type(tl['loop'])==bool,'timeline.loop must be boolean')
    a=project['automation'];require(isinstance(a,dict) and set(a)=={'position','gain'},'Invalid automation tracks')
    for name,key in [('position','p'),('gain','v')]:
        pts=a[name];require(isinstance(pts,list) and len(pts)<=MAX_POINTS,f'Too many {name} nodes')
        require(len(pts)>=2 or name=='position' and len(pts)==0,f'{name} requires >=2 points (position may be empty until edited)')
        previous=-1
        for i,p in enumerate(pts):
            require(isinstance(p,dict) and set(p)=={'t',key},f'Invalid {name} node {i} keys')
            require(is_num(p['t']) and is_num(p[key]) and 0<=p['t']<=duration+1e-7 and 0<=p[key]<=1,f'Invalid {name} node {i} range')
            require(p['t']>previous+1e-10,f'{name} nodes must be strictly ordered by time')
            previous=p['t']
        if name=='gain':
            require(abs(pts[0]['t'])<1e-8 and abs(pts[-1]['t']-duration)<1e-6,'Gain envelope must cover 0..duration')
        elif pts:
            require(abs(pts[0]['t'])<1e-8 and abs(pts[-1]['t']-duration)<1e-6,'Position envelope must cover 0..duration')
    patterns=project['patterns'];require(isinstance(patterns,list) and len(patterns)<=20000,'Invalid pattern history')
    for i,p in enumerate(patterns):
        require(isinstance(p,dict) and set(p)=={'kind','timeStart','timeEnd','sampleStart','sampleEnd','repeats'},f'Pattern {i} keys invalid')
        require(p['kind'] in KINDS,f'Pattern {i} kind invalid')
        require(all(is_num(p[k]) for k in ('timeStart','timeEnd','sampleStart','sampleEnd')),f'Pattern {i} nonfinite')
        require(0<=p['timeStart']<p['timeEnd']<=duration+1e-8 and 0<=p['sampleStart']<p['sampleEnd']<=1,f'Pattern {i} rectangle invalid')
        require(type(p['repeats'])==int and 1<=p['repeats']<=8,f'Pattern {i} repeats invalid')
    require(isinstance(project['metadata'],dict) and set(project['metadata'])=={'title'},'metadata must contain title')
    require(isinstance(project['metadata']['title'],str) and len(project['metadata']['title'])<=200,'metadata.title invalid')
    return project


def make(source, start, end, bpm, duration=None, bars=None, title='', sha256=None):
    if duration is None:
        duration=(240.0/bpm)*bars if bars is not None else end-start
    project={'format':FORMAT,'version':VERSION,'source':{'path':str(source),'sha256':sha256},'selection':{'startSeconds':float(start),'endSeconds':float(end)},'tempo':{'bpm':float(bpm),'beatsPerBar':4,'subdivisionsPerBeat':4},'timeline':{'durationSeconds':float(duration),'loop':True},'automation':{'position':[{'t':0.0,'p':0.0},{'t':float(duration),'p':1.0}],'gain':[{'t':0.0,'v':1.0},{'t':float(duration),'v':1.0}]},'patterns':[],'metadata':{'title':str(title)}}
    return check(project)


def apply(project, kind, t0, t1, p0, p1, repeats=1, sharpness=1.0, bias=0.5, cut_width=1.0):
    check(project)
    duration=project['timeline']['durationSeconds']
    if t1>duration+1e-8:raise ValueError('Pattern end exceeds timeline duration')
    pts,gain=generate(kind,t0,t1,p0,p1,repeats,sharpness,bias,cut_width)
    project['automation']['position']=splice(project['automation']['position'],pts,t0,t1,'p',0,duration)
    project['automation']['gain']=splice(project['automation']['gain'],gain,t0,t1,'v',1,duration)
    project['patterns'].append({'kind':kind,'timeStart':t0,'timeEnd':t1,'sampleStart':p0,'sampleEnd':p1,'repeats':repeats})
    check(project)
    return project



def speed_diagnostics(position, selection_seconds, threshold=2.0):
    """Absolute source seconds traversed per output second.

    Piecewise-linear slope includes automated needle jumps and pattern joins.
    Values near 1.0 play at normal sample rate; 4.0 pitches up two octaves.
    """
    if not (is_num(selection_seconds) and selection_seconds > 0):
        raise ValueError('selection_seconds must be finite and positive')
    if not (is_num(threshold) and threshold > 0):
        raise ValueError('rate threshold must be finite and positive')
    maximum = 0.0
    fast = 0.0
    for a,b in zip(position,position[1:]):
        dt = b['t'] - a['t']
        if dt <= 0: raise ValueError('Position timestamps must increase')
        rate = abs((b['p']-a['p']) * selection_seconds / dt)
        maximum = max(maximum,rate)
        if rate > threshold: fast += dt
    return {'maxPlaybackRate':round(maximum,6),
            'secondsAboveThreshold':round(fast,6),
            'threshold':threshold}

def load(path):
    path=Path(path)
    try: data=json.loads(path.read_text(encoding='utf-8'))
    except (OSError,json.JSONDecodeError) as e: raise ValueError(f'Cannot read JSON: {e}') from e
    return check(data)


def save(project,path):
    check(project)
    path=Path(path);path.parent.mkdir(parents=True,exist_ok=True)
    path.write_text(json.dumps(project,ensure_ascii=False,indent=2,allow_nan=False)+'\n',encoding='utf-8')


def file_sha256(path):
    digest=hashlib.sha256()
    with Path(path).open('rb') as stream:
        while True:
            chunk=stream.read(1024*1024)
            if not chunk:break
            digest.update(chunk)
    return digest.hexdigest()


def locate_audio(project,project_path,audio_override=None):
    if audio_override is None:
        audio=Path(project['source']['path'])
        if not audio.is_absolute(): audio=Path(project_path).resolve().parent/audio
    else: audio=Path(audio_override)
    audio=audio.resolve()
    if not audio.is_file():raise ValueError(f'Audio file not found: {audio}')
    sha=project['source']['sha256']
    if sha:
        digest=file_sha256(audio)
        if digest!=sha:raise ValueError('Audio SHA256 does not match project reference')
    return audio
