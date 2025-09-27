import psycopg2
import requests

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

# Gọi API lấy dữ liệu
response = requests.get("http://31.97.76.62:5273/user/?limit=50")
ls = response.json()['data']
print(ls)

# Lấy user đã có theo thứ tự id
cur.execute("SELECT id, username, password, role FROM \"user\" ORDER BY id ASC LIMIT %s", (len(ls),))
users_in_db = cur.fetchall()  # list of tuples (id, username, password)

# Cập nhật username, password theo JSON ls và thứ tự index
for i, user in enumerate(users_in_db):
    user_id = user[0]
    new_username = ls[i].get('username')
    new_password = ls[i].get('password')
    fullName = ls[i].get('fullName')
    roleId = ls[i].get('role_id')

    if new_username and new_password and fullName:
        ar = fullName.split(' ')

        if len(ar) >= 3:
            firstName = ar[0] + ' ' + ar[1]
        else:
            firstName = ar[0]
        lastName = ar[-1]

        cur.execute(
            '''UPDATE "user" 
               SET username=%s, "password"=%s, "firstName"=%s, "lastName"=%s, "role"=%s
               WHERE id=%s''',
            (new_username, new_password, firstName, lastName, roleId, user_id)
        )
        print(f"Updated user id={user_id} with username={new_username}, firstName={firstName}, lastName={lastName}")

cur.close()
conn.close()
