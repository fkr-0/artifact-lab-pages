"""Prove Python generators agree with the actual browser generator code."""
import json
from pathlib import Path
import subprocess
import unittest
from groove_scratch.patterns import generate,KINDS

ROOT=Path(__file__).resolve().parents[1]

class ParityTests(unittest.TestCase):
    def test_browser_python_numeric_parity(self):
        html=(ROOT/'index.html').read_text()
        js='function generateScratchPattern('+html.split('function generateScratchPattern(',1)[1].split('// END SCRATCH PATTERN GENERATOR',1)[0]
        script=js+'\nconsole.log(JSON.stringify(['+','.join('generateScratchPattern('+json.dumps(k)+',.1,2.2,.13,.9,3)' for k in KINDS)+']))'
        node=subprocess.run(['node','-e',script],capture_output=True,text=True,check=True)
        variants=json.loads(node.stdout)
        for kind,payload in zip(KINDS,variants):
            with self.subTest(kind=kind):
                position,gain=generate(kind,.1,2.2,.13,.9,3)
                for a,b in ((position,payload['points']),(gain,payload['volume'])):
                    self.assertEqual(len(a),len(b))
                    for x,y in zip(a,b):
                        self.assertEqual(set(x),set(y))
                        for key in x:self.assertAlmostEqual(x[key],y[key],places=8)


    def test_custom_shaping_browser_python_parity(self):
        html=(ROOT/'index.html').read_text()
        js='function generateScratchPattern('+html.split('function generateScratchPattern(',1)[1].split('// END SCRATCH PATTERN GENERATOR',1)[0]
        for kind in KINDS:
            with self.subTest(kind=kind):
                params={'sharpness':2.4,'bias':.65,'cutWidth':1.8}
                call='generateScratchPattern('+json.dumps(kind)+',.1,2.2,.13,.9,3,'+json.dumps(params)+')'
                node=subprocess.run(['node','-e',js+'\nconsole.log(JSON.stringify('+call+'))'],capture_output=True,text=True,check=True)
                payload=json.loads(node.stdout)
                position,gain=generate(kind,.1,2.2,.13,.9,3,2.4,.65,1.8)
                for left,right in ((position,payload['points']),(gain,payload['volume'])):
                    self.assertEqual(len(left),len(right))
                    for x,y in zip(left,right):
                        for key in x:self.assertAlmostEqual(x[key],y[key],places=8)
