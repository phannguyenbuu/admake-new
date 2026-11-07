"""Exercise image proxy handlers without importing unrelated AI runtimes."""
import ast
from pathlib import Path
from types import SimpleNamespace
import pytest
from flask import Flask

@pytest.mark.parametrize('name,method,path',[
 ('api_genai_status','get','status'),('api_genai_job_create','post','jobs/create'),
 ('api_genai_job_edit_full','post','jobs/edit-full'),('api_genai_job_edit_inpaint','post','jobs/edit-inpaint'),
 ('api_genai_job_get','get','jobs/test-image-job'),('api_genai_gallery','get','gallery')])
def test_image_requests_stay_on_admake(name,method,path):
 tree=ast.parse((Path(__file__).parents[1]/'api/ai.py').read_text(encoding='utf-8'))
 node=next(n for n in tree.body if isinstance(n,ast.FunctionDef) and n.name==name);node.decorator_list=[]
 calls=[]
 def forward(url,**kwargs):
  calls.append((url,kwargs));return SimpleNamespace(json=lambda:{'ok':True},status_code=200)
 from flask import request,jsonify
 scope={'request':request,'jsonify':jsonify,'requests':SimpleNamespace(get=forward,post=forward),'IMAGE_BRIDGE_URL':'http://127.0.0.1:6002'}
 exec(compile(ast.Module(body=[node],type_ignores=[]),'image-route','exec'),scope)
 app=Flask(__name__)
 with app.test_request_context(method=method.upper(),json={'prompt':'replace sign text','reference_images':['source-image']}):
  args=('test-image-job',) if name=='api_genai_job_get' else ()
  response,status=scope[name](*args)
  assert status==200
 assert calls[0][0]=='http://127.0.0.1:6002/api/'+path
 if method=='post':assert calls[0][1]['json']['reference_images']==['source-image']
