import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_condenser_tests():
    print("Starting Document Condenser integration tests...")

    # 1. Generate unique email for registration
    test_email = f"condenser_test_{int(time.time())}@example.com"
    test_password = "password123"
    test_name = "Condenser Tester"

    # 2. Register
    payload = {
        "email": test_email,
        "password": test_password,
        "name": test_name,
        "school": "Condenser Academy"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
    if r.status_code == 200:
        print("Registration: SUCCESS")
        token_data = r.json()
        token = token_data["access_token"]
    else:
        print(f"Registration: FAILED ({r.status_code}) - {r.text}")
        return

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 3. Test condensing endpoint
    test_text = """
    Cell theory is a fundamental scientific theory of biology.
    It states that all living organisms are made up of cells.
    Cells are the basic structural and organizational unit of all organisms.
    Robert Hooke discovered cells in 1665 using an early microscope.
    Mitochondria functions to produce energy for the cell in the form of ATP.
    The cell membrane is defined as a selective barrier that regulates transport.
    """

    payload_condense = {
        "text": test_text
    }
    
    print("Sending document condensing request...")
    r = requests.post(f"{BASE_URL}/api/condenser/condense", json=payload_condense, headers=headers)
    if r.status_code == 200:
        result = r.json()
        print("Condense Request: SUCCESS")
        
        # Verify structure
        assert "summary" in result, "Response missing 'summary'"
        assert "takeaways" in result, "Response missing 'takeaways'"
        assert "vocabulary" in result, "Response missing 'vocabulary'"
        
        print(f"  Summary length: {len(result['summary'])} characters")
        print(f"  Takeaways count: {len(result['takeaways'])} items")
        print(f"  Vocabulary count: {len(result['vocabulary'])} items")
        
        # Verify types
        assert isinstance(result["summary"], str), "Summary should be a string"
        assert isinstance(result["takeaways"], list), "Takeaways should be a list"
        assert isinstance(result["vocabulary"], list), "Vocabulary should be a list"
        
        # Verify vocabulary format
        for item in result["vocabulary"]:
            assert "term" in item, "Vocabulary item missing 'term'"
            assert "definition" in item, "Vocabulary item missing 'definition'"
            print(f"    - Term: '{item['term']}' -> Definition: '{item['definition'][:40]}...'")
            
    else:
        print(f"Condense Request: FAILED ({r.status_code}) - {r.text}")
        return

    print("All Document Condenser integration tests finished successfully!")

if __name__ == "__main__":
    run_condenser_tests()
