import requests
import json
import time
import sys

BASE_URL = "http://127.0.0.1:8000"

def run_flashcard_tests():
    print("Starting Flashcard integration tests...")

    # 1. Generate unique email for registration
    test_email = f"flash_test_{int(time.time())}@example.com"
    test_password = "password123"
    test_name = "Flashcard Tester"

    # 2. Register
    payload = {
        "email": test_email,
        "password": test_password,
        "name": test_name,
        "school": "Flashcard University"
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

    # 3. Verify user starts as non-premium (Free user, quota = 5)
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    user_data = r.json()
    print(f"Initial role: {user_data.get('role')} (Premium: {user_data.get('is_premium')})")
    assert user_data.get("role") == "user", "Expected role to be 'user'"
    assert user_data.get("is_premium") is False, "Expected is_premium to be False"

    # 4. Generate 5 flashcard decks
    deck_ids = []
    for i in range(1, 6):
        payload_gen = {
            "text": f"This is study text content for concept number {i}. It describes the core aspects of unit {i}.",
            "count": 3,
            "title": f"Test Deck {i}"
        }
        r = requests.post(f"{BASE_URL}/api/flashcards/generate", json=payload_gen, headers=headers)
        if r.status_code == 200:
            deck = r.json()
            deck_ids.append(deck["id"])
            print(f"  Generate {i}/5: SUCCESS - ID {deck['id']}, Cards count: {len(deck['cards'])}")
        else:
            print(f"  Generate {i}/5: FAILED ({r.status_code}) - {r.text}")
            return

    # 5. Expect 6th generation to fail due to daily quota limit
    payload_gen = {
        "text": "This is a 6th note that should fail daily generation quota.",
        "count": 3,
        "title": "Failed Deck 6"
    }
    r = requests.post(f"{BASE_URL}/api/flashcards/generate", json=payload_gen, headers=headers)
    if r.status_code == 429:
        print("  Generate 6/5 (Free limit exceeded): SUCCESS (Got HTTP 429 Rate Limit as expected)")
    else:
        print(f"  Generate 6/5 (Free limit exceeded): FAILED (Expected HTTP 429, got {r.status_code}) - {r.text}")
        return

    # 6. Upgrade user to premium
    r = requests.post(f"{BASE_URL}/api/payments/mock-upgrade", headers=headers)
    if r.status_code == 200:
        print("Upgrade to Premium: SUCCESS")
    else:
        print(f"Upgrade to Premium: FAILED ({r.status_code}) - {r.text}")
        return

    # 7. Check if user is now premium (Pro user, quota = 25)
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    user_data = r.json()
    print(f"Upgraded role: {user_data.get('role')} (Premium: {user_data.get('is_premium')})")
    assert user_data.get("role") == "premium", "Expected role to be 'premium'"
    assert user_data.get("is_premium") is True, "Expected is_premium to be True"

    # 8. Generate 2 more decks (should succeed now that daily quota is 25)
    for i in range(6, 8):
        payload_gen = {
            "text": f"This is study text content for concept number {i}. It describes the core aspects of unit {i}.",
            "count": 3,
            "title": f"Test Deck {i}"
        }
        r = requests.post(f"{BASE_URL}/api/flashcards/generate", json=payload_gen, headers=headers)
        if r.status_code == 200:
            deck = r.json()
            deck_ids.append(deck["id"])
            print(f"  Generate {i}/25 (Pro): SUCCESS - ID {deck['id']}, Cards count: {len(deck['cards'])}")
        else:
            print(f"  Generate {i}/25 (Pro): FAILED ({r.status_code}) - {r.text}")
            return

    # 9. Test GET /api/flashcards (list history)
    r = requests.get(f"{BASE_URL}/api/flashcards", headers=headers)
    if r.status_code == 200:
        history = r.json()
        print(f"List History: SUCCESS - Retrieved {len(history)} decks (Expected 7)")
        assert len(history) == 7, f"Expected 7 decks in history, got {len(history)}"
    else:
        print(f"List History: FAILED ({r.status_code}) - {r.text}")
        return

    # 10. Test GET /api/flashcards/{deck_id}
    test_deck_id = deck_ids[0]
    r = requests.get(f"{BASE_URL}/api/flashcards/{test_deck_id}", headers=headers)
    if r.status_code == 200:
        deck = r.json()
        print(f"Get Single Deck {test_deck_id}: SUCCESS - title: '{deck['title']}'")
        assert deck["id"] == test_deck_id, "Returned deck ID mismatch"
    else:
        print(f"Get Single Deck: FAILED ({r.status_code}) - {r.text}")
        return

    # 11. Test DELETE /api/flashcards/{deck_id}
    r = requests.delete(f"{BASE_URL}/api/flashcards/{test_deck_id}", headers=headers)
    if r.status_code == 200:
        print(f"Delete Deck {test_deck_id}: SUCCESS")
    else:
        print(f"Delete Deck: FAILED ({r.status_code}) - {r.text}")
        return

    # 12. Verify deleted deck is no longer in history list
    r = requests.get(f"{BASE_URL}/api/flashcards", headers=headers)
    if r.status_code == 200:
        history = r.json()
        print(f"List History post-deletion: SUCCESS - Retrieved {len(history)} decks (Expected 6)")
        assert len(history) == 6, f"Expected 6 decks, got {len(history)}"
        assert not any(deck["id"] == test_deck_id for deck in history), "Deleted deck should not be in history list"
    else:
        print(f"List History post-deletion: FAILED ({r.status_code}) - {r.text}")
        return

    # 13. Verify GET /api/flashcards/{deck_id} returns 404 for deleted deck
    r = requests.get(f"{BASE_URL}/api/flashcards/{test_deck_id}", headers=headers)
    if r.status_code == 404:
        print("Get Deleted Deck: SUCCESS (Got 404 as expected)")
    else:
        print(f"Get Deleted Deck: FAILED (Expected 404, got {r.status_code}) - {r.text}")
        return

    print("All Flashcard integration tests finished successfully!")

if __name__ == "__main__":
    run_flashcard_tests()
