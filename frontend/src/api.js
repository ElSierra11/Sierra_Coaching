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
        })),
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
};

