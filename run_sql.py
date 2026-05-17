import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('31.97.76.62', username='root', password='@baoLong0511')

def run(cmd):
    _, out, err = c.exec_command(cmd)
    o = out.read().decode("utf-8", "replace").strip()
    e = err.read().decode("utf-8", "replace").strip()
    if o: print(o)
    if e: print("[ERR]", e[:300])

# Lấy DATABASE_URL từ .env
_, out, _ = c.exec_command("cat /root/admake/backend/.env | grep DATABASE_URL | head -1")
env_line = out.read().decode().strip()
db_url = env_line.split("=", 1)[1].strip().strip('"').strip("'") if "=" in env_line else ""

print(f"DB: {db_url[:40]}...")

# Kiểm tra BaseModel để biết cần thêm gì
_, out, _ = c.exec_command("grep -n 'version\\|BaseModel\\|__abstract__' /root/admake/backend/models.py | head -20")
print("=== BaseModel fields ===")
print(out.read().decode().strip())

# Fix: thêm column version vào accounting_records
SQL = "ALTER TABLE accounting_records ADD COLUMN IF NOT EXISTS version INTEGER DEFAULT 0;"
print("\nRunning fix SQL...")
_, out, err = c.exec_command(f"psql '{db_url}' -c \"{SQL}\"")
print(out.read().decode().strip())
err_txt = err.read().decode().strip()
if err_txt: print("[ERR]", err_txt[:200])

c.close()
print("Done!")
