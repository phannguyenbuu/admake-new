
import psutil

def list_all_proc():
    # Lấy danh sách tất cả process, lấy PID, tên và %CPU
    all_procs = []
    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
        try:
            # Đọc thông tin %CPU (bắt buộc gọi cpu_percent() 2 lần mới có giá trị đúng)
            proc.cpu_percent(interval=None)
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    # Đợi chút rồi lấy lại cpu_percent giá trị chính xác
    import time
    time.sleep(1)

    for proc in psutil.process_iter(['pid', 'name', 'cpu_percent']):
        try:
            cpu = proc.cpu_percent(interval=None)
            all_procs.append((proc.info['pid'], proc.info['name'], cpu))
        except (psutil.NoSuchProcess, psutil.AccessDenied):
            continue

    # Sắp xếp giảm dần theo cpu_percent
    all_procs.sort(key=lambda x: x[2], reverse=True)

    # In top 10 tiến trình chiếm CPU nhiều nhất
    print(f"{'PID':>6} {'Name':>25} {'CPU %':>6}")
    for pid, name, cpu in all_procs[:10]:
        print(f"{pid:6} {name:25} {cpu:6.2f}")


list_all_proc()