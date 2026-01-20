import asyncio
import asyncpg
from dotenv import load_dotenv
import os

async def verify_tables():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:123456@localhost:5432/extension_db')
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')

    conn = await asyncpg.connect(db_url)

    tables = await conn.fetch("""
        SELECT table_name
        FROM information_schema.tables
        WHERE table_schema = 'public'
        ORDER BY table_name
    """)

    print("Tablas creadas:")
    for table in tables:
        print(f"  - {table['table_name']}")

    await conn.close()

if __name__ == '__main__':
    asyncio.run(verify_tables())
