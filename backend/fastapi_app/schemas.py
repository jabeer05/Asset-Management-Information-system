from pydantic import BaseModel, EmailStr, field_validator
from typing import Optional, List, Any, Union
from datetime import datetime
from datetime import date
import json

class UserBase(BaseModel):
    username: str
    email: EmailStr
    first_name: str
    last_name: str
    role: str
    status: str
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    permissions: Optional[Union[List[str], str]] = None
    asset_access: Optional[Union[List[str], str]] = None
    notes: Optional[str] = None
    
    @field_validator('permissions', mode='before')
    @classmethod
    def parse_permissions(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return [v] if v else []
        if isinstance(v, list):
            return v
        return []
    
    @field_validator('asset_access', mode='before')
    @classmethod
    def parse_asset_access(cls, v):
        if v is None:
            return []
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return [v] if v else []
        if isinstance(v, list):
            return v
        return []

class UserCreate(UserBase):
    password: str

class UserRead(UserBase):
    id: int
    created_at: Optional[datetime]
    permissions: List[str] = []
    asset_access: List[str] = []

    class Config:
        from_attributes = True

class UserUpdate(BaseModel):
    username: Optional[str] = None
    email: Optional[EmailStr] = None
    first_name: Optional[str] = None
    last_name: Optional[str] = None
    role: Optional[str] = None
    status: Optional[str] = None
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    location: Optional[str] = None
    permissions: Optional[Union[List[str], str]] = None
    asset_access: Optional[Union[List[str], str]] = None
    notes: Optional[str] = None
    
    @field_validator('permissions', mode='before')
    @classmethod
    def parse_permissions(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return [v] if v else None
        if isinstance(v, list):
            return v
        return None
    
    @field_validator('asset_access', mode='before')
    @classmethod
    def parse_asset_access(cls, v):
        if v is None:
            return None
        if isinstance(v, str):
            try:
                return json.loads(v)
            except (json.JSONDecodeError, TypeError):
                return [v] if v else None
        if isinstance(v, list):
            return v
        return None 

class Token(BaseModel):
    access_token: str
    token_type: str

class TokenData(BaseModel):
    username: Optional[str] = None 

class AssetBase(BaseModel):
    name: str
    description: Optional[str] = None
    category: Optional[str] = None
    purchase_date: Optional[date] = None
    purchase_cost: Optional[float] = None
    location: Optional[str] = None
    status: Optional[str] = None
    image_url: Optional[str] = None
    barcode: Optional[str] = None
    qrcode: Optional[str] = None
    created_by: Optional[int] = None
    quantity: Optional[int] = 1
    serial_number: Optional[str] = None
    custodian_name: Optional[str] = None
    supplier: Optional[str] = None
    invoice_number: Optional[str] = None
    current_value: Optional[float] = None
    asset_condition: Optional[str] = None
    model: Optional[str] = None
    manufacturer: Optional[str] = None
    warranty_expiry: Optional[date] = None
    vat_amount: Optional[float] = None
    total_cost_with_vat: Optional[float] = None
    currency: Optional[str] = None
    tags: Optional[str] = None
    notes: Optional[str] = None

class AssetCreate(AssetBase):
    pass

class AssetRead(AssetBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]

    class Config:
        from_attributes = True 

class MaintenanceBase(BaseModel):
    asset_id: Optional[int] = None
    asset_name: Optional[str] = None
    asset_category: Optional[str] = None
    maintenance_type: Optional[str] = None
    maintenance_date: Optional[date] = None
    start_date: Optional[date] = None
    completion_date: Optional[date] = None
    description: Optional[str] = None
    cost: Optional[float] = 0.0
    priority: Optional[str] = None
    performed_by: Optional[str] = None
    vendor: Optional[str] = None
    notes: Optional[str] = None
    next_maintenance_date: Optional[date] = None
    status: Optional[str] = None
    updated_at: Optional[datetime] = None

class MaintenanceCreate(MaintenanceBase):
    pass

class MaintenanceRead(MaintenanceBase):
    id: int
    created_at: Optional[datetime]

    class Config:
        from_attributes = True 

class TransferBase(BaseModel):
    asset_id: Optional[int] = None
    asset_name: Optional[str] = None
    custom_asset_name: Optional[str] = None
    transfer_type: Optional[str] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    from_department: Optional[str] = None
    to_department: Optional[str] = None
    from_custodian: Optional[str] = None
    to_custodian: Optional[str] = None
    custom_from_custodian: Optional[str] = None
    custom_to_custodian: Optional[str] = None
    request_date: Optional[date] = None
    transfer_date: Optional[date] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    estimated_cost: Optional[float] = 0.0
    transferred_by: Optional[int] = None
    status: Optional[str] = None

class TransferCreate(TransferBase):
    pass

class TransferRead(TransferBase):
    id: int
    created_at: Optional[datetime]
    updated_at: Optional[datetime]
    class Config:
        from_attributes = True

class DisposalBase(BaseModel):
    asset_id: int
    disposal_date: date
    method: str
    reason: Optional[str] = None
    proceeds: Optional[float] = None
    status: Optional[str] = None

class DisposalCreate(DisposalBase):
    pass

class DisposalRead(DisposalBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class DisposalReadWithAsset(DisposalBase):
    id: int
    created_at: Optional[datetime]
    # Asset information
    asset_name: Optional[str] = None
    asset_category: Optional[str] = None
    asset_location: Optional[str] = None
    # Enhanced disposal information
    disposal_method_name: Optional[str] = None
    estimated_proceeds: Optional[float] = None
    actual_proceeds: Optional[float] = None
    disposal_cost: Optional[float] = None
    net_proceeds: Optional[float] = None
    buyer_info: Optional[str] = None
    disposal_notes: Optional[str] = None
    # Approval information
    approved_by: Optional[int] = None
    approved_by_name: Optional[str] = None
    approved_at: Optional[datetime] = None
    rejection_reason: Optional[str] = None
    # Creator information
    created_by: Optional[int] = None
    created_by_name: Optional[str] = None
    class Config:
        from_attributes = True

class AuctionBase(BaseModel):
    asset_id: int
    auction_date: date
    starting_bid: Optional[float] = None
    reserve_price: Optional[float] = None
    winning_bid: Optional[float] = None
    winner_name: Optional[str] = None
    winner_contact: Optional[str] = None
    # Frontend compatibility fields
    final_bid: Optional[float] = None
    winner: Optional[str] = None
    status: Optional[str] = None
    description: Optional[str] = None
    location: Optional[str] = None
    notes: Optional[str] = None

class AuctionCreate(AuctionBase):
    pass

class AuctionRead(AuctionBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class AuctionReadWithAsset(AuctionBase):
    id: int
    created_at: Optional[datetime]
    asset_name: Optional[str] = None
    asset_category: Optional[str] = None
    asset_description: Optional[str] = None
    title: Optional[str] = None
    description: Optional[str] = None
    current_highest_bid: Optional[float] = None
    total_bids: Optional[int] = None
    total_bidders: Optional[int] = None
    start_date: Optional[date] = None
    end_date: Optional[date] = None
    class Config:
        from_attributes = True

class AuditBase(BaseModel):
    asset_id: int
    audit_date: date
    auditor: str
    notes: Optional[str] = None
    status: Optional[str] = None

class AuditCreate(AuditBase):
    pass

class AuditRead(AuditBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class NotificationBase(BaseModel):
    user_id: int
    sender_id: Optional[int] = None
    title: Optional[str] = None
    message: str
    type: Optional[str] = None
    priority: Optional[str] = None
    action_url: Optional[str] = None
    action_text: Optional[str] = None
    notification_metadata: Optional[dict] = None
    direction: Optional[str] = None
    is_read: Optional[bool] = False
    parent_id: Optional[int] = None

class NotificationCreate(NotificationBase):
    pass

class NotificationRead(NotificationBase):
    id: int
    created_at: Optional[datetime]
    # Additional fields for frontend compatibility
    recipient_id: Optional[int] = None
    recipient_name: Optional[str] = None
    recipient_email: Optional[str] = None
    sender_name: Optional[str] = None
    sender_first_name: Optional[str] = None
    sender_last_name: Optional[str] = None
    sender_username: Optional[str] = None
    sender_email: Optional[str] = None
    class Config:
        from_attributes = True

class DepartmentBase(BaseModel):
    name: str
    description: Optional[str] = None
    head_of_department: Optional[str] = None
    contact_email: Optional[str] = None
    contact_phone: Optional[str] = None
    location: Optional[str] = None

class DepartmentCreate(DepartmentBase):
    pass

class DepartmentRead(DepartmentBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class LocationBase(BaseModel):
    name: str
    address: Optional[str] = None
    contact_person: Optional[str] = None
    contact_phone: Optional[str] = None
    description: Optional[str] = None

class LocationCreate(LocationBase):
    pass

class LocationRead(LocationBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class CategoryBase(BaseModel):
    name: str
    description: Optional[str] = None

class CategoryCreate(CategoryBase):
    pass

class CategoryRead(CategoryBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class CustodianBase(BaseModel):
    name: str
    department: Optional[str] = None
    position: Optional[str] = None
    phone: Optional[str] = None
    email: Optional[str] = None
    location: Optional[str] = None
    status: Optional[str] = None

class CustodianCreate(CustodianBase):
    pass

class CustodianRead(CustodianBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class TransferRequestBase(BaseModel):
    asset_id: Optional[int] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    requested_by: Optional[int] = None
    approved_by: Optional[int] = None
    request_date: Optional[date] = None
    approval_date: Optional[date] = None
    priority: Optional[str] = None
    status: Optional[str] = None
    reason: Optional[str] = None
    notes: Optional[str] = None

class TransferRequestCreate(TransferRequestBase):
    pass

class TransferRequestUpdate(BaseModel):
    asset_id: Optional[int] = None
    from_location: Optional[str] = None
    to_location: Optional[str] = None
    approved_by: Optional[int] = None
    approval_date: Optional[date] = None
    reason: Optional[str] = None
    notes: Optional[str] = None
    priority: Optional[str] = None
    status: Optional[str] = None

class TransferRequestRead(TransferRequestBase):
    id: int
    created_at: Optional[datetime]
    class Config:
        from_attributes = True

class TransferRequestReadWithAsset(TransferRequestBase):
    id: int
    created_at: Optional[datetime]
    # Asset information
    asset_name: Optional[str] = None
    asset_category: Optional[str] = None
    asset_location: Optional[str] = None
    # Enhanced transfer information
    from_department: Optional[str] = None
    to_department: Optional[str] = None
    from_custodian: Optional[str] = None
    to_custodian: Optional[str] = None
    transfer_date: Optional[date] = None
    completion_date: Optional[date] = None
    estimated_cost: Optional[float] = None
    actual_cost: Optional[float] = None
    approval_by: Optional[str] = None
    # Requester information
    requested_by_name: Optional[str] = None
    requested_by_email: Optional[str] = None
    
    class Config:
        from_attributes = True

class AssetHistoryBase(BaseModel):
    asset_id: int
    event_type: str
    event_description: Optional[str] = None
    event_date: Optional[datetime] = None
    user_id: int

class AssetHistoryCreate(AssetHistoryBase):
    pass

class AssetHistoryRead(AssetHistoryBase):
    id: int
    class Config:
        from_attributes = True

# Audit Trail Schemas
class AuditTrailBase(BaseModel):
    user_id: int
    username: Optional[str] = None
    user_email: Optional[str] = None
    full_name: Optional[str] = None
    action: str
    table_name: Optional[str] = None
    record_id: Optional[int] = None
    old_values: Optional[dict] = None
    new_values: Optional[dict] = None
    ip_address: Optional[str] = None
    user_agent: Optional[str] = None
    session_id: Optional[str] = None
    request_method: Optional[str] = None
    request_url: Optional[str] = None
    request_headers: Optional[dict] = None
    response_status: Optional[int] = None
    execution_time: Optional[float] = None
    error_message: Optional[str] = None
    additional_data: Optional[dict] = None

class AuditTrailCreate(AuditTrailBase):
    pass

class AuditTrailRead(AuditTrailBase):
    id: int
    timestamp: Optional[datetime]
    
    class Config:
        from_attributes = True 