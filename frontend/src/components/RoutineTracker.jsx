import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { ClipboardList, Zap, Check, ChevronDown, Clock } from 'lucide-react';

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

  useEffect(() => {
    let interval = null;
    if (timerActive && timerSeconds > 0) {
      interval = setInterval(() => {
        setTimerSeconds(prev => prev - 1);
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
      
      if (weight && reps) {
        setsData.push({
          set_number: s,
          weight: parseFloat(weight),
          reps: parseInt(reps)
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
      <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-center gap-4 bg-gymNeon/5 border-gymNeon/20 shadow-lg">
        <div className="flex items-center gap-3">
          <div className="bg-gymNeon/10 text-gymNeon w-11 h-11 rounded-xl flex items-center justify-center border border-gymNeon/20">
            <Clock className="w-5 h-5 animate-pulse" />
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
              className={`flex-1 min-w-[100px] text-center py-3 rounded-xl transition-all cursor-pointer ${
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
                      <h5 className="text-sm font-bold text-white leading-normal">{ex.name}</h5>
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
                            <th className="pb-2 font-bold uppercase tracking-wider w-16">Serie</th>
                            <th className="pb-2 font-bold uppercase tracking-wider">Semana Anterior ({selectedWeek - 1})</th>
                            <th className="pb-2 font-bold uppercase tracking-wider w-32">Peso Hoy (kg)</th>
                            <th className="pb-2 font-bold uppercase tracking-wider w-32">Repes Hoy</th>
                          </tr>
                        </thead>
                        <tbody className="divide-y divide-white/5">
                          {Array.from({ length: ex.sets }).map((_, sIdx) => {
                            const setNum = sIdx + 1;
                            const prevLog = getLiftLog(ex.id, selectedWeek - 1, setNum);
                            const currentLog = getLiftLog(ex.id, selectedWeek, setNum);

                            return (
                              <tr key={setNum}>
                                <td className="py-3 font-bold text-neutral-400">Set {setNum}</td>
                                <td className="py-3">
                                  {prevLog ? (
                                    <span className="text-white font-medium">
                                      {prevLog.weight} kg x {prevLog.reps} repes
                                    </span>
                                  ) : (
                                    <span className="text-neutral-600 italic">Sin registro</span>
                                  )}
                                </td>
                                <td className="py-2 pr-4">
                                  <input 
                                    type="number" 
                                    step="0.5"
                                    placeholder={currentLog ? String(currentLog.weight) : prevLog ? String(prevLog.weight) : "0"}
                                    value={inputs[`${ex.id}_${setNum}_weight`] || ''}
                                    onChange={(e) => handleInputChange(ex.id, setNum, 'weight', e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-gymNeon focus:outline-none w-24"
                                  />
                                </td>
                                <td className="py-2">
                                  <input 
                                    type="number" 
                                    placeholder={currentLog ? String(currentLog.reps) : prevLog ? "10" : "8"}
                                    value={inputs[`${ex.id}_${setNum}_reps`] || ''}
                                    onChange={(e) => handleInputChange(ex.id, setNum, 'reps', e.target.value)}
                                    className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:border-gymNeon focus:outline-none w-20"
                                  />
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

    </div>
  );
}
