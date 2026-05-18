import paramiko
import sys
import io

sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding="utf-8", errors="replace")

c = paramiko.SSHClient()
c.set_missing_host_key_policy(paramiko.AutoAddPolicy())
c.connect('31.97.76.62', username='root', password='@baoLong0511')

remote_script = """
import sys
sys.path.append('/root/admake/backend')
from models import db, User, app
with app.app_context():
    users = User.query.filter(User.lead_id == 243).all()
    print(f"Total users in Lead 243: {len(users)}")
    for idx, u in enumerate(users):
        print(f"[{idx}] ID: {u.id}, Name: {repr(u.fullName)}, RoleID: {u.role_id}, Phone: {u.phone}")
"""

sftp = c.open_sftp()
with sftp.file('/root/admake/backend/scratch_find_remote.py', 'w') as f:
    f.write(remote_script)

_, out, err = c.exec_command("cd /root/admake/backend && /root/venv/bin/python3 scratch_find_remote.py")
print(out.read().decode("utf-8", "replace").strip())

c.exec_command("rm -f /root/admake/backend/scratch_find_remote.py")
c.close()
