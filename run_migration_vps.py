import paramiko, sys, io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("31.97.76.62", port=22, username="root", password="@baoLong0511", timeout=60)
sftp = ssh.open_sftp()

files = [
    ("backend/models.py", "/root/admake/backend/models.py"),
    ("backend/migrations/20260322_role_lead_id.sql", "/root/admake/backend/migrations/20260322_role_lead_id.sql"),
]
for local, remote in files:
    print(f"Uploading {local} -> {remote}")
    sftp.put(local, remote)
    print("  Done.")

sftp.close()

print("\nRunning SQL migration...")
_, out, _ = ssh.exec_command("cd /root/admake/backend && source venv/bin/activate && export DATABASE_URL='postgresql://postgres:myPass@localhost:5432/admake_chat' && python migrations/run_sql_migration.py migrations/20260322_role_lead_id.sql 2>&1")
print(out.read().decode("utf-8", errors="replace"))

print("\nRestarting pm2 admake-api (id=11)...")
_, out, _ = ssh.exec_command("pm2 restart 11 2>&1 | tail -3")
print(out.read().decode("utf-8", errors="replace"))

ssh.close()
print("Done!")
