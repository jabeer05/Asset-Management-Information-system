from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi_app import models, schemas, deps
from fastapi_app.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/disposals", tags=["disposals"])

@router.get("/", response_model=List[schemas.DisposalReadWithAsset])
def get_disposals(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Join disposals with assets to get asset information
    disposals_with_assets = db.query(
        models.Disposal,
        models.Asset.name.label('asset_name'),
        models.Asset.category.label('asset_category'),
        models.Asset.location.label('asset_location')
    ).join(
        models.Asset, models.Disposal.asset_id == models.Asset.id
    ).order_by(models.Disposal.created_at.desc()).all()
    
    # Convert to response format
    result = []
    for disposal, asset_name, asset_category, asset_location in disposals_with_assets:
        disposal_dict = {
            "id": disposal.id,
            "asset_id": disposal.asset_id,
            "disposal_date": disposal.disposal_date,
            "method": disposal.method,
            "reason": disposal.reason,
            "proceeds": disposal.proceeds,
            "status": disposal.status,
            "created_at": disposal.created_at,
            # Asset information
            "asset_name": asset_name,
            "asset_category": asset_category,
            "asset_location": asset_location,
            # Enhanced disposal information (mapping method to method_name for frontend compatibility)
            "disposal_method_name": disposal.method,
            "estimated_proceeds": disposal.proceeds,  # Using proceeds as estimated
            "actual_proceeds": disposal.proceeds,     # Using proceeds as actual
            "disposal_cost": 0,  # Default value
            "net_proceeds": disposal.proceeds,        # Net proceeds same as proceeds for now
            "buyer_info": None,  # Not available in current schema
            "disposal_notes": disposal.reason,        # Using reason as notes
            # Approval information (not available in current schema)
            "approved_by": None,
            "approved_by_name": None,
            "approved_at": None,
            "rejection_reason": None,
            # Creator information (not available in current schema)
            "created_by": None,
            "created_by_name": None
        }
        result.append(disposal_dict)
    
    return result

@router.get("/{disposal_id}", response_model=schemas.DisposalReadWithAsset)
def get_disposal(
    disposal_id: int, 
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Get disposal with asset information
    disposal_with_asset = db.query(
        models.Disposal,
        models.Asset.name.label('asset_name'),
        models.Asset.category.label('asset_category'),
        models.Asset.location.label('asset_location')
    ).join(
        models.Asset, models.Disposal.asset_id == models.Asset.id
    ).filter(models.Disposal.id == disposal_id).first()
    
    if not disposal_with_asset:
        raise HTTPException(status_code=404, detail="Disposal not found")
    
    disposal, asset_name, asset_category, asset_location = disposal_with_asset
    
    disposal_dict = {
        "id": disposal.id,
        "asset_id": disposal.asset_id,
        "disposal_date": disposal.disposal_date,
        "method": disposal.method,
        "reason": disposal.reason,
        "proceeds": disposal.proceeds,
        "status": disposal.status,
        "created_at": disposal.created_at,
        # Asset information
        "asset_name": asset_name,
        "asset_category": asset_category,
        "asset_location": asset_location,
        # Enhanced disposal information
        "disposal_method_name": disposal.method,
        "estimated_proceeds": disposal.proceeds,
        "actual_proceeds": disposal.proceeds,
        "disposal_cost": 0,
        "net_proceeds": disposal.proceeds,
        "buyer_info": None,
        "disposal_notes": disposal.reason,
        # Approval information
        "approved_by": None,
        "approved_by_name": None,
        "approved_at": None,
        "rejection_reason": None,
        # Creator information
        "created_by": None,
        "created_by_name": None
    }
    
    return disposal_dict

@router.put("/{disposal_id}", response_model=schemas.DisposalRead)
def update_disposal(
    disposal_id: int, 
    disposal: schemas.DisposalCreate, 
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_disposal = db.query(models.Disposal).filter(models.Disposal.id == disposal_id).first()
    if not db_disposal:
        raise HTTPException(status_code=404, detail="Disposal not found")
    
    # Update disposal fields
    db_disposal.asset_id = disposal.asset_id
    db_disposal.disposal_date = disposal.disposal_date
    db_disposal.method = disposal.method
    db_disposal.reason = disposal.reason
    db_disposal.proceeds = disposal.proceeds
    db_disposal.status = disposal.status or db_disposal.status
    
    db.commit()
    db.refresh(db_disposal)
    return db_disposal

@router.post("/", response_model=schemas.DisposalRead, status_code=status.HTTP_201_CREATED)
def create_disposal(
    disposal: schemas.DisposalCreate, 
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    db_disposal = models.Disposal(
        asset_id=disposal.asset_id,
        disposal_date=disposal.disposal_date,
        method=disposal.method,
        reason=disposal.reason,
        proceeds=disposal.proceeds,
        status=disposal.status or "draft",
        created_at=datetime.utcnow()
    )
    db.add(db_disposal)
    db.commit()
    db.refresh(db_disposal)
    return db_disposal

@router.put("/{disposal_id}/status")
def update_disposal_status(
    disposal_id: int,
    status_update: dict,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print(f"Updating disposal {disposal_id} status for user: {current_user.username}")
        print(f"Update data: {status_update}")
        
        # Get the disposal
        db_disposal = db.query(models.Disposal).filter(models.Disposal.id == disposal_id).first()
        if not db_disposal:
            raise HTTPException(status_code=404, detail="Disposal not found")
        
        # Update status if provided
        if "status" in status_update:
            db_disposal.status = status_update["status"]
            print(f"Updated disposal status to: {status_update['status']}")
            
            # If status is being updated to 'completed', delete the asset
            if status_update["status"] == 'completed':
                print(f"🔄 Disposal completed - deleting asset {db_disposal.asset_id}")
                
                # Get the asset
                db_asset = db.query(models.Asset).filter(models.Asset.id == db_disposal.asset_id).first()
                if db_asset:
                    asset_name = db_asset.name
                    asset_id = db_asset.id
                    
                    # Create audit trail entry before deletion
                    try:
                        audit_entry = models.AuditTrail(
                            user_id=current_user.id,
                            action="asset_deleted_via_disposal",
                            table_name="assets",
                            record_id=asset_id,
                            old_values={"asset_name": asset_name, "asset_id": asset_id},
                            new_values={"status": "deleted", "disposal_id": disposal_id},
                            ip_address="system",
                            user_agent="system",
                            additional_data={
                                "disposal_id": disposal_id,
                                "deletion_reason": f"Asset disposed via disposal {disposal_id}",
                                "disposal_method": db_disposal.method,
                                "disposal_reason": db_disposal.reason,
                                "proceeds": float(db_disposal.proceeds) if db_disposal.proceeds else 0.0
                            }
                        )
                        db.add(audit_entry)
                        print(f"📝 Audit trail entry created for asset deletion via disposal")
                    except Exception as e:
                        print(f"⚠️ Failed to create audit trail entry: {e}")
                    
                    # Delete the asset (CASCADE DELETE will handle foreign key relationships)
                    db.delete(db_asset)
                    print(f"✅ Asset {asset_id} ({asset_name}) deleted successfully via disposal completion")
                else:
                    print(f"⚠️ Asset {db_disposal.asset_id} not found for disposal {disposal_id}")
        
        db.commit()
        
        # Check if the disposal still exists (it might have been deleted due to CASCADE DELETE)
        try:
            db.refresh(db_disposal)
            print(f"Disposal {disposal_id} updated successfully")
            return db_disposal
        except Exception as e:
            # If disposal was deleted due to CASCADE DELETE, return a success response
            if "Could not refresh instance" in str(e):
                print(f"Disposal {disposal_id} was deleted due to asset deletion (CASCADE DELETE)")
                return {
                    "id": disposal_id,
                    "status": "completed",
                    "message": "Disposal completed and asset deleted successfully"
                }
            else:
                raise e
    except Exception as e:
        print(f"Error updating disposal: {e}")
        db.rollback()
        raise

@router.delete("/{disposal_id}/asset", response_model=dict)
def delete_disposal_asset(
    disposal_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print(f"Deleting asset for disposal {disposal_id} by user: {current_user.username}")
        
        # Get the disposal
        db_disposal = db.query(models.Disposal).filter(models.Disposal.id == disposal_id).first()
        if not db_disposal:
            raise HTTPException(status_code=404, detail="Disposal not found")
        
        # Check if disposal is completed
        if db_disposal.status != 'completed':
            raise HTTPException(status_code=400, detail="Can only delete asset for completed disposals")
        
        # Get the asset
        db_asset = db.query(models.Asset).filter(models.Asset.id == db_disposal.asset_id).first()
        if not db_asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Delete the asset
        asset_name = db_asset.name
        db.delete(db_asset)
        db.commit()
        
        print(f"Asset '{asset_name}' deleted successfully for completed disposal {disposal_id}")
        return {"message": f"Asset '{asset_name}' deleted successfully", "asset_name": asset_name}
        
    except Exception as e:
        print(f"Error deleting disposal asset: {e}")
        db.rollback()
        raise 