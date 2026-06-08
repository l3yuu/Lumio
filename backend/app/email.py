import secrets
import smtplib
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart
from fastapi import BackgroundTasks
from .config import settings

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

    if settings.USE_CONSOLE_EMAIL or not settings.SMTP_HOST:
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Welcome Email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Subject: {subject}")
        print(f"Body:\n{html_content}")
        print("="*80 + "\n")
        return

    # Real SMTP email sending
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"] = user_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.MAIL_FROM, [user_email], msg.as_string())
        print(f"[SMTP MAIL SENDER] Welcome email successfully sent to {user_email}")
    except Exception as e:
        print(f"[SMTP MAIL SENDER] Failed to send SMTP email to {user_email}: {e}")

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

    if settings.USE_CONSOLE_EMAIL or not settings.SMTP_HOST:
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Verification Email triggered for: {user_email}")
        print(f"Recipient Name: {user_name}")
        print(f"Verification Code: {code}")
        print(f"Subject: {subject}")
        print(f"Body:\n{html_content}")
        print("="*80 + "\n")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"] = user_email

        part = MIMEText(html_content, "html")
        msg.attach(part)

        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.MAIL_FROM, [user_email], msg.as_string())
        print(f"[SMTP MAIL SENDER] Verification email successfully sent to {user_email}")
    except Exception as e:
        print(f"[SMTP MAIL SENDER] Failed to send verification email to {user_email}: {e}")

def send_verification_email(background_tasks: BackgroundTasks, user_email: str, user_name: str, code: str):
    background_tasks.add_task(send_verification_email_sync, user_email, user_name, code)

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
    if settings.USE_CONSOLE_EMAIL or not settings.SMTP_HOST:
        print("\n" + "="*80)
        print(f"[CONSOLE MAIL SENDER] Reset code for {user_email}: {code}")
        print("="*80 + "\n")
        return
    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = f"{settings.MAIL_FROM_NAME} <{settings.MAIL_FROM}>"
        msg["To"] = user_email
        part = MIMEText(html_content, "html")
        msg.attach(part)
        with smtplib.SMTP(settings.SMTP_HOST, settings.SMTP_PORT) as server:
            server.starttls()
            if settings.SMTP_USER and settings.SMTP_PASSWORD:
                server.login(settings.SMTP_USER, settings.SMTP_PASSWORD)
            server.sendmail(settings.MAIL_FROM, [user_email], msg.as_string())
        print(f"[SMTP MAIL SENDER] Reset code sent to {user_email}")
    except Exception as e:
        print(f"[SMTP MAIL SENDER] Failed to send reset code to {user_email}: {e}")

def send_reset_code_email(background_tasks: BackgroundTasks, user_email: str, user_name: str, code: str):
    background_tasks.add_task(send_reset_code_email_sync, user_email, user_name, code)

def send_welcome_email(background_tasks: BackgroundTasks, user_email: str, user_name: str):
    background_tasks.add_task(send_welcome_email_sync, user_email, user_name)
