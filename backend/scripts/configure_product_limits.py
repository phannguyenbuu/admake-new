"""Initialize per-product size/price policies; --apply updates only missing policies.

Keeps old quote snapshots intact. Existing custom defaults and policies are never
overwritten. Requires the backend DATABASE_URL and psycopg2 only for --apply.
"""
import argparse
import copy
import json
import os
import sys
from datetime import datetime, timezone
from pathlib import Path

BACKEND = Path(__file__).resolve().parents[1]
PROFILES = {
    # L min/max, H min/max, W min/max (cm), unit floor, order floor (VND).
    'desk': (15,80,5,35,1,20,200000,0), 'house': (10,120,8,80,.2,15,150000,0),
    'company': (15,150,10,100,.1,10,250000,0), 'room': (8,60,4,30,.2,2,50000,0),
    'alu': (60,2000,30,600,3,60,600000,0), 'ledsign': (60,2000,30,600,4,60,900000,0),
    'banner': (40,2000,30,600,2,40,250000,0), 'pylon': (60,500,60,400,5,50,1200000,0),
    'lam': (60,1500,30,500,3,50,900000,0), 'pvc': (60,1200,40,400,1,40,800000,0),
    'single': (5,200,8,200,2,30,150000,0), 'metal': (5,1200,5,300,.2,40,250000,0),
    'litletter': (10,1200,10,300,2,40,350000,0), 'foam': (5,1200,5,300,.3,20,80000,0),
    'window': (10,500,10,300,.005,.1,50000,150000), 'paper': (3,32,2,45,.01,.1,1000,100000),
    'tag': (5,100,5,100,.2,2,15000,100000), 'lightbox': (20,1500,20,400,4,60,600000,0),
    'chibi': (30,180,40,240,4,30,650000,0), 'round': (20,150,20,150,4,30,350000,0),
    'fivefaces': (20,500,20,250,5,100,1200000,0), 'rust': (15,150,15,150,3,40,300000,0),
    'pole': (40,300,40,300,4,40,800000,0), 'kiosk': (80,600,150,300,60,300,8000000,0),
    'neon': (15,300,15,200,1,15,400000,0), 'arrow': (40,250,20,150,4,30,600000,0),
    'menu': (10,42,10,60,.2,1,35000,50000), 'star': (10,200,10,200,1,20,200000,0),
    'counter': (60,400,70,130,30,100,3500000,0), 'standee': (40,100,60,220,5,80,180000,0),
    'label': (1,100,1,100,.005,.1,500,100000), 'slim': (15,300,15,300,.8,5,400000,0),
    'ceiling': (100,2000,100,1000,5,60,1500000,0), 'qr': (6,40,8,50,2,20,80000,0),
    'cart': (50,250,100,250,40,120,4500000,0),
}
GROUPS = {
    'desk':[0,1,7], 'house':[2,3,4], 'company':[5], 'room':[25],
    'alu':[8,9,11,20], 'ledsign':[10,17,21], 'banner':[12,15,16,19], 'pylon':[13,14,24],
    'lam':[18], 'pvc':[22], 'single':[26,27], 'metal':[28,30,35],
    'litletter':[29,31,32,33,34,36,37,38,40,45], 'foam':[39,41,42,43,44],
    'window':[46,47], 'paper':[48,69], 'tag':[49,50], 'lightbox':[6,23,51,52],
    'chibi':[53,54,55], 'round':[56,57,59], 'fivefaces':[58], 'rust':[60], 'pole':[61],
    'kiosk':[62,63], 'neon':[64], 'arrow':[65], 'menu':[66,67], 'star':[68],
    'counter':[70], 'standee':[71], 'label':[72], 'slim':[73,74], 'ceiling':[75],
    'qr':[76], 'cart':[77,78],
}
DEFAULT_FIXES = {2:{'W':1},5:{'W':.5},25:{'W':.5},26:{'L':28,'H':40},27:{'L':30,'H':40},
    46:{'W':.01},47:{'W':.01},48:{'W':.03},69:{'W':.03},64:{'W':3},66:{'W':.5},
    70:{'H':100,'W':60},71:{'W':40},72:{'L':5,'H':5,'W':.01},74:{'W':2},
    59:{'L':40,'H':40},68:{'W':3},77:{'L':140,'W':60},78:{'L':150,'W':60}}


def prepare():
    seed_path = BACKEND/'config/product_formula_seed.json'
    seed = json.loads(seed_path.read_text(encoding='utf-8'))
    policy_path = BACKEND/'config/product_constraints.json'
    prior = json.loads(policy_path.read_text(encoding='utf-8')).get('products', {}) if policy_path.exists() else {}
    records, seen = {}, set()
    for profile, indexes in GROUPS.items():
        for index in indexes:
            assert index not in seen
            seen.add(index)
            product, values = seed[index], PROFILES[profile]
            original = prior.get(product['id'], {}).get('previous_defaults', copy.deepcopy(product['definition']['defaults']))
            defaults = {**original, **DEFAULT_FIXES.get(index,{})}
            price = 200000 if index in (2,4) else 250000 if index==1 else 800000 if index==55 else values[6]
            constraints = {'dimensions':{a:{'min':values[j*2]} for j,a in enumerate(('L','H','W'))},
                'minimum_unit_price':price, 'minimum_order_price':values[7],
                'note':'Giá tối thiểu chưa VAT, chưa vận chuyển. Ngưỡng khởi tạo theo quy cách; quản trị có thể điều chỉnh.'}
            for axis, bounds in constraints['dimensions'].items():
                assert bounds['min'] <= defaults[axis], (product['name'], axis)
            records[product['id']] = {'name':product['name'],'profile':profile,'constraints':constraints,
                'previous_defaults':original,'recommended_defaults':defaults}
            product['definition']['constraints'] = constraints
            product['definition']['defaults'] = defaults
    assert len(seen)==len(seed)==79
    policy_path.write_text(json.dumps({'version':1,'dimension_unit':'cm','currency':'VND','products':records},ensure_ascii=False,indent=2),encoding='utf-8')
    seed_path.write_text(json.dumps(seed,ensure_ascii=False,indent=2),encoding='utf-8')
    return records


def apply(records, backup_dir):
    import psycopg2
    from psycopg2.extras import Json
    from dotenv import load_dotenv
    load_dotenv(BACKEND/'.env')
    backup_dir.mkdir(parents=True,exist_ok=True)
    with psycopg2.connect(os.environ['DATABASE_URL']) as connection:
        assert connection.get_dsn_parameters().get('dbname')=='admake_chat', 'Unexpected database; aborting'
        with connection.cursor() as cursor:
            cursor.execute('SELECT id, definition, version FROM product_formulas WHERE "deletedAt" IS NULL FOR UPDATE')
            changes, backup = [], []
            for pid, definition, version in cursor.fetchall():
                policy = records.get(pid)
                if not policy or definition.get('constraints'):continue
                original = copy.deepcopy(definition)
                definition['constraints'] = policy['constraints']
                dims = dict(definition['defaults'])
                for axis, proposed in policy['recommended_defaults'].items():
                    previous = policy['previous_defaults'].get(axis)
                    if dims.get(axis)==previous:dims[axis]=proposed
                # A customized out-of-range default needs a deliberate admin decision.
                for axis,b in policy['constraints']['dimensions'].items():
                    if not b['min']<=dims[axis]:
                        raise ValueError(f'{policy["name"]}: customized default {axis} is outside limits')
                definition['defaults'] = dims
                backup.append({'id':pid,'definition':original,'version':version})
                changes.append((Json(definition),pid,version))
            stamp = datetime.now(timezone.utc).strftime('%Y%m%dT%H%M%S%fZ')
            backup_path = backup_dir/f'product-limits-{stamp}.json'
            backup_path.write_text(json.dumps(backup,ensure_ascii=False,indent=2),encoding='utf-8')
            for definition,pid,version in changes:
                cursor.execute('UPDATE product_formulas SET definition=%s,version=COALESCE(version,0)+1,"updatedAt"=CURRENT_TIMESTAMP WHERE id=%s AND version IS NOT DISTINCT FROM %s', (definition,pid,version))
                assert cursor.rowcount==1
    print(f'Applied {len(changes)} policies; existing policies preserved; backup: {backup_path}')


if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    parser=argparse.ArgumentParser();parser.add_argument('--prepare',action='store_true');parser.add_argument('--apply',action='store_true')
    parser.add_argument('--backup-dir',type=Path,default=BACKEND/'backups/product-limits')
    args=parser.parse_args()
    policies=prepare() if args.prepare else json.loads((BACKEND/'config/product_constraints.json').read_text(encoding='utf-8'))['products']
    if args.apply:apply(policies,args.backup_dir)
    else:print(f'Prepared {len(policies)} product policies; database unchanged')
