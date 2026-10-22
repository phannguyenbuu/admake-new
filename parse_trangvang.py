import re
import sys
import time
from curl_cffi import requests
from bs4 import BeautifulSoup

sys.path.append('/root/admake/backend')
from models import app, db, MaterialSupplier, generate_datetime_id

suppliers = []

base_url = "https://trangvangvietnam.com/tagclass/60011810/vat-tu-quang-cao.html"

for page in range(1, 8):
    url = f"{base_url}?page={page}" if page > 1 else base_url
    print(f"Fetching TrangVang Page {page}: {url} ...")
    try:
        r = requests.get(url, impersonate="chrome120", timeout=15)
        if r.status_code != 200:
            print(f"Error status {r.status_code} on page {page}")
            continue

        soup = BeautifulSoup(r.text, 'html.parser')
        
        # Company listings are in div.box_doanhnghiep or class containing 'doanhnghiep'
        blocks = soup.find_all('div', class_=lambda c: c and 'doanhnghiep' in c)
        print(f"Page {page}: Found {len(blocks)} company blocks.")

        for b in blocks:
            # 1. Company Name
            title_el = b.find(['h2', 'h3'])
            if not title_el:
                continue
            name_a = title_el.find('a')
            name = name_a.get_text(strip=True) if name_a else title_el.get_text(strip=True)
            if not name or len(name) < 3:
                continue

            # Clean name (remove leading numbers like '1 ', '2 ')
            name = re.sub(r'^\d+\s*', '', name).strip()

            # 2. Website Link
            website = None
            web_a = b.find('a', href=lambda h: h and ('http' in h or 'www' in h) and 'trangvangvietnam' not in h)
            if web_a:
                website = web_a['href'].strip()
            if not website:
                # Search text for www or http
                text = b.get_text()
                m_web = re.search(r'(https?://[^\s"\'<>]+|www\.[^\s"\'<>]+)', text)
                if m_web:
                    website = m_web.group(0).strip()

            # 3. Phone number
            phone = None
            phone_el = b.find('a', href=lambda h: h and 'tel:' in h)
            if phone_el:
                phone = phone_el.get_text(strip=True) or phone_el['href'].replace('tel:', '').strip()
            if not phone:
                m_phone = re.search(r'(0\d{2,3}[\s\.]?\d{3}[\s\.]?\d{3,4}|\(0\d+\)\s*\d+)', b.get_text())
                if m_phone:
                    phone = m_phone.group(0).strip()

            # 4. Address
            address = None
            addr_el = b.find(class_=lambda c: c and ('diachi' in c or 'address' in c))
            if addr_el:
                address = addr_el.get_text(strip=True)
            else:
                m_addr = re.search(r'Địa chỉ:[^\n\r]+', b.get_text())
                if m_addr:
                    address = m_addr.group(0).replace('Địa chỉ:', '').strip()

            if name and not any(s['name'] == name for s in suppliers):
                suppliers.append({
                    "name": name,
                    "website_link": website,
                    "phone": phone,
                    "address": address
                })
        time.sleep(1)
    except Exception as e:
        print(f"Err parsing page {page}: {e}")

print(f"\nTOTAL SUPPLIERS PARSED: {len(suppliers)}")
for s in suppliers[:10]:
    print("--------------------------------------------------")
    print("NAME:", s['name'])
    print("WEB :", s['website_link'])
    print("TEL :", s['phone'])
    print("ADDR:", s['address'])

# Insert into database
with app.app_context():
    inserted_count = 0
    updated_count = 0
    for s in suppliers:
        name = s['name']
        existing = MaterialSupplier.query.filter(MaterialSupplier.name == name).first()
        if not existing:
            sup = MaterialSupplier(
                id=f"sup_{generate_datetime_id()}",
                name=name,
                website_link=s['website_link'],
                phone=s['phone'],
                address=s['address']
            )
            db.session.add(sup)
            inserted_count += 1
        else:
            if s['website_link'] and not existing.website_link:
                existing.website_link = s['website_link']
            if s['phone'] and not existing.phone:
                existing.phone = s['phone']
            if s['address'] and not existing.address:
                existing.address = s['address']
            updated_count += 1

    db.session.commit()
    print(f"\nSUCCESS: Saved all Trang Vàng Việt Nam suppliers! Inserted: {inserted_count}, Updated: {updated_count}.")
