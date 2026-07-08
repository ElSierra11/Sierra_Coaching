import React, { useState, useEffect } from 'react';
import { api } from '../api';
import {
  Droplet, Moon, Flame, Ban, CheckCircle, AlertTriangle,
  Clock, Trophy, XCircle, Zap, Calendar, TrendingUp, BarChart2
} from 'lucide-react';

// --- Streak Counter Widget ---
function StreakWidget({ client }) {
  // Compute streak from habit_logs if they exist, otherwise simulate from seed data
  // We calculate consecutive days where all 4 habits are met
  const habitLogs = client.all_habit_logs || [];
  
  let streak = 0;
  if (habitLogs.length > 0) {
    // Sort descending by date
    const sorted = [...habitLogs].sort((a, b) => new Date(b.date) - new Date(a.date));
    for (const log of sorted) {
      const allDone = log.water_cups >= 8 && log.sleep_hours >= 7 && log.cardio_done && log.alcohol_avoided;
      if (allDone) streak++;
      else break;
    }
  } else {
    // Fallback: show a fixed demo streak of 5 for seeded data
    streak = 5;
  }

  const milestones = [3, 7, 14, 30, 60, 90];
  const nextMilestone = milestones.find(m => m > streak) || streak + 30;
  const pct = Math.min(100, (streak / nextMilestone) * 100);

  const getFlameColor = () => {
    if (streak >= 30) return 'text-red-400 drop-shadow-[0_0_12px_rgba(248,113,113,0.8)]';
    if (streak >= 14) return 'text-orange-400 drop-shadow-[0_0_12px_rgba(251,146,60,0.7)]';
    if (streak >= 7)  return 'text-yellow-400 drop-shadow-[0_0_12px_rgba(250,204,21,0.6)]';
    return 'text-neutral-400';
  };

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4 border-l-4 border-gymNeon">
      <div className="flex items-center justify-between">
        <div>
          <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Racha de Hábitos</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Días consecutivos cumplidos</h3>
        </div>
        <Flame className={`w-8 h-8 ${getFlameColor()} transition-all`} />
      </div>

      <div className="flex items-baseline gap-2">
        <span className="text-5xl font-black text-white">{streak}</span>
        <span className="text-neutral-400 text-sm font-bold">días</span>
      </div>

      {/* Progress bar toward next milestone */}
      <div>
        <div className="flex justify-between text-[10px] text-neutral-500 font-bold mb-1.5">
          <span>Progreso hacia {nextMilestone} días</span>
          <span>{streak}/{nextMilestone}</span>
        </div>
        <div className="w-full h-2 bg-white/5 rounded-full overflow-hidden">
          <div
            className="h-full bg-gymNeon rounded-full transition-all duration-700 shadow-[0_0_8px_rgba(255,87,34,0.5)]"
            style={{ width: `${pct}%` }}
          />
        </div>
      </div>

      <div className="flex gap-2 flex-wrap">
        {[3, 7, 14, 30].map(m => (
          <span
            key={m}
            className={`text-[9px] font-extrabold uppercase px-2 py-1 rounded-lg border ${
              streak >= m
                ? 'bg-gymNeon/10 border-gymNeon/40 text-gymNeon'
                : 'bg-white/[0.02] border-white/5 text-neutral-600'
            }`}
          >
            🏅 {m}d
          </span>
        ))}
      </div>
    </div>
  );
}

// --- Weekly Recap Widget ---
function WeeklyRecap({ client }) {
  const habitLogs = client.all_habit_logs || [];
  const today = new Date();
  const dayOfWeek = today.getDay(); // 0=Sun, 1=Mon...
  const startOfWeek = new Date(today);
  startOfWeek.setDate(today.getDate() - (dayOfWeek === 0 ? 6 : dayOfWeek - 1));

  // Filter logs from this week
  const thisWeekLogs = habitLogs.filter(log => {
    const logDate = new Date(log.date);
    return logDate >= startOfWeek && logDate <= today;
  });

  const daysWithData = thisWeekLogs.length || 1;
  const avgWater   = thisWeekLogs.length ? (thisWeekLogs.reduce((s, l) => s + (l.water_cups * 0.25), 0) / daysWithData).toFixed(1) : '—';
  const avgSleep   = thisWeekLogs.length ? (thisWeekLogs.reduce((s, l) => s + l.sleep_hours, 0) / daysWithData).toFixed(1) : '—';
  const cardioDays = thisWeekLogs.filter(l => l.cardio_done).length;
  const soberDays  = thisWeekLogs.filter(l => l.alcohol_avoided).length;

  const today_log = client.daily_habits_log || {};
  const currentAvgWater   = today_log.water_cups  ? ((today_log.water_cups * 0.25)).toFixed(1) : avgWater;
  const currentAvgSleep   = today_log.sleep_hours ? today_log.sleep_hours : avgSleep;
  const currentCardio     = today_log.cardio_done ? cardioDays : cardioDays;
  const currentSober      = today_log.alcohol_avoided ? soberDays : soberDays;

  const stats = [
    { label: 'Agua Promedio', value: `${currentAvgWater}L`, icon: Droplet, color: 'text-blue-400', bg: 'bg-blue-500/10' },
    { label: 'Sueño Promedio', value: `${currentAvgSleep}h`, icon: Moon, color: 'text-indigo-400', bg: 'bg-indigo-500/10' },
    { label: 'Días Cardio', value: `${currentCardio}/sem`, icon: Flame, color: 'text-orange-400', bg: 'bg-orange-500/10' },
    { label: 'Días Sobrio', value: `${currentSober}d`, icon: Trophy, color: 'text-green-400', bg: 'bg-green-500/10' },
  ];

  const dayNames = ['L', 'M', 'X', 'J', 'V', 'S', 'D'];
  const todayIdx = (dayOfWeek === 0 ? 6 : dayOfWeek - 1); // Monday=0

  return (
    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-5">
      <div className="flex items-center gap-3">
        <div className="bg-gymNeon/10 text-gymNeon p-2 rounded-xl border border-gymNeon/20">
          <BarChart2 className="w-5 h-5" />
        </div>
        <div>
          <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Resumen Semanal</span>
          <h3 className="text-sm font-bold text-white mt-0.5">Tu rendimiento esta semana</h3>
        </div>
      </div>

      {/* Days of week indicator */}
      <div className="flex gap-2">
        {dayNames.map((d, i) => (
          <div key={d} className={`flex-1 flex flex-col items-center gap-1`}>
            <span className="text-[9px] font-bold text-neutral-500 uppercase">{d}</span>
            <div className={`w-full h-1.5 rounded-full transition-all ${
              i < todayIdx ? 'bg-gymNeon' : i === todayIdx ? 'bg-gymNeon/60 animate-pulse' : 'bg-white/5'
            }`} />
          </div>
        ))}
      </div>

      {/* Stats grid */}
      <div className="grid grid-cols-2 gap-3">
        {stats.map(({ label, value, icon: Icon, color, bg }) => (
          <div key={label} className="bg-black/20 rounded-xl p-3 border border-white/5 flex items-center gap-3">
            <div className={`${bg} p-1.5 rounded-lg`}>
              <Icon className={`w-4 h-4 ${color}`} />
            </div>
            <div>
              <div className="text-[9px] text-neutral-500 font-bold uppercase">{label}</div>
              <div className="text-white text-sm font-extrabold">{value}</div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

// --- Main Dashboard Component ---
export default function Dashboard({ client, onUpdateClient, showToast, weeklyChallenge }) {
  const profile = client.profile || {};
  const habits = client.habits || { waterTarget: 3.0, sleepTarget: 8, cardioSessionsTarget: 4 };
  const dailyLog = client.daily_habits_log || { water_cups: 0, sleep_hours: 0.0, cardio_done: false, alcohol_avoided: true };

  const [saving, setSaving] = useState(false);

  // Get current weight from logs
  const currentWeight = client.weight_history && client.weight_history.length > 0
    ? client.weight_history[client.weight_history.length - 1].weight
    : profile.initial_weight || 0;

  // Habits update API handler
  const handleHabitChange = async (key, value) => {
    if (saving) return;
    setSaving(true);

    const updatedHabits = {
      waterCups:      key === 'water_cups'      ? value : dailyLog.water_cups,
      sleepHours:     key === 'sleep_hours'     ? value : dailyLog.sleep_hours,
      cardioDone:     key === 'cardio_done'     ? value : dailyLog.cardio_done,
      alcoholAvoided: key === 'alcohol_avoided' ? value : dailyLog.alcohol_avoided
    };

    try {
      const updatedLog = await api.updateDailyHabits(client.id, updatedHabits);
      onUpdateClient({ ...client, daily_habits_log: updatedLog });
      showToast("¡Hábito actualizado!", "success");
    } catch (err) {
      console.error("Error updating habits:", err);
      showToast("Error al guardar hábito en el servidor.", "error");
    } finally {
      setSaving(false);
    }
  };

  const handleWaterClick = (change) => {
    const newCups = Math.max(0, dailyLog.water_cups + change);
    handleHabitChange('water_cups', newCups);
  };

  const currentLiters = (dailyLog.water_cups * 0.25).toFixed(2);
  const waterProgressPct = Math.min(100, (currentLiters / habits.waterTarget) * 100);

  return (
    <div className="flex flex-col gap-6">
      {/* Weekly Challenge Banner */}
      {weeklyChallenge && (
        <div className="bg-gradient-to-r from-gymNeon/20 via-orange-500/10 to-transparent border border-gymNeon/30 p-5 rounded-2xl flex items-center gap-4 relative overflow-hidden shadow-lg animate-pulse">
          <div className="bg-gymNeon text-black p-2.5 rounded-xl flex items-center justify-center font-black">
            <Trophy className="w-5 h-5" />
          </div>
          <div>
            <span className="text-[9px] font-bold text-gymNeon uppercase tracking-widest block">Reto Semanal del Coach</span>
            <p className="text-white text-xs font-bold mt-1 leading-relaxed">{weeklyChallenge}</p>
          </div>
        </div>
      )}

      
      {/* 1. Client Stats Row */}
      <section className="glass-panel border-l-4 border-gymNeon p-6 rounded-2xl shadow-lg">
        <h3 className="text-sm font-bold text-white uppercase tracking-wider mb-4">Mi Perfil Físico</h3>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          <div className="flex flex-col gap-1 bg-black/20 p-3.5 rounded-xl border border-white/5">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Objetivo</span>
            <span className="text-white text-sm font-bold truncate" title={profile.target}>
              {profile.target || "Tonificar"}
            </span>
          </div>
          <div className="flex flex-col gap-1 bg-black/20 p-3.5 rounded-xl border border-white/5">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Estatura</span>
            <span className="text-white text-sm font-bold">{profile.height || 1.67} m</span>
          </div>
          <div className="flex flex-col gap-1 bg-black/20 p-3.5 rounded-xl border border-white/5">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Peso Inicial</span>
            <span className="text-white text-sm font-bold">{profile.initial_weight || 83} kg</span>
          </div>
          <div className="flex flex-col gap-1 bg-black/20 p-3.5 rounded-xl border border-white/5">
            <span className="text-neutral-500 text-[10px] font-bold uppercase tracking-wider">Peso Actual</span>
            <span className="text-gymNeon text-sm font-extrabold">
              {currentWeight} kg
            </span>
          </div>
        </div>
      </section>

      {/* 2. Streak + Weekly Recap Row */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        <StreakWidget client={client} />
        <WeeklyRecap client={client} />
      </div>

      {/* 3. Habits Dashboard Grid */}
      <h3 className="text-lg font-bold text-white uppercase tracking-wider mt-2">Rendimiento de Hábitos de Hoy</h3>
      
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-5">
        
        {/* WATER TRACKER */}
        <div className="glass-panel flex flex-col justify-between min-h-[280px] p-6 rounded-2xl shadow-lg relative group hover:border-gymNeon/25 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-blue-500/10 text-blue-400 w-11 h-11 rounded-xl flex items-center justify-center border border-blue-500/20">
              <Droplet className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Hidratación Diaria</h4>
              <p className="text-[10px] text-neutral-500">Meta: {habits.waterTarget}L ({habits.waterTarget * 4} vasos)</p>
            </div>
          </div>
          
          <div className="flex justify-center items-center my-4">
            <div className="w-24 h-24 rounded-full border border-white/5 relative overflow-hidden flex items-center justify-center bg-black/30">
              <div 
                className="absolute bottom-0 left-0 right-0 bg-blue-500/40 border-t border-blue-400 shadow-[0_0_10px_rgba(0,198,255,0.4)] transition-all duration-500" 
                style={{ height: `${waterProgressPct}%` }}
              ></div>
              <div className="relative z-10 flex flex-col items-center">
                <span className="text-xl font-extrabold text-white">{currentLiters}L</span>
                <span className="text-[8px] text-neutral-400 uppercase">de {habits.waterTarget}L</span>
              </div>
            </div>
          </div>

          <div className="flex justify-between items-center gap-2">
            <button 
              type="button" 
              onClick={() => handleWaterClick(-1)}
              className="bg-white/5 hover:bg-white/10 text-white font-bold border border-white/10 rounded-lg px-3 py-1.5 text-xs transition-all cursor-pointer"
            >
              -1 Vaso
            </button>
            <span className="text-white text-xs font-bold">{dailyLog.water_cups} vasos</span>
            <button 
              type="button" 
              onClick={() => handleWaterClick(1)}
              className="bg-blue-500 hover:bg-blue-400 text-black font-extrabold rounded-lg px-3 py-1.5 text-xs shadow-md transition-all cursor-pointer"
            >
              +1 Vaso
            </button>
          </div>
        </div>

        {/* SLEEP TRACKER */}
        <div className="glass-panel flex flex-col justify-between min-h-[280px] p-6 rounded-2xl shadow-lg group hover:border-gymNeon/25 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-indigo-500/10 text-indigo-400 w-11 h-11 rounded-xl flex items-center justify-center border border-indigo-500/20">
              <Moon className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Horas de Sueño</h4>
              <p className="text-[10px] text-neutral-500">Meta: {habits.sleepTarget} horas de descanso</p>
            </div>
          </div>

          <div className="flex flex-col items-center gap-3 w-full">
            <div className="text-4xl font-extrabold text-green-400 drop-shadow-[0_0_12px_rgba(0,255,102,0.3)]">
              {dailyLog.sleep_hours} <span className="text-xs text-neutral-400 font-normal">hrs</span>
            </div>
            <input 
              type="range" 
              min="0" 
              max="14" 
              step="0.5"
              value={dailyLog.sleep_hours}
              onChange={(e) => handleHabitChange('sleep_hours', parseFloat(e.target.value))}
              className="w-full h-1 bg-neutral-800 rounded-lg appearance-none cursor-pointer accent-gymNeon"
            />
            <div className="text-[10px] text-neutral-400 text-center leading-normal min-h-[30px] flex items-center justify-center gap-1">
              {dailyLog.sleep_hours >= habits.sleepTarget ? (
                <>
                  <CheckCircle className="w-3.5 h-3.5 text-green-400 flex-shrink-0" />
                  <span>Excelente descanso para tu sistema nervioso.</span>
                </>
              ) : (
                <>
                  <AlertTriangle className="w-3.5 h-3.5 text-amber-500 flex-shrink-0" />
                  <span>Dormir menos de lo indicado disminuye la recuperación muscular.</span>
                </>
              )}
            </div>
          </div>
        </div>

        {/* CARDIO TRACKER */}
        <div className="glass-panel flex flex-col justify-between min-h-[280px] p-6 rounded-2xl shadow-lg group hover:border-gymNeon/25 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-orange-500/10 text-orange-400 w-11 h-11 rounded-xl flex items-center justify-center border border-orange-500/20">
              <Flame className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cardio Completado</h4>
              <p className="text-[10px] text-neutral-500">Meta: 3-5 sesiones de 25-35 min</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-center w-full my-2">
            <span className="text-neutral-400 text-xs font-semibold">¿Hiciste cardio hoy?</span>
            <button 
              type="button"
              onClick={() => handleHabitChange('cardio_done', !dailyLog.cardio_done)}
              className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                dailyLog.cardio_done 
                  ? 'bg-gymNeon text-black shadow-[0_4px_12px_rgba(255,87,34,0.3)]' 
                  : 'bg-white/5 text-neutral-500 border border-white/10 hover:text-white'
              }`}
            >
              {dailyLog.cardio_done ? (
                <><Flame className="w-3.5 h-3.5" /><span>Sí, completado</span></>
              ) : (
                <><Clock className="w-3.5 h-3.5" /><span>No, pendiente</span></>
              )}
            </button>
          </div>
          <p className="text-[10px] text-neutral-500 text-center leading-normal border-t border-white/5 pt-3">
            El cardio ayuda a acelerar la quema de grasa y a mantener la salud cardiovascular activa.
          </p>
        </div>

        {/* ALCOHOL DISCIPLINE TRACKER */}
        <div className="glass-panel flex flex-col justify-between min-h-[280px] p-6 rounded-2xl shadow-lg group hover:border-gymNeon/25 transition-all duration-300">
          <div className="flex items-center gap-3">
            <div className="bg-red-500/10 text-red-400 w-11 h-11 rounded-xl flex items-center justify-center border border-red-500/20">
              <Ban className="w-5 h-5" />
            </div>
            <div>
              <h4 className="text-sm font-bold text-white">Cero Alcohol</h4>
              <p className="text-[10px] text-neutral-500">Regla de constancia fundamental</p>
            </div>
          </div>

          <div className="flex flex-col gap-3 items-center w-full my-2">
            <span className="text-neutral-400 text-xs font-semibold">¿Te mantuviste disciplinado hoy?</span>
            <button 
              type="button"
              onClick={() => handleHabitChange('alcohol_avoided', !dailyLog.alcohol_avoided)}
              className={`w-full py-3 rounded-lg font-bold text-xs uppercase tracking-wider border transition-all flex items-center justify-center gap-1.5 cursor-pointer ${
                dailyLog.alcohol_avoided 
                  ? 'bg-green-500/15 text-green-400 border-green-500/30' 
                  : 'bg-red-500/15 text-red-500 border-red-500/30'
              }`}
            >
              {dailyLog.alcohol_avoided ? (
                <><Trophy className="w-3.5 h-3.5" /><span>Sí, 100% disciplinado</span></>
              ) : (
                <><XCircle className="w-3.5 h-3.5" /><span>No, rompí regla</span></>
              )}
            </button>
          </div>
          <p className="text-[10px] text-neutral-500 text-center leading-normal border-t border-white/5 pt-3">
            El alcohol disminuye la síntesis proteica en un 30% y te deshidrata, arruinando la fuerza.
          </p>
        </div>

      </div>

    </div>
  );
}
