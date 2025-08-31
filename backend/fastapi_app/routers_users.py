from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from . import crud, schemas, models, deps
from .auth import get_current_user

router = APIRouter(prefix="/users", tags=["users"])

@router.get("/me", response_model=schemas.UserRead)
def read_me(current_user: models.User = Depends(get_current_user)):
    return current_user

@router.get("/", response_model=List[schemas.UserRead])
def read_users(
    skip: int = 0, 
    limit: int = 100, 
    user_id: Optional[int] = Query(None),
    role: Optional[str] = Query(None),
    locations: Optional[str] = Query(None),  # Comma-separated list of locations
    location: Optional[str] = Query(None),   # Single specific location
    permission: Optional[str] = Query(None), # Filter by specific permission
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    print(f"🌐 Users API called with parameters:")
    print(f"   - user_id: {user_id}")
    print(f"   - role: {role}")
    print(f"   - locations: {locations}")
    print(f"   - location: {location}")
    print(f"   - permission: {permission}")
    print(f"   - skip: {skip}")
    print(f"   - limit: {limit}")
    
    if user_id is not None:
        # Return single user by ID
        print(f"🔍 Returning single user by ID: {user_id}")
        db_user = crud.get_user(db, user_id=user_id)
        if db_user is None:
            raise HTTPException(status_code=404, detail="User not found")
        return [db_user]
    
    # Handle permission-based filtering
    if permission is not None:
        print(f"🔐 Getting users with permission: {permission}")
        return crud.get_users_by_permission(db, permission=permission, current_user=current_user, location=location, skip=skip, limit=limit)
    
    if role is not None:
        # Check if we need location-based filtering
        if location is not None:
            # Get users assigned to a specific location
            print(f"🎯 Getting users by role and specific location: role={role}, location={location}")
            return crud.get_users_by_role_and_specific_location(db, role=role, location=location, skip=skip, limit=limit)
        elif locations is not None:
            # Parse locations from comma-separated string
            print(f"📍 Getting users by role and multiple locations: role={role}, locations={locations}")
            location_list = [loc.strip() for loc in locations.split(',') if loc.strip()]
            return crud.get_users_by_role_and_locations(db, role=role, locations=location_list, skip=skip, limit=limit)
        else:
            # Filter users by role
            print(f"👥 Getting users by role only: role={role}")
            return crud.get_users_by_role(db, role=role, skip=skip, limit=limit)
    
    print(f"📋 Getting all users")
    return crud.get_users(db, skip=skip, limit=limit)

@router.get("/{user_id}", response_model=schemas.UserRead)
def read_user(
    user_id: int, 
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    return db_user

@router.post("/", response_model=schemas.UserRead, status_code=status.HTTP_201_CREATED)
def create_user(user: schemas.UserCreate, db: Session = Depends(deps.get_db)):
    try:
        # Check for existing username
        if crud.get_user_by_username(db, username=user.username):
            raise HTTPException(status_code=400, detail="A user with this username already exists. Please choose a different username.")
        
        # Check for existing email
        if crud.get_user_by_email(db, email=user.email):
            raise HTTPException(status_code=400, detail="A user with this email address already exists. Please use a different email.")
        
        return crud.create_user(db, user)
    except HTTPException:
        # Re-raise HTTP exceptions (like duplicate username/email)
        raise
    except Exception as e:
        # Handle any other unexpected errors
        print(f"Error creating user: {e}")
        raise HTTPException(
            status_code=500, 
            detail="An error occurred while creating the user. Please try again."
        )

@router.put("/{user_id}", response_model=schemas.UserRead)
def update_user(
    user_id: int,
    user_update: schemas.UserUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if user has permission to update users
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions to update users")
    
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Update user fields
    update_data = user_update.dict(exclude_unset=True)
    for field, value in update_data.items():
        if field != 'password':  # Don't update password through this endpoint
            setattr(db_user, field, value)
    
    db.commit()
    db.refresh(db_user)
    return db_user

@router.delete("/{user_id}")
def delete_user(
    user_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if user has permission to delete users
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions to delete users")
    
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Prevent deleting own account
    if db_user.id == current_user.id:
        raise HTTPException(status_code=400, detail="Cannot delete your own account")
    
    # Delete the user
    db.delete(db_user)
    db.commit()
    
    return {"message": "User deleted successfully"}

@router.post("/reset-password")
def reset_password(
    request: dict,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if user has permission to reset passwords
    if current_user.role not in ["admin"]:
        raise HTTPException(status_code=403, detail="Insufficient permissions to reset passwords")
    
    user_id = request.get("user_id")
    email = request.get("email")
    
    if not user_id or not email:
        raise HTTPException(status_code=400, detail="user_id and email are required")
    
    # Get the user to reset password for
    db_user = crud.get_user(db, user_id=user_id)
    if db_user is None:
        raise HTTPException(status_code=404, detail="User not found")
    
    # Verify email matches
    if db_user.email != email:
        raise HTTPException(status_code=400, detail="Email does not match user")
    
    # Generate a temporary password
    import secrets
    import string
    temp_password = ''.join(secrets.choice(string.ascii_letters + string.digits) for _ in range(12))
    
    # Hash the temporary password
    from .auth import get_password_hash
    hashed_password = get_password_hash(temp_password)
    
    # Update user's password
    db_user.hashed_password = hashed_password
    db.commit()
    
    # Return the temporary password (in production, this should be sent via email)
    return {
        "message": "Password reset successfully",
        "temporary_password": temp_password,
        "user_email": email
    }