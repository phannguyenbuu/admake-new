"""Verify geometry is tied to the actual two reference images for every product."""
import hashlib
import json
from pathlib import Path

from PIL import Image

ASSETS = Path(__file__).resolve().parents[2] / 'frontend/public/product-references'


def test_decorative_neon_crown_is_not_a_text_region():
    manifest = json.loads((ASSETS/'text-annotations.json').read_text(encoding='utf-8'))
    product = manifest['products']['124443e014aaf5968dc5e8a7f548eaf5']
    for photo in product['views'].values():
        assert [region['text'] for region in photo['regions']] == ['Thiên', 'Thanh']
        assert all(region['review'] == 'verified' for region in photo['regions'])


def test_all_images_have_received_visual_readback():
    manifest = json.loads((ASSETS/'text-annotations.json').read_text(encoding='utf-8'))
    for product in manifest['products'].values():
        assert all(photo.get('text_review') == 'image_review' for photo in product['views'].values())


def test_repeated_letter_shapes_keep_separate_locations():
    manifest = json.loads((ASSETS/'text-annotations.json').read_text(encoding='utf-8'))
    product = manifest['products']['29fd5c8c0571eb516eccc601fec2298d']
    for photo in product['views'].values():
        letters = [r for r in photo['regions'] if r['text'] == 'B']
        assert len(letters) == 3
        assert len({tuple(region['bbox']) for region in letters}) == 3


def test_every_reference_has_matching_geometry_and_sidecar():
    catalog = json.loads((ASSETS/'catalog.json').read_text(encoding='utf-8'))
    manifest = json.loads((ASSETS/'text-annotations.json').read_text(encoding='utf-8'))
    assert set(manifest['products']) == {p['id'] for p in catalog}
    for pid, product in manifest['products'].items():
        assert set(product['views']) == {'before', 'after'}
        slots = {slot['id']: slot for slot in product['slots']}
        assert len(slots) == len(product['slots'])
        for view, photo in product['views'].items():
            path = ASSETS/Path(photo['image']).name
            assert photo['sha256'] == hashlib.sha256(path.read_bytes()).hexdigest(), path
            with Image.open(path) as image:
                assert (photo['width'], photo['height']) == image.size
            sidecar = json.loads(path.with_suffix('.text.json').read_text(encoding='utf-8'))
            assert sidecar['product_id'] == pid and sidecar['view'] == view
            assert sidecar['regions'] == photo['regions']
            ids = {region['id'] for region in photo['regions']}
            assert len(ids) == len(photo['regions'])
            for region in photo['regions']:
                x, y, w, h = region['bbox']
                assert 0 <= x < x+w <= photo['width']
                assert 0 <= y < y+h <= photo['height']
                assert len(region['quad']) == 4
                for px, py in region['quad']:
                    assert 0 <= px <= photo['width'] and 0 <= py <= photo['height']
                for actual, expected in zip(region['normalized_bbox'], [x/photo['width'], y/photo['height'], w/photo['width'], h/photo['height']]):
                    assert abs(actual-expected) <= 0.000001
                assert region['slot_id'] in slots
                assert region['id'] in slots[region['slot_id']]['regions'][view]
            for slot in slots.values():
                assert set(slot['regions'].get(view, [])) <= ids
