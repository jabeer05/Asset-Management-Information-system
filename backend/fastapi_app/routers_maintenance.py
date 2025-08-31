from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import crud, schemas, models, deps
from .auth import get_current_user

router = APIRouter(prefix="/maintenance", tags=["maintenance"])

@router.get("/", response_model=List[schemas.MaintenanceRead])
def read_maintenances(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    # For admin users, return all maintenance records
    if current_user.role == 'admin':
        return crud.get_maintenances(db, skip=skip, limit=limit)
    
    # For maintenance managers, filter by their assigned locations
    if current_user.role == 'manager' and current_user.permissions and 'maintenance' in current_user.permissions:
        return crud.get_maintenances_by_user_locations(db, current_user, skip=skip, limit=limit)
    
    # For other users, check if they have maintenance permission
    if current_user.permissions and 'maintenance' in current_user.permissions:
        return crud.get_maintenances_by_user_locations(db, current_user, skip=skip, limit=limit)
    
    # Default: return all maintenance records (fallback)
    return crud.get_maintenances(db, skip=skip, limit=limit)

@router.get("/{maintenance_id}", response_model=schemas.MaintenanceRead)
def read_maintenance(maintenance_id: int, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    db_maintenance = crud.get_maintenance(db, maintenance_id=maintenance_id)
    if db_maintenance is None:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    
    # For admin users, allow access to all maintenance records
    if current_user.role == 'admin':
        return db_maintenance
    
    # For maintenance managers, check location access
    if current_user.role == 'manager' and current_user.permissions and 'maintenance' in current_user.permissions:
        if not crud.can_access_maintenance_location(db, current_user, db_maintenance):
            raise HTTPException(status_code=403, detail="Access denied to this maintenance record")
        return db_maintenance
    
    # For other users with maintenance permission, check location access
    if current_user.permissions and 'maintenance' in current_user.permissions:
        if not crud.can_access_maintenance_location(db, current_user, db_maintenance):
            raise HTTPException(status_code=403, detail="Access denied to this maintenance record")
        return db_maintenance
    
    return db_maintenance

@router.post("/", response_model=schemas.MaintenanceRead, status_code=status.HTTP_201_CREATED)
def create_maintenance(maintenance: schemas.MaintenanceCreate, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    # Check if user has permission to create maintenance records
    if current_user.role != 'admin':
        has_maintenance_permission = current_user.permissions and 'maintenance' in current_user.permissions
        is_maintenance_manager = current_user.role == 'manager' and has_maintenance_permission
        
        if not is_maintenance_manager:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to create maintenance records"
            )
    
    # For non-admin users, check if they can create maintenance for the specified asset
    if current_user.role != 'admin' and maintenance.asset_id:
        if not crud.can_access_asset_location(db, current_user, maintenance.asset_id):
            raise HTTPException(status_code=403, detail="Access denied to create maintenance for this asset")
    
    return crud.create_maintenance(db, maintenance)

@router.put("/{maintenance_id}", response_model=schemas.MaintenanceRead)
def update_maintenance(maintenance_id: int, maintenance: schemas.MaintenanceCreate, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    # Check if user has permission to update maintenance records
    if current_user.role != 'admin':
        has_maintenance_permission = current_user.permissions and 'maintenance' in current_user.permissions
        is_maintenance_manager = current_user.role == 'manager' and has_maintenance_permission
        
        if not is_maintenance_manager:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to update maintenance records"
            )
    
    # Get existing maintenance record
    existing_maintenance = crud.get_maintenance(db, maintenance_id=maintenance_id)
    if existing_maintenance is None:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    
    # For non-admin users, check location access
    if current_user.role != 'admin':
        if not crud.can_access_maintenance_location(db, current_user, existing_maintenance):
            raise HTTPException(status_code=403, detail="Access denied to update this maintenance record")
    
    db_maintenance = crud.update_maintenance(db, maintenance_id, maintenance)
    if db_maintenance is None:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    return db_maintenance

@router.put("/{maintenance_id}/status")
def update_maintenance_status(
    maintenance_id: int,
    status_update: dict,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print(f"Updating maintenance {maintenance_id} status for user: {current_user.username}")
        print(f"Update data: {status_update}")
        
        # Get the maintenance record
        db_maintenance = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
        if not db_maintenance:
            raise HTTPException(status_code=404, detail="Maintenance record not found")
        
        # Check permissions
        if current_user.role != 'admin':
            has_maintenance_permission = current_user.permissions and 'maintenance' in current_user.permissions
            is_maintenance_manager = current_user.role == 'manager' and has_maintenance_permission
            
            if not is_maintenance_manager:
                raise HTTPException(
                    status_code=403, 
                    detail="You don't have permission to update maintenance status"
                )
            
            # Check location access
            if not crud.can_access_maintenance_location(db, current_user, db_maintenance):
                raise HTTPException(status_code=403, detail="Access denied to update this maintenance record")
        
        # Update status if provided
        if "status" in status_update:
            db_maintenance.status = status_update["status"]
            print(f"Updated maintenance status to: {status_update['status']}")
        
        db.commit()
        db.refresh(db_maintenance)
        
        return {"message": f"Maintenance status updated to {status_update.get('status', 'unknown')}", "maintenance": db_maintenance}
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error updating maintenance status: {e}")
        raise HTTPException(status_code=500, detail="Internal server error")

@router.delete("/{maintenance_id}", response_model=schemas.MaintenanceRead)
def delete_maintenance(maintenance_id: int, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    # Check if user has permission to delete maintenance records
    if current_user.role != 'admin':
        has_maintenance_permission = current_user.permissions and 'maintenance' in current_user.permissions
        is_maintenance_manager = current_user.role == 'manager' and has_maintenance_permission
        
        if not is_maintenance_manager:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to delete maintenance records"
            )
    
    # Get existing maintenance record
    existing_maintenance = crud.get_maintenance(db, maintenance_id=maintenance_id)
    if existing_maintenance is None:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    
    # For non-admin users, check location access
    if current_user.role != 'admin':
        if not crud.can_access_maintenance_location(db, current_user, existing_maintenance):
            raise HTTPException(status_code=403, detail="Access denied to delete this maintenance record")
    
    db_maintenance = crud.delete_maintenance(db, maintenance_id)
    if db_maintenance is None:
        raise HTTPException(status_code=404, detail="Maintenance record not found")
    return db_maintenance 