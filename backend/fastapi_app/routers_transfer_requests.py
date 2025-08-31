from fastapi import APIRouter, Depends, HTTPException, status
from sqlalchemy.orm import Session
from typing import List
from fastapi_app import models, schemas, deps, crud
from fastapi_app.auth import get_current_user
from datetime import datetime

router = APIRouter(prefix="/transfer_requests", tags=["transfer_requests"])

@router.get("/", response_model=List[dict])
def get_transfer_requests(db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    is_admin = current_user.role in ["admin", "transfer_manager"]
    return crud.get_transfer_requests(db, user_id=current_user.id, is_admin=is_admin)

@router.get("/{transfer_request_id}", response_model=dict)
def get_transfer_request(transfer_request_id: int, db: Session = Depends(deps.get_db), current_user: models.User = Depends(get_current_user)):
    transfer_request = crud.get_transfer_request(db, transfer_request_id)
    if not transfer_request:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    
    # Check if user has access to this transfer request
    is_admin = current_user.role in ["admin", "transfer_manager"]
    if not is_admin and transfer_request['requested_by'] != current_user.id:
        raise HTTPException(status_code=403, detail="Access denied")
    
    return transfer_request

@router.post("/", response_model=schemas.TransferRequestRead, status_code=status.HTTP_201_CREATED)
def create_transfer_request(
    transfer_request: schemas.TransferRequestCreate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    return crud.create_transfer_request(db, transfer_request, user_id=current_user.id)

@router.put("/{transfer_request_id}", response_model=schemas.TransferRequestRead)
def update_transfer_request(
    transfer_request_id: int,
    transfer_request_update: schemas.TransferRequestUpdate,
    db: Session = Depends(deps.get_db),
    current_user: models.User = Depends(get_current_user)
):
    # Check if user has permission to update transfer requests
    is_admin = current_user.role in ["admin", "transfer_manager"]
    if not is_admin:
        raise HTTPException(status_code=403, detail="Only admins and transfer managers can update transfer requests")
    
    transfer_request = crud.update_transfer_request(db, transfer_request_id, transfer_request_update)
    if not transfer_request:
        raise HTTPException(status_code=404, detail="Transfer request not found")
    
    return transfer_request 