from fastapi import APIRouter, Depends, HTTPException, status, Query
from sqlalchemy.orm import Session
from typing import List, Optional
from fastapi_app import models, schemas, deps
from fastapi_app.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/notifications", tags=["notifications"])

@router.get("/", response_model=List[schemas.NotificationRead])
def get_notifications(
    user_id: Optional[int] = Query(None),
    parent_id: Optional[int] = Query(None),
    direction: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    query = db.query(models.Notification)
    if user_id is not None:
        query = query.filter(models.Notification.user_id == user_id)
    if parent_id is not None:
        query = query.filter(models.Notification.parent_id == parent_id)
    if direction is not None:
        query = query.filter(models.Notification.direction == direction)
    
    notifications = query.order_by(models.Notification.created_at.desc()).all()
    
    # Enhance notifications with user details
    enhanced_notifications = []
    for notification in notifications:
        # Get recipient (user) details
        recipient = db.query(models.User).filter(models.User.id == notification.user_id).first()
        
        # Get sender details if sender_id exists
        sender = None
        if notification.sender_id:
            sender = db.query(models.User).filter(models.User.id == notification.sender_id).first()
        
        # Create enhanced notification data

        
        enhanced_notification = {
            "id": notification.id,
            "user_id": notification.user_id,
            "sender_id": notification.sender_id,
            "title": notification.title,
            "message": notification.message,
            "type": notification.type,
            "priority": notification.priority,
            "action_url": notification.action_url,
            "action_text": notification.action_text,
            "notification_metadata": notification.notification_metadata if notification.notification_metadata else {},
            "direction": notification.direction,
            "is_read": notification.is_read,
            "parent_id": notification.parent_id,
            "created_at": notification.created_at,
            # Add recipient details
            "recipient_id": notification.user_id,
            "recipient_name": f"{recipient.first_name} {recipient.last_name}" if recipient else "Unknown",
            "recipient_email": recipient.email if recipient else "Unknown",
            # Add sender details
            "sender_name": f"{sender.first_name} {sender.last_name}" if sender else None,
            "sender_first_name": sender.first_name if sender else None,
            "sender_last_name": sender.last_name if sender else None,
            "sender_username": sender.username if sender else None,
            "sender_email": sender.email if sender else None,
        }
        enhanced_notifications.append(enhanced_notification)
    
    return enhanced_notifications

@router.get("/{notification_id}", response_model=schemas.NotificationRead)
def get_notification(
    notification_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific notification by ID"""
    # Join with users table to get sender and recipient details
    notification = db.query(models.Notification).filter(models.Notification.id == notification_id).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notification not found")
    
    # Check if user has permission to view this notification
    # Admin can view all notifications, users can only view their own
    if current_user.role != "admin" and notification.user_id != current_user.id:
        raise HTTPException(status_code=403, detail="Not authorized to view this notification")
    
    # Get recipient (user) details
    recipient = db.query(models.User).filter(models.User.id == notification.user_id).first()
    
    # Get sender details if sender_id exists
    sender = None
    if notification.sender_id:
        sender = db.query(models.User).filter(models.User.id == notification.sender_id).first()
    
    # Create a response with additional user details

    
    response_data = {
        "id": notification.id,
        "user_id": notification.user_id,
        "sender_id": notification.sender_id,
        "title": notification.title,
        "message": notification.message,
        "type": notification.type,
        "priority": notification.priority,
        "action_url": notification.action_url,
        "action_text": notification.action_text,
        "notification_metadata": notification.notification_metadata if notification.notification_metadata else {},
        "direction": notification.direction,
        "is_read": notification.is_read,
        "parent_id": notification.parent_id,
        "created_at": notification.created_at,
        # Add recipient details
        "recipient_id": notification.user_id,
        "recipient_name": f"{recipient.first_name} {recipient.last_name}" if recipient else "Unknown",
        "recipient_email": recipient.email if recipient else "Unknown",
        # Add sender details
        "sender_name": f"{sender.first_name} {sender.last_name}" if sender else None,
        "sender_first_name": sender.first_name if sender else None,
        "sender_last_name": sender.last_name if sender else None,
        "sender_username": sender.username if sender else None,
        "sender_email": sender.email if sender else None,
    }
    
    return response_data

@router.post("/", response_model=schemas.NotificationRead, status_code=status.HTTP_201_CREATED)
def create_notification(
    notification: schemas.NotificationCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Robust reply logic
    notif_data = notification.dict()
    
    # Remove sender_id from data to avoid duplicate keyword argument
    notif_data.pop('sender_id', None)
    
    if notif_data.get('parent_id'):
        parent = db.query(models.Notification).filter(models.Notification.id == notif_data['parent_id']).first()
        if not parent:
            raise HTTPException(status_code=404, detail="Parent notification not found")
        recipient_id = parent.sender_id or parent.user_id
        if not recipient_id:
            raise HTTPException(status_code=400, detail="Cannot determine recipient for reply")
        notif_data['user_id'] = recipient_id
        notif_data['title'] = notif_data.get('title') or f"Reply: {parent.title}"
    
    db_notification = models.Notification(
        **notif_data,
        sender_id=current_user.id,
        created_at=datetime.utcnow()
    )
    db.add(db_notification)
    db.commit()
    db.refresh(db_notification)
    return db_notification 