from sqlalchemy.orm import Session
from . import models, schemas
from typing import List, Optional
from sqlalchemy.exc import IntegrityError
from fastapi import HTTPException
from .auth import get_password_hash

def get_user(db: Session, user_id: int) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.id == user_id).first()

def get_user_by_username(db: Session, username: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.username == username).first()

def get_user_by_email(db: Session, email: str) -> Optional[models.User]:
    return db.query(models.User).filter(models.User.email == email).first()

def get_user_by_username_or_email(db: Session, username_or_email: str) -> Optional[models.User]:
    """Get user by username or email"""
    # First try username
    user = get_user_by_username(db, username_or_email)
    if user:
        return user
    # Then try email
    return get_user_by_email(db, username_or_email)

def get_users(db: Session, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).offset(skip).limit(limit).all()

def get_users_by_role(db: Session, role: str, skip: int = 0, limit: int = 100) -> List[models.User]:
    return db.query(models.User).filter(models.User.role == role).offset(skip).limit(limit).all()

def get_users_by_role_and_locations(db: Session, role: str, locations: List[str], skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get users by role who have access to any of the specified locations"""
    users = db.query(models.User).filter(models.User.role == role).all()
    
    # Filter users based on location access
    filtered_users = []
    for user in users:
        if not user.asset_access:
            continue
            
        # Parse asset_access if it's a JSON string
        if isinstance(user.asset_access, str):
            import json
            try:
                user_locations = json.loads(user.asset_access)
            except:
                user_locations = [user.asset_access]
        else:
            user_locations = user.asset_access
        
        # Check if user has access to any of the specified locations
        if any(location in user_locations for location in locations):
            filtered_users.append(user)
    
    return filtered_users[skip:skip + limit]

def get_users_by_role_and_specific_location(db: Session, role: str, location: str, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get users by role who are specifically assigned to the given location"""
    print(f"🔍 get_users_by_role_and_specific_location called with role={role}, location={location}")
    
    users = db.query(models.User).filter(models.User.role == role).all()
    print(f"📊 Found {len(users)} users with role '{role}'")
    
    # Filter users based on specific location assignment
    filtered_users = []
    for user in users:
        print(f"👤 Checking user: {user.first_name} {user.last_name}")
        print(f"   - User location: {user.location}")
        print(f"   - User asset_access: {user.asset_access}")
        print(f"   - User permissions: {user.permissions}")
        
        # First check if user's location field matches
        if user.location == location:
            print(f"   ✅ User location matches target location")
            filtered_users.append(user)
            continue
            
        # Then check asset_access
        if user.asset_access:
            # Parse asset_access if it's a JSON string
            if isinstance(user.asset_access, str):
                import json
                try:
                    user_locations = json.loads(user.asset_access)
                except:
                    user_locations = [user.asset_access]
            else:
                user_locations = user.asset_access
            
            print(f"   - Parsed user_locations: {user_locations}")
            
            # Check if user has access to the specific location
            if location in user_locations:
                print(f"   ✅ User has asset_access to target location")
                filtered_users.append(user)
            else:
                print(f"   ❌ User does not have asset_access to target location")
        else:
            print(f"   ❌ User has no asset_access")
    
    print(f"🎯 Final filtered users count: {len(filtered_users)}")
    for user in filtered_users:
        print(f"   - {user.first_name} {user.last_name} (ID: {user.id})")
    
    return filtered_users[skip:skip + limit]

def get_users_by_permission(db: Session, permission: str, current_user: models.User, location: str = None, skip: int = 0, limit: int = 100) -> List[models.User]:
    """Get users with specific permission, filtered by location for non-admin users"""
    print(f"🔐 get_users_by_permission called with permission={permission}, location={location}")
    print(f"👤 Current user: {current_user.first_name} {current_user.last_name} (role: {current_user.role})")
    
    # Map permission to role
    permission_to_role = {
        'maintenance': 'maintenance_manager',
        'disposal': 'disposal_manager', 
        'auctions': 'auction_manager',
        'auction': 'auction_manager'
    }
    
    target_role = permission_to_role.get(permission, 'manager')
    print(f"🎯 Looking for users with role: {target_role}")
    
    # Get all users with the target role or admin role
    users = db.query(models.User).filter(
        models.User.role.in_([target_role, 'admin', 'manager'])
    ).all()
    print(f"📊 Found {len(users)} users with role {target_role} or admin/manager")
    
    # Debug: Show all manager users and their permissions
    print("🔍 All manager users:")
    for user in users:
        print(f"   - {user.first_name} {user.last_name} (ID: {user.id})")
        print(f"     Role: {user.role}")
        print(f"     Permissions: {user.permissions}")
        print(f"     Asset Access: {user.asset_access}")
    
    # Filter users based on permission and location access
    filtered_users = []
    for user in users:
        print(f"🔍 Checking user: {user.first_name} {user.last_name}")
        print(f"   - User permissions: {user.permissions}")
        print(f"   - User asset_access: {user.asset_access}")
        
        # Check if user has the required permission
        has_permission = False
        
        # Admin users have all permissions
        if user.role == 'admin':
            has_permission = True
            print(f"   ✅ Admin user has all permissions")
        # Check specific role match
        elif user.role == target_role:
            has_permission = True
            print(f"   ✅ User has correct role: {user.role}")
        # Check permissions field
        elif user.permissions:
            # Parse permissions if it's a JSON string
            if isinstance(user.permissions, str):
                import json
                try:
                    user_permissions = json.loads(user.permissions)
                except:
                    user_permissions = [user.permissions]
            else:
                user_permissions = user.permissions
            
            print(f"   - Parsed permissions: {user_permissions}")
            has_permission = permission in user_permissions or 'all' in user_permissions
            print(f"   - Has {permission} permission: {has_permission}")
        
        if not has_permission:
            print(f"   ❌ User does not have {permission} permission or correct role")
            continue
        
        # Check location access if location is specified
        if location:
            print(f"   🏢 Checking location access for: {location}")
            
            # Check if target user has access to the specified location
            user_has_location_access = False
            if user.asset_access:
                if isinstance(user.asset_access, str):
                    import json
                    try:
                        user_locations = json.loads(user.asset_access)
                    except:
                        user_locations = [user.asset_access]
                else:
                    user_locations = user.asset_access
                
                print(f"   - Target user locations: {user_locations}")
                
                # Check if the specified location is in user's assigned locations
                user_has_location_access = location in user_locations
                print(f"   - Has access to {location}: {user_has_location_access}")
            
            if not user_has_location_access:
                print(f"   ❌ User does not have access to location: {location}")
                continue
        
        # For non-admin users, also check if they can see this user based on their own location access
        elif current_user.role != 'admin':
            print(f"   🔒 Non-admin user, checking location access")
            
            # Get current user's locations
            current_user_locations = []
            if current_user.asset_access:
                if isinstance(current_user.asset_access, str):
                    import json
                    try:
                        current_user_locations = json.loads(current_user.asset_access)
                    except:
                        current_user_locations = [current_user.asset_access]
                else:
                    current_user_locations = current_user.asset_access
            
            print(f"   - Current user locations: {current_user_locations}")
            
            # Check if target user has access to any of current user's locations
            user_has_location_access = False
            if user.asset_access:
                if isinstance(user.asset_access, str):
                    import json
                    try:
                        user_locations = json.loads(user.asset_access)
                    except:
                        user_locations = [user.asset_access]
                else:
                    user_locations = user.asset_access
                
                print(f"   - Target user locations: {user_locations}")
                
                # Check for location overlap
                common_locations = set(current_user_locations) & set(user_locations)
                user_has_location_access = len(common_locations) > 0
                print(f"   - Common locations: {common_locations}")
                print(f"   - Has location access: {user_has_location_access}")
            
            if not user_has_location_access:
                print(f"   ❌ User does not have location access")
                continue
        
        print(f"   ✅ User passed all checks")
        filtered_users.append(user)
    
    print(f"🎯 Final filtered users count: {len(filtered_users)}")
    for user in filtered_users:
        print(f"   - {user.first_name} {user.last_name} (ID: {user.id})")
    
    return filtered_users[skip:skip + limit]

def create_user(db: Session, user: schemas.UserCreate) -> models.User:
    user_dict = user.dict()
    user_dict['password'] = get_password_hash(user_dict['password'])
    db_user = models.User(**user_dict)
    db.add(db_user)
    try:
        db.commit()
        db.refresh(db_user)
    except IntegrityError as e:
        db.rollback()
        # Check for specific constraint violations
        error_message = str(e)
        if "Duplicate entry" in error_message:
            if "email" in error_message:
                raise HTTPException(
                    status_code=400, 
                    detail="A user with this email address already exists. Please use a different email."
                )
            elif "username" in error_message:
                raise HTTPException(
                    status_code=400, 
                    detail="A user with this username already exists. Please choose a different username."
                )
            else:
                raise HTTPException(
                    status_code=400, 
                    detail="A user with these details already exists. Please check your information."
                )
        else:
            raise HTTPException(
                status_code=400, 
                detail="Failed to create user. Please check your information and try again."
            )
    return db_user 

def get_asset(db: Session, asset_id: int):
    return db.query(models.Asset).filter(models.Asset.id == asset_id).first()

def get_assets(db: Session, skip: int = 0, limit: int = 100):
    return db.query(models.Asset).offset(skip).limit(limit).all()

def create_asset(db: Session, asset: schemas.AssetCreate):
    db_asset = models.Asset(**asset.dict())
    db.add(db_asset)
    db.commit()
    db.refresh(db_asset)
    return db_asset 

def update_asset(db: Session, asset_id: int, asset_update: schemas.AssetCreate):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        return None
    for key, value in asset_update.dict(exclude_unset=True).items():
        setattr(db_asset, key, value)
    db.commit()
    db.refresh(db_asset)
    return db_asset

def delete_asset(db: Session, asset_id: int):
    db_asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not db_asset:
        return None
    db.delete(db_asset)
    db.commit()
    return db_asset 

def get_maintenance(db: Session, maintenance_id: int):
    # Get maintenance record with asset information
    result = db.query(models.Maintenance, models.Asset.name.label('asset_name'), models.Asset.category.label('asset_category')).join(
        models.Asset, models.Maintenance.asset_id == models.Asset.id, isouter=True
    ).filter(models.Maintenance.id == maintenance_id).first()
    
    if result:
        maintenance, asset_name, asset_category = result
        # Create a dictionary with asset information
        maintenance_dict = {
            'id': maintenance.id,
            'asset_id': maintenance.asset_id,
            'asset_name': asset_name,
            'asset_category': asset_category,
            'maintenance_type': 'preventive',  # Default value
            'maintenance_date': maintenance.maintenance_date,
            'start_date': None,  # Not in database
            'completion_date': None,  # Not in database
            'description': maintenance.description,
            'cost': float(maintenance.cost) if maintenance.cost else 0.0,
            'priority': maintenance.priority,
            'performed_by': maintenance.performed_by,
            'vendor': None,  # Not in database
            'notes': None,  # Not in database
            'next_maintenance_date': None,  # Not in database
            'status': maintenance.status,
            'created_at': maintenance.created_at,
            'updated_at': None  # Not in database
        }
        return maintenance_dict
    
    return None

def get_maintenances(db: Session, skip: int = 0, limit: int = 100):
    # Get maintenance records with asset information
    results = db.query(models.Maintenance, models.Asset.name.label('asset_name'), models.Asset.category.label('asset_category')).join(
        models.Asset, models.Maintenance.asset_id == models.Asset.id, isouter=True
    ).offset(skip).limit(limit).all()
    
    # Convert to list of dictionaries with proper structure
    maintenance_list = []
    for maintenance, asset_name, asset_category in results:
        maintenance_dict = {
            'id': maintenance.id,
            'asset_id': maintenance.asset_id,
            'asset_name': asset_name,  # Now populated from asset join
            'asset_category': asset_category,
            'maintenance_type': 'preventive',  # Default value
            'maintenance_date': maintenance.maintenance_date,
            'start_date': None,  # Not in database
            'completion_date': None,  # Not in database
            'description': maintenance.description,
            'cost': float(maintenance.cost) if maintenance.cost else 0.0,
            'priority': maintenance.priority,
            'performed_by': maintenance.performed_by,
            'vendor': None,  # Not in database
            'notes': None,  # Not in database
            'next_maintenance_date': None,  # Not in database
            'status': maintenance.status,
            'created_at': maintenance.created_at,
            'updated_at': None  # Not in database
        }
        maintenance_list.append(maintenance_dict)
    
    return maintenance_list

def create_maintenance(db: Session, maintenance: schemas.MaintenanceCreate):
    from datetime import datetime
    
    # Create maintenance data with only the fields that exist in the database
    maintenance_data = {
        'asset_id': maintenance.asset_id,
        'maintenance_date': maintenance.maintenance_date,
        'description': maintenance.description,
        'cost': maintenance.cost,
        'priority': maintenance.priority,
        'performed_by': maintenance.performed_by,
        'status': maintenance.status,
        'created_at': datetime.utcnow()
    }
    
    db_maintenance = models.Maintenance(**maintenance_data)
    db.add(db_maintenance)
    db.commit()
    db.refresh(db_maintenance)
    return db_maintenance

def update_maintenance(db: Session, maintenance_id: int, maintenance_update: schemas.MaintenanceCreate):
    db_maintenance = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not db_maintenance:
        return None
    
    # Only update fields that exist in the database
    updateable_fields = ['asset_id', 'maintenance_date', 'description', 'cost', 'priority', 'performed_by', 'status']
    
    for key, value in maintenance_update.dict(exclude_unset=True).items():
        if key in updateable_fields:
            setattr(db_maintenance, key, value)
    
    db.commit()
    db.refresh(db_maintenance)
    return db_maintenance

def delete_maintenance(db: Session, maintenance_id: int):
    db_maintenance = db.query(models.Maintenance).filter(models.Maintenance.id == maintenance_id).first()
    if not db_maintenance:
        return None
    db.delete(db_maintenance)
    db.commit()
    return db_maintenance 

def get_maintenances_by_user_locations(db: Session, current_user: models.User, skip: int = 0, limit: int = 100):
    """Get maintenance records for assets in user's assigned locations"""
    # Get user's assigned locations
    if not current_user.asset_access:
        return []
    
    # Parse asset_access if it's a JSON string
    if isinstance(current_user.asset_access, str):
        import json
        try:
            asset_access = json.loads(current_user.asset_access)
        except:
            asset_access = [current_user.asset_access]
    else:
        asset_access = current_user.asset_access
    
    # Get assets in user's locations
    assets_in_locations = db.query(models.Asset).filter(
        models.Asset.location.in_(asset_access)
    ).all()
    
    asset_ids = [asset.id for asset in assets_in_locations]
    
    # Get maintenance records for these assets with asset information
    if asset_ids:
        results = db.query(models.Maintenance, models.Asset.name.label('asset_name'), models.Asset.category.label('asset_category')).join(
            models.Asset, models.Maintenance.asset_id == models.Asset.id, isouter=True
        ).filter(
            models.Maintenance.asset_id.in_(asset_ids)
        ).offset(skip).limit(limit).all()
        
        # Convert to list of dictionaries with proper structure
        maintenance_list = []
        for maintenance, asset_name, asset_category in results:
            maintenance_dict = {
                'id': maintenance.id,
                'asset_id': maintenance.asset_id,
                'asset_name': asset_name,  # Now populated from asset join
                'asset_category': asset_category,
                'maintenance_type': 'preventive',  # Default value
                'maintenance_date': maintenance.maintenance_date,
                'start_date': None,  # Not in database
                'completion_date': None,  # Not in database
                'description': maintenance.description,
                'cost': float(maintenance.cost) if maintenance.cost else 0.0,
                'priority': maintenance.priority,
                'performed_by': maintenance.performed_by,
                'vendor': None,  # Not in database
                'notes': None,  # Not in database
                'next_maintenance_date': None,  # Not in database
                'status': maintenance.status,
                'created_at': maintenance.created_at,
                'updated_at': None  # Not in database
            }
            maintenance_list.append(maintenance_dict)
        
        return maintenance_list
    else:
        return []

def can_access_maintenance_location(db: Session, current_user: models.User, maintenance_record: models.Maintenance):
    """Check if user can access a specific maintenance record based on asset location"""
    # Admin users can access all maintenance records
    if current_user.role == 'admin':
        return True
    
    # If no asset_id, deny access for non-admin users
    if not maintenance_record.asset_id:
        return False
    
    # Get the asset
    asset = db.query(models.Asset).filter(models.Asset.id == maintenance_record.asset_id).first()
    if not asset:
        return False
    
    # Check if user has access to this asset's location
    return can_access_asset_location(db, current_user, maintenance_record.asset_id)

def can_access_asset_location(db: Session, current_user: models.User, asset_id: int):
    """Check if user can access an asset based on location"""
    # Admin users can access all assets
    if current_user.role == 'admin':
        return True
    
    # Get the asset
    asset = db.query(models.Asset).filter(models.Asset.id == asset_id).first()
    if not asset:
        return False
    
    # Check if user has asset_access configured
    if not current_user.asset_access:
        return False
    
    # Parse asset_access if it's a JSON string
    if isinstance(current_user.asset_access, str):
        import json
        try:
            asset_access = json.loads(current_user.asset_access)
        except:
            asset_access = [current_user.asset_access]
    else:
        asset_access = current_user.asset_access
    
    # Check if asset location is in user's assigned locations
    return asset.location in asset_access

def create_transfer_request(db: Session, transfer_request: schemas.TransferRequestCreate, user_id: int):
    data = transfer_request.dict()
    data['requested_by'] = user_id
    db_transfer_request = models.TransferRequest(**data)
    db.add(db_transfer_request)
    db.commit()
    db.refresh(db_transfer_request)
    return db_transfer_request

def get_transfer_request(db: Session, transfer_request_id: int):
    """Get a single transfer request with enhanced asset and user information"""
    transfer = db.query(models.TransferRequest).filter(models.TransferRequest.id == transfer_request_id).first()
    
    if not transfer:
        return None
    
    # Enhance transfer request with asset and user information
    enhanced_transfer = {
        'id': transfer.id,
        'asset_id': transfer.asset_id,
        'asset_name': None,
        'asset_category': None,
        'asset_location': None,
        'transfer_type': 'internal',  # Default type
        'status': transfer.status or 'pending',
        'from_location': transfer.from_location,
        'to_location': transfer.to_location,
        'from_department': None,
        'to_department': None,
        'from_custodian': None,
        'to_custodian': None,
        'request_date': transfer.created_at.date() if transfer.created_at else None,
        'approved_date': None,
        'transfer_date': None,
        'completion_date': None,
        'reason': transfer.reason,
        'notes': transfer.notes,
        'estimated_cost': None,
        'actual_cost': None,
        'approval_by': None,
        'requested_by': transfer.requested_by,
        'requested_by_name': None,
        'requested_by_email': None,
        'created_at': transfer.created_at
    }
    
    # Get asset information if asset_id exists
    if transfer.asset_id:
        asset = db.query(models.Asset).filter(models.Asset.id == transfer.asset_id).first()
        if asset:
            enhanced_transfer['asset_name'] = asset.name
            enhanced_transfer['asset_category'] = asset.category
            enhanced_transfer['asset_location'] = asset.location
    
    # Get requester information
    if transfer.requested_by:
        requester = db.query(models.User).filter(models.User.id == transfer.requested_by).first()
        if requester:
            enhanced_transfer['requested_by_name'] = f"{requester.first_name} {requester.last_name}"
            enhanced_transfer['requested_by_email'] = requester.email
    
    return enhanced_transfer

def get_transfer_requests(db: Session, user_id: int = None, is_admin: bool = False):
    """Get transfer requests with enhanced asset and user information"""
    query = db.query(models.TransferRequest)
    if not is_admin and user_id is not None:
        query = query.filter(models.TransferRequest.requested_by == user_id)
    
    transfer_requests = query.order_by(models.TransferRequest.created_at.desc()).all()
    
    # Enhance transfer requests with asset and user information
    enhanced_requests = []
    for transfer in transfer_requests:
        enhanced_transfer = {
            'id': transfer.id,
            'asset_id': transfer.asset_id,
            'asset_name': None,
            'asset_category': None,
            'asset_location': None,
            'transfer_type': 'internal',  # Default type
            'status': transfer.status or 'pending',
            'from_location': transfer.from_location,
            'to_location': transfer.to_location,
            'from_department': None,
            'to_department': None,
            'from_custodian': None,
            'to_custodian': None,
            'request_date': transfer.created_at.date() if transfer.created_at else None,
            'approved_date': None,
            'transfer_date': None,
            'completion_date': None,
            'reason': transfer.reason,
            'notes': transfer.notes,
            'estimated_cost': None,
            'actual_cost': None,
            'approval_by': None,
            'requested_by': transfer.requested_by,
            'requested_by_name': None,
            'requested_by_email': None,
            'created_at': transfer.created_at
        }
        
        # Get asset information if asset_id exists
        if transfer.asset_id:
            asset = db.query(models.Asset).filter(models.Asset.id == transfer.asset_id).first()
            if asset:
                enhanced_transfer['asset_name'] = asset.name
                enhanced_transfer['asset_category'] = asset.category
                enhanced_transfer['asset_location'] = asset.location
        
        # Get requester information
        if transfer.requested_by:
            requester = db.query(models.User).filter(models.User.id == transfer.requested_by).first()
            if requester:
                enhanced_transfer['requested_by_name'] = f"{requester.first_name} {requester.last_name}"
                enhanced_transfer['requested_by_email'] = requester.email
        
        enhanced_requests.append(enhanced_transfer)
    
    return enhanced_requests

def update_transfer_request(db: Session, transfer_request_id: int, transfer_request_update: schemas.TransferRequestUpdate):
    db_transfer_request = db.query(models.TransferRequest).filter(models.TransferRequest.id == transfer_request_id).first()
    if not db_transfer_request:
        return None
    
    update_data = transfer_request_update.dict(exclude_unset=True)
    
    # Check if status is being updated to 'completed'
    status_being_updated = 'status' in update_data
    new_status = update_data.get('status')
    
    # Update transfer request
    for key, value in update_data.items():
        setattr(db_transfer_request, key, value)
    
    # If status is being updated to 'completed', also update the asset location
    if status_being_updated and new_status == 'completed' and db_transfer_request.asset_id:
        print(f"🔄 Transfer completed - updating asset {db_transfer_request.asset_id} location from '{db_transfer_request.from_location}' to '{db_transfer_request.to_location}'")
        
        # Get the asset and update its location
        asset = db.query(models.Asset).filter(models.Asset.id == db_transfer_request.asset_id).first()
        if asset:
            # Update asset location
            asset.location = db_transfer_request.to_location
            
            # Also update custodian if approved_by is specified
            if db_transfer_request.approved_by:
                approver = db.query(models.User).filter(models.User.id == db_transfer_request.approved_by).first()
                if approver:
                    asset.custodian_name = f"{approver.first_name} {approver.last_name}"
            
            # Update asset's updated_at timestamp
            from datetime import datetime
            asset.updated_at = datetime.utcnow()
            
            # Create audit trail entry for the asset transfer
            try:
                audit_entry = models.AuditTrail(
                    user_id=db_transfer_request.requested_by,  # Use the requester as the user
                    action="asset_transfer_completed",
                    table_name="assets",
                    record_id=asset.id,
                    old_values={"location": db_transfer_request.from_location},
                    new_values={"location": db_transfer_request.to_location},
                    ip_address="system",
                    user_agent="system",
                    additional_data={
                        "transfer_request_id": transfer_request_id,
                        "transfer_details": f"Asset transferred from {db_transfer_request.from_location} to {db_transfer_request.to_location}"
                    }
                )
                db.add(audit_entry)
                print(f"📝 Audit trail entry created for asset transfer")
            except Exception as e:
                print(f"⚠️ Failed to create audit trail entry: {e}")
            
            print(f"✅ Asset {asset.id} ({asset.name}) location updated to: {asset.location}")
        else:
            print(f"⚠️ Asset {db_transfer_request.asset_id} not found for transfer {transfer_request_id}")
    
    db.commit()
    db.refresh(db_transfer_request)
    return db_transfer_request 