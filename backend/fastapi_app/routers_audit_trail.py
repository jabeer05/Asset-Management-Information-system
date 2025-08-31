from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi_app import models, schemas, deps
from fastapi_app.auth import get_current_user

router = APIRouter(prefix="/audit", tags=["audit"])

@router.get("/")
def get_audit_trail(
    skip: int = Query(0, ge=0),
    limit: int = Query(100, ge=1, le=1000),
    user_id: Optional[int] = Query(None),
    action: Optional[str] = Query(None),
    table_name: Optional[str] = Query(None),
    record_id: Optional[int] = Query(None),
    ip_address: Optional[str] = Query(None),
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    search: Optional[str] = Query(None),
    sort_by: str = Query("timestamp", regex="^(timestamp|user_id|action|table_name|ip_address)$"),
    sort_order: str = Query("desc", regex="^(asc|desc)$"),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive audit trail with filtering and search"""
    
    try:
        # Build query
        query = db.query(models.AuditTrail)
        
        # Apply filters
        if user_id:
            query = query.filter(models.AuditTrail.user_id == user_id)
        
        if action:
            query = query.filter(models.AuditTrail.action.ilike(f"%{action}%"))
        
        if table_name:
            query = query.filter(models.AuditTrail.table_name.ilike(f"%{table_name}%"))
        
        if record_id:
            query = query.filter(models.AuditTrail.record_id == record_id)
        
        if ip_address:
            query = query.filter(models.AuditTrail.ip_address.ilike(f"%{ip_address}%"))
        
        # Date range filter
        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(models.AuditTrail.timestamp >= start_datetime)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(models.AuditTrail.timestamp <= end_datetime)
            except ValueError:
                pass
        
        # Search across multiple fields
        if search:
            search_filter = or_(
                models.AuditTrail.username.ilike(f"%{search}%"),
                models.AuditTrail.user_email.ilike(f"%{search}%"),
                models.AuditTrail.full_name.ilike(f"%{search}%"),
                models.AuditTrail.action.ilike(f"%{search}%"),
                models.AuditTrail.table_name.ilike(f"%{search}%"),
                models.AuditTrail.ip_address.ilike(f"%{search}%"),
                models.AuditTrail.user_agent.ilike(f"%{search}%"),
                models.AuditTrail.error_message.ilike(f"%{search}%")
            )
            query = query.filter(search_filter)
        
        # Apply sorting
        if sort_order == "desc":
            query = query.order_by(desc(getattr(models.AuditTrail, sort_by)))
        else:
            query = query.order_by(asc(getattr(models.AuditTrail, sort_by)))
        
        # Apply pagination
        total = query.count()
        audit_records = query.offset(skip).limit(limit).all()
        
        # Convert to response format
        result = []
        for record in audit_records:
            result.append({
                "id": record.id,
                "user_id": record.user_id,
                "username": record.username,
                "user_email": record.user_email,
                "full_name": record.full_name,
                "action": record.action,
                "table_name": record.table_name,
                "record_id": record.record_id,
                "old_values": record.old_values,
                "new_values": record.new_values,
                "ip_address": record.ip_address,
                "user_agent": record.user_agent,
                "session_id": record.session_id,
                "request_method": record.request_method,
                "request_url": record.request_url,
                "request_headers": record.request_headers,
                "response_status": record.response_status,
                "execution_time": record.execution_time,
                "error_message": record.error_message,
                "additional_data": record.additional_data,
                "timestamp": record.timestamp.isoformat() if record.timestamp else None
            })
        
        return {
            "records": result,
            "total": total,
            "skip": skip,
            "limit": limit,
            "has_more": skip + limit < total
        }
        
    except Exception as e:
        print(f"Error in audit trail: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving audit trail: {str(e)}")

@router.get("/{audit_id}")
def get_audit_record(
    audit_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get a specific audit record by ID"""
    
    try:
        audit_record = db.query(models.AuditTrail).filter(models.AuditTrail.id == audit_id).first()
        
        if not audit_record:
            raise HTTPException(status_code=404, detail="Audit record not found")
        
        return {
            "id": audit_record.id,
            "user_id": audit_record.user_id,
            "username": audit_record.username,
            "user_email": audit_record.user_email,
            "full_name": audit_record.full_name,
            "action": audit_record.action,
            "table_name": audit_record.table_name,
            "record_id": audit_record.record_id,
            "old_values": audit_record.old_values,
            "new_values": audit_record.new_values,
            "ip_address": audit_record.ip_address,
            "user_agent": audit_record.user_agent,
            "session_id": audit_record.session_id,
            "request_method": audit_record.request_method,
            "request_url": audit_record.request_url,
            "request_headers": audit_record.request_headers,
            "response_status": audit_record.response_status,
            "execution_time": audit_record.execution_time,
            "error_message": audit_record.error_message,
            "additional_data": audit_record.additional_data,
            "timestamp": audit_record.timestamp.isoformat() if audit_record.timestamp else None
        }
        
    except HTTPException:
        raise
    except Exception as e:
        print(f"Error getting audit record: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving audit record: {str(e)}")

@router.get("/stats/summary")
def get_audit_stats(
    start_date: Optional[str] = Query(None),
    end_date: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get audit trail statistics"""
    
    try:
        query = db.query(models.AuditTrail)
        
        # Apply date range filter
        if start_date:
            try:
                start_datetime = datetime.fromisoformat(start_date.replace('Z', '+00:00'))
                query = query.filter(models.AuditTrail.timestamp >= start_datetime)
            except ValueError:
                pass
        
        if end_date:
            try:
                end_datetime = datetime.fromisoformat(end_date.replace('Z', '+00:00'))
                query = query.filter(models.AuditTrail.timestamp <= end_datetime)
            except ValueError:
                pass
        
        # Get basic stats
        total_records = query.count()
        unique_users = query.with_entities(func.count(func.distinct(models.AuditTrail.user_id))).scalar()
        unique_ips = query.with_entities(func.count(func.distinct(models.AuditTrail.ip_address))).scalar()
        unique_tables = query.with_entities(func.count(func.distinct(models.AuditTrail.table_name))).scalar()
        
        # Get action breakdown
        action_stats = db.query(
            models.AuditTrail.action,
            func.count(models.AuditTrail.id).label('count')
        ).group_by(models.AuditTrail.action).all()
        
        # Get table breakdown
        table_stats = db.query(
            models.AuditTrail.table_name,
            func.count(models.AuditTrail.id).label('count')
        ).filter(models.AuditTrail.table_name.isnot(None)).group_by(models.AuditTrail.table_name).all()
        
        # Get recent activity (last 24 hours)
        yesterday = datetime.now() - timedelta(days=1)
        recent_activity = query.filter(models.AuditTrail.timestamp >= yesterday).count()
        
        # Get error count
        error_count = query.filter(models.AuditTrail.error_message.isnot(None)).count()
        
        return {
            "total_records": total_records,
            "unique_users": unique_users,
            "unique_ips": unique_ips,
            "unique_tables": unique_tables,
            "recent_activity_24h": recent_activity,
            "error_count": error_count,
            "action_breakdown": [{"action": stat.action, "count": stat.count} for stat in action_stats],
            "table_breakdown": [{"table": stat.table_name, "count": stat.count} for stat in table_stats]
        }
        
    except Exception as e:
        print(f"Error getting audit stats: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving audit statistics: {str(e)}")

@router.get("/stats/activity")
def get_activity_timeline(
    days: int = Query(7, ge=1, le=30),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get activity timeline for the last N days"""
    
    try:
        end_date = datetime.now()
        start_date = end_date - timedelta(days=days)
        
        # Get daily activity counts
        daily_activity = db.query(
            func.date(models.AuditTrail.timestamp).label('date'),
            func.count(models.AuditTrail.id).label('count')
        ).filter(
            models.AuditTrail.timestamp >= start_date,
            models.AuditTrail.timestamp <= end_date
        ).group_by(func.date(models.AuditTrail.timestamp)).all()
        
        # Get hourly activity for today
        today_start = datetime.now().replace(hour=0, minute=0, second=0, microsecond=0)
        hourly_activity = db.query(
            func.extract('hour', models.AuditTrail.timestamp).label('hour'),
            func.count(models.AuditTrail.id).label('count')
        ).filter(
            models.AuditTrail.timestamp >= today_start
        ).group_by(func.extract('hour', models.AuditTrail.timestamp)).all()
        
        return {
            "daily_activity": [{"date": str(day.date), "count": day.count} for day in daily_activity],
            "hourly_activity": [{"hour": int(hour.hour), "count": hour.count} for hour in hourly_activity]
        }
        
    except Exception as e:
        print(f"Error getting activity timeline: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error retrieving activity timeline: {str(e)}")

@router.post("/")
def create_audit_record(
    audit_data: schemas.AuditTrailCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Create a new audit record (for internal use)"""
    
    try:
        audit_record = models.AuditTrail(**audit_data.dict())
        db.add(audit_record)
        db.commit()
        db.refresh(audit_record)
        
        return {
            "id": audit_record.id,
            "message": "Audit record created successfully"
        }
        
    except Exception as e:
        db.rollback()
        print(f"Error creating audit record: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error creating audit record: {str(e)}") 