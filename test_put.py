import requests
import time

t0 = time.time()
url = "http://127.0.0.1:6000/api/inventory/items/20260616043635951564388945"
headers = {"Referer": "https://admake.vn/lead-manage/", "Content-Type": "application/json"}
payload = {
    "default_supplier_name": "Kho vật tư Alu Buôn Mê",
    "supplier_link": "https://trieuchen.com"
}

r = requests.put(url, json=payload, headers=headers)
t1 = time.time()

print(f"STATUS CODE: {r.status_code}")
print(f"TIME TAKEN: {t1 - t0:.3f} seconds")
print(f"UPDATED ITEM: {r.json().get('code')} - {r.json().get('default_supplier_name')} - {r.json().get('supplier_link')}")
