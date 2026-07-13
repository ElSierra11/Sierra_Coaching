const API_URL = import.meta.env.VITE_API_URL || "http://localhost:8000/api";

async function request(path, options = {}) {
  const url = `${API_URL}${path}`;
  const token = sessionStorage.getItem("gym_auth_token");
  const headers = {
    "Content-Type": "application/json",
    ...options.headers,
  };

  if (token) {
    headers["Authorization"] = `Bearer ${token}`;
  }

  const response = await fetch(url, {
    ...options,
    headers,
  });

  if (!response.ok) {
    let errorMessage = "Ocurrió un error en el servidor.";
    try {
      const errorData = await response.json();
      if (errorData.detail) {
        if (Array.isArray(errorData.detail)) {
          // Format FastAPI validation errors nicely
          errorMessage = errorData.detail
            .map(err => {
              const locStr = err.loc ? err.loc.join('.') : 'error';
              return `${locStr}: ${err.msg}`;
            })
            .join('\n');
        } else {
          errorMessage = errorData.detail;
        }
      }
    } catch (e) {
      // JSON parsing failed, use fallback
    }
    throw new Error(errorMessage);
  }

  return response.json();
}

export const api = {
  // Authentication
  login: async (email, password) => {
    return request("/auth/login", {
      method: "POST",
      body: JSON.stringify({ email, password }),
    });
  },

  register: async (name, email, password, height, initialWeight, target) => {
    return request("/auth/register", {
      method: "POST",
      body: JSON.stringify({
        name,
        email,
        password,
        height: parseFloat(height),
        initial_weight: parseFloat(initialWeight),
        target,
      }),
    });
  },

  // Coach Actions
  getClients: async () => {
    return request("/clients");
  },

  getClientDetail: async (clientId) => {
    return request(`/clients/${clientId}`);
  },

  updateClientRoutine: async (clientId, routines) => {
    return request(`/clients/${clientId}/routine`, {
      method: "PUT",
      body: JSON.stringify(routines),
    });
  },

  updateClientDiet: async (clientId, diet) => {
    return request(`/clients/${clientId}/diet`, {
      method: "PUT",
      body: JSON.stringify(diet),
    });
  },

  // Client Actions
  updateDailyHabits: async (clientId, habits) => {
    return request(`/clients/${clientId}/habits`, {
      method: "POST",
      body: JSON.stringify({
        water_cups: parseInt(habits.waterCups),
        sleep_hours: parseFloat(habits.sleepHours),
        cardio_done: !!habits.cardioDone,
        alcohol_avoided: !!habits.alcoholAvoided,
      }),
    });
  },

  logWeight: async (clientId, weight, date = null) => {
    return request(`/clients/${clientId}/weight`, {
      method: "POST",
      body: JSON.stringify({
        weight: parseFloat(weight),
        date: date || undefined,
      }),
    });
  },

  logMeasurements: async (clientId, measurements, date = null) => {
    return request(`/clients/${clientId}/measurements`, {
      method: "POST",
      body: JSON.stringify({
        waist: parseFloat(measurements.waist),
        hip: parseFloat(measurements.hip),
        thigh: parseFloat(measurements.thigh),
        date: date || undefined,
      }),
    });
  },

  addProgressPhoto: async (clientId, label, url, date = null) => {
    return request(`/clients/${clientId}/photos`, {
      method: "POST",
      body: JSON.stringify({
        label,
        url,
        date: date || undefined,
      }),
    });
  },

  logLiftBatch: async (clientId, exerciseId, weekNumber, sets, date = null) => {
    return request(`/clients/${clientId}/logs`, {
      method: "POST",
      body: JSON.stringify({
        exercise_id: parseInt(exerciseId),
        week_number: parseInt(weekNumber),
        date: date || undefined,
        sets: sets.map((s) => ({
          set_number: parseInt(s.set_number),
          weight: parseFloat(s.weight),
          reps: parseInt(s.reps),
          rpe: parseInt(s.rpe || 0),
        })),
      }),
    });
  },

  aiGeneratePlan: async (clientId, type, dayName = "Lunes", dayNumber = 1) => {
    return request("/coach/ai-generate", {
      method: "POST",
      body: JSON.stringify({
        client_id: parseInt(clientId),
        type,
        day_name: dayName,
        day_number: parseInt(dayNumber),
      }),
    });
  },

  getSetting: async (key) => {
    return request(`/settings/${key}`);
  },

  updateSetting: async (key, value) => {
    return request(`/settings/${key}`, {
      method: "POST",
      body: JSON.stringify({ value }),
    });
  },

  updateProfilePic: async (clientId, profilePic) => {
    return request(`/clients/${clientId}/profile-pic`, {
      method: "PUT",
      body: JSON.stringify({ profile_pic: profilePic }),
    });
  },

  chatWithAI: async (message, history = []) => {
    return request("/chat", {
      method: "POST",
      body: JSON.stringify({
        message,
        history: history.map((h) => ({
          role: h.role,
          text: h.text,
        })),
      }),
    });
  },

  // Nutrition & TDEE Actions
  saveTDEE: async (clientId, data) => {
    return request(`/clients/${clientId}/tdee`, {
      method: "POST",
      body: JSON.stringify({
        tdee: parseFloat(data.tdee),
        target_calories: parseInt(data.targetCalories),
        target_proteins: parseInt(data.targetProteins),
        target_carbs: parseInt(data.targetCarbs),
        target_fats: parseInt(data.targetFats),
        gender: data.gender,
        activity_level: data.activityLevel,
        age: parseInt(data.age),
      }),
    });
  },

  getTodayNutrition: async (clientId) => {
    return request(`/clients/${clientId}/nutrition/today`);
  },

  updateTodayNutrition: async (clientId, data) => {
    return request(`/clients/${clientId}/nutrition/today`, {
      method: "POST",
      body: JSON.stringify({
        calories_consumed: parseInt(data.calories_consumed),
        proteins_consumed: parseInt(data.proteins_consumed),
        carbs_consumed: parseInt(data.carbs_consumed),
        fats_consumed: parseInt(data.fats_consumed),
        meals_completed: data.meals_completed,
      }),
    });
  },

  // Workout Feedback Actions
  addWorkoutFeedback: async (clientId, data) => {
    return request(`/clients/${clientId}/workout-feedback`, {
      method: "POST",
      body: JSON.stringify({
        routine_name: data.routineName,
        effort_rating: parseInt(data.effortRating),
        mood_emoji: data.moodEmoji,
        notes: data.notes || "",
        date: data.date || undefined,
      }),
    });
  },

  getWorkoutFeedbackHistory: async (clientId) => {
    return request(`/clients/${clientId}/workout-feedback`);
  },

  // Notification Actions
  getNotifications: async () => {
    return request("/notifications");
  },

  markNotificationAsRead: async (notificationId) => {
    return request(`/notifications/${notificationId}/read`, {
      method: "PUT",
    });
  },

  markAllNotificationsAsRead: async () => {
    return request("/notifications/read-all", {
      method: "PUT",
    });
  },

  // Chat Actions
  getChatMessages: async (contactId) => {
    return request(`/chat/messages/${contactId}`);
  },

  sendChatMessage: async (receiverId, message) => {
    return request("/chat/messages", {
      method: "POST",
      body: JSON.stringify({
        receiver_id: parseInt(receiverId),
        message,
      }),
    });
  },

  getUnreadChatCounts: async () => {
    return request("/chat/unread-counts");
  },
};

