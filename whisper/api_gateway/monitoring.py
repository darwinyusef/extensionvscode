import time
from functools import wraps
import json
import os
from collections import deque

metrics_store = deque(maxlen=1000)

def track_metrics(endpoint: str):
    def decorator(func):
        @wraps(func)
        async def wrapper(*args, **kwargs):
            start_time = time.time()
            error = None

            try:
                result = await func(*args, **kwargs)
                return result
            except Exception as e:
                error = str(e)
                raise
            finally:
                duration = time.time() - start_time
                metric = {
                    "endpoint": endpoint,
                    "duration": duration,
                    "timestamp": time.time(),
                    "error": error
                }
                metrics_store.append(metric)

        return wrapper
    return decorator

async def get_metrics():
    return list(metrics_store)
