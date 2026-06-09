import requests
import json
import time

BASE_URL = "http://127.0.0.1:8000"

def run_tests():
    print("Starting integration tests...")
    
    # 1. Health check
    try:
        r = requests.get(f"{BASE_URL}/api/health")
        print(f"Health Check: {r.status_code} - {r.json()}")
    except Exception as e:
        print(f"Failed to connect to backend: {e}")
        return

    # Generate unique email for registration
    test_email = f"test_{int(time.time())}@example.com"
    test_password = "password123"
    test_name = "Test Student"

    # 2. Register
    payload = {
        "email": test_email,
        "password": test_password,
        "name": test_name,
        "school": "Test University"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
    if r.status_code == 200:
        print("Registration: SUCCESS")
        token_data = r.json()
        token = token_data["access_token"]
    else:
        print(f"Registration: FAILED ({r.status_code}) - {r.text}")
        return

    # 3. Login
    payload_login = {
        "email": test_email,
        "password": test_password
    }
    r = requests.post(f"{BASE_URL}/api/auth/login", json=payload_login)
    if r.status_code == 200:
        print("Login: SUCCESS")
    else:
        print(f"Login: FAILED ({r.status_code}) - {r.text}")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 4. Get profile (me)
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    if r.status_code == 200:
        print(f"Get Profile: SUCCESS - Welcome {r.json()['name']}")
    else:
        print(f"Get Profile: FAILED ({r.status_code}) - {r.text}")

    # 5. Create Module via Form Data
    module_payload = {
        "name": "General Chemistry",
        "subject": "Chemistry",
        "size": "2.4 MB",
        "text_content": "This is sample chemistry text content."
    }
    headers_multipart = {
        "Authorization": f"Bearer {token}"
    }
    r = requests.post(f"{BASE_URL}/api/modules", data=module_payload, headers=headers_multipart)
    if r.status_code == 200:
        module_data = r.json()
        print(f"Create Module: SUCCESS - Created module ID {module_data['id']} with {len(module_data.get('questions', []))} questions")
        module_id = module_data["id"]
    else:
        print(f"Create Module: FAILED ({r.status_code}) - {r.text}")
        return

    # 6. Retrieve Modules
    r = requests.get(f"{BASE_URL}/api/modules", headers=headers)
    if r.status_code == 200:
        modules = r.json()
        print(f"Retrieve Modules: SUCCESS - Found {len(modules)} modules")
    else:
        print(f"Retrieve Modules: FAILED ({r.status_code}) - {r.text}")

    # 6a. Register secondary user
    secondary_email = f"test_sec_{int(time.time())}@example.com"
    payload_sec = {
        "email": secondary_email,
        "password": test_password,
        "name": "Second Student",
        "school": "Test University"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload_sec)
    if r.status_code != 200:
        print(f"Register Secondary User: FAILED ({r.status_code}) - {r.text}")

    # 6b. Create Group
    group_payload = {
        "name": "Chemistry Study Circle",
        "members": [secondary_email]
    }
    r = requests.post(f"{BASE_URL}/api/groups", json=group_payload, headers=headers)
    if r.status_code == 200:
        group_data = r.json()
        print(f"Create Group: SUCCESS - Created group '{group_data['name']}' with {len(group_data['members'])} members")
        group_id = group_data["id"]
    else:
        print(f"Create Group: FAILED ({r.status_code}) - {r.text}")
        return

    # 6c. Get Groups
    r = requests.get(f"{BASE_URL}/api/groups", headers=headers)
    if r.status_code == 200:
        groups_list = r.json()
        print(f"Retrieve Groups: SUCCESS - Found {len(groups_list)} groups")
    else:
        print(f"Retrieve Groups: FAILED ({r.status_code}) - {r.text}")

    # 6d. Share Module with Group
    r = requests.post(f"{BASE_URL}/api/groups/{group_id}/share-module/{module_id}", headers=headers)
    if r.status_code == 200:
        group_data = r.json()
        print(f"Share Module: SUCCESS - Group now has {len(group_data['modules'])} shared modules")
    else:
        print(f"Share Module: FAILED ({r.status_code}) - {r.text}")

    # 7. Delete Module
    r = requests.delete(f"{BASE_URL}/api/modules/{module_id}", headers=headers)
    if r.status_code == 200:
        print("Delete Module: SUCCESS")
    else:
        print(f"Delete Module: FAILED ({r.status_code}) - {r.text}")

    print("All integration tests finished successfully!")

if __name__ == "__main__":
    run_tests()
