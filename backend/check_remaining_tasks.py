import psycopg2

conn = psycopg2.connect("postgresql://postgres:myPass@localhost:5432/admake_chat")
cur = conn.cursor()

cur.execute("""
    SELECT id, title, status, description, "createdAt", "updatedAt"
    FROM task
    WHERE workspace_id = '20260127033705070621635ed8'
    AND "deletedAt" IS NULL
    ORDER BY status, "createdAt" ASC
""")
rows = cur.fetchall()
print(f"Total active tasks in workspace: {len(rows)}")
for r in rows:
    print(f"[{r[2]}] ID: {r[0]} | Title: {r[1]}")

conn.close()
