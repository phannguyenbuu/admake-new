"""Private console boundary checks; no production users or browsers."""
import importlib.util
import sys
import types
from pathlib import Path
import pytest
from flask import Flask, abort, request
from itsdangerous import URLSafeTimedSerializer

@pytest.fixture
def console(monkeypatch):
    actors={'admin':types.SimpleNamespace(id='admin',is_active=True,role_id=-2,lead_id=243,password='test-only'),
            'user':types.SimpleNamespace(id='user',is_active=True,role_id=1,lead_id=243,password='test-only')}
    models=types.ModuleType('models')
    models.User=object
    models.db=types.SimpleNamespace(session=types.SimpleNamespace(get=lambda cls, uid:actors.get(uid)))
    monkeypatch.setitem(sys.modules,'models',models)
    permissions=types.ModuleType('permission_utils')
    def actor():
        uid=request.headers.get('Authorization')
        if uid not in actors:abort(401)
        return actors[uid]
    permissions.require_authenticated_user=actor
    monkeypatch.setitem(sys.modules,'permission_utils',permissions)
    path=Path(__file__).parents[1]/'api/genai_admin.py'
    spec=importlib.util.spec_from_file_location('isolated_genai_admin',path)
    module=importlib.util.module_from_spec(spec);spec.loader.exec_module(module)
    monkeypatch.setattr(module,'signer',lambda:URLSafeTimedSerializer('test-only-secret',salt='admake-genai-console-v1'))
    app=Flask(__name__);app.config['TESTING']=True;app.register_blueprint(module.genai_admin_bp)
    return app.test_client(),module

def test_desktop_auth_rejects_anonymous_and_non_admin(console):
    c,m=console
    assert c.get('/lead-manage/genai/auth').status_code==401
    assert c.post('/lead-manage/genai/session',headers={'Authorization':'user'}).status_code==403
    assert c.get('/lead-manage/genai/api/status').status_code==401

def test_admin_session_is_secure_and_allows_read_proxy(console,monkeypatch):
    c,m=console
    r=c.post('/lead-manage/genai/session',headers={'Authorization':'admin'},base_url='https://admake.vn')
    assert r.status_code==200
    cookie=r.headers['Set-Cookie']
    assert 'HttpOnly' in cookie and 'Secure' in cookie and 'SameSite=Strict' in cookie
    assert c.get('/lead-manage/genai/auth',base_url='https://admake.vn').status_code==204
    calls=[]
    def proxy(method,url,**kwargs):
        calls.append(url)
        return types.SimpleNamespace(content=b'{"status":"online"}',status_code=200)
    monkeypatch.setattr(m.requests,'request',proxy)
    assert c.get('/lead-manage/genai/api/status',base_url='https://admake.vn').json['status']=='online'
    assert calls==['http://127.0.0.1:6002/api/status']
    assert c.get('/lead-manage/genai/api/workers/delete',base_url='https://admake.vn').status_code==404
    assert c.post('/lead-manage/genai/api/jobs/create',base_url='https://admake.vn',json={'prompt':'test'},headers={'Origin':'https://evil.example'}).status_code==403

def test_tampered_session_denied(console):
    c,m=console
    c.set_cookie('admake_genai_admin','tampered',domain='admake.vn')
    assert c.get('/lead-manage/genai/auth',base_url='https://admake.vn').status_code==401


def test_private_console_link_is_single_use_and_has_no_erp_identity(console, monkeypatch, tmp_path):
    import hashlib
    c,m=console
    token=m.signer().dumps({'scope':'console-access','nonce':'test-once'})
    ticket=tmp_path/hashlib.sha256(token.encode()).hexdigest()
    ticket.write_text('pending')
    monkeypatch.setattr(m,'Path',lambda value:tmp_path if str(value)=='/var/lib/admake-genai/operator-tickets' else Path(value))
    r=c.post('/lead-manage/genai/access',json={'ticket':token},base_url='https://admake.vn')
    assert r.status_code==200
    assert c.get('/lead-manage/genai/auth',base_url='https://admake.vn').status_code==204
    assert c.post('/lead-manage/genai/access',json={'ticket':token},base_url='https://admake.vn').status_code==401
    assert c.post('/lead-manage/genai/access',json={'ticket':'invalid'},base_url='https://admake.vn').status_code==401


def test_connection_code_requires_no_admake_account(console, monkeypatch, tmp_path):
    c,m=console
    key=tmp_path/'connect.key';key.write_text('test-connection-only')
    monkeypatch.setattr(m,'Path',lambda value:key if str(value)=='/etc/admake-genai-connect.key' else Path(value))
    assert c.post('/lead-manage/genai/session',json={'connection_code':'wrong'},base_url='https://admake.vn').status_code==401
    assert c.post('/lead-manage/genai/session',json={'connection_code':'test-connection-only'},base_url='https://admake.vn',headers={'Origin':'https://evil.example'}).status_code==403
    assert c.post('/lead-manage/genai/session',json={'connection_code':'test-connection-only'},base_url='https://admake.vn').status_code==200
    assert c.get('/lead-manage/genai/auth',base_url='https://admake.vn').status_code==204


def test_connection_code_behind_tls_proxy(console, monkeypatch, tmp_path):
    c,m=console
    key=tmp_path/'connect.key';key.write_text('proxy-test-code')
    monkeypatch.setattr(m,'Path',lambda value:key if str(value)=='/etc/admake-genai-connect.key' else Path(value))
    headers={'Origin':'https://admake.vn','X-Forwarded-Proto':'https'}
    assert c.post('/lead-manage/genai/session',json={'connection_code':'proxy-test-code'},base_url='http://admake.vn',headers=headers).status_code==200
    headers['Origin']='https://evil.example'
    assert c.post('/lead-manage/genai/session',json={'connection_code':'proxy-test-code'},base_url='http://admake.vn',headers=headers).status_code==403
