from fastapi import APIRouter, Depends, Query, HTTPException
from sqlalchemy.orm import Session
from sqlalchemy import func, and_, extract
from typing import List, Optional
from datetime import datetime, timedelta
from fastapi_app import models, schemas, deps
from fastapi_app.auth import get_current_user

router = APIRouter(prefix="/reports", tags=["reports"])

@router.get("/financial")
def get_financial_report(
    year: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get comprehensive financial report data"""
    
    try:
        # Handle year parameter - can be "all" or a specific year
        if year is None:
            year = str(datetime.now().year)
        
        # Get total assets and value (include all assets, not just active ones)
        assets_query = db.query(
            func.count(models.Asset.id).label('total_assets'),
            func.sum(models.Asset.purchase_cost).label('total_value'),
            func.sum(models.Asset.vat_amount).label('total_vat_amount'),
            func.sum(models.Asset.total_cost_with_vat).label('total_cost_with_vat')
        )
        
        # Only apply year filter if not "all"
        if year and year != "all":
            try:
                year_int = int(year)
                assets_query = assets_query.filter(
                    extract('year', models.Asset.purchase_date) == year_int
                )
            except ValueError:
                # If year is not a valid integer, ignore the filter
                pass
        
        asset_stats = assets_query.first()
        
        total_assets = asset_stats.total_assets or 0
        total_value = float(asset_stats.total_value or 0)
        total_vat_amount = float(asset_stats.total_vat_amount or 0)
        total_cost_with_vat = float(asset_stats.total_cost_with_vat or 0)
        
        # Calculate VAT (7.5% in Nigeria) if not already stored
        calculated_vat = total_value * 0.075
        total_vat = total_vat_amount if total_vat_amount > 0 else calculated_vat
        
        # Calculate depreciation (assuming 10% annual depreciation)
        depreciation = total_value * 0.10
        
        # Net value after VAT and depreciation
        net_value = total_value - total_vat - depreciation
        
        # Get category breakdown with enhanced data
        category_breakdown = db.query(
            models.Asset.category,
            func.count(models.Asset.id).label('count'),
            func.sum(models.Asset.purchase_cost).label('value'),
            func.sum(models.Asset.vat_amount).label('vat_amount'),
            func.sum(models.Asset.total_cost_with_vat).label('total_cost')
        ).filter(models.Asset.status != 'disposed')  # Exclude disposed assets
        
        # Only apply year filter if not "all"
        if year and year != "all":
            try:
                year_int = int(year)
                category_breakdown = category_breakdown.filter(
                    extract('year', models.Asset.purchase_date) == year_int
                )
            except ValueError:
                # If year is not a valid integer, ignore the filter
                pass
        
        category_breakdown = category_breakdown.group_by(models.Asset.category).all()
        
        # Process category breakdown
        category_data = []
        for cat in category_breakdown:
            cat_value = float(cat.value or 0)
            cat_vat = float(cat.vat_amount or 0) if cat.vat_amount else (cat_value * 0.075)
            percentage = (cat_value / total_value * 100) if total_value > 0 else 0
            
            category_data.append({
                "category": cat.category or "Uncategorized",
                "count": cat.count,
                "value": cat_value,
                "vat": cat_vat,
                "percentage": round(percentage, 1)
            })
        
        # Get monthly data for the year with enhanced calculations
        monthly_data = []
        
        # For "all" years, use current year for monthly breakdown but show all-time totals
        display_year = datetime.now().year if year == "all" else int(year)
        
        for month in range(1, 13):
            month_start = datetime(display_year, month, 1)
            if month == 12:
                month_end = datetime(display_year, 12, 31)
            else:
                month_end = datetime(display_year, month + 1, 1) - timedelta(days=1)
            
            # Get purchases for this month
            monthly_purchases = db.query(
                func.sum(models.Asset.purchase_cost).label('purchases')
            ).filter(
                and_(
                    models.Asset.purchase_date >= month_start,
                    models.Asset.purchase_date <= month_end
                )
            ).scalar() or 0
            
            # Get sales/disposals for this month
            monthly_sales = db.query(
                func.sum(models.Disposal.proceeds).label('sales')
            ).filter(
                and_(
                    models.Disposal.disposal_date >= month_start,
                    models.Disposal.disposal_date <= month_end
                )
            ).scalar() or 0
            
            # Get auction proceeds for this month
            monthly_auctions = db.query(
                func.sum(models.Auction.final_bid).label('auction_proceeds')
            ).filter(
                and_(
                    models.Auction.auction_date >= month_start,
                    models.Auction.auction_date <= month_end,
                    models.Auction.status == 'completed'
                )
            ).scalar() or 0
            
            # Calculate total sales including disposals and auctions
            total_monthly_sales = float(monthly_sales) + float(monthly_auctions)
            monthly_vat = float(monthly_purchases) * 0.075
            net_profit = total_monthly_sales - float(monthly_purchases)
            
            monthly_data.append({
                "month": month_start.strftime("%b"),
                "purchases": float(monthly_purchases),
                "sales": total_monthly_sales,
                "vat": monthly_vat,
                "netProfit": net_profit
            })
        
        # Get additional financial metrics
        # Total disposals value
        total_disposals = db.query(func.sum(models.Disposal.proceeds)).scalar() or 0
        
        # Total auction proceeds
        total_auction_proceeds = db.query(
            func.sum(models.Auction.final_bid)
        ).filter(models.Auction.status == 'completed').scalar() or 0
        
        # Total maintenance costs
        total_maintenance_cost = db.query(func.sum(models.Maintenance.cost)).scalar() or 0
        
        return {
            "period": "All Years" if year == "all" else str(year),
            "totalAssets": total_assets,
            "totalValue": total_value,
            "totalVAT": total_vat,
            "totalTax": total_vat,  # Same as VAT for now
            "netValue": net_value,
            "depreciation": depreciation,
            "categoryBreakdown": category_data,
            "monthlyData": monthly_data,
            "additionalMetrics": {
                "totalDisposals": float(total_disposals),
                "totalAuctionProceeds": float(total_auction_proceeds),
                "totalMaintenanceCost": float(total_maintenance_cost),
                "totalCostWithVAT": total_cost_with_vat
            }
        }
        
    except Exception as e:
        # Log the error for debugging
        print(f"Error in financial report: {str(e)}")
        raise HTTPException(status_code=500, detail=f"Error generating financial report: {str(e)}")

@router.get("/assets")
def get_assets_report(
    status: Optional[str] = Query(None),
    category: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get assets report data"""
    
    query = db.query(models.Asset)
    
    if status:
        query = query.filter(models.Asset.status == status)
    if category:
        query = query.filter(models.Asset.category == category)
    
    assets = query.all()
    
    # Calculate statistics
    total_assets = len(assets)
    total_value = sum(asset.purchase_cost or 0 for asset in assets)
    avg_value = total_value / total_assets if total_assets > 0 else 0
    
    # Status breakdown
    status_breakdown = {}
    for asset in assets:
        status = asset.status or 'unknown'
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    # Category breakdown
    category_breakdown = {}
    for asset in assets:
        category = asset.category or 'Uncategorized'
        category_breakdown[category] = category_breakdown.get(category, 0) + 1
    
    return {
        "totalAssets": total_assets,
        "totalValue": total_value,
        "averageValue": avg_value,
        "statusBreakdown": status_breakdown,
        "categoryBreakdown": category_breakdown,
        "assets": [
            {
                "id": asset.id,
                "name": asset.name,
                "category": asset.category,
                "status": asset.status,
                "purchase_cost": asset.purchase_cost,
                "purchase_date": asset.purchase_date.isoformat() if asset.purchase_date else None,
                "location": asset.location
            }
            for asset in assets
        ]
    }

@router.get("/maintenance")
def get_maintenance_report(
    status: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get maintenance report data"""
    
    query = db.query(models.Maintenance)
    
    if status:
        query = query.filter(models.Maintenance.status == status)
    
    maintenance_records = query.all()
    
    # Calculate statistics
    total_records = len(maintenance_records)
    total_cost = sum(record.cost or 0 for record in maintenance_records)
    avg_cost = total_cost / total_records if total_records > 0 else 0
    
    # Status breakdown
    status_breakdown = {}
    for record in maintenance_records:
        status = record.status or 'unknown'
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    # Overdue maintenance
    overdue_count = len([
        record for record in maintenance_records
        if record.status == 'scheduled' and record.maintenance_date and record.maintenance_date < datetime.now().date()
    ])
    
    return {
        "totalRecords": total_records,
        "totalCost": total_cost,
        "averageCost": avg_cost,
        "overdueCount": overdue_count,
        "statusBreakdown": status_breakdown,
        "records": [
            {
                "id": record.id,
                "asset_id": record.asset_id,
                "asset_name": record.asset_name,
                "maintenance_type": record.maintenance_type,
                "status": record.status,
                "cost": record.cost,
                "maintenance_date": record.maintenance_date.isoformat() if record.maintenance_date else None,
                "description": record.description
            }
            for record in maintenance_records
        ]
    }

@router.get("/auctions")
def get_auctions_report(
    status: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get auctions report data"""
    
    query = db.query(models.Auction)
    
    if status:
        query = query.filter(models.Auction.status == status)
    
    auctions = query.all()
    
    # Calculate statistics
    total_auctions = len(auctions)
    total_starting_bid = sum(auction.starting_bid or 0 for auction in auctions)
    total_winning_bid = sum(auction.winning_bid or 0 for auction in auctions)
    avg_starting_bid = total_starting_bid / total_auctions if total_auctions > 0 else 0
    
    # Status breakdown
    status_breakdown = {}
    for auction in auctions:
        status = auction.status or 'unknown'
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    # Active auctions (scheduled auctions that haven't been completed or cancelled)
    active_count = len([
        auction for auction in auctions
        if auction.status == 'scheduled' and auction.auction_date and auction.auction_date >= datetime.now().date()
    ])
    
    return {
        "totalAuctions": total_auctions,
        "totalStartingBid": total_starting_bid,
        "totalWinningBid": total_winning_bid,
        "averageStartingBid": avg_starting_bid,
        "activeCount": active_count,
        "statusBreakdown": status_breakdown,
        "auctions": [
            {
                "id": auction.id,
                "asset_id": auction.asset_id,
                "status": auction.status,
                "starting_bid": auction.starting_bid,
                "winning_bid": auction.winning_bid,
                "auction_date": auction.auction_date.isoformat() if auction.auction_date else None,
                "winner_name": auction.winner_name
            }
            for auction in auctions
        ]
    }

@router.get("/disposals")
def get_disposals_report(
    status: Optional[str] = Query(None),
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    """Get disposals report data"""
    
    query = db.query(models.Disposal)
    
    if status:
        query = query.filter(models.Disposal.status == status)
    
    disposals = query.all()
    
    # Calculate statistics
    total_disposals = len(disposals)
    total_proceeds = sum(disposal.proceeds or 0 for disposal in disposals)
    avg_proceeds = total_proceeds / total_disposals if total_disposals > 0 else 0
    
    # Status breakdown
    status_breakdown = {}
    for disposal in disposals:
        status = disposal.status or 'unknown'
        status_breakdown[status] = status_breakdown.get(status, 0) + 1
    
    # Method breakdown
    method_breakdown = {}
    for disposal in disposals:
        method = disposal.method or 'unknown'
        method_breakdown[method] = method_breakdown.get(method, 0) + 1
    
    return {
        "totalDisposals": total_disposals,
        "totalProceeds": total_proceeds,
        "averageProceeds": avg_proceeds,
        "statusBreakdown": status_breakdown,
        "methodBreakdown": method_breakdown,
        "disposals": [
            {
                "id": disposal.id,
                "asset_id": disposal.asset_id,
                "status": disposal.status,
                "method": disposal.method,
                "proceeds": disposal.proceeds,
                "disposal_date": disposal.disposal_date.isoformat() if disposal.disposal_date else None,
                "reason": disposal.reason
            }
            for disposal in disposals
        ]
    } 