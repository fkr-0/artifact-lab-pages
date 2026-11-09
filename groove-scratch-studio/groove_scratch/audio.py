"""Deterministic, fully offline multi-channel WAV bounce from baked automation.

Web Audio's AudioWorklet is browser-only. The CLI implements its semantic
position/gain trajectories with a vectorized 12-tap windowed-sinc resampler,
rate-dependent anti-aliasing, speed-dependent mute and loop declick.
It intentionally does not claim sample-exact analog/AudioWorklet parity.
"""
from pathlib import Path
import math
import subprocess
import tempfile
import wave
import numpy as np
try:
    import soundfile as sf
except ImportError:
    sf = None
from .project import check,locate_audio


def _decode_wav_pcm(path):
    """Read conventional integer PCM WAV without external codec packages."""
    with wave.open(str(path),'rb') as inp:
        if inp.getcomptype()!='NONE': raise ValueError('Compressed WAV requires ffmpeg')
        sr=inp.getframerate();channels=inp.getnchannels();width=inp.getsampwidth()
        if channels<1 or channels>2:raise ValueError('Only mono/stereo PCM supported')
        data=inp.readframes(inp.getnframes())
    if width==1:
        arr=(np.frombuffer(data,dtype=np.uint8).astype(np.float32)-128)/128
    elif width==2:
        arr=np.frombuffer(data,dtype='<i2').astype(np.float32)/32768
    elif width==3:
        buf=np.frombuffer(data,dtype=np.uint8).reshape(-1,3).astype(np.int32)
        x=buf[:,0]|(buf[:,1]<<8)|(buf[:,2]<<16)
        arr=((x^0x800000)-0x800000).astype(np.float32)/8388608
    elif width==4:
        arr=np.frombuffer(data,dtype='<i4').astype(np.float32)/2147483648
    else:raise ValueError(f'Unsupported PCM sample width: {width}')
    return arr.reshape(-1,channels),sr


def decode_audio(path):
    path=Path(path)
    try:
        if sf is not None:
            samples,sr=sf.read(str(path),dtype='float32',always_2d=True)
        else:
            samples,sr=_decode_wav_pcm(path)
    except (RuntimeError,OSError,ValueError,EOFError) as exc:
        # Optional FFmpeg fallback for FLAC, MP3, float WAV and other
        # browser-compatible encodings when libsndfile is not installed.
        with tempfile.TemporaryDirectory(prefix='groove-decode-') as tmp:
            wav=Path(tmp)/'decoded.wav'
            try:
                subprocess.run(['ffmpeg','-nostdin','-hide_banner','-loglevel','error','-y','-i',str(path),'-acodec','pcm_s16le',str(wav)],check=True,timeout=300,stdout=subprocess.DEVNULL,stderr=subprocess.PIPE)
            except (OSError,subprocess.CalledProcessError,subprocess.TimeoutExpired) as e:
                raise ValueError(f'Unable to decode {path.name}; install soundfile or ffmpeg ({e})') from e
            samples,sr=_decode_wav_pcm(wav)
    if samples.shape[1] > 2: raise ValueError('Only mono and stereo audio are supported')
    if samples.shape[0] < 2: raise ValueError('Source audio is too short')
    if not np.isfinite(samples).all(): raise ValueError('Decoded audio contains nonfinite values')
    return samples,sr


def _trajectory(nodes,t,key):
    x=np.asarray([p['t'] for p in nodes],dtype=np.float64)
    y=np.asarray([p[key] for p in nodes],dtype=np.float64)
    return np.interp(t,x,y,left=y[0],right=y[-1])


def _resample_pcm(pcm,position,rate):
    """Circular interpolation inside the selected source interval only."""
    n=pcm.shape[0]
    center=np.floor(position).astype(np.int64)
    fractional=position-center
    # Equivalent Hann-windowed lowpass interpolation over [-5,6] taps.
    cutoff=np.minimum(.975,.975/np.maximum(1.,np.abs(rate)))
    value=np.zeros((len(position),pcm.shape[1]),dtype=np.float64)
    total=np.zeros(len(position),dtype=np.float64)
    for k in range(-5,7):
        x=k-fractional
        win=np.where(np.abs(x/6)<1,.5+.5*np.cos(np.pi*x/6),0.)
        tap=cutoff*np.sinc(x*cutoff)*win
        value+=pcm[(center+k)%n,:]*tap[:,None]
        total+=tap
    return (value/np.maximum(total[:,None],1e-12)).astype(np.float32)


def render(project, project_path, output, sample_rate=48000, loops=1, audio=None, interpolation='sinc'):
    """Render a scratch performance to PCM_16 WAV. Returns renderer metadata.

    This intentionally renders automation, not live motor behavior; a project
    with an empty position curve is rejected rather than silently emitting tone.
    """
    check(project)
    if not project['automation']['position']:
        raise ValueError('No position automation; apply a pattern or add position nodes before rendering')
    if not isinstance(sample_rate,int) or not 8000<=sample_rate<=192000:
        raise ValueError('sample_rate must be 8000..192000')
    if not isinstance(loops,int) or not 1<=loops<=128:
        raise ValueError('loops must be 1..128')
    if interpolation not in ('sinc','linear'):
        raise ValueError('interpolation must be sinc or linear')
    path=locate_audio(project,project_path,audio)
    pcm,src_rate=decode_audio(path)
    sel=project['selection']
    first=max(0,int(math.floor(sel['startSeconds']*src_rate)))
    end=min(len(pcm),int(math.ceil(sel['endSeconds']*src_rate)))
    if end-first<2:raise ValueError('Selected audio interval is outside the source file or too short')
    if sel['endSeconds']>len(pcm)/src_rate+1/src_rate:
        raise ValueError(f'Selection end {sel["endSeconds"]} exceeds source duration {len(pcm)/src_rate:.6f}')
    pcm=pcm[first:end]
    duration=project['timeline']['durationSeconds']
    frames_per_loop=round(duration*sample_rate)
    if frames_per_loop<2:raise ValueError('Timeline too short to render')
    total_frames=frames_per_loop*loops
    if total_frames>sample_rate*7200:raise ValueError('Render exceeds 2-hour safety limit')
    output=Path(output);output.parent.mkdir(parents=True,exist_ok=True)
    pos_nodes=project['automation']['position'];gain_nodes=project['automation']['gain']
    # For each output frame, derive d(position)/dt from the piecewise-linear
    # control segment, rather than finite differences at the loop boundary.
    times=np.asarray([p['t'] for p in pos_nodes],dtype=np.float64)
    positions=np.asarray([p['p'] for p in pos_nodes],dtype=np.float64)
    edges=times[1:]
    slope=np.diff(positions)/np.diff(times)
    fade_frames=min(round(.004*sample_rate),frames_per_loop//8)
    amp=0.0
    rendered_peak=0.0
    chunk=16384
    with wave.open(str(output),'wb') as writer:
        writer.setnchannels(pcm.shape[1]);writer.setsampwidth(2);writer.setframerate(sample_rate)
        for offset in range(0,total_frames,chunk):
            count=min(chunk,total_frames-offset)
            frame=np.arange(offset,offset+count,dtype=np.int64)
            internal=(frame%frames_per_loop)
            t=internal/sample_rate
            p=_trajectory(pos_nodes,t,'p')
            seg=np.searchsorted(edges,t,side='right').clip(0,len(slope)-1)
            rate=slope[seg]*(len(pcm)-1)/sample_rate
            position=np.clip(p,0,1)*(len(pcm)-1)
            if interpolation=='sinc':
                values=_resample_pcm(pcm,position,rate)
            else:
                left=np.floor(position).astype(np.int64)
                frac=(position-left).astype(np.float32)
                values=pcm[left]*(1-frac[:,None])+pcm[(left+1)%len(pcm)]*frac[:,None]
            gains=_trajectory(gain_nodes,t,'v')
            # Match the worklet's near-static scratch mute (approximate
            # smoothed gate, with the same discrete smoothing coefficient).
            gates=np.clip((np.abs(rate)-.003)*13,0,1)
            amps=np.empty(count,dtype=np.float32)
            for i in range(count):
                amp+=(gates[i]-amp)*.035
                amps[i]=amp
            if fade_frames:
                edge=np.minimum(internal,frames_per_loop-1-internal)
                declick=np.clip(edge/fade_frames,0,1)
            else:declick=np.ones(count)
            block=values*(gains*amps*declick*.9)[:,None]
            block=np.clip(block,-1.,1.)
            rendered_peak=max(rendered_peak,float(np.max(np.abs(block))))
            writer.writeframesraw(np.rint(block*32767).astype('<i2').tobytes())
    return {'output':str(output.resolve()),'input':str(path),'sampleRate':sample_rate,'sourceRate':src_rate,'channels':pcm.shape[1],'frames':total_frames,'seconds':total_frames/sample_rate,'loops':loops,'peak':round(rendered_peak,6),'interpolation':interpolation}
