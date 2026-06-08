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

    # 5. Create Module & Questions
    module_payload = {
        "name": "General Chemistry",
        "subject": "Chemistry",
        "size": "2.4 MB",
        "questions": [
            {
                "question": "What is the atomic number of Hydrogen?",
                "options": ["1", "2", "6", "8"],
                "correct_answer_index": 0
            },
            {
                "question": "What is the molecular formula of water?",
                "options": ["CO2", "H2O", "NaCl", "CH4"],
                "correct_answer_index": 1
            }
        ]
    }
    r = requests.post(f"{BASE_URL}/api/modules", json=module_payload, headers=headers)
    if r.status_code == 200:
        module_data = r.json()
        print(f"Create Module: SUCCESS - Created module ID {module_data['id']} with {len(module_data['questions'])} questions")
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

    # 7. Delete Module
    r = requests.delete(f"{BASE_URL}/api/modules/{module_id}", headers=headers)
    if r.status_code == 200:
        print("Delete Module: SUCCESS")
    else:
        print(f"Delete Module: FAILED ({r.status_code}) - {r.text}")

    print("All integration tests finished successfully!")

if __name__ == "__main__":
    run_tests()
