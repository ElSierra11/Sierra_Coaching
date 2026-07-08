import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Trash2, Users, AlertCircle, CheckCircle2, FileDown, TrendingDown, TrendingUp } from 'lucide-react';

export default function CoachAdmin({ showToast }) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [allClientsDetail, setAllClientsDetail] = useState([]);
  const [loadingAllClients, setLoadingAllClients] = useState(false);
  
  const [adminTab, setAdminTab] = useState('summary'); // 'overview' | 'summary' | 'routine' | 'diet'
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit Routine state
  const [routineDay, setRoutineDay] = useState('Lunes');
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editExercises, setEditExercises] = useState([]); // List of { name, sets, reps, notes }

  // Edit Diet state
  const [editDiet, setEditDiet] = useState([]); // Copy of client's diet array

  const [saving, setSaving] = useState(false);
  const [challengeText, setChallengeText] = useState("");

  // Load clients list on mount
  useEffect(() => {
    fetchClients();
    fetchChallenge();
  }, []);

  const fetchChallenge = async () => {
    try {
      const res = await api.getSetting("weekly_challenge");
      setChallengeText(res.value);
    } catch (e) {
      console.error("Error fetching challenge:", e);
    }
  };

  const handleSaveChallenge = async () => {
    try {
      await api.updateSetting("weekly_challenge", challengeText);
      showToast("¡Reto semanal publicado!", "success");
    } catch (err) {
      showToast("Error al publicar reto: " + err.message, "error");
    }
  };

  const fetchClients = async () => {
    setLoadingList(true);
    try {
      const data = await api.getClients();
      setClients(data);
      if (data.length > 0 && !selectedClientId) {
        setSelectedClientId(data[0].id);
      }
      setLoadingAllClients(true);
      const details = await Promise.all(data.map(c => api.getClientDetail(c.id).catch(() => null)));
      setAllClientsDetail(details.filter(Boolean));
      setLoadingAllClients(false);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  // Load client detail when selection changes
  useEffect(() => {
    if (selectedClientId) {
      fetchClientDetail(selectedClientId);
    }
  }, [selectedClientId]);

  const fetchClientDetail = async (id) => {
    setLoadingDetail(true);
    try {
      const data = await api.getClientDetail(id);
      setSelectedClient(data);
      
      // Initialize edit diet state
      setEditDiet(JSON.parse(JSON.stringify(data.diet || [])));
      
      // Initialize edit routine state for Lunes
      const dayData = (data.routines || []).find(r => r.day_name === 'Lunes') || { routine_name: '', exercises: [] };
      setRoutineDay('Lunes');
      setEditRoutineName(dayData.routine_name);
      setEditExercises(JSON.parse(JSON.stringify(dayData.exercises || [])));

    } catch (err) {
      console.error(err);
      showToast("Error al cargar detalles del alumno.", "error");
    } finally {
      setLoadingDetail(false);
    }
  };

  // Handle day switch in Routine editor
  const handleRoutineDayChange = (day) => {
    if (!selectedClient) return;
    setRoutineDay(day);
    const dayData = (selectedClient.routines || []).find(r => r.day_name === day) || { routine_name: '', exercises: [] };
    setEditRoutineName(dayData.routine_name);
    setEditExercises(JSON.parse(JSON.stringify(dayData.exercises || [])));
  };

  // Routine editing actions
  const handleAddExercise = () => {
    setEditExercises(prev => [
      ...prev,
      { id: 'new_' + Date.now() + Math.random(), name: '', sets: 4, reps: '8-10', notes: '' }
    ]);
  };

  const handleRemoveExercise = (idx) => {
    setEditExercises(prev => prev.filter((_, i) => i !== idx));
  };

  const handleExerciseChange = (idx, field, value) => {
    setEditExercises(prev => {
      const copy = [...prev];
      copy[idx] = {
        ...copy[idx],
        [field]: value
      };
      return copy;
    });
  };

  // Save modified Routine back to server
  const handleSaveRoutine = async () => {
    if (saving || !selectedClient) return;
    setSaving(true);

    // Build payload for all routines, keeping unchanged days as they were
    const updatedRoutines = (selectedClient.routines || []).map(r => {
      if (r.day_name === routineDay) {
        return {
          ...r,
          routine_name: editRoutineName,
          exercises: editExercises.map((e, idx) => ({
            name: e.name,
            sets: parseInt(e.sets) || 0,
            reps: e.reps,
            notes: e.notes,
            order: idx
          }))
        };
      }
      return r;
    });

    try {
      const res = await api.updateClientRoutine(selectedClient.id, updatedRoutines);
      setSelectedClient(prev => ({
        ...prev,
        routines: res
      }));
      showToast("¡Rutina de " + routineDay + " guardada correctamente!", "success");
    } catch (err) {
      showToast("Error al guardar rutina: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Diet editing actions
  const handleDietMealChange = (dayNum, field, value) => {
    setEditDiet(prev => {
      return prev.map(meal => {
        if (meal.day_number === dayNum) {
          return {
            ...meal,
            [field]: value
          };
        }
        return meal;
      });
    });
  };

  // Save modified Diet back to server
  const handleSaveDiet = async () => {
    if (saving || !selectedClient) return;
    setSaving(true);

    try {
      const res = await api.updateClientDiet(selectedClient.id, editDiet);
      setSelectedClient(prev => ({
        ...prev,
        diet: res
      }));
      showToast("¡Dieta guardada con éxito!", "success");
    } catch (err) {
      showToast("Error al guardar dieta: " + err.message, "error");
    } finally {
      setSaving(false);
    }
  };

  // Fetch client logs info
  const latestWeight = selectedClient?.weight_history && selectedClient.weight_history.length > 0
    ? selectedClient.weight_history[selectedClient.weight_history.length - 1].weight
    : selectedClient?.profile?.initial_weight || 0;

  // PDF Export helper: prints a formatted HTML report in a new window
  const handleExportPDF = () => {
    if (!selectedClient) return;
    const c = selectedClient;
    const profile = c.profile || {};
    const weightHistory = c.weight_history || [];
    const measurements = c.measurements_history || [];
    const latestW = weightHistory.length > 0 ? weightHistory[weightHistory.length - 1].weight : profile.initial_weight;
    const firstW = profile.initial_weight || latestW;
    const weightDelta = ((latestW - firstW) || 0).toFixed(1);
    const latestM = measurements.length > 0 ? measurements[measurements.length - 1] : null;
    const firstM = measurements.length > 0 ? measurements[0] : null;

    let html = `<html><head><title>Reporte de Progreso - ${c.name}</title>
    <style>body{font-family:Arial,sans-serif;max-width:700px;margin:30px auto;color:#111;font-size:13px;}h1{color:#ff5722;font-size:22px;border-bottom:3px solid #ff5722;padding-bottom:8px;}h2{color:#333;font-size:15px;margin-top:20px;border-left:4px solid #ff5722;padding-left:10px;}table{width:100%;border-collapse:collapse;margin-top:10px;}th{background:#ff5722;color:white;padding:8px;text-align:left;font-size:11px;}td{padding:7px;border-bottom:1px solid #eee;font-size:12px;}.badge{display:inline-block;padding:3px 10px;border-radius:20px;font-size:11px;font-weight:bold;background:#ff5722;color:white;}.delta-neg{color:green;font-weight:bold;}.delta-pos{color:red;font-weight:bold;}.footer{margin-top:40px;font-size:10px;color:#aaa;border-top:1px solid #eee;padding-top:10px;}</style></head><body>
    <h1>Reporte de Progreso - Sierra Coaching</h1>
    <p><strong>Alumno:</strong> ${c.name} &nbsp;|&nbsp; <strong>Email:</strong> ${c.email}</p>
    <p><strong>Objetivo:</strong> ${profile.target || 'N/A'} &nbsp;|&nbsp; <strong>Estatura:</strong> ${profile.height || 'N/A'} m</p>
    <p><strong>Peso Inicial:</strong> ${firstW} kg &nbsp;|&nbsp; <strong>Peso Actual:</strong> <span class="badge">${latestW} kg</span> &nbsp;|&nbsp; <strong>Variacion:</strong> <span class="${weightDelta <= 0 ? 'delta-neg' : 'delta-pos'}">${weightDelta > 0 ? '+' : ''}${weightDelta} kg</span></p>
    <h2>Historial de Peso</h2>
    <table><tr><th>Fecha</th><th>Peso (kg)</th><th>Variacion</th></tr>`;
    weightHistory.forEach((w, i) => {
      const prev = i > 0 ? weightHistory[i-1].weight : w.weight;
      const delta = (w.weight - prev).toFixed(1);
      html += `<tr><td>${w.date}</td><td>${w.weight} kg</td><td class="${delta <= 0 ? 'delta-neg' : 'delta-pos'}">${i > 0 ? (delta > 0 ? '+' : '') + delta + ' kg' : '—'}</td></tr>`;
    });
    html += `</table>`;
    if (measurements.length > 0) {
      html += `<h2>Historial de Medidas</h2><table><tr><th>Fecha</th><th>Cintura (cm)</th><th>Cadera (cm)</th><th>Muslo (cm)</th></tr>`;
      measurements.forEach(m => {
        html += `<tr><td>${m.date}</td><td>${m.waist}</td><td>${m.hip}</td><td>${m.thigh}</td></tr>`;
      });
      html += `</table>`;
      if (latestM && firstM) {
        html += `<p><strong>Evolucion cintura:</strong> ${firstM.waist}cm &rarr; <strong>${latestM.waist}cm</strong></p>`;
      }
    }
    html += `<div class="footer">Reporte generado por Sierra Coaching App &middot; ${new Date().toLocaleDateString('es-CO')}</div></body></html>`;
    const w = window.open('', '_blank');
    w.document.write(html);
    w.document.close();
    w.print();
    showToast("Reporte generado correctamente.", "success");
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-4 gap-6">
      
      {/* 1. LEFT COLUMN: CLIENTS LIST */}
      <div className="glass-panel p-5 rounded-2xl shadow-lg flex flex-col gap-4 self-start">
        <h3 className="text-xs font-bold text-white uppercase tracking-wider">Mis Alumnos</h3>
        
        {loadingList ? (
          <div className="text-center py-8 text-neutral-500 text-xs">Cargando alumnos...</div>
        ) : (
          <div className="flex flex-col gap-2">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className={`w-full text-left p-3.5 rounded-xl transition-all border ${
                  selectedClientId === c.id
                    ? 'bg-gymNeon text-black border-gymNeon font-bold'
                    : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                }`}
              >
                <div className="text-sm">{c.name}</div>
                <div className={`text-[10px] ${selectedClientId === c.id ? 'text-black/60' : 'text-neutral-500'}`}>{c.email}</div>
              </button>
            ))}
          </div>
        )}
      </div>

      {/* 2. RIGHT COLUMN: ADMIN WORKSPACE */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {selectedClient ? (
          <>
            {/* Top Workspace Header */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4 bg-white/[0.01]">
              <div>
                <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Ficha del Alumno</span>
                <h2 className="text-lg font-extrabold text-white">{selectedClient.name}</h2>
              </div>
              
              {/* Workspace tabs switcher */}
              <div className="flex flex-col sm:flex-row gap-2 items-start sm:items-center">
                <div className="overflow-x-auto -mx-1 px-1">
                  <div className="flex bg-neutral-900 border border-white/5 rounded-xl p-1 gap-1 min-w-max">
                  <button
                    onClick={() => setAdminTab('overview')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      adminTab === 'overview' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Vista General
                  </button>
                  <button
                    onClick={() => setAdminTab('summary')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      adminTab === 'summary' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Resumen
                  </button>
                  <button
                    onClick={() => setAdminTab('routine')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      adminTab === 'routine' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Editar Rutina
                  </button>
                  <button
                    onClick={() => setAdminTab('diet')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      adminTab === 'diet' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Editar Dieta
                  </button>
                  <button
                    onClick={() => setAdminTab('business')}
                    className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all ${
                      adminTab === 'business' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                    }`}
                  >
                    Negocio & Retos
                  </button>
                </div>
              </div>
                {selectedClient && (
                  <button
                    onClick={handleExportPDF}
                    className="flex items-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase px-3 py-2 rounded-xl transition-all cursor-pointer ml-auto"
                  >
                    <FileDown className="w-3.5 h-3.5 text-gymNeon" />
                    <span>Exportar PDF</span>
                  </button>
                )}
              </div>
            </div>

            {loadingDetail ? (
              <div className="glass-panel p-16 text-center text-neutral-500 text-xs rounded-2xl">
                Cargando detalles de {selectedClient.name}...
              </div>
            ) : (
              <>
                {/* VIEW 0: OVERVIEW TAB */}
                {adminTab === 'overview' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex items-center gap-2">
                      <Users className="w-4 h-4 text-gymNeon" />
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Vista General — Todos los Alumnos</h4>
                    </div>
                    {loadingAllClients ? (
                      <div className="text-center py-12 text-neutral-500 text-xs">Cargando datos de todos los alumnos...</div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {allClientsDetail.map(cd => {
                          const latestW = cd.weight_history?.length > 0
                            ? cd.weight_history[cd.weight_history.length - 1].weight
                            : cd.profile?.initial_weight || 0;
                          const initialW = cd.profile?.initial_weight || latestW;
                          const delta = (latestW - initialW).toFixed(1);
                          const todayLog = cd.daily_habits_log || {};
                          const habitsToday = [todayLog.water_cups > 0, todayLog.sleep_hours > 0, todayLog.cardio_done, todayLog.alcohol_avoided];
                          const habitScore = habitsToday.filter(Boolean).length;
                          const isInactive = todayLog.water_cups === 0 && todayLog.sleep_hours === 0 && !todayLog.cardio_done;
                          return (
                            <div
                              key={cd.id}
                              className={`glass-panel p-5 rounded-2xl flex flex-col gap-3 cursor-pointer hover:border-gymNeon/30 transition-all border-l-4 ${
                                isInactive ? 'border-l-red-500/70' : 'border-l-gymNeon'
                              }`}
                              onClick={() => { setSelectedClientId(cd.id); setAdminTab('summary'); }}
                            >
                              <div className="flex justify-between items-start">
                                <div>
                                  <div className="text-sm font-extrabold text-white">{cd.name}</div>
                                  <div className="text-[10px] text-neutral-500">{cd.email}</div>
                                </div>
                                {isInactive ? (
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-red-400 bg-red-500/10 border border-red-500/20 px-2 py-1 rounded-full">
                                    <AlertCircle className="w-3 h-3" /> Sin actividad hoy
                                  </span>
                                ) : (
                                  <span className="flex items-center gap-1 text-[9px] font-bold text-green-400 bg-green-500/10 border border-green-500/20 px-2 py-1 rounded-full">
                                    <CheckCircle2 className="w-3 h-3" /> Activo hoy
                                  </span>
                                )}
                              </div>
                              <div className="grid grid-cols-3 gap-2">
                                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                                  <div className="text-[9px] text-neutral-500 font-bold uppercase">Peso Actual</div>
                                  <div className="text-white font-extrabold text-sm mt-0.5">{latestW} kg</div>
                                </div>
                                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                                  <div className="text-[9px] text-neutral-500 font-bold uppercase">Variación</div>
                                  <div className={`font-extrabold text-sm mt-0.5 flex items-center justify-center gap-1 ${
                                    delta <= 0 ? 'text-green-400' : 'text-red-400'
                                  }`}>
                                    {delta <= 0 ? <TrendingDown className="w-3 h-3" /> : <TrendingUp className="w-3 h-3" />}
                                    {delta > 0 ? '+' : ''}{delta} kg
                                  </div>
                                </div>
                                <div className="bg-black/30 rounded-xl p-3 text-center border border-white/5">
                                  <div className="text-[9px] text-neutral-500 font-bold uppercase">Hábitos Hoy</div>
                                  <div className={`font-extrabold text-sm mt-0.5 ${
                                    habitScore >= 3 ? 'text-gymNeon' : habitScore >= 1 ? 'text-yellow-400' : 'text-red-400'
                                  }`}>{habitScore}/4</div>
                                </div>
                              </div>
                              <div className="flex gap-1.5 flex-wrap">
                                {[
                                  { label: 'Agua',   done: todayLog.water_cups > 0 },
                                  { label: 'Sueño',  done: todayLog.sleep_hours > 0 },
                                  { label: 'Cardio', done: todayLog.cardio_done },
                                  { label: 'Sobrio', done: todayLog.alcohol_avoided },
                                ].map(h => (
                                  <span key={h.label} className={`text-[9px] font-bold px-2 py-0.5 rounded-full border ${
                                    h.done
                                      ? 'bg-gymNeon/10 text-gymNeon border-gymNeon/30'
                                      : 'bg-white/[0.02] text-neutral-600 border-white/5'
                                  }`}>{h.label}</span>
                                ))}
                              </div>
                              <div className="text-[9px] text-neutral-600 text-right">Click para ver detalles →</div>
                            </div>
                          );
                        })}
                      </div>
                    )}
                  </div>
                )}

                {/* VIEW 1: SUMMARY TAB */}
                {adminTab === 'summary' && (
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                    {/* General physical metrics */}
                    <div className="glass-panel p-6 rounded-2xl md:col-span-3 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Métricas de Progreso</h4>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/25 p-4 rounded-xl border border-white/5">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase">Objetivo</div>
                          <div className="text-white text-sm font-bold mt-1">{selectedClient.profile?.target}</div>
                        </div>
                        <div className="bg-black/25 p-4 rounded-xl border border-white/5">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase">Estatura</div>
                          <div className="text-white text-sm font-bold mt-1">{selectedClient.profile?.height} m</div>
                        </div>
                        <div className="bg-black/25 p-4 rounded-xl border border-white/5">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase">Peso de Partida</div>
                          <div className="text-white text-sm font-bold mt-1">{selectedClient.profile?.initial_weight} kg</div>
                        </div>
                        <div className="bg-black/25 p-4 rounded-xl border border-white/5">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase">Peso Último Registro</div>
                          <div className="text-gymNeon text-sm font-extrabold mt-1">{latestWeight} kg</div>
                        </div>
                      </div>
                    </div>

                    {/* Weight and measurements logs */}
                    <div className="glass-panel p-6 rounded-2xl md:col-span-2 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Historial Corporal</h4>
                      <div className="flex flex-col gap-3">
                        <div className="text-xs font-bold text-neutral-400">Peso Semanal:</div>
                        <div className="flex flex-wrap gap-2">
                          {(selectedClient.weight_history || []).map((w, idx) => (
                            <div key={idx} className="bg-black/30 border border-white/5 px-3 py-2 rounded-lg text-xs">
                              <span className="text-neutral-500 block text-[9px] font-bold">{w.date}</span>
                              <span className="text-white font-bold">{w.weight} kg</span>
                            </div>
                          ))}
                        </div>

                        <div className="text-xs font-bold text-neutral-400 mt-2">Medidas de Cintura / Cadera / Muslo:</div>
                        <div className="flex flex-col gap-2">
                          {(selectedClient.measurements_history || []).map((m, idx) => (
                            <div key={idx} className="bg-black/30 border border-white/5 p-3 rounded-lg text-xs flex justify-between">
                              <span className="text-neutral-400 font-bold">{m.date}</span>
                              <span className="text-neutral-300">Cintura: <strong className="text-white font-medium">{m.waist}cm</strong></span>
                              <span className="text-neutral-300">Cadera: <strong className="text-white font-medium">{m.hip}cm</strong></span>
                              <span className="text-neutral-300">Muslo: <strong className="text-white font-medium">{m.thigh}cm</strong></span>
                            </div>
                          ))}
                        </div>
                      </div>
                    </div>

                    {/* Progress photos list */}
                    <div className="glass-panel p-6 rounded-2xl flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Fotos Subidas</h4>
                      <div className="flex flex-col gap-3 overflow-y-auto max-h-[280px]">
                        {(selectedClient.progress_photos || []).map((p, idx) => (
                          <div key={idx} className="relative rounded-lg overflow-hidden aspect-video border border-white/5">
                            <img src={p.url} className="w-full h-full object-cover" alt={p.label} />
                            <div className="absolute inset-0 bg-gradient-to-t from-black/80 to-transparent p-2.5 flex flex-col justify-end">
                              <span className="text-[10px] font-bold text-white">{p.label}</span>
                              <span className="text-[8px] text-neutral-400">{p.date}</span>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  </div>
                )}

                {/* VIEW 2: ROUTINE EDITOR TAB */}
                {adminTab === 'routine' && (
                  <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-5">
                    
                    {/* Day selector tabs */}
                    <div className="flex bg-neutral-900 border border-white/5 rounded-xl p-1 overflow-x-auto gap-1">
                      {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'].map(d => (
                        <button
                          key={d}
                          onClick={() => handleRoutineDayChange(d)}
                          className={`flex-1 min-w-[70px] text-center py-2 rounded-lg text-xs font-semibold transition-all ${
                            routineDay === d ? 'bg-gymNeon text-black font-extrabold' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>

                    {/* Routine day name input */}
                    <div className="flex flex-col gap-2">
                      <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Nombre / Grupo Muscular de la Rutina</label>
                      <input
                        type="text"
                        placeholder="Ej. Pecho, Hombro y Tríceps"
                        value={editRoutineName}
                        onChange={(e) => setEditRoutineName(e.target.value)}
                        className="bg-black/30 border border-white/10 rounded-lg text-xs text-white px-4 py-2.5"
                      />
                    </div>

                    {/* Exercises editor */}
                    <div className="flex flex-col gap-3">
                      <div className="flex justify-between items-center border-b border-white/5 pb-2">
                        <label className="text-xs font-bold text-neutral-400 uppercase tracking-wide">Ejercicios</label>
                        <button
                          type="button"
                          onClick={handleAddExercise}
                          className="bg-white/5 hover:bg-white/10 text-white font-bold border border-white/15 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider"
                        >
                          + Añadir Ejercicio
                        </button>
                      </div>

                      <div className="flex flex-col gap-3 max-h-[350px] overflow-y-auto pr-1">
                        {editExercises.length === 0 ? (
                          <div className="text-center py-8 text-neutral-500 text-xs italic">
                            No hay ejercicios agregados para esta rutina.
                          </div>
                        ) : (
                          editExercises.map((ex, idx) => (
                            <div key={ex.id || idx} className="bg-black/20 p-4 rounded-xl border border-white/5 flex gap-4 items-end">
                              <div className="flex-1 grid grid-cols-1 sm:grid-cols-4 gap-3">
                                <div className="sm:col-span-2 flex flex-col gap-1">
                                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Nombre del Ejercicio</span>
                                  <input
                                    type="text"
                                    placeholder="Press Inclinado con Mancuernas"
                                    value={ex.name}
                                    onChange={(e) => handleExerciseChange(idx, 'name', e.target.value)}
                                    className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Series (Sets)</span>
                                  <input
                                    type="number"
                                    placeholder="4"
                                    value={ex.sets}
                                    onChange={(e) => handleExerciseChange(idx, 'sets', e.target.value)}
                                    className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                                  />
                                </div>
                                <div className="flex flex-col gap-1">
                                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Repes (Reps)</span>
                                  <input
                                    type="text"
                                    placeholder="8-10"
                                    value={ex.reps}
                                    onChange={(e) => handleExerciseChange(idx, 'reps', e.target.value)}
                                    className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                                  />
                                </div>
                                <div className="sm:col-span-4 flex flex-col gap-1">
                                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Notas / Instrucciones Especiales</span>
                                  <input
                                    type="text"
                                    placeholder="Ej. Dropset en última serie / controlando la negativa"
                                    value={ex.notes || ''}
                                    onChange={(e) => handleExerciseChange(idx, 'notes', e.target.value)}
                                    className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                                  />
                                </div>
                              </div>

                              <button
                                type="button"
                                onClick={() => handleRemoveExercise(idx)}
                                className="bg-red-500/10 hover:bg-red-500/20 text-red-500 border border-red-500/20 rounded p-2.5 cursor-pointer flex items-center justify-center"
                                title="Eliminar Ejercicio"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            </div>
                          ))
                        )}
                      </div>
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveRoutine}
                      className="bg-gymNeon text-black font-extrabold uppercase text-xs tracking-wider py-2.5 px-6 rounded-lg self-end shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : `Guardar Rutina de ${routineDay}`}
                    </button>
                  </div>
                )}

                {/* VIEW 3: DIET EDITOR TAB */}
                {adminTab === 'diet' && (
                  <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-5">
                    <h4 className="text-xs font-bold text-white uppercase tracking-wider border-b border-white/5 pb-2">Editar Menú de Alimentación (7 Días)</h4>
                    
                    <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
                      {editDiet.map((meal) => (
                        <div key={meal.day_number} className="bg-black/20 p-5 rounded-xl border border-white/5 flex flex-col gap-4">
                          <span className="text-xs font-extrabold text-gymNeon uppercase tracking-widest">Día {meal.day_number}</span>
                          
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Opción Desayuno</span>
                              <textarea
                                value={meal.desayuno}
                                onChange={(e) => handleDietMealChange(meal.day_number, 'desayuno', e.target.value)}
                                rows="2"
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white w-full"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Opción Almuerzo</span>
                              <textarea
                                value={meal.almuerzo}
                                onChange={(e) => handleDietMealChange(meal.day_number, 'almuerzo', e.target.value)}
                                rows="2"
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white w-full"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Opción Cena</span>
                              <textarea
                                value={meal.cena}
                                onChange={(e) => handleDietMealChange(meal.day_number, 'cena', e.target.value)}
                                rows="2"
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white w-full"
                              />
                            </div>
                            <div className="flex flex-col gap-1.5">
                              <span className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Opción Merienda</span>
                              <textarea
                                value={meal.merienda}
                                onChange={(e) => handleDietMealChange(meal.day_number, 'merienda', e.target.value)}
                                rows="2"
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white w-full"
                              />
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>

                    <button
                      type="button"
                      disabled={saving}
                      onClick={handleSaveDiet}
                      className="bg-gymNeon text-black font-extrabold uppercase text-xs tracking-wider py-2.5 px-6 rounded-lg self-end shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50"
                    >
                      {saving ? 'Guardando...' : 'Guardar Dieta Completa'}
                    </button>
                  </div>
                )}
                {/* VIEW 4: BUSINESS & CHALLENGES TAB */}
                {adminTab === 'business' && (
                  <div className="flex flex-col gap-6">
                    {/* Business KPI Cards */}
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
                      <div className="glass-panel p-5 rounded-2xl border-l-4 border-gymNeon bg-white/[0.01]">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Alumnos Activos</span>
                        <div className="text-3xl font-black text-white mt-1">{clients.length}</div>
                        <p className="text-[10px] text-neutral-400 mt-2">Monitoreados en tiempo real</p>
                      </div>
                      
                      <div className="glass-panel p-5 rounded-2xl border-l-4 border-green-500 bg-white/[0.01]">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Ingresos Estimados</span>
                        <div className="text-3xl font-black text-white mt-1">${(clients.length * 50000).toLocaleString('es-CO')} COP</div>
                        <p className="text-[10px] text-neutral-400 mt-2">Basado en $50.000 COP/mes por alumno</p>
                      </div>

                      <div className="glass-panel p-5 rounded-2xl border-l-4 border-indigo-500 bg-white/[0.01]">
                        <span className="text-[10px] font-bold text-neutral-500 uppercase tracking-widest">Tasa de Retención</span>
                        <div className="text-3xl font-black text-white mt-1">100%</div>
                        <p className="text-[10px] text-neutral-400 mt-2">Últimos 30 días</p>
                      </div>
                    </div>

                    {/* Challenges configuration editor */}
                    <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-4">
                      <div>
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Publicar Reto Semanal</h4>
                        <p className="text-[10px] text-neutral-500 mt-0.5">Este reto aparecerá destacado al tope del dashboard de todos tus alumnos.</p>
                      </div>
                      
                      <div className="flex flex-col gap-2">
                        <textarea
                          value={challengeText}
                          onChange={(e) => setChallengeText(e.target.value)}
                          rows="3"
                          placeholder="Ej. ¡Esta semana prohibido fallar un solo día de cardio y 3L de agua diarios! 🔥"
                          className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-3.5 focus:outline-none focus:border-gymNeon w-full"
                        />
                      </div>

                      <button
                        type="button"
                        onClick={handleSaveChallenge}
                        className="bg-gymNeon text-black font-extrabold uppercase text-xs tracking-wider py-2.5 px-6 rounded-lg self-end shadow hover:opacity-90 active:scale-95 transition-all cursor-pointer"
                      >
                        Publicar Reto
                      </button>
                    </div>
                  </div>
                )}
              </>
            )}
          </>
        ) : (
          <div className="glass-panel p-16 text-center text-neutral-500 text-sm rounded-2xl">
            Selecciona un alumno del menú lateral para ver su progreso y gestionar sus planes.
          </div>
        )}

      </div>

    </div>
  );
}
