"""Headless Node VM tests of the real browser v1 export/import functions."""
import json
from pathlib import Path
from groove_scratch.project import make, apply
import subprocess
import unittest

ROOT=Path(__file__).resolve().parents[1]

class BrowserJSONTests(unittest.TestCase):
    def test_browser_project_v1_export_import(self):
        script=r'''
const assert=require('node:assert/strict'),vm=require('node:vm'),fs=require('node:fs');
const source=fs.readFileSync(process.argv[1],'utf8');
const project=JSON.parse(process.argv[2]);
const part=source.slice(source.indexOf('function normalizedExportTrack('),source.indexOf('async function importJSON('));
const messages=[];
const elements=new Proxy({}, {get:(o,k)=>o[k]||(o[k]={value:'',checked:false})});
const context={Math,Number,JSON,Array,URL:{createObjectURL:()=> 'blob:local',revokeObjectURL:()=>{}},
  Blob:class {constructor(parts){context.lastBlob=parts.join('');}},
  document:{createElement:()=>({href:'',download:'',click(){}})},
  setTimeout:()=>{},
  $:id=>elements[id],info:(message,error)=>messages.push({message,error}),
  clamp:(v,a,b)=>Math.min(b,Math.max(a,v)),
  buffer:{duration:1.2},current:{name:'demo-ah.wav'},
  clip:{start:.03,end:.95},motion:[{t:0,p:.1},{t:2.4,p:.9}],
  volume:[{t:0,v:1},{t:2.4,v:1}],motionDuration:2.4,
  settings:{bpm:100,gridDivision:16,autoLoop:true},patternHistory:[],
  stopAutomation(){},stopPreview(){},stopRecording(){},syncEngineSettings(){},updateTrim(){},updateMotionStats(){},markSave(){},
  sanitizeVolume:(points)=>points
};
vm.runInNewContext(part,context);
vm.runInNewContext('exportJSON()',context);
const out=JSON.parse(context.lastBlob);
assert.equal(out.format,'groove-scratch-project');assert.equal(out.version,1);
assert.equal(out.source.path,'demo-ah.wav');assert.equal(out.timeline.durationSeconds,2.4);
assert.equal(out.automation.position.length,2);
project.selection={startSeconds:0.10,endSeconds:.88};
project.tempo.bpm=127; project.timeline.durationSeconds=2.4;
vm.runInNewContext(source.slice(source.indexOf('async function importJSON('),source.indexOf('// Generate a scratch-friendly')),context);
context.importJSON({text:async()=>JSON.stringify(project)}).then(()=>{
  assert.equal(context.settings.bpm,127);assert.equal(context.clip.start,.1);
  assert.equal(context.motionDuration,2.4);assert.equal(context.motion.length,project.automation.position.length);
  assert.equal(context.volume.length,project.automation.gain.length);
  assert.equal(context.patternHistory.length,1);
  assert.ok(!messages.some(m=>m.error));
  const bad={...project,version:2};
  assert.throws(()=>context.validateProjectImport(bad),/unsupported format/);
  console.log(JSON.stringify({ok:true,importedNodes:context.motion.length,gainNodes:context.volume.length}));
}).catch(e=>{console.error(e);process.exit(1)});
'''
        example=make('demo-ah.wav',.03,.95,100,duration=2.4,title='Test')
        apply(example,'orbit2',0,2.4,.08,.92,repeats=4)
        r=subprocess.run(['node','-e',script,str(ROOT/'index.html'),json.dumps(example)],capture_output=True,text=True)
        self.assertEqual(r.returncode,0,r.stderr)
        self.assertTrue(json.loads(r.stdout)['ok'])

if __name__=='__main__':unittest.main()
