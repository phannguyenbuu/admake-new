import os
import paramiko

def sftp_mkdirs(sftp, remote_path):
    dirs = remote_path.strip('/').split('/')
    path = ''
    for dir_part in dirs:
        if not dir_part: continue
        path += '/' + dir_part
        try:
            sftp.stat(path)
        except IOError:
            sftp.mkdir(path)

def upload_dir(sftp, local_dir, remote_dir):
    sftp_mkdirs(sftp, remote_dir)
    for item in os.listdir(local_dir):
        if item in ['.git', '__pycache__', 'node_modules', '.venv', '.env']:
            continue
        local_path = os.path.join(local_dir, item)
        remote_path = remote_dir + '/' + item
        if os.path.isfile(local_path):
            sftp.put(local_path, remote_path)
        elif os.path.isdir(local_path):
            upload_dir(sftp, local_path, remote_path)

def deploy():
    host = "31.97.76.62"
    port = 22
    username = "root"
    password = "@baoLong0511"

    ssh = paramiko.SSHClient()
    ssh.set_missing_host_key_policy(paramiko.AutoAddPolicy())
    ssh.connect(hostname=host, port=port, username=username, password=password)
    sftp = ssh.open_sftp()

    print("--- Start Deploying to 31.97.76.62 ---")

    # 1. Upload Backend
    print("Uploading Backend to /root/admake/backend ...")
    upload_dir(sftp, "backend", "/root/admake/backend")

    # 2. Upload Frontend Dist
    print("Uploading Frontend to /var/www/admake ...")
    upload_dir(sftp, "frontend/dist", "/var/www/admake")

    # 3. Upload Static
    print("Uploading Static to /root/admake/backend/static ...")
    upload_dir(sftp, "static", "/root/admake/backend/static")

    sftp.close()
    
    # 4. Restart services
    print("Restarting Backend service via PM2...")
    # PM2 thường quản lý các ứng dụng, tôi sẽ chạy lệnh restart cho backend
    stdin, stdout, stderr = ssh.exec_command("pm2 restart all")
    print(stdout.read().decode())

    ssh.close()
    print("--- Deployment Complete ---")

if __name__ == "__main__":
    deploy()
