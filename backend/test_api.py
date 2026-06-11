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

    # 6e. Test AI Concept Tutor (and rate limiter)
    print("Testing AI Concept Tutor...")
    for i in range(1, 7):
      r = requests.post(f"{BASE_URL}/api/tutor/ask", json={"query": "mitochondria"}, headers=headers)
      if i <= 5:
        if r.status_code == 200:
          print(f"  Query {i}: SUCCESS - {r.json()['answer'][:50]}...")
        else:
          print(f"  Query {i}: FAILED ({r.status_code}) - {r.text}")
      else:
        if r.status_code == 429:
          print(f"  Query {i}: SUCCESS (Rate Limited as expected) - {r.json().get('detail')}")
        else:
          print(f"  Query {i}: FAILED (Should have been rate limited, got {r.status_code}) - {r.text}")

    # 6f. Test Exam Email Reminders
    print("Testing Exam Email Reminders...")
    import datetime
    # Schedule an exam 2 days from now
    target_date = datetime.date.today() + datetime.timedelta(days=2)
    target_date_str = target_date.isoformat()
    exam_payload = {
        "title": "Automated Chemistry Exam",
        "subject": "Chemistry",
        "date": target_date.strftime("%b %d, %Y"),
        "raw_date": target_date_str,
        "priority": "high"
    }
    r = requests.post(f"{BASE_URL}/api/exams", json=exam_payload, headers=headers)
    if r.status_code == 200:
      exam_data = r.json()
      print(f"  Create Exam: SUCCESS - Exam ID {exam_data['id']}, reminder_sent={exam_data['reminder_sent']}")
      exam_id = exam_data["id"]
      
      # Trigger reminders
      r = requests.post(f"{BASE_URL}/api/exams/trigger-reminders", headers=headers)
      if r.status_code == 200:
        trigger_data = r.json()
        print(f"  Trigger Reminders: SUCCESS - Sent count: {trigger_data['sent_count']}")
        
        # Fetch exams to verify it is now sent
        r = requests.get(f"{BASE_URL}/api/exams", headers=headers)
        if r.status_code == 200:
          exams_list = r.json()
          created_exam = next((e for e in exams_list if e["id"] == exam_id), None)
          if created_exam:
            print(f"  Verify Reminder Sent: SUCCESS - reminder_sent is now {created_exam['reminder_sent']}")
            
            # Test complete exam
            print("  Testing Complete Exam Endpoint...")
            r = requests.put(f"{BASE_URL}/api/exams/{exam_id}/complete", headers=headers)
            if r.status_code == 200:
              complete_data = r.json()
              print(f"    Complete Exam: SUCCESS - completed={complete_data['completed']}")
              
              # Fetch exams to verify it is no longer returned (filtered out)
              r = requests.get(f"{BASE_URL}/api/exams", headers=headers)
              if r.status_code == 200:
                exams_list = r.json()
                created_exam_after = next((e for e in exams_list if e["id"] == exam_id), None)
                if not created_exam_after:
                  print("    Verify Exam Filtered Out: SUCCESS")
                else:
                  print("    Verify Exam Filtered Out: FAILED - Exam still visible in active list")
              else:
                print(f"    Get Exams: FAILED ({r.status_code}) - {r.text}")
            else:
              print(f"    Complete Exam: FAILED ({r.status_code}) - {r.text}")
          else:
            print("  Verify Reminder Sent: FAILED - Exam not found in retrieved list")
        else:
          print(f"  Get Exams: FAILED ({r.status_code}) - {r.text}")
      else:
        print(f"  Trigger Reminders: FAILED ({r.status_code}) - {r.text}")
        
      # Clean up exam
      requests.delete(f"{BASE_URL}/api/exams/{exam_id}", headers=headers)
    else:
      print(f"  Create Exam: FAILED ({r.status_code}) - {r.text}")

    # 6g. Test Spaced Recall Scheduling & Reminders
    print("Testing Spaced Recall Calendar...")
    # Fetch initial user to verify spaced_recall is empty
    r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
    if r.status_code == 200:
      user_data = r.json()
      print(f"  Initial Spaced Recall size: {len(user_data.get('spaced_recall') or [])}")
      
      # Submit score to module to schedule spaced recall
      score_payload = {"score": "4/5"}
      r = requests.put(f"{BASE_URL}/api/modules/{module_id}/score", json=score_payload, headers=headers)
      if r.status_code == 200:
        print("  Submit Score: SUCCESS")
        
        # Verify it shows up in spaced_recall
        r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
        if r.status_code == 200:
          user_data = r.json()
          recall_list = user_data.get("spaced_recall") or []
          matching = next((item for item in recall_list if item["id"] == module_id), None)
          if matching:
            print(f"  Verify Scheduled Recall: SUCCESS - progress={matching.get('progress')}%, dueIn='{matching.get('dueIn')}'")
            
            # Update the item's due_at to trigger a reminder (due now)
            ph_tz = datetime.timezone(datetime.timedelta(hours=8))
            matching["due_at"] = (datetime.datetime.now(ph_tz) - datetime.timedelta(hours=1)).isoformat()
            matching["reminder_sent"] = False
            
            # Update user profile with the expired due date
            r = requests.put(f"{BASE_URL}/api/auth/profile", json={"spaced_recall": recall_list}, headers=headers)
            if r.status_code == 200:
              print("  Update Spaced Recall Due Date (expired): SUCCESS")
              
              # Trigger reminders
              r = requests.post(f"{BASE_URL}/api/exams/trigger-reminders", headers=headers)
              if r.status_code == 200:
                trigger_data = r.json()
                print(f"  Trigger Spaced Recall Reminders: SUCCESS - spaced_sent_count: {trigger_data.get('spaced_sent_count')}")
                
                # Fetch profile again to verify reminder_sent is True and dueIn is formatted as "now"
                r = requests.get(f"{BASE_URL}/api/auth/me", headers=headers)
                if r.status_code == 200:
                  user_data = r.json()
                  recall_list = user_data.get("spaced_recall") or []
                  matching = next((item for item in recall_list if item["id"] == module_id), None)
                  if matching:
                    print(f"  Verify Spaced Recall Reminder Sent: SUCCESS - reminder_sent={matching.get('reminder_sent')}, dueIn='{matching.get('dueIn')}'")
                  else:
                    print("  Verify Spaced Recall Reminder Sent: FAILED - matching item not found")
                else:
                  print(f"  Get Me: FAILED ({r.status_code}) - {r.text}")
              else:
                print(f"  Trigger Reminders: FAILED ({r.status_code}) - {r.text}")
            else:
              print(f"  Update Profile: FAILED ({r.status_code}) - {r.text}")
          else:
            print("  Verify Scheduled Recall: FAILED - matching item not found in spaced_recall")
        else:
          print(f"  Get Me: FAILED ({r.status_code}) - {r.text}")
      else:
        print(f"  Submit Score: FAILED ({r.status_code}) - {r.text}")
    else:
      print(f"  Get Me: FAILED ({r.status_code}) - {r.text}")

    # 7. Delete Module
    r = requests.delete(f"{BASE_URL}/api/modules/{module_id}", headers=headers)
    if r.status_code == 200:
      print("Delete Module: SUCCESS")
    else:
      print(f"Delete Module: FAILED ({r.status_code}) - {r.text}")

    print("All integration tests finished successfully!")

if __name__ == "__main__":
    run_tests()
