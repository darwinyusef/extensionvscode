import asyncio
import httpx
import time
from pathlib import Path
from typing import List
import statistics

async def load_test(
    base_url: str,
    audio_file: str,
    num_requests: int = 100,
    concurrency: int = 10
):
    results: List[float] = []
    errors: List[str] = []
    start_total = time.time()

    semaphore = asyncio.Semaphore(concurrency)

    async def single_request(request_id: int):
        async with semaphore:
            start = time.time()
            try:
                async with httpx.AsyncClient(timeout=300.0) as client:
                    with open(audio_file, "rb") as f:
                        files = {"file": (Path(audio_file).name, f)}
                        response = await client.post(
                            f"{base_url}/transcribe",
                            files=files
                        )
                        response.raise_for_status()

                duration = time.time() - start
                results.append(duration)
                print(f"Request {request_id}: {duration:.2f}s")
            except Exception as e:
                errors.append(str(e))
                print(f"Request {request_id}: ERROR - {str(e)}")

    tasks = [single_request(i) for i in range(num_requests)]
    await asyncio.gather(*tasks)

    total_time = time.time() - start_total

    print("\n" + "=" * 60)
    print("Load Test Results")
    print("=" * 60)
    print(f"Total Requests: {num_requests}")
    print(f"Concurrency: {concurrency}")
    print(f"Successful: {len(results)}")
    print(f"Failed: {len(errors)}")
    print(f"Total Time: {total_time:.2f}s")
    print(f"Requests/sec: {num_requests / total_time:.2f}")

    if results:
        print(f"\nResponse Times:")
        print(f"  Mean: {statistics.mean(results):.2f}s")
        print(f"  Median: {statistics.median(results):.2f}s")
        print(f"  Min: {min(results):.2f}s")
        print(f"  Max: {max(results):.2f}s")
        if len(results) > 1:
            print(f"  Std Dev: {statistics.stdev(results):.2f}s")

        percentiles = [50, 75, 90, 95, 99]
        sorted_results = sorted(results)
        print(f"\nPercentiles:")
        for p in percentiles:
            idx = int(len(sorted_results) * p / 100)
            print(f"  P{p}: {sorted_results[idx]:.2f}s")

    if errors:
        print(f"\nFirst 5 Errors:")
        for error in errors[:5]:
            print(f"  - {error}")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python load_test.py <audio_file> [num_requests] [concurrency]")
        sys.exit(1)

    audio_file = sys.argv[1]
    num_requests = int(sys.argv[2]) if len(sys.argv) > 2 else 100
    concurrency = int(sys.argv[3]) if len(sys.argv) > 3 else 10

    asyncio.run(load_test(
        "http://localhost:8001",
        audio_file,
        num_requests,
        concurrency
    ))
