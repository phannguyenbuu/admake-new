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

    upload_multiple_dirs(sftp, local_dirs, remote_base_dir)

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

local_dirs = [
    # "main-be",
    # "quangcao_web/public",
    "quangcao_web/src",
    # "chat-fe/public",
    # "chat-fe/src",
    # "chat-be",
    # "quangcao_web/src/components/dashboard/work-tables/job",
    # "quangcao_web/src/components/dashboard/work-tables",
    # "quangcao_web/src/common/layouts/base"

    # "scripts",

    # "chat-be/app.py",
    # "main-be/instance/customers.db",

    "main-be/models.py",
    "main-be/app.py",
    "main-be/.env",

    "main-be/api",

    "quangcao_web/.env",
]

upload_to_vps_multiple(
    host="31.97.76.62",
    port=22,
    username="root",
    password="@baoLong0511",
    local_dirs=local_dirs,
    remote_base_dir="admake"
)
