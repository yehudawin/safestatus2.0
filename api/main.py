from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel
from datetime import datetime, timedelta
import time
import os
from dotenv import load_dotenv

# Load environment variables
load_dotenv()

# Import database
try:
    from .db import db
except ImportError:
    # For running directly (without package)
    import sys
    import os
    sys.path.append(os.path.dirname(os.path.abspath(__file__)))
    from db import db

app = FastAPI(
    title="SafeStatus API",
    description="API לאפליקציית עדכון מצב בחירום",
    version="1.0.0"
)

# CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Data models
class PhoneRequest(BaseModel):
    phone: str

class OTPRequest(BaseModel):
    phone: str
    otp: str

class StatusUpdate(BaseModel):
    phone: str
    status: str

@app.get("/")
async def root():
    return {
        "message": "SafeStatus API", 
        "timestamp": datetime.now().isoformat(),
        "database": "Supabase" if db.is_connected() else "In-Memory",
        "version": "1.0.0"
    }

@app.post("/api/send-otp")
async def send_otp(request: PhoneRequest):
    phone = request.phone.strip()
    
    if not phone.startswith('05') or len(phone) != 10:
        raise HTTPException(status_code=400, detail="מספר טלפון לא תקין")
    
    # Record OTP sent time
    await db.set_otp_sent(phone, datetime.now())
    
    return {
        "success": True, 
        "message": "קוד אימות נשלח בהצלחה",
        "test_otp": "123456"  # In production, remove this
    }

@app.post("/api/verify-otp")
async def verify_otp(request: OTPRequest):
    phone = request.phone.strip()
    otp = request.otp.strip()
    
    # Get user from database
    user = await db.get_user(phone)
    if not user:
        raise HTTPException(status_code=400, detail="משתמש לא נמצא")
    
    # Check OTP (in production, implement real OTP validation)
    if otp != "123456":
        raise HTTPException(status_code=400, detail="קוד אימות שגוי")
    
    # Check if this is a new user
    is_new_user = not user.get("verified", False)
    
    # Update user as verified
    await db.update_user_verification(phone, True)
    
    # Generate a simple token (in production use JWT)
    token = f"token_{phone}_{int(time.time())}"
    
    return {
        "success": True,
        "token": token,
        "is_new_user": is_new_user,
        "user": {
            "phone": phone,
            "status": user.get("status", "no-update"),
            "join_date": user.get("join_date", datetime.now().isoformat())
        }
    }

@app.post("/api/status")
async def update_status(request: StatusUpdate):
    phone = request.phone.strip()
    status = request.status
    
    # Get user from database
    user = await db.get_user(phone)
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")
    
    if status not in ['shelter', 'safe', 'no-update']:
        raise HTTPException(status_code=400, detail="סטטוס לא תקין")
    
    # Update status in database
    success = await db.update_user_status(phone, status)
    if not success:
        raise HTTPException(status_code=500, detail="שגיאה בעדכון הסטטוס")
    
    return {
        "success": True,
        "status": status,
        "updated_at": datetime.now().isoformat()
    }

@app.get("/api/status/{phone}")
async def get_status(phone: str):
    user = await db.get_user(phone)
    if not user:
        raise HTTPException(status_code=404, detail="משתמש לא נמצא")
    
    return {
        "phone": phone,
        "status": user.get("status", "no-update"),
        "last_update": user.get("last_update")
    }

@app.get("/debug/users")
async def debug_users():
    users = await db.get_all_users()
    return {
        "users": users,
        "database_type": "Supabase" if db.is_connected() else "In-Memory",
        "total_users": len(users)
    }
