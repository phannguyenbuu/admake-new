import sys
import re
import requests
from bs4 import BeautifulSoup

sys.path.append('/root/admake/backend')
from models import app, db, MaterialSupplier, generate_datetime_id

headers = {
    'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
    'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
    'Accept-Language': 'vi-VN,vi;q=0.9,en-US;q=0.8,en;q=0.7'
}

suppliers_found = []

for page in range(1, 4):
    url = f"https://trangvangvietnam.com/tagclass/60011810/vat-tu-quang-cao.html?page={page}" if page > 1 else "https://trangvangvietnam.com/tagclass/60011810/vat-tu-quang-cao.html"
    try:
        r = requests.get(url, headers=headers, timeout=10)
        if r.status_code != 200:
            print(f"Page {page} status {r.status_code}")
            continue

        soup = BeautifulSoup(r.text, 'html.parser')
        listings = soup.find_all(['div', 'article', 'tr'], class_=lambda c: c and ('box_doanhnghiep' in c or 'listing' in c or 'company' in c or 'item' in c))

        # Backup: regex parse HTML for company names & websites
        # Look for h2/h3 company titles
        titles = soup.find_all(['h2', 'h3'], class_=lambda c: c and ('box_doanhnghiep' in c or 'company' in c or 'title' in c or 'name' in c))
        if not titles:
            titles = soup.find_all(['h2', 'h3'])

        for t in titles:
            link_tag = t.find('a')
            if not link_tag:
                continue
            name = link_tag.get_text(strip=True)
            if not name or len(name) < 4:
                continue
            
            # Find parent block to extract website & phone
            parent = t.parent
            for _ in range(4):
                if parent and parent.parent:
                    parent = parent.parent

            parent_text = parent.get_text() if parent else ""
            
            # Extract website URL
            web_match = re.search(r'https?://[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}', parent_text)
            website = web_match.group(0) if web_match else None

            # Extract phone
            phone_match = re.search(r'(0\d{9,10}|\(0\d+\)\s*\d+)', parent_text)
            phone = phone_match.group(0) if phone_match else None

            if name and not any(s['name'] == name for s in suppliers_found):
                suppliers_found.append({
                    "name": name,
                    "website": website,
                    "phone": phone
                })
    except Exception as e:
        print(f"Err fetching page {page}: {e}")

print(f"Scraped {len(suppliers_found)} suppliers from TrangVangVietnam:")
for s in suppliers_found[:10]:
    print(" -", s['name'], "| Web:", s['website'], "| Phone:", s['phone'])

with app.app_context():
    inserted = 0
    for s in suppliers_found:
        name = s['name'].strip()
        if not name:
            continue
        existing = MaterialSupplier.query.filter(MaterialSupplier.name == name).first()
        if not existing:
            sup = MaterialSupplier(
                id=f"sup_{generate_datetime_id()}",
                name=name,
                website_link=s['website'],
                phone=s['phone']
            )
            db.session.add(sup)
            inserted += 1
        elif s['website'] and not existing.website_link:
            existing.website_link = s['website']
            if s['phone']:
                existing.phone = s['phone']

    db.session.commit()
    print(f"SUCCESS: Saved/updated {len(suppliers_found)} suppliers in database (Inserted {inserted} new suppliers)!")
