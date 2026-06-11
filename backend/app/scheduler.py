import asyncio
from sqlalchemy.orm import Session
from .database import SessionLocal
from . import models
from .email import send_exam_reminder_email_sync
from .routers.exams import calculate_days_remaining

async def exam_reminder_scheduler():
    # Delay starting the scheduler check for 10 seconds after server startup
    await asyncio.sleep(10)
    while True:
        try:
            print("[EXAM SCHEDULER] Running upcoming exam checks...")
            db: Session = SessionLocal()
            try:
                # Find all exams that have not had reminders sent
                exams = db.query(models.ExamDeadline).filter(models.ExamDeadline.reminder_sent == False).all()
                print(f"[EXAM SCHEDULER] Found {len(exams)} exams to check.")
                
                for exam in exams:
                    days_left = calculate_days_remaining(exam.raw_date or exam.date)
                    # "Near" is defined as 3 days or less, and must be > 0 (not in the past)
                    if 0 < days_left <= 3:
                        user = exam.owner
                        if user and user.email:
                            print(f"[EXAM SCHEDULER] Sending reminder for exam '{exam.title}' to {user.email} (days left: {days_left})")
                            send_exam_reminder_email_sync(
                                user_email=user.email,
                                user_name=user.name,
                                exam_title=exam.title,
                                exam_date=exam.date,
                                days_remaining=days_left
                            )
                            exam.reminder_sent = True
                
                # Spaced Recall Reminders check
                from sqlalchemy.orm.attributes import flag_modified
                from datetime import datetime
                from .time_utils import now_ph, PH_TIMEZONE
                from .email import send_spaced_recall_email_sync
                
                users = db.query(models.User).filter(models.User.spaced_recall != None).all()
                print(f"[EXAM SCHEDULER] Checking spaced recall for {len(users)} users...")
                for user in users:
                    if not user.spaced_recall:
                        continue
                    
                    recall_list = list(user.spaced_recall)
                    modified = False
                    for item in recall_list:
                        due_at_str = item.get("due_at")
                        if not due_at_str or item.get("reminder_sent", False):
                            continue
                        
                        try:
                            due_at = datetime.fromisoformat(due_at_str)
                            if due_at.tzinfo is None or due_at.tzinfo.utcoffset(due_at) is None:
                                due_at = due_at.replace(tzinfo=PH_TIMEZONE)
                            now = now_ph()
                            # Due now or in the next 24 hours
                            if due_at <= now or (due_at - now).total_seconds() <= 86400:
                                print(f"[EXAM SCHEDULER] Sending spaced recall reminder for '{item.get('name')}' to {user.email}")
                                send_spaced_recall_email_sync(
                                    user_email=user.email,
                                    user_name=user.name,
                                    module_name=item.get("name"),
                                    subject_name=item.get("subject", "General Study"),
                                    progress=item.get("progress", 20)
                                )
                                item["reminder_sent"] = True
                                modified = True
                        except Exception as ex:
                            print(f"[EXAM SCHEDULER ERROR] Error processing spaced recall item: {ex}")
                            
                    if modified:
                        user.spaced_recall = recall_list
                        flag_modified(user, "spaced_recall")
                 
                db.commit()
            except Exception as e:
                print(f"[EXAM SCHEDULER ERROR] Error checking exams/recalls: {e}")
            finally:
                db.close()
        except Exception as e:
            print(f"[EXAM SCHEDULER ERROR] Scheduler cycle failed: {e}")
            
        # Check every 6 hours (21600 seconds)
        await asyncio.sleep(21600)
