from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from . import crud, schemas, models, deps
from .auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/maintenance-complaints", tags=["maintenance-complaints"])

@router.post("/", status_code=status.HTTP_201_CREATED)
def create_maintenance_complaint(
    complaint_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a maintenance complaint from a user with role 'user'"""
    
    # Only allow users with role 'user' to create maintenance complaints
    if current_user.role != 'user':
        raise HTTPException(status_code=403, detail="Only users with role 'user' can create maintenance complaints")
    
    try:
        # Create the maintenance complaint record
        maintenance_complaint = models.MaintenanceComplaint(
            asset_id=complaint_data.get('asset_id'),
            asset_name=complaint_data.get('asset_name'),
            complaint_type=complaint_data.get('complaint_type'),
            description=complaint_data.get('description'),
            user_id=current_user.id,
            user_location=complaint_data.get('user_location'),
            user_department=complaint_data.get('user_department'),
            priority=complaint_data.get('priority', 'medium'),
            status='pending',
            created_at=datetime.now()
        )
        
        db.add(maintenance_complaint)
        db.commit()
        db.refresh(maintenance_complaint)
        
        # Find maintenance managers and admins to notify
        maintenance_managers = db.query(models.User).filter(
            models.User.role.in_(['manager', 'admin']),
            models.User.location == current_user.location
        ).all()
        
        admins = db.query(models.User).filter(models.User.role == 'admin').all()
        
        # Combine unique users to notify
        users_to_notify = list(set(maintenance_managers + admins))
        
        # Get asset details for better notification
        asset_details = ""
        if complaint_data.get('asset_id'):
            asset = db.query(models.Asset).filter(models.Asset.id == complaint_data.get('asset_id')).first()
            if asset:
                asset_details = f"\nAsset Details:\n"
                asset_details += f"• Asset ID: {asset.id}\n"
                asset_details += f"• Asset Name: {asset.name}\n"
                asset_details += f"• Category: {asset.category or 'N/A'}\n"
                asset_details += f"• Model: {asset.model or 'N/A'}\n"
                asset_details += f"• Manufacturer: {asset.manufacturer or 'N/A'}\n"
                asset_details += f"• Serial Number: {asset.serial_number or 'N/A'}\n"
                asset_details += f"• Current Location: {asset.location or 'N/A'}\n"
                asset_details += f"• Status: {asset.status or 'N/A'}\n"
                asset_details += f"• Condition: {asset.asset_condition or 'N/A'}\n"

        # Create notifications for each user
        for user_to_notify in users_to_notify:
            notification = models.Notification(
                user_id=user_to_notify.id,
                sender_id=current_user.id,
                title=f"Maintenance Complaint: {complaint_data.get('asset_name', 'Asset')}",
                message=f"Complaint Type: {complaint_data.get('complaint_type')}\n"
                       f"Description: {complaint_data.get('description')}\n"
                       f"Location: {complaint_data.get('user_location')}\n"
                       f"Department: {complaint_data.get('user_department')}\n"
                       f"Priority: {complaint_data.get('priority', 'medium')}"
                       f"{asset_details}",
                type="maintenance_complaint",
                priority=complaint_data.get('priority', 'medium'),
                is_read=0,
                created_at=datetime.now(),
                action_url=f"/assets/{complaint_data.get('asset_id')}" if complaint_data.get('asset_id') else None,
                action_text="View Asset Details",
                notification_metadata={
                    "asset_id": complaint_data.get('asset_id'),
                    "asset_name": complaint_data.get('asset_name'),
                    "complaint_id": maintenance_complaint.id,
                    "complaint_type": complaint_data.get('complaint_type'),
                    "user_location": complaint_data.get('user_location'),
                    "user_department": complaint_data.get('user_department'),
                    "asset_details": {
                        "id": asset.id if asset else None,
                        "name": asset.name if asset else None,
                        "category": asset.category if asset else None,
                        "model": asset.model if asset else None,
                        "manufacturer": asset.manufacturer if asset else None,
                        "serial_number": asset.serial_number if asset else None,
                        "location": asset.location if asset else None,
                        "status": asset.status if asset else None,
                        "condition": asset.asset_condition if asset else None
                    } if asset else None
                }
            )
            db.add(notification)
        
        # Create a notification for the user who submitted the complaint (for their "sent" tab)
        user_notification = models.Notification(
            user_id=current_user.id,
            sender_id=current_user.id,
            title=f"Complaint Submitted: {complaint_data.get('asset_name', 'Asset')}",
            message=f"Your complaint has been submitted successfully.\n"
                   f"Complaint Type: {complaint_data.get('complaint_type')}\n"
                   f"Description: {complaint_data.get('description')}\n"
                   f"Status: Pending Review\n"
                   f"Complaint ID: {maintenance_complaint.id}",
            type="complaint_submitted",
            priority=complaint_data.get('priority', 'medium'),
            is_read=0,
            created_at=datetime.now()
        )
        db.add(user_notification)
        
        db.commit()
        
        return {
            "message": "Maintenance complaint submitted successfully",
            "complaint_id": maintenance_complaint.id,
            "notifications_sent": len(users_to_notify)
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error creating maintenance complaint: {str(e)}")

@router.get("/", response_model=List[dict])
def get_maintenance_complaints(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get maintenance complaints - users can see their own, managers/admins can see all"""
    
    if current_user.role == 'user':
        # Users can only see their own complaints
        complaints = db.query(models.MaintenanceComplaint).filter(
            models.MaintenanceComplaint.user_id == current_user.id
        ).order_by(models.MaintenanceComplaint.created_at.desc()).all()
    else:
        # Managers and admins can see all complaints
        complaints = db.query(models.MaintenanceComplaint).order_by(
            models.MaintenanceComplaint.created_at.desc()
        ).all()
    
    return [
        {
            "id": complaint.id,
            "asset_id": complaint.asset_id,
            "asset_name": complaint.asset_name,
            "complaint_type": complaint.complaint_type,
            "description": complaint.description,
            "user_id": complaint.user_id,
            "user_location": complaint.user_location,
            "user_department": complaint.user_department,
            "priority": complaint.priority,
            "status": complaint.status,
            "created_at": complaint.created_at
        }
        for complaint in complaints
    ]

@router.post("/{complaint_id}/reply", status_code=status.HTTP_201_CREATED)
def reply_to_complaint(
    complaint_id: int,
    reply_data: dict,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Reply to a maintenance complaint - only managers and admins can reply"""
    
    # Only allow managers and admins to reply
    if current_user.role not in ['manager', 'admin']:
        raise HTTPException(status_code=403, detail="Only managers and admins can reply to complaints")
    
    try:
        # Get the complaint
        complaint = db.query(models.MaintenanceComplaint).filter(
            models.MaintenanceComplaint.id == complaint_id
        ).first()
        
        if not complaint:
            raise HTTPException(status_code=404, detail="Complaint not found")
        
        # Get the user who submitted the complaint
        complaint_user = db.query(models.User).filter(models.User.id == complaint.user_id).first()
        
        if not complaint_user:
            raise HTTPException(status_code=404, detail="Complaint user not found")
        
        # Create a notification for the user who submitted the complaint
        notification = models.Notification(
            user_id=complaint.user_id,
            sender_id=current_user.id,
            title=f"Reply to Complaint: {complaint.asset_name}",
            message=f"Your complaint has received a reply:\n\n"
                   f"Reply: {reply_data.get('message')}\n"
                   f"Status: {reply_data.get('status', 'In Progress')}\n"
                   f"Replied by: {current_user.first_name} {current_user.last_name}\n"
                   f"Complaint ID: {complaint.id}",
            type="complaint_reply",
            priority=reply_data.get('priority', 'medium'),
            is_read=0,
            created_at=datetime.now()
        )
        db.add(notification)
        
        # Update complaint status if provided
        if reply_data.get('status'):
            complaint.status = reply_data.get('status')
        
        db.commit()
        
        return {
            "message": "Reply sent successfully",
            "notification_id": notification.id
        }
        
    except Exception as e:
        db.rollback()
        raise HTTPException(status_code=500, detail=f"Error sending reply: {str(e)}") 