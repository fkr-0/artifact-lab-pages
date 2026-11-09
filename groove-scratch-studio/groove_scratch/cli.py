"""Machine-readable CLI: successes on stdout; failures as JSON on stderr."""
import argparse
import copy
import hashlib
import json
import os
from pathlib import Path
import sys
from .project import apply, check, load, save, make, locate_audio, file_sha256, speed_diagnostics
from .patterns import KINDS, generate


def parser():
    p=argparse.ArgumentParser(prog='groove-scratch',description='Offline scratch-pattern project JSON and WAV renderer')
    sub=p.add_subparsers(dest='cmd',required=True)
    n=sub.add_parser('new',help='Create a JSON project pointing to a local audio source')
    n.add_argument('--source',required=True,help='WAV/FLAC/MP3 local audio filename, stored relative to the output JSON')
    n.add_argument('--start',type=float,default=0.,help='Selection start, seconds in source file')
    n.add_argument('--end',type=float,required=True,help='Selection end, seconds in source file')
    n.add_argument('--bpm',type=float,default=100.)
    g=n.add_mutually_exclusive_group();g.add_argument('--duration',type=float);g.add_argument('--bars',type=float)
    n.add_argument('--title',default='');n.add_argument('--hash-audio',action='store_true',help='Store source SHA256 and verify it on WAV render')
    n.add_argument('--output',required=True)
    a=sub.add_parser('apply',help='Insert a named rectangle pattern; writes baked automation and metadata')
    a.add_argument('--input',required=True);a.add_argument('--output',required=True)
    a.add_argument('--kind',choices=KINDS,required=True)
    a.add_argument('--time-start',type=float,required=True);a.add_argument('--time-end',type=float,required=True)
    a.add_argument('--sample-start',type=float,default=0.);a.add_argument('--sample-end',type=float,default=1.)
    a.add_argument('--repeats',type=int,default=1)
    a.add_argument('--snap',action='store_true',help='Quantize rectangle X edges to BPM/subdivisions grid')
    a.add_argument('--target-speed',type=float,help='Scale source travel downward if needed so max stroke speed does not exceed this multiple of normal playback (e.g. 1.0)')
    a.add_argument('--flank',type=float,default=1.0,help='Stroke flank sharpness 1.0..3.5; higher = steeper ramp and edge holds')
    a.add_argument('--stroke-bias',type=float,default=.5,help='Forward stroke fraction 0.25..0.75 (reverse uses remaining time)')
    a.add_argument('--click-width',type=float,default=1.0,help='Crossfader gate/cut duration multiplier 0.5..2.5')
    r=sub.add_parser('render',help='Render explicit position/gain curves to WAV, offline')
    r.add_argument('--input',required=True);r.add_argument('--output',required=True)
    r.add_argument('--audio',help='Override source.path for rendering without changing project JSON')
    r.add_argument('--sample-rate',type=int,default=48000);r.add_argument('--loops',type=int,default=1)
    r.add_argument('--interpolation',choices=('sinc','linear'),default='sinc')
    r.add_argument('--max-speed',type=float,help='Fail closed if the baked motion exceeds this playback-speed multiple, including segment joins')
    v=sub.add_parser('validate',help='Check v1 schema, semantic limits and optionally the audio file')
    v.add_argument('--input',required=True);v.add_argument('--check-audio',action='store_true');v.add_argument('--audio')
    v.add_argument('--max-speed',type=float,help='Reject projects exceeding this playback-rate multiple')
    i=sub.add_parser('inspect',help='Print project metadata as JSON')
    i.add_argument('--input',required=True)
    e=sub.add_parser('schema',help='Print the stable JSON Schema v1')
    f=sub.add_parser('patterns',help='List supported generator names')
    c=sub.add_parser('import-legacy',help='Convert browser groove-motion-v1/v2 JSON into the stable format')
    c.add_argument('--input',required=True);c.add_argument('--source',required=True);c.add_argument('--output',required=True)
    return p


def result(command, **data):
    print(json.dumps({'ok':True,'command':command,**data},ensure_ascii=False,allow_nan=False))


def execute(args):
    if args.cmd=='patterns':result(args.cmd,values=list(KINDS));return
    if args.cmd=='schema':
        path=Path(__file__).resolve().parent/'project-v1.schema.json'
        print(path.read_text(encoding='utf-8').rstrip());return
    if args.cmd=='new':
        destination=Path(args.output).resolve()
        src=Path(args.source).resolve()
        if not src.is_file():raise ValueError(f'Audio source not found: {src}')
        # Relative to JSON, so relocating the project together with audio works.
        rel=os.path.relpath(src,destination.parent)
        sha=None
        if args.hash_audio:
            sha=file_sha256(src)
        proj=make(rel,args.start,args.end,args.bpm,args.duration,args.bars,args.title,sha)
        save(proj,destination)
        result(args.cmd,project=str(destination),durationSeconds=proj['timeline']['durationSeconds'],source=rel)
    elif args.cmd=='apply':
        if Path(args.input).resolve()==Path(args.output).resolve():raise ValueError('Use a different --output; inplace editing is intentionally disallowed')
        project=load(args.input)
        if args.snap:
            b=project['tempo'];grid=60/b['bpm']/b['subdivisionsPerBeat']
            args.time_start=round(args.time_start/grid)*grid
            args.time_end=round(args.time_end/grid)*grid
        # source.path must be translated if the output JSON changes directories.
        src=project['source']['path']
        if not Path(src).is_absolute():
            resolved=(Path(args.input).resolve().parent/src).resolve()
            project['source']['path']=os.path.relpath(resolved,Path(args.output).resolve().parent)
        if not (1 <= args.flank <= 3.5 and .25 <= args.stroke_bias <= .75 and .5 <= args.click_width <= 2.5):
            raise ValueError('--flank, --stroke-bias or --click-width outside allowed ranges')
        selection_seconds=project['selection']['endSeconds']-project['selection']['startSeconds']
        p0,p1=args.sample_start,args.sample_end
        if args.target_speed is not None:
            if not 0 < args.target_speed <= 64:raise ValueError('--target-speed must be within (0,64]')
            new_nodes,_=generate(args.kind,args.time_start,args.time_end,p0,p1,args.repeats,args.flank,args.stroke_bias,args.click_width)
            natural=speed_diagnostics(new_nodes,selection_seconds)['maxPlaybackRate']
            if natural>args.target_speed:
                p1=p0+(p1-p0)*(args.target_speed/natural)
        apply(project,args.kind,args.time_start,args.time_end,p0,p1,args.repeats,args.flank,args.stroke_bias,args.click_width)
        diagnostics=speed_diagnostics(project['automation']['position'],selection_seconds)
        save(project,args.output)
        result(args.cmd,project=str(Path(args.output).resolve()),kind=args.kind,
               sampleStart=p0,sampleEnd=p1,flank=args.flank,strokeBias=args.stroke_bias,clickWidth=args.click_width,points=len(project['automation']['position']),
               gainPoints=len(project['automation']['gain']),patterns=len(project['patterns']),
               **diagnostics)
    elif args.cmd=='validate':
        project=load(args.input)
        if args.check_audio:audio=str(locate_audio(project,args.input,args.audio))
        else:audio=None
        diagnostics=speed_diagnostics(project['automation']['position'],project['selection']['endSeconds']-project['selection']['startSeconds'])
        if args.max_speed is not None:
            if not 0 < args.max_speed <= 64:raise ValueError('--max-speed must be within (0,64]')
            if diagnostics['maxPlaybackRate']>args.max_speed+1e-6:
                raise ValueError(f"Playback rate {diagnostics['maxPlaybackRate']}x exceeds --max-speed {args.max_speed}x")
        result(args.cmd,valid=True,version=1,audio=audio,
               points=len(project['automation']['position']),gainPoints=len(project['automation']['gain']),**diagnostics)
    elif args.cmd=='inspect':
        p=load(args.input)
        result(args.cmd,format=p['format'],version=p['version'],title=p['metadata']['title'],source=p['source'],selection=p['selection'],tempo=p['tempo'],timeline=p['timeline'],patternCount=len(p['patterns']),patterns=p['patterns'],positionNodes=len(p['automation']['position']),gainNodes=len(p['automation']['gain']))
    elif args.cmd=='render':
        from .audio import render
        p=load(args.input)
        diagnostics=speed_diagnostics(p['automation']['position'],p['selection']['endSeconds']-p['selection']['startSeconds'])
        if args.max_speed is not None:
            if not 0 < args.max_speed <= 64:raise ValueError('--max-speed must be within (0,64]')
            if diagnostics['maxPlaybackRate']>args.max_speed+1e-6:
                raise ValueError(f"Playback rate {diagnostics['maxPlaybackRate']}x exceeds --max-speed {args.max_speed}x")
        result(args.cmd,**render(p,args.input,args.output,args.sample_rate,args.loops,args.audio,args.interpolation),**diagnostics)
    elif args.cmd=='import-legacy':
        old=json.loads(Path(args.input).read_text(encoding='utf-8'))
        if old.get('format') not in ('groove-motion-v1','groove-motion-v2'):raise ValueError('Expected groove-motion-v1/v2')
        selection=old['selection']
        duration=float(old['duration'])
        src=Path(args.source).resolve();destination=Path(args.output).resolve()
        if not src.is_file():raise ValueError(f'Audio source not found: {src}')
        project=make(os.path.relpath(src,destination.parent),float(selection['start']),float(selection['end']),float(old['bpm']),duration=duration)
        def convert(points,key):return sorted([{'t':float(p['t']),key:float(p[key])} for p in points],key=lambda p:p['t'])
        project['automation']['position']=convert(old.get('points',[]),'p')
        project['automation']['gain']=convert(old.get('volume') or [{'t':0,'v':1},{'t':duration,'v':1}],'v')
        # Earlier app allowed partial envelopes; normalize endpoints without rescaling.
        for name,key in [('position','p'),('gain','v')]:
            pts=project['automation'][name]
            if pts and pts[0]['t']>0:pts.insert(0,{'t':0,key:pts[0][key]})
            if pts and pts[-1]['t']<duration:pts.append({'t':duration,key:pts[-1][key]})
        check(project);save(project,args.output)
        result(args.cmd,project=str(destination),points=len(project['automation']['position']))
    else:raise ValueError('Unsupported command')


def main(argv=None):
    try:
        args=parser().parse_args(argv)
        execute(args)
        return 0
    except (ValueError,KeyError,OSError) as exc:
        print(json.dumps({'ok':False,'error':str(exc),'type':type(exc).__name__},ensure_ascii=False),file=sys.stderr)
        return 2

if __name__=='__main__':raise SystemExit(main())
