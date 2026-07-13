import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ClipboardList, Zap, Check, ChevronDown, Clock, Play, Search, ExternalLink, HelpCircle, X } from 'lucide-react';

export default function RoutineTracker({ client, onUpdateClient, showToast }) {
  const [activeDay, setActiveDay] = useState('Lunes');
  const [selectedWeek, setSelectedWeek] = useState(4); // default to current tracking week
  const [expandedExercise, setExpandedExercise] = useState(null);
  
  // Weights inputs state: key is `exerciseId_setNumber`
  const [inputs, setInputs] = useState({});
  const [savingExId, setSavingExId] = useState(null);

  // Rest Timer State
  const [timerSeconds, setTimerSeconds] = useState(0);
  const [initialSeconds, setInitialSeconds] = useState(90); // default to 90s
  const [timerActive, setTimerActive] = useState(false);

  // Video Modal State
  const [videoModal, setVideoModal] = useState({ isOpen: false, url: '', name: '', fallbackSearch: '' });

  // Workout Feedback State
  const [showFeedbackModal, setShowFeedbackModal] = useState(false);
  const [effortRating, setEffortRating] = useState(7);
  const [moodEmoji, setMoodEmoji] = useState("💪");
  const [feedbackNotes, setFeedbackNotes] = useState("");

  const getEffortLabel = (val) => {
    if (val <= 3) return "Muy suave";
    if (val <= 5) return "Moderado";
    if (val <= 7) return "Pesado";
    if (val <= 9) return "Muy pesado";
    return "Al fallo absoluto";
  };

  const handleSubmitFeedback = async () => {
    try {
      const response = await api.addWorkoutFeedback(client.id, {
        routineName: currentDayData.routine_name,
        effortRating,
        moodEmoji,
        notes: feedbackNotes
      });

      // Update client state globally
      const updatedFeedbacks = [response, ...(client.workout_feedbacks || [])];
      onUpdateClient({
        ...client,
        workout_feedbacks: updatedFeedbacks
      });

      showToast("¡Reporte de entrenamiento enviado a tu coach con éxito!", "success");
      setShowFeedbackModal(false);
      setFeedbackNotes("");
      setMoodEmoji("💪");
      setEffortRating(7);
    } catch (err) {
      showToast("Error al enviar reporte: " + err.message, "error");
    }
  };

  const getTechnicalVideo = (exercise) => {
    if (exercise.video_url && exercise.video_url.trim() !== '') {
      return exercise.video_url;
    }
    const name = exercise.name.toLowerCase();
    const mappings = [
      { keys: ["banca", "chest", "pecho"], url: "https://www.youtube.com/embed/gViDbVeeXpU" },
      { keys: ["sentadilla", "squat", "pierna"], url: "https://www.youtube.com/embed/yvD5_a6pI7M" },
      { keys: ["peso muerto", "deadlift"], url: "https://www.youtube.com/embed/r4MzxtBKyNE" },
      { keys: ["jalon", "espalda", "pulldown", "remo"], url: "https://www.youtube.com/embed/kK3hN7rQc34" },
      { keys: ["biceps", "curl"], url: "https://www.youtube.com/embed/ly7d1FmB4v8" },
      { keys: ["triceps", "extens", "copa"], url: "https://www.youtube.com/embed/sU1E2dG_dmo" },
      { keys: ["militar", "hombro", "press press"], url: "https://www.youtube.com/embed/xS6Kj6B5q3k" },
      { keys: ["zancada", "lung", "desplante"], url: "https://www.youtube.com/embed/COXYKsn949M" }
    ];
    for (const map of mappings) {
      if (map.keys.some(key => name.includes(key))) {
        return map.url;
      }
    }
    return null;
  };

  const formatEmbedUrl = (url) => {
    if (!url) return '';
    if (url.includes('youtube.com/embed/')) return url;
    if (url.includes('youtu.be/')) {
      const id = url.split('youtu.be/')[1]?.split('?')[0];
      return `https://www.youtube.com/embed/${id}`;
    }
    if (url.includes('youtube.com/watch')) {
      try {
        const urlParams = new URLSearchParams(url.split('?')[1]);
        const id = urlParams.get('v');
        return id ? `https://www.youtube.com/embed/${id}` : url;
      } catch (e) {
        return url;
      }
    }
    return url;
  };

  const calc1RM = (weight, reps) => {
    const w = parseFloat(weight);
    const r = parseInt(reps);
    if (isNaN(w) || isNaN(r) || r <= 0) return 0;
    return Math.round(w * (1 + r / 30) * 10) / 10;
  };

  const playTickBeep = (frequency, duration) => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const osc = audioCtx.createOscillator();
      const gainNode = audioCtx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      gainNode.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gainNode.gain.exponentialRampToValueAtTime(0.0001, audioCtx.currentTime + duration);
      osc.connect(gainNode);
      gainNode.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      console.warn("Tick Audio blocked:", e);
    }
  };

  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => {
          const nextSec = prev - 1;
          if (nextSec > 0 && nextSec <= 3) {
            playTickBeep(600, 0.08);
          }
          return nextSec;
        });
      }, 1000);
    } else if (timerActive && timerSeconds === 0) {
      setTimerActive(false);
      triggerRestEndNotification();
    }
    return () => clearInterval(interval);
  }, [timerActive, timerSeconds]);

  const toggleTimer = () => {
    if (timerActive) {
      setTimerActive(false);
    } else {
      setTimerSeconds(timerSeconds > 0 ? timerSeconds : initialSeconds);
      setTimerActive(true);
    }
  };

  const playBeep = () => {
    try {
      const audioCtx = new (window.AudioContext || window.webkitAudioContext)();
      const playSingleBeep = (time, duration, frequency) => {
        const osc = audioCtx.createOscillator();
        const gainNode = audioCtx.createGain();
        osc.type = 'sine';
        osc.frequency.setValueAtTime(frequency, time);
        gainNode.gain.setValueAtTime(0.15, time);
        gainNode.gain.exponentialRampToValueAtTime(0.0001, time + duration);
        osc.connect(gainNode);
        gainNode.connect(audioCtx.destination);
        osc.start(time);
        osc.stop(time + duration);
      };
      
      const now = audioCtx.currentTime;
      playSingleBeep(now, 0.15, 880);
      playSingleBeep(now + 0.25, 0.15, 880);
      playSingleBeep(now + 0.5, 0.4, 1000);
    } catch (e) {
      console.warn("Audio Context blocked:", e);
    }
  };

  const triggerRestEndNotification = () => {
    playBeep();
    showToast("¡Tiempo de descanso terminado! Siguiente serie a darle con todo.", "info");
  };

  const days = ['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'];
  const routine = client.routines || {};
  const currentDayData = routine.find(r => r.day_name === activeDay) || { routine_name: "Sin rutina", exercises: [] };

  const handleInputChange = (exerciseId, setNumber, field, value) => {
    setInputs(prev => ({
      ...prev,
      [`${exerciseId}_${setNumber}_${field}`]: value
    }));
  };

  // Save lift logs to server
  const handleSaveLift = async (exercise) => {
    setSavingExId(exercise.id);
    const setsData = [];
    
    for (let s = 1; s <= exercise.sets; s++) {
      const weight = inputs[`${exercise.id}_${s}_weight`];
      const reps = inputs[`${exercise.id}_${s}_reps`];
      const rpe = inputs[`${exercise.id}_${s}_rpe`];
      
      if (weight && reps) {
        setsData.push({
          set_number: s,
          weight: parseFloat(weight),
          reps: parseInt(reps),
          rpe: parseInt(rpe || 8)
        });
      }
    }

    if (setsData.length < exercise.sets) {
      showToast(`Por favor ingresa los datos para las ${exercise.sets} series.`, "error");
      setSavingExId(null);
      return;
    }

    try {
      const newLogs = await api.logLiftBatch(client.id, exercise.id, selectedWeek, setsData);
      
      // Update lift logs in local client state
      // Filter out old logs for this client, exercise and week, then append new ones
      const cleanedLogs = (client.lift_logs || []).filter(
        log => !(log.exercise_id === exercise.id && log.week_number === selectedWeek)
      );

      onUpdateClient({
        ...client,
        lift_logs: [...cleanedLogs, ...newLogs]
      });

      showToast("¡Pesos registrados con éxito!", "success");
      
      // Auto-trigger rest timer
      setTimerSeconds(initialSeconds);
      setTimerActive(true);
      showToast(`Descanso de ${Math.floor(initialSeconds / 60)}:${(initialSeconds % 60).toString().padStart(2, '0')} iniciado de forma automática.`, "info");
    } catch (err) {
      console.error(err);
      showToast("Error al guardar pesos: " + err.message, "error");
    } finally {
      setSavingExId(null);
    }
  };

  // Helper to fetch log for a specific exercise, week, and set
  const getLiftLog = (exerciseId, weekNum, setNum) => {
    return (client.lift_logs || []).find(
      log => log.exercise_id === exerciseId && log.week_number === weekNum && log.set_number === setNum
    );
  };

  // Progressive overload checker
  // Returns object: { trigger: boolean, prevWeight: number }
  const checkProgressiveOverload = (exercise) => {
    const prevWeek = selectedWeek - 1;
    if (prevWeek <= 0) return { trigger: false };

    const prevWeekLogs = [];
    for (let s = 1; s <= exercise.sets; s++) {
      const log = getLiftLog(exercise.id, prevWeek, s);
      if (log) prevWeekLogs.push(log);
    }

    // If they completed all sets last week, and hit 10 or more reps in EVERY set
    if (prevWeekLogs.length === exercise.sets) {
      const allSetsHitTen = prevWeekLogs.every(log => log.reps >= 10);
      if (allSetsHitTen) {
        return {
          trigger: true,
          prevWeight: prevWeekLogs[0].weight
        };
      }
    }

    return { trigger: false };
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Week Selector & Day Tabs */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Plan de Entrenamiento</h3>
          <p className="text-neutral-500 text-xs mt-0.5">Controla tu sobrecarga progresiva semana tras semana.</p>
        </div>
        
        <div className="flex items-center gap-3 bg-neutral-900/60 border border-white/5 rounded-xl px-3 py-1.5">
          <span className="text-neutral-400 text-xs font-bold uppercase tracking-wider">Semana Activa:</span>
          <select 
            value={selectedWeek} 
            onChange={(e) => setSelectedWeek(parseInt(e.target.value))}
            className="bg-black/40 border border-white/10 rounded px-2 py-1 text-sm font-bold text-gymNeon focus:outline-none w-24"
          >
            <option value={1}>Semana 1</option>
            <option value={2}>Semana 2</option>
            <option value={3}>Semana 3</option>
            <option value={4}>Semana 4</option>
            <option value={5}>Semana 5</option>
            <option value={6}>Semana 6</option>
          </select>
        </div>
      </div>

      {/* Rest Timer Panel */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-gradient-to-r from-gymNeon/15 via-gymCoral/5 to-transparent border border-white/5 shadow-[0_0_20px_rgba(255,94,58,0.06)]">
        <div className="flex items-center gap-3">
          <div className="bg-gymNeon/10 text-gymNeon w-11 h-11 rounded-xl flex items-center justify-center border border-gymNeon/25">
            <Clock className="w-5 h-5 animate-pulse text-gymNeon" />
          </div>
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider">Temporizador de Descanso</h4>
            <p className="text-[10px] text-neutral-400 mt-0.5">Controla tus descansos entre series para maximizar hipertrofia.</p>
          </div>
        </div>

        <div className="flex items-center gap-4">
          <div className="text-3xl font-black text-gymNeon tabular-nums bg-black/40 px-4 py-2 rounded-xl border border-white/5 shadow-inner">
            {timerSeconds > 0 ? (
              <>
                {Math.floor(timerSeconds / 60)}:{(timerSeconds % 60).toString().padStart(2, '0')}
              </>
            ) : (
              <>
                {Math.floor(initialSeconds / 60)}:{(initialSeconds % 60).toString().padStart(2, '0')}
              </>
            )}
          </div>

          <div className="flex items-center gap-2">
            <select
              value={initialSeconds}
              onChange={(e) => {
                const secs = parseInt(e.target.value);
                setInitialSeconds(secs);
                if (!timerActive) setTimerSeconds(secs);
              }}
              disabled={timerActive}
              className="bg-black/40 border border-white/10 rounded-lg px-2.5 py-2 text-xs font-bold text-neutral-300 focus:outline-none disabled:opacity-50"
            >
              <option value={30}>30s</option>
              <option value={45}>45s</option>
              <option value={60}>1:00 min</option>
              <option value={90}>1:30 min</option>
              <option value={120}>2:00 min</option>
              <option value={180}>3:00 min</option>
            </select>

            <button
              onClick={toggleTimer}
              className={`px-4 py-2 rounded-lg text-xs font-extrabold uppercase tracking-wider shadow cursor-pointer transition-all ${
                timerActive 
                  ? 'bg-red-500/20 text-red-400 border border-red-500/30' 
                  : 'bg-gymNeon text-black'
              }`}
            >
              {timerActive ? 'Detener' : 'Iniciar'}
            </button>
          </div>
        </div>
      </div>

      {/* Days Tabs selector */}
      <div className="flex bg-neutral-900/50 rounded-2xl p-1 border border-white/5 overflow-x-auto no-scrollbar gap-1">
        {days.map(day => {
          const dayRoutine = routine.find(r => r.day_name === day) || { routine_name: "Sin rutina" };
          return (
            <button
              key={day}
              onClick={() => {
                setActiveDay(day);
                setExpandedExercise(null);
              }}
              className={`flex-1 shrink-0 min-w-[100px] text-center py-3 rounded-xl transition-all cursor-pointer ${
                activeDay === day 
                  ? 'bg-gymNeon text-black font-extrabold shadow-md' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <div className="text-xs font-bold">{day}</div>
              <div className={`text-[9px] uppercase tracking-tighter truncate max-w-[120px] mx-auto mt-0.5 ${
                activeDay === day ? 'text-black/70' : 'text-neutral-600'
              }`}>
                {dayRoutine.routine_name}
              </div>
            </button>
          );
        })}
      </div>

      {/* Routine Title Banner */}
      <div className="glass-panel p-4 rounded-xl flex justify-between items-center bg-white/[0.01]">
        <div>
          <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Rutina del Día</span>
          <h4 className="text-base font-extrabold text-white uppercase">{currentDayData.routine_name}</h4>
        </div>
        <span className="text-xs text-neutral-500 font-bold bg-neutral-900 border border-white/5 px-3 py-1.5 rounded-lg">
          {currentDayData.exercises.length} Ejercicios
        </span>
      </div>

      {/* Exercises list */}
      <div className="flex flex-col gap-4">
        {currentDayData.exercises.length === 0 ? (
          <div className="text-center p-12 text-neutral-500 border border-dashed border-white/10 rounded-2xl">
            No hay ejercicios asignados para este día.
          </div>
        ) : (
          currentDayData.exercises.map((ex, idx) => {
            const isExpanded = expandedExercise === ex.id;
            const overload = checkProgressiveOverload(ex);
            
            // Check if there is already a log for today (current selected week)
            const currentWeekLogs = [];
            let loggedToday = false;
            for (let s = 1; s <= ex.sets; s++) {
              const log = getLiftLog(ex.id, selectedWeek, s);
              if (log) currentWeekLogs.push(log);
            }
            if (currentWeekLogs.length === ex.sets) {
              loggedToday = true;
            }

            return (
              <div 
                key={ex.id}
                className={`glass-panel rounded-2xl overflow-hidden transition-all ${
                  isExpanded ? 'border-gymNeon/30 ring-1 ring-gymNeon/15' : ''
                }`}
              >
                {/* Exercise main header row */}
                <div 
                  onClick={() => setExpandedExercise(isExpanded ? null : ex.id)}
                  className="p-5 flex justify-between items-center cursor-pointer hover:bg-white/[0.01] transition-all select-none"
                >
                  <div className="flex items-center gap-4">
                    <div className="w-8 h-8 rounded-lg bg-neutral-900 border border-white/10 flex items-center justify-center font-extrabold text-sm text-gymNeon">
                      {idx + 1}
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <h5 className="text-sm font-bold text-white leading-normal">{ex.name}</h5>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            const videoUrl = getTechnicalVideo(ex);
                            const embedUrl = formatEmbedUrl(videoUrl);
                            setVideoModal({
                              isOpen: true,
                              url: embedUrl,
                              name: ex.name,
                              fallbackSearch: `https://www.youtube.com/results?search_query=tecnica+${encodeURIComponent(ex.name)}`
                            });
                          }}
                          className="w-5.5 h-5.5 rounded-full bg-gymNeon/10 hover:bg-gymNeon/30 text-gymNeon flex items-center justify-center transition-all cursor-pointer border border-gymNeon/25"
                          title="Ver video de técnica"
                        >
                          <Play className="w-2.5 h-2.5 fill-gymNeon text-gymNeon" />
                        </button>
                      </div>
                      <div className="flex items-center gap-2 mt-1">
                        <span className="bg-gymNeon/10 text-gymNeon text-[9px] font-bold px-2 py-0.5 rounded border border-gymNeon/10">
                          {ex.sets}x{ex.reps}
                        </span>
                        {ex.notes && (
                          <span className="flex items-center gap-1 text-[10px] text-neutral-500 truncate max-w-[200px]" title={ex.notes}>
                            <ClipboardList className="w-3.5 h-3.5 text-neutral-600 flex-shrink-0" />
                            <span>{ex.notes}</span>
                          </span>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="flex items-center gap-3">
                    {overload.trigger && (
                      <span className="animate-pulse bg-gymNeon text-black text-[9px] font-extrabold px-2 py-1 rounded-full uppercase tracking-wider flex items-center gap-1">
                        <Zap className="w-2.5 h-2.5 fill-black" />
                        <span>Sobrecarga</span>
                      </span>
                    )}
                    {loggedToday && (
                      <span className="text-[10px] text-green-400 bg-green-500/10 border border-green-500/20 rounded-lg px-2.5 py-1 font-bold flex items-center gap-1">
                        <Check className="w-3.5 h-3.5" />
                        <span>Registrado</span>
                      </span>
                    )}
                    <ChevronDown 
                      className={`w-5 h-5 text-neutral-400 transition-all duration-300 ${isExpanded ? 'transform rotate-180 text-gymNeon' : ''}`}
                    />
                  </div>
                </div>

                {/* Progressive Overload Banner */}
                {isExpanded && overload.trigger && (
                  <div className="mx-5 mb-2 bg-gymNeon/10 text-gymNeon border border-gymNeon/30 p-3.5 rounded-xl text-xs leading-normal flex items-start gap-2">
                    <Zap className="w-4 h-4 text-gymNeon flex-shrink-0 mt-0.5 fill-gymNeon/30" />
                    <div>
                      <strong>¡Sobrecarga Progresiva Activada!</strong> La semana anterior controlaste el peso máximo ({overload.prevWeight} kg) haciendo las 10 repeticiones requeridas en todas tus series. En esta sesión, <strong>aumenta la carga</strong> (+1kg a +2.5kg) o mejora la intensidad.
                    </div>
                  </div>
                )}

                {/* Expanded logger drawer */}
                {isExpanded && (
                  <div className="border-t border-white/5 bg-black/20 p-5 flex flex-col gap-4">
                    <div className="overflow-x-auto">
                      <table className="w-full text-left text-xs">
                        <thead>
                          <tr className="text-neutral-500 border-b border-white/5 pb-2">
                            <th className="pb-2 font-bold uppercase tracking-wider w-16 whitespace-nowrap">Serie</th>
                            <th className="pb-2 font-bold uppercase tracking-wider whitespace-nowrap">Semana Anterior ({selectedWeek - 1})</th>
                            <th className="pb-2 font-bold uppercase tracking-wider w-24 whitespace-nowrap">Peso (kg)</th>
                            <th className="pb-2 font-bold uppercase tracking-wider w-20 whitespace-nowrap">Reps</th>
                            <th className="pb-2 font-bold uppercase tracking-wider w-20 whitespace-nowrap">RPE</th>
                            <th className="pb-2 font-bold uppercase tracking-wider w-20 text-right whitespace-nowrap">1RM Est.</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Array.from({ length: ex.sets }).map((_, sIdx) => {
                            const setNum = sIdx + 1;
                            const prevLog = getLiftLog(ex.id, selectedWeek - 1, setNum);
                            const currentLog = getLiftLog(ex.id, selectedWeek, setNum);

                            const currentWeightVal = inputs[`${ex.id}_${setNum}_weight`] || (currentLog ? currentLog.weight : '');
                            const currentRepsVal = inputs[`${ex.id}_${setNum}_reps`] || (currentLog ? currentLog.reps : '');

                            return (
                              <tr key={setNum}>
                                <td className="py-3 font-bold text-neutral-400">Set {setNum}</td>
                                <td className="py-3">
                                  {prevLog ? (
                                    <span className="text-white font-medium">
                                      {prevLog.weight} kg x {prevLog.reps} {prevLog.rpe ? `@RPE${prevLog.rpe}` : ''}
                                    </span>
                                  ) : (
                                    <span className="text-neutral-600 italic">Sin registro</span>
                                  )}
                                </td>
                                <td className="py-2 pr-2">
                                  <input 
                                    type="number" 
                                    step="0.5"
                                    placeholder={currentLog ? String(currentLog.weight) : prevLog ? String(prevLog.weight) : "0"}
                                    value={inputs[`${ex.id}_${setNum}_weight`] || ''}
                                    onChange={(e) => handleInputChange(ex.id, setNum, 'weight', e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-gymNeon focus:outline-none w-20"
                                  />
                                </td>
                                <td className="py-2 pr-2">
                                  <input 
                                    type="number" 
                                    placeholder={currentLog ? String(currentLog.reps) : prevLog ? "10" : "8"}
                                    value={inputs[`${ex.id}_${setNum}_reps`] || ''}
                                    onChange={(e) => handleInputChange(ex.id, setNum, 'reps', e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-gymNeon focus:outline-none w-16"
                                  />
                                </td>
                                <td className="py-2 pr-2">
                                  <input 
                                    type="number" 
                                    min="1"
                                    max="10"
                                    placeholder={currentLog ? String(currentLog.rpe || 8) : "8"}
                                    value={inputs[`${ex.id}_${setNum}_rpe`] || ''}
                                    onChange={(e) => handleInputChange(ex.id, setNum, 'rpe', e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-gymNeon focus:outline-none w-16"
                                  />
                                </td>
                                <td className="py-2 text-right font-extrabold text-gymNeon">
                                  {calc1RM(currentWeightVal, currentRepsVal) > 0 
                                    ? `${calc1RM(currentWeightVal, currentRepsVal)} kg` 
                                    : '—'}
                                </td>
                              </tr>
                            );
                          })}
                        </tbody>
                      </table>
                    </div>

                    <button 
                      type="button"
                      disabled={savingExId === ex.id}
                      onClick={() => handleSaveLift(ex)}
                      className="w-full sm:w-auto self-end bg-gymNeon text-black font-extrabold uppercase py-2 px-6 rounded-lg text-xs tracking-wider shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 cursor-pointer"
                    >
                      {savingExId === ex.id ? 'Guardando...' : 'Registrar Pesos de Hoy'}
                    </button>
                  </div>
                )}
              </div>
            );
          })
        )}
      </div>

      {/* Botón de Finalizar Entrenamiento */}
      {currentDayData.exercises && currentDayData.exercises.length > 0 && (
        <div className="mt-8 flex justify-center border-t border-white/5 pt-6">
          <button
            type="button"
            onClick={() => setShowFeedbackModal(true)}
            className="w-full sm:w-auto bg-green-500 hover:bg-green-600 text-white font-extrabold uppercase py-3 px-8 rounded-xl text-xs tracking-wider shadow-[0_4px_15px_rgba(34,197,94,0.25)] hover:opacity-90 active:scale-95 transition-all cursor-pointer flex items-center justify-center gap-2"
          >
            <Check className="w-4 h-4 text-white" />
            <span>Finalizar Entrenamiento de Hoy</span>
          </button>
        </div>
      )}

      {/* Feedback Modal */}
      {showFeedbackModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-sm p-4 animate-scale-in">
          <div className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-md flex flex-col gap-4 relative bg-gymDark-900">
            <button 
              type="button"
              onClick={() => setShowFeedbackModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-800 border border-white/5 p-1.5 rounded-lg transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="pb-2 border-b border-white/5">
              <h4 className="text-sm font-bold text-white uppercase tracking-wider">¿Cómo te sentiste hoy?</h4>
              <p className="text-[10px] text-neutral-500 mt-0.5">Reporta tus sensaciones del entrenamiento a tu coach.</p>
            </div>

            <div className="flex flex-col gap-4">
              {/* Esfuerzo (RPE) Slider */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-400 font-bold uppercase flex justify-between">
                  <span>Nivel de Esfuerzo</span>
                  <span className="text-gymNeon font-extrabold">{effortRating}/10 ({getEffortLabel(effortRating)})</span>
                </label>
                <input 
                  type="range" 
                  min="1" 
                  max="10" 
                  value={effortRating}
                  onChange={(e) => setEffortRating(parseInt(e.target.value))}
                  className="w-full accent-gymNeon h-1 bg-white/5 rounded-lg appearance-none cursor-pointer"
                />
              </div>

              {/* Estado de Ánimo (Emojis) */}
              <div className="flex flex-col gap-2">
                <label className="text-[10px] text-neutral-400 font-bold uppercase">Estado de Ánimo</label>
                <div className="grid grid-cols-5 gap-2">
                  {[
                    { emoji: "💪", label: "Fuerte" },
                    { emoji: "😊", label: "Bien" },
                    { emoji: "🥵", label: "Exhausto" },
                    { emoji: "😴", label: "Cansado" },
                    { emoji: "🤕", label: "Dolor" }
                  ].map((item) => (
                    <button
                      key={item.emoji}
                      type="button"
                      onClick={() => setMoodEmoji(item.emoji)}
                      className={`py-2 rounded-xl border text-xl flex flex-col items-center gap-1 transition-all cursor-pointer ${
                        moodEmoji === item.emoji 
                          ? 'border-gymNeon bg-gymNeon/15 text-white' 
                          : 'border-white/5 bg-black/20 text-neutral-500 hover:text-white'
                      }`}
                    >
                      <span>{item.emoji}</span>
                      <span className="text-[8px] font-semibold">{item.label}</span>
                    </button>
                  ))}
                </div>
              </div>

              {/* Comentarios / Notas */}
              <div className="flex flex-col gap-1.5">
                <label className="text-[10px] text-neutral-400 font-bold uppercase">Notas para tu Coach</label>
                <textarea 
                  value={feedbackNotes}
                  onChange={(e) => setFeedbackNotes(e.target.value)}
                  placeholder="Ej: Sentí un poco de molestia en la rodilla izquierda, pero pude terminar todas las series..."
                  rows="3"
                  className="bg-black/30 border border-white/10 rounded-xl p-3 text-xs text-white placeholder-neutral-500 focus:outline-none focus:border-gymNeon transition-all resize-none"
                />
              </div>
            </div>

            <button 
              type="button"
              onClick={handleSubmitFeedback}
              className="bg-gymNeon hover:bg-gymNeon/90 text-black font-extrabold uppercase py-3 rounded-xl text-xs tracking-wider transition-all mt-2 cursor-pointer flex justify-center items-center gap-1.5"
            >
              <Check className="w-4 h-4" />
              <span>Enviar Reporte de Sesión</span>
            </button>
          </div>
        </div>
      )}

      {/* Video Guide Modal */}
      {videoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-slide-in">
          <div className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col bg-gymDark-900">
            {/* Modal Header */}
            <div className="p-4 flex justify-between items-center border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Play className="w-4 h-4 text-gymNeon fill-gymNeon" />
                <span>Técnica: {videoModal.name}</span>
              </h3>
              <button
                onClick={() => setVideoModal({ isOpen: false, url: '', name: '', fallbackSearch: '' })}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            {/* Modal Content */}
            <div className="p-5 flex flex-col gap-4">
              {videoModal.url ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-black">
                  <iframe
                    src={videoModal.url}
                    title={`Video técnica ${videoModal.name}`}
                    className="absolute inset-0 w-full h-full"
                    allowFullScreen
                    allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                  ></iframe>
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                  <HelpCircle className="w-10 h-10 text-neutral-500" />
                  <p className="text-xs text-neutral-400 max-w-sm">
                    No hay video predeterminado para este ejercicio ni el coach ha subido una demostración específica.
                  </p>
                </div>
              )}
              
              <div className="flex justify-between items-center mt-2 border-t border-white/5 pt-4">
                <span className="text-[10px] text-neutral-500">Sierra Coaching Técnica</span>
                <a
                  href={videoModal.fallbackSearch}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center gap-1.5 bg-gymNeon text-black font-extrabold uppercase text-[10px] tracking-wider px-4 py-2.5 rounded-lg shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                >
                  <Search className="w-3.5 h-3.5" />
                  <span>Buscar técnica en YouTube</span>
                  <ExternalLink className="w-3 h-3 ml-0.5" />
                </a>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
