import secrets
import smtplib
import traceback
import requests
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import BackgroundTasks
from .config import settings

SMTP_TIMEOUT_SECONDS = 10
BREVO_TIMEOUT_SECONDS = 10
BREVO_SEND_URL = "https://api.brevo.com/v3/smtp/email"


def _send_smtp_email(user_email: str, subject: str, html_content: str, log_label: str):
    msg = MIMEMultipart("alternative")
    msg["Subject"] = subject
    msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
    msg["To"] = user_email
    msg.attach(MIMEText(html_content, "html"))

    print(
        f"[SMTP MAIL SENDER] Sending {log_label} to {user_email} "
        f"via {settings.SMTP_HOST}:{settings.SMTP_PORT} "
        f"from {settings.MAIL_FROM}; console_email={settings.USE_CONSOLE_EMAIL}"
    )

    try:
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT, timeout=SMTP_TIMEOUT_SECONDS) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.MAIL_FROM, [user_email], msg.as_string())
        print(f"[SMTP MAIL SENDER] {log_label} successfully sent to {user_email}")
    except Exception as e:
        print(f"[SMTP ERROR] Failed to send {log_label} to {user_email}")
        print(f"[SMTP ERROR] {type(e).__name__}: {e}")
        print(traceback.format_exc())


def _send_brevo_email(user_email: str, subject: str, html_content: str, log_label: str):
    print(
        f"[BREVO MAIL SENDER] Sending {log_label} to {user_email} "
        f"from {settings.MAIL_FROM}; console_email={settings.USE_CONSOLE_EMAIL}"
    )

    payload = {
        "sender": {
            "name": settings.MAIL_FROM_NAME,
            "email": settings.MAIL_FROM,
        },
        "to": [{"email": user_email}],
        "subject": subject,
        "htmlContent": html_content,
    }
    headers = {
        "api-key": settings.BREVO_API_KEY,
        "content-type": "application/json",
    }

    try:
        response = requests.post(
            BREVO_SEND_URL,
            json=payload,
            headers=headers,
            timeout=BREVO_TIMEOUT_SECONDS,
        )
        if response.status_code >= 400:
            print(f"[BREVO ERROR] Failed to send {log_label} to {user_email}")
            print(f"[BREVO ERROR] HTTP {response.status_code}: {response.text}")
            return
        print(f"[BREVO MAIL SENDER] {log_label} successfully sent to {user_email}")
    except Exception as e:
        print(f"[BREVO ERROR] Failed to send {log_label} to {user_email}")
        print(f"[BREVO ERROR] {type(e).__name__}: {e}")
        print(traceback.format_exc())


def _has_email_provider() -> bool:
    return bool(settings.BREVO_API_KEY or settings.SMTP_HOST)


def _send_email(user_email: str, subject: str, html_content: str, log_label: str):
    if settings.BREVO_API_KEY:
        _send_brevo_email(user_email, subject, html_content, log_label)
        return
    _send_smtp_email(user_email, subject, html_content, log_label)

def send_welcome_email_sync(user_email: str, user_name: str):
    subject = "Welcome to Lumio!"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Welcome, {user_name}!</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">We're thrilled to have you join our active study community. Lumio is built to simplify your learning process and make study groups exciting and efficient.</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 15px;">Here is how you can jump right in:</p>
          <ul style="color: #334155; font-size: 1rem; padding-left: 20px; margin-bottom: 25px;">
            <li style="margin-bottom: 8px;"><strong>Upload Study Materials</strong>: Import lecture slides or documents to generate custom quizzes instantly.</li>
            <li style="margin-bottom: 8px;"><strong>Live Study Circles</strong>: Take group quizzes with interactive live scoreboard updates.</li>
            <li style="margin-bottom: 8px;"><strong>Countdown Calendars</strong>: Stay on top of exam priorities and progress tracking.</li>
          </ul>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background-color: #3ECF8E; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 12px rgba(62,207,142,0.25);">Go to Dashboard</a>
          </div>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">If you have any questions or need help, just reply to this email.</p>
          <p style="color: #334155; font-size: 0.95rem; font-weight: bold; margin-top: 15px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Welcome Email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Subject: {subject}")
        print(f"Body:\n{html_content}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Welcome email")

def generate_verification_code() -> str:
    return f"{secrets.randbelow(1000000):06d}"

def send_verification_email_sync(user_email: str, user_name: str, code: str):
    subject = "Verify your Lumio account"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Hi {user_name}!</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Thanks for signing up. Please use the code below to verify your email address:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 2.5rem; font-weight: 800; letter-spacing: 8px; color: #3ECF8E; background-color: #f0fdf4; padding: 20px 30px; border-radius: 12px; display: inline-block; border: 2px dashed #3ECF8E;">{code}</div>
          </div>
          <p style="color: #64748b; font-size: 0.9rem;">This code expires in 10 minutes. If you didn't create an account, you can ignore this email.</p>
          <p style="color: #334155; font-size: 0.95rem; font-weight: bold; margin-top: 25px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Verification Email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Verification Code: {code}")
        print(f"Subject: {subject}")
        print(f"Body:\n{html_content}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Verification email")

def send_verification_email(background_tasks: BackgroundTasks, user_email: str, user_name: str, code: str):
    send_verification_email_sync(user_email, user_name, code)

def send_reset_code_email_sync(user_email: str, user_name: str, code: str):
    subject = "Reset your Lumio password"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Hi {user_name}!</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">We received a request to reset your password. Use the code below:</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 2.5rem; font-weight: 800; letter-spacing: 8px; color: #3ECF8E; background-color: #f0fdf4; padding: 20px 30px; border-radius: 12px; display: inline-block; border: 2px dashed #3ECF8E;">{code}</div>
          </div>
          <p style="color: #64748b; font-size: 0.9rem;">If you didn't request this, you can ignore this email.</p>
          <p style="color: #334155; font-size: 0.95rem; font-weight: bold; margin-top: 25px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """
    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Reset code for {user_email}: {code}")
        print("="*80 + "\n")
        return
    _send_email(user_email, subject, html_content, "Reset code email")

def send_reset_code_email(background_tasks: BackgroundTasks, user_email: str, user_name: str, code: str):
    send_reset_code_email_sync(user_email, user_name, code)

def send_welcome_email(background_tasks: BackgroundTasks, user_email: str, user_name: str):
    background_tasks.add_task(send_welcome_email_sync, user_email, user_name)

def send_group_invite_email_sync(user_email: str, user_name: str, inviter_name: str, group_name: str):
    subject = f"You've been invited to join {group_name} on Lumio"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Study Group Invitation</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Hi {user_name},</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;"><strong>{inviter_name}</strong> has invited you to join their collaborative circle <strong>"{group_name}"</strong> on Lumio!</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">In study circles, you can share study modules, launch practice quizzes together, and review leaderboard rankings in real-time.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background-color: #3ECF8E; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 12px rgba(62,207,142,0.25);">Accept Invitation</a>
          </div>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Group Invite Email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Inviter: {inviter_name}")
        print(f"Group: {group_name}")
        print(f"Subject: {subject}")
        print(f"Body:\n{html_content}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Group invite email")

def send_group_invite_email(background_tasks: BackgroundTasks, user_email: str, user_name: str, inviter_name: str, group_name: str):
    background_tasks.add_task(send_group_invite_email_sync, user_email, user_name, inviter_name, group_name)

def send_exam_reminder_email_sync(user_email: str, user_name: str, exam_title: str, exam_date: str, days_remaining: int):
    subject = f"Exam Reminder: {exam_title} is coming up soon!"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Exam Reminder</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Hi {user_name},</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">This is a quick reminder that your exam <strong>"{exam_title}"</strong> is scheduled for <strong>{exam_date}</strong>.</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 1.8rem; font-weight: 800; color: #e11d48; background-color: #fff1f2; padding: 15px 25px; border-radius: 12px; display: inline-block; border: 2px solid #fda4af;">
              {days_remaining} {'day' if days_remaining == 1 else 'days'} remaining!
            </div>
          </div>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Make sure to review your study modules and practice quizzes in your collaborative study circle to prepare.</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background-color: #3ECF8E; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 12px rgba(62,207,142,0.25);">Start Studying Now</a>
          </div>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Exam Reminder Email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Exam: {exam_title}")
        print(f"Date: {exam_date}")
        print(f"Days left: {days_remaining}")
        print(f"Subject: {subject}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Exam reminder email")


def send_spaced_recall_email_sync(user_email: str, user_name: str, module_name: str, subject_name: str, progress: int):
    subject = f"Lumio Study Room: Time to review {module_name}!"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Spaced Recall Review</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Hi {user_name},</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">It's time to review your study module <strong>"{module_name}"</strong> ({subject_name}) to keep your memory sharp and retain it long-term!</p>
          <div style="text-align: center; margin: 30px 0;">
            <div style="font-size: 1.8rem; font-weight: 800; color: #3ECF8E; background-color: #f0fdf4; padding: 15px 25px; border-radius: 12px; display: inline-block; border: 2px solid #bbf7d0;">
              Recall Strength: {progress}%
            </div>
          </div>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Spaced repetition scheduling helps you lock concepts into your long-term memory. Taking a quick quiz now will boost your recall strength back to 100%!</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background-color: #3ECF8E; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 12px rgba(62,207,142,0.25);">Review Study Module</a>
          </div>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Spaced Recall Email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Module: {module_name}")
        print(f"Recall Strength: {progress}%")
        print(f"Subject: {subject}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Spaced recall email")


def send_pro_status_email_sync(user_email: str, user_name: str, is_pro: bool):
    action = "upgraded to Pro" if is_pro else "downgraded to Standard"
    subject = f"Lumio Account Status: You've been {action}!"
    details_p = (
        "We're writing to let you know that your Lumio account has been upgraded to Premium Pro by the system administrator. "
        "You now have unlimited access to study modules, practice exams, and collaborative tools!"
        if is_pro else
        "We're writing to let you know that your Lumio account role has been set to Standard by the system administrator."
    )
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Role Status Update</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Hi {user_name},</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">{details_p}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background-color: #3ECF8E; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 12px rgba(62,207,142,0.25);">Access Lumio</a>
          </div>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Pro status email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Status: {action}")
        print(f"Subject: {subject}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Pro status email")


def send_admin_status_email_sync(user_email: str, user_name: str, is_admin: bool):
    action = "promoted to Superadmin" if is_admin else "demoted to Standard User"
    subject = f"Lumio Account Status: You've been {action}!"
    details_p = (
        "We're writing to let you know that your Lumio account has been promoted to Superadmin by the system administrator. "
        "You now have access to the administrative dashboard, user management tools, and statistics!"
        if is_admin else
        "We're writing to let you know that your Lumio administrative privileges have been revoked by the system administrator."
    )
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Privileges Update</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Hi {user_name},</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">{details_p}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background-color: #3ECF8E; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 12px rgba(62,207,142,0.25);">Access Lumio</a>
          </div>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Admin status email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Status: {action}")
        print(f"Subject: {subject}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Admin status email")


def send_account_suspension_email_sync(user_email: str, user_name: str, is_suspended: bool):
    action = "suspended" if is_suspended else "re-activated"
    subject = f"Important Alert: Your Lumio account has been {action}!"
    details_p = (
        "We regret to inform you that your Lumio account has been suspended by the administrator due to platform policy violations. "
        "Consequently, you will be unable to log in, share study materials, or access your groups. "
        "If you believe this is a mistake, please contact support."
        if is_suspended else
        "We're pleased to inform you that your Lumio account has been re-activated by the administrator. "
        "You now have full access to your account and study rooms again."
    )
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Account Suspension Update</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Hi {user_name},</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">{details_p}</p>
          <div style="text-align: center; margin: 30px 0;">
            <a href="http://localhost:5173" style="background-color: #3ECF8E; color: #ffffff; padding: 12px 30px; border-radius: 8px; font-weight: bold; text-decoration: none; font-size: 1rem; box-shadow: 0 4px 12px rgba(62,207,142,0.25);">Access Lumio</a>
          </div>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">Happy Learning,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Account suspension email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Status: {action}")
        print(f"Subject: {subject}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Account suspension email")


def send_account_deletion_email_sync(user_email: str, user_name: str):
    subject = "Your Lumio account has been deleted"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #3ECF8E; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">Your AI Collaborative Study Room</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Account Deleted</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Hi {user_name},</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">We are writing to confirm that your Lumio user account has been deleted by the system administrator. All your personal data, uploaded study modules, calendars, and study group memberships have been permanently purged.</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Thank you for studying with us, and we wish you all the best in your academic journey.</p>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">Sincerely,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """

    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Account deletion email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Subject: {subject}")
        print("="*80 + "\n")
        return

    _send_email(user_email, subject, html_content, "Account deletion email")


def send_pro_status_email(background_tasks: BackgroundTasks, user_email: str, user_name: str, is_pro: bool):
    background_tasks.add_task(send_pro_status_email_sync, user_email, user_name, is_pro)


def send_admin_status_email(background_tasks: BackgroundTasks, user_email: str, user_name: str, is_admin: bool):
    background_tasks.add_task(send_admin_status_email_sync, user_email, user_name, is_admin)


def send_account_suspension_email(background_tasks: BackgroundTasks, user_email: str, user_name: str, is_suspended: bool):
    background_tasks.add_task(send_account_suspension_email_sync, user_email, user_name, is_suspended)


def send_account_deletion_email(background_tasks: BackgroundTasks, user_email: str, user_name: str):
    background_tasks.add_task(send_account_deletion_email_sync, user_email, user_name)


def send_gemini_unhealthy_email_sync(admin_email: str, admin_name: str, error_message: str):
    subject = "ALERT: Lumio Gemini API Integration Unhealthy"
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; line-height: 1.6; color: #333; background-color: #f9f9f9; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background-color: #ffffff; padding: 30px; border: 1px solid #e2e8f0; border-radius: 12px; box-shadow: 0 4px 6px -1px rgba(0,0,0,0.05);">
          <div style="text-align: center; margin-bottom: 25px;">
            <h1 style="color: #e11d48; font-size: 2.2rem; margin: 0; font-weight: 800; letter-spacing: -1px;">Lumio Alert</h1>
            <span style="font-size: 0.95rem; color: #64748b; font-weight: 500;">System Administrator Notification</span>
          </div>
          <h2 style="color: #1e293b; font-size: 1.5rem; margin-top: 0; margin-bottom: 15px; border-bottom: 1px solid #f1f5f9; padding-bottom: 10px;">Gemini API Error Detected</h2>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Hi {admin_name},</p>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">During a system health check, the Gemini API integration was detected as <strong>unhealthy</strong>.</p>
          <div style="background-color: #fff1f2; border: 1px solid #fda4af; padding: 15px; border-radius: 8px; margin-bottom: 25px; font-family: monospace; font-size: 0.9rem; color: #9f1239; word-break: break-all;">
            {error_message}
          </div>
          <p style="color: #334155; font-size: 1rem; margin-bottom: 20px;">Please check your Gemini API key configuration and service status as soon as possible.</p>
          <p style="color: #64748b; font-size: 0.85rem; border-top: 1px solid #f1f5f9; padding-top: 15px; margin-top: 25px; margin-bottom: 0;">Automated System Monitor,<br>The Lumio Team</p>
        </div>
      </body>
    </html>
    """
    if settings.USE_CONSOLE_EMAIL or not _has_email_provider():
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Gemini Unhealthy Alert triggered for: {admin_email}")
        print(f"Recipient Name: {admin_name}")
        print(f"Error Message: {error_message}")
        print(f"Subject: {subject}")
        print("="*80 + "\n")
        return

    _send_email(admin_email, subject, html_content, "Gemini unhealthy alert email")


def send_gemini_unhealthy_email(background_tasks: BackgroundTasks, admin_email: str, admin_name: str, error_message: str):
    background_tasks.add_task(send_gemini_unhealthy_email_sync, admin_email, admin_name, error_message)

