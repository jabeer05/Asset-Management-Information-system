from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi_app import models, schemas, deps
from fastapi_app.auth import get_current_user

router = APIRouter(prefix="/locations", tags=["locations"])

@router.get("/", response_model=List[schemas.LocationRead])
def read_locations(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Get all locations"""
    locations = db.query(models.Location).offset(skip).limit(limit).all()
    return locations



@router.get("/{location_id}", response_model=schemas.LocationRead)
def read_location(
    location_id: int, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific location by ID"""
    location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    return location

@router.post("/", response_model=schemas.LocationRead)
def create_location(
    location: schemas.LocationCreate, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Create a new location"""
    db_location = models.Location(**location.dict())
    db.add(db_location)
    db.commit()
    db.refresh(db_location)
    return db_location

@router.put("/{location_id}", response_model=schemas.LocationRead)
def update_location(
    location_id: int, 
    location: schemas.LocationCreate, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Update a location"""
    db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    
    for key, value in location.dict().items():
        setattr(db_location, key, value)
    
    db.commit()
    db.refresh(db_location)
    return db_location

@router.delete("/{location_id}")
def delete_location(
    location_id: int, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Delete a location"""
    db_location = db.query(models.Location).filter(models.Location.id == location_id).first()
    if db_location is None:
        raise HTTPException(status_code=404, detail="Location not found")
    
    db.delete(db_location)
    db.commit()
    return {"message": "Location deleted successfully"} 