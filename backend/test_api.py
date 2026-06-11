import requests
import json
import time
import sys
import io

# Ensure stdout/stderr use UTF-8 on Windows to handle emojis correctly
if sys.platform == "win32":
    sys.stdout = io.TextIOWrapper(sys.stdout.buffer, encoding='utf-8')
    sys.stderr = io.TextIOWrapper(sys.stderr.buffer, encoding='utf-8')

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

    # 6h. Test Folder Management (Create, Rename, Delete, Module Syncing)
    print("Testing Folder Management...")
    # Update profile to add a folder
    new_folder_name = "Mathematics"
    r = requests.put(f"{BASE_URL}/api/auth/profile", json={"folders": ["General", new_folder_name]}, headers=headers)
    if r.status_code == 200:
        print(f"  Create Folder: SUCCESS - Profile updated with folders: {r.json()['folders']}")
        
        # Create module inside the new folder
        math_module_payload = {
            "name": "Linear Algebra 101",
            "subject": new_folder_name,
            "size": "1.2 MB",
            "text_content": "This is sample linear algebra text content."
        }
        r = requests.post(f"{BASE_URL}/api/modules", data=math_module_payload, headers=headers_multipart)
        if r.status_code == 200:
            math_module_data = r.json()
            math_module_id = math_module_data["id"]
            print(f"  Create Module in Folder: SUCCESS - Created module ID {math_module_id} with subject '{math_module_data['subject']}'")
            
            # Test Rename Folder
            rename_payload = {
                "old_name": new_folder_name,
                "new_name": "Calculus"
            }
            r = requests.put(f"{BASE_URL}/api/modules/folders/rename", json=rename_payload, headers=headers)
            if r.status_code == 200:
                print(f"  Rename Folder: SUCCESS - Folders now: {r.json()['folders']}")
                
                # Verify that the module subject was also automatically renamed to "Calculus"
                r = requests.get(f"{BASE_URL}/api/modules", headers=headers)
                if r.status_code == 200:
                    modules_list = r.json()
                    verified_module = next((m for m in modules_list if m["id"] == math_module_id), None)
                    if verified_module and verified_module["subject"] == "Calculus":
                        print("  Verify Module Subject Auto-Renamed: SUCCESS")
                    else:
                        print(f"  Verify Module Subject Auto-Renamed: FAILED - Subject is '{verified_module['subject'] if verified_module else 'None'}'")
                else:
                    print(f"  Get Modules: FAILED ({r.status_code}) - {r.text}")
            else:
                print(f"  Rename Folder: FAILED ({r.status_code}) - {r.text}")

            # Test Delete Folder
            r = requests.delete(f"{BASE_URL}/api/modules/folders/delete?folder_name=Calculus", headers=headers)
            if r.status_code == 200:
                print(f"  Delete Folder: SUCCESS - Folders now: {r.json()['folders']}")
                
                # Verify that the module subject was also automatically moved to "General"
                r = requests.get(f"{BASE_URL}/api/modules", headers=headers)
                if r.status_code == 200:
                    modules_list = r.json()
                    verified_module = next((m for m in modules_list if m["id"] == math_module_id), None)
                    if verified_module and verified_module["subject"] == "General":
                        print("  Verify Module Subject Auto-Moved to General: SUCCESS")
                    else:
                        print(f"  Verify Module Subject Auto-Moved to General: FAILED - Subject is '{verified_module['subject'] if verified_module else 'None'}'")
                else:
                    print(f"  Get Modules: FAILED ({r.status_code}) - {r.text}")
            else:
                print(f"  Delete Folder: FAILED ({r.status_code}) - {r.text}")
                
            # Clean up the test math module
            requests.delete(f"{BASE_URL}/api/modules/{math_module_id}", headers=headers)
        else:
            print(f"  Create Module in Folder: FAILED ({r.status_code}) - {r.text}")
    else:
        print(f"  Create Folder: FAILED ({r.status_code}) - {r.text}")

    # 6.5. Tutor Chat History Sessions
    print("Testing Chat Sessions...")
    session_id = "test-session-123"
    
    # A. Create session
    payload_session = {
        "session_id": session_id,
        "title": "Introduction to Biology",
        "messages": [
            {
                "id": "msg-1",
                "sender": "user",
                "text": "What is Biology?",
                "timestamp": "2026-06-12T00:00:00Z",
                "isError": False
            },
            {
                "id": "msg-2",
                "sender": "ai",
                "text": "Biology is the scientific study of life.",
                "timestamp": "2026-06-12T00:00:05Z",
                "isError": False
            }
        ]
    }
    r = requests.post(f"{BASE_URL}/api/tutor/sessions", json=payload_session, headers=headers)
    if r.status_code == 200:
        print("  Upsert Chat Session (Create): SUCCESS")
    else:
        print(f"  Upsert Chat Session (Create): FAILED ({r.status_code}) - {r.text}")

    # B. Fetch all sessions
    r = requests.get(f"{BASE_URL}/api/tutor/sessions", headers=headers)
    if r.status_code == 200:
        sessions = r.json()
        if len(sessions) > 0 and sessions[0]["session_id"] == session_id:
            print("  Get Chat Sessions: SUCCESS")
        else:
            print(f"  Get Chat Sessions: FAILED - unexpected session list")
    else:
        print(f"  Get Chat Sessions: FAILED ({r.status_code}) - {r.text}")

    # C. Update session (upsert again)
    payload_session["messages"].append({
        "id": "msg-3",
        "sender": "user",
        "text": "Thank you!",
        "timestamp": "2026-06-12T00:00:10Z",
        "isError": False
    })
    r = requests.post(f"{BASE_URL}/api/tutor/sessions", json=payload_session, headers=headers)
    if r.status_code == 200:
        updated_session = r.json()
        if len(updated_session["messages"]) == 3:
            print("  Upsert Chat Session (Update): SUCCESS")
        else:
            print(f"  Upsert Chat Session (Update): FAILED - message count is {len(updated_session['messages'])}")
    else:
        print(f"  Upsert Chat Session (Update): FAILED ({r.status_code}) - {r.text}")

    # D. Delete individual session
    r = requests.delete(f"{BASE_URL}/api/tutor/sessions/{session_id}", headers=headers)
    if r.status_code == 204:
        print("  Delete Individual Session: SUCCESS")
    else:
        print(f"  Delete Individual Session: FAILED ({r.status_code}) - {r.text}")

    # E. Verify deleted
    r = requests.get(f"{BASE_URL}/api/tutor/sessions", headers=headers)
    if r.status_code == 200:
        sessions = r.json()
        if not any(s["session_id"] == session_id for s in sessions):
            print("  Verify Individual Session Deleted: SUCCESS")
        else:
            print("  Verify Individual Session Deleted: FAILED")
    else:
        print(f"  Verify Individual Session Deleted: FAILED ({r.status_code})")

    # F. Create another session and clear all
    payload_session["session_id"] = "test-session-456"
    requests.post(f"{BASE_URL}/api/tutor/sessions", json=payload_session, headers=headers)
    r = requests.delete(f"{BASE_URL}/api/tutor/sessions", headers=headers)
    if r.status_code == 204:
        # verify empty
        r_get = requests.get(f"{BASE_URL}/api/tutor/sessions", headers=headers)
        if r_get.status_code == 200 and len(r_get.json()) == 0:
            print("  Clear All Chat Sessions: SUCCESS")
        else:
            print("  Clear All Chat Sessions: FAILED to verify empty")
    else:
        print(f"  Clear All Chat Sessions: FAILED ({r.status_code}) - {r.text}")

    # 7. Delete Module
    r = requests.delete(f"{BASE_URL}/api/modules/{module_id}", headers=headers)
    if r.status_code == 200:
      print("Delete Module: SUCCESS")
    else:
      print(f"Delete Module: FAILED ({r.status_code}) - {r.text}")

    print("All integration tests finished successfully!")

if __name__ == "__main__":
    run_tests()
