import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_system_config_tests():
    print("Starting Global Platform Configurations integration tests...")

    # 1. Create a unique superadmin (first user is superadmin)
    admin_email = f"admin_cfg_test_{int(time.time())}@example.com"
    password = "password123"
    name = "Superadmin Config Tester"

    # Register the admin
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": admin_email,
        "password": password,
        "name": name,
        "school": "Config Academy"
    })
    
    if r.status_code != 200:
        print(f"Admin Registration: FAILED ({r.status_code}) - {r.text}")
        return
        
    print("Admin Registered: SUCCESS")
    admin_token = r.json()["access_token"]
    admin_headers = {
        "Authorization": f"Bearer {admin_token}",
        "Content-Type": "application/json"
    }

    # Promote registered user to superadmin in the database
    from app.database import SessionLocal
    from app.models import User
    db = SessionLocal()
    try:
        user = db.query(User).filter(User.email == admin_email).first()
        if user:
            user.role = "superadmin"
            db.commit()
            print("Admin Promoted to Superadmin: SUCCESS")
    finally:
        db.close()

    # Register a standard user to test permissions and restrictions
    user_email = f"user_cfg_test_{int(time.time())}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": user_email,
        "password": password,
        "name": "Normal User Tester",
        "school": "Config Academy"
    })
    
    if r.status_code != 200:
        print(f"User Registration: FAILED ({r.status_code}) - {r.text}")
        return
        
    print("Normal User Registered: SUCCESS")
    user_token = r.json()["access_token"]
    user_headers = {
        "Authorization": f"Bearer {user_token}",
        "Content-Type": "application/json"
    }

    # 2. Test permissions: normal user should NOT be able to view or update system configs
    print("Testing permission restrictions for normal user...")
    r = requests.get(f"{BASE_URL}/api/admin/config", headers=user_headers)
    assert r.status_code == 403, f"Expected 403 Forbidden for normal user, got {r.status_code}"
    print("  GET /api/admin/config blocked for user: YES")

    r = requests.put(f"{BASE_URL}/api/admin/config", json={"allow_registrations": False}, headers=user_headers)
    assert r.status_code == 403, f"Expected 403 Forbidden for normal user, got {r.status_code}"
    print("  PUT /api/admin/config blocked for user: YES")

    # 3. Test superadmin fetching configurations
    print("Fetching system configurations as superadmin...")
    r = requests.get(f"{BASE_URL}/api/admin/config", headers=admin_headers)
    assert r.status_code == 200, f"Expected 200 OK, got {r.status_code} - {r.text}"
    configs = r.json()
    print(f"  Current system configurations: {configs}")
    assert configs["allow_registrations"] is True, "Expected registrations to be open by default"

    # 4. Test Closing Registrations
    print("Disabling new registrations...")
    r = requests.put(f"{BASE_URL}/api/admin/config", json={"allow_registrations": False}, headers=admin_headers)
    assert r.status_code == 200, f"Failed to update config: {r.text}"
    assert r.json()["allow_registrations"] is False, "Config value did not update in response"

    # Verify that registration is blocked
    print("Attempting to register a new user while registrations are closed...")
    blocked_email = f"blocked_test_{int(time.time())}@example.com"
    r = requests.post(f"{BASE_URL}/api/auth/register", json={
        "email": blocked_email,
        "password": password,
        "name": "Blocked User",
        "school": "Config Academy"
    })
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code} - {r.text}"
    assert "closed" in r.json()["detail"].lower(), f"Unexpected error detail: {r.json()['detail']}"
    print("  Registration successfully blocked: YES")

    # Re-enable registrations
    print("Re-enabling registrations...")
    r = requests.put(f"{BASE_URL}/api/admin/config", json={"allow_registrations": True}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["allow_registrations"] is True

    # 5. Test Restricting Circle Creation
    print("Disabling Collaborative Circle (study group) creation...")
    r = requests.put(f"{BASE_URL}/api/admin/config", json={"allow_circle_creation": False}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["allow_circle_creation"] is False

    # Attempt to create a circle as a normal user
    print("Attempting to create study group as standard user...")
    r = requests.post(f"{BASE_URL}/api/groups", json={
        "name": "Blocked Circle",
        "members": []
    }, headers=user_headers)
    assert r.status_code == 403, f"Expected 403 Forbidden, got {r.status_code} - {r.text}"
    assert "disabled" in r.json()["detail"].lower(), f"Unexpected error detail: {r.json()['detail']}"
    print("  Study Group creation blocked for normal user: YES")

    # Verify that superadmin can still create groups (bypass config check)
    print("Attempting to create study group as superadmin...")
    r = requests.post(f"{BASE_URL}/api/groups", json={
        "name": "Admin Test Circle",
        "members": []
    }, headers=admin_headers)
    assert r.status_code == 200, f"Expected superadmin bypass, got {r.status_code} - {r.text}"
    print("  Superadmin bypass for group creation: YES")

    # Clean up admin group
    admin_group_id = r.json()["id"]
    requests.post(f"{BASE_URL}/api/groups/{admin_group_id}/leave", headers=admin_headers)

    # Re-enable Circle creation
    print("Re-enabling Circle creation...")
    r = requests.put(f"{BASE_URL}/api/admin/config", json={"allow_circle_creation": True}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["allow_circle_creation"] is True

    # 6. Test Maintenance Mode
    print("Testing Maintenance Mode toggles...")
    # Verify initial config
    r = requests.get(f"{BASE_URL}/api/admin/config", headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["maintenance_mode"] is False

    # Turn on Maintenance Mode
    print("Activating Maintenance Mode...")
    r = requests.put(f"{BASE_URL}/api/admin/config", json={"maintenance_mode": True}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["maintenance_mode"] is True

    # Attempt standard user request (GET /api/modules) -> should get 503 Service Unavailable
    print("Testing normal user blocked by maintenance mode...")
    r = requests.get(f"{BASE_URL}/api/modules", headers=user_headers)
    assert r.status_code == 503, f"Expected 503 Service Unavailable, got {r.status_code} - {r.text}"
    assert "maintenance" in r.json()["detail"].lower(), f"Unexpected error detail: {r.json()['detail']}"
    print("  Normal user blocked: YES")

    # Verify superadmin can still request modules (not blocked)
    print("Testing superadmin access during maintenance mode...")
    r = requests.get(f"{BASE_URL}/api/modules", headers=admin_headers)
    assert r.status_code == 200, f"Expected 200 OK for superadmin bypass, got {r.status_code} - {r.text}"
    print("  Superadmin bypass: YES")

    # Turn off Maintenance Mode
    print("Deactivating Maintenance Mode...")
    r = requests.put(f"{BASE_URL}/api/admin/config", json={"maintenance_mode": False}, headers=admin_headers)
    assert r.status_code == 200
    assert r.json()["maintenance_mode"] is False

    # Verify standard user can request modules again
    print("Verifying normal user access restored...")
    r = requests.get(f"{BASE_URL}/api/modules", headers=user_headers)
    assert r.status_code == 200, f"Expected 200 OK after maintenance deactivated, got {r.status_code} - {r.text}"
    print("  Normal user access restored: YES")

    print("All global platform configurations integration tests completed successfully!")

if __name__ == "__main__":
    run_system_config_tests()
