from pydantic import BaseModel, EmailStr
from typing import List, Optional

# --- Authentication schemas ---
class UserLogin(BaseModel):
    email: EmailStr
    password: str

class UserRegister(BaseModel):
    email: EmailStr
    password: str
    name: str
    height: float
    initial_weight: float
    target: str

class UserResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    coach_id: Optional[int] = None

    class Config:
        from_attributes = True


class LoginResponse(BaseModel):
    token: str
    user: UserResponse



# --- Habits schemas ---
class DailyHabitLogBase(BaseModel):
    water_cups: int
    sleep_hours: float
    cardio_done: bool
    alcohol_avoided: bool

class DailyHabitLogCreate(DailyHabitLogBase):
    date: str

class DailyHabitLogResponse(DailyHabitLogBase):
    id: int
    user_id: int
    date: str

    class Config:
        from_attributes = True


# --- Routine & Exercise schemas ---
class ExerciseBase(BaseModel):
    name: str
    sets: int
    reps: str
    notes: Optional[str] = ""
    video_url: Optional[str] = ""

class ExerciseCreate(ExerciseBase):
    pass

class ExerciseResponse(ExerciseBase):
    id: int
    routine_day_id: int
    order: int

    class Config:
        from_attributes = True

class RoutineDayResponse(BaseModel):
    id: int
    day_name: str
    routine_name: str
    exercises: List[ExerciseResponse] = []

    class Config:
        from_attributes = True

class RoutineDayUpdate(BaseModel):
    routine_name: str
    exercises: List[ExerciseCreate]

class ExerciseUpdate(BaseModel):
    id: Optional[int] = None
    routine_day_id: Optional[int] = None
    name: str
    sets: int
    reps: str
    notes: Optional[str] = ""
    video_url: Optional[str] = ""
    order: Optional[int] = None

class RoutineDayUpdatePayload(BaseModel):
    id: int
    day_name: str
    routine_name: str
    exercises: List[ExerciseUpdate] = []


# --- Diet schemas ---
class DietMealBase(BaseModel):
    desayuno: str
    almuerzo: str
    cena: str
    merienda: str
    calories: Optional[int] = 0
    proteins: Optional[int] = 0
    carbs: Optional[int] = 0
    fats: Optional[int] = 0

class DietMealResponse(DietMealBase):
    id: int
    day_number: int

    class Config:
        from_attributes = True

class DietMealUpdate(DietMealBase):
    pass


# --- Weight & Measurements logs schemas ---
class WeightLogCreate(BaseModel):
    weight: float
    date: Optional[str] = None # defaults to current date if empty

class WeightLogResponse(BaseModel):
    id: int
    date: str
    weight: float

    class Config:
        from_attributes = True

class MeasurementLogCreate(BaseModel):
    waist: float
    hip: float
    thigh: float
    date: Optional[str] = None

class MeasurementLogResponse(BaseModel):
    id: int
    date: str
    waist: float
    hip: float
    thigh: float

    class Config:
        from_attributes = True


# --- Progress photos schemas ---
class ProgressPhotoCreate(BaseModel):
    label: str
    url: str
    date: Optional[str] = None

class ProgressPhotoResponse(BaseModel):
    id: int
    date: str
    label: str
    url: str

    class Config:
        from_attributes = True


# --- Lift logs (Progressive Overload) schemas ---
class LiftLogItem(BaseModel):
    set_number: int
    weight: float
    reps: int
    rpe: Optional[int] = 0

class LiftLogCreateBatch(BaseModel):
    exercise_id: int
    week_number: int
    date: Optional[str] = None
    sets: List[LiftLogItem]

class LiftLogResponse(BaseModel):
    id: int
    exercise_id: int
    week_number: int
    date: str
    set_number: int
    weight: float
    reps: int
    rpe: Optional[int] = 0

    class Config:
        from_attributes = True


# --- TDEE schemas ---
class TDEESaveRequest(BaseModel):
    tdee: float
    target_calories: int
    target_proteins: int
    target_carbs: int
    target_fats: int
    gender: str
    activity_level: str
    age: int


# --- Daily Nutrition schemas ---
class DailyNutritionLogBase(BaseModel):
    calories_consumed: int
    proteins_consumed: int
    carbs_consumed: int
    fats_consumed: int
    meals_completed: str

class DailyNutritionLogResponse(DailyNutritionLogBase):
    id: int
    user_id: int
    date: str

    class Config:
        from_attributes = True


# --- Workout Feedback schemas ---
class WorkoutFeedbackCreate(BaseModel):
    routine_name: str
    effort_rating: int
    mood_emoji: str
    notes: Optional[str] = ""
    date: Optional[str] = None

class WorkoutFeedbackResponse(BaseModel):
    id: int
    user_id: int
    date: str
    routine_name: str
    effort_rating: int
    mood_emoji: str
    notes: Optional[str] = ""

    class Config:
        from_attributes = True


# --- Notification schemas ---
class NotificationResponse(BaseModel):
    id: int
    user_id: int
    title: str
    message: str
    type: str
    is_read: bool
    created_at: str

    class Config:
        from_attributes = True


# --- Chat Message schemas ---
class ChatMessageCreate(BaseModel):
    receiver_id: int
    message: str

class ChatMessageResponse(BaseModel):
    id: int
    sender_id: int
    receiver_id: int
    message: str
    timestamp: str
    is_read: bool

    class Config:
        from_attributes = True

class ChatUnreadCountResponse(BaseModel):
    sender_id: int
    unread_count: int


# --- Full Client Info ---
class ClientProfileResponse(BaseModel):
    height: float
    initial_weight: float
    target: str
    joined_date: str
    profile_pic: Optional[str] = ""
    tdee: Optional[float] = None
    target_calories: Optional[int] = None
    target_proteins: Optional[int] = None
    target_carbs: Optional[int] = None
    target_fats: Optional[int] = None
    gender: Optional[str] = None
    activity_level: Optional[str] = None
    age: Optional[int] = None

    class Config:
        from_attributes = True

class ClientDetailResponse(BaseModel):
    id: int
    email: EmailStr
    name: str
    role: str
    profile: Optional[ClientProfileResponse] = None
    daily_habits_log: Optional[DailyHabitLogBase] = None # today's habits
    routines: List[RoutineDayResponse] = []
    diet: List[DietMealResponse] = []
    weight_history: List[WeightLogResponse] = []
    measurements_history: List[MeasurementLogResponse] = []
    progress_photos: List[ProgressPhotoResponse] = []
    lift_logs: List[LiftLogResponse] = []
    all_habit_logs: List[DailyHabitLogResponse] = []
    notifications: List[NotificationResponse] = []
    workout_feedbacks: List[WorkoutFeedbackResponse] = []
    today_nutrition_log: Optional[DailyNutritionLogResponse] = None

    class Config:
        from_attributes = True


class SystemSettingResponse(BaseModel):
    key: str
    value: str

    class Config:
        from_attributes = True


class SystemSettingUpdate(BaseModel):
    value: str


class ProfilePicUpdate(BaseModel):
    profile_pic: str


class AIGenerateRequest(BaseModel):
    client_id: int
    type: str # "routine" | "diet"
    day_name: Optional[str] = "Lunes"
    day_number: Optional[int] = 1


class ChatMessage(BaseModel):
    role: str # "user" | "model"
    text: str


class ChatRequest(BaseModel):
    message: str
    history: List[ChatMessage] = []


class AICalculateMacrosRequest(BaseModel):
    desayuno: Optional[str] = ""
    almuerzo: Optional[str] = ""
    cena: Optional[str] = ""
    merienda: Optional[str] = ""


