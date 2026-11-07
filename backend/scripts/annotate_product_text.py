"""Detect lettering in BOTH generated views; store image-bound, reproducible geometry.

Optional tooling: easyocr, torch, Pillow, scipy. No production DB/API is touched.
Run from repo root: python backend/scripts/annotate_product_text.py
"""
import argparse
import copy
import hashlib
import json
import re
import sys
import time
import unicodedata
import warnings
from datetime import datetime, timezone
from difflib import SequenceMatcher
from pathlib import Path

import numpy as np
from PIL import Image
from scipy.optimize import linear_sum_assignment

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT / 'frontend/public/product-references'
CACHE = ROOT / '.codex_tmp/product-text'


def normalized(text):
    text = unicodedata.normalize('NFD', text.lower().replace('đ', 'd'))
    return re.sub(r'[^a-z0-9]', '', ''.join(c for c in text if not unicodedata.combining(c)))


def write_json(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix(path.suffix + '.tmp')
    temp.write_text(json.dumps(data, ensure_ascii=False, indent=2), encoding='utf-8')
    for attempt in range(12):
        try:
            temp.replace(path)
            break
        except PermissionError:
            if attempt==11:raise
            time.sleep(min(.1*(attempt+1),1))


def annotate(reader, image_path, product_id, view, refresh):
    digest = hashlib.sha256(image_path.read_bytes()).hexdigest()
    cache = CACHE / f'{product_id}-{view}-{digest[:12]}.json'
    if cache.exists() and not refresh:
        return json.loads(cache.read_text(encoding='utf-8'))
    if reader is None:
        raise RuntimeError(f'Missing detection cache for {image_path.name}; run annotation before --rebuild')
    with Image.open(image_path) as im:
        width, height = im.size
    detected = reader.readtext(str(image_path), detail=1, paragraph=False,
                               canvas_size=1800, mag_ratio=1, batch_size=4,
                               text_threshold=.5, low_text=.3, link_threshold=.3,
                               add_margin=.03, workers=0)
    regions = []
    for quad, text, confidence in detected:
        text = text.strip()
        if not any(c.isalnum() for c in text):
            continue
        quad = [[round(max(0, min(width, float(x))), 2),
                 round(max(0, min(height, float(y))), 2)] for x, y in quad]
        left, top = min(p[0] for p in quad), min(p[1] for p in quad)
        right, bottom = max(p[0] for p in quad), max(p[1] for p in quad)
        if right <= left or bottom <= top:
            continue
        bbox = [left, top, right-left, bottom-top]
        regions.append(dict(text=text, ocr_text=text, confidence=round(float(confidence), 4),
                            bbox=bbox, quad=quad,
                            normalized_bbox=[round(v / (width if i % 2 == 0 else height), 6) for i, v in enumerate(bbox)],
                            normalized_quad=[[round(x/width, 6), round(y/height, 6)] for x, y in quad],
                            review='pending' if confidence < .65 else 'automatic'))
    regions.sort(key=lambda r: (round((r['bbox'][1]+r['bbox'][3]/2)/18), r['bbox'][0]))
    for i, region in enumerate(regions):
        region['id'] = f'{view}-{i+1:03d}'
    result = dict(image=f'/product-references/{image_path.name}', sha256=digest,
                  width=width, height=height, coordinate_system='image_pixels_top_left',
                  status='detected' if regions else 'no_text_detected', regions=regions)
    write_json(cache, result)
    return result


def align_slots(views):
    before, after = views['before']['regions'], views['after']['regions']
    slots = []
    duplicate_keys = {}
    def stable_id(region):
        key = hashlib.sha1(normalized(region['text']).encode('utf-8')).hexdigest()[:10]
        duplicate_keys[key] = duplicate_keys.get(key, 0)+1
        return f'text-{key}-{duplicate_keys[key]}'
    for i, region in enumerate(before):
        region['slot_id'] = stable_id(region)
        slots.append(dict(id=region['slot_id'], text=region['text'], regions={'before': [region['id']]}))
    matched = set()
    if before and after:
        scores = np.zeros((len(before), len(after)))
        for i, a in enumerate(before):
            for j, b in enumerate(after):
                first, second = normalized(a['text']), normalized(b['text'])
                scores[i,j] = SequenceMatcher(None, first, second).ratio() if first and second else 0
        rows, cols = linear_sum_assignment(-scores)
        for i, j in zip(rows, cols):
            if scores[i,j] >= .78:
                after[j]['slot_id'] = before[i]['slot_id']
                after[j]['match_confidence'] = round(float(scores[i,j]), 4)
                slots[i]['regions']['after'] = [after[j]['id']]
                matched.add(j)
    for j, region in enumerate(after):
        if j not in matched:
            region['slot_id'] = stable_id(region)
            slots.append(dict(id=region['slot_id'], text=region['text'], regions={'after': [region['id']]}))
    return slots


def main():
    parser = argparse.ArgumentParser()
    parser.add_argument('--source', type=Path, default=Path.home()/'Downloads'/'sản phẩm')
    parser.add_argument('--limit', type=int)
    parser.add_argument('--refresh', action='store_true')
    parser.add_argument('--start-index', type=int, default=0)
    parser.add_argument('--stop-index', type=int)
    parser.add_argument('--cache-only', action='store_true')
    parser.add_argument('--threads', type=int, default=4)
    parser.add_argument('--rebuild', action='store_true', help='Build manifest from cached detections; never invent missing geometry')
    args = parser.parse_args()
    import torch
    import easyocr
    torch.set_num_threads(args.threads)
    warnings.filterwarnings('ignore', message='.*pin_memory.*')
    reader = None if args.rebuild else easyocr.Reader(['vi', 'en'], gpu=False, download_enabled=False, verbose=False)
    catalog = json.loads((ASSETS/'catalog.json').read_text(encoding='utf-8'))
    photo_views = json.loads((ASSETS/'photo-views.json').read_text(encoding='utf-8'))
    overrides_path = ROOT/'backend/config/product_text_overrides.json'
    overrides = json.loads(overrides_path.read_text(encoding='utf-8')) if overrides_path.exists() else {}
    visual_path = ROOT/'backend/config/product_text_visual_review.json'
    visual = json.loads(visual_path.read_text(encoding='utf-8')) if visual_path.exists() else {}
    prior_path = ASSETS/'text-annotations.json'
    prior = json.loads(prior_path.read_text(encoding='utf-8')).get('products', {}) if prior_path.exists() else {}
    manifest = dict(schema_version=1, generated_at=datetime.now(timezone.utc).isoformat(), products={})
    started = time.time()
    for index, product in enumerate(catalog[:args.limit]):
        if index < args.start_index or (args.stop_index is not None and index >= args.stop_index):
            continue
        pid = product['id']
        views = {}
        for view in ['before', 'after']:
            path = ASSETS / Path(photo_views[pid][view].split('?')[0]).name
            data = annotate(reader, path, pid, view, args.refresh)
            # Corrections are tied to the exact image hash, never to another angle.
            edits = overrides.get(pid, {}).get(view, {})
            checked = visual.get(pid, {}).get(view, {})
            if checked.get('sha256') == data['sha256']:
                data['regions'] = copy.deepcopy(checked['regions'])
                data['status'] = checked['status']
                data['text_review'] = 'image_review'
            elif edits.get('sha256') == data['sha256']:
                suppressed = set(edits.get('suppress_regions', []))
                data['regions'] = [r for r in data['regions'] if r['id'] not in suppressed]
                for region in data['regions']:
                    correction = edits.get('texts', {}).get(region['id'])
                    if correction is not None:
                        region['text'] = correction
                        region['review'] = 'verified'
                for addition in edits.get('extra_regions', []):
                    quad = addition['quad']
                    left, top = min(p[0] for p in quad), min(p[1] for p in quad)
                    right, bottom = max(p[0] for p in quad), max(p[1] for p in quad)
                    bbox = [left, top, right-left, bottom-top]
                    width, height = data['width'], data['height']
                    data['regions'].append(dict(id=addition['id'], text=addition['text'], ocr_text='', confidence=1,
                        review=addition.get('review', 'verified'), method='visual_annotation', bbox=bbox, quad=quad,
                        normalized_bbox=[round(v/(width if i%2==0 else height),6) for i,v in enumerate(bbox)],
                        normalized_quad=[[round(x/width,6),round(y/height,6)] for x,y in quad]))
                if data['regions']:
                    data['status'] = 'detected'
                elif edits.get('verified_no_text'):
                    data['status'] = 'verified_no_text'
            views[view] = data
            print(f'[{index+1}/{min(args.limit or len(catalog),len(catalog))}] {product["name"]} / {view}: {len(data["regions"])} regions ({round(time.time()-started)}s)', flush=True)
        slots = align_slots(views)
        old_regions = {view: {r['id']: r.get('slot_id') for r in prior.get(pid, {}).get('views', {}).get(view, {}).get('regions', [])} for view in views}
        old_slots_by_text = {}
        for slot in prior.get(pid, {}).get('slots', []):
            aliases = old_slots_by_text.setdefault(normalized(slot['text']), set())
            aliases.add(slot['id'])
            aliases.update(slot.get('legacy_slot_ids', []))
        for slot in slots:
            aliases = set(old_slots_by_text.get(normalized(slot['text']), []))
            for view, region_ids in slot['regions'].items():
                for region in views[view]['regions']:
                    if region['id'] in region_ids:
                        for source_id in region.get('source_region_ids', []):
                            if old_regions[view].get(source_id):aliases.add(old_regions[view][source_id])
            aliases.discard(slot['id'])
            if aliases:slot['legacy_slot_ids'] = sorted(aliases)
        if args.cache_only:
            continue
        entry = dict(name=product['name'], views=views, slots=slots)
        manifest['products'][pid] = entry
        for view, data in views.items():
            filename = Path(data['image']).stem + '.text.json'
            write_json(ASSETS/filename, dict(schema_version=1, product_id=pid, view=view, **data))
        source_dir = args.source/product['name']
        if source_dir.is_dir():
            write_json(source_dir/'admake-text-bounds.json', dict(schema_version=1, product_id=pid, **entry))
    # Publish only a complete manifest. Per-image detection cache is the
    # checkpoint; frontend requests must never see a half-built catalog.
    if not args.cache_only:
        write_json(ASSETS/'text-annotations.json', manifest)
    if args.cache_only:
        return
    report = dict(products=len(manifest['products']), images=sum(len(p['views']) for p in manifest['products'].values()),
                  regions=sum(len(v['regions']) for p in manifest['products'].values() for v in p['views'].values()),
                  review_pending=[dict(product_id=pid, view=view, regions=[r['id'] for r in v['regions'] if r['review']=='pending'])
                                  for pid,p in manifest['products'].items() for view,v in p['views'].items() if any(r['review']=='pending' for r in v['regions'])],
                  no_text_detected=[dict(product_id=pid, view=view) for pid,p in manifest['products'].items() for view,v in p['views'].items() if not v['regions']])
    write_json(ASSETS/'text-annotation-report.json',report)
    print(json.dumps({k:v for k,v in report.items() if k not in ('review_pending','no_text_detected')}) ,flush=True)


if __name__ == '__main__':
    sys.stdout.reconfigure(encoding='utf-8')
    main()
