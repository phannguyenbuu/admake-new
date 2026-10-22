import cloudscraper
from bs4 import BeautifulSoup

scraper = cloudscraper.create_scraper(
    browser={
        'browser': 'chrome',
        'platform': 'windows',
        'mobile': False
    }
)

url = "https://trangvangvietnam.com/tagclass/60011810/vat-tu-quang-cao.html"
r = scraper.get(url)

print("STATUS CODE:", r.status_code)
print("HTML LENGTH:", len(r.text))

soup = BeautifulSoup(r.text, 'html.parser')

# Find all company blocks
blocks = soup.find_all('div', class_='box_doanhnghiep')
if not blocks:
    blocks = soup.find_all('div', class_=lambda c: c and 'doanhnghiep' in c)

print(f"FOUND {len(blocks)} COMPANY BLOCKS")

for idx, b in enumerate(blocks[:5], 1):
    h2 = b.find(['h2', 'h3'])
    name = h2.get_text(strip=True) if h2 else "N/A"
    
    # Address, Phone, Website
    text = b.get_text()
    web_a = b.find('a', href=lambda h: h and ('http' in h or 'www' in h))
    website = web_a['href'] if web_a else "N/A"
    
    print(f"\n[{idx}] {name}")
    print("    Website:", website)
