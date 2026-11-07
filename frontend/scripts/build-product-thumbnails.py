"""Build lightweight, content-addressed gallery images; never change full-size references."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
from PIL import Image, ImageOps
import hashlib, json
root = Path(__file__).resolve().parents[1] / 'public/product-references'
views = json.loads((root / 'photo-views.json').read_text(encoding='utf-8'))
output = root / 'thumbnails'
output.mkdir(exist_ok=True)
def build(entry):
    pid, photos = entry
    result = {}
    for view, url in photos.items():
        source = root / Path(url.split('?')[0]).name
        with Image.open(source) as original:
            image = ImageOps.exif_transpose(original).convert('RGBA')
            image.thumbnail((480, 360), Image.Resampling.LANCZOS)
            canvas = Image.new('RGB', image.size, 'white')
            canvas.paste(image, mask=image.getchannel('A'))
            import io
            buffer = io.BytesIO()
            canvas.save(buffer, format='WEBP', quality=82, method=6)
        data = buffer.getvalue()
        name = f'{pid}-{view}-{hashlib.sha256(data).hexdigest()[:12]}.webp'
        (output / name).write_bytes(data)
        result[view] = '/product-references/thumbnails/' + name
    return pid, result
with ThreadPoolExecutor(max_workers=4) as pool:
    thumbnails = dict(pool.map(build, views.items()))
(root / 'thumbnail-views.json').write_text(json.dumps(thumbnails, ensure_ascii=False), encoding='utf-8')
size = sum((output / Path(url).name).stat().st_size for photos in thumbnails.values() for url in photos.values())
print(f'Built {len(thumbnails)} products / {len(thumbnails)*2} thumbnails: {size/1024/1024:.2f} MB')
