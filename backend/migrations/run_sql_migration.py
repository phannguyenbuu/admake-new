import os
import pathlib
import sys

import psycopg2


def main():
    if len(sys.argv) != 2:
        print("Usage: python migrations/run_sql_migration.py <migration.sql>")
        raise SystemExit(1)

    migration_path = pathlib.Path(sys.argv[1]).resolve()
    if not migration_path.exists():
        print(f"Migration file not found: {migration_path}")
        raise SystemExit(1)

    database_url = os.getenv("DATABASE_URL")
    if not database_url:
        print("DATABASE_URL is required")
        raise SystemExit(1)

    sql = migration_path.read_text(encoding="utf-8")

    conn = psycopg2.connect(database_url)
    conn.autocommit = True
    cur = conn.cursor()
    try:
        cur.execute(sql)
        print(f"Applied migration: {migration_path.name}")
    finally:
        cur.close()
        conn.close()


if __name__ == "__main__":
    main()
