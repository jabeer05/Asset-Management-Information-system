from fastapi import APIRouter, Depends
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, or_, desc, asc
from datetime import datetime, timedelta
from fastapi_app import deps, models
from fastapi_app.auth import get_current_user

router = APIRouter(prefix="/dashboard", tags=["dashboard"])

@router.get("/stats")
def get_stats(db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    """Get real dashboard statistics from database"""
    try:
        print("🔍 Getting dashboard stats for user:", current_user.username)
        # Total assets
        total_assets = db.query(func.count(models.Asset.id)).scalar() or 0
        print(f"📊 Total assets: {total_assets}")
        
        # Total value (sum of purchase_cost)
        total_value_result = db.query(func.sum(models.Asset.purchase_cost)).scalar()
        total_value = float(total_value_result) if total_value_result else 0
        print(f"💰 Total value: {total_value}")
        
        # Active assets (status = 'active')
        active_assets = db.query(func.count(models.Asset.id)).filter(
            models.Asset.status == 'active'
        ).scalar() or 0
        print(f"✅ Active assets: {active_assets}")
        
        # Maintenance due (maintenance records with status = 'scheduled' and due date <= 7 days)
        try:
            maintenance_due = db.query(func.count(models.Maintenance.id)).filter(
                and_(
                    models.Maintenance.status == 'scheduled',
                    models.Maintenance.maintenance_date <= datetime.now().date() + timedelta(days=7)
                )
            ).scalar() or 0
        except:
            maintenance_due = 0
        
        # Critical issues (maintenance with priority = 'critical')
        try:
            critical_issues = db.query(func.count(models.Maintenance.id)).filter(
                models.Maintenance.priority == 'critical'
            ).scalar() or 0
        except:
            critical_issues = 0
        
        # Pending transfers
        try:
            pending_transfers = db.query(func.count(models.Transfer.id)).filter(
                models.Transfer.status == 'pending'
            ).scalar() or 0
        except:
            pending_transfers = 0
        
        # Active auctions
        try:
            active_auctions = db.query(func.count(models.Auction.id)).filter(
                models.Auction.status == 'scheduled'
            ).scalar() or 0
        except:
            active_auctions = 0
        
        # Pending disposals
        try:
            pending_disposals = db.query(func.count(models.Disposal.id)).filter(
                models.Disposal.status == 'pending'
            ).scalar() or 0
        except:
            pending_disposals = 0
        
        # Total users
        total_users = db.query(func.count(models.User.id)).scalar() or 0
        
        # Unread notifications
        try:
            unread_notifications = db.query(func.count(models.Notification.id)).filter(
                models.Notification.is_read == 0
            ).scalar() or 0
        except:
            unread_notifications = 0
        
        # Calculate depreciation (simplified calculation)
        # Assuming 10% yearly depreciation
        yearly_depreciation = total_value * 0.10
        monthly_depreciation = yearly_depreciation / 12
        
        return {
            "totalAssets": total_assets,
            "totalValue": total_value,
            "activeAssets": active_assets,
            "maintenanceDue": maintenance_due,
            "criticalIssues": critical_issues,
            "pendingTransfers": pending_transfers,
            "activeAuctions": active_auctions,
            "pendingDisposals": pending_disposals,
            "totalUsers": total_users,
            "unreadNotifications": unread_notifications,
            "monthlyDepreciation": monthly_depreciation,
            "yearlyDepreciation": yearly_depreciation
        }
    except Exception as e:
        # Log the error and return default values
        print(f"❌ Error in dashboard stats: {e}")
        import traceback
        traceback.print_exc()
        return {
            "totalAssets": 0,
            "totalValue": 0,
            "activeAssets": 0,
            "maintenanceDue": 0,
            "criticalIssues": 0,
            "pendingTransfers": 0,
            "activeAuctions": 0,
            "pendingDisposals": 0,
            "totalUsers": 0,
            "unreadNotifications": 0,
            "monthlyDepreciation": 0,
            "yearlyDepreciation": 0
        }

@router.get("/asset-categories")
def get_asset_categories(db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    """Get real asset categories data from database"""
    try:
        # Get category breakdown with counts and values
        category_stats = db.query(
            models.Asset.category,
            func.count(models.Asset.id).label('count'),
            func.sum(models.Asset.purchase_cost).label('value')
        ).filter(
            models.Asset.category.isnot(None)
        ).group_by(models.Asset.category).all()
        
        # Calculate total value for percentage calculation
        total_value_result = db.query(func.sum(models.Asset.purchase_cost)).scalar()
        total_value = float(total_value_result) if total_value_result else 1  # Avoid division by zero
        
        result = []
        for stat in category_stats:
            category_value = float(stat.value) if stat.value else 0
            percentage = (category_value / total_value) * 100 if total_value > 0 else 0
            
            result.append({
                "category": stat.category or "Uncategorized",
                "count": stat.count,
                "value": category_value,
                "percentage": round(percentage, 1)
            })
        
        # Sort by value descending
        result.sort(key=lambda x: x['value'], reverse=True)
        
        return result
    except Exception as e:
        # Return empty list if there's an error
        return []

@router.get("/recent-activities")
def get_recent_activities(db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    """Get real recent activities from audit trail"""
    try:
        # Get recent audit trail entries (last 20 entries)
        recent_audits = db.query(models.AuditTrail).order_by(
            desc(models.AuditTrail.timestamp)
        ).limit(20).all()
        
        result = []
        for audit in recent_audits:
            # Map audit action to activity type
            activity_type = 'audit'  # default
            if audit.table_name:
                if audit.table_name == 'assets':
                    activity_type = 'asset'
                elif audit.table_name == 'maintenance':
                    activity_type = 'maintenance'
                elif audit.table_name == 'transfers':
                    activity_type = 'transfer'
                elif audit.table_name == 'auctions':
                    activity_type = 'auction'
                elif audit.table_name == 'disposals':
                    activity_type = 'disposal'
                elif audit.table_name == 'users':
                    activity_type = 'user'
            
            # Determine status based on response status
            status = 'completed'
            if audit.response_status:
                if audit.response_status >= 400:
                    status = 'failed'
                elif audit.response_status == 202:
                    status = 'pending'
            
            # Create description
            description = f"{audit.action} on {audit.table_name or 'system'}"
            if audit.record_id:
                description += f" (ID: {audit.record_id})"
            
            result.append({
                "id": audit.id,
                "type": activity_type,
                "action": audit.action,
                "description": description,
                "user": audit.full_name or audit.username or "Unknown",
                "timestamp": audit.timestamp.isoformat() if audit.timestamp else datetime.now().isoformat(),
                "status": status
            })
        
        return result
    except Exception as e:
        # Return empty list if there's an error
        return []

@router.get("/maintenance-schedule")
def get_maintenance_schedule(db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    """Get real maintenance schedule from database"""
    try:
        # Get maintenance records with asset information
        maintenance_records = db.query(
            models.Maintenance,
            models.Asset.name.label('asset_name')
        ).join(
            models.Asset, models.Maintenance.asset_id == models.Asset.id, isouter=True
        ).filter(
            models.Maintenance.status.in_(['scheduled', 'in_progress'])
        ).order_by(
            models.Maintenance.maintenance_date.asc()
        ).limit(10).all()
        
        result = []
        for record in maintenance_records:
            maintenance = record[0]  # Maintenance object
            asset_name = record[1] or "Unknown Asset"  # Asset name
            
            # Format due date
            due_date = maintenance.maintenance_date.strftime('%Y-%m-%d') if maintenance.maintenance_date else 'N/A'
            
            result.append({
                "id": maintenance.id,
                "assetName": asset_name,
                "assetId": str(maintenance.asset_id) if maintenance.asset_id else 'N/A',
                "type": str(maintenance.maintenance_type) if maintenance.maintenance_type else 'Unknown',
                "dueDate": due_date,
                "status": str(maintenance.status) if maintenance.status else 'scheduled',
                "assignedTo": maintenance.performed_by or "Unassigned",
                "priority": str(maintenance.priority) if maintenance.priority else 'medium'
            })
        
        return result
    except Exception as e:
        # Return empty list if there's an error
        return [] 