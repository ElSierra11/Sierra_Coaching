from sqlalchemy import Column, Integer, String, Float, Boolean, ForeignKey, UniqueConstraint
from sqlalchemy.orm import relationship
from database import Base

class User(Base):
    __tablename__ = "users"

    id = Column(Integer, primary_key=True, index=True)
    name = Column(String, nullable=False)
    email = Column(String, unique=True, index=True, nullable=False)
    hashed_password = Column(String, nullable=False)
    role = Column(String, nullable=False) # "coach" | "client"
    coach_id = Column(Integer, ForeignKey("users.id"), nullable=True)

    # Relationships
    profile = relationship("ClientProfile", uselist=False, back_populates="user", cascade="all, delete-orphan")
    habits = relationship("DailyHabitLog", back_populates="user", cascade="all, delete-orphan")
    routines = relationship("RoutineDay", back_populates="user", cascade="all, delete-orphan")
    diet_meals = relationship("DietMeal", back_populates="user", cascade="all, delete-orphan")
    weight_logs = relationship("WeightLog", back_populates="user", cascade="all, delete-orphan")
    measurement_logs = relationship("MeasurementLog", back_populates="user", cascade="all, delete-orphan")
    progress_photos = relationship("ProgressPhoto", back_populates="user", cascade="all, delete-orphan")
    lift_logs = relationship("LiftLog", back_populates="user", cascade="all, delete-orphan")
    nutrition_logs = relationship("DailyNutritionLog", back_populates="user", cascade="all, delete-orphan")
    workout_feedbacks = relationship("WorkoutFeedback", back_populates="user", cascade="all, delete-orphan")
    notifications = relationship("Notification", back_populates="user", cascade="all, delete-orphan")
    sent_messages = relationship("ChatMessage", foreign_keys="ChatMessage.sender_id", back_populates="sender", cascade="all, delete-orphan")
    received_messages = relationship("ChatMessage", foreign_keys="ChatMessage.receiver_id", back_populates="receiver", cascade="all, delete-orphan")


class ClientProfile(Base):
    __tablename__ = "client_profiles"

    user_id = Column(Integer, ForeignKey("users.id"), primary_key=True)
    height = Column(Float, nullable=False)
    initial_weight = Column(Float, nullable=False)
    target = Column(String, nullable=False)
    joined_date = Column(String, nullable=False)
    profile_pic = Column(String, nullable=True, default="") # optional profile picture URL
    tdee = Column(Float, nullable=True)
    target_calories = Column(Integer, nullable=True)
    target_proteins = Column(Integer, nullable=True)
    target_carbs = Column(Integer, nullable=True)
    target_fats = Column(Integer, nullable=True)
    gender = Column(String, nullable=True)
    activity_level = Column(String, nullable=True)
    age = Column(Integer, nullable=True)

    user = relationship("User", back_populates="profile")


class SystemSetting(Base):
    __tablename__ = "system_settings"

    key = Column(String, primary_key=True, index=True)
    value = Column(String, nullable=False)



class DailyHabitLog(Base):
    __tablename__ = "daily_habit_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    water_cups = Column(Integer, default=0)
    sleep_hours = Column(Float, default=0.0)
    cardio_done = Column(Boolean, default=False)
    alcohol_avoided = Column(Boolean, default=True)

    user = relationship("User", back_populates="habits")
    __table_args__ = (UniqueConstraint('user_id', 'date', name='_user_date_uc'),)


class RoutineDay(Base):
    __tablename__ = "routine_days"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_name = Column(String, nullable=False) # Lunes, Martes, Miercoles, Jueves, Viernes
    routine_name = Column(String, nullable=False) # e.g. "Pecho, Hombro y Tríceps"

    user = relationship("User", back_populates="routines")
    exercises = relationship("Exercise", back_populates="routine_day", cascade="all, delete-orphan")
    __table_args__ = (UniqueConstraint('user_id', 'day_name', name='_user_day_uc'),)


class Exercise(Base):
    __tablename__ = "exercises"

    id = Column(Integer, primary_key=True, index=True)
    routine_day_id = Column(Integer, ForeignKey("routine_days.id"), nullable=False)
    name = Column(String, nullable=False)
    sets = Column(Integer, nullable=False)
    reps = Column(String, nullable=False) # e.g. "8-10" or "10"
    notes = Column(String, nullable=True)
    video_url = Column(String, nullable=True, default="")
    order = Column(Integer, default=0)

    routine_day = relationship("RoutineDay", back_populates="exercises")
    lift_logs = relationship("LiftLog", back_populates="exercise", cascade="all, delete-orphan")


class DietMeal(Base):
    __tablename__ = "diet_meals"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    day_number = Column(Integer, nullable=False) # 1 to 7
    desayuno = Column(String, default="Sin asignar")
    almuerzo = Column(String, default="Sin asignar")
    cena = Column(String, default="Sin asignar")
    merienda = Column(String, default="Sin asignar")
    calories = Column(Integer, default=0)
    proteins = Column(Integer, default=0)
    carbs = Column(Integer, default=0)
    fats = Column(Integer, default=0)

    user = relationship("User", back_populates="diet_meals")
    __table_args__ = (UniqueConstraint('user_id', 'day_number', name='_user_day_number_uc'),)


class WeightLog(Base):
    __tablename__ = "weight_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    weight = Column(Float, nullable=False)

    user = relationship("User", back_populates="weight_logs")


class MeasurementLog(Base):
    __tablename__ = "measurement_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    waist = Column(Float, nullable=False) # Cintura
    hip = Column(Float, nullable=False)   # Cadera
    thigh = Column(Float, nullable=False) # Muslo

    user = relationship("User", back_populates="measurement_logs")


class ProgressPhoto(Base):
    __tablename__ = "progress_photos"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    label = Column(String, nullable=False) # e.g. "Semana 4"
    url = Column(String, nullable=False)

    user = relationship("User", back_populates="progress_photos")


class LiftLog(Base):
    __tablename__ = "lift_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    exercise_id = Column(Integer, ForeignKey("exercises.id"), nullable=False)
    week_number = Column(Integer, nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    set_number = Column(Integer, nullable=False) # 1-indexed
    weight = Column(Float, nullable=False)
    reps = Column(Integer, nullable=False)
    rpe = Column(Integer, nullable=True, default=0)

    user = relationship("User", back_populates="lift_logs")
    exercise = relationship("Exercise", back_populates="lift_logs")


class DailyNutritionLog(Base):
    __tablename__ = "daily_nutrition_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    calories_consumed = Column(Integer, default=0)
    proteins_consumed = Column(Integer, default=0)
    carbs_consumed = Column(Integer, default=0)
    fats_consumed = Column(Integer, default=0)
    meals_completed = Column(String, default="{}") # JSON string, e.g. {"desayuno": true, "almuerzo": false}

    user = relationship("User", back_populates="nutrition_logs")
    __table_args__ = (UniqueConstraint('user_id', 'date', name='_user_nutrition_date_uc'),)


class WorkoutFeedback(Base):
    __tablename__ = "workout_feedbacks"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    date = Column(String, nullable=False) # YYYY-MM-DD
    routine_name = Column(String, nullable=False) # e.g. "Pecho, Hombro y Tríceps"
    effort_rating = Column(Integer, nullable=False) # 1 to 10
    mood_emoji = Column(String, nullable=False) # e.g. "💪", "😊", "🤕"
    notes = Column(String, nullable=True)

    user = relationship("User", back_populates="workout_feedbacks")


class Notification(Base):
    __tablename__ = "notifications"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    title = Column(String, nullable=False)
    message = Column(String, nullable=False)
    type = Column(String, nullable=False) # "routine" | "diet" | "chat" | "general"
    is_read = Column(Boolean, default=False)
    created_at = Column(String, nullable=False) # YYYY-MM-DD HH:MM:SS

    user = relationship("User", back_populates="notifications")


class ChatMessage(Base):
    __tablename__ = "chat_messages"

    id = Column(Integer, primary_key=True, index=True)
    sender_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    receiver_id = Column(Integer, ForeignKey("users.id"), nullable=False)
    message = Column(String, nullable=False)
    timestamp = Column(String, nullable=False) # YYYY-MM-DD HH:MM:SS
    is_read = Column(Boolean, default=False)

    sender = relationship("User", foreign_keys=[sender_id], back_populates="sent_messages")
    receiver = relationship("User", foreign_keys=[receiver_id], back_populates="received_messages")
