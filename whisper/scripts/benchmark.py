import asyncio
import httpx
import time
from statistics import mean, median, stdev
from pathlib import Path

async def benchmark_endpoint(url: str, audio_file: str, concurrent: int = 10):
    results = []

    async def single_request():
        start = time.time()
        async with httpx.AsyncClient(timeout=300.0) as client:
            with open(audio_file, "rb") as f:
                files = {"file": (Path(audio_file).name, f)}
                response = await client.post(url, files=files)
                response.raise_for_status()
        duration = time.time() - start
        return duration

    tasks = [single_request() for _ in range(concurrent)]
    results = await asyncio.gather(*tasks, return_exceptions=True)

    successful = [r for r in results if not isinstance(r, Exception)]
    failed = len(results) - len(successful)

    if successful:
        print(f"\nBenchmark Results ({concurrent} concurrent requests):")
        print(f"  Successful: {len(successful)}")
        print(f"  Failed: {failed}")
        print(f"  Mean: {mean(successful):.2f}s")
        print(f"  Median: {median(successful):.2f}s")
        if len(successful) > 1:
            print(f"  Std Dev: {stdev(successful):.2f}s")
        print(f"  Min: {min(successful):.2f}s")
        print(f"  Max: {max(successful):.2f}s")

if __name__ == "__main__":
    import sys
    if len(sys.argv) < 2:
        print("Usage: python benchmark.py <audio_file> [concurrent_requests]")
        sys.exit(1)

    audio_file = sys.argv[1]
    concurrent = int(sys.argv[2]) if len(sys.argv) > 2 else 10

    asyncio.run(benchmark_endpoint(
        "http://localhost:8001/transcribe",
        audio_file,
        concurrent
    ))
