import datetime
import os
import json
import secrets
import urllib.request
from fastapi import FastAPI, Depends, HTTPException, status, Header, BackgroundTasks
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import jwt, JWTError

from database import engine, Base, get_db, SessionLocal
import models
import schemas
import bcrypt
from email_service import send_registration_alert_email, send_password_reset_email

# Create database tables
Base.metadata.create_all(bind=engine)

app = FastAPI(title="Sierra Coaching API", version="1.0")

# CORS: In production set ALLOWED_ORIGINS env var (comma-separated list of URLs)
# Example: https://sierra-coaching.vercel.app,https://tu-dominio.com
_cors_env = os.environ.get("ALLOWED_ORIGINS", "")
origins = [o.strip() for o in _cors_env.split(",") if o.strip()] or ["*"]

app.add_middleware(
    CORSMiddleware,
    allow_origins=origins,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

@app.get("/")
@app.get("/api/health")
def health_check():
    return {"status": "ok", "service": "Sierra Coaching API", "timestamp": datetime.datetime.now().isoformat()}

# Password hashing configuration using bcrypt directly
def get_password_hash(password: str) -> str:
    pwd_bytes = password.encode('utf-8')
    salt = bcrypt.gensalt()
    return bcrypt.hashpw(pwd_bytes, salt).decode('utf-8')

def verify_password(plain_password: str, hashed_password: str) -> bool:
    try:
        return bcrypt.checkpw(plain_password.encode('utf-8'), hashed_password.encode('utf-8'))
    except Exception:
        return False


# JWT Configuration
SECRET_KEY = os.environ.get("JWT_SECRET", "sierra_coaching_super_secret_key_change_me_in_prod")
ALGORITHM = "HS256"
ACCESS_TOKEN_EXPIRE_DAYS = 30

def create_access_token(data: dict) -> str:
    to_encode = data.copy()
    expire = datetime.datetime.utcnow() + datetime.timedelta(days=ACCESS_TOKEN_EXPIRE_DAYS)
    to_encode.update({"exp": expire})
    return jwt.encode(to_encode, SECRET_KEY, algorithm=ALGORITHM)

def get_token_user_id(token: str) -> Optional[int]:
    try:
        payload = jwt.decode(token, SECRET_KEY, algorithms=[ALGORITHM])
        user_id = payload.get("user_id")
        return int(user_id) if user_id else None
    except JWTError:
        return None

# Security dependencies
def get_current_user(authorization: Optional[str] = Header(None), db: Session = Depends(get_db)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="No autorizado: Falta token de autenticación"
        )
    token = authorization.split(" ")[1]
    user_id = get_token_user_id(token)
    if not user_id:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Token inválido o expirado"
        )
    user = db.query(models.User).filter(models.User.id == user_id).first()
    if not user:
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Usuario no encontrado"
        )
    return user

def get_current_coach(current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach":
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: Se requiere rol de entrenador"
        )
    return current_user



# --- DB Seeding function ---
def seed_data(db: Session):
    # Check if coach already exists
    coach = db.query(models.User).filter(models.User.email == "alejosierra656@gmail.com").first()
    if not coach:
        # Create Coach
        hashed_pw = get_password_hash("Alejandro10@")
        coach = models.User(
            name="Alejandro Sierra Rincones",
            email="alejosierra656@gmail.com",
            hashed_password=hashed_pw,
            role="coach",
            is_approved=True
        )
        db.add(coach)
        db.commit()
        db.refresh(coach)
    else:
        if not coach.is_approved:
            coach.is_approved = True
            db.commit()

    challenge = db.query(models.SystemSetting).filter(models.SystemSetting.key == "weekly_challenge").first()
    if not challenge:
        db.add(models.SystemSetting(key="weekly_challenge", value="¡Esta semana prohibido fallar un solo día de cardio y 3L de agua diarios! 🔥"))
        db.commit()

    # Check if client Denilson exists
    client = db.query(models.User).filter(models.User.email == "denilson@gym.com").first()
    if not client:
        hashed_client_pw = get_password_hash("client123")
        client = models.User(
            name="Denilson Rincones",
            email="denilson@gym.com",
            hashed_password=hashed_client_pw,
            role="client",
            coach_id=coach.id,
            is_approved=True
        )
        db.add(client)
        db.commit()
        db.refresh(client)

        # Create Denilson's profile
        profile = models.ClientProfile(
            user_id=client.id,
            height=1.67,
            initial_weight=83.0,
            target="Tonificar y reducir porcentaje de grasa corporal",
            joined_date="2026-06-01",
            profile_pic=""
        )
        db.add(profile)

        # Create Denilson's diet (Days 1 to 7)
        diet_data = [
            ("3 huevos + 3 claras, 50g de avena, Fruta: 1 banana", "180g pechuga de pollo, 1 taza arroz blanco, Ensalada de zanahoria, tomate, lechuga y cebolla", "180g salmón o atún, Brócoli, 150g taza papa cocida", "Yogur griego natural + fresas"),
            ("2 huevos + 3 claras, 2 arepas integrales pequeñas, 1/4 aguacate", "170g carne magra, 250g taza papa cocida, Ensalada + aguacate pequeño", "180g pollo, Espinaca salteada, 1/2 taza arroz", "Yogur griego + nueces (pequeña porción)"),
            ("3 huevos revueltos, 2 rebanadas pan integral, Té/Café sin azúcar", "180g pescado blanco, 1 taza quinoa, Ensalada verde mixta", "180g pechuga de pavo, Verduras al vapor, 150g camote", "Batido de proteína + 1 manzana"),
            ("Omelette 3 huevos y espinaca, 1/2 taza avena con agua", "180g pollo a la plancha, 1 taza arroz integral, Ensalada fresca", "170g carne magra, Coliflor y zanahoria, 1/2 plátano cocido", "Frutos secos (30g) + Té verde"),
            ("3 huevos, 1 tortilla integral, 1/4 aguacate", "180g pechuga de pollo, 150g yuca cocida, Ensalada de pepino y tomate", "180g atún al agua, Ensalada grande con aceite de oliva", "Yogur griego + 1/2 taza arándanos"),
            ("Panqueques de avena y clara (3), 1 cucharada mantequilla maní", "180g carne vacuna magra, 1 taza arroz, Ensalada mixta", "180g pollo, Brócoli y salteado de verduras", "Batido de proteína en agua"),
            ("3 huevos cocidos, 2 tostadas integrales, Fruta fresca", "180g pescado, 200g papa al horno, Ensalada verde", "180g pechuga de pollo, Ensalada verde grande", "1 banana + 10 almendras")
        ]

        for idx, (des, alm, cen, mer) in enumerate(diet_data, start=1):
            db.add(models.DietMeal(
                user_id=client.id,
                day_number=idx,
                desayuno=des,
                almuerzo=alm,
                cena=cen,
                merienda=mer
            ))

        # Create Routine Exercises & Routine Days
        exercises_list = [
            ("Press inclinado con mancuernas", "Pecho", "4 series x 10-12 repeticiones. Mantener control en el descenso."),
            ("Press inclinado en máquina", "Pecho", "3 series x 10 repeticiones. Enfocarse en la contracción peak."),
            ("Cruce de poleas bajas", "Pecho", "4 series x 12-15 repeticiones."),
            ("Pec Deck / Aperturas en máquina", "Pecho", "3 series x 12 repeticiones."),
            ("Fondos en paralelas con peso", "Pecho / Tríceps", "3 series al fallo."),
            ("Jalón al pecho agarre neutro", "Espalda", "4 series x 10 repeticiones. Deprimir escápulas."),
            ("Remo con barra T", "Espalda", "4 series x 8-10 repeticiones. Mantener torso a 45 grados."),
            ("Remo unilateral con mancuerna", "Espalda", "3 series x 12 repeticiones por lado."),
            ("Pullover en polea alta con cuerda", "Espalda", "3 series x 15 repeticiones."),
            ("Sentadilla libre con barra", "Pierna", "4 series x 8 repeticiones. Romper el paralelo."),
            ("Prensa de piernas 45°", "Pierna", "4 series x 10-12 repeticiones. Pies a ancho de hombros."),
            ("Extensión de cuádriceps", "Pierna", "3 series x 15 repeticiones con pausa de 1 seg arriba."),
            ("Curl femoral sentado", "Pierna", "4 series x 12 repeticiones."),
            ("Zancadas caminando con mancuernas", "Pierna", "3 series x 12 pasos por pierna."),
            ("Elevación de talones en máquina de pie", "Pantorrilla", "4 series x 15-20 repeticiones."),
            ("Press militar con mancuernas", "Hombro", "4 series x 10 repeticiones."),
            ("Elevaciones laterales con polea baja", "Hombro", "4 series x 12-15 repeticiones por lado."),
            ("Pájaro en máquina (Deltoides posterior)", "Hombro", "4 series x 15 repeticiones."),
            ("Curl de bíceps con barra Z en banco Scott", "Bíceps", "3 series x 10 repeticiones."),
            ("Curl martillo con cuerda en polea", "Bíceps", "3 series x 12 repeticiones."),
            ("Extensión de tríceps en polea alta con cuerda", "Tríceps", "4 series x 12 repeticiones."),
            ("Press francés con barra Z en banco plano", "Tríceps", "3 series x 10 repeticiones.")
        ]

        exercise_map = {}
        for name, category, notes in exercises_list:
            ex = models.Exercise(name=name, category=category, default_notes=notes)
            db.add(ex)
            db.flush()
            exercise_map[name] = ex.id

        routine_plan = {
            "Lunes": [
                ("Press inclinado con mancuernas", 4, "10-12"),
                ("Press inclinado en máquina", 3, "10"),
                ("Cruce de poleas bajas", 4, "12-15"),
                ("Extensión de tríceps en polea alta con cuerda", 4, "12"),
                ("Press francés con barra Z en banco plano", 3, "10")
            ],
            "Martes": [
                ("Jalón al pecho agarre neutro", 4, "10"),
                ("Remo con barra T", 4, "8-10"),
                ("Remo unilateral con mancuerna", 3, "12"),
                ("Curl de bíceps con barra Z en banco Scott", 3, "10"),
                ("Curl martillo con cuerda en polea", 3, "12")
            ],
            "Miercoles": [
                ("Sentadilla libre con barra", 4, "8"),
                ("Prensa de piernas 45°", 4, "10-12"),
                ("Extensión de cuádriceps", 3, "15"),
                ("Curl femoral sentado", 4, "12"),
                ("Elevación de talones en máquina de pie", 4, "15-20")
            ],
            "Jueves": [
                ("Press militar con mancuernas", 4, "10"),
                ("Elevaciones laterales con polea baja", 4, "12-15"),
                ("Pájaro en máquina (Deltoides posterior)", 4, "15"),
                ("Fondos en paralelas con peso", 3, "Fallo")
            ],
            "Viernes": [
                ("Pec Deck / Aperturas en máquina", 3, "12"),
                ("Pullover en polea alta con cuerda", 3, "15"),
                ("Zancadas caminando con mancuernas", 3, "12 por pierna"),
                ("Curl martillo con cuerda en polea", 3, "12")
            ]
        }

        for day_name, ex_items in routine_plan.items():
            rday = models.RoutineDay(user_id=client.id, day_name=day_name, routine_name=f"Rutina de {day_name}")
            db.add(rday)
            db.flush()

            for order, (ex_name, sets, reps) in enumerate(ex_items, start=1):
                ex_id = exercise_map[ex_name]
                db.add(models.RoutineExercise(
                    routine_day_id=rday.id,
                    exercise_id=ex_id,
                    order_index=order,
                    target_sets=sets,
                    target_reps=reps
                ))

        # Seed initial weight log
        weight_logs_data = [
            ("2026-06-01", 83.0),
            ("2026-06-08", 82.2),
            ("2026-06-15", 81.5),
            ("2026-06-22", 80.8),
            ("2026-06-29", 80.1),
            ("2026-07-06", 79.4)
        ]
        for date_str, w_val in weight_logs_data:
            db.add(models.WeightLog(user_id=client.id, date=date_str, weight=w_val))

        # Seed measurement logs
        measurements = [
            ("2026-06-01", 94.0, 105.0, 62.0),
            ("2026-06-15", 92.0, 104.0, 61.0),
            ("2026-06-22", 90.5, 103, 60),
            ("2026-07-06", 88.0, 101.5, 59.2)
        ]
        for dt, ws, hp, th in measurements:
            db.add(models.MeasurementLog(user_id=client.id, date=dt, waist=ws, hip=hp, thigh=th))

        # Seed habits for today
        db.add(models.DailyHabitLog(
            user_id=client.id,
            date=datetime.date.today().strftime("%Y-%m-%d"),
            water_cups=6,
            sleep_hours=7.5,
            cardio_done=True,
            alcohol_avoided=True
        ))

        # Seed lift logs for e1 and e2
        e1_id = exercise_map["Press inclinado con mancuernas"]
        e2_id = exercise_map["Press inclinado en máquina"]

        # Week 1
        for s_idx, reps, wt in [(1, 10, 20), (2, 10, 20), (3, 9, 20), (4, 8, 20)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e1_id, week_number=1, date="2026-06-08", set_number=s_idx, weight=wt, reps=reps))
        for s_idx, reps, wt in [(1, 10, 30), (2, 9, 35), (3, 8, 35)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e2_id, week_number=1, date="2026-06-08", set_number=s_idx, weight=wt, reps=reps))

        # Week 2
        for s_idx, reps, wt in [(1, 10, 22), (2, 10, 22), (3, 10, 22), (4, 10, 22)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e1_id, week_number=2, date="2026-06-15", set_number=s_idx, weight=wt, reps=reps))
        for s_idx, reps, wt in [(1, 10, 35), (2, 10, 35), (3, 9, 35)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e2_id, week_number=2, date="2026-06-15", set_number=s_idx, weight=wt, reps=reps))

        # Week 3
        for s_idx, reps, wt in [(1, 8, 24), (2, 8, 24), (3, 7, 24), (4, 6, 24)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e1_id, week_number=3, date="2026-06-22", set_number=s_idx, weight=wt, reps=reps))

        db.commit()
    else:
        if not client.is_approved:
            client.is_approved = True
            db.commit()
        # Ensure profile exists for existing user to avoid NoneType errors
        profile = db.query(models.ClientProfile).filter(models.ClientProfile.user_id == client.id).first()
        if not profile:
            profile = models.ClientProfile(
                user_id=client.id,
                height=1.67,
                initial_weight=83.0,
                target="Tonificar y reducir porcentaje de grasa corporal",
                joined_date="2026-06-01",
                profile_pic=""
            )
            db.add(profile)
            db.commit()


from migrate_db_v2 import migrate as run_migrations

# Run seeding on startup
@app.on_event("startup")
def startup_event():
    try:
        run_migrations()
    except Exception as e:
        print(f"Error running database migrations: {e}")
        
    db = SessionLocal()
    try:
        seed_data(db)
    finally:
        db.close()


# --- ENDPOINTS ---

@app.post("/api/auth/login", response_model=schemas.LoginResponse)
def login(payload: schemas.UserLogin, db: Session = Depends(get_db)):
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if not user or not verify_password(payload.password, user.hashed_password):
        raise HTTPException(
            status_code=status.HTTP_401_UNAUTHORIZED,
            detail="Correo o contraseña incorrectos"
        )
    token = create_access_token({"user_id": user.id, "email": user.email, "role": user.role})
    return {"token": token, "user": user}


@app.get("/api/auth/me", response_model=schemas.UserResponse)
def get_current_user_info(current_user: models.User = Depends(get_current_user)):
    return current_user


@app.post("/api/auth/register", response_model=schemas.LoginResponse)
def register(payload: schemas.UserRegister, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    # Check if user already exists
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        if not user.is_approved:
            token = create_access_token({"user_id": user.id, "email": user.email, "role": user.role})
            return {"token": token, "user": user}
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo ya está registrado y activo. Inicia sesión con tu contraseña."
        )

    # Validate password strength
    if len(payload.password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres.")
    if not any(c.isdigit() for c in payload.password):
        raise HTTPException(status_code=400, detail="La contraseña debe contener al menos un número.")

    # Find coach to link to
    coach = db.query(models.User).filter(models.User.role == "coach").first()
    coach_id = coach.id if coach else None

    # Create User (clients require coach approval by default)
    hashed_pw = get_password_hash(payload.password)
    new_user = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=hashed_pw,
        role="client",
        coach_id=coach_id,
        is_approved=False
    )
    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    # Create Profile
    new_profile = models.ClientProfile(
        user_id=new_user.id,
        height=payload.height,
        initial_weight=payload.initial_weight,
        target=payload.target,
        joined_date=datetime.date.today().strftime("%Y-%m-%d"),
        profile_pic=""
    )
    db.add(new_profile)

    # Create default diet meals (Days 1 to 7)
    for day in range(1, 8):
        db.add(models.DietMeal(
            user_id=new_user.id,
            day_number=day,
            desayuno="Desayuno por asignar",
            almuerzo="Almuerzo por asignar",
            cena="Cena por asignar",
            merienda="Merienda por asignar"
        ))

    # Create default routine days (Lunes-Viernes)
    routine_days = ["Lunes", "Martes", "Miercoles", "Jueves", "Viernes"]
    for day in routine_days:
        db.add(models.RoutineDay(
            user_id=new_user.id,
            day_name=day,
            routine_name="Sin rutina asignada"
        ))

    # Add initial weight log
    db.add(models.WeightLog(
        user_id=new_user.id,
        date=datetime.date.today().strftime("%Y-%m-%d"),
        weight=payload.initial_weight
    ))

    # Generate internal notification for Coach
    if coach:
        notif = models.Notification(
            user_id=coach.id,
            title="🔔 Solicitud de Registro",
            message=f"{new_user.name} ({new_user.email}) ha solicitado acceso. Revisa la pestaña 'Pendientes' para aprobar su cuenta.",
            created_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
            is_read=False
        )
        db.add(notif)

    db.commit()

    # Trigger email alert to Coach
    background_tasks.add_task(send_registration_alert_email, new_user.name, new_user.email, payload.target)

    token = create_access_token({"user_id": new_user.id, "email": new_user.email, "role": new_user.role})
    return {"token": token, "user": new_user}


# --- Coach Approval Endpoints ---

@app.post("/api/auth/forgot-password")
def forgot_password(payload: schemas.ForgotPasswordRequest, background_tasks: BackgroundTasks, db: Session = Depends(get_db)):
    """Send password reset link to user's email."""
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    # Always return success to avoid email enumeration
    if user:
        token = secrets.token_urlsafe(32)
        expires_at = (datetime.datetime.now() + datetime.timedelta(hours=1)).isoformat()
        reset_record = models.PasswordResetToken(
            user_id=user.id,
            token=token,
            expires_at=expires_at,
            used=False
        )
        db.add(reset_record)
        db.commit()
        background_tasks.add_task(send_password_reset_email, user.email, user.name, token)
    return {"message": "Si el correo existe, recibirás un enlace de recuperación en breve."}


@app.post("/api/auth/reset-password")
def reset_password(payload: schemas.ResetPasswordRequest, db: Session = Depends(get_db)):
    """Reset password using valid token."""
    record = db.query(models.PasswordResetToken).filter(
        models.PasswordResetToken.token == payload.token,
        models.PasswordResetToken.used == False
    ).first()
    if not record:
        raise HTTPException(status_code=400, detail="Token inválido o ya usado.")
    if datetime.datetime.now() > datetime.datetime.fromisoformat(record.expires_at):
        raise HTTPException(status_code=400, detail="El enlace de recuperación ha expirado. Solicita uno nuevo.")

    if len(payload.new_password) < 8:
        raise HTTPException(status_code=400, detail="La contraseña debe tener al menos 8 caracteres.")
    if not any(c.isdigit() for c in payload.new_password):
        raise HTTPException(status_code=400, detail="La contraseña debe contener al menos un número.")

    user = db.query(models.User).filter(models.User.id == record.user_id).first()
    user.hashed_password = get_password_hash(payload.new_password)
    record.used = True
    db.commit()
    return {"message": "Contraseña actualizada con éxito. Ya puedes iniciar sesión."}


@app.post("/api/clients/{client_id}/profile-pic")
def upload_profile_pic(client_id: int, payload: schemas.ProfilePicRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    """Update profile picture (accepts base64 data URI or URL)."""
    if current_user.id != client_id and current_user.role != "coach":
        raise HTTPException(status_code=403, detail="No autorizado")
    profile = db.query(models.ClientProfile).filter(models.ClientProfile.user_id == client_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
    profile.profile_pic = payload.pic_data
    db.commit()
    return {"message": "Foto actualizada con éxito", "profile_pic": profile.profile_pic}


# --- Coach Approval Endpoints ---

@app.get("/api/coach/pending-clients", response_model=List[schemas.PendingClientResponse])
def get_pending_clients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    pending_users = db.query(models.User).filter(models.User.role == "client", models.User.is_approved == False).all()
    result = []
    for u in pending_users:
        profile = u.profile
        result.append({
            "id": u.id,
            "name": u.name,
            "email": u.email,
            "target": profile.target if profile else "Sin meta especificada",
            "height": profile.height if profile else 0,
            "initial_weight": profile.initial_weight if profile else 0,
            "joined_date": profile.joined_date if profile else "",
            "is_approved": False
        })
    return result


@app.post("/api/coach/clients/{client_id}/approve")
def approve_client(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    client = db.query(models.User).filter(models.User.id == client_id, models.User.role == "client").first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    client.is_approved = True
    
    # Notify client
    notif = models.Notification(
        user_id=client.id,
        title="🎉 ¡Acceso Aprobado!",
        message="Tu acceso a la app Sierra Coaching ha sido activado por el Coach Alejandro. ¡Bienvenido!",
        created_at=datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S"),
        is_read=False
    )
    db.add(notif)
    db.commit()
    db.refresh(client)
    return {"message": "Cliente aprobado con éxito", "is_approved": True}


@app.delete("/api/coach/clients/{client_id}/reject")
def reject_client(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    client = db.query(models.User).filter(models.User.id == client_id, models.User.role == "client").first()
    if not client:
        raise HTTPException(status_code=404, detail="Cliente no encontrado")

    db.delete(client)
    db.commit()
    return {"message": "Solicitud rechazada y eliminada correctamente"}



@app.get("/api/clients", response_model=List[schemas.UserResponse])
def get_clients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    # Return only approved clients
    return db.query(models.User).filter(models.User.role == "client", models.User.is_approved == True).all()


@app.get("/api/clients/{client_id}", response_model=schemas.ClientDetailResponse)
def get_client_detail(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado: No tienes permisos para ver este alumno"
        )
    client = db.query(models.User).filter(models.User.id == client_id).first()
    if not client or client.role != "client":
        raise HTTPException(
            status_code=status.HTTP_404_NOT_FOUND,
            detail="Alumno no encontrado"
        )

    # Fetch today's daily habits log
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    habits_log = db.query(models.DailyHabitLog).filter(
        models.DailyHabitLog.user_id == client_id,
        models.DailyHabitLog.date == today_str
    ).first()

    # If habits log doesn't exist for today, create a default one
    if not habits_log:
        habits_log = models.DailyHabitLog(
            user_id=client_id,
            date=today_str,
            water_cups=0,
            sleep_hours=0.0,
            cardio_done=False,
            alcohol_avoided=True
        )
        db.add(habits_log)
        db.commit()
        db.refresh(habits_log)

    # Fetch today's daily nutrition log
    nutrition_log = db.query(models.DailyNutritionLog).filter(
        models.DailyNutritionLog.user_id == client_id,
        models.DailyNutritionLog.date == today_str
    ).first()

    # If nutrition log doesn't exist for today, create a default one
    if not nutrition_log:
        nutrition_log = models.DailyNutritionLog(
            user_id=client_id,
            date=today_str,
            calories_consumed=0,
            proteins_consumed=0,
            carbs_consumed=0,
            fats_consumed=0,
            meals_completed="{}"
        )
        db.add(nutrition_log)
        db.commit()
        db.refresh(nutrition_log)

    # Build Response
    diet_sorted = db.query(models.DietMeal).filter(models.DietMeal.user_id == client_id).order_by(models.DietMeal.day_number).all()
    routines = db.query(models.RoutineDay).filter(models.RoutineDay.user_id == client_id).all()
    weight_hist = db.query(models.WeightLog).filter(models.WeightLog.user_id == client_id).order_by(models.WeightLog.date).all()
    measurements_hist = db.query(models.MeasurementLog).filter(models.MeasurementLog.user_id == client_id).order_by(models.MeasurementLog.date).all()
    photos = db.query(models.ProgressPhoto).filter(models.ProgressPhoto.user_id == client_id).order_by(models.ProgressPhoto.date).all()
    lifts = db.query(models.LiftLog).filter(models.LiftLog.user_id == client_id).order_by(models.LiftLog.week_number, models.LiftLog.set_number).all()
    all_habit_logs = db.query(models.DailyHabitLog).filter(models.DailyHabitLog.user_id == client_id).order_by(models.DailyHabitLog.date).all()
    
    notifications_list = db.query(models.Notification).filter(
        models.Notification.user_id == client_id
    ).order_by(models.Notification.id.desc()).limit(30).all()

    workout_feedbacks_list = db.query(models.WorkoutFeedback).filter(
        models.WorkoutFeedback.user_id == client_id
    ).order_by(models.WorkoutFeedback.date.desc()).all()

    return {
        "id": client.id,
        "email": client.email,
        "name": client.name,
        "role": client.role,
        "profile": client.profile,
        "daily_habits_log": habits_log,
        "routines": routines,
        "diet": diet_sorted,
        "weight_history": weight_hist,
        "measurements_history": measurements_hist,
        "progress_photos": photos,
        "lift_logs": lifts,
        "all_habit_logs": all_habit_logs,
        "notifications": notifications_list,
        "workout_feedbacks": workout_feedbacks_list,
        "today_nutrition_log": nutrition_log
    }


@app.post("/api/clients/{client_id}/habits", response_model=schemas.DailyHabitLogResponse)
def update_daily_habits(client_id: int, payload: schemas.DailyHabitLogBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    habits_log = db.query(models.DailyHabitLog).filter(
        models.DailyHabitLog.user_id == client_id,
        models.DailyHabitLog.date == today_str
    ).first()

    if not habits_log:
        habits_log = models.DailyHabitLog(
            user_id=client_id,
            date=today_str
        )
        db.add(habits_log)

    habits_log.water_cups = payload.water_cups
    habits_log.sleep_hours = payload.sleep_hours
    habits_log.cardio_done = payload.cardio_done
    habits_log.alcohol_avoided = payload.alcohol_avoided

    db.commit()
    db.refresh(habits_log)
    return habits_log


@app.post("/api/clients/{client_id}/weight", response_model=schemas.WeightLogResponse)
def log_weight(client_id: int, payload: schemas.WeightLogCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    date_str = payload.date if payload.date else datetime.date.today().strftime("%Y-%m-%d")
    
    new_log = models.WeightLog(
        user_id=client_id,
        date=date_str,
        weight=payload.weight
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@app.post("/api/clients/{client_id}/measurements", response_model=schemas.MeasurementLogResponse)
def log_measurements(client_id: int, payload: schemas.MeasurementLogCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    date_str = payload.date if payload.date else datetime.date.today().strftime("%Y-%m-%d")

    new_log = models.MeasurementLog(
        user_id=client_id,
        date=date_str,
        waist=payload.waist,
        hip=payload.hip,
        thigh=payload.thigh
    )
    db.add(new_log)
    db.commit()
    db.refresh(new_log)
    return new_log


@app.post("/api/clients/{client_id}/photos", response_model=schemas.ProgressPhotoResponse)
def add_progress_photo(client_id: int, payload: schemas.ProgressPhotoCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    date_str = payload.date if payload.date else datetime.date.today().strftime("%Y-%m-%d")

    new_photo = models.ProgressPhoto(
        user_id=client_id,
        date=date_str,
        label=payload.label,
        url=payload.url
    )
    db.add(new_photo)
    db.commit()
    db.refresh(new_photo)
    return new_photo


@app.post("/api/clients/{client_id}/logs", response_model=List[schemas.LiftLogResponse])
def log_lift_batch(client_id: int, payload: schemas.LiftLogCreateBatch, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    date_str = payload.date if payload.date else datetime.date.today().strftime("%Y-%m-%d")
    
    # Remove existing logs for this exercise, client, and week to prevent duplicates
    db.query(models.LiftLog).filter(
        models.LiftLog.user_id == client_id,
        models.LiftLog.exercise_id == payload.exercise_id,
        models.LiftLog.week_number == payload.week_number
    ).delete()
    db.commit()

    created_logs = []
    for item in payload.sets:
        log_entry = models.LiftLog(
            user_id=client_id,
            exercise_id=payload.exercise_id,
            week_number=payload.week_number,
            date=date_str,
            set_number=item.set_number,
            weight=item.weight,
            reps=item.reps,
            rpe=item.rpe
        )
        db.add(log_entry)
        created_logs.append(log_entry)

    db.commit()
    for log in created_logs:
        db.refresh(log)

    return created_logs


@app.put("/api/clients/{client_id}/routine", response_model=List[schemas.RoutineDayResponse])
def update_client_routines(client_id: int, routines_payload: List[schemas.RoutineDayUpdatePayload], db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    # For simplicity, we loop through the submitted days and update them
    for r_day in routines_payload:
        db_day = db.query(models.RoutineDay).filter(
            models.RoutineDay.user_id == client_id,
            models.RoutineDay.day_name == r_day.day_name
        ).first()

        if not db_day:
            db_day = models.RoutineDay(
                user_id=client_id,
                day_name=r_day.day_name,
                routine_name=r_day.routine_name
            )
            db.add(db_day)
            db.commit()
            db.refresh(db_day)
        else:
            db_day.routine_name = r_day.routine_name

        # Load existing exercises to update/delete them properly (preserves keys & avoids violating foreign key constraints on lift_logs)
        existing_exs = {ex.id: ex for ex in db.query(models.Exercise).filter(models.Exercise.routine_day_id == db_day.id).all()}
        updated_ex_ids = []

        for idx, ex_data in enumerate(r_day.exercises):
            ex_obj = None
            if ex_data.id and ex_data.id in existing_exs:
                ex_obj = existing_exs[ex_data.id]
                ex_obj.name = ex_data.name
                ex_obj.sets = ex_data.sets
                ex_obj.reps = ex_data.reps
                ex_obj.notes = ex_data.notes
                ex_obj.video_url = ex_data.video_url
                ex_obj.order = idx
                updated_ex_ids.append(ex_data.id)
            else:
                # Fallback: try matching by exact name to preserve id if not passed
                for ex_id, existing_ex in list(existing_exs.items()):
                    if existing_ex.name.lower() == ex_data.name.lower() and ex_id not in updated_ex_ids:
                        ex_obj = existing_ex
                        ex_obj.sets = ex_data.sets
                        ex_obj.reps = ex_data.reps
                        ex_obj.notes = ex_data.notes
                        ex_obj.video_url = ex_data.video_url
                        ex_obj.order = idx
                        updated_ex_ids.append(ex_id)
                        break

            if not ex_obj:
                # Create brand new exercise
                db_ex = models.Exercise(
                    routine_day_id=db_day.id,
                    name=ex_data.name,
                    sets=ex_data.sets,
                    reps=ex_data.reps,
                    notes=ex_data.notes,
                    video_url=ex_data.video_url,
                    order=idx
                )
                db.add(db_ex)

        # Delete any exercises no longer present in the routine payload
        for ex_id, existing_ex in existing_exs.items():
            if ex_id not in updated_ex_ids:
                db.delete(existing_ex)
                
        db.commit()

    # Enviar notificación de actualización de rutina al cliente
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.add(models.Notification(
        user_id=client_id,
        title="¡Rutina Actualizada!",
        message="Tu coach Alejandro ha actualizado tu plan de rutinas semanal.",
        type="routine",
        is_read=False,
        created_at=now_str
    ))
    db.commit()

    return db.query(models.RoutineDay).filter(models.RoutineDay.user_id == client_id).all()


@app.put("/api/clients/{client_id}/diet", response_model=List[schemas.DietMealResponse])
def update_client_diet(client_id: int, diet_payload: List[schemas.DietMealResponse], db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    for meal in diet_payload:
        db_meal = db.query(models.DietMeal).filter(
            models.DietMeal.user_id == client_id,
            models.DietMeal.day_number == meal.day_number
        ).first()

        if not db_meal:
            db_meal = models.DietMeal(
                user_id=client_id,
                day_number=meal.day_number
            )
            db.add(db_meal)

        db_meal.desayuno = meal.desayuno
        db_meal.almuerzo = meal.almuerzo
        db_meal.cena = meal.cena
        db_meal.merienda = meal.merienda
        db_meal.calories = meal.calories
        db_meal.proteins = meal.proteins
        db_meal.carbs = meal.carbs
        db_meal.fats = meal.fats

    db.commit()

    # Enviar notificación de actualización de dieta al cliente
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    db.add(models.Notification(
        user_id=client_id,
        title="¡Dieta Actualizada!",
        message="Tu coach Alejandro ha modificado tu plan de alimentación semanal.",
        type="diet",
        is_read=False,
        created_at=now_str
    ))
    db.commit()

    return db.query(models.DietMeal).filter(models.DietMeal.user_id == client_id).order_by(models.DietMeal.day_number).all()


@app.get("/api/settings/{key}", response_model=schemas.SystemSettingResponse)
def get_setting(key: str, db: Session = Depends(get_db)):
    # Settings like weekly challenge can be fetched publicly by guests too (landing page)
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    if not setting:
        return {"key": key, "value": ""}
    return setting


@app.post("/api/settings/{key}", response_model=schemas.SystemSettingResponse)
def update_setting(key: str, payload: schemas.SystemSettingUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    setting = db.query(models.SystemSetting).filter(models.SystemSetting.key == key).first()
    if not setting:
        setting = models.SystemSetting(key=key, value=payload.value)
        db.add(setting)
    else:
        setting.value = payload.value
    db.commit()
    db.refresh(setting)
    return setting


@app.put("/api/clients/{client_id}/profile-pic", response_model=schemas.ClientProfileResponse)
def update_profile_pic(client_id: int, payload: schemas.ProfilePicUpdate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(
            status_code=status.HTTP_403_FORBIDDEN,
            detail="Acceso denegado"
        )
    profile = db.query(models.ClientProfile).filter(models.ClientProfile.user_id == client_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil de alumno no encontrado")
    profile.profile_pic = payload.profile_pic
    db.commit()
    db.refresh(profile)
    return profile


import json
import urllib.request

def generate_fallback_plan(client, type_plan: str, day_name: str = "Lunes", day_number: int = 1):
    target = (client.profile.target or "").lower() if client.profile else ""
    height = client.profile.height or 1.70 if client.profile else 1.70
    weight = client.profile.initial_weight or 70.0 if client.profile else 70.0
    
    if type_plan == "routine":
        routines_db = {
            "Lunes": ("Empuje (Pecho, Hombro, Tríceps) [IA]", [
                {"name": "Press de Banca con Mancuernas", "sets": 4, "reps": "8-10", "notes": "Céntrate en el estiramiento en la parte baja", "video_url": ""},
                {"name": "Press Inclinado en Máquina", "sets": 3, "reps": "10", "notes": "Controla la negativa de 3 segundos", "video_url": ""},
                {"name": "Elevaciones Laterales", "sets": 4, "reps": "12-15", "notes": "Mantén los brazos ligeramente al frente", "video_url": ""},
                {"name": "Copa de Tríceps a dos manos", "sets": 3, "reps": "10-12", "notes": "Baja profundo", "video_url": ""}
            ]),
            "Martes": ("Tracción (Espalda, Bíceps) [IA]", [
                {"name": "Jalón al Pecho Prono", "sets": 4, "reps": "8-10", "notes": "Lleva los codos hacia la cadera", "video_url": ""},
                {"name": "Remo con Mancuerna", "sets": 3, "reps": "10", "notes": "Mantén la espalda neutra", "video_url": ""},
                {"name": "Curl de Bíceps Alterno", "sets": 4, "reps": "10-12", "notes": "Supina el antebrazo al subir", "video_url": ""},
                {"name": "Curl de Bíceps Martillo", "sets": 3, "reps": "10", "notes": "Mantén tensión constante", "video_url": ""}
            ]),
            "Miercoles": ("Pierna Completa [IA]", [
                {"name": "Prensa de Piernas", "sets": 4, "reps": "10-12", "notes": "Posición de pies media para cuádriceps", "video_url": ""},
                {"name": "Peso Muerto Rumano", "sets": 3, "reps": "8-10", "notes": "Siente el estiramiento en femorales", "video_url": ""},
                {"name": "Extensión de Cuádriceps", "sets": 4, "reps": "12-15", "notes": "Sostén 1 segundo arriba", "video_url": ""},
                {"name": "Elevación de Talones en Máquina", "sets": 4, "reps": "15", "notes": "Estiramiento completo abajo", "video_url": ""}
            ]),
            "Jueves": ("Pecho y Espalda [IA]", [
                {"name": "Press Inclinado en Smith", "sets": 4, "reps": "8-10", "notes": "Ángulo de 30 grados", "video_url": ""},
                {"name": "Remo en Máquina", "sets": 4, "reps": "10", "notes": "Retracción escapular completa", "video_url": ""},
                {"name": "Cruce de Poleas", "sets": 3, "reps": "12", "notes": "Cruza ligeramente al frente", "video_url": ""},
                {"name": "Jalón Supino Cerrado", "sets": 3, "reps": "10", "notes": "Espalda ligeramente inclinada atrás", "video_url": ""}
            ]),
            "Viernes": ("Brazos y Hombros [IA]", [
                {"name": "Press Militar con Mancuerna", "sets": 4, "reps": "8-10", "notes": "Rango completo de movimiento", "video_url": ""},
                {"name": "Curl de Bíceps en Polea", "sets": 3, "reps": "10-12", "notes": "Aprieta al final de la contracción", "video_url": ""},
                {"name": "Extensión de Tríceps Polea Alta", "sets": 3, "reps": "12", "notes": "Usa cuerda para mayor rango", "video_url": ""},
                {"name": "Pájaros con Mancuerna", "sets": 4, "reps": "12-15", "notes": "Para deltoides posterior", "video_url": ""}
            ]),
            "Sábado": ("Cardio Activo [IA]", [
                {"name": "Cinta de correr inclinada", "sets": 1, "reps": "30 min", "notes": "Inclinación al 8%, velocidad moderada", "video_url": ""}
            ]),
            "Domingo": ("Descanso Total [IA]", [])
        }
        r_name, r_exs = routines_db.get(day_name, ("Rutina de Entrenamiento [IA]", []))
        return {"routine_name": r_name, "exercises": r_exs}
        
    elif type_plan == "diet":
        is_cutting = any(kw in target for kw in ["defin", "reduc", "perder", "bajar", "grasa", "tonif"])
        
        if is_cutting:
            multiplier = 28
            cal = int(weight * multiplier)
            prot = int(weight * 2.2)
            fats = int(weight * 0.8)
            carbs = int((cal - (prot * 4) - (fats * 9)) / 4)
        else:
            multiplier = 35
            cal = int(weight * multiplier)
            prot = int(weight * 2.0)
            fats = int(weight * 0.9)
            carbs = int((cal - (prot * 4) - (fats * 9)) / 4)
            
        g_val = int(weight * 2)
        return {
            "desayuno": f"Huevos revueltos (3 enteros + 2 claras), 50g de avena en hojuelas con canela y fresas picadas, café con un chorrito de leche vegetal.",
            "almuerzo": f"{g_val}g de pechuga de pollo a la plancha, 1 taza de arroz blanco cocido, brócoli al vapor y ensalada verde.",
            "cena": f"{g_val}g de filete de salmón o atún magro, 150g de papa cocida al vapor, espárragos salteados.",
            "merienda": f"1 taza de yogur griego natural sin azúcar, 30g de almendras enteras, 1 banano o manzana mediana.",
            "calories": cal,
            "proteins": prot,
            "carbs": carbs,
            "fats": fats
        }

@app.post("/api/coach/ai-generate")
def ai_generate_plan(payload: schemas.AIGenerateRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    client = db.query(models.User).filter(models.User.id == payload.client_id).first()
    if not client or client.role != "client":
        raise HTTPException(status_code=404, detail="Alumno no encontrado")
        
    latest_weight = 70.0
    client_height = 1.70
    client_target = "General"
    if client.profile:
        latest_weight = client.profile.initial_weight or 70.0
        client_height = client.profile.height or 1.70
        client_target = client.profile.target or "General"
        
    if client.weight_logs:
        latest_weight = client.weight_logs[-1].weight
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY no encontrada. Generando plan de fallback local...")
        return generate_fallback_plan(client, payload.type, payload.day_name, payload.day_number)
        
    # Build AI prompt
    if payload.type == "routine":
        prompt = f"""
        Eres un entrenador personal certificado de alto nivel.
        Crea una rutina de entrenamiento de gimnasio para el día {payload.day_name} adaptada a este alumno:
        - Nombre: {client.name}
        - Altura: {client_height}m
        - Peso: {latest_weight}kg
        - Objetivo: {client_target}

        Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura (no agregues formato markdown como ```json o ```, solo el texto JSON puro para que pueda ser parseado directamente):
        {{
            "routine_name": "Nombre descriptivo de la rutina (ej. Empuje - Enfoque Pecho)",
            "exercises": [
                {{
                    "name": "Nombre del ejercicio en español",
                    "sets": 4,
                    "reps": "8-10",
                    "notes": "Instrucciones de ejecución (ej. Controlar la excéntrica)",
                    "video_url": ""
                }}
            ]
        }}
        Asegúrate de que contenga de 4 a 6 ejercicios.
        """
    elif payload.type == "diet":
        prompt = f"""
        Eres un nutricionista deportivo certificado de alto nivel.
        Crea un plan de alimentación (dieta) diario para el Día {payload.day_number} adaptado a este alumno:
        - Nombre: {client.name}
        - Altura: {client_height}m
        - Peso: {latest_weight}kg
        - Objetivo: {client_target}

        Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura (no agregues formato markdown como ```json o ```, solo el texto JSON puro para que pueda ser parseado directamente):
        {{
            "desayuno": "Descripción detallada de la comida en español, cantidades y preparación",
            "almuerzo": "Descripción detallada de la comida en español, cantidades y preparación",
            "cena": "Descripción detallada de la comida en español, cantidades y preparación",
            "merienda": "Descripción detallada de la comida en español, cantidades y preparación",
            "calories": 2200,
            "proteins": 160,
            "carbs": 240,
            "fats": 65
        }}
        Asegúrate de que los macronutrientes calculados coincidan lógicamente con las calorías totales (Proteínas = 4 kcal/g, Carbohidratos = 4 kcal/g, Grasas = 9 kcal/g).
        """
    else:
        raise HTTPException(status_code=400, detail="Tipo de plan inválido")
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text_content = res_data["candidates"][0]["content"]["parts"][0]["text"]
            text_content = text_content.strip()
            if text_content.startswith("```"):
                lines = text_content.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                text_content = "\n".join(lines).strip()
            parsed_json = json.loads(text_content)
            return parsed_json
    except Exception as e:
        print(f"Error llamando a Gemini API ({e}). Usando plan de fallback...")
        return generate_fallback_plan(client, payload.type, payload.day_name, payload.day_number)


@app.post("/api/coach/ai-calculate-macros")
def ai_calculate_macros(payload: schemas.AICalculateMacrosRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        print("GEMINI_API_KEY no encontrada. Generando macros de fallback local...")
        return {
            "calories": 2000,
            "proteins": 140,
            "carbs": 180,
            "fats": 65
        }
        
    prompt = f"""
    Eres un nutricionista deportivo certificado de alto nivel.
    Calcula o estima detalladamente los macronutrientes y calorías totales para las siguientes comidas del día:
    - Desayuno: {payload.desayuno}
    - Almuerzo: {payload.almuerzo}
    - Cena: {payload.cena}
    - Merienda: {payload.merienda}

    Responde ÚNICAMENTE con un objeto JSON válido con la siguiente estructura (no agregues formato markdown como ```json o ```, solo el texto JSON puro para que pueda ser parseado directamente):
    {{
        "calories": 2000,
        "proteins": 140,
        "carbs": 180,
        "fats": 65
    }}
    Asegúrate de que los macronutrientes calculados coincidan lógicamente con las calorías totales (Proteínas = 4 kcal/g, Carbohidratos = 4 kcal/g, Grasas = 9 kcal/g). Si alguna comida está vacía, no tiene sentido o dice 'Sin asignar', asume 0 macros para esa comida específica. Sé preciso con porciones comunes.
    """
    
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    body = {
        "contents": [{
            "parts": [{"text": prompt}]
        }],
        "generationConfig": {
            "responseMimeType": "application/json"
        }
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text_content = res_data["candidates"][0]["content"]["parts"][0]["text"]
            text_content = text_content.strip()
            if text_content.startswith("```"):
                lines = text_content.split("\n")
                if lines[0].startswith("```"):
                    lines = lines[1:]
                if lines[-1].startswith("```"):
                    lines = lines[:-1]
                text_content = "\n".join(lines).strip()
            parsed_json = json.loads(text_content)
            return parsed_json
    except Exception as e:
        print(f"Error llamando a Gemini API para calcular macros ({e}). Usando fallback...")
        return {
            "calories": 1800,
            "proteins": 130,
            "carbs": 160,
            "fats": 55
        }


# --- ENDPOINTS NUEVOS: NUTRICIÓN AVANZADA ---

@app.post("/api/clients/{client_id}/tdee", response_model=schemas.ClientProfileResponse)
def save_tdee(client_id: int, payload: schemas.TDEESaveRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
    
    profile = db.query(models.ClientProfile).filter(models.ClientProfile.user_id == client_id).first()
    if not profile:
        raise HTTPException(status_code=404, detail="Perfil no encontrado")
        
    profile.tdee = payload.tdee
    profile.target_calories = payload.target_calories
    profile.target_proteins = payload.target_proteins
    profile.target_carbs = payload.target_carbs
    profile.target_fats = payload.target_fats
    profile.gender = payload.gender
    profile.activity_level = payload.activity_level
    profile.age = payload.age
    
    db.commit()
    db.refresh(profile)
    return profile


@app.get("/api/clients/{client_id}/nutrition/today", response_model=schemas.DailyNutritionLogResponse)
def get_today_nutrition(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    log = db.query(models.DailyNutritionLog).filter(
        models.DailyNutritionLog.user_id == client_id,
        models.DailyNutritionLog.date == today_str
    ).first()
    
    if not log:
        log = models.DailyNutritionLog(
            user_id=client_id,
            date=today_str,
            calories_consumed=0,
            proteins_consumed=0,
            carbs_consumed=0,
            fats_consumed=0,
            meals_completed="{}"
        )
        db.add(log)
        db.commit()
        db.refresh(log)
        
    return log


@app.post("/api/clients/{client_id}/nutrition/today", response_model=schemas.DailyNutritionLogResponse)
def update_today_nutrition(client_id: int, payload: schemas.DailyNutritionLogBase, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    today_str = datetime.date.today().strftime("%Y-%m-%d")
    log = db.query(models.DailyNutritionLog).filter(
        models.DailyNutritionLog.user_id == client_id,
        models.DailyNutritionLog.date == today_str
    ).first()
    
    if not log:
        log = models.DailyNutritionLog(
            user_id=client_id,
            date=today_str
        )
        db.add(log)
        
    log.calories_consumed = payload.calories_consumed
    log.proteins_consumed = payload.proteins_consumed
    log.carbs_consumed = payload.carbs_consumed
    log.fats_consumed = payload.fats_consumed
    log.meals_completed = payload.meals_completed
    
    db.commit()
    db.refresh(log)
    return log


@app.put("/api/clients/{client_id}/profile", response_model=schemas.ClientProfileResponse)
def update_client_profile(
    client_id: int,
    payload: schemas.ClientProfileUpdate,
    db: Session = Depends(get_db),
    current_user: models.User = Depends(get_current_user)
):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(status_code=status.HTTP_403_FORBIDDEN, detail="Acceso denegado")
        
    client = db.query(models.User).filter(models.User.id == client_id).first()
    if not client:
        raise HTTPException(status_code=status.HTTP_404_NOT_FOUND, detail="Usuario no encontrado")
        
    if payload.name:
        client.name = payload.name
        
    profile = db.query(models.ClientProfile).filter(models.ClientProfile.user_id == client_id).first()
    if not profile:
        profile = models.ClientProfile(
            user_id=client_id,
            height=payload.height or 1.70,
            initial_weight=payload.initial_weight or 70.0,
            target=payload.target or "Tonificar",
            joined_date=datetime.date.today().strftime("%Y-%m-%d")
        )
        db.add(profile)
    else:
        if payload.height is not None:
            h = float(payload.height)
            if h > 3.0:
                h = h / 100.0
            profile.height = round(h, 2)
        if payload.initial_weight is not None:
            profile.initial_weight = payload.initial_weight
        if payload.target is not None:
            profile.target = payload.target
            
    db.commit()
    db.refresh(profile)
    return profile


@app.post("/api/nutrition/parse-meal", response_model=schemas.ParseMealResponse)
def parse_meal_with_ai(
    payload: schemas.ParseMealRequest,
    current_user: models.User = Depends(get_current_user)
):
    text = payload.text.strip()
    if not text:
        raise HTTPException(status_code=400, detail="Escribe la descripción de tu comida")
        
    api_key = os.environ.get("GEMINI_API_KEY")
    if api_key:
        try:
            url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
            headers = {"Content-Type": "application/json"}
            system_prompt = (
                "Eres un nutricionista experto de Sierra Coaching. Analiza el texto proporcionado por el usuario con los alimentos consumidos y calcula "
                "el total estimado de calorías (kcal), proteínas (g), carbohidratos (g) y grasas (g). "
                "Devuelve ÚNICAMENTE un JSON válido con este formato exacto sin markdown ni explicaciones adicionales:\n"
                '{"calories": 450, "proteins": 35, "carbs": 40, "fats": 12, "summary": "Pechuga de pollo con arroz y ensalada"}'
            )
            body = {
                "contents": [
                    {"role": "user", "parts": [{"text": system_prompt + "\n\nTexto del usuario: " + text}]}
                ]
            }
            req = urllib.request.Request(url, data=json.dumps(body).encode("utf-8"), headers=headers, method="POST")
            with urllib.request.urlopen(req, timeout=10) as response:
                res_data = json.loads(response.read().decode("utf-8"))
                raw_response = res_data["candidates"][0]["content"]["parts"][0]["text"].strip()
                cleaned = raw_response.replace("```json", "").replace("```", "").strip()
                parsed = json.loads(cleaned)
                return schemas.ParseMealResponse(
                    calories=int(parsed.get("calories", 350)),
                    proteins=int(parsed.get("proteins", 25)),
                    carbs=int(parsed.get("carbs", 35)),
                    fats=int(parsed.get("fats", 10)),
                    summary=str(parsed.get("summary", text))
                )
        except Exception as e:
            print(f"Error parse-meal Gemini: {e}")

    # Fallback heuristic parser
    low_text = text.lower()
    cal = 350
    prot = 25
    carb = 35
    fat = 10
    
    if any(k in low_text for k in ["pollo", "carne", "pescado", "atún", "salmon", "salmón", "res"]):
        prot += 15
        cal += 100
    if any(k in low_text for k in ["huevo", "huevos", "clara", "claras"]):
        prot += 12
        fat += 8
        cal += 130
    if any(k in low_text for k in ["arroz", "papa", "patata", "avena", "pan", "pasta", "arepa"]):
        carb += 25
        cal += 140
    if any(k in low_text for k in ["aguacate", "palta", "queso", "aceite", "nueces", "mantequilla"]):
        fat += 10
        cal += 110

    return schemas.ParseMealResponse(
        calories=cal,
        proteins=prot,
        carbs=carb,
        fats=fat,
        summary=text
    )


# --- ENDPOINTS NUEVOS: DIARIO DE ENTRENAMIENTO ---

@app.post("/api/clients/{client_id}/workout-feedback", response_model=schemas.WorkoutFeedbackResponse)
def add_workout_feedback(client_id: int, payload: schemas.WorkoutFeedbackCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    date_str = payload.date if payload.date else datetime.date.today().strftime("%Y-%m-%d")
    
    new_feedback = models.WorkoutFeedback(
        user_id=client_id,
        date=date_str,
        routine_name=payload.routine_name,
        effort_rating=payload.effort_rating,
        mood_emoji=payload.mood_emoji,
        notes=payload.notes
    )
    db.add(new_feedback)
    db.commit()
    db.refresh(new_feedback)
    return new_feedback


@app.get("/api/clients/{client_id}/workout-feedback", response_model=List[schemas.WorkoutFeedbackResponse])
def get_workout_feedback_history(client_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    if current_user.role != "coach" and current_user.id != client_id:
        raise HTTPException(status_code=403, detail="Acceso denegado")
        
    return db.query(models.WorkoutFeedback).filter(
        models.WorkoutFeedback.user_id == client_id
    ).order_by(models.WorkoutFeedback.date.desc()).all()


# --- ENDPOINTS NUEVOS: NOTIFICACIONES ---

@app.get("/api/notifications", response_model=List[schemas.NotificationResponse])
def get_my_notifications(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    return db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id
    ).order_by(models.Notification.id.desc()).limit(50).all()


@app.put("/api/notifications/{notification_id}/read", response_model=schemas.NotificationResponse)
def mark_notification_as_read(notification_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    notification = db.query(models.Notification).filter(
        models.Notification.id == notification_id,
        models.Notification.user_id == current_user.id
    ).first()
    if not notification:
        raise HTTPException(status_code=404, detail="Notificación no encontrada")
        
    notification.is_read = True
    db.commit()
    db.refresh(notification)
    return notification


@app.put("/api/notifications/read-all")
def mark_all_notifications_as_read(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    db.query(models.Notification).filter(
        models.Notification.user_id == current_user.id,
        models.Notification.is_read == False
    ).update({models.Notification.is_read: True}, synchronize_session=False)
    db.commit()
    return {"detail": "Todas las notificaciones marcadas como leídas"}


# --- ENDPOINTS NUEVOS: CHAT COACH-CLIENTE ---

@app.get("/api/chat/messages/{contact_id}", response_model=List[schemas.ChatMessageResponse])
def get_chat_messages(contact_id: int, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    is_authorized = False
    if current_user.role == "coach":
        is_authorized = True
    elif current_user.role == "client":
        if current_user.coach_id == contact_id or db.query(models.User).filter(models.User.id == contact_id, models.User.role == "coach").first() is not None:
            is_authorized = True
            
    if not is_authorized:
        raise HTTPException(status_code=403, detail="No autorizado para este chat")
        
    messages = db.query(models.ChatMessage).filter(
        ((models.ChatMessage.sender_id == current_user.id) & (models.ChatMessage.receiver_id == contact_id)) |
        ((models.ChatMessage.sender_id == contact_id) & (models.ChatMessage.receiver_id == current_user.id))
    ).order_by(models.ChatMessage.timestamp.asc()).all()
    
    db.query(models.ChatMessage).filter(
        models.ChatMessage.sender_id == contact_id,
        models.ChatMessage.receiver_id == current_user.id,
        models.ChatMessage.is_read == False
    ).update({models.ChatMessage.is_read: True}, synchronize_session=False)
    db.commit()
    
    return messages


@app.post("/api/chat/messages", response_model=schemas.ChatMessageResponse)
def send_chat_message(payload: schemas.ChatMessageCreate, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    receiver = db.query(models.User).filter(models.User.id == payload.receiver_id).first()
    if not receiver:
        raise HTTPException(status_code=404, detail="Destinatario no encontrado")
        
    now_str = datetime.datetime.now().strftime("%Y-%m-%d %H:%M:%S")
    
    new_message = models.ChatMessage(
        sender_id=current_user.id,
        receiver_id=payload.receiver_id,
        message=payload.message,
        timestamp=now_str
    )
    db.add(new_message)
    
    chat_notification = models.Notification(
        user_id=payload.receiver_id,
        title=f"Nuevo mensaje de {current_user.name}",
        message=payload.message[:80] + "..." if len(payload.message) > 80 else payload.message,
        type="chat",
        is_read=False,
        created_at=now_str
    )
    db.add(chat_notification)
    
    db.commit()
    db.refresh(new_message)
    return new_message


@app.get("/api/chat/unread-counts", response_model=List[schemas.ChatUnreadCountResponse])
def get_unread_chat_counts(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    from sqlalchemy import func
    unread_counts = db.query(
        models.ChatMessage.sender_id,
        func.count(models.ChatMessage.id).label("unread_count")
    ).filter(
        models.ChatMessage.receiver_id == current_user.id,
        models.ChatMessage.is_read == False
    ).group_by(models.ChatMessage.sender_id).all()
    
    return [{"sender_id": row[0], "unread_count": row[1]} for row in unread_counts]


@app.post("/api/chat")
def chat_with_ai(payload: schemas.ChatRequest, db: Session = Depends(get_db), current_user: models.User = Depends(get_current_user)):
    client = current_user
    latest_weight = 70.0
    client_height = 1.70
    client_target = "General"
    if client.profile:
        latest_weight = client.profile.initial_weight or 70.0
        client_height = client.profile.height or 1.70
        client_target = client.profile.target or "General"
        
    if client.weight_logs:
        latest_weight = client.weight_logs[-1].weight
        
    routines_context = ""
    for r in client.routines:
        ex_list = ", ".join([f"{ex.name} ({ex.sets}x{ex.reps})" for ex in r.exercises])
        routines_context += f"- {r.day_name}: {r.routine_name} ({ex_list})\n"
        
    diet_context = ""
    for d in client.diet_meals:
        diet_context += f"- Día {d.day_number}: Desayuno: {d.desayuno}, Almuerzo: {d.almuerzo}, Cena: {d.cena}, Merienda: {d.merienda} (Calorías: {d.calories} kcal)\n"
        
    system_prompt = f"""
    Eres el Entrenador Personal de Inteligencia Artificial (Copiloto) de Sierra Coaching.
    Estás chateando con tu alumno: {client.name}.
    Métricas del alumno:
    - Altura: {client_height}m
    - Peso actual: {latest_weight}kg
    - Objetivo: {client_target}
    
    Rutina del alumno asignada por su coach Alejandro:
    {routines_context}
    
    Dieta del alumno asignada por su coach Alejandro:
    {diet_context}
    
    Responde a sus preguntas de fitness, entrenamiento, nutrición o sobre sus planes asignados de forma motivadora, profesional y concisa (máximo 3 párrafos cortos). Usa formato markdown limpio.
    Si el alumno te pide cambiar un ejercicio de su rutina porque está ocupado, dale una opción equivalente coherente con el patrón de movimiento.
    """
    
    api_key = os.environ.get("GEMINI_API_KEY")
    if not api_key:
        return {"response": "Hola. Soy tu Copiloto de IA en Sierra Coaching. (Configura tu GEMINI_API_KEY para respuestas reales del modelo). Te sugiero seguir las rutinas e hidratación asignadas."}
        
    url = f"https://generativelanguage.googleapis.com/v1beta/models/gemini-2.5-flash:generateContent?key={api_key}"
    headers = {"Content-Type": "application/json"}
    
    contents = []
    contents.append({
        "role": "user",
        "parts": [{"text": system_prompt + "\n\nAquí inicia la conversación con el alumno."}]
    })
    contents.append({
        "role": "model",
        "parts": [{"text": "Entendido. Asistiré al alumno con el mayor profesionalismo posible."}]
    })
    
    for turn in payload.history:
        contents.append({
            "role": "user" if turn.role == "user" else "model",
            "parts": [{"text": turn.text}]
        })
        
    contents.append({
        "role": "user",
        "parts": [{"text": payload.message}]
    })
    
    body = {
        "contents": contents
    }
    
    try:
        req = urllib.request.Request(
            url,
            data=json.dumps(body).encode("utf-8"),
            headers=headers,
            method="POST"
        )
        with urllib.request.urlopen(req, timeout=12) as response:
            res_data = json.loads(response.read().decode("utf-8"))
            text_content = res_data["candidates"][0]["content"]["parts"][0]["text"]
            return {"response": text_content.strip()}
    except Exception as e:
        return {"response": f"Lo siento, encontré un problema técnico al conectarme con el motor de IA ({e})."}

if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

