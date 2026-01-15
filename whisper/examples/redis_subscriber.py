import redis
import json
import time

def subscribe_to_task(task_id: str, redis_host: str = "localhost", redis_port: int = 6379):
    r = redis.Redis(host=redis_host, port=redis_port, decode_responses=True)
    pubsub = r.pubsub()

    channel = f"whisper:task:{task_id}"
    pubsub.subscribe(channel)

    print(f"Listening to channel: {channel}")

    for message in pubsub.listen():
        if message["type"] == "message":
            data = json.loads(message["data"])
            print(f"\nReceived update:")
            print(f"  Status: {data.get('status')}")
            print(f"  Text: {data.get('text', 'N/A')}")
            print(f"  Error: {data.get('error', 'N/A')}")

            if data.get('status') in ['completed', 'failed']:
                print("\nTask finished!")
                break

    pubsub.close()

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python redis_subscriber.py <task_id>")
        sys.exit(1)

    subscribe_to_task(sys.argv[1])
