import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_essay_grader_tests():
    print("Starting AI Essay Grader integration tests...")

    # 1. Generate unique email for registration
    test_email = f"essay_test_{int(time.time())}@example.com"
    test_password = "password123"
    test_name = "Essay Tester"

    # 2. Register
    payload = {
        "email": test_email,
        "password": test_password,
        "name": test_name,
        "school": "Grader Academy"
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

    # 3. Test grading endpoint
    essay_prompt = "Primary causes of political shifts in the 19th Century"
    essay_text = """
    The 19th century was marked by massive political shifts across Europe and the Americas.
    Firstly, the rise of industrialization led to the growth of the working class, who demanded political representation.
    This contention is supported by the subsequent rise of labor unions and constitutional reforms.
    Secondly, nationalistic fervor spread across territories, challenging established imperial authorities.
    Consequently, empires faced revolutions, leading to the unification of states like Italy and Germany.
    In conclusion, economic shifts coupled with nationalistic movements were the primary catalysts for political transitions.
    """

    payload_grade = {
        "prompt": essay_prompt,
        "text": essay_text
    }
    
    print("Sending essay grading request...")
    r = requests.post(f"{BASE_URL}/api/essay-grader/grade", json=payload_grade, headers=headers)
    if r.status_code == 200:
        result = r.json()
        print("Grade Request & Save: SUCCESS")
        
        # Verify structure
        assert "id" in result, "Response missing 'id'"
        assert "user_id" in result, "Response missing 'user_id'"
        assert "title" in result, "Response missing 'title'"
        assert "prompt" in result, "Response missing 'prompt'"
        assert "essay_text" in result, "Response missing 'essay_text'"
        assert "grade" in result, "Response missing 'grade'"
        assert "thesis_score" in result, "Response missing 'thesis_score'"
        assert "grammar_score" in result, "Response missing 'grammar_score'"
        assert "structure_score" in result, "Response missing 'structure_score'"
        assert "critique" in result, "Response missing 'critique'"
        assert "recommendations" in result, "Response missing 'recommendations'"
        assert "created_at" in result, "Response missing 'created_at'"
        
        history_id = result["id"]
        title = result["title"]
        print(f"Saved entry ID: {history_id}, Title: {title}")
        print(f"  Grade: {result['grade']}")
        print(f"  Thesis: {result['thesis_score']}%")
        print(f"  Grammar: {result['grammar_score']}%")
        print(f"  Structure: {result['structure_score']}%")
    else:
        print(f"Grade Request & Save: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    # 4. Fetch History List
    print("Fetching essay grader history list...")
    r = requests.get(f"{BASE_URL}/api/essay-grader", headers=headers)
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
                assert entry["title"] == title, "History entry title mismatch"
                break
        assert found, "Saved history entry not found in history list"
        print(f"Found saved history entry in list: {found}")
    else:
        print(f"Get History List: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    # 5. Fetch Single History Entry Detail
    print(f"Fetching details for history entry {history_id}...")
    r = requests.get(f"{BASE_URL}/api/essay-grader/{history_id}", headers=headers)
    if r.status_code == 200:
        detail = r.json()
        print("Get History Detail: SUCCESS")
        assert detail["id"] == history_id, "History ID mismatch"
        assert detail["title"] == title, "History title mismatch"
        assert detail["prompt"] == essay_prompt, "History prompt mismatch"
        assert detail["essay_text"] == essay_text, "History essay_text mismatch"
        assert detail["grade"] == result["grade"], "History grade mismatch"
        assert detail["thesis_score"] == result["thesis_score"], "History thesis_score mismatch"
        assert detail["grammar_score"] == result["grammar_score"], "History grammar_score mismatch"
        assert detail["structure_score"] == result["structure_score"], "History structure_score mismatch"
        assert detail["critique"] == result["critique"], "History critique mismatch"
        assert detail["recommendations"] == result["recommendations"], "History recommendations mismatch"
    else:
        print(f"Get History Detail: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    # 6. Delete History Entry
    print(f"Deleting history entry {history_id}...")
    r = requests.delete(f"{BASE_URL}/api/essay-grader/{history_id}", headers=headers)
    if r.status_code == 200:
        print("Delete History Entry: SUCCESS")
        delete_response = r.json()
        assert delete_response.get("status") == "success", "Delete response missing status 'success'"
    else:
        print(f"Delete History Entry: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    # 7. Verify deletion (should return 404)
    print(f"Verifying history entry {history_id} was deleted...")
    r = requests.get(f"{BASE_URL}/api/essay-grader/{history_id}", headers=headers)
    assert r.status_code == 404, f"Expected 404 for deleted history entry, got {r.status_code}"
    print("Deletion verification: SUCCESS (received 404)")

    # 8. Verify list no longer contains the item
    print("Verifying list no longer contains the deleted entry...")
    r = requests.get(f"{BASE_URL}/api/essay-grader", headers=headers)
    if r.status_code == 200:
        history_list = r.json()
        for entry in history_list:
            assert entry["id"] != history_id, "Deleted entry was still found in list"
        print("List verification: SUCCESS (deleted entry not in list)")
    else:
        print(f"Get History List post-delete: FAILED ({r.status_code}) - {r.text}")
        sys.exit(1)

    print("All AI Essay Grader integration tests finished successfully!")

if __name__ == "__main__":
    run_essay_grader_tests()
