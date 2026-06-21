import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("31.97.76.62", port=22, username="root", password="@baoLong0511", timeout=60)
sftp = ssh.open_sftp()

files = [
    ("backend/app.py", "/root/admake/backend/app.py"),
    ("backend/api/chat.py", "/root/admake/backend/api/chat.py"),
    ("backend/api/accounting_erp.py", "/root/admake/backend/api/accounting_erp.py"),
    ("backend/api/roles.py", "/root/admake/backend/api/roles.py"),
    ("backend/api/tasks.py", "/root/admake/backend/api/tasks.py"),
    ("backend/api/workpoints.py", "/root/admake/backend/api/workpoints.py"),
    ("backend/api/inventory.py", "/root/admake/backend/api/inventory.py"),
    ("backend/api/statistics.py", "/root/admake/backend/api/statistics.py"),
    ("backend/models.py", "/root/admake/backend/models.py"),
]
for local, remote in files:
    print(f"Uploading {local} -> {remote}")
    sftp.put(local, remote)
    print("  Done.")

sftp.close()

print("\nRestarting pm2 admake-api...")
_, out, _ = ssh.exec_command("pm2 restart admake-api 2>&1 | tail -3")
print(out.read().decode("utf-8", errors="replace"))

print("\nVerifying status...")
_, out2, _ = ssh.exec_command("pm2 show admake-api 2>&1 | grep -E 'status|uptime|name'")
print(out2.read().decode("utf-8", errors="replace"))

ssh.close()
print("Done!")
