import importlib.util
from pathlib import Path
import pytest

@pytest.fixture
def console(tmp_path):
 p=Path(__file__).parents[1]/'deploy/genai-desktop/console_server.py'
 spec=importlib.util.spec_from_file_location('genai_desktop_console_test',p)
 module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
 module.state=tmp_path
 (tmp_path/'session.key').write_text('test-session-secret')
 (tmp_path/'connect.key').write_text('test-connection-code')
 module.app.config['TESTING']=True
 return module.app.test_client(),module

def test_desktop_requires_connection_code(console):
 c,m=console
 assert c.get('/vps-console/auth').status_code==401
 assert c.get('/vps-console/api/jobs').status_code==401
 headers={'Origin':'https://genai.toolxprint.com','X-Forwarded-Proto':'https'}
 r=c.post('/vps-console/session',base_url='http://genai.toolxprint.com',json={'connection_code':'test-connection-code'},headers=headers)
 assert r.status_code==200
 assert all(flag in r.headers['Set-Cookie'] for flag in ['Secure','HttpOnly','SameSite=Strict'])
 assert c.get('/vps-console/auth',base_url='https://genai.toolxprint.com').status_code==204
 assert c.post('/vps-console/api/workers/delete',base_url='https://genai.toolxprint.com',headers={'Origin':'https://genai.toolxprint.com'}).status_code==404

def test_foreign_origin_and_bad_codes_rejected(console):
 c,m=console
 url='https://genai.toolxprint.com'
 assert c.post('/vps-console/session',base_url=url,json={'connection_code':'test-connection-code'},headers={'Origin':'https://evil.example'}).status_code==403
 for _ in range(5):
  assert c.post('/vps-console/session',base_url=url,json={'connection_code':'wrong'},headers={'Origin':url}).status_code==401
 assert c.post('/vps-console/session',base_url=url,json={'connection_code':'test-connection-code'},headers={'Origin':url}).status_code==429


def test_window_controls_maximize_and_cycle_only_chrome(console, monkeypatch):
 c,m=console
 base='https://genai.toolxprint.com';headers={'Origin':base}
 calls=[]
 def command(*args):
  calls.append(args)
  if args==('wmctrl','-lx'):return '0x00000001 0 chromium-browser.Profile host Chrome\n0x00000002 0 chromium-browser.Profile host Chrome\n0x00000003 0 terminal.Terminal host Shell\n'
  if args[0]=='xprop':return '_NET_ACTIVE_WINDOW(WINDOW): window id # 0x1'
  return ''
 monkeypatch.setattr(m,'desktop_command',command)
 assert c.post('/vps-console/windows/switch',base_url=base,headers=headers).status_code==401
 c.post('/vps-console/session',base_url=base,json={'connection_code':'test-connection-code'},headers=headers)
 assert c.post('/vps-console/windows/maximize-all',base_url=base,headers=headers).json=={'ok':True,'count':2}
 assert ('wmctrl','-ir','0x00000001','-b','add,maximized_vert,maximized_horz') in calls
 assert c.post('/vps-console/windows/switch',base_url=base,headers=headers).status_code==200
 assert calls[-1]==('wmctrl','-ia','0x00000002')
 assert c.post('/vps-console/windows/switch',base_url=base,headers={'Origin':'https://evil.example'}).status_code==403
 assert c.post('/vps-console/windows/delete',base_url=base,headers=headers).status_code==404
