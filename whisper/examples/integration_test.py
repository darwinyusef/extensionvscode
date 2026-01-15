import asyncio
import httpx
import json
from pathlib import Path

async def full_integration_test(base_url: str = "http://localhost:8001"):
    print("Starting Whisper Integration Tests")
    print("=" * 50)

    async with httpx.AsyncClient(timeout=300.0) as client:
        print("\n1. Health Check")
        response = await client.get(f"{base_url}/health")
        print(f"   Status: {response.json()['status']}")
        assert response.status_code == 200

        print("\n2. Root Endpoint")
        response = await client.get(f"{base_url}/")
        data = response.json()
        print(f"   Service: {data['service']}")
        assert response.status_code == 200

        audio_path = Path(__file__).parent / "fixtures" / "test.mp3"

        if not audio_path.exists():
            print("\n   WARNING: test.mp3 not found, skipping transcription tests")
            return

        print("\n3. Sync Transcription")
        with open(audio_path, "rb") as f:
            files = {"file": ("test.mp3", f)}
            response = await client.post(f"{base_url}/transcribe", files=files)

        data = response.json()
        print(f"   Task ID: {data['task_id']}")
        print(f"   Success: {data['success']}")
        print(f"   Text: {data.get('text', 'N/A')[:50]}...")
        assert response.status_code == 200
        assert data['success'] == True

        print("\n4. Async Transcription")
        with open(audio_path, "rb") as f:
            files = {"file": ("test.mp3", f)}
            response = await client.post(f"{base_url}/transcribe/async", files=files)

        data = response.json()
        task_id = data['task_id']
        print(f"   Task ID: {task_id}")
        print(f"   Status: {data['status']}")
        assert response.status_code == 200

        print("\n5. Task Status Check")
        await asyncio.sleep(2)
        response = await client.get(f"{base_url}/task/{task_id}")
        if response.status_code == 200:
            data = response.json()
            print(f"   Status: {data.get('status', 'N/A')}")

        print("\n6. Metrics Check")
        response = await client.get(f"{base_url}/metrics")
        metrics = response.json()
        print(f"   Metrics Count: {len(metrics)}")
        assert response.status_code == 200

        print("\n7. Invalid Format Test")
        files = {"file": ("test.txt", b"invalid", "text/plain")}
        response = await client.post(f"{base_url}/transcribe", files=files)
        print(f"   Expected 400: {response.status_code}")
        assert response.status_code == 400

    print("\n" + "=" * 50)
    print("All Tests Passed!")

if __name__ == "__main__":
    asyncio.run(full_integration_test())
