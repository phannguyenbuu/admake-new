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
    save_dump()

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
    ssh.connect('31.97.76.62', username='root', password='@baoLong0511')

    now = datetime.datetime.now()
    timestamp = now.strftime("%y_%m_%d_%H_%M")

    remote_dump_path = f"/root/admake_chat_{timestamp}.dump"
    print("Dump file remote:", remote_dump_path)

    # Thực thi lệnh pg_dump trên server Linux
    pg_dump_cmd = f"pg_dump -U postgres -d admake_chat -F c -f {remote_dump_path}"
    stdin, stdout, stderr = ssh.exec_command(pg_dump_cmd)

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





def generate_nginx_config(n):
    # phần cấu hình cố định
    base_config = '''
server {
    listen 80;

    listen 443 ssl http2;
    listen [::]:443 ssl http2;
    server_name admake.vn www.admake.vn;

    client_max_body_size 100M;

    ssl_certificate /etc/letsencrypt/live/admake.vn/fullchain.pem;
    ssl_certificate_key /etc/letsencrypt/live/admake.vn/privkey.pem;

    ssl_session_timeout 1d;
    ssl_session_cache shared:SSL:50m;
    ssl_session_tickets off;

    ssl_protocols TLSv1.2 TLSv1.3;
    ssl_ciphers HIGH:!aNULL:!MD5;
    ssl_prefer_server_ciphers on;

    add_header Strict-Transport-Security "max-age=15768000" always;

    # ssl_stapling on;
    # ssl_stapling_verify on;
    ssl_trusted_certificate /etc/letsencrypt/live/admake.vn/chain.pem;

    resolver 8.8.8.8 8.8.4.4 valid=300s;
    resolver_timeout 5s;

    location /.well-known/acme-challenge/ {
        root /var/www/admake.vn/html;
        allow all;
    }
    
    location / {
        proxy_pass http://127.0.0.1:4999;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection 'upgrade';
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;
    }

    location /admin/leads/ {
        proxy_pass http://127.0.0.1:6999/admin/leads/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }

    location /static/ {
        proxy_pass http://127.0.0.1:6000/static/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }
'''

    # phần location thêm theo ad1 đến adN
    dynamic_locations = ""
    for i in range(n + 1):
        prefix = f"/ad{i}" if i > 0 else ''
        dynamic_locations += f'''

    location {prefix}/api/ {{
        proxy_pass http://127.0.0.1:{6000+i}/api/;
        proxy_set_header Host $host;
        proxy_set_header X-Real-IP $remote_addr;
        proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
        proxy_set_header X-Forwarded-Proto $scheme;
    }}

    location {prefix}/socket.io/ {{
        proxy_pass http://127.0.0.1:{6000+i}/socket.io/;
        proxy_http_version 1.1;
        proxy_set_header Upgrade $http_upgrade;
        proxy_set_header Connection "Upgrade";
        proxy_set_header Host $host;
        proxy_cache_bypass $http_upgrade;

        proxy_buffering off;
        proxy_read_timeout 3600s;
        proxy_send_timeout 3600s;
    }}
'''

    end_config = "\n}\n"

    return base_config + dynamic_locations + end_config

def generate_quanly_nginx(output_file, num_prefixes):
    base_config = """server {
        listen 80;
        server_name quanly.admake.vn;

        return 301 https://$host$request_uri;
    }


    server {    
        listen 443 ssl http2;
        listen [::]:443 ssl http2;
        server_name quanly.admake.vn;

        ssl_certificate /etc/letsencrypt/live/admake.vn/fullchain.pem;
        ssl_certificate_key /etc/letsencrypt/live/admake.vn/privkey.pem;

        ssl_session_timeout 1d;
        ssl_session_cache shared:SSL:50m;
        ssl_session_tickets off;

        ssl_protocols TLSv1.2 TLSv1.3;
        ssl_ciphers HIGH:!aNULL:!MD5;
        ssl_prefer_server_ciphers on;

        add_header Strict-Transport-Security "max-age=15768000" always;

        # ssl_stapling on;
        # ssl_stapling_verify on;
        ssl_trusted_certificate /etc/letsencrypt/live/admake.vn/chain.pem;

        resolver 8.8.8.8 8.8.4.4 valid=300s;
        resolver_timeout 5s;

        location / {
            proxy_pass http://127.0.0.1:4000;
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;

            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;
        }

        location /.well-known/acme-challenge/ {
            alias /var/www/admake.vn/html/.well-known/acme-challenge/;
            allow all;
        }
    """

    # Sinh phần location lặp từ ad1 đến ad10
    location_blocks = ""
    for i in range(1, 11):
        port = 4000 + i
        location_blocks += f"""
        location /ad{i}/ {{
            proxy_http_version 1.1;
            proxy_set_header Upgrade $http_upgrade;
            proxy_set_header Connection 'upgrade';
            proxy_set_header Host $host;
            proxy_cache_bypass $http_upgrade;

            proxy_set_header X-Real-IP $remote_addr;
            proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
            proxy_set_header X-Forwarded-Proto $scheme;

            rewrite ^/ad{i}/(.*)$ /$1 break;

            proxy_pass http://127.0.0.1:{port};
        }}
    """

    # Đóng ngoặc cho server
    final_config = base_config + location_blocks + "\n}\n"

    # Ghi file
    with open(output_file, "w", encoding="utf-8") as f:
        f.write(final_config)

    print(f"✅ Đã tạo file cấu hình Nginx: {output_file}")


def build_nginx_and_ecosystem(num_prefixes):
    config_content = generate_nginx_config(num_prefixes)

    with open("nginx/sites-enabled/admake.vn", "w") as f:
        f.write(config_content)

    generate_quanly_nginx("nginx/sites-enabled/quanly.admake.vn",num_prefixes)
    generate_ecosystem_config(num_prefixes)
    
    print(f"Đã tạo file cấu hình với các location ad1 đến ad{num_prefixes} thành công.")
    



def generate_ecosystem_config(n):
    apps = [
            {
                "name": "backend-flask-landing-page",
                "cwd": "./lead-be",
                "script": "app.py",
                "interpreter": "/root/venv/bin/python3",
                # "args": "-m gunicorn app:app -b 0.0.0.0:6999",
                "env": {
                    "GENERATE_SOURCEMAP": "false",
                    "HOST": "0.0.0.0",
                    "PORT": "6999",
                    "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_chat"
                }
            },
            {
                "name": "admake landing page",
                "cwd": "./landingpage",
                "script": "npm",
                "args": "run start",
                "env": {
                    "PORT": "4999"
                }
            },
            {
                "name": "backend-flask-n0",
                "cwd": "./main-be",
                "script": "app.py",
                "interpreter": "/root/venv/bin/python3",

                # "args": "-m gunicorn app:app -b 0.0.0.0:6000",
                
                "env": {
                    "GENERATE_SOURCEMAP": "false",
                    "HOST": "0.0.0.0",
                    "PORT": "6000",
                    "DATABASE_URL": "postgresql://postgres:mypassword@31.97.76.62:5432/admake_chat"
                }
            },
            {
                "name": "frontend-react-n0",
                "cwd": "./quangcao_web",
                "script": "npm",
                "args": "run dev -- --port 4000",
                "env": {
                    "VITE_APP_API_HOST": "https://admake.vn/api",
                    "VITE_APP_SOCKET": "https://admake.vn",
                    "VITE_APP_STATIC": "https://admake.vn/static"
                }
            }
    ]

    # tenant n>0
    for i in range(1, n + 1):
        apps.append({
            "name": f"backend-flask-n{i}",
            "cwd": "./main-be",
            "script": "app.py",
            "interpreter": "/root/venv/bin/python3",
            # "args": f"-m gunicorn app:app -b 0.0.0.0:{6000 + i}",
            "env": {
                "PORT": f"{6000 + i}",
                "GENERATE_SOURCEMAP": "false",
                "HOST": "0.0.0.0",
                # "REACT_APP_API_URL": f"http://31.97.76.62:{5000 + i}",
                "DATABASE_URL": f"postgresql://postgres:mypassword@31.97.76.62:5432/admake_{i}"
            }
        })

        apps.append({
            "name": f"frontend-react-n{i}",
            "cwd": "./quangcao_web",
            "script": "npm",
            "args": f"run dev -- --port {4000 + i}",
            "env": {
                "VITE_APP_API_HOST": f"https://admake.vn/ad{i}/api",
                "VITE_APP_SOCKET": f"https://admake.vn/ad{i}/",
                "VITE_APP_STATIC": "https://admake.vn/static"
            }
        })

    ecosystem = {
        "apps": apps
    }

    import json
    with open("ecosystem.config.js", "w") as f:
        f.write("module.exports = ")
        json.dump(ecosystem, f, indent=4)



upload_to_vps_multiple(
    host="31.97.76.62",
    port=22,
    username="root",
    password="@baoLong0511",
    local_dirs=["nginx"],
    remote_base_dir="/etc"
)

local_dirs = [
    "main-be/models.py",
    "main-be/app.py",
    "main-be/.env",
    "main-be/api",
    "lead-be/app.py",
    "lead-be/models.py",
    "lead-be/.env",
    "lead-be/templates",
    "ecosystem.config.js",

]

build_nginx_and_ecosystem(0)
upload_to_vps_multiple(host="31.97.76.62",port=22,username="root",password="@baoLong0511",local_dirs=local_dirs,remote_base_dir="admake")



