"""
Deploy backend changes to VPS:
- Upload: models.py, api/accounting_erp.py, migrations/20260322_ar_payment_type.sql
- Run migration on VPS
- Restart backend service
"""
import paramiko
import os

VPS_HOST = "31.97.76.62"
VPS_PORT = 22
VPS_USER = "root"
VPS_PASS = "@baoLong0511"
REMOTE_BASE = "/root/admake"

FILES_TO_UPLOAD = [
    # (local_path, remote_path)
    ("backend/models.py", f"{REMOTE_BASE}/main-be/models.py"),
    ("backend/api/accounting_erp.py", f"{REMOTE_BASE}/main-be/api/accounting_erp.py"),
    ("backend/migrations/20260322_ar_payment_type.sql", f"{REMOTE_BASE}/main-be/migrations/20260322_ar_payment_type.sql"),
]

def sftp_mkdirs(sftp, remote_path):
    dirs = remote_path.strip("/").split("/")
    path = ""
    for d in dirs:
        path += "/" + d
        try:
            sftp.stat(path)
        except IOError:
            sftp.mkdir(path)

def main():
    print("Connecting to VPS...")
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(VPS_HOST, port=VPS_PORT, username=VPS_USER, password=VPS_PASS, timeout=60)
    sftp = ssh.open_sftp()

    # 1. Upload files
    for local, remote in FILES_TO_UPLOAD:
        local_abs = os.path.join(os.path.dirname(__file__), local)
        sftp_mkdirs(sftp, os.path.dirname(remote))
        print(f"Uploading {local} -> {remote}")
        sftp.put(local_abs, remote)
        print("  Done.")

    sftp.close()

    # 2. Run migration via psql directly (most reliable)
    print("\nRunning migration 20260322_ar_payment_type.sql ...")
    cmd = (
        f"cd {REMOTE_BASE}/main-be && "
        f"export $(cat .env | grep -v '#' | xargs) 2>/dev/null; "
        f"PGPASSWORD=$(echo $DATABASE_URL | sed 's/.*:\\/\\///' | cut -d: -f2 | cut -d@ -f1) "
        f"psql $(echo $DATABASE_URL | sed 's/postgresql+psycopg2/postgresql/' | sed 's/+psycopg2//') "
        f"-f migrations/20260322_ar_payment_type.sql 2>&1 || "
        f"python3 migrations/run_sql_migration.py migrations/20260322_ar_payment_type.sql 2>&1"
    )
    stdin, stdout, stderr = ssh.exec_command(cmd)
    out = stdout.read().decode("utf-8", errors="replace")
    err = stderr.read().decode("utf-8", errors="replace")
    print("STDOUT:", out)
    if err:
        print("STDERR:", err)

    # 3. Restart backend
    print("\nRestarting backend service...")
    restart_cmd = "pm2 restart all 2>&1 || systemctl restart admake 2>&1 || echo 'Done'"
    stdin2, stdout2, stderr2 = ssh.exec_command(restart_cmd)
    print("Restart:", stdout2.read().decode("utf-8", errors="replace"))

    ssh.close()
    print("\nDeploy complete!")

if __name__ == "__main__":
    main()
