import os
import paramiko

def sftp_mkdirs(sftp, remote_path):
    dirs = remote_path.strip('/').split('/')
    path = ''
    for dir_part in dirs:
        path += '/' + dir_part
        try:
            sftp.stat(path)
        except IOError:
            sftp.mkdir(path)

def upload_dir(sftp, local_dir, remote_dir):
    sftp_mkdirs(sftp, remote_dir)
    for item in os.listdir(local_dir):
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + '/' + item
        if os.path.isfile(local_path):
            sftp_mkdirs(sftp, os.path.dirname(remote_path))
            sftp.put(local_path, remote_path, confirm=False)
            print(f"Uploaded {local_path} to {remote_path}")
        elif os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)

def upload_multiple_dirs(sftp, local_dirs, remote_base_dir):
    for local_dir in local_dirs:
        # local_dir = os.path.normpath(local_dir)

        if '.' in local_dir:
            remote_dir_path = os.path.dirname(remote_base_dir.rstrip('/') + '/' + local_dir)
            sftp_mkdirs(sftp, remote_dir_path)
            remote_path = remote_base_dir.rstrip('/') + '/' + local_dir
            print(f"Uploading file {local_dir} to {remote_path}")
            sftp.put(local_dir, remote_path)
        else:
            remote_dir = remote_base_dir.rstrip('/') + '/' + local_dir
            print(f"Uploading directory {local_dir} to {remote_dir}")
            upload_dir(sftp, local_dir, remote_dir)

        # else:
        #     print(f"Skipping unknown path type: {local_dir}")

def upload_to_vps(host, port, username, password, local_path, remote_path):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host, port=port, username=username, password=password, timeout=60)

    sftp = ssh.open_sftp()

    print("Connected")

    if os.path.isfile(local_path):
        sftp_mkdirs(sftp, os.path.dirname(remote_path))
        sftp.put(local_path, remote_path)
    else:
        print("Upload folder")
        upload_dir(sftp, local_path, remote_path)

    sftp.close()
    ssh.close()


def upload_to_vps_multiple(host, port, username, password, local_dirs, remote_base_dir):
    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host, port=port, username=username, password=password, timeout=60)
    sftp = ssh.open_sftp()

    fixed_dirs = [dir_path.replace("\\", "/") for dir_path in local_dirs]

    upload_multiple_dirs(sftp, fixed_dirs, remote_base_dir)

    sftp.close()
    ssh.close()


def ensure_remote_dir(sftp, remote_directory):
    dirs = remote_directory.split('/')
    path = ''
    for dir in dirs:
        if dir:
            path += '/' + dir
            try:
                sftp.stat(path)
            except FileNotFoundError:
                sftp.mkdir(path)

import datetime
import os
from paramiko import SSHClient, AutoAddPolicy
from scp import SCPClient

def save_dump():
    # Kết nối SSH tới server Linux
    ssh = SSHClient()
    ssh.set_missing_host_key_policy(AutoAddPolicy())
    ssh.connect('148.230.100.33', username='root', password='@baoLong0511')

    now = datetime.datetime.now()
    timestamp = now.strftime("%y_%m_%d_%H_%M")

    remote_dump_path = f"/root/admake_chat_{timestamp}.dump"
    print("Dump file remote:", remote_dump_path)

    # Thực thi lệnh pg_dump trên server Linux
    pg_dump_cmd = f"pg_dump -U postgres -d admake_chat -F c -f {remote_dump_path}"
    env_cmd = f"PGPASSWORD=myPass {pg_dump_cmd}"
    stdin, stdout, stderr = ssh.exec_command(env_cmd)


    # Đợi lệnh hoàn thành
    exit_status = stdout.channel.recv_exit_status()
    if exit_status == 0:
        print("Dump database thành công trên server.")
    else:
        error = stderr.read().decode()
        print("Lỗi khi dump database:", error)
        ssh.close()
        return

    # Tải file dump về local Windows
    local_folder = "./backup"
    os.makedirs(local_folder, exist_ok=True)
    local_dump_path = os.path.join(local_folder, f"admake_chat_{timestamp}.dump")

    scp = SCPClient(ssh.get_transport())
    scp.get(remote_dump_path, local_dump_path)
    print(f"Đã tải file dump về: {local_dump_path}")

    scp.close()
    ssh.close()


save_dump()

local_dirs = [
    "main-be/models.py",
    "main-be/app.py",
    "main-be/.env",
    "main-be/api",
    "main-be/procs.py",
    "lead-be/app.py",
    "lead-be/models.py",
    "lead-be/.env",
    "lead-be/templates",
    "ecosystem.config.js",
    "nginx",
]

# build_nginx_and_ecosystem(0)
upload_to_vps_multiple(host="148.230.100.33",
                       port=22,
                       username="root",
                       password="@baoLong0511",
                       local_dirs=local_dirs,
                       remote_base_dir="admake")



