import jwt
from typing import Optional
from fastapi import HTTPException, status
from fastapi_app.database import SessionLocal
from fastapi_app.models import User

# Use the same secret key as in auth.py
SECRET_KEY = "your_super_secret_key_change_this"  # This should match the one in auth.py
ALGORITHM = "HS256"

def get_current_user_from_token(token: str) -> Optional[User]:
    """
    Extract user information from JWT token without creating circular imports
    """
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        username: str = payload.get("sub")
        if username is None:
            return None
        
        # Get user from database
        db = SessionLocal()
        try:
            user = db.query(User).filter(User.username == username).first()
            return user
        finally:
            db.close()
            
    except jwt.PyJWTError:
        return None
    except Exception:
        return None 