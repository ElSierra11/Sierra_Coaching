import os
import smtplib
import logging
from email.mime.text import MIMEText
from email.mime.multipart import MIMEMultipart

logger = logging.getLogger(__name__)

COACH_EMAIL = "alejosierra656@gmail.com"

def is_verifiable_email(email: str) -> bool:
    """Basic format and common domain validation for user emails."""
    if not email or "@" not in email:
        return False
    parts = email.split("@")
    if len(parts) != 2:
        return False
    domain = parts[1].lower()
    # Reject disposable or invalid domains if needed, check basic format
    return "." in domain and len(domain.split(".")[-1]) >= 2

def send_registration_alert_email(user_name: str, user_email: str, user_target: str):
    """Sends an email notification to Coach Alejandro when a new client requests access."""
    verifiable = is_verifiable_email(user_email)
    subject = f"🔔 Nuevo registro en Sierra Coaching: {user_name}"
    
    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #0d0d11; color: #ffffff; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #17171e; border: 2px solid #ff5722; border-radius: 16px; padding: 24px;">
          <h2 style="color: #ff5722; text-transform: uppercase; margin-top: 0;">¡Nuevo cliente solicita acceso!</h2>
          <p style="font-size: 14px; color: #cccccc;">Hola Alejandro, un nuevo cliente se ha registrado en tu aplicación y está esperando tu aprobación de acceso:</p>
          
          <table style="width: 100%; border-collapse: collapse; margin: 20px 0; background: #09090c; border-radius: 8px; overflow: hidden;">
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #ff5722;">Nombre:</td>
              <td style="padding: 12px; color: #ffffff;">{user_name}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #ff5722;">Email:</td>
              <td style="padding: 12px; color: #ffffff;">{user_email} {"✅ (Verificable)" if verifiable else "⚠️ (Revisar)"}</td>
            </tr>
            <tr>
              <td style="padding: 12px; font-weight: bold; color: #ff5722;">Objetivo:</td>
              <td style="padding: 12px; color: #ffffff;">{user_target}</td>
            </tr>
          </table>
          
          <p style="font-size: 13px; color: #aaaaaa;">
            Por favor ingresa a tu panel de administración en la App para revisar y presionar <strong>"Aprobar Acceso"</strong> cuando confirmes su pago o suscripción.
          </p>
          
          <div style="margin-top: 24px; text-align: center;">
            <a href="https://wa.me/573022114190" style="display: inline-block; background: #ff5722; color: #000000; font-weight: bold; padding: 12px 24px; border-radius: 8px; text-decoration: none; text-transform: uppercase;">
              Abrir App / WhatsApp
            </a>
          </div>
        </div>
      </body>
    </html>
    """

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")

    if not smtp_user or not smtp_pass:
        logger.info(f"[EMAIL MOCK ALERT] New Registration: Name={user_name}, Email={user_email}, Target={user_target}. To: {COACH_EMAIL}")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = COACH_EMAIL
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [COACH_EMAIL], msg.as_string())
        logger.info(f"Successfully sent registration alert email to {COACH_EMAIL}")
    except Exception as e:
        logger.error(f"Failed to send registration alert email: {e}")


def send_password_reset_email(user_email: str, user_name: str, reset_token: str):
    """Sends a password reset email to the user with a token link."""
    subject = "🔑 Recupera tu contraseña — Sierra Coaching"
    reset_link = f"https://sierra-coaching.onrender.com?reset_token={reset_token}"

    html_content = f"""
    <html>
      <body style="font-family: Arial, sans-serif; background-color: #0d0d11; color: #ffffff; padding: 20px;">
        <div style="max-width: 600px; margin: 0 auto; background: #17171e; border: 2px solid #ff5722; border-radius: 16px; padding: 24px;">
          <h2 style="color: #ff5722; text-transform: uppercase; margin-top: 0;">Recuperar Contraseña</h2>
          <p style="font-size: 14px; color: #cccccc;">Hola <strong>{user_name}</strong>, recibimos una solicitud para restablecer tu contraseña en Sierra Coaching.</p>
          
          <div style="margin: 24px 0; text-align: center;">
            <a href="{reset_link}" style="display: inline-block; background: #ff5722; color: #000000; font-weight: bold; padding: 14px 28px; border-radius: 8px; text-decoration: none; text-transform: uppercase; font-size: 14px;">
              Restablecer Contraseña
            </a>
          </div>
          
          <p style="font-size: 12px; color: #888888;">
            Este enlace expira en <strong>1 hora</strong>. Si no solicitaste este cambio, ignora este correo — tu cuenta sigue segura.
          </p>
          <hr style="border-color: #333;" />
          <p style="font-size: 11px; color: #555555; text-align: center;">Sierra Coaching App · Coach Alejandro Sierra</p>
        </div>
      </body>
    </html>
    """

    smtp_server = os.getenv("SMTP_SERVER", "smtp.gmail.com")
    smtp_port = int(os.getenv("SMTP_PORT", "587"))
    smtp_user = os.getenv("SMTP_USER", "")
    smtp_pass = os.getenv("SMTP_PASSWORD", "")

    if not smtp_user or not smtp_pass:
        logger.info(f"[EMAIL MOCK RESET] Password reset for {user_email}. Token: {reset_token}")
        return

    try:
        msg = MIMEMultipart("alternative")
        msg["Subject"] = subject
        msg["From"] = smtp_user
        msg["To"] = user_email
        msg.attach(MIMEText(html_content, "html"))

        with smtplib.SMTP(smtp_server, smtp_port, timeout=10) as server:
            server.starttls()
            server.login(smtp_user, smtp_pass)
            server.sendmail(smtp_user, [user_email], msg.as_string())
        logger.info(f"Password reset email sent to {user_email}")
    except Exception as e:
        logger.error(f"Failed to send password reset email: {e}")

