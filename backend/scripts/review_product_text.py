"""Visually re-read every reference image; checkpoint each result by image hash.

Uses the existing private service credential. Vendor settings stay in ignored
local config; public annotations contain no service/model identifiers.
"""
import argparse
import base64
import concurrent.futures
import copy
import hashlib
import json
import re
import sys
import threading
import time
import unicodedata
from pathlib import Path

import requests

ROOT = Path(__file__).resolve().parents[2]
ASSETS = ROOT/'frontend/public/product-references'
CACHE = ROOT/'.codex_tmp/product-text-visual'
PRINT_LOCK = threading.Lock()
PROMPT_VERSION = 1


def normal(text):
    return re.sub('[^a-z0-9]', '', ''.join(c for c in unicodedata.normalize('NFD', text.lower().replace('đ','d')) if not unicodedata.combining(c)))


def save(path, data):
    path.parent.mkdir(parents=True, exist_ok=True)
    temp = path.with_suffix('.tmp')
    temp.write_text(json.dumps(data,ensure_ascii=False,indent=2),encoding='utf-8')
    temp.replace(path)


def reference_photo(pid, view, current):
    """Use immutable detection + hand edits, not the previous review's output."""
    cache=ROOT/'.codex_tmp/product-text'/f'{pid}-{view}-{current["sha256"][:12]}.json'
    photo=json.loads(cache.read_text(encoding='utf-8')) if cache.exists() else copy.deepcopy(current)
    file=ROOT/'backend/config/product_text_overrides.json'
    edits=json.loads(file.read_text(encoding='utf-8')).get(pid,{}).get(view,{})
    if edits.get('sha256')!=photo['sha256']:return photo
    photo['regions']=[r for r in photo['regions'] if r['id'] not in edits.get('suppress_regions',[])]
    for region in photo['regions']:
        if region['id'] in edits.get('texts',{}):
            region['text']=edits['texts'][region['id']];region['review']='verified'
    for addition in edits.get('extra_regions',[]):
        quad=addition['quad'];x,y=min(q[0] for q in quad),min(q[1] for q in quad)
        bbox=[x,y,max(q[0] for q in quad)-x,max(q[1] for q in quad)-y]
        photo['regions'].append(dict(id=addition['id'],text=addition['text'],confidence=1,
            review=addition.get('review','verified'),method='visual_annotation',bbox=bbox,quad=quad,
            normalized_bbox=[round(v/(photo['width'] if i%2==0 else photo['height']),6) for i,v in enumerate(bbox)],
            normalized_quad=[[round(qx/photo['width'],6),round(qy/photo['height'],6)] for qx,qy in quad]))
    return photo


def reconcile(result, photo):
    """Keep hand-checked geometry, including distinct repeated letters."""
    old={r['id']:r for r in photo['regions']}
    for region in result['regions']:
        sources=[old[i] for i in region.get('source_region_ids',[]) if i in old]
        if len(sources)==1 and sources[0]['review']=='verified':
            source=sources[0]
            for field in ['text','bbox','quad','normalized_bbox','normalized_quad','confidence']:
                region[field]=copy.deepcopy(source[field])
            region['review']='verified'
            region['method']='visual_annotation'
        elif any(r.get('method')=='visual_annotation' and r['review']=='pending' for r in photo['regions']):
            # Stylized letterforms previously marked ambiguous still need a
            # human check; a fluent readback is not proof of correct spelling.
            region['review']='pending'
        if len(sources)==1 and region['review']!='verified':
            source=sources[0];a=source['bbox'];b=region['bbox']
            ratio=a[2]*a[3]/max(b[2]*b[3],1)
            if .25<=ratio<=4 and abs(a[0]-b[0])<max(a[2],b[2])*.35 and abs(a[1]-b[1])<max(a[3],b[3])*.35:
                # Text is re-read visually; location still comes from actual
                # detected pixels, avoiding loose normalized-box estimates.
                for field in ['bbox','quad','normalized_bbox','normalized_quad']:
                    region[field]=copy.deepcopy(source[field])
        if region.get('method')=='image_review':region['confidence']=None
    return result


def review(pid, name, view, photo, key, model):
    photo=reference_photo(pid,view,photo)
    cache = CACHE/f'{pid}-{view}-{photo["sha256"][:12]}-v{PROMPT_VERSION}.json'
    if cache.exists():
        result=reconcile(json.loads(cache.read_text(encoding='utf-8')),photo)
        save(cache,result)
        return pid,view,result
    candidates = [{k:r[k] for k in ['id','text','bbox','review']} for r in photo['regions']]
    prompt = '''You are proofreading the actual lettering of a physical signage product, using the attached image as ground truth.
Read ALL visible editable sign text, including stylized neon, metallic standalone letterforms, small contact details and Vietnamese diacritics.
Discard false OCR of decorative crowns, stars, ornamental borders, screws, light bulbs, repeated protective-film markings and textures. A crown is NOT a word or a digit. Standalone physical letter shapes ARE text even if there is only one letter.
Use exact spelling and Vietnamese accents visibly present. Do not invent a plausible shop name, phone or unreadable words. Existing OCR candidates below are unreliable and may be garbage; check them against the image rather than copying them.
Group words into complete semantic lines where possible (same baseline/style), not dozens of per-character fields. Keep different lines separate. If text is visible but unreadable, return text:null and uncertain:true for its real location; never fill it with invented letters.
Return ONLY JSON:
{"has_no_text":false,"regions":[{"text":"exact visible text or null","source_ids":["existing id if it is the SAME area, otherwise omit"],"box_1000":[x,y,width,height],"uncertain":false}]}
Coordinates box_1000 are 0..1000 normalized to the ENTIRE image, origin top-left. Tight boxes around actual text, not the whole sign. Include every real text line missing from candidates. Do not assign crown/artwork to any text region.
If genuinely no lettering, return has_no_text:true and regions:[]. Manufacturing marks on protective paper do not count as signage text, but the large letters underneath do.
'''
    prompt += f'\nImage size {photo["width"]} x {photo["height"]} px; view={view}.\nExisting candidate locations in PIXELS:\n'+json.dumps(candidates,ensure_ascii=False)
    path=ASSETS/Path(photo['image']).name
    payload={'contents':[{'parts':[{'text':prompt},{'inline_data':{'mime_type':'image/png','data':base64.b64encode(path.read_bytes()).decode()}}]}],
             'generationConfig':{'temperature':0,'responseMimeType':'application/json','maxOutputTokens':12000,'thinkingConfig':{'thinkingBudget':0}}}
    raw=None
    for attempt in range(3):
        try:
            response=requests.post('https://generativelanguage.googleapis.com/v1beta/'+model+':generateContent',
                                   headers={'x-goog-api-key':key},json=payload,timeout=150)
            if response.status_code in [429,500,502,503,504]:
                time.sleep(3*(attempt+1));continue
            if response.status_code!=200:
                raise RuntimeError(f'Image review service HTTP {response.status_code}')
            parts=response.json().get('candidates',[{}])[0].get('content',{}).get('parts',[])
            text=''.join(p.get('text','') for p in parts if not p.get('thought'))
            raw=json.loads(text)
            assert isinstance(raw.get('regions'),list)
            break
        except (requests.RequestException,ValueError,AssertionError):
            if attempt==2:raise RuntimeError(f'Image review failed for {pid}/{view}') from None
            time.sleep(2)
    if raw is None:raise RuntimeError(f'Image review unavailable for {pid}/{view}')
    old={r['id']:r for r in photo['regions']}
    verified=[r for r in photo['regions'] if r['review']=='verified']
    regions=[]
    for item in raw['regions']:
        text=item.get('text');uncertain=bool(item.get('uncertain')) or not isinstance(text,str) or not text.strip()
        if isinstance(text,str):text=text.strip()
        box=item.get('box_1000')
        if not isinstance(box,list) or len(box)!=4:raise ValueError(f'Invalid visual box: {pid}/{view}')
        x,y,w,h=[float(v) for v in box]
        x,y=max(0,min(1000,x)),max(0,min(1000,y));w,h=min(max(0,w),1000-x),min(max(0,h),1000-y)
        if w<=0 or h<=0:raise ValueError(f'Empty visual box: {pid}/{view}')
        source_ids=[i for i in item.get('source_ids',[]) if i in old]
        # Preserve previously checked spelling/geometry when the visible text agrees.
        checked=next((r for r in verified if text and normal(r['text'])==normal(text)),None)
        r=copy.deepcopy(checked) if checked else None
        if r is None:
            px,py,pw,ph=[round(v,2) for v in [x/1000*photo['width'],y/1000*photo['height'],w/1000*photo['width'],h/1000*photo['height']]]
            bbox=[px,py,pw,ph];quad=[[px,py],[round(px+pw,2),py],[round(px+pw,2),round(py+ph,2)],[px,round(py+ph,2)]]
            # Trust detector geometry for a single same-sized area, but never
            # inherit an enormous false box covering multiple words/artwork.
            if len(source_ids)==1:
                candidate=old[source_ids[0]];a=candidate['bbox'];area=a[2]*a[3];expected=pw*ph
                if .6<=area/max(expected,1)<=1.7 and abs(a[0]-px)<pw*.4 and abs(a[1]-py)<ph*.4:
                    bbox=copy.deepcopy(a);quad=copy.deepcopy(candidate['quad'])
            r=dict(text=text or 'Chữ chưa đọc rõ',ocr_text=' | '.join(old[i]['text'] for i in source_ids),
                   confidence=None,review='pending' if uncertain else 'image_reviewed',
                   method='image_review',bbox=bbox,quad=quad,
                   normalized_bbox=[round(v/(photo['width'] if i%2==0 else photo['height']),6) for i,v in enumerate(bbox)],
                   normalized_quad=[[round(qx/photo['width'],6),round(qy/photo['height'],6)] for qx,qy in quad])
        r['id']=f'{view}-visual-{len(regions)+1:03d}'
        r['source_region_ids']=source_ids
        r.pop('slot_id',None)
        regions.append(r)
    result=dict(sha256=photo['sha256'],regions=regions,review_method='image_review',
                status='image_reviewed_no_text' if not regions and raw.get('has_no_text') else 'detected')
    if not regions and not raw.get('has_no_text'):raise ValueError(f'Unresolved empty image: {pid}/{view}')
    result=reconcile(result,photo)
    save(cache,result)
    with PRINT_LOCK:print(f'{name} / {view}: {len(photo["regions"])} -> {len(regions)} text regions',flush=True)
    return pid,view,result


def main():
    parser=argparse.ArgumentParser();parser.add_argument('--workers',type=int,default=6);parser.add_argument('--limit',type=int)
    args=parser.parse_args()
    private=ROOT/'.codex_tmp/vision-selected-model.json'
    model=json.loads(private.read_text())['model']
    secrets=Path('D:/vps.md').read_text(encoding='utf-8-sig')
    key=re.search(r'\[GeminiKey\]\s*\n([^\s]+)',secrets)[1]
    manifest=json.loads((ASSETS/'text-annotations.json').read_text(encoding='utf-8'))
    products=list(manifest['products'].items())[:args.limit]
    reviewed={};failed=[]
    with concurrent.futures.ThreadPoolExecutor(max_workers=args.workers) as pool:
        tasks={pool.submit(review,pid,p['name'],v,photo,key,model):(pid,v) for pid,p in products for v,photo in p['views'].items()}
        for future in concurrent.futures.as_completed(tasks):
            try:
                pid,v,result=future.result()
                for region in result['regions']:
                    if region.get('method')=='image_review':region['confidence']=None
                reviewed.setdefault(pid,{})[v]=result
            except Exception as error:
                failed.append({'product_id':tasks[future][0],'view':tasks[future][1],'error':type(error).__name__})
                print('Review pending:',tasks[future],type(error).__name__,str(error),flush=True)
    save(ROOT/'backend/config/product_text_visual_review.json',reviewed)
    save(ROOT/'.codex_tmp/product-text-visual-report.json',dict(products=len(reviewed),images=sum(map(len,reviewed.values())),failed=failed))
    print('Reviewed images:',sum(map(len,reviewed.values())),'Failures:',len(failed),flush=True)
    if failed:raise SystemExit(1)


if __name__=='__main__':
    sys.stdout.reconfigure(encoding='utf-8');main()
