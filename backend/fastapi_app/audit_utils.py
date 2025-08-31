import json
from typing import Dict, Any, Optional
from sqlalchemy.orm import Session
from fastapi_app.database import SessionLocal
from fastapi_app.models import AuditTrail
from fastapi_app.token_utils import get_current_user_from_token

def create_audit_log(
    user_id: int,
    username: str,
    user_email: str,
    full_name: str,
    action: str,
    table_name: Optional[str] = None,
    record_id: Optional[int] = None,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    request_method: Optional[str] = None,
    request_url: Optional[str] = None,
    response_status: Optional[int] = None,
    execution_time: Optional[float] = None,
    error_message: Optional[str] = None,
    additional_data: Optional[Dict[str, Any]] = None
):
    """
    Create an audit log entry
    
    Args:
        user_id: ID of the user performing the action
        username: Username of the user
        user_email: Email of the user
        full_name: Full name of the user
        action: Action being performed (CREATE, UPDATE, DELETE, VIEW, etc.)
        table_name: Name of the table being affected
        record_id: ID of the record being affected
        old_values: Previous values (for updates)
        new_values: New values (for creates/updates)
        ip_address: IP address of the client
        user_agent: User agent string
        request_method: HTTP method used
        request_url: Full request URL
        response_status: HTTP response status code
        execution_time: Request execution time in seconds
        error_message: Error message if any
        additional_data: Any additional data to store
    """
    try:
        db = SessionLocal()
        audit_record = AuditTrail(
            user_id=user_id,
            username=username,
            user_email=user_email,
            full_name=full_name,
            action=action,
            table_name=table_name,
            record_id=record_id,
            old_values=old_values,
            new_values=new_values,
            ip_address=ip_address,
            user_agent=user_agent,
            request_method=request_method,
            request_url=request_url,
            response_status=response_status,
            execution_time=execution_time,
            error_message=error_message,
            additional_data=additional_data
        )
        db.add(audit_record)
        db.commit()
        db.close()
        return True
    except Exception as e:
        print(f"Error creating audit log: {str(e)}")
        return False

def log_user_action(
    user_id: int,
    username: str,
    user_email: str,
    full_name: str,
    action: str,
    table_name: Optional[str] = None,
    record_id: Optional[int] = None,
    **kwargs
):
    """
    Simplified function to log user actions
    
    Args:
        user_id: ID of the user
        username: Username
        user_email: Email
        full_name: Full name
        action: Action being performed
        table_name: Table being affected
        record_id: Record ID being affected
        **kwargs: Additional audit data
    """
    return create_audit_log(
        user_id=user_id,
        username=username,
        user_email=user_email,
        full_name=full_name,
        action=action,
        table_name=table_name,
        record_id=record_id,
        **kwargs
    )

def log_asset_action(
    user_id: int,
    username: str,
    user_email: str,
    full_name: str,
    action: str,
    asset_id: int,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    **kwargs
):
    """
    Log asset-related actions
    
    Args:
        user_id: ID of the user
        username: Username
        user_email: Email
        full_name: Full name
        action: Action being performed
        asset_id: ID of the asset
        old_values: Previous asset values
        new_values: New asset values
        **kwargs: Additional audit data
    """
    return create_audit_log(
        user_id=user_id,
        username=username,
        user_email=user_email,
        full_name=full_name,
        action=action,
        table_name="assets",
        record_id=asset_id,
        old_values=old_values,
        new_values=new_values,
        **kwargs
    )

def log_maintenance_action(
    user_id: int,
    username: str,
    user_email: str,
    full_name: str,
    action: str,
    maintenance_id: int,
    old_values: Optional[Dict[str, Any]] = None,
    new_values: Optional[Dict[str, Any]] = None,
    **kwargs
):
    """
    Log maintenance-related actions
    
    Args:
        user_id: ID of the user
        username: Username
        user_email: Email
        full_name: Full name
        action: Action being performed
        maintenance_id: ID of the maintenance record
        old_values: Previous maintenance values
        new_values: New maintenance values
        **kwargs: Additional audit data
    """
    return create_audit_log(
        user_id=user_id,
        username=username,
        user_email=user_email,
        full_name=full_name,
        action=action,
        table_name="maintenance",
        record_id=maintenance_id,
        old_values=old_values,
        new_values=new_values,
        **kwargs
    )

def log_user_login(
    user_id: int,
    username: str,
    user_email: str,
    full_name: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    success: bool = True,
    **kwargs
):
    """
    Log user login attempts
    
    Args:
        user_id: ID of the user
        username: Username
        user_email: Email
        full_name: Full name
        ip_address: IP address
        user_agent: User agent
        success: Whether login was successful
        **kwargs: Additional audit data
    """
    action = "LOGIN_SUCCESS" if success else "LOGIN_FAILED"
    additional_data = kwargs.get('additional_data', {})
    additional_data['login_success'] = success
    
    return create_audit_log(
        user_id=user_id,
        username=username,
        user_email=user_email,
        full_name=full_name,
        action=action,
        table_name="auth",
        ip_address=ip_address,
        user_agent=user_agent,
        additional_data=additional_data,
        **kwargs
    )

def log_user_logout(
    user_id: int,
    username: str,
    user_email: str,
    full_name: str,
    ip_address: Optional[str] = None,
    user_agent: Optional[str] = None,
    **kwargs
):
    """
    Log user logout
    
    Args:
        user_id: ID of the user
        username: Username
        user_email: Email
        full_name: Full name
        ip_address: IP address
        user_agent: User agent
        **kwargs: Additional audit data
    """
    return create_audit_log(
        user_id=user_id,
        username=username,
        user_email=user_email,
        full_name=full_name,
        action="LOGOUT",
        table_name="auth",
        ip_address=ip_address,
        user_agent=user_agent,
        **kwargs
    )

def log_error(
    user_id: Optional[int],
    username: Optional[str],
    user_email: Optional[str],
    full_name: Optional[str],
    action: str,
    error_message: str,
    table_name: Optional[str] = None,
    record_id: Optional[int] = None,
    **kwargs
):
    """
    Log errors and exceptions
    
    Args:
        user_id: ID of the user (if available)
        username: Username (if available)
        user_email: Email (if available)
        full_name: Full name (if available)
        action: Action that caused the error
        error_message: Error message
        table_name: Table being affected
        record_id: Record ID being affected
        **kwargs: Additional audit data
    """
    return create_audit_log(
        user_id=user_id,
        username=username or "Unknown",
        user_email=user_email or "Unknown",
        full_name=full_name or "Unknown",
        action=action,
        table_name=table_name,
        record_id=record_id,
        error_message=error_message,
        response_status=500,
        **kwargs
    )

def get_audit_summary(db: Session, days: int = 7) -> Dict[str, Any]:
    """
    Get audit summary for the last N days
    
    Args:
        db: Database session
        days: Number of days to look back
    
    Returns:
        Dictionary with audit summary statistics
    """
    from datetime import datetime, timedelta
    from sqlalchemy import func
    
    end_date = datetime.now()
    start_date = end_date - timedelta(days=days)
    
    # Get basic stats
    total_records = db.query(AuditTrail).filter(
        AuditTrail.timestamp >= start_date
    ).count()
    
    unique_users = db.query(func.count(func.distinct(AuditTrail.user_id))).filter(
        AuditTrail.timestamp >= start_date
    ).scalar()
    
    unique_ips = db.query(func.count(func.distinct(AuditTrail.ip_address))).filter(
        AuditTrail.timestamp >= start_date
    ).scalar()
    
    error_count = db.query(AuditTrail).filter(
        AuditTrail.timestamp >= start_date,
        AuditTrail.error_message.isnot(None)
    ).count()
    
    # Get action breakdown
    action_stats = db.query(
        AuditTrail.action,
        func.count(AuditTrail.id).label('count')
    ).filter(
        AuditTrail.timestamp >= start_date
    ).group_by(AuditTrail.action).all()
    
    return {
        "total_records": total_records,
        "unique_users": unique_users,
        "unique_ips": unique_ips,
        "error_count": error_count,
        "action_breakdown": [{"action": stat.action, "count": stat.count} for stat in action_stats]
    } 