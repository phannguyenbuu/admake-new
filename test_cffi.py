from curl_cffi import requests
from bs4 import BeautifulSoup

url = "https://trangvangvietnam.com/tagclass/60011810/vat-tu-quang-cao.html"
r = requests.get(url, impersonate="chrome120")

print("STATUS CODE:", r.status_code)
print("HTML LENGTH:", len(r.text))

soup = BeautifulSoup(r.text, 'html.parser')

# Print title or sample text
title = soup.title.string if soup.title else "No title"
print("TITLE:", title)

# Find listings
boxes = soup.find_all('div', class_=lambda c: c and ('box_doanhnghiep' in c or 'listing' in c or 'company' in c))
print(f"FOUND {len(boxes)} BOXES")

for idx, b in enumerate(boxes[:5], 1):
    h2 = b.find(['h2', 'h3', 'a'])
    print(f"\n[{idx}] {h2.get_text(strip=True) if h2 else 'N/A'}")
