from fastapi import APIRouter, Depends, HTTPException, status, File, UploadFile, Body
from sqlalchemy.orm import Session
from typing import List
from . import crud, schemas, models, deps
from .auth import get_current_user
import os

router = APIRouter(prefix="/assets", tags=["assets"])

@router.get("/", response_model=List[schemas.AssetRead])
def read_assets(skip: int = 0, limit: int = 100, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    """Get assets with location-based filtering for non-admin users"""
    
    print(f"User role: {current_user.role}, User asset_access: {current_user.asset_access}")
    
    # Admin users can see all assets
    if current_user.role == 'admin':
        assets = crud.get_assets(db, skip=skip, limit=limit)
        print(f"Admin - returning {len(assets)} assets")
        if assets:
            print(f"Sample asset: {assets[0].__dict__}")
        return assets
    
    # For maintenance managers, only show assets from their assigned locations
    if current_user.role == 'maintenance_manager' or (current_user.permissions and 'maintenance' in current_user.permissions):
        if current_user.asset_access:
            # Parse asset_access if it's a JSON string
            if isinstance(current_user.asset_access, str):
                import json
                try:
                    asset_access = json.loads(current_user.asset_access)
                except:
                    asset_access = [current_user.asset_access]
            else:
                asset_access = current_user.asset_access
            
            print(f"Maintenance manager asset_access: {asset_access}")
            
            # Filter assets by location only - no maintenance records from other locations
            assets = db.query(models.Asset).filter(
                models.Asset.location.in_(asset_access)
            ).offset(skip).limit(limit).all()
            
            print(f"Maintenance manager - returning {len(assets)} assets from assigned locations")
            if assets:
                print(f"Sample asset: {assets[0].__dict__}")
            
            return assets
        else:
            # If no asset_access, return empty list
            print("Maintenance manager has no asset_access - returning empty list")
            return []
    
    # For other non-admin users, filter by their asset access locations
    if current_user.asset_access:
        # Parse asset_access if it's a JSON string
        if isinstance(current_user.asset_access, str):
            import json
            try:
                asset_access = json.loads(current_user.asset_access)
            except:
                asset_access = [current_user.asset_access]
        else:
            asset_access = current_user.asset_access
        
        print(f"Other user asset_access: {asset_access}")
        
        # Filter assets by location
        assets = db.query(models.Asset).filter(
            models.Asset.location.in_(asset_access)
        ).offset(skip).limit(limit).all()
        
        print(f"Other user - returning {len(assets)} assets")
        if assets:
            print(f"Sample asset: {assets[0].__dict__}")
        
        return assets
    
    # If no asset access is set, return empty list for non-admin users
    print("No asset access - returning empty list")
    return []

@router.get("/{asset_id}", response_model=schemas.AssetRead)
def read_asset(asset_id: int, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    db_asset = crud.get_asset(db, asset_id=asset_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Admin users can access any asset
    if current_user.role == 'admin':
        return db_asset
    
    # For maintenance managers, check if they have any maintenance records for this asset
    if current_user.role == 'maintenance_manager' or (current_user.permissions and 'maintenance' in current_user.permissions):
        # Check if there are any maintenance records for this asset
        maintenance_records = db.query(models.Maintenance).filter(
            models.Maintenance.asset_id == asset_id
        ).all()
        
        if maintenance_records:
            # If there are maintenance records for this asset, allow access
            return db_asset
    
    # For non-admin users, check if they have access to this asset's location
    if current_user.asset_access:
        # Parse asset_access if it's a JSON string
        if isinstance(current_user.asset_access, str):
            import json
            try:
                asset_access = json.loads(current_user.asset_access)
            except:
                asset_access = [current_user.asset_access]
        else:
            asset_access = current_user.asset_access
        
        # Check if user has access to this asset's location
        if db_asset.location in asset_access:
            return db_asset
        else:
            raise HTTPException(status_code=403, detail="Access denied to this asset")
    
    # If no asset access is set, deny access for non-admin users
    raise HTTPException(status_code=403, detail="No asset access configured")

@router.post("/", response_model=schemas.AssetRead, status_code=status.HTTP_201_CREATED)
def create_asset(asset: schemas.AssetCreate, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    # Check if user can manage assets
    if current_user.role in ['auction_manager', 'disposal_manager']:
        raise HTTPException(
            status_code=403, 
            detail="Auction and disposal managers can only view assets, not create them"
        )
    
    # Check if user has assets permission or is a maintenance manager
    if current_user.role != 'admin':
        has_assets_permission = current_user.permissions and 'assets' in current_user.permissions
        is_maintenance_manager = current_user.role == 'maintenance_manager' or (current_user.permissions and 'maintenance' in current_user.permissions)
        
        if not has_assets_permission and not is_maintenance_manager:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to create assets"
            )
    
    # Check location-based access for non-admin users
    if current_user.role != 'admin':
        if current_user.asset_access:
            # Parse asset_access if it's a JSON string
            if isinstance(current_user.asset_access, str):
                import json
                try:
                    asset_access = json.loads(current_user.asset_access)
                except:
                    asset_access = [current_user.asset_access]
            else:
                asset_access = current_user.asset_access
            
            # Check if user has access to create assets in this location
            if asset.location not in asset_access:
                raise HTTPException(status_code=403, detail="Access denied to create assets in this location")
        else:
            raise HTTPException(status_code=403, detail="No asset access configured")
    
    return crud.create_asset(db, asset)

@router.put("/{asset_id}", response_model=schemas.AssetRead)
def update_asset(asset_id: int, asset: schemas.AssetCreate, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    # Check if user can manage assets
    if current_user.role in ['auction_manager', 'disposal_manager']:
        raise HTTPException(
            status_code=403, 
            detail="Auction and disposal managers can only view assets, not edit them"
        )
    
    # Check if user has assets permission or is a maintenance manager
    if current_user.role != 'admin':
        has_assets_permission = current_user.permissions and 'assets' in current_user.permissions
        is_maintenance_manager = current_user.role == 'maintenance_manager' or (current_user.permissions and 'maintenance' in current_user.permissions)
        
        if not has_assets_permission and not is_maintenance_manager:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to edit assets"
            )
    
    # Get the existing asset to check location access
    existing_asset = crud.get_asset(db, asset_id)
    if existing_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check location-based access for non-admin users
    if current_user.role != 'admin':
        if current_user.asset_access:
            # Parse asset_access if it's a JSON string
            if isinstance(current_user.asset_access, str):
                import json
                try:
                    asset_access = json.loads(current_user.asset_access)
                except:
                    asset_access = [current_user.asset_access]
            else:
                asset_access = current_user.asset_access
            
            # Check if user has access to this asset's location
            if existing_asset.location not in asset_access:
                raise HTTPException(status_code=403, detail="Access denied to this asset location")
        else:
            raise HTTPException(status_code=403, detail="No asset access configured")
    
    db_asset = crud.update_asset(db, asset_id, asset)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset

@router.delete("/{asset_id}", response_model=schemas.AssetRead)
def delete_asset(asset_id: int, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    # Check if user can manage assets
    if current_user.role in ['auction_manager', 'disposal_manager']:
        raise HTTPException(
            status_code=403, 
            detail="Auction and disposal managers can only view assets, not delete them"
        )
    
    # Check if user has assets permission or is a maintenance manager
    if current_user.role != 'admin':
        has_assets_permission = current_user.permissions and 'assets' in current_user.permissions
        is_maintenance_manager = current_user.role == 'maintenance_manager' or (current_user.permissions and 'maintenance' in current_user.permissions)
        
        if not has_assets_permission and not is_maintenance_manager:
            raise HTTPException(
                status_code=403, 
                detail="You don't have permission to delete assets"
            )
    
    # Get the existing asset to check location access
    existing_asset = crud.get_asset(db, asset_id)
    if existing_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    
    # Check location-based access for non-admin users
    if current_user.role != 'admin':
        if current_user.asset_access:
            # Parse asset_access if it's a JSON string
            if isinstance(current_user.asset_access, str):
                import json
                try:
                    asset_access = json.loads(current_user.asset_access)
                except:
                    asset_access = [current_user.asset_access]
            else:
                asset_access = current_user.asset_access
            
            # Check if user has access to this asset's location
            if existing_asset.location not in asset_access:
                raise HTTPException(status_code=403, detail="Access denied to this asset location")
        else:
            raise HTTPException(status_code=403, detail="No asset access configured")
    
    db_asset = crud.delete_asset(db, asset_id)
    if db_asset is None:
        raise HTTPException(status_code=404, detail="Asset not found")
    return db_asset

UPLOAD_DIR = os.getenv("ASSET_UPLOAD_DIR", "backend/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)

@router.post("/upload-image/", status_code=201)
def upload_asset_image(file: UploadFile = File(...), current_user: models.User = Depends(get_current_user)):
    file_location = os.path.join(UPLOAD_DIR, file.filename)
    with open(file_location, "wb") as f:
        f.write(file.file.read())
    url = f"/uploads/{file.filename}"
    return {"url": url}

@router.post("/{asset_id}/complaints", status_code=201)
def file_asset_complaint(
    asset_id: int,
    complaint_type: str = Body(...),
    description: str = Body(...),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Notify all admin users
    admin_users = db.query(models.User).filter(models.User.role == 'admin').all()
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    asset_name = asset.name if asset else f"Asset {asset_id}"
    for admin in admin_users:
        notification = models.Notification(
            user_id=admin.id,
            sender_id=current_user.id,
            title=f"Asset Complaint: {asset_name}",
            message=f"Complaint Type: {complaint_type}\nDescription: {description}",
            type="complaint",
            priority="high",
            is_read=0
        )
        db.add(notification)
    db.commit()
    return {"message": "Complaint submitted and admin notified"} 