import asyncio
import asyncpg
from dotenv import load_dotenv
import os

async def install_pgvector():
    load_dotenv()
    db_url = os.getenv('DATABASE_URL', 'postgresql+asyncpg://postgres:123456@localhost:5432/extension_db')

    # Convert SQLAlchemy URL to asyncpg format
    db_url = db_url.replace('postgresql+asyncpg://', 'postgresql://')

    try:
        conn = await asyncpg.connect(db_url)
        await conn.execute('CREATE EXTENSION IF NOT EXISTS vector')
        print("✓ pgvector extension installed successfully")
        await conn.close()
    except Exception as e:
        print(f"✗ Error installing pgvector: {e}")
        print("\nNecesitas instalar pgvector en tu sistema PostgreSQL:")
        print("1. Descarga desde: https://github.com/pgvector/pgvector/releases")
        print("2. O usa: apt install postgresql-16-pgvector (Linux)")
        print("3. O usa: brew install pgvector (macOS)")

if __name__ == '__main__':
    asyncio.run(install_pgvector())
