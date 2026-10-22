from curl_cffi import requests
from bs4 import BeautifulSoup

url = "https://trangvangvietnam.com/tagclass/60011810/vat-tu-quang-cao.html"
r = requests.get(url, impersonate="chrome120")

soup = BeautifulSoup(r.text, 'html.parser')

# Print all h2 or h3 tags
h_tags = soup.find_all(['h2', 'h3'])
print(f"FOUND {len(h_tags)} H2/H3 TAGS:")
for h in h_tags[:15]:
    a = h.find('a')
    if a:
        print(" - H-TAG:", h.name, "| TEXT:", a.get_text(strip=True), "| HREF:", a.get('href'))

# Also search for website links or phone numbers in HTML
webs = soup.find_all('a', href=lambda h: h and ('http' in h or 'www' in h))
print(f"\nFOUND {len(webs)} WEBSITE LINKS:")
for w in webs[:15]:
    print(" - WEB LINK:", w.get('href'), "| TEXT:", w.get_text(strip=True))
