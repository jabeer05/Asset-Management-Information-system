from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi_app import models, schemas, deps
from fastapi_app.auth import get_current_user

router = APIRouter(prefix="/departments", tags=["departments"])

@router.get("/", response_model=List[schemas.DepartmentRead])
def read_departments(
    skip: int = 0, 
    limit: int = 100, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Get all departments"""
    departments = db.query(models.Department).offset(skip).limit(limit).all()
    return departments



@router.get("/{department_id}", response_model=schemas.DepartmentRead)
def read_department(
    department_id: int, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific department by ID"""
    department = db.query(models.Department).filter(models.Department.id == department_id).first()
    if department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    return department

@router.post("/", response_model=schemas.DepartmentRead)
def create_department(
    department: schemas.DepartmentCreate, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Create a new department"""
    db_department = models.Department(**department.dict())
    db.add(db_department)
    db.commit()
    db.refresh(db_department)
    return db_department

@router.put("/{department_id}", response_model=schemas.DepartmentRead)
def update_department(
    department_id: int, 
    department: schemas.DepartmentCreate, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Update a department"""
    db_department = db.query(models.Department).filter(models.Department.id == department_id).first()
    if db_department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    
    for key, value in department.dict().items():
        setattr(db_department, key, value)
    
    db.commit()
    db.refresh(db_department)
    return db_department

@router.delete("/{department_id}")
def delete_department(
    department_id: int, 
    db: Session = Depends(deps.get_db), 
    current_user: models.User = Depends(get_current_user)
):
    """Delete a department"""
    db_department = db.query(models.Department).filter(models.Department.id == department_id).first()
    if db_department is None:
        raise HTTPException(status_code=404, detail="Department not found")
    
    db.delete(db_department)
    db.commit()
    return {"message": "Department deleted successfully"} 