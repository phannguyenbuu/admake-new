import psycopg2

# Kết nối PostgreSQL
conn = psycopg2.connect(
    dbname="admake_chat",
    user="postgres",
    password="",  # Thay bằng mật khẩu thật
    host="localhost",
    port=5432
)
conn.autocommit = True
cur = conn.cursor()

# Thực hiện query
cur.execute('SELECT username FROM "user" ORDER BY id ASC;')
users_in_db = cur.fetchall()  # Lấy kết quả sau execute

index = None
for i, (username,) in enumerate(users_in_db):
    if username == 'Dungx_Toxic':
        index = i
        break

if index is not None:
    print(f"Username 'Dungx_Toxic' nằm ở index {index}")
else:
    print("Không tìm thấy username 'Dungx_Toxic'")

cur.close()
conn.close()
