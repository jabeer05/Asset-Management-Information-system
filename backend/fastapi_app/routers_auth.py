from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from fastapi.security import OAuth2PasswordRequestForm
from . import crud, models, schemas, deps, auth
from .schemas import UserCreate, UserRead

router = APIRouter(prefix="/auth", tags=["auth"])

@router.post("/login", response_model=schemas.Token)
def login(form_data: OAuth2PasswordRequestForm = Depends(), db: Session = Depends(deps.get_db)):
    # Try to get user by username or email
    user = crud.get_user_by_username_or_email(db, form_data.username)
    if not user or not auth.verify_password(form_data.password, user.password):
        raise HTTPException(status_code=400, detail="Incorrect username/email or password")
    # Add role, permissions, and asset_access to the JWT payload
    access_token = auth.create_access_token(data={
        "sub": user.username,
        "role": user.role.value if hasattr(user.role, 'value') else str(user.role),
        "permissions": user.permissions,
        "asset_access": user.asset_access
    })
    return {"access_token": access_token, "token_type": "bearer"}

@router.post("/register", response_model=UserRead, status_code=status.HTTP_201_CREATED)
def register(user: UserCreate, db: Session = Depends(deps.get_db)):
    if crud.get_user_by_username(db, username=user.username):
        raise HTTPException(status_code=400, detail="Username already registered")
    return crud.create_user(db, user) 