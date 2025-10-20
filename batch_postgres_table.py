import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_databases(n, user, password, host='localhost', port=5432):
    # Kết nối server postgres (không kết nối database cụ thể)
    conn = psycopg2.connect(database='postgres', user=user, password=password, host=host, port=port)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)  # để tạo db cần autocommit
    cur = conn.cursor()

    for i in range(1, n + 1):
        db_name = f'admake_{i}'
        try:
            cur.execute(f'CREATE DATABASE {db_name};')
            print(f"Database {db_name} created successfully.")
        except psycopg2.errors.DuplicateDatabase:
            print(f"Database {db_name} already exists. Skipping.")
        except Exception as e:
            print(f"Error creating database {db_name}: {e}")

    cur.close()
    conn.close()

def create_database(n, host):
    import subprocess

    USER = "postgres"
    PORT = "5432"
    SCHEMA_FILE = "schema.sql"  # file schema nằm trên VPS

    for i in range(1, n + 1):
        DB_NAME = f"admake_{i}"
        print(f"\n🚀 Đang xử lý database: {DB_NAME}")

        # 0️⃣ Ngắt kết nối và xóa database nếu có
        drop_connections = (
            f'psql -U {USER} -h {host} -p {PORT} -d postgres '
            f'-c "SELECT pg_terminate_backend(pid) FROM pg_stat_activity WHERE datname = \'{DB_NAME}\';"'
        )
        subprocess.run(drop_connections, shell=True, check=False)

        drop_db_cmd = (
            f'psql -U {USER} -h {host} -p {PORT} -d postgres '
            f'-c "DROP DATABASE IF EXISTS {DB_NAME};"'
        )
        subprocess.run(drop_db_cmd, shell=True, check=False)
        print(f"🗑️  Đã xóa database (nếu tồn tại): {DB_NAME}")

        # 1️⃣ Tạo database mới
        create_db_cmd = (
            f'psql -U {USER} -h {host} -p {PORT} -d postgres '
            f'-c "CREATE DATABASE {DB_NAME};"'
        )
        subprocess.run(create_db_cmd, shell=True, check=True)
        print(f"✅ Đã tạo mới database: {DB_NAME}")

        # 2️⃣ Import schema vào database mới
        import_cmd = (
            f'psql -U {USER} -h {host} -p {PORT} -d {DB_NAME} -f {SCHEMA_FILE}'
        )
        try:
            subprocess.run(import_cmd, shell=True, check=True)
            print(f"📦 Import schema từ {SCHEMA_FILE} vào {DB_NAME} thành công!")
        except subprocess.CalledProcessError:
            print(f"❌ Lỗi khi import schema vào {DB_NAME}. Kiểm tra file {SCHEMA_FILE} trên VPS.")




if __name__ == '__main__':
    # create_databases(
    #     n=10,
    #     user='postgres',
    #     password='mypassword',
    #     host='31.97.76.62',
    #     port=5432
    # )

    create_database(10, host='31.97.76.62')
