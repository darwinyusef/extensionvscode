import asyncio
from nats.aio.client import Client as NATS
import json

async def subscribe_to_task(task_id: str, nats_url: str = "nats://localhost:4222"):
    nc = NATS()
    await nc.connect(nats_url)

    print(f"Connected to NATS: {nats_url}")
    print(f"Listening to subject: whisper.task.{task_id}")

    sub = await nc.subscribe(f"whisper.task.{task_id}")

    try:
        while True:
            try:
                msg = await asyncio.wait_for(sub.next_msg(), timeout=60.0)
                data = json.loads(msg.data.decode())

                print(f"\nReceived update:")
                print(f"  Status: {data.get('status')}")
                print(f"  Text: {data.get('text', 'N/A')[:100]}")
                print(f"  Language: {data.get('language', 'N/A')}")
                print(f"  Error: {data.get('error', 'N/A')}")

                if data.get('status') in ['completed', 'failed']:
                    print("\nTask finished!")
                    break

            except asyncio.TimeoutError:
                print("Waiting for messages...")
                continue

    finally:
        await sub.unsubscribe()
        await nc.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python nats_subscriber.py <task_id>")
        sys.exit(1)

    asyncio.run(subscribe_to_task(sys.argv[1]))
