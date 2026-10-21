import copy
import json
import math
import subprocess
import sys
import tempfile
import unittest
from pathlib import Path
import numpy as np
import wave
from groove_scratch.project import make, check, apply, load, save
from groove_scratch.patterns import KINDS, generate, interpolate
from groove_scratch.audio import render

BASE=Path(__file__).resolve().parents[1]

class ScratchTests(unittest.TestCase):
    def setUp(self):
        self.tmp=tempfile.TemporaryDirectory(); self.root=Path(self.tmp.name)
        sr=24000
        t=np.arange(sr)/sr
        pcm=(.3*np.sin(t*2*np.pi*440)).astype('float32')
        with wave.open(str(self.root/'sample.wav'),'wb') as wav:
            wav.setnchannels(1);wav.setsampwidth(2);wav.setframerate(sr);wav.writeframesraw(np.rint(pcm*32767).astype('<i2').tobytes())
        self.doc=make('sample.wav',0,.8,100,2.4,title='Example')
        self.path=self.root/'project.json'
    def tearDown(self):self.tmp.cleanup()
    def test_project_roundtrip_and_validation(self):
        save(self.doc,self.path)
        self.assertEqual(load(self.path),self.doc)
        bad=copy.deepcopy(self.doc);bad['automation']['position'][0]['p']=float('nan')
        with self.assertRaises(ValueError):check(bad)
        bad=copy.deepcopy(self.doc);bad['timeline']['durationSeconds']=0
        with self.assertRaises(ValueError):check(bad)
        bad=copy.deepcopy(self.doc);bad['automation']['gain'].reverse()
        with self.assertRaises(ValueError):check(bad)
    def test_all_eight_patterns(self):
        for kind in KINDS:
            with self.subTest(kind=kind):
                p,g=generate(kind,.4,2.,.2,.8,2)
                self.assertAlmostEqual(p[0]['t'],.4)
                self.assertAlmostEqual(p[-1]['t'],2.)
                self.assertTrue(all(.2<=n['p']<=.8 for n in p))
                self.assertTrue(all(0<=n['v']<=1 for n in g))
                d=apply(copy.deepcopy(self.doc),kind,.4,2.,.2,.8,2)
                self.assertEqual(d['patterns'][0]['kind'],kind)
                self.assertTrue(len(d['automation']['position'])>=len(p))
                self.assertAlmostEqual(interpolate(d['automation']['position'],.2,'p',0),.2/2.4)
    def test_loud_silent_and_reverse_wav(self):
        p=apply(copy.deepcopy(self.doc),'orbit2',.1,2.2,.1,.9,3)
        wav=self.root/'bounce.wav';meta=render(p,self.path,wav,24000,loops=2)
        with wave.open(str(wav),'rb') as handle:
            sr=handle.getframerate();pcm=np.frombuffer(handle.readframes(handle.getnframes()),dtype='<i2')
        self.assertEqual(sr,24000);self.assertEqual(len(pcm),115200)
        self.assertGreater(np.abs(pcm).max(),.01)
        self.assertEqual(meta['loops'],2)
        p['automation']['gain']=[{'t':0,'v':0},{'t':2.4,'v':0}]
        render(p,self.path,self.root/'silent.wav',24000,interpolation='linear')
        with wave.open(str(self.root/'silent.wav'),'rb') as handle:
            silence=np.frombuffer(handle.readframes(handle.getnframes()),dtype='<i2')
        self.assertEqual(float(np.max(np.abs(silence))),0)
    def test_speed_diagnostics_fit_and_strict_guard(self):
        from groove_scratch.project import speed_diagnostics
        from groove_scratch.patterns import splice
        # Regression: after a pattern fills the entire timeline its final
        # endpoint MUST remain the inserted endpoint, not an old 1.0 seek.
        d=apply(copy.deepcopy(self.doc),'baby',0,2.4,.1,.18,8)
        self.assertAlmostEqual(d['automation']['position'][-1]['p'],.1)
        details=speed_diagnostics(d['automation']['position'],.8)
        self.assertLess(details['maxPlaybackRate'],1.)
        # One-second source jump in 0.01s is a 100x scratch, not a 1x stroke.
        result=speed_diagnostics([{'t':0,'p':0},{'t':.01,'p':1}],1.)
        self.assertAlmostEqual(result['maxPlaybackRate'],100.)
        self.assertAlmostEqual(result['secondsAboveThreshold'],.01)
        def call(*args):
            import os
            env=dict(os.environ,PYTHONPATH=str(BASE))
            return subprocess.run([sys.executable,'-m','groove_scratch',*args],capture_output=True,text=True,env=env)
        inp=self.root/'start.json';safe=self.root/'fitted.json'
        save(make('sample.wav',0,.8,120,2.),inp)
        p=call('apply','--input',str(inp),'--output',str(safe),'--kind','baby',
               '--time-start','0','--time-end','2','--sample-start','.1',
               '--sample-end','.95','--repeats','8','--target-speed','1.0')
        self.assertEqual(p.returncode,0,p.stderr)
        obj=json.loads(p.stdout)
        self.assertLess(obj['sampleEnd'],.95)
        self.assertLessEqual(obj['maxPlaybackRate'],1.00001)
        p=call('validate','--input',str(safe),'--max-speed','1.1')
        self.assertEqual(p.returncode,0,p.stderr)
        p=call('validate','--input',str(inp),'--max-speed','.1')
        self.assertNotEqual(p.returncode,0)
        self.assertIn('exceeds',p.stderr)

    def test_shaping_flags_preserve_v1_project_and_fit_speed(self):
        import os
        root=self.root
        def call(*args):
            process=subprocess.run([sys.executable,'-m','groove_scratch',*args],
                                   capture_output=True,text=True,env=dict(os.environ,PYTHONPATH=str(BASE)))
            self.assertEqual(process.returncode,0,process.stderr)
            return json.loads(process.stdout)
        raw=root/'raw.json'; shaped=root/'shaped.json'
        save(make('sample.wav',0,.8,120,duration=2),raw)
        p=call('apply','--input',str(raw),'--output',str(shaped),
               '--kind','orbit2','--time-start','0','--time-end','2',
               '--sample-start','.1','--sample-end','.9','--repeats','4',
               '--flank','2.5','--stroke-bias','.65','--click-width','2',
               '--target-speed','1.0')
        self.assertLessEqual(p['maxPlaybackRate'],1.00001)
        self.assertEqual(p['flank'],2.5)
        self.assertEqual(p['strokeBias'],.65)
        self.assertEqual(p['clickWidth'],2)
        loaded=load(shaped)
        self.assertEqual(loaded['version'],1)
        self.assertEqual(set(loaded['patterns'][0]),{'kind','timeStart','timeEnd','sampleStart','sampleEnd','repeats'})
        self.assertGreater(len(loaded['automation']['position']),8)
        self.assertTrue(call('validate','--input',str(shaped),'--max-speed','1.1')['valid'])

    def test_source_hash_rejects_mismatch(self):
        self.doc['source']['sha256']='0'*64
        with self.assertRaisesRegex(ValueError,'SHA256'):render(self.doc,self.path,self.root/'invalid.wav')
    def test_cli_machine_json_pipeline(self):
        def call(*args):
            env={'PYTHONPATH':str(BASE)}
            p=subprocess.run([sys.executable,'-m','groove_scratch',*args],capture_output=True,text=True,env=env)
            self.assertEqual(p.returncode,0,p.stderr)
            return json.loads(p.stdout)
        first=self.root/'first.json';second=self.root/'second.json';wav=self.root/'output.wav'
        p=call('new','--source',str(self.root/'sample.wav'),'--end','.8','--bpm','120','--bars','2','--output',str(first))
        self.assertTrue(p['ok'])
        p=call('apply','--input',str(first),'--output',str(second),'--kind','flare1','--time-start','0','--time-end','2','--sample-start','.1','--sample-end','.9','--repeats','2','--snap')
        self.assertEqual(p['patterns'],1)
        p=call('validate','--input',str(second),'--check-audio');self.assertTrue(p['valid'])
        p=call('render','--input',str(second),'--output',str(wav),'--sample-rate','24000','--interpolation','linear')
        self.assertTrue(wav.exists());self.assertEqual(p['frames'],96000)
        p=call('inspect','--input',str(second));self.assertEqual(p['patternCount'],1)
        p=call('patterns');self.assertEqual(len(p['values']),8)

if __name__=='__main__':unittest.main()
