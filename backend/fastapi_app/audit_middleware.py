import time
import json
from typing import Dict, Any, Optional
from fastapi import Request, Response
from fastapi.responses import JSONResponse
from sqlalchemy.orm import Session
from fastapi_app.database import SessionLocal
from fastapi_app.models import AuditTrail
from fastapi_app.token_utils import get_current_user_from_token
import re

class AuditMiddleware:
    def __init__(self, app):
        self.app = app
        # Define patterns for sensitive data that should be masked
        self.sensitive_patterns = [
            r'password["\']?\s*:\s*["\'][^"\']*["\']',
            r'token["\']?\s*:\s*["\'][^"\']*["\']',
            r'authorization["\']?\s*:\s*["\'][^"\']*["\']',
            r'secret["\']?\s*:\s*["\'][^"\']*["\']',
            r'key["\']?\s*:\s*["\'][^"\']*["\']'
        ]
        
        # Define audit-worthy endpoints (exclude static files, health checks, etc.)
        self.audit_worthy_patterns = [
            r'/api/',
            r'/auth/',
            r'/users/',
            r'/assets/',
            r'/maintenance/',
            r'/transfers/',
            r'/auctions/',
            r'/disposals/',
            r'/notifications/',
            r'/reports/',
            r'/audit/'
        ]
        
        # Define endpoints that should not be audited
        self.exclude_patterns = [
            r'/health',
            r'/test',
            r'/uploads/',
            r'/static/',
            r'/docs',
            r'/redoc',
            r'/openapi.json'
        ]

    def should_audit(self, path: str) -> bool:
        """Determine if the request should be audited"""
        # Check if path matches any exclude patterns
        for pattern in self.exclude_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                return False
        
        # Check if path matches any audit-worthy patterns
        for pattern in self.audit_worthy_patterns:
            if re.search(pattern, path, re.IGNORECASE):
                return True
        
        return False

    def mask_sensitive_data(self, data: str) -> str:
        """Mask sensitive data in request/response bodies"""
        masked_data = data
        for pattern in self.sensitive_patterns:
            masked_data = re.sub(pattern, r'\1: "***MASKED***"', masked_data, flags=re.IGNORECASE)
        return masked_data

    def extract_user_info(self, request: Request) -> Dict[str, Any]:
        """Extract user information from the request"""
        user_info = {
            "user_id": None,
            "username": None,
            "user_email": None,
            "full_name": None
        }
        
        try:
            # Try to get user from authorization header
            auth_header = request.headers.get("authorization")
            if auth_header and auth_header.startswith("Bearer "):
                token = auth_header.split(" ")[1]
                user = get_current_user_from_token(token)
                if user:
                    user_info.update({
                        "user_id": user.id,
                        "username": user.username,
                        "user_email": user.email,
                        "full_name": f"{user.first_name} {user.last_name}"
                    })
        except Exception:
            pass
        
        return user_info

    def determine_action(self, method: str, path: str) -> str:
        """Determine the action based on HTTP method and path"""
        if method == "GET":
            if "/{id}" in path or re.search(r'/\d+$', path):
                return "VIEW"
            return "LIST"
        elif method == "POST":
            return "CREATE"
        elif method == "PUT":
            return "UPDATE"
        elif method == "DELETE":
            return "DELETE"
        elif method == "PATCH":
            return "UPDATE"
        else:
            return method.upper()

    def extract_table_name(self, path: str) -> Optional[str]:
        """Extract table name from API path"""
        # Remove /api prefix if present
        clean_path = path.replace("/api", "")
        
        # Extract the first segment after /
        segments = clean_path.strip("/").split("/")
        if segments:
            table_name = segments[0]
            # Map common API paths to table names
            table_mapping = {
                "users": "users",
                "assets": "assets",
                "maintenance": "maintenance",
                "transfers": "transfers",
                "auctions": "auctions",
                "disposals": "disposals",
                "notifications": "notifications",
                "reports": "reports",
                "audit": "audit_trail",
                "auth": "auth",
                "departments": "departments",
                "locations": "asset_locations",
                "maintenance-complaints": "maintenance_complaints",
                "transfer-requests": "transfer_requests"
            }
            return table_mapping.get(table_name, table_name)
        return None

    def extract_record_id(self, path: str) -> Optional[int]:
        """Extract record ID from path if present"""
        # Look for numeric IDs in the path
        id_match = re.search(r'/(\d+)(?:/|$)', path)
        if id_match:
            try:
                return int(id_match.group(1))
            except ValueError:
                pass
        return None

    async def __call__(self, request: Request, call_next):
        start_time = time.time()
        
        # Check if this request should be audited
        if not self.should_audit(request.url.path):
            response = await call_next(request)
            return response
        
        # Extract request information
        method = request.method
        path = str(request.url.path)
        query_params = str(request.url.query)
        full_url = str(request.url)
        
        # Get client IP
        client_ip = request.client.host if request.client else None
        forwarded_for = request.headers.get("x-forwarded-for")
        if forwarded_for:
            client_ip = forwarded_for.split(",")[0].strip()
        
        # Get user agent
        user_agent = request.headers.get("user-agent", "")
        
        # Extract user information
        user_info = self.extract_user_info(request)
        
        # Determine action and table
        action = self.determine_action(method, path)
        table_name = self.extract_table_name(path)
        record_id = self.extract_record_id(path)
        
        # Prepare request body (for POST/PUT requests)
        request_body = None
        old_values = None
        new_values = None
        
        try:
            if method in ["POST", "PUT", "PATCH"]:
                body_bytes = await request.body()
                if body_bytes:
                    request_body = body_bytes.decode('utf-8')
                    request_body = self.mask_sensitive_data(request_body)
                    new_values = json.loads(request_body) if request_body else None
        except Exception:
            pass
        
        # Process the request
        try:
            response = await call_next(request)
            execution_time = time.time() - start_time
            
            # Get response status
            response_status = response.status_code
            
            # Prepare response body (for errors or specific cases)
            response_body = None
            if response_status >= 400:
                try:
                    if hasattr(response, 'body'):
                        response_body = response.body.decode('utf-8')
                except Exception:
                    pass
            
            # Create audit record
            audit_data = {
                "user_id": user_info["user_id"],
                "username": user_info["username"],
                "user_email": user_info["user_email"],
                "full_name": user_info["full_name"],
                "action": action,
                "table_name": table_name,
                "record_id": record_id,
                "old_values": old_values,
                "new_values": new_values,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "session_id": None,  # Could be extracted from cookies if needed
                "request_method": method,
                "request_url": full_url,
                "request_headers": dict(request.headers),
                "response_status": response_status,
                "execution_time": execution_time,
                "error_message": response_body if response_status >= 400 else None,
                "additional_data": {
                    "query_params": query_params,
                    "request_body_size": len(request_body) if request_body else 0
                }
            }
            
            # Save audit record asynchronously
            await self.save_audit_record(audit_data)
            
            return response
            
        except Exception as e:
            execution_time = time.time() - start_time
            
            # Create audit record for the error
            audit_data = {
                "user_id": user_info["user_id"],
                "username": user_info["username"],
                "user_email": user_info["user_email"],
                "full_name": user_info["full_name"],
                "action": action,
                "table_name": table_name,
                "record_id": record_id,
                "old_values": old_values,
                "new_values": new_values,
                "ip_address": client_ip,
                "user_agent": user_agent,
                "session_id": None,
                "request_method": method,
                "request_url": full_url,
                "request_headers": dict(request.headers),
                "response_status": 500,
                "execution_time": execution_time,
                "error_message": str(e),
                "additional_data": {
                    "query_params": query_params,
                    "request_body_size": len(request_body) if request_body else 0
                }
            }
            
            # Save audit record asynchronously
            await self.save_audit_record(audit_data)
            
            # Re-raise the exception
            raise

    async def save_audit_record(self, audit_data: Dict[str, Any]):
        """Save audit record to database"""
        try:
            db = SessionLocal()
            audit_record = AuditTrail(**audit_data)
            db.add(audit_record)
            db.commit()
            db.close()
        except Exception as e:
            # Log error but don't fail the request
            print(f"Error saving audit record: {str(e)}")

def create_audit_middleware(app):
    """Factory function to create audit middleware"""
    return AuditMiddleware(app) 