import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('31.97.76.62', username='root', password='@baoLong0511')

sftp = c.open_sftp()
print("Uploading models.py to VPS...")
sftp.put("backend/models.py", "/root/admake/backend/models.py")
sftp.close()

_, out, _ = c.exec_command("cat /root/admake/backend/.env | grep DATABASE_URL | head -1")
env_line = out.read().decode().strip()
db_url = env_line.split("=", 1)[1].strip().strip('"').strip("'") if "=" in env_line else ""

print("Running SQL ALTER to add 'materials' column to 'task' table...")
SQL = "ALTER TABLE task ADD COLUMN IF NOT EXISTS materials JSON DEFAULT '[]'::JSON;"
_, out, err = c.exec_command(f"psql '{db_url}' -c \"{SQL}\"")
print(out.read().decode().strip())
err_txt = err.read().decode().strip()
if err_txt: print("[ERR]", err_txt)

print("Restarting backend PM2...")
_, out, _ = c.exec_command("pm2 restart all")
print(out.read().decode().strip()[:200])

c.close()
print("Done backend fix!")
