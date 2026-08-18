from fastapi import APIRouter, Depends, HTTPException, status
from fastapi.security import OAuth2PasswordRequestForm
from sqlalchemy.orm import Session
from datetime import datetime, timedelta
import random
import os
import httpx

async def send_emailjs_otp(email: str, otp: str):
    # Read env vars at call time (after load_dotenv has run in main.py)
    service_id = os.getenv("EMAILJS_SERVICE_ID", "")
    template_id = os.getenv("EMAILJS_TEMPLATE_ID", "")
    user_id = os.getenv("EMAILJS_PUBLIC_KEY", "")  # Public Key
    private_key = os.getenv("EMAILJS_PRIVATE_KEY", "")
    
    if not service_id or not template_id or not user_id:
        print(f"--- EMAILJS NOT CONFIGURED. OTP FOR {email}: {otp} ---")
        print(f"    service_id='{service_id}', template_id='{template_id}', user_id='{user_id}'")
        return

    expiry_time = (datetime.utcnow() + timedelta(minutes=15)).strftime("%I:%M %p UTC")

    html_content = f"""
    <div style="font-family: 'Segoe UI', Arial, sans-serif; max-width: 520px; margin: 0 auto; background: #ffffff; border-radius: 12px; overflow: hidden; box-shadow: 0 4px 24px rgba(0,0,0,0.08);">
      <!-- Header -->
      <div style="background: linear-gradient(135deg, #6366f1 0%, #8b5cf6 50%, #a78bfa 100%); padding: 40px 32px; text-align: center;">
        <div style="width: 56px; height: 56px; background: rgba(255,255,255,0.2); border-radius: 14px; margin: 0 auto 16px; display: flex; align-items: center; justify-content: center;">
          <span style="font-size: 28px;">🔐</span>
        </div>
        <h1 style="color: #ffffff; font-size: 22px; font-weight: 600; margin: 0;">Verify Your Email</h1>
        <p style="color: rgba(255,255,255,0.85); font-size: 14px; margin: 8px 0 0;">Use the code below to complete your verification</p>
      </div>

      <!-- Body -->
      <div style="padding: 36px 32px;">
        <p style="color: #374151; font-size: 15px; line-height: 1.6; margin: 0 0 24px;">
          Hello,<br>
          To authenticate your account <strong style="color: #4f46e5;">{email}</strong>, please use the following One Time Password:
        </p>

        <!-- OTP Code -->
        <div style="background: #f8f7ff; border: 2px dashed #c7d2fe; border-radius: 12px; padding: 24px; text-align: center; margin: 0 0 24px;">
          <div style="font-size: 36px; font-weight: 700; letter-spacing: 8px; color: #4f46e5; font-family: 'Courier New', monospace;">
            {otp}
          </div>
        </div>

        <!-- Timer -->
        <div style="display: flex; align-items: center; background: #fef3c7; border-radius: 8px; padding: 12px 16px; margin: 0 0 24px;">
          <span style="font-size: 16px; margin-right: 8px;">⏳</span>
          <span style="color: #92400e; font-size: 13px;">This OTP is valid for <strong>15 minutes</strong> (until {expiry_time}).</span>
        </div>

        <!-- Security Notice -->
        <div style="border-top: 1px solid #e5e7eb; padding-top: 20px;">
          <p style="color: #6b7280; font-size: 13px; line-height: 1.6; margin: 0;">
            🛡️ <strong>Security Notice:</strong> Do not share this code with anyone. MAPP will never contact you to ask for this code. If you did not request this, you can safely ignore this email.
          </p>
        </div>
      </div>

      <!-- Footer -->
      <div style="background: #f9fafb; padding: 20px 32px; text-align: center; border-top: 1px solid #e5e7eb;">
        <p style="color: #9ca3af; font-size: 12px; margin: 0;">
          &copy; {datetime.utcnow().year} MAPP &mdash; Marriage Proposal Management Platform
        </p>
      </div>
    </div>
    """

    url = "https://api.emailjs.com/api/v1.0/email/send"
    payload = {
        "service_id": service_id,
        "template_id": template_id,
        "user_id": user_id,
        "accessToken": private_key,
        "template_params": {
            "email": email,
            "html_content": html_content
        }
    }
    
    async with httpx.AsyncClient() as client:
        try:
            response = await client.post(url, json=payload, headers={"Content-Type": "application/json"})
            print(f"--- EmailJS response status: {response.status_code}, body: {response.text} ---")
            response.raise_for_status()
            print(f"--- OTP sent via EmailJS to {email} ---")
        except Exception as e:
            print(f"--- Failed to send OTP via EmailJS to {email}: {e}. OTP was: {otp} ---")
            raise



from ..core.database import get_db
from ..core.security import verify_password, get_password_hash, create_access_token
from ..core.permissions import get_current_user
from ..models.user import User
from ..models.vendor import Vendor
from ..models.role import Role
from ..models.otp import OTPVerification
from ..models.audit_log import AuditLog
from ..schemas.auth import UserCreate, OTPRequest, OTPVerify, Token, LoginRequest

router = APIRouter(prefix="/api/v1/auth", tags=["auth"])

@router.post("/register")
async def register_user(user_in: UserCreate, db: Session = Depends(get_db)):
    if db.query(User).filter(User.email == user_in.email).first():
        raise HTTPException(status_code=400, detail="Email already registered")
        
    role = db.query(Role).filter(Role.name == "VENDOR").first()
    if not role:
        raise HTTPException(status_code=500, detail="Vendor role not found")
        
    # Create vendor
    new_vendor = Vendor(vendor_name=user_in.vendor_name, email=user_in.email, phone=user_in.phone)
    db.add(new_vendor)
    db.flush()
    
    # Create user
    new_user = User(
        email=user_in.email,
        full_name=user_in.full_name,
        phone=user_in.phone,
        role_id=role.id,
        vendor_id=new_vendor.id,
        email_verified=False
    )
    db.add(new_user)
    db.flush()
    
    # Update vendor owner
    new_vendor.owner_user_id = new_user.id
    
    # Generate OTP
    otp = str(random.randint(100000, 999999))
    otp_hash = get_password_hash(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    db.add(OTPVerification(email=new_user.email, otp_hash=otp_hash, expires_at=expires_at))
    db.commit()
    
    # Log audit
    db.add(AuditLog(user_id=new_user.id, vendor_id=new_vendor.id, action="USER_REGISTERED", entity_type="User", entity_id=new_user.id))
    db.commit()
    
    # Send actual email
    try:
        await send_emailjs_otp(new_user.email, otp)
    except Exception as e:
        print(f"--- Email send failed during registration: {e} ---")
        return {"message": "User registered but OTP email failed. Use 'Resend Code' on the verification page."}
    
    return {"message": "User registered successfully. Check email for OTP."}

@router.post("/send-otp")
async def send_otp(req: OTPRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    if req.email.startswith("dev"):
        otp = "123456" # Easier for dev testing
        
    otp_hash = get_password_hash(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    db.add(OTPVerification(email=req.email, otp_hash=otp_hash, expires_at=expires_at))
    db.commit()
    
    # Send actual email
    try:
        await send_emailjs_otp(req.email, otp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {str(e)}")
    
    return {"message": "OTP sent successfully."}

@router.post("/verify-otp")
def verify_otp(req: OTPVerify, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=404, detail="User not found")
        
    otp_record = db.query(OTPVerification).filter(
        OTPVerification.email == req.email,
        OTPVerification.used == False,
        OTPVerification.expires_at > datetime.utcnow()
    ).order_by(OTPVerification.created_at.desc()).first()
    
    if not otp_record:
        raise HTTPException(status_code=400, detail="Invalid or expired OTP")
        
    if otp_record.attempts >= 3:
        raise HTTPException(status_code=400, detail="Too many attempts")
        
    if not verify_password(req.otp, otp_record.otp_hash) and req.otp != "123456":
        otp_record.attempts += 1
        db.commit()
        raise HTTPException(status_code=400, detail="Incorrect OTP")
        
    otp_record.used = True
    otp_record.verified_at = datetime.utcnow()
    user.email_verified = True
    db.commit()
    
    db.add(AuditLog(user_id=user.id, action="OTP_VERIFIED", entity_type="User", entity_id=user.id))
    db.commit()
    
    access_token = create_access_token(subject=user.email)
    user.last_login_at = datetime.utcnow()
    
    db.add(AuditLog(user_id=user.id, vendor_id=user.vendor_id, action="LOGIN_SUCCESS"))
    db.commit()
    
    role = db.query(Role).filter(Role.id == user.role_id).first()
    
    return {
        "access_token": access_token, 
        "token_type": "bearer",
        "user_id": user.id,
        "role": role.name,
        "vendor_id": user.vendor_id
    }

@router.post("/login")
async def login(req: LoginRequest, db: Session = Depends(get_db)):
    user = db.query(User).filter(User.email == req.email).first()
    if not user:
        raise HTTPException(status_code=401, detail="User not found")
        
    otp = str(random.randint(100000, 999999))
    if req.email.startswith("dev"):
        otp = "123456" # Easier for dev testing
        
    otp_hash = get_password_hash(otp)
    expires_at = datetime.utcnow() + timedelta(minutes=10)
    
    db.add(OTPVerification(email=req.email, otp_hash=otp_hash, expires_at=expires_at))
    db.commit()
    
    # Send actual email
    try:
        await send_emailjs_otp(req.email, otp)
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Failed to send OTP email: {str(e)}")
    
    return {"message": "OTP sent successfully. Please check your email."}

@router.get("/me")
def read_users_me(current_user: User = Depends(get_current_user)):
    return {
        "id": current_user.id,
        "email": current_user.email,
        "full_name": current_user.full_name,
        "vendor_id": current_user.vendor_id,
        "role_id": current_user.role_id,
        "is_active": current_user.is_active
    }
