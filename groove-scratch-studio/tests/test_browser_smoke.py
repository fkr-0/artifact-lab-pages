"""Optional browser integration smoke (requires playwright and chromium)."""
import functools
import http.server
import json
from pathlib import Path
import socketserver
import tempfile
import threading
import unittest

ROOT=Path(__file__).resolve().parents[1]

class BrowserTests(unittest.TestCase):
    def test_import_export_project_v1(self):
        try: from playwright.sync_api import sync_playwright
        except ImportError: self.skipTest('playwright is not installed')
        class Server(socketserver.ThreadingMixIn,http.server.HTTPServer):daemon_threads=True
        handler=functools.partial(http.server.SimpleHTTPRequestHandler,directory=str(ROOT))
        with Server(('127.0.0.1',0),handler) as srv:
            thread=threading.Thread(target=srv.serve_forever,daemon=True);thread.start()
            try:
                with sync_playwright() as p:
                    browser=p.chromium.launch(headless=True,executable_path='/usr/bin/chromium',args=['--no-sandbox'])
                    context=browser.new_context(accept_downloads=True)
                    page=context.new_page()
                    errors=[]
                    page.on('pageerror',lambda e:errors.append(str(e)))
                    try:
                        page.goto(f'http://127.0.0.1:{srv.server_port}/',wait_until='load')
                    except Exception as exc:
                        if 'ERR_BLOCKED_BY_ADMINISTRATOR' in str(exc):
                            browser.close();self.skipTest('Browser environment blocks local HTTP navigation')
                        raise
                    page.get_by_role('button',name='＋ GENERATE DEMO').click()
                    page.wait_for_function('window.__grooveTest.getState().bufferDuration > 2',timeout=20000)
                    page.locator('#useBtn').click()
                    page.locator('[data-tab="edit"]').click()
                    page.wait_for_timeout(500)
                    with page.expect_download(timeout=10000) as d:
                        page.locator('#exportBtn').click()
                    download=d.value
                    with tempfile.TemporaryDirectory() as tmp:
                        target=Path(tmp)/'project.json';download.save_as(target)
                        doc=json.loads(target.read_text())
                        self.assertEqual(doc['format'],'groove-scratch-project')
                        self.assertEqual(doc['version'],1)
                        self.assertEqual(doc['source']['path'],'groove-demo-ah.wav')
                        self.assertEqual(doc['timeline']['durationSeconds'],doc['automation']['gain'][-1]['t'])
                        # Import a programmatically generated curve and prove no times are rescaled.
                        dur=doc['timeline']['durationSeconds']
                        doc['automation']['position']=[{'t':0,'p':.2},{'t':dur/2,'p':.8},{'t':dur,'p':.2}]
                        doc['automation']['gain']=[{'t':0,'v':1},{'t':dur/2,'v':0},{'t':dur,'v':1}]
                        page.locator('#importInput').set_input_files({'name':'in.json','mimeType':'application/json','buffer':json.dumps(doc).encode()})
                        page.wait_for_function('window.__grooveTest.getState().motionNodes === 3',timeout=10000)
                        state=page.evaluate('window.__grooveTest.getState()')
                        self.assertEqual(state['volumeNodes'],3)
                        self.assertAlmostEqual(state['motionDuration'],dur)
                        self.assertEqual(state['barMode'],'recorded')
                    self.assertEqual(errors,[])
                    browser.close()
            finally:srv.shutdown();thread.join(3)

if __name__=='__main__':unittest.main()
