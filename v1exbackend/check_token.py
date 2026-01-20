from jose import jwt
from app.core.config import settings

token = "eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJzdWIiOiI2N2QzYmZhMi1iZGZjLTQ1NjktYmVmMy1hNTdjMjgxM2FjMTAiLCJ0eXBlIjoiYWNjZXNzIiwiZXhwIjoxNzk5NjkyOTc2fQ.sZ6kJsCPiUlHBHiaOkuh34aWJKknPSAualCvelBZgOY"
try:
    payload = jwt.decode(token, settings.SECRET_KEY, algorithms=[settings.ALGORITHM])
    print("SUCCESS", payload)
except Exception as e:
    print("FAIL", e)
