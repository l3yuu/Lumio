import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_condenser_history_tests():
    print("Starting Document Condenser History integration tests...")

    # 1. Generate unique email for registration
    test_email = f"condenser_history_test_{int(time.time())}@example.com"
    test_password = "password123"
    test_name = "Condenser History Tester"

    # 2. Register
    payload = {
        "email": test_email,
        "password": test_password,
        "name": test_name,
        "school": "Condenser History Academy"
    }
    r = requests.post(f"{BASE_URL}/api/auth/register", json=payload)
    if r.status_code == 200:
        print("Registration: SUCCESS")
        token_data = r.json()
        token = token_data["access_token"]
    else:
        print(f"Registration: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    headers = {
        "Authorization": f"Bearer {token}",
        "Content-Type": "application/json"
    }

    # 3. Test condensing endpoint to save history
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
        print("Condense Request & History Save: SUCCESS")
        
        # Verify structure
        assert "id" in result, "Response missing 'id'"
        assert "user_id" in result, "Response missing 'user_id'"
        assert "title" in result, "Response missing 'title'"
        assert "summary" in result, "Response missing 'summary'"
        assert "takeaways" in result, "Response missing 'takeaways'"
        assert "vocabulary" in result, "Response missing 'vocabulary'"
        assert "created_at" in result, "Response missing 'created_at'"
        
        history_id = result["id"]
        title = result["title"]
        print(f"Saved entry ID: {history_id}, Title: {title}")
    else:
        print(f"Condense Request & History Save: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    # 4. Fetch Condenser History List
    print("Fetching condenser history list...")
    r = requests.get(f"{BASE_URL}/api/condenser", headers=headers)
    if r.status_code == 200:
        history_list = r.json()
        print("Get History List: SUCCESS")
        assert isinstance(history_list, list), "History list should be a JSON array"
        assert len(history_list) >= 1, "History list should have at least 1 entry"
        
        # Verify our saved item is in the list
        found = False
        for entry in history_list:
            if entry["id"] == history_id:
                found = True
                assert entry["title"] == title, "History list entry title mismatch"
                break
        assert found, "Saved history entry not found in history list"
        print(f"Found saved history entry in history list: {found}")
    else:
        print(f"Get History List: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    # 5. Fetch Single History Entry Detail
    print(f"Fetching details for history entry {history_id}...")
    r = requests.get(f"{BASE_URL}/api/condenser/{history_id}", headers=headers)
    if r.status_code == 200:
        detail = r.json()
        print("Get History Detail: SUCCESS")
        assert detail["id"] == history_id, "History ID mismatch"
        assert detail["title"] == title, "History title mismatch"
        assert detail["summary"] == result["summary"], "History summary mismatch"
        assert detail["takeaways"] == result["takeaways"], "History takeaways mismatch"
        assert detail["vocabulary"] == result["vocabulary"], "History vocabulary mismatch"
    else:
        print(f"Get History Detail: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    # 6. Delete History Entry
    print(f"Deleting history entry {history_id}...")
    r = requests.delete(f"{BASE_URL}/api/condenser/{history_id}", headers=headers)
    if r.status_code == 200:
        print("Delete History Entry: SUCCESS")
        delete_response = r.json()
        assert delete_response.get("status") == "success", "Delete response missing status 'success'"
    else:
        print(f"Delete History Entry: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    # 7. Verify deletion (should return 404)
    print(f"Verifying history entry {history_id} was deleted...")
    r = requests.get(f"{BASE_URL}/api/condenser/{history_id}", headers=headers)
    assert r.status_code == 404, f"Expected 404 for deleted history entry, got {r.status_code}"
    print("Deletions verification: SUCCESS (received 404)")

    # 8. Verify list no longer contains the item
    print("Verifying list no longer contains the deleted entry...")
    r = requests.get(f"{BASE_URL}/api/condenser", headers=headers)
    if r.status_code == 200:
        history_list = r.json()
        for entry in history_list:
            assert entry["id"] != history_id, "Deleted entry was still found in list"
        print("List verification: SUCCESS (deleted entry not in list)")
    else:
        print(f"Get History List post-delete: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    print("All Document Condenser History integration tests finished successfully!")

if __name__ == "__main__":
    run_condenser_history_tests()
