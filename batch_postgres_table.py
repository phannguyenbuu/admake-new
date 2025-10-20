import psycopg2
from psycopg2.extensions import ISOLATION_LEVEL_AUTOCOMMIT

def create_databases(n, user, password, host='localhost', port=5432):
    # Kết nối server postgres (không kết nối database cụ thể)
    conn = psycopg2.connect(database='postgres', user=user, password=password, host=host, port=port)
    conn.set_isolation_level(ISOLATION_LEVEL_AUTOCOMMIT)  # để tạo db cần autocommit
    cur = conn.cursor()

    for i in range(1, n + 1):
        db_name = f'admake_ad{i}'
        try:
            cur.execute(f'CREATE DATABASE {db_name};')
            print(f"Database {db_name} created successfully.")
        except psycopg2.errors.DuplicateDatabase:
            print(f"Database {db_name} already exists. Skipping.")
        except Exception as e:
            print(f"Error creating database {db_name}: {e}")

    cur.close()
    conn.close()

if __name__ == '__main__':
    create_databases(
        n=10,
        user='postgres',
        password='mypassword',
        host='31.97.76.62',
        port=5432
    )
