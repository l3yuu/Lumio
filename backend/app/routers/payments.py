import os
import hmac
import hashlib
import json
import base64
import requests
from datetime import datetime, timedelta
from fastapi import APIRouter, Depends, HTTPException, status, Request, Header
from sqlalchemy.orm import Session
from pydantic import BaseModel
from typing import Optional

from ..database import get_db
from .. import models, schemas, auth
from ..config import settings

# Initialize router
router = APIRouter(prefix="/api/payments", tags=["payments"])

class CheckoutRequest(BaseModel):
    gateway: str  # "stripe" or "paymongo"

def is_stripe_configured() -> bool:
    return bool(settings.STRIPE_SECRET_KEY and settings.STRIPE_SECRET_KEY != "YOUR_STRIPE_SECRET_KEY")

def is_paymongo_configured() -> bool:
    return bool(settings.PAYMONGO_SECRET_KEY and settings.PAYMONGO_SECRET_KEY != "YOUR_PAYMONGO_SECRET_KEY")

def verify_paymongo_signature(signature_header: str, raw_body: bytes, webhook_secret: str) -> bool:
    try:
        parts = {}
        for item in signature_header.split(","):
            if "=" in item:
                k, v = item.split("=", 1)
                parts[k.strip()] = v.strip()
        timestamp = parts.get("t")
        signature = parts.get("te") or parts.get("li")
        if not timestamp or not signature:
            return False
        
        message = f"{timestamp}.".encode() + raw_body
        computed_signature = hmac.new(
            webhook_secret.encode(),
            message,
            hashlib.sha256
        ).hexdigest()
        
        return hmac.compare_digest(computed_signature, signature)
    except Exception as e:
        print(f"Error validating Paymongo signature: {e}")
        return False

@router.post("/create-checkout-session")
async def create_checkout_session(
    body: CheckoutRequest,
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    # Determine domain url
    frontend_url = settings.FRONTEND_URL.rstrip("/")
    backend_url = f"{frontend_url}/api"  # Fallback helper

    # MOCK MODE check
    if body.gateway == "stripe" and not is_stripe_configured():
        # Return mock checkout URL redirecting to mock settings success
        mock_success_url = f"{frontend_url}/dashboard?tab=settings&mock_success=stripe"
        return {"url": mock_success_url, "mock": True}
        
    if body.gateway == "paymongo" and not is_paymongo_configured():
        # Return mock checkout URL redirecting to mock settings success
        mock_success_url = f"{frontend_url}/dashboard?tab=settings&mock_success=paymongo"
        return {"url": mock_success_url, "mock": True}

    # 1. STRIPE GATEWAY
    if body.gateway == "stripe":
        import stripe
        stripe.api_key = settings.STRIPE_SECRET_KEY
        try:
            # Create a Stripe customer if not already created
            customer_id = current_user.stripe_customer_id
            if not customer_id:
                customer = stripe.Customer.create(
                    email=current_user.email,
                    name=current_user.name,
                    metadata={"user_id": str(current_user.id)}
                )
                customer_id = customer.id
                current_user.stripe_customer_id = customer_id
                db.commit()

            # Create recurring checkout session (PHP 100.00 per month)
            session = stripe.checkout.Session.create(
                customer=customer_id,
                payment_method_types=["card"],
                line_items=[
                    {
                        "price_data": {
                            "currency": "php",
                            "product_data": {
                                "name": "Lumio Pro Student",
                                "description": "25 quizzes/day, 10MB upload limit, AI chatbot expansion, and unlimited collaborative circles",
                            },
                            "unit_amount": 10000,  # ₱100.00 PHP
                            "recurring": {
                                "interval": "month",
                            },
                        },
                        "quantity": 1,
                    }
                ],
                mode="subscription",
                success_url=f"{frontend_url}/dashboard?tab=settings&stripe_success=true&session_id={{CHECKOUT_SESSION_ID}}",
                cancel_url=f"{frontend_url}/dashboard?tab=settings&payment_cancelled=true",
                metadata={
                    "user_id": str(current_user.id)
                }
            )
            return {"url": session.url, "mock": False}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Stripe error: {str(e)}")

    # 2. PAYMONGO GATEWAY
    elif body.gateway == "paymongo":
        try:
            # Paymongo requires basic auth (Base64 of secret_key + ":")
            auth_str = f"{settings.PAYMONGO_SECRET_KEY}:"
            auth_bytes = auth_str.encode("utf-8")
            auth_b64 = base64.b64encode(auth_bytes).decode("utf-8")

            url = "https://api.paymongo.com/v1/checkout_sessions"
            
            # Charging PHP 100.00 (which is 10000 cents) for a 30-day Pro Student pass
            payload = {
                "data": {
                    "attributes": {
                        "billing": {
                            "name": current_user.name,
                            "email": current_user.email
                        },
                        "line_items": [
                            {
                                "amount": 10000,  # PHP 100.00
                                "currency": "PHP",
                                "name": "Lumio Pro Student (30-Day Pass)",
                                "description": "30 days of 25 quizzes/day, 10MB upload limit, AI chatbot expansion, and unlimited collaborative circles",
                                "quantity": 1
                            }
                        ],
                        "payment_method_types": ["gcash", "paymaya"],
                        "success_url": f"{frontend_url}/dashboard?tab=settings&paymongo_success=true",
                        "cancel_url": f"{frontend_url}/dashboard?tab=settings&payment_cancelled=true",
                        "metadata": {
                            "user_id": str(current_user.id)
                        }
                    }
                }
            }

            headers = {
                "accept": "application/json",
                "content-type": "application/json",
                "authorization": f"Basic {auth_b64}"
            }

            response = requests.post(url, json=payload, headers=headers)
            
            if response.status_code != 200:
                print(f"Paymongo API Error response: {response.text}")
                raise HTTPException(status_code=response.status_code, detail=f"Paymongo checkout failed: {response.text}")
                
            res_data = response.json()
            checkout_url = res_data["data"]["attributes"]["checkout_url"]
            return {"url": checkout_url, "mock": False}
        except Exception as e:
            raise HTTPException(status_code=500, detail=f"Paymongo error: {str(e)}")

    else:
        raise HTTPException(status_code=400, detail="Invalid gateway specified.")

@router.post("/create-portal-session")
async def create_portal_session(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    frontend_url = settings.FRONTEND_URL.rstrip("/")

    # MOCK portal session check
    if not is_stripe_configured() or not current_user.stripe_customer_id:
        return {"url": f"{frontend_url}/dashboard?tab=settings&mock_portal=true", "mock": True}

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    try:
        # Create a portal session for customer
        session = stripe.billing_portal.Session.create(
            customer=current_user.stripe_customer_id,
            return_url=f"{frontend_url}/dashboard?tab=settings"
        )
        return {"url": session.url, "mock": False}
    except Exception as e:
        raise HTTPException(status_code=500, detail=f"Stripe portal error: {str(e)}")

# STRIPE WEBHOOK ENDPOINT
@router.post("/stripe-webhook")
async def stripe_webhook(request: Request, db: Session = Depends(get_db)):
    if not is_stripe_configured():
        return {"status": "ignored_mock_mode"}

    import stripe
    stripe.api_key = settings.STRIPE_SECRET_KEY
    webhook_secret = settings.STRIPE_WEBHOOK_SECRET

    payload = await request.body()
    sig_header = request.headers.get("stripe-signature")

    try:
        event = stripe.Webhook.construct_event(
            payload, sig_header, webhook_secret
        )
    except ValueError as e:
        raise HTTPException(status_code=400, detail="Invalid payload")
    except stripe.error.SignatureVerificationError as e:
        raise HTTPException(status_code=400, detail="Invalid signature")

    event_type = event["type"]
    print(f"Stripe Webhook received event: {event_type}")

    if event_type == "checkout.session.completed":
        session = event["data"]["object"]
        user_id_str = session.get("metadata", {}).get("user_id")
        customer_id = session.get("customer")
        subscription_id = session.get("subscription")

        if user_id_str:
            user_id = int(user_id_str)
            user = db.query(models.User).filter(models.User.id == user_id).first()
            if user:
                user.stripe_customer_id = customer_id
                user.stripe_subscription_id = subscription_id
                user.stripe_subscription_status = "active"
                user.role = "premium"
                db.commit()

    elif event_type == "customer.subscription.updated":
        subscription = event["data"]["object"]
        status = subscription.get("status")
        subscription_id = subscription.get("id")

        user = db.query(models.User).filter(models.User.stripe_subscription_id == subscription_id).first()
        if user:
            user.stripe_subscription_status = status
            if status in ("active", "trialing"):
                user.role = "premium"
            else:
                user.role = "user"
            db.commit()

    elif event_type == "customer.subscription.deleted":
        subscription = event["data"]["object"]
        subscription_id = subscription.get("id")

        user = db.query(models.User).filter(models.User.stripe_subscription_id == subscription_id).first()
        if user:
            user.stripe_subscription_status = "canceled"
            user.role = "user"
            db.commit()

    return {"status": "success"}

# PAYMONGO WEBHOOK ENDPOINT
@router.post("/paymongo-webhook")
async def paymongo_webhook(
    request: Request,
    x_paymongo_signature: Optional[str] = Header(None),
    db: Session = Depends(get_db)
):
    if not is_paymongo_configured():
        return {"status": "ignored_mock_mode"}

    raw_body = await request.body()
    webhook_secret = settings.PAYMONGO_WEBHOOK_SECRET

    if not x_paymongo_signature:
        raise HTTPException(status_code=400, detail="Missing signature header")

    if not verify_paymongo_signature(x_paymongo_signature, raw_body, webhook_secret):
        raise HTTPException(status_code=400, detail="Invalid webhook signature")

    try:
        body_json = json.loads(raw_body)
        evt_type = body_json["data"]["attributes"]["type"]
        print(f"Paymongo Webhook received event: {evt_type}")

        if evt_type == "checkout_session.payment.paid":
            checkout_session_data = body_json["data"]["attributes"]["data"]["attributes"]
            metadata = checkout_session_data.get("metadata", {})
            user_id_str = metadata.get("user_id")

            if user_id_str:
                user_id = int(user_id_str)
                user = db.query(models.User).filter(models.User.id == user_id).first()
                if user:
                    # Give 30 days of premium access
                    expiry = datetime.utcnow() + timedelta(days=30)
                    user.premium_expires_at = expiry
                    user.stripe_subscription_status = "active"  # Map active status locally
                    user.role = "premium"
                    db.commit()
    except Exception as e:
        print(f"Error parsing Paymongo webhook payload: {e}")
        raise HTTPException(status_code=400, detail="Failed to process payload")

    return {"status": "success"}

# MOCK MANAGEMENT ENDPOINTS (UPGRADE & DOWNGRADE)
@router.post("/mock-upgrade")
async def mock_upgrade(
    gateway: str = "stripe",
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    if gateway == "paymongo":
        # Simulate 30 days term pass
        current_user.premium_expires_at = datetime.utcnow() + timedelta(days=30)
        current_user.stripe_subscription_status = "active"
        current_user.role = "premium"
    else:
        # Simulate stripe subscription
        current_user.stripe_subscription_status = "active"
        current_user.role = "premium"
        
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "user": schemas.UserOut.from_orm(current_user)}

@router.post("/mock-downgrade")
async def mock_downgrade(
    current_user: models.User = Depends(auth.get_current_user),
    db: Session = Depends(get_db)
):
    current_user.stripe_subscription_status = None
    current_user.premium_expires_at = None
    current_user.stripe_customer_id = None
    current_user.stripe_subscription_id = None
    current_user.role = "user"
    db.commit()
    db.refresh(current_user)
    return {"status": "success", "user": schemas.UserOut.from_orm(current_user)}
