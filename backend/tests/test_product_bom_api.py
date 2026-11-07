"""Exercise real API persistence/confirmations using an isolated SQLite schema."""
import importlib.util
import sys
import types
from pathlib import Path

import pytest
from flask import Flask, abort, request
from flask_sqlalchemy import SQLAlchemy

ROOT = Path(__file__).resolve().parents[1]


@pytest.fixture
def client(tmp_path, monkeypatch):
    app = Flask(__name__, static_folder=str(tmp_path / "static"))
    app.config.update(SQLALCHEMY_DATABASE_URI="sqlite://", TESTING=True)
    db = SQLAlchemy(app)

    class Base(db.Model):
        __abstract__ = True
        id = db.Column(db.String, primary_key=True)
        deletedAt = db.Column(db.DateTime)
        updatedAt = db.Column(db.DateTime)
        version = db.Column(db.Integer, default=1)

    class ProductFormula(Base):
        name = db.Column(db.String)
        category = db.Column(db.String)
        image_url = db.Column(db.String)
        definition = db.Column(db.JSON)
        is_published = db.Column(db.Boolean, default=False)

    class ProductQuotation(Base):
        lead_id = db.Column(db.Integer)
        user_id = db.Column(db.String)
        product_id = db.Column(db.String)
        payload = db.Column(db.JSON)
        stage = db.Column(db.Integer, default=0)

    class InventoryItem(Base):
        lead_id = db.Column(db.Integer)
        is_active = db.Column(db.Boolean, default=True)
        code = db.Column(db.String)
        name = db.Column(db.String)
        unit = db.Column(db.String)
        min_stock_level = db.Column(db.Float, default=0)
        standard_cost = db.Column(db.Float)
        average_cost = db.Column(db.Float)
        spec_rows = db.Column(db.JSON, default=list)

    class InventoryBalance(Base):
        lead_id = db.Column(db.Integer)
        item_id = db.Column(db.String)
        warehouse_id = db.Column(db.String)
        quantity_on_hand = db.Column(db.Float)
        average_cost = db.Column(db.Float)
        inventory_value = db.Column(db.Float)

    fake_models = types.ModuleType("models")
    for name, value in locals().copy().items():
        if name in ("db", "ProductFormula", "ProductQuotation", "InventoryItem", "InventoryBalance"):
            setattr(fake_models, name, value)
    monkeypatch.setitem(sys.modules, "models", fake_models)
    permissions = types.ModuleType("permission_utils")

    def require_can_view(permission):
        token = request.headers.get("Authorization", "")
        if not token:
            abort(401)
        actor = types.SimpleNamespace(id="admin" if token == "admin" else "user", role_id=-2 if token == "admin" else 1,
                                      lead_id=243 if token == "admin" else 375)
        return actor, {}
    permissions.require_can_view = require_can_view
    monkeypatch.setitem(sys.modules, "permission_utils", permissions)
    package = types.ModuleType("bom_test_package")
    package.__path__ = [str(ROOT / "api")]
    monkeypatch.setitem(sys.modules, package.__name__, package)
    for name in ("product_formula_engine", "product_bom"):
        spec = importlib.util.spec_from_file_location(f"{package.__name__}.{name}", ROOT / "api" / f"{name}.py")
        module = importlib.util.module_from_spec(spec)
        monkeypatch.setitem(sys.modules, spec.name, module)
        spec.loader.exec_module(module)
    app.register_blueprint(module.product_bom_bp)
    with app.app_context():
        db.create_all()
        db.session.add(InventoryItem(id="master", lead_id=243, code="AL", name="Alu", unit="tấm", standard_cost=100))
        db.session.add(InventoryItem(id="other", lead_id=999, code="SECRET", name="Private", unit="bộ", standard_cost=1))
        db.session.commit()
    yield app.test_client()


def definition():
    return {"defaults": {"L": 60, "H": 80, "W": 6, "F": 1, "count": 1}, "parameters": [],
            "lines": [{"id": "face", "code": "AL", "formula": "A*F", "kind": "material"}]}


def product(client, published=True):
    response = client.post('/api/product-bom/admin/products', headers={"Authorization": "admin"}, json={
        "name": "Test product", "category": "Test", "definition": definition(), "is_published": published, "confirmed": published})
    assert response.status_code == 200, response.json
    return response.json


def test_size_limits_price_floor_and_snapshot_are_enforced_by_server(client):
    item=product(client)
    recipe=definition()
    recipe['constraints']={'dimensions':{'L':{'min':10,'max':100},'H':{'min':10,'max':100},'W':{'min':.5,'max':20}},
                           'minimum_unit_price':500000,'minimum_order_price':0}
    saved=client.put('/api/product-bom/admin/products/'+item['id'],headers={'Authorization':'admin'},json={
        'name':item['name'],'definition':recipe,'version':item['version'],'is_published':True,'confirmed':True})
    assert saved.status_code==200
    body={'product_id':item['id'],'dimensions':recipe['defaults'],'minimum_unit_price':0}
    outside=client.post('/api/product-bom/preview',headers={'Authorization':'user'},json={**body,'dimensions':{**recipe['defaults'],'L':9}})
    assert outside.status_code==400 and 'Ngang' in outside.json['error']
    preview=client.post('/api/product-bom/preview',headers={'Authorization':'user'},json=body)
    assert preview.status_code==200 and preview.json['total']==500000
    quote=client.post('/api/product-bom/quotes',headers={'Authorization':'user'},json=body).json
    assert quote['payload']['result']['minimum_adjustment']>0
    recipe['constraints']['minimum_unit_price']=900000
    updated=client.put('/api/product-bom/admin/products/'+item['id'],headers={'Authorization':'admin'},json={
        'name':item['name'],'definition':recipe,'version':saved.json['version'],'is_published':True,'confirmed':True})
    assert updated.status_code==200
    opened=client.get('/api/product-bom/quotes/'+quote['id'],headers={'Authorization':'user'})
    assert opened.json['payload']['result']['total']==500000
    stale=client.post('/api/product-bom/quotes/'+quote['id']+'/confirm',headers={'Authorization':'user'},json={'version':quote['version'],'step':0})
    assert stale.status_code==409


def draft(p):
    return {"product_id": p["id"], "dimensions": p["definition"]["defaults"], "parameters": {},
            "overrides": {}, "extras": [], "markup": 30, "vat": 0}


def test_classify_prompt_matches_library_and_filters_metadata(client, monkeypatch):
    p = product(client)
    import requests
    calls = []

    def post(url, **kwargs):
        calls.append(kwargs["json"])
        return types.SimpleNamespace(raise_for_status=lambda: None, json=lambda: {
            "success": True, "model": "internal-engine", "product_id": "invented-id",
            "mau_admake_tuong_ung": p["name"], "ten_loai_bang_hieu": "Bảng hiệu",
            "vat_lieu_chu_dao": [{"code": "AL", "ten": "Alu", "model": "internal-engine"}, None]})

    monkeypatch.setattr(requests, "post", post)
    response = client.post('/api/product-bom/classify', headers={"Authorization": "user"},
                           json={"text": "lam bang alu", "mode": "standard"})
    assert response.status_code == 200
    assert response.json["product_id"] == p["id"]
    assert response.json["vat_lieu_chu_dao"] == [{"code": "AL", "ten": "Alu"}]
    assert "internal-engine" not in response.get_data(as_text=True)
    assert calls == [{"text": "lam bang alu", "mode": "standard"}]


def test_classify_validates_input_and_hides_service_errors(client, monkeypatch):
    import requests
    assert client.post('/api/product-bom/classify', json={"text": "test"}).status_code == 401
    for payload in ({"text": ""}, {"text": "test", "mode": "unknown"}, {"text": "a" * 4001}):
        assert client.post('/api/product-bom/classify', headers={"Authorization": "user"}, json=payload).status_code == 400

    def fail(*args, **kwargs):
        raise requests.Timeout("private engine details")

    monkeypatch.setattr(requests, "post", fail)
    p = product(client)
    response = client.post('/api/product-bom/classify', headers={"Authorization": "user"}, json={"text": "xyz không có từ khớp"})
    assert response.status_code == 200
    assert response.json['product_id'] == p['id']
    assert response.json['fallback'] is True
    assert "private engine" not in response.get_data(as_text=True)


def test_classify_without_template_returns_one_library_match(client, monkeypatch):
    p = product(client)
    import requests
    monkeypatch.setattr(requests, "post", lambda *args, **kwargs: types.SimpleNamespace(
        raise_for_status=lambda: None, json=lambda: {"success": True, "ten_loai_bang_hieu": "Test product"}))
    response = client.post('/api/product-bom/classify', headers={"Authorization": "user"}, json={"text": "test product"})
    assert response.json["product_id"] == p["id"]


def test_classify_provides_five_unique_library_candidates(client, monkeypatch):
    ids = {product(client)['id'] for _ in range(6)}
    import requests
    monkeypatch.setattr(requests, 'post', lambda *args, **kwargs: types.SimpleNamespace(
        raise_for_status=lambda: None, json=lambda: {'success': True, 'mau_admake_tuong_ung': 'Test product'}))
    response = client.post('/api/product-bom/classify', headers={'Authorization': 'user'}, json={'text': 'test product'})
    assert response.status_code == 200
    candidates = response.json['candidate_ids']
    assert len(candidates) == len(set(candidates)) == 5
    assert set(candidates) <= ids
    assert candidates[0] == response.json['product_id']


def test_sign_copy_persists_and_edit_requires_reconfirmation(client):
    p = product(client)
    payload = {**draft(p), "brief": {"sign_content": "TIỆM VÀNG\nHotline 0123456789", "notes": "Chữ vàng"}}
    q = client.post('/api/product-bom/quotes', headers={"Authorization": "admin"}, json=payload).json
    assert q["payload"]["brief"]["sign_content"] == payload["brief"]["sign_content"]
    q = client.post('/api/product-bom/quotes/' + q['id'] + '/confirm', headers={"Authorization": "admin"},
                    json={"version": q['version'], "step": 0}).json
    payload['brief']['sign_content'] = 'Nội dung mới'
    updated = client.put('/api/product-bom/quotes/' + q['id'], headers={"Authorization": "admin"},
                         json={**payload, "version": q['version']}).json
    assert updated['stage'] == 1
    assert updated['payload']['brief']['sign_content'] == 'Nội dung mới'


def test_generated_image_is_saved_with_quote(client):
    p = product(client)
    payload = {**draft(p), 'brief': {'sign_content': 'ADMAKE', 'generated_image_url': 'https://genai.toolxprint.com/test.png', 'render_signature': '50-123'}}
    q = client.post('/api/product-bom/quotes', headers={'Authorization': 'admin'}, json=payload).json
    reopened = client.get('/api/product-bom/quotes/' + q['id'], headers={'Authorization': 'admin'}).json
    assert reopened['payload']['brief']['generated_image_url'] == payload['brief']['generated_image_url']
    assert reopened['payload']['brief']['render_signature'] == '50-123'


def test_permissions_shared_catalog_and_quote_ownership(client):
    assert client.get('/api/product-bom/catalog').status_code == 401
    assert client.post('/api/product-bom/admin/products', headers={"Authorization": "user"}, json={}).status_code == 403
    response = client.get('/api/product-bom/catalog', headers={"Authorization": "user"})
    assert [r['code'] for r in response.json] == ['AL']
    p = product(client)
    q = client.post('/api/product-bom/quotes', json=draft(p), headers={"Authorization": "admin"}).json
    assert client.get('/api/product-bom/quotes/' + q['id'], headers={"Authorization": "user"}).status_code == 404


def test_all_confirmations_revisions_and_optimistic_lock(client):
    headers = {"Authorization": "admin"}
    p = product(client)
    data = draft(p)
    q = client.post('/api/product-bom/quotes', json=data, headers=headers).json
    path = '/api/product-bom/quotes/' + q['id']
    assert client.post(path + '/confirm', json={"version": q['version'], "step": 3}, headers=headers).status_code == 409
    for step in range(4):
        response = client.post(path + '/confirm', json={"version": q['version'], "step": step}, headers=headers)
        assert response.status_code == 200, response.json
        q = response.json
    assert q['stage'] == 4
    assert len(q['payload']['confirmations']) == 4
    old_version = q['version']
    data['markup'] = 10
    q = client.put(path, json={**data, "version": old_version}, headers=headers).json
    assert q['stage'] == 3  # Only final pricing needs reconfirmation.
    assert client.put(path, json={**data, "version": old_version}, headers=headers).status_code == 409
    data['overrides'] = {"face": {"quantity": 2}}
    q = client.put(path, json={**data, "version": q['version']}, headers=headers).json
    assert q['stage'] == 1
    data['dimensions'] = {**data['dimensions'], "L": 120}
    q = client.put(path, json={**data, "version": q['version']}, headers=headers).json
    assert q['stage'] == 0 and q['payload']['confirmations'] == []


def test_draft_recipe_cannot_finalize_and_bad_formula_cannot_publish(client):
    headers = {"Authorization": "admin"}
    p = product(client, published=False)
    q = client.post('/api/product-bom/quotes', json=draft(p), headers=headers).json
    path = '/api/product-bom/quotes/' + q['id'] + '/confirm'
    for step in range(3):
        q = client.post(path, json={"version": q['version'], "step": step}, headers=headers).json
    assert client.post(path, json={"version": q['version'], "step": 3}, headers=headers).status_code == 400
    bad = definition(); bad['lines'][0]['formula'] = "__import__('os')"
    assert client.post('/api/product-bom/admin/preview', json={"definition": bad}, headers=headers).status_code == 400
    bad['lines'][0]['formula'] = 'A'
    bad['lines'][0]['code'] = 'SECRET'
    assert client.post('/api/product-bom/admin/products', json={"name": "Bad", "definition": bad, "is_published": True, "confirmed": True}, headers=headers).status_code == 400


def test_company_logo_upload_and_quote_brand_persist(client):
    import io
    from PIL import Image
    image = io.BytesIO()
    Image.new('RGBA', (10, 10), (255, 0, 0, 128)).save(image, format='PNG')
    raw = image.getvalue()
    assert client.post('/api/product-bom/company-logo', data={'file': (io.BytesIO(raw), 'logo.png')}).status_code == 401
    uploaded = client.post('/api/product-bom/company-logo', headers={'Authorization': 'user'}, data={'file': (io.BytesIO(raw), 'logo.png')})
    assert uploaded.status_code == 200
    logo = uploaded.json['url']
    assert logo.startswith('/static/product-bom/company-logos/375/')
    saved = Image.open(Path(client.application.static_folder) / logo.removeprefix('/static/'))
    assert saved.mode == 'RGBA' and saved.getpixel((0,0))[3] == 128
    p = product(client)
    body = {**draft(p), 'brief': {'company_name': 'North Star', 'company_address': '123 Test Street',
        'company_phone': '0123456789', 'company_email': 'office@example.com', 'company_logo_url': logo}}
    quote = client.post('/api/product-bom/quotes', headers={'Authorization': 'user'}, json=body)
    assert quote.status_code == 201
    opened = client.get('/api/product-bom/quotes/' + quote.json['id'], headers={'Authorization': 'user'})
    assert opened.json['payload']['brief']['company_name'] == 'North Star'
    assert opened.json['payload']['brief']['company_logo_url'] == logo
    default = client.post('/api/product-bom/quotes', headers={'Authorization': 'user'}, json=draft(p)).json['payload']['brief']
    assert default['company_name'] == 'Admake' and default['company_logo_url'] == '/logo.jpg'
    body['brief']['company_logo_url'] = logo.replace('/375/', '/999/')
    assert client.post('/api/product-bom/quotes', headers={'Authorization': 'user'}, json=body).status_code == 400
    assert client.post('/api/product-bom/company-logo', headers={'Authorization': 'user'}, data={'file': (io.BytesIO(b'not an image'), 'fake.png')}).status_code == 400


def test_catalog_stock_is_scoped_to_current_unit(client):
    models = sys.modules['models']
    with client.application.app_context():
        models.db.session.add(models.InventoryItem(id='own',lead_id=375,code='AL',name='Own Alu',unit='tấm',standard_cost=120))
        models.db.session.add_all([
            models.InventoryBalance(id='b1',lead_id=375,item_id='own',warehouse_id='Kho A',quantity_on_hand=7,average_cost=100,inventory_value=700),
            models.InventoryBalance(id='b2',lead_id=375,item_id='own',warehouse_id='Kho B',quantity_on_hand=3,average_cost=100,inventory_value=300),
            models.InventoryBalance(id='secret-stock',lead_id=999,item_id='master',warehouse_id='Private',quantity_on_hand=999,inventory_value=99900),
        ])
        models.db.session.commit()
    data=client.get('/api/product-bom/catalog',headers={'Authorization':'user'}).json
    item=next(i for i in data if i['code']=='AL')
    assert item['quantity_on_hand']==10 and item['inventory_value']==1000
    assert len(item['balances'])==2
    assert all(b['warehouse_name']!='Private' for b in item['balances'])


def test_public_library_has_default_properties_without_private_inventory(client, tmp_path):
    item = product(client)
    response = client.get('/api/product-bom/library')
    assert response.status_code == 200
    assert response.json['can_manage'] is False
    entry = next(p for p in response.json['products'] if p['id'] == item['id'])
    assert entry['properties']['defaults'] == definition()['defaults']
    assert entry['properties']['materials'][0]['name'] == 'Alu'
    assert 'definition' not in entry
    assert 'standard_cost' not in str(response.json)
    assert 'Private' not in str(response.json)
    assert client.get('/api/product-bom/catalog').status_code == 401
    assert client.post('/api/product-bom/admin/products', json={}).status_code == 401

    client.application.config['PRODUCT_REFERENCE_DIR'] = str(tmp_path)
    pid = 'a' * 32
    (tmp_path / (pid + '-photo-before.png')).write_bytes(b'example-png')
    image = client.get('/api/product-bom/library-image/' + pid + '/before')
    assert image.status_code == 200
    assert image.mimetype == 'image/png'
    assert image.data == b'example-png'
    assert client.get('/api/product-bom/library-image/' + pid + '/invalid').status_code == 404
    assert client.get('/api/product-bom/library-image/not-a-product/before').status_code == 404


def test_library_properties_save_persists_and_preserves_bom(client):
    item = product(client)
    payload = {
        'version': item['version'],
        'defaults': {'L': 120, 'H': 90, 'W': 6, 'F': 2, 'count': 1},
        'constraints': {'dimensions': {k: {'min': 1} for k in ('L','H','W')},
                        'minimum_unit_price': 250000, 'minimum_order_price': 500000},
        'materials_text': 'Alu 3mm\nKhung thép 20 x 20',
        'note': 'Quy cách theo mẫu',
        'definition': {'lines': []},
        'is_published': True,
    }
    saved = client.put('/api/product-bom/library/'+item['id']+'/properties', json=payload)
    assert saved.status_code == 200, saved.json
    entry = next(p for p in client.get('/api/product-bom/library').json['products'] if p['id']==item['id'])
    assert entry['version'] == item['version'] + 1
    assert entry['properties']['defaults'] == payload['defaults']
    assert entry['properties']['materials_text'] == payload['materials_text']
    assert entry['properties']['constraints']['minimum_unit_price'] == 250000
    assert entry['is_published'] is False
    internal = next(p for p in client.get('/api/product-bom/products', headers={'Authorization':'admin'}).json['products'] if p['id']==item['id'])
    assert internal['definition']['lines'] == item['definition']['lines']
    assert client.put('/api/product-bom/library/'+item['id']+'/properties', json=payload).status_code == 409


def test_library_properties_rejects_invalid_values(client):
    item = product(client)
    body = {'version':item['version'], 'defaults':definition()['defaults'],
            'constraints':{'dimensions':{k:{'min':1} for k in ('L','H','W')},
                           'minimum_unit_price':-1,'minimum_order_price':0}}
    url = '/api/product-bom/library/'+item['id']+'/properties'
    assert client.put(url,json=body).status_code == 400
    body['constraints']['minimum_unit_price'] = 100
    body['constraints']['dimensions']['L']['min'] = 999
    assert client.put(url,json=body).status_code == 400
    body['constraints']['dimensions']['L']['min'] = 1
    body['defaults']['F'] = 1.5
    assert client.put(url,json=body).status_code == 400


def test_material_normalization_validates_and_sanitizes(client, monkeypatch):
    module = sys.modules['bom_test_package.product_bom']
    calls = []
    def post(url, **kwargs):
        calls.append((url, kwargs))
        return types.SimpleNamespace(raise_for_status=lambda: None,
            json=lambda: {'success': True, 'text': 'Mica màu 3 mm [MC999003] (Tấm)', 'internal_model': 'private'})
    monkeypatch.setattr(module.requests, 'post', post)
    url = '/api/product-bom/library/normalize-materials'
    for text in ('', ' ', 'x' * 20001, 12):
        assert client.post(url, json={'text': text}).status_code == 400
    assert not calls
    result = client.post(url, json={'text': 'mica mau 3mm [MC999003] (Tam)'})
    assert result.status_code == 200
    assert result.json == {'success': True, 'text': 'Mica màu 3 mm [MC999003] (Tấm)'}
    def fail(*args, **kwargs):
        raise module.requests.Timeout('private upstream details')
    monkeypatch.setattr(module.requests, 'post', fail)
    result = client.post(url, json={'text': 'mica'})
    assert result.status_code == 502
    assert 'private' not in str(result.json)


def test_library_photo_lifecycle_and_gallery(client):
    import io
    from PIL import Image
    item = product(client)
    url = '/api/product-bom/library/'+item['id']+'/photos'
    def photo(version, asset_id=None):
        image=io.BytesIO(); Image.new('RGB',(30,20),'red').save(image,format='PNG'); image.seek(0)
        data={'version':str(version),'file':(image,'test.png')}
        if asset_id: data['asset_id']=asset_id
        response=client.post(url,data=data)
        assert response.status_code==200,response.json
        return response.json
    result=photo(item['version'])
    first=result['image_assets'][-1]['id']
    assert client.put(url,json={'version':item['version'],'gallery_ids':[first]}).status_code==409
    result=photo(result['version'])
    second=result['image_assets'][-1]['id']
    r=client.put(url,json={'version':result['version'],'gallery_ids':[first,second]})
    assert r.status_code==200
    result=r.json
    assert [a['id'] for a in result['gallery_images']]==[first,second]
    assert client.put(url,json={'version':result['version'],'gallery_ids':[first,first]}).status_code==400
    assert client.put(url,json={'version':result['version'],'gallery_ids':['missing']}).status_code==400
    old_url=next(a['url'] for a in result['image_assets'] if a['id']==first)
    result=photo(result['version'],first)
    assert next(a['url'] for a in result['image_assets'] if a['id']==first)!=old_url
    assert result['gallery_ids']==[first,second]
    result=client.delete(url,json={'version':result['version'],'asset_id':first}).json
    assert result['gallery_ids']==[second]
    stored=next(p for p in client.get('/api/product-bom/library').json['products'] if p['id']==item['id'])
    assert stored['gallery_ids']==[second]
    internal=next(p for p in client.get('/api/product-bom/products',headers={'Authorization':'admin'}).json['products'] if p['id']==item['id'])
    assert internal['definition']['lines']==item['definition']['lines']
    assert client.post(url,data={'version':str(result['version']),'file':(io.BytesIO(b'bad'),'fake.png')}).status_code==400


def test_library_review_persists_and_rejects_stale_writes(client):
    item = product(client)
    url = '/api/product-bom/library/' + item['id'] + '/review'
    data = {'version': item['version'], 'reviewed': True}
    saved = client.put(url, json=data)
    assert saved.status_code == 200
    assert client.put(url, json=data).status_code == 409
    stored = next(p for p in client.get('/api/product-bom/library').json['products'] if p['id'] == item['id'])
    assert stored['properties']['reviewed'] is True
    assert client.put(url, json={'version': saved.json['version'], 'reviewed': 'false'}).status_code == 400
    cleared = client.put(url, json={'version': saved.json['version'], 'reviewed': False})
    assert cleared.status_code == 200
    stored = next(p for p in client.get('/api/product-bom/library').json['products'] if p['id'] == item['id'])
    assert stored['properties']['reviewed'] is False
    internal = next(p for p in client.get('/api/product-bom/products', headers={'Authorization':'admin'}).json['products'] if p['id'] == item['id'])
    assert internal['definition']['lines'] == item['definition']['lines']
