from fastapi import APIRouter, Depends, status, HTTPException
from sqlalchemy.orm import Session
from typing import List
from fastapi_app import models, schemas, deps
from fastapi_app.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/auctions", tags=["auctions"])

@router.get("/", response_model=List[schemas.AuctionReadWithAsset])
def get_auctions(
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print(f"Fetching auctions for user: {current_user.username}")
        # Join with assets table to get asset details
        auctions = db.query(models.Auction, models.Asset).join(
            models.Asset, models.Auction.asset_id == models.Asset.id
        ).order_by(models.Auction.created_at.desc()).all()
        
        print(f"Found {len(auctions)} auctions")
        
        # Convert to list of dictionaries with asset details
        result = []
        for auction, asset in auctions:
            auction_dict = {
                "id": auction.id,
                "asset_id": auction.asset_id,
                "auction_date": auction.auction_date,
                "starting_bid": auction.starting_bid,
                "winning_bid": auction.winning_bid,
                "winner_name": auction.winner_name,
                "winner_contact": auction.winner_contact,
                "reserve_price": auction.reserve_price,
                "status": auction.status,
                "location": auction.location,
                "description": auction.description,
                "notes": auction.notes,
                "created_at": auction.created_at,
                # Add asset details
                "asset_name": asset.name,
                "asset_category": asset.category,
                "asset_description": asset.description,
                "title": f"Auction for {asset.name}",
                "description": auction.description or asset.description or f"Auction for {asset.name}",
                "current_highest_bid": auction.winning_bid or auction.starting_bid,
                # Map fields to match frontend expectations
                "final_bid": auction.winning_bid,  # Map winning_bid to final_bid
                "winner": auction.winner_name,     # Map winner_name to winner
                "total_bids": 0,  # Placeholder - would need bids table
                "total_bidders": 0,  # Placeholder - would need bids table
                "start_date": auction.auction_date,
                "end_date": auction.auction_date,  # Placeholder - would need separate end_date field
            }
            result.append(auction_dict)
        
        return result
    except Exception as e:
        print(f"Error fetching auctions: {e}")
        raise

@router.post("/", response_model=schemas.AuctionRead, status_code=status.HTTP_201_CREATED)
def create_auction(
    auction: schemas.AuctionCreate, 
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print(f"Creating auction for user: {current_user.username}")
        print(f"Auction data: {auction}")
        print(f"Final bid from frontend: {getattr(auction, 'final_bid', 'NOT_FOUND')}")
        print(f"Winner from frontend: {getattr(auction, 'winner', 'NOT_FOUND')}")
        
        # Map frontend fields to backend model fields
        db_auction = models.Auction(
            asset_id=auction.asset_id,
            auction_date=auction.auction_date,
            starting_bid=auction.starting_bid,
            reserve_price=auction.reserve_price,
            winning_bid=auction.final_bid if hasattr(auction, 'final_bid') and auction.final_bid else auction.winning_bid,  # Map final_bid to winning_bid
            winner_name=auction.winner if hasattr(auction, 'winner') and auction.winner else auction.winner_name,    # Map winner to winner_name
            winner_contact=auction.winner_contact,
            status=auction.status or "draft",
            description=auction.description,
            location=auction.location,
            notes=auction.notes,
            created_at=datetime.utcnow()
        )
        db.add(db_auction)
        db.commit()
        db.refresh(db_auction)
        print(f"Auction created with ID: {db_auction.id}")
        print(f"Saved winning_bid: {db_auction.winning_bid}")
        print(f"Saved winner_name: {db_auction.winner_name}")
        return db_auction
    except Exception as e:
        print(f"Error creating auction: {e}")
        db.rollback()
        raise 

@router.put("/{auction_id}")
def update_auction(
    auction_id: int,
    auction_update: dict,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print(f"Updating auction {auction_id} for user: {current_user.username}")
        print(f"Update data: {auction_update}")
        
        # Get the auction
        db_auction = db.query(models.Auction).filter(models.Auction.id == auction_id).first()
        if not db_auction:
            raise HTTPException(status_code=404, detail="Auction not found")
        
        # Update status if provided
        if "status" in auction_update:
            db_auction.status = auction_update["status"]
            print(f"Updated auction status to: {auction_update['status']}")
            
            # If status is being updated to 'completed', delete the asset
            if auction_update["status"] == 'completed':
                print(f"🔄 Auction completed - deleting asset {db_auction.asset_id}")
                
                # Get the asset
                db_asset = db.query(models.Asset).filter(models.Asset.id == db_auction.asset_id).first()
                if db_asset:
                    asset_name = db_asset.name
                    asset_id = db_asset.id
                    
                    # Create audit trail entry before deletion
                    try:
                        audit_entry = models.AuditTrail(
                            user_id=current_user.id,
                            action="asset_deleted_via_auction",
                            table_name="assets",
                            record_id=asset_id,
                            old_values={"asset_name": asset_name, "asset_id": asset_id},
                            new_values={"status": "deleted", "auction_id": auction_id},
                            ip_address="system",
                            user_agent="system",
                            additional_data={
                                "auction_id": auction_id,
                                "deletion_reason": f"Asset sold via auction {auction_id}",
                                "final_bid": float(db_auction.winning_bid) if db_auction.winning_bid else None,
                                "winner": db_auction.winner_name
                            }
                        )
                        db.add(audit_entry)
                        print(f"📝 Audit trail entry created for asset deletion via auction")
                    except Exception as e:
                        print(f"⚠️ Failed to create audit trail entry: {e}")
                    
                    # Delete the asset (CASCADE DELETE will handle foreign key relationships)
                    db.delete(db_asset)
                    print(f"✅ Asset {asset_id} ({asset_name}) deleted successfully via auction completion")
                else:
                    print(f"⚠️ Asset {db_auction.asset_id} not found for auction {auction_id}")
        
        # Update other fields if provided
        if "final_bid" in auction_update:
            db_auction.winning_bid = auction_update["final_bid"]  # Map final_bid to winning_bid
        if "winner" in auction_update:
            db_auction.winner_name = auction_update["winner"]     # Map winner to winner_name
        
        db.commit()
        
        # Check if the auction still exists (it might have been deleted due to CASCADE DELETE)
        try:
            db.refresh(db_auction)
            print(f"Auction {auction_id} updated successfully")
            return db_auction
        except Exception as e:
            # If auction was deleted due to CASCADE DELETE, return a success response
            if "Could not refresh instance" in str(e):
                print(f"Auction {auction_id} was deleted due to asset deletion (CASCADE DELETE)")
                return {
                    "id": auction_id,
                    "status": "completed",
                    "message": "Auction completed and asset deleted successfully"
                }
            else:
                raise e
    except Exception as e:
        print(f"Error updating auction: {e}")
        db.rollback()
        raise

@router.delete("/{auction_id}/asset", response_model=dict)
def delete_auction_asset(
    auction_id: int,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    try:
        print(f"Deleting asset for auction {auction_id} by user: {current_user.username}")
        
        # Get the auction
        db_auction = db.query(models.Auction).filter(models.Auction.id == auction_id).first()
        if not db_auction:
            raise HTTPException(status_code=404, detail="Auction not found")
        
        # Check if auction is completed
        if db_auction.status != 'completed':
            raise HTTPException(status_code=400, detail="Can only delete asset for completed auctions")
        
        # Get the asset
        db_asset = db.query(models.Asset).filter(models.Asset.id == db_auction.asset_id).first()
        if not db_asset:
            raise HTTPException(status_code=404, detail="Asset not found")
        
        # Delete the asset
        asset_name = db_asset.name
        db.delete(db_asset)
        db.commit()
        
        print(f"Asset '{asset_name}' deleted successfully for completed auction {auction_id}")
        return {"message": f"Asset '{asset_name}' deleted successfully", "asset_name": asset_name}
        
    except Exception as e:
        print(f"Error deleting auction asset: {e}")
        db.rollback()
        raise