import datetime
import os
from fastapi import FastAPI, Depends, HTTPException, status, Header
from fastapi.middleware.cors import CORSMiddleware
from sqlalchemy.orm import Session
from typing import List, Optional
from jose import jwt, JWTError

from database import engine, Base, get_db, SessionLocal
import models
import schemas
import bcrypt

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
            role="coach"
        )
        db.add(coach)
        db.commit()
        db.refresh(coach)

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
            coach_id=coach.id
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
            ("200g yogurt griego + 30g avena, Fresas", "180g pescado, 1 taza arroz, Ensalada con aceite de oliva", "180g carne magra, Verduras mixtas, 150g papa", "Manzana + 2 cucharadas de mantequilla de maní"),
            ("3 huevos + 3 claras, 2 tajadas pan integral, 1 manzana", "180g pollo, 250g papa, brócoli y zanahoria", "180g atún, Ensalada grande, 1/2 taza arroz", "Batido: 200g yogurt griego, 1 banano, 30g avena, canela"),
            ("Omelette (3 huevos + verduras), 50g avena, Arándanos", "170g carne, 1 taza arroz, Ensalada de zanahoria, tomate, lechuga y cebolla", "180g pollo, Verduras salteadas, 1/2 taza arroz", "200g yogurt griego"),
            ("3 huevos, arepa integral, aguacate", "180g pescado, 250g yuca, Ensalada + aguacate pequeño", "150g carne magra, Verduras, 150g papa", "1 banano"),
            ("3 huevos + 60g de avena, 1 naranja", "Pollo 180 g, Arroz o papa, Ensaladas verdes", "Moderado (proteína magra y verduras)", "30g avena")
        ]
        
        for idx, (des, alm, cen, mer) in enumerate(diet_data):
            db.add(models.DietMeal(
                user_id=client.id,
                day_number=idx + 1,
                desayuno=des,
                almuerzo=alm,
                cena=cen,
                merienda=mer
            ))

        # Create Denilson's routine
        routine_data = {
            "Lunes": ("Pecho, Hombro y Tríceps", [
                ("Press inclinado con mancuernas", 4, "8-10", ""),
                ("Press inclinado en máquina", 3, "8-10", "controlando siempre el movimiento"),
                ("Press plano máquina", 3, "8-10", "repes"),
                ("Aperturas en polea", 3, "10", "llegando al fallo (bajar el doble de tiempo en la negativa)"),
                ("Press militar", 3, "8-10", ""),
                ("Elevaciones laterales mancuernas", 4, "10", "haciendo dropset en la última serie"),
                ("Hombro posterior en máquina", 3, "10", "")
            ]),
            "Martes": ("Espalda y Bíceps", [
                ("Jalón al pecho", 4, "8-10", ""),
                ("Jalón cerrado", 3, "8-10", ""),
                ("Remo gironda", 3, "8-10", ""),
                ("Pull over con V", 4, "8-10", "llegando al fallo"),
                ("Curls de bíceps sentado", 4, "8-10", ""),
                ("Curl martillo", 3, "8-10", ""),
                ("Curl predicador", 3, "8-10", "")
            ]),
            "Miercoles": ("Pierna Completa", [
                ("Sentadilla smith", 4, "8-10", ""),
                ("Prensa", 3, "8-10", ""),
                ("Curl femoral sentado", 3, "8-10", ""),
                ("Extensión cuádriceps", 4, "8-10", "2 descensos y dos series pesadas"),
                ("Pantorrilla", 3, "15", ""),
                ("Abdomen plancha", 3, "1 min", "")
            ]),
            "Jueves": ("Pecho y Espalda", [
                ("Press inclinado en smith", 4, "8-10", ""),
                ("Press inclinado en máquina", 3, "8-10", ""),
                ("Press plano en smith", 3, "8-10", ""),
                ("Peck deck", 3, "8-10", "llegando al fallo"),
                ("Jalón al pecho máquina", 4, "8-10", ""),
                ("Dominadas asistidas", 3, "8-10", ""),
                ("Remo en máquina", 4, "8", "llegando al fallo")
            ]),
            "Viernes": ("Hombro, Tríceps y Bíceps", [
                ("Hip thrust", 4, "10", ""),
                ("Peso muerto sumo", 3, "8-10", ""),
                ("Step ups", 3, "10", "en cada pierna, controlando el movimiento"),
                ("Abducciones", 3, "15-20", "(abiertas y cerradas)"),
                ("Frog pumps", 3, "20", "controlando el movimiento"),
                ("Plancha abdominal / Abdomen bicicleta", 3, "10", "")
            ])
        }

        exercise_map = {} # Maps exercise name to created DB Exercise model for logging
        for day, (r_name, exercises) in routine_data.items():
            r_day = models.RoutineDay(user_id=client.id, day_name=day, routine_name=r_name)
            db.add(r_day)
            db.commit()
            db.refresh(r_day)

            for order, (e_name, sets, reps, notes) in enumerate(exercises):
                ex = models.Exercise(
                    routine_day_id=r_day.id,
                    name=e_name,
                    sets=sets,
                    reps=reps,
                    notes=notes,
                    order=order
                )
                db.add(ex)
                db.commit()
                db.refresh(ex)
                exercise_map[e_name] = ex.id

        # Seed weight logs
        weight_history = [
            ("2026-06-08", 83.0),
            ("2026-06-15", 82.4),
            ("2026-06-22", 81.9),
            ("2026-06-29", 81.2),
            ("2026-07-06", 80.5)
        ]
        for dt, wt in weight_history:
            db.add(models.WeightLog(user_id=client.id, date=dt, weight=wt))

        # Seed measurements
        measurements = [
            ("2026-06-08", 92, 104, 61),
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

        # Seed lift logs for e1 (Press inclinado con mancuernas) and e2 (Press inclinado en maquina)
        e1_id = exercise_map["Press inclinado con mancuernas"]
        e2_id = exercise_map["Press inclinado en máquina"]

        # Week 1
        for s_idx, reps, wt in [(1, 10, 20), (2, 10, 20), (3, 9, 20), (4, 8, 20)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e1_id, week_number=1, date="2026-06-08", set_number=s_idx, weight=wt, reps=reps))
        for s_idx, reps, wt in [(1, 10, 30), (2, 9, 35), (3, 8, 35)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e2_id, week_number=1, date="2026-06-08", set_number=s_idx, weight=wt, reps=reps))

        # Week 2 (Logró 10 repes en todos en e1! Activará sobrecarga progresiva en Semana 3)
        for s_idx, reps, wt in [(1, 10, 22), (2, 10, 22), (3, 10, 22), (4, 10, 22)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e1_id, week_number=2, date="2026-06-15", set_number=s_idx, weight=wt, reps=reps))
        for s_idx, reps, wt in [(1, 10, 35), (2, 10, 35), (3, 9, 35)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e2_id, week_number=2, date="2026-06-15", set_number=s_idx, weight=wt, reps=reps))

        # Week 3
        for s_idx, reps, wt in [(1, 8, 24), (2, 8, 24), (3, 7, 24), (4, 6, 24)]:
            db.add(models.LiftLog(user_id=client.id, exercise_id=e1_id, week_number=3, date="2026-06-22", set_number=s_idx, weight=wt, reps=reps))

        db.commit()


# Run seeding on startup
@app.on_event("startup")
def startup_event():
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


@app.post("/api/auth/register", response_model=schemas.LoginResponse)
def register(payload: schemas.UserRegister, db: Session = Depends(get_db)):
    # Check if user already exists
    user = db.query(models.User).filter(models.User.email == payload.email).first()
    if user:
        raise HTTPException(
            status_code=status.HTTP_400_BAD_REQUEST,
            detail="Este correo electrónico ya está registrado"
        )

    # Find coach to link to
    coach = db.query(models.User).filter(models.User.role == "coach").first()
    coach_id = coach.id if coach else None

    # Create User
    hashed_pw = get_password_hash(payload.password)
    new_user = models.User(
        name=payload.name,
        email=payload.email,
        hashed_password=hashed_pw,
        role="client",
        coach_id=coach_id
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

    db.commit()
    token = create_access_token({"user_id": new_user.id, "email": new_user.email, "role": new_user.role})
    return {"token": token, "user": new_user}



@app.get("/api/clients", response_model=List[schemas.UserResponse])
def get_clients(db: Session = Depends(get_db), current_user: models.User = Depends(get_current_coach)):
    # Simple list of clients
    return db.query(models.User).filter(models.User.role == "client").all()


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

    # Build Response
    diet_sorted = db.query(models.DietMeal).filter(models.DietMeal.user_id == client_id).order_by(models.DietMeal.day_number).all()
    routines = db.query(models.RoutineDay).filter(models.RoutineDay.user_id == client_id).all()
    weight_hist = db.query(models.WeightLog).filter(models.WeightLog.user_id == client_id).order_by(models.WeightLog.date).all()
    measurements_hist = db.query(models.MeasurementLog).filter(models.MeasurementLog.user_id == client_id).order_by(models.MeasurementLog.date).all()
    photos = db.query(models.ProgressPhoto).filter(models.ProgressPhoto.user_id == client_id).order_by(models.ProgressPhoto.date).all()
    lifts = db.query(models.LiftLog).filter(models.LiftLog.user_id == client_id).order_by(models.LiftLog.week_number, models.LiftLog.set_number).all()

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
        "lift_logs": lifts
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
            reps=item.reps
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
                    order=idx
                )
                db.add(db_ex)

        # Delete any exercises no longer present in the routine payload
        for ex_id, existing_ex in existing_exs.items():
            if ex_id not in updated_ex_ids:
                db.delete(existing_ex)
                
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


if __name__ == "__main__":
    import uvicorn
    uvicorn.run("main:app", host="0.0.0.0", port=8000, reload=True)

