"""Security utilities for JWT authentication and password hashing."""

from datetime import datetime, timedelta
from typing import Optional, Any
from jose import JWTError, jwt
from passlib.context import CryptContext
from fastapi import HTTPException, Security, status
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials

from app.core.config import settings

# Password hashing context
pwd_context = CryptContext(schemes=["bcrypt"], deprecated="auto")

# HTTP Bearer scheme for Swagger authentication
security_scheme = HTTPBearer(
    scheme_name="JWT Bearer Token",
    description="Enter your JWT token (without 'Bearer' prefix)"
)


def verify_password(plain_password: str, hashed_password: str) -> bool:
    """Verify a password against its hash."""
    return pwd_context.verify(plain_password, hashed_password)


def get_password_hash(password: str) -> str:
    """Hash a password for storing."""
    return pwd_context.hash(password)


def create_access_token(data: dict[str, Any], expires_delta: Optional[timedelta] = None) -> str:
    """
    Create a JWT access token.

    Args:
        data: Data to encode in the token (usually {"sub": user_id})
        expires_delta: Optional custom expiration time

    Returns:
        Encoded JWT token string
    """
    to_encode = data.copy()

    if expires_delta:
        expire = datetime.utcnow() + expires_delta
    else:
        expire = datetime.utcnow() + timedelta(minutes=settings.ACCESS_TOKEN_EXPIRE_MINUTES)

    to_encode.update({"exp": expire, "type": "access"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def create_refresh_token(data: dict[str, Any]) -> str:
    """
    Create a JWT refresh token with longer expiration.

    Args:
        data: Data to encode in the token (usually {"sub": user_id})

    Returns:
        Encoded JWT refresh token string
    """
    to_encode = data.copy()
    expire = datetime.utcnow() + timedelta(days=settings.REFRESH_TOKEN_EXPIRE_DAYS)

    to_encode.update({"exp": expire, "type": "refresh"})

    encoded_jwt = jwt.encode(
        to_encode,
        settings.SECRET_KEY,
        algorithm=settings.ALGORITHM
    )

    return encoded_jwt


def decode_token(token: str) -> Optional[dict[str, Any]]:
    """
    Decode and verify a JWT token.

    Args:
        token: JWT token string

    Returns:
        Decoded payload or None if invalid
    """
    try:
        payload = jwt.decode(
            token,
            settings.SECRET_KEY,
            algorithms=[settings.ALGORITHM]
        )
        return payload
    except JWTError:
        return None


def extract_user_id_from_token(token: str) -> Optional[str]:
    """
    Extract user ID from JWT token.

    Args:
        token: JWT token string

    Returns:
        User ID (sub claim) or None if invalid
    """
    payload = decode_token(token)
    if payload:
        return payload.get("sub")
    return None


async def get_current_user_id(
    credentials: HTTPAuthorizationCredentials = Security(security_scheme)
) -> str:
    """
    Validate JWT token and extract user ID.
    This dependency can be used in any FastAPI endpoint to require authentication.

    Args:
        credentials: HTTP Bearer credentials from request header

    Returns:
        User ID extracted from valid JWT token

    Raises:
        HTTPException: If token is invalid or expired
    """
    token = credentials.credentials

    payload = decode_token(token)

    if payload is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid authentication credentials",
            headers={"WWW-Authenticate": "Bearer"},
        )

    user_id: Optional[str] = payload.get("sub")

    if user_id is None:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Could not validate credentials - user ID not found in token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    # Optional: Check token type
    token_type = payload.get("type")
    if token_type != "access":
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Invalid token type - expected access token",
            headers={"WWW-Authenticate": "Bearer"},
        )

    return user_id


async def get_current_admin_user_id(
    user_id: str = Security(get_current_user_id)
) -> str:
    """
    Validate that the current user is an admin.

    This dependency first validates the JWT token (via get_current_user_id),
    then checks if the user has admin privileges.

    Args:
        user_id: User ID extracted from JWT token

    Returns:
        User ID if user is admin

    Raises:
        HTTPException: If user is not an admin

    Usage in routes:
        @router.get("/admin/something")
        async def admin_endpoint(
            admin_id: str = Depends(get_current_admin_user_id)
        ):
            # Only admins can access this
            pass
    """
    # TODO: In production, check user role from database
    # Example:
    # user = await db.execute(select(User).where(User.id == user_id))
    # if not user or user.role != "admin":
    #     raise HTTPException(status_code=403, detail="Admin access required")

    # For now, allow only users with "admin" in their user_id
    # This is a temporary check for development/testing
    if "admin" not in user_id.lower():
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Admin access required. Insufficient permissions.",
        )

    return user_id
