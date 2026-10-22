import re
import sys
import time
from curl_cffi import requests
from bs4 import BeautifulSoup

sys.path.append('/root/admake/backend')
from models import app, db, MaterialSupplier, generate_datetime_id

session = requests.Session(impersonate="chrome120")

# First visit homepage to get Cloudflare session cookies
try:
    session.get("https://trangvangvietnam.com/", timeout=15)
    time.sleep(2)
except Exception as e:
    print("Homepage error:", e)

suppliers = []

for page in range(1, 8):
    url = f"https://trangvangvietnam.com/tagclass/60011810/vat-tu-quang-cao.html?page={page}" if page > 1 else "https://trangvangvietnam.com/tagclass/60011810/vat-tu-quang-cao.html"
    print(f"Fetching Page {page}: {url} ...")
    try:
        r = session.get(url, timeout=15)
        print(f"Page {page} Status: {r.status_code}, Length: {len(r.text)}")
        
        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Search for company title elements
        # Trang Vàng uses <h2 class="company_name"> or <div class="name"> or <a> tags with title attribute
        a_tags = soup.find_all('a')
        
        # Look for company items
        # Companies on Trang Vàng have website links, phone numbers, and company titles
        for a in a_tags:
            href = a.get('href', '')
            text = a.get_text(strip=True)
            
            # Check if this link points to a company detail page or website
            if '/fnames/' in href or '/companies/' in href or 'trangvangvietnam.com/company/' in href:
                if text and len(text) > 4 and not any(s['name'] == text for s in suppliers):
                    parent = a.find_parent(['div', 'tr', 'article', 'li'])
                    p_text = parent.get_text() if parent else ""
                    
                    # Extract website
                    web_match = re.search(r'(https?://[^\s"\'<>]+|www\.[^\s"\'<>]+)', p_text)
                    website = None
                    if web_match:
                        w = web_match.group(0).strip()
                        if 'trangvangvietnam' not in w and 'google' not in w:
                            website = w

                    # Extract phone
                    phone_match = re.search(r'(0\d{2,3}[\s\.]?\d{3}[\s\.]?\d{3,4}|\(0\d+\)\s*\d+)', p_text)
                    phone = phone_match.group(0).strip() if phone_match else None

                    suppliers.append({
                        "name": text,
                        "website_link": website,
                        "phone": phone
                    })

        time.sleep(2)
    except Exception as e:
        print(f"Error page {page}: {e}")

print(f"\nPARSED TOTAL {len(suppliers)} SUPPLIERS FROM TRANG VÀNG VIỆT NAM:")
for s in suppliers[:15]:
    print(f" - {s['name']} | Web: {s['website_link']} | Tel: {s['phone']}")

with app.app_context():
    inserted = 0
    for s in suppliers:
        name = s['name'].strip()
        if not name or len(name) < 4:
            continue
        existing = MaterialSupplier.query.filter(MaterialSupplier.name == name).first()
        if not existing:
            sup = MaterialSupplier(
                id=f"sup_{generate_datetime_id()}",
                name=name,
                website_link=s['website_link'],
                phone=s['phone']
            )
            db.session.add(sup)
            inserted += 1
        else:
            if s['website_link'] and not existing.website_link:
                existing.website_link = s['website_link']
            if s['phone'] and not existing.phone:
                existing.phone = s['phone']

    db.session.commit()
    print(f"\nSUCCESS: Saved {len(suppliers)} suppliers to PostgreSQL DB (Inserted {inserted} new suppliers)!")
