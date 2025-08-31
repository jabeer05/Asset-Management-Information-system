from sqlalchemy import Column, Integer, String, Enum, Text, JSON, TIMESTAMP, DECIMAL, Date, ForeignKey, Float
from sqlalchemy.ext.declarative import declarative_base
from sqlalchemy.orm import relationship
import enum
from datetime import datetime

Base = declarative_base()

class UserRole(str, enum.Enum):
    admin = 'admin'
    manager = 'manager'
    user = 'user'
    auditor = 'auditor'
    viewer = 'viewer'

class UserStatus(str, enum.Enum):
    active = 'active'
    inactive = 'inactive'
    suspended = 'suspended'
    pending = 'pending'

class User(Base):
    __tablename__ = 'users'
    id = Column(Integer, primary_key=True, index=True)
    username = Column(String(50), unique=True, nullable=False)
    password = Column(String(255), nullable=False)
    email = Column(String(100), unique=True, nullable=False)
    first_name = Column(String(100), nullable=False)
    last_name = Column(String(100), nullable=False)
    role = Column(Enum(UserRole), default=UserRole.user)
    status = Column(Enum(UserStatus), default=UserStatus.active)
    department = Column(String(100))
    position = Column(String(100))
    phone = Column(String(20))
    location = Column(String(100))
    permissions = Column(JSON)
    asset_access = Column(JSON)
    notes = Column(Text)
    created_at = Column(TIMESTAMP)

class AssetStatus(str, enum.Enum):
    active = 'active'
    maintenance = 'maintenance'
    disposed = 'disposed'
    auctioned = 'auctioned'

class Asset(Base):
    __tablename__ = 'assets'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    description = Column(Text)
    category = Column(String(50))
    purchase_date = Column(Date)
    purchase_cost = Column(DECIMAL(12,2))
    location = Column(String(100))
    status = Column(Enum(AssetStatus), default=AssetStatus.active)
    image_url = Column(String(255))
    barcode = Column(String(100), unique=True)
    qrcode = Column(String(100), unique=True)
    created_by = Column(Integer, ForeignKey('users.id'))
    quantity = Column(Integer, default=1)
    serial_number = Column(String(100))
    custodian_name = Column(String(100))
    supplier = Column(String(100))
    invoice_number = Column(String(100))
    current_value = Column(DECIMAL(12,2))
    asset_condition = Column(String(50))
    model = Column(String(100))
    manufacturer = Column(String(100))
    warranty_expiry = Column(Date)
    vat_amount = Column(DECIMAL(12,2))
    total_cost_with_vat = Column(DECIMAL(12,2))
    currency = Column(String(10))
    tags = Column(String(255))
    notes = Column(Text)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP) 

class MaintenanceType(str, enum.Enum):
    preventive = 'preventive'
    corrective = 'corrective'
    emergency = 'emergency'
    inspection = 'inspection'

class MaintenancePriority(str, enum.Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'
    critical = 'critical'

class MaintenanceStatus(str, enum.Enum):
    scheduled = 'scheduled'
    in_progress = 'in_progress'
    completed = 'completed'
    cancelled = 'cancelled'
    overdue = 'overdue'

class Maintenance(Base):
    __tablename__ = 'maintenance'
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id'), nullable=True)
    maintenance_date = Column(Date)
    description = Column(Text)
    cost = Column(DECIMAL(12,2), default=0.00)
    priority = Column(Enum(MaintenancePriority), default=MaintenancePriority.medium)
    performed_by = Column(String(100))
    status = Column(Enum(MaintenanceStatus), default=MaintenanceStatus.scheduled)
    created_at = Column(TIMESTAMP) 

class TransferType(str, enum.Enum):
    internal = 'internal'
    external = 'external'
    temporary = 'temporary'
    permanent = 'permanent'

class TransferStatus(str, enum.Enum):
    pending = 'pending'
    approved = 'approved'
    rejected = 'rejected'
    completed = 'completed'
    cancelled = 'cancelled'

class Transfer(Base):
    __tablename__ = 'transfers'
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id'), nullable=True)
    asset_name = Column(String(100), nullable=True)
    custom_asset_name = Column(String(100), nullable=True)
    transfer_type = Column(Enum(TransferType), default=TransferType.internal)
    from_location = Column(String(100))
    to_location = Column(String(100))
    from_department = Column(String(100))
    to_department = Column(String(100))
    from_custodian = Column(String(100))
    to_custodian = Column(String(100))
    custom_from_custodian = Column(String(100), nullable=True)
    custom_to_custodian = Column(String(100), nullable=True)
    request_date = Column(Date)
    transfer_date = Column(Date, nullable=True)
    reason = Column(Text)
    notes = Column(Text, nullable=True)
    estimated_cost = Column(DECIMAL(12,2), default=0.00)
    transferred_by = Column(Integer, ForeignKey('users.id'))
    status = Column(Enum(TransferStatus), default=TransferStatus.pending)
    created_at = Column(TIMESTAMP)
    updated_at = Column(TIMESTAMP)

class DisposalStatus(str, enum.Enum):
    draft = 'draft'
    pending = 'pending'
    approved = 'approved'
    in_progress = 'in_progress'
    completed = 'completed'
    cancelled = 'cancelled'

class Disposal(Base):
    __tablename__ = 'disposals'
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id'))
    disposal_date = Column(Date)
    method = Column(String(100))
    reason = Column(Text)
    proceeds = Column(DECIMAL(12,2))
    status = Column(Enum(DisposalStatus), default=DisposalStatus.draft)
    created_at = Column(TIMESTAMP)

class AuctionStatus(str, enum.Enum):
    draft = 'draft'
    published = 'published'
    active = 'active'
    bidding_open = 'bidding_open'
    bidding_closed = 'bidding_closed'
    completed = 'completed'
    cancelled = 'cancelled'
    scheduled = 'scheduled'

class Auction(Base):
    __tablename__ = 'auctions'
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id'))
    auction_date = Column(Date)
    starting_bid = Column(DECIMAL(12,2))
    reserve_price = Column(DECIMAL(12,2))
    winning_bid = Column(DECIMAL(12,2))
    winner_name = Column(String(100))
    winner_contact = Column(String(100))
    status = Column(Enum(AuctionStatus), default=AuctionStatus.scheduled)
    description = Column(Text)
    location = Column(String(100))
    notes = Column(Text)
    created_at = Column(TIMESTAMP)

class AuditStatus(str, enum.Enum):
    pending = 'pending'
    completed = 'completed'

class Audit(Base):
    __tablename__ = 'audit'
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id'))
    audit_date = Column(Date)
    auditor = Column(String(100))
    notes = Column(Text)
    status = Column(Enum(AuditStatus), default=AuditStatus.pending)
    created_at = Column(TIMESTAMP)

class AuditTrail(Base):
    __tablename__ = 'audit_trail'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    username = Column(String(100))
    user_email = Column(String(100))
    full_name = Column(String(100))
    action = Column(String(100))  # CREATE, UPDATE, DELETE, LOGIN, LOGOUT, VIEW, etc.
    table_name = Column(String(100))  # assets, users, maintenance, etc.
    record_id = Column(Integer)  # ID of the affected record
    old_values = Column(JSON)  # Previous values (for updates)
    new_values = Column(JSON)  # New values (for updates/creates)
    ip_address = Column(String(45))  # IPv4 or IPv6
    user_agent = Column(Text)  # Browser/application info
    session_id = Column(String(255))  # Session identifier
    request_method = Column(String(10))  # GET, POST, PUT, DELETE
    request_url = Column(Text)  # Full request URL
    request_headers = Column(JSON)  # Request headers
    response_status = Column(Integer)  # HTTP response status
    execution_time = Column(Float)  # Request execution time in seconds
    error_message = Column(Text)  # Error details if any
    additional_data = Column(JSON)  # Any additional audit data
    timestamp = Column(TIMESTAMP, default=datetime.now)

class NotificationDirection(str, enum.Enum):
    sent = 'sent'
    received = 'received'

class Notification(Base):
    __tablename__ = 'notifications'
    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey('users.id'))
    sender_id = Column(Integer, ForeignKey('users.id'), nullable=True)
    title = Column(String(255), nullable=True)
    message = Column(Text)
    type = Column(String(50), nullable=True)
    priority = Column(String(20), nullable=True)
    action_url = Column(String(255), nullable=True)
    action_text = Column(String(100), nullable=True)
    notification_metadata = Column(JSON, nullable=True)
    direction = Column(Enum(NotificationDirection), default=NotificationDirection.received)
    is_read = Column(Integer, default=0)
    created_at = Column(TIMESTAMP)
    parent_id = Column(Integer, ForeignKey('notifications.id'), nullable=True)

class Department(Base):
    __tablename__ = 'departments'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    head_of_department = Column(String(100))
    contact_email = Column(String(100))
    contact_phone = Column(String(20))
    location = Column(String(100))
    created_at = Column(TIMESTAMP)

class Location(Base):
    __tablename__ = 'asset_locations'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(200), unique=True, nullable=False)
    address = Column(Text)
    contact_person = Column(String(100))
    contact_phone = Column(String(20))
    description = Column(Text)
    created_at = Column(TIMESTAMP)

class Category(Base):
    __tablename__ = 'asset_categories'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), unique=True, nullable=False)
    description = Column(Text)
    created_at = Column(TIMESTAMP)

class CustodianStatus(str, enum.Enum):
    active = 'active'
    inactive = 'inactive'

class Custodian(Base):
    __tablename__ = 'custodians'
    id = Column(Integer, primary_key=True, index=True)
    name = Column(String(100), nullable=False)
    department = Column(String(100))
    position = Column(String(100))
    phone = Column(String(20))
    email = Column(String(100))
    location = Column(String(100))
    status = Column(Enum(CustodianStatus), default=CustodianStatus.active)
    created_at = Column(TIMESTAMP)

class TransferRequestPriority(str, enum.Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'
    urgent = 'urgent'

class TransferRequestStatus(str, enum.Enum):
    pending = 'pending'
    approved = 'approved'
    rejected = 'rejected'
    completed = 'completed'
    cancelled = 'cancelled'

class TransferRequest(Base):
    __tablename__ = 'transfer_requests'
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id'), nullable=True)
    from_location = Column(String(100))
    to_location = Column(String(100))
    requested_by = Column(Integer, ForeignKey('users.id'))
    approved_by = Column(Integer, ForeignKey('users.id'), nullable=True)
    request_date = Column(Date)
    approval_date = Column(Date, nullable=True)
    priority = Column(Enum(TransferRequestPriority), default=TransferRequestPriority.medium)
    status = Column(Enum(TransferRequestStatus), default=TransferRequestStatus.pending)
    reason = Column(Text)
    notes = Column(Text, nullable=True)
    created_at = Column(TIMESTAMP)

class AssetHistory(Base):
    __tablename__ = 'asset_history'
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id'))
    event_type = Column(String(50))
    event_description = Column(Text)
    event_date = Column(TIMESTAMP)
    user_id = Column(Integer, ForeignKey('users.id'))

class MaintenanceComplaintStatus(str, enum.Enum):
    pending = 'pending'
    in_progress = 'in_progress'
    resolved = 'resolved'
    closed = 'closed'

class MaintenanceComplaintPriority(str, enum.Enum):
    low = 'low'
    medium = 'medium'
    high = 'high'
    critical = 'critical'

class MaintenanceComplaint(Base):
    __tablename__ = 'maintenance_complaints'
    id = Column(Integer, primary_key=True, index=True)
    asset_id = Column(Integer, ForeignKey('assets.id'), nullable=True)
    asset_name = Column(String(100), nullable=True)
    complaint_type = Column(String(50), nullable=False)
    description = Column(Text, nullable=False)
    user_id = Column(Integer, ForeignKey('users.id'), nullable=False)
    user_location = Column(String(100), nullable=True)
    user_department = Column(String(100), nullable=True)
    priority = Column(Enum(MaintenanceComplaintPriority), default=MaintenanceComplaintPriority.medium)
    status = Column(Enum(MaintenanceComplaintStatus), default=MaintenanceComplaintStatus.pending)
    assigned_to = Column(Integer, ForeignKey('users.id'), nullable=True)
    resolution_notes = Column(Text, nullable=True)
    resolved_at = Column(TIMESTAMP, nullable=True)
    created_at = Column(TIMESTAMP, default=datetime.now)
    updated_at = Column(TIMESTAMP, default=datetime.now, onupdate=datetime.now) 