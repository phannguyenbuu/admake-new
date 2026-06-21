import os
import subprocess
import time

def main():
    host = "31.97.76.62"
    username = "root"
    key_path = r"C:\Users\nguyenbuu.DESKTOP-TOEFTR1\.ssh\id_ed25519"
    local_dir = r"d:\Dropbox\_Documents\Admake\backup_static"
    os.makedirs(local_dir, exist_ok=True)

    print(f"--- Starting Download of Static Parts to {local_dir} ---")
    start_time = time.time()

    # Loop through all 24 parts (00 to 23)
    for i in range(24):
        part_name = f"admake_static_backup.tar.gz.part{i:02d}"
        remote_path = f"{username}@{host}:/root/{part_name}"
        local_path = os.path.join(local_dir, part_name)

        print(f"[{i+1}/24] Downloading {part_name}...")
        
        # Command: scp -i <key> -o StrictHostKeyChecking=no <remote> <local>
        cmd = [
            "scp",
            "-i", key_path,
            "-o", "StrictHostKeyChecking=no",
            remote_path,
            local_path
        ]

        try:
            res = subprocess.run(cmd, check=True, stdout=subprocess.PIPE, stderr=subprocess.PIPE, text=True)
            print(f"      Success: {part_name} downloaded.")
        except subprocess.CalledProcessError as e:
            print(f"      Error downloading {part_name}: {e.stderr}")
            # Continue to next file even if one fails
            continue

    end_time = time.time()
    print(f"--- Download Complete in {end_time - start_time:.2f} seconds ---")

if __name__ == "__main__":
    main()
