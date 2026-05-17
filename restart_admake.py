import paramiko, sys, io
sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")
ssh = paramiko.SSHClient()
ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
ssh.connect("31.97.76.62", port=22, username="root", password="@baoLong0511", timeout=30)
_, out, _ = ssh.exec_command("pm2 restart 11 2>&1")
print(out.read().decode("utf-8", errors="replace")[:500])
# Verify it's running
_, out2, _ = ssh.exec_command("pm2 show 11 2>&1 | grep -E 'status|name|uptime|pm_uptime'")
print(out2.read().decode("utf-8", errors="replace"))
ssh.close()
