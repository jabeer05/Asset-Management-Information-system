from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from fastapi.staticfiles import StaticFiles
from fastapi_app.audit_middleware import create_audit_middleware
from fastapi_app.routers_users import router as users_router
from fastapi_app.routers_auth import router as auth_router
from fastapi_app.routers_assets import router as assets_router
from fastapi_app.routers_maintenance import router as maintenance_router
from fastapi_app.routers_notifications import router as notifications_router
from fastapi_app.routers_dashboard import router as dashboard_router
from fastapi_app.routers_transfer_requests import router as transfer_requests_router
from fastapi_app.routers_auctions import router as auctions_router
from fastapi_app.routers_disposals import router as disposals_router
from fastapi_app.routers_reports import router as reports_router
from fastapi_app.routers_departments import router as departments_router
from fastapi_app.routers_locations import router as locations_router
from fastapi_app.routers_maintenance_complaints import router as maintenance_complaints_router
from fastapi_app.routers_audit_trail import router as audit_trail_router
import os
from datetime import datetime

app = FastAPI()

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Add audit middleware
app.middleware("http")(create_audit_middleware(app))

UPLOAD_DIR = os.getenv("ASSET_UPLOAD_DIR", "backend/uploads")
os.makedirs(UPLOAD_DIR, exist_ok=True)
app.mount("/uploads", StaticFiles(directory=UPLOAD_DIR), name="uploads")

app.include_router(users_router)
app.include_router(auth_router)
app.include_router(assets_router)
app.include_router(maintenance_router)
app.include_router(auctions_router)
app.include_router(disposals_router)
app.include_router(notifications_router)
app.include_router(dashboard_router)
app.include_router(transfer_requests_router)
app.include_router(reports_router)
app.include_router(departments_router)
app.include_router(locations_router)
app.include_router(maintenance_complaints_router)
app.include_router(audit_trail_router)

@app.get("/")
def read_root():
    return {"message": "Asset Management API is running"}

@app.get("/test")
def test_endpoint():
    return {"message": "Test endpoint working", "status": "success"}

@app.get("/health")
def health_check():
    return {"status": "healthy", "timestamp": datetime.now().isoformat()} 