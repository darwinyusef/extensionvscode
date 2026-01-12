import jwt
from datetime import datetime, timedelta

SECRET_KEY = "esta_es_una_llave_secreta_de_mas_de_32_caracteres_123"
ALGORITHM = "HS256"
USER_ID = "67d3bfa2-bdfc-4569-bef3-a57c2813ac10"

access_token_expires = timedelta(days=365)
to_encode = {
    "sub": USER_ID,
    "type": "access",
    "exp": datetime.utcnow() + access_token_expires
}
encoded_jwt = jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)
print(encoded_jwt)
