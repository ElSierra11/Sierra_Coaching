import React, { useState, useEffect } from 'react';
import { api } from '../api';
import { Trash2, Users, AlertCircle, CheckCircle2, FileDown, TrendingDown, TrendingUp, Sparkles, Calculator, Info, Edit3, X, UserCheck, UserX, Clock, ShieldAlert, MessageCircle, RefreshCw, Play, ExternalLink, Search, Loader2, HelpCircle, Copy, Bookmark, BookOpen, Flame, Zap, Award, Activity, Filter, Lock, Target, ChevronRight, Plus, FileText, Check, Share2, RotateCcw, Sliders, BarChart3, Smile, BatteryLow, AlertTriangle } from 'lucide-react';
import ChatWindow from './ChatWindow';
import { parseVideoUrl, getTechnicalVideoUrl } from '../utils/videoUtils';

const WeightChart = ({ history, initialWeight }) => {
  // Combine initial weight (from profile) and history
  const data = [];
  if (initialWeight) {
    data.push({ date: 'Inicio', weight: initialWeight });
  }
  (history || []).forEach(w => {
    data.push({ date: w.date.substring(5), weight: w.weight }); // simplify date to MM-DD
  });

  if (data.length < 2) {
    return (
      <div className="bg-black/25 rounded-xl p-6 border border-white/5 text-center text-neutral-500 text-xs italic">
        Insuficientes datos para graficar el peso. Registra al menos un peso en el historial del alumno.
      </div>
    );
  }

  const weights = data.map(d => d.weight);
  const minW = Math.min(...weights) - 2;
  const maxW = Math.max(...weights) + 2;
  const rangeW = maxW - minW || 1;

  const width = 500;
  const height = 150;
  const padding = 25;

  const points = data.map((d, idx) => {
    const x = padding + (idx * (width - 2 * padding)) / (data.length - 1);
    const y = height - padding - ((d.weight - minW) / rangeW) * (height - 2 * padding);
    return { x, y, ...d };
  });

  const pathD = `M ${points.map(p => `${p.x} ${p.y}`).join(' L ')}`;
  const areaD = `${pathD} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`;

  return (
    <div className="bg-black/25 rounded-2xl p-4 border border-white/5 flex flex-col gap-2 relative overflow-hidden">
      <div className="flex justify-between items-center text-[10px] text-neutral-400 font-bold uppercase tracking-wider">
        <span>Curva de Variación de Peso (kg)</span>
        <span className="text-gymNeon font-black text-xs">{data[data.length - 1].weight} kg</span>
      </div>
      <div className="relative w-full h-[140px] mt-2">
        <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-full overflow-visible">
          <defs>
            <linearGradient id="coachChartGrad" x1="0" y1="0" x2="0" y2="1">
              <stop offset="0%" stopColor="#ff5722" stopOpacity="0.25" />
              <stop offset="100%" stopColor="#ff5722" stopOpacity="0.0" />
            </linearGradient>
          </defs>

          {/* Grid lines */}
          {[0, 0.25, 0.5, 0.75, 1].map((ratio, idx) => {
            const y = padding + ratio * (height - 2 * padding);
            const val = (maxW - ratio * rangeW).toFixed(1);
            return (
              <g key={idx}>
                <line x1={padding} y1={y} x2={width - padding} y2={y} stroke="rgba(255,255,255,0.03)" strokeDasharray="3 3" />
                <text x={padding - 5} y={y + 3} fill="rgba(255,255,255,0.3)" fontSize="8" textAnchor="end">{val}</text>
              </g>
            );
          })}

          {/* Shaded Area */}
          <path d={areaD} fill="url(#coachChartGrad)" />

          {/* Line Path */}
          <path d={pathD} fill="none" stroke="#ff5722" strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />

          {/* Data Points */}
          {points.map((p, idx) => (
            <g key={idx} className="group cursor-pointer">
              <circle cx={p.x} cy={p.y} r="3.5" fill="#111" stroke="#ff5722" strokeWidth="2" />
              <text x={p.x} y={p.y - 8} fill="#fff" fontSize="8" fontWeight="black" textAnchor="middle" className="opacity-0 group-hover:opacity-100 transition-opacity">
                {p.weight}
              </text>
              <text x={p.x} y={height - 5} fill="rgba(255,255,255,0.4)" fontSize="7" textAnchor="middle">
                {p.date}
              </text>
            </g>
          ))}
        </svg>
      </div>
    </div>
  );
};

export default function CoachAdmin({ showToast }) {
  const [clients, setClients] = useState([]);
  const [selectedClientId, setSelectedClientId] = useState(null);
  const [selectedClient, setSelectedClient] = useState(null);
  const [allClientsDetail, setAllClientsDetail] = useState([]);
  const [loadingAllClients, setLoadingAllClients] = useState(false);
  
  const [adminTab, setAdminTab] = useState('summary'); // 'overview' | 'summary' | 'pending' | 'routine' | 'diet' ...
  const [pendingClients, setPendingClients] = useState([]);
  const [loadingPending, setLoadingPending] = useState(false);
  const [loadingList, setLoadingList] = useState(false);
  const [loadingDetail, setLoadingDetail] = useState(false);

  // Edit Routine state
  const [routineDay, setRoutineDay] = useState('Lunes');
  const [editRoutineName, setEditRoutineName] = useState('');
  const [editExercises, setEditExercises] = useState([]); // List of { name, sets, reps, notes }

  // Edit Diet state
  const [editDiet, setEditDiet] = useState([]); // Copy of client's diet array

  const [saving, setSaving] = useState(false);
  const [generatingAI, setGeneratingAI] = useState(false);
  const [challengeText, setChallengeText] = useState("");

  // Video Preview State for Coach
  const [previewVideoModal, setPreviewVideoModal] = useState({ isOpen: false, parsedVideo: null, name: '', isLoading: true });

  // Compliance Radar & Filters
  const [statusFilter, setStatusFilter] = useState('all'); // 'all' | 'active' | 'at_risk' | 'inactive'

  // Private Coach Notes
  const [privateNoteText, setPrivateNoteText] = useState("");

  // Templates State
  const [routineTemplates, setRoutineTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('coach_routine_templates') || '[]');
    } catch (e) { return []; }
  });

  const [dietTemplates, setDietTemplates] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem('coach_diet_templates') || '[]');
    } catch (e) { return []; }
  });

  // TDEE Calculator State
  const [showTdeeCalc, setShowTdeeCalc] = useState(false);
  const [tdeeGender, setTdeeGender] = useState('M');
  const [tdeeAge, setTdeeAge] = useState(25);
  const [tdeeActivity, setTdeeActivity] = useState(1.375); // 1.2, 1.375, 1.55, 1.725
  const [tdeeGoal, setTdeeGoal] = useState('deficit'); // deficit (-400), maintenance (0), bulk (+350)

  // Copy/Clone Day States
  const [cloneRoutineTargetDay, setCloneRoutineTargetDay] = useState('Martes');
  const [cloneDietTargetDay, setCloneDietTargetDay] = useState(2);

  // Load Private Note when student changes
  useEffect(() => {
    if (selectedClient) {
      try {
        const savedNotes = JSON.parse(localStorage.getItem('coach_private_notes') || '{}');
        setPrivateNoteText(savedNotes[selectedClient.id] || "");
      } catch (e) { setPrivateNoteText(""); }
    }
  }, [selectedClientId]);

  const handleSavePrivateNote = () => {
    if (!selectedClient) return;
    try {
      const savedNotes = JSON.parse(localStorage.getItem('coach_private_notes') || '{}');
      savedNotes[selectedClient.id] = privateNoteText;
      localStorage.setItem('coach_private_notes', JSON.stringify(savedNotes));
      showToast("Nota confidencial del alumno guardada con éxito.", "success");
    } catch (e) {
      showToast("Error al guardar nota privada.", "error");
    }
  };

  const getClientComplianceStatus = (c) => {
    if (!c) return { status: 'unknown', label: 'Sin Datos', dotColor: 'bg-neutral-500', badgeBg: 'bg-neutral-500/10 text-neutral-400 border-neutral-500/20' };
    const logs = c.workout_feedbacks || c.workout_logs || [];
    const weightHist = c.weight_history || [];
    
    let lastDateMs = 0;
    if (logs.length > 0) {
      const dStr = logs[logs.length - 1].date || logs[logs.length - 1].created_at;
      if (dStr) lastDateMs = new Date(dStr).getTime();
    }
    if (!lastDateMs && weightHist.length > 0) {
      const wStr = weightHist[weightHist.length - 1].date;
      if (wStr) lastDateMs = new Date(wStr).getTime();
    }

    if (!lastDateMs || isNaN(lastDateMs)) {
      return { status: 'at_risk', label: 'En Riesgo', dotColor: 'bg-amber-500', badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    }

    const hoursDiff = (Date.now() - lastDateMs) / (1000 * 3600);
    if (hoursDiff <= 48) {
      return { status: 'active', label: 'Activo', dotColor: 'bg-emerald-400 animate-pulse', badgeBg: 'bg-emerald-500/10 text-emerald-400 border-emerald-500/20' };
    } else if (hoursDiff <= 120) {
      return { status: 'at_risk', label: 'En Riesgo', dotColor: 'bg-amber-400', badgeBg: 'bg-amber-500/10 text-amber-400 border-amber-500/20' };
    } else {
      return { status: 'inactive', label: 'Inactivo', dotColor: 'bg-red-500', badgeBg: 'bg-red-500/10 text-red-400 border-red-500/20' };
    }
  };

  const renderMoodBadge = (mood) => {
    if (mood === 'Fuerte' || mood === '💪') return <span className="flex items-center gap-1 bg-gymNeon/10 text-gymNeon border border-gymNeon/20 text-[10px] font-bold px-2.5 py-1 rounded-lg"><Zap className="w-3 h-3 text-gymNeon" /> Fuerte</span>;
    if (mood === 'Bien' || mood === '😊') return <span className="flex items-center gap-1 bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-bold px-2.5 py-1 rounded-lg"><Smile className="w-3 h-3 text-emerald-400" /> Excelente</span>;
    if (mood === 'Exhausto' || mood === '🥵') return <span className="flex items-center gap-1 bg-amber-500/10 text-amber-400 border border-amber-500/20 text-[10px] font-bold px-2.5 py-1 rounded-lg"><Activity className="w-3 h-3 text-amber-400" /> Exhausto</span>;
    if (mood === 'Cansado' || mood === '😴') return <span className="flex items-center gap-1 bg-orange-500/10 text-orange-400 border border-orange-500/20 text-[10px] font-bold px-2.5 py-1 rounded-lg"><BatteryLow className="w-3 h-3 text-orange-400" /> Fatigado</span>;
    if (mood === 'Dolor' || mood === '🤕') return <span className="flex items-center gap-1 bg-red-500/10 text-red-400 border border-red-500/20 text-[10px] font-bold px-2.5 py-1 rounded-lg"><AlertTriangle className="w-3 h-3 text-red-400" /> Molestia</span>;
    return <span className="flex items-center gap-1 bg-white/5 text-neutral-300 text-[10px] font-bold px-2.5 py-1 rounded-lg"><Activity className="w-3 h-3 text-neutral-400" /> {mood || 'Registrado'}</span>;
  };

  // Save current routine as a reusable template
  const handleSaveRoutineTemplate = () => {
    if (!editRoutineName || editExercises.length === 0) {
      showToast("La rutina debe tener al menos un nombre y un ejercicio.", "info");
      return;
    }
    const tplName = window.prompt("Nombre para esta plantilla de rutina:", editRoutineName);
    if (!tplName) return;

    const newTpl = {
      id: 'tpl_' + Date.now(),
      name: tplName,
      routine_name: editRoutineName,
      exercises: editExercises.map(e => ({ name: e.name, sets: e.sets, reps: e.reps, notes: e.notes, video_url: e.video_url || '' }))
    };

    const updated = [...routineTemplates, newTpl];
    setRoutineTemplates(updated);
    localStorage.setItem('coach_routine_templates', JSON.stringify(updated));
    showToast(`Plantilla "${tplName}" guardada.`, "success");
  };

  const handleApplyRoutineTemplate = (tplId) => {
    const tpl = routineTemplates.find(t => t.id === tplId);
    if (!tpl) return;
    setEditRoutineName(tpl.routine_name);
    setEditExercises(tpl.exercises.map((e, idx) => ({ ...e, id: 'new_' + Date.now() + '_' + idx })));
    showToast(`Plantilla "${tpl.name}" cargada. ¡Revisa y guarda!`, "success");
  };

  // Copy current day routine to another day
  const handleCloneRoutineDayTo = () => {
    if (!selectedClient || !cloneRoutineTargetDay) return;
    const targetDay = cloneRoutineTargetDay;
    if (targetDay === routineDay) {
      showToast("Selecciona un día de destino diferente.", "info");
      return;
    }

    const currentExercisesCopy = editExercises.map((e, idx) => ({
      id: null,
      name: e.name,
      sets: parseInt(e.sets) || 0,
      reps: e.reps,
      notes: e.notes,
      video_url: e.video_url || '',
      order: idx
    }));

    const updatedRoutines = (selectedClient.routines || []).map(r => {
      if (r.day === targetDay) {
        return {
          ...r,
          routine_name: editRoutineName || `Rutina de ${targetDay}`,
          exercises: currentExercisesCopy
        };
      }
      return r;
    });

    api.updateClientRoutine(selectedClient.id, updatedRoutines).then(res => {
      setSelectedClient(prev => ({ ...prev, routines: res }));
      showToast(`¡Rutina clonada a ${targetDay} con éxito!`, "success");
    }).catch(err => {
      showToast("Error al clonar rutina: " + err.message, "error");
    });
  };

  // Save current diet as template
  const handleSaveDietTemplate = () => {
    if (!editDiet || editDiet.length === 0) return;
    const name = window.prompt("Nombre para la plantilla de dieta:", "Déficit Calórico Estándar");
    if (!name) return;

    const newTpl = {
      id: 'dtpl_' + Date.now(),
      name,
      meals: editDiet
    };

    const updated = [...dietTemplates, newTpl];
    setDietTemplates(updated);
    localStorage.setItem('coach_diet_templates', JSON.stringify(updated));
    showToast(`Plantilla de dieta "${name}" guardada.`, "success");
  };

  const handleApplyDietTemplate = (tplId) => {
    const tpl = dietTemplates.find(t => t.id === tplId);
    if (!tpl) return;
    setEditDiet(tpl.meals);
    showToast(`Plantilla de dieta "${tpl.name}" cargada.`, "success");
  };

  // Calculate Scientific TDEE/BMR
  const calculateTDEEMacros = () => {
    const w = parseFloat(latestWeight) || 70;
    const h = parseFloat(selectedClient?.profile?.height * 100) || 170;
    const age = parseFloat(tdeeAge) || 25;

    let bmr = (10 * w) + (6.25 * h) - (5 * age);
    bmr = tdeeGender === 'M' ? bmr + 5 : bmr - 161;

    const tdee = Math.round(bmr * parseFloat(tdeeActivity));
    
    let targetCals = tdee;
    if (tdeeGoal === 'deficit') targetCals = Math.max(1200, tdee - 400);
    if (tdeeGoal === 'bulk') targetCals = tdee + 350;

    const proteinGrams = Math.round(w * 2.0);
    const fatGrams = Math.round(w * 0.9);
    const remainingCals = targetCals - (proteinGrams * 4 + fatGrams * 9);
    const carbGrams = Math.max(50, Math.round(remainingCals / 4));

    return { bmr: Math.round(bmr), tdee, targetCals, proteinGrams, fatGrams, carbGrams };
  };

  const handleApplySuggestedMacrosToDiet = () => {
    const macros = calculateTDEEMacros();
    setEditDiet(prev => prev.map(m => ({
      ...m,
      calories: macros.targetCals,
      proteins: macros.proteinGrams,
      carbs: macros.carbGrams,
      fats: macros.fatGrams
    })));
    showToast(`Macros automáticos aplicados: ${macros.targetCals} kcal (${macros.proteinGrams}P / ${macros.carbGrams}C / ${macros.fatGrams}G)`, "success");
  };

  const handleOpenVideoPreview = (exercise) => {
    const rawUrl = (exercise.video_url && exercise.video_url.trim()) ? exercise.video_url.trim() : getTechnicalVideoUrl(exercise);
    const parsed = parseVideoUrl(rawUrl, exercise.name);
    setPreviewVideoModal({
      isOpen: true,
      parsedVideo: parsed,
      name: exercise.name || 'Ejercicio',
      isLoading: true
    });
  };

  const handleAIGenerateRoutine = async () => {
    if (generatingAI || !selectedClient) return;
    setGeneratingAI(true);
    showToast(`Generando rutina de ${routineDay} con IA (Gemini)... Por favor espera.`, "info");
    try {
      const data = await api.aiGeneratePlan(selectedClient.id, "routine", routineDay);
      setEditRoutineName(data.routine_name || `Rutina de ${routineDay}`);
      const exercisesWithTempIds = (data.exercises || []).map((ex, idx) => ({
        id: 'new_' + Date.now() + Math.random() + '_' + idx,
        name: ex.name,
        sets: ex.sets,
        reps: ex.reps,
        notes: ex.notes,
        video_url: ex.video_url || ''
      }));
      setEditExercises(exercisesWithTempIds);
      showToast("Borrador generado con éxito por la IA. ¡Ajusta y guarda!", "success");
    } catch (e) {
      showToast("Error al generar rutina con IA: " + e.message, "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAIGenerateDiet = async (dayNum) => {
    if (generatingAI || !selectedClient) return;
    setGeneratingAI(true);
    showToast(`Generando dieta Día ${dayNum} con IA... Por favor espera.`, "info");
    try {
      const data = await api.aiGeneratePlan(selectedClient.id, "diet", null, dayNum);
      handleDietMealChange(dayNum, 'desayuno', data.desayuno || '');
      handleDietMealChange(dayNum, 'almuerzo', data.almuerzo || '');
      handleDietMealChange(dayNum, 'cena', data.cena || '');
      handleDietMealChange(dayNum, 'merienda', data.merienda || '');
      handleDietMealChange(dayNum, 'calories', data.calories || 0);
      handleDietMealChange(dayNum, 'proteins', data.proteins || 0);
      handleDietMealChange(dayNum, 'carbs', data.carbs || 0);
      handleDietMealChange(dayNum, 'fats', data.fats || 0);
      showToast(`Menú del Día ${dayNum} generado. ¡Revisa y guarda!`, "success");
    } catch (e) {
      showToast("Error al generar dieta con IA: " + e.message, "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  const handleAICalculateMacros = async (dayNum) => {
    if (generatingAI || !selectedClient) return;

    // Find the specific day's meals from the editDiet state
    const targetMeal = editDiet.find(m => m.day_number === dayNum);
    if (!targetMeal) return;

    const hasContent = [targetMeal.desayuno, targetMeal.almuerzo, targetMeal.cena, targetMeal.merienda]
      .some(content => content && content.trim() !== "" && content !== "Sin asignar");

    if (!hasContent) {
      showToast("Escribe la descripción de las comidas antes de calcular los macros.", "info");
      return;
    }

    setGeneratingAI(true);
    showToast(`Calculando macros para Día ${dayNum} con IA... Por favor espera.`, "info");
    try {
      const data = await api.aiCalculateMacros({
        desayuno: targetMeal.desayuno || '',
        almuerzo: targetMeal.almuerzo || '',
        cena: targetMeal.cena || '',
        merienda: targetMeal.merienda || ''
      });
      handleDietMealChange(dayNum, 'calories', data.calories || 0);
      handleDietMealChange(dayNum, 'proteins', data.proteins || 0);
      handleDietMealChange(dayNum, 'carbs', data.carbs || 0);
      handleDietMealChange(dayNum, 'fats', data.fats || 0);
      showToast(`Macros calculados con éxito para el Día ${dayNum}.`, "success");
    } catch (e) {
      showToast("Error al calcular macros con IA: " + e.message, "error");
    } finally {
      setGeneratingAI(false);
    }
  };

  // Load clients list on mount
  useEffect(() => {
    fetchClients();
    fetchChallenge();
    fetchPendingClients();
  }, []);

  const fetchPendingClients = async () => {
    setLoadingPending(true);
    try {
      const data = await api.getPendingClients();
      setPendingClients(data);
    } catch (e) {
      console.error("Error fetching pending clients:", e);
    } finally {
      setLoadingPending(false);
    }
  };

  const handleApproveClient = async (clientId, clientName) => {
    try {
      await api.approveClient(clientId);
      showToast(`¡Acceso de ${clientName} aprobado con éxito!`, "success");
      fetchPendingClients();
      fetchClients();
    } catch (err) {
      showToast("Error al aprobar cliente: " + err.message, "error");
    }
  };

  const handleRejectClient = async (clientId, clientName) => {
    if (!window.confirm(`¿Estás seguro de rechazar y eliminar el registro de ${clientName}?`)) return;
    try {
      await api.rejectClient(clientId);
      showToast(`Solicitud de ${clientName} eliminada.`, "info");
      fetchPendingClients();
    } catch (err) {
      showToast("Error al rechazar solicitud: " + err.message, "error");
    }
  };

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

  // Profile edit states for CoachAdmin
  const [showEditClientModal, setShowEditClientModal] = useState(false);
  const [editClientHeight, setEditClientHeight] = useState('');
  const [editClientWeight, setEditClientWeight] = useState('');
  const [editClientTarget, setEditClientTarget] = useState('');
  const [editClientName, setEditClientName] = useState('');
  const [savingClientProfile, setSavingClientProfile] = useState(false);

  const handleSaveClientProfile = async (e) => {
    e.preventDefault();
    if (!selectedClient) return;
    setSavingClientProfile(true);
    try {
      await api.updateClientProfile(selectedClient.id, {
        height: parseFloat(editClientHeight),
        initial_weight: parseFloat(editClientWeight),
        target: editClientTarget,
        name: editClientName
      });
      showToast("Datos del alumno actualizados correctamente", "success");
      setShowEditClientModal(false);
      fetchClientDetail(selectedClient.id);
      fetchClients();
    } catch (err) {
      showToast(err.message || "Error al actualizar alumno", "error");
    } finally {
      setSavingClientProfile(false);
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
            id: typeof e.id === 'string' && e.id.startsWith('new_') ? null : e.id,
            name: e.name,
            sets: parseInt(e.sets) || 0,
            reps: e.reps,
            notes: e.notes,
            video_url: e.video_url || '',
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
    <p><strong>Objetivo:</strong> ${profile.target || 'N/A'} &nbsp;|&nbsp; <strong>Estatura:</strong> ${profile.height ? Number(profile.height).toFixed(2) : 'N/A'} m</p>
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
    <div className="flex flex-col lg:grid lg:grid-cols-4 gap-6">
      
      {/* MOBILE CLIENT SWITCHER (Hidden on lg) */}
      <div className="lg:hidden glass-panel p-4 rounded-2xl flex flex-col gap-2 shadow-lg">
        <h3 className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Seleccionar Alumno</h3>
        {loadingList ? (
          <div className="text-neutral-500 text-xs italic">Cargando alumnos...</div>
        ) : (
          <div className="flex gap-2 items-center overflow-x-auto no-scrollbar pb-1">
            {clients.map(c => (
              <button
                key={c.id}
                onClick={() => setSelectedClientId(c.id)}
                className={`shrink-0 px-4 py-2 rounded-xl text-xs font-bold transition-all border ${
                  selectedClientId === c.id
                    ? 'bg-gymNeon text-black border-gymNeon font-extrabold'
                    : 'bg-white/[0.02] border-white/5 text-neutral-400'
                }`}
              >
                {c.name}
              </button>
            ))}
          </div>
        )}
      </div>

      {/* DESKTOP CLIENTS LIST (Hidden on mobile) */}
      <div className="hidden lg:flex glass-panel p-5 rounded-2xl shadow-lg flex-col gap-4 self-start">
        <div className="flex justify-between items-center border-b border-white/5 pb-3">
          <h3 className="text-xs font-bold text-white uppercase tracking-wider flex items-center gap-2">
            <Users className="w-4 h-4 text-gymNeon" />
            <span>Mis Alumnos ({clients.length})</span>
          </h3>
        </div>

        {/* Adherence Filter Bar */}
        <div className="flex gap-1 bg-black/40 p-1 rounded-xl border border-white/5">
          {[
            { key: 'all', label: 'Todos' },
            { key: 'active', label: 'Activos' },
            { key: 'at_risk', label: 'Riesgo' },
            { key: 'inactive', label: 'Inactivos' }
          ].map(f => (
            <button
              key={f.key}
              type="button"
              onClick={() => setStatusFilter(f.key)}
              className={`flex-1 py-1 rounded-lg text-[9px] font-bold transition-all ${
                statusFilter === f.key ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
              }`}
            >
              {f.label}
            </button>
          ))}
        </div>
        
        {loadingList ? (
          <div className="text-center py-8 text-neutral-500 text-xs">Cargando alumnos...</div>
        ) : (
          <div className="flex flex-col gap-2 max-h-[600px] overflow-y-auto pr-1">
            {clients
              .filter(c => {
                if (statusFilter === 'all') return true;
                const comp = getClientComplianceStatus(c);
                return comp.status === statusFilter;
              })
              .map(c => {
                const comp = getClientComplianceStatus(c);
                return (
                  <button
                    key={c.id}
                    onClick={() => setSelectedClientId(c.id)}
                    className={`w-full text-left p-3 rounded-xl transition-all border relative flex items-center justify-between ${
                      selectedClientId === c.id
                        ? 'bg-gymNeon text-black border-gymNeon font-bold shadow-md'
                        : 'bg-white/[0.02] border-white/5 text-neutral-400 hover:text-white hover:bg-white/[0.04]'
                    }`}
                  >
                    <div>
                      <div className="text-xs font-bold truncate max-w-[140px]">{c.name}</div>
                      <div className={`text-[9px] ${selectedClientId === c.id ? 'text-black/70' : 'text-neutral-500'} truncate max-w-[140px]`}>{c.email}</div>
                    </div>
                    <div className="flex items-center gap-1.5 shrink-0">
                      <span className={`w-2 h-2 rounded-full ${comp.dotColor}`}></span>
                      <span className={`text-[8px] font-extrabold px-1.5 py-0.5 rounded border ${comp.badgeBg}`}>
                        {comp.label}
                      </span>
                    </div>
                  </button>
                );
              })}
          </div>
        )}
      </div>

      {/* 2. RIGHT COLUMN: ADMIN WORKSPACE */}
      <div className="lg:col-span-3 flex flex-col gap-6">
        
        {selectedClient ? (
          <>
            {/* Top Workspace Header */}
            <div className="glass-panel p-5 rounded-2xl flex flex-col xl:flex-row justify-between items-start xl:items-center gap-4 bg-white/[0.01] overflow-hidden w-full">
              <div className="shrink-0">
                <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Ficha del Alumno</span>
                <h2 className="text-lg font-extrabold text-white">{selectedClient.name}</h2>
              </div>
              
              {/* Workspace tabs switcher */}
              <div className="flex flex-col sm:flex-row gap-3 items-stretch sm:items-center w-full xl:w-auto overflow-hidden">
                <div className="overflow-x-auto w-full no-scrollbar pb-1">
                  <div className="flex bg-neutral-900 border border-white/5 rounded-xl p-1 gap-1 min-w-max">
                    <button
                      onClick={() => setAdminTab('pending')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 relative ${
                        adminTab === 'pending' ? 'bg-amber-500 text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Clock className="w-3.5 h-3.5" />
                      <span>Pendientes</span>
                      {pendingClients.length > 0 && (
                        <span className="bg-red-600 text-white text-[9px] font-black px-1.5 py-0.2 rounded-full animate-pulse">
                          {pendingClients.length}
                        </span>
                      )}
                    </button>
                    <button
                      onClick={() => setAdminTab('overview')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        adminTab === 'overview' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Vista General
                    </button>
                    <button
                      onClick={() => setAdminTab('summary')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        adminTab === 'summary' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Resumen
                    </button>
                    <button
                      onClick={() => setAdminTab('routine')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        adminTab === 'routine' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Editar Rutina
                    </button>
                    <button
                      onClick={() => setAdminTab('diet')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        adminTab === 'diet' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Editar Dieta
                    </button>
                    <button
                      onClick={() => setAdminTab('feedback')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
                        adminTab === 'feedback' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Notas de Sesión
                    </button>
                    <button
                      onClick={() => setAdminTab('notes')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 flex items-center gap-1.5 ${
                        adminTab === 'notes' ? 'bg-amber-400 text-black font-extrabold' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      <Lock className="w-3.5 h-3.5" />
                      <span>Notas Privadas</span>
                    </button>
                    <button
                      onClick={() => setAdminTab('chat')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 relative ${
                        adminTab === 'chat' ? 'bg-gymNeon text-black' : 'text-neutral-400 hover:text-white'
                      }`}
                    >
                      Chat
                    </button>
                    <button
                      onClick={() => setAdminTab('business')}
                      className={`px-3 py-1.5 rounded-lg text-xs font-bold transition-all shrink-0 ${
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
                    className="flex items-center justify-center gap-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-white text-[10px] font-bold uppercase px-3 py-2.5 rounded-xl transition-all cursor-pointer w-full sm:w-auto sm:ml-auto"
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
                {/* VIEW PENDING: PENDING APPROVAL CLIENTS */}
                {adminTab === 'pending' && (
                  <div className="flex flex-col gap-4">
                    <div className="flex justify-between items-center">
                      <div className="flex items-center gap-2">
                        <Clock className="w-5 h-5 text-amber-400" />
                        <h4 className="text-sm font-bold text-white uppercase tracking-wider">Solicitudes de Registro Pendientes</h4>
                      </div>
                      <button
                        onClick={fetchPendingClients}
                        className="text-xs font-bold text-neutral-400 hover:text-white flex items-center gap-1.5 bg-white/5 hover:bg-white/10 px-3 py-1.5 rounded-xl border border-white/10 transition-all cursor-pointer"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingPending ? 'animate-spin' : ''}`} />
                        <span>Actualizar</span>
                      </button>
                    </div>

                    {loadingPending ? (
                      <div className="glass-panel p-12 text-center text-neutral-500 text-xs rounded-2xl">
                        Cargando solicitudes pendientes...
                      </div>
                    ) : pendingClients.length === 0 ? (
                      <div className="glass-panel p-12 text-center text-neutral-400 text-xs rounded-2xl flex flex-col items-center gap-2 bg-neutral-900/50 border border-white/10">
                        <CheckCircle2 className="w-8 h-8 text-green-400 mb-1" />
                        <span className="font-extrabold text-sm text-white">¡No hay solicitudes pendientes!</span>
                        <p className="text-neutral-500 max-w-sm">Todos los clientes registrados han sido procesados. Cuando un nuevo usuario se registre en la app, aparecerá en este panel.</p>
                      </div>
                    ) : (
                      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {pendingClients.map(p => (
                          <div 
                            key={p.id}
                            className="glass-panel p-5 rounded-2xl bg-gradient-to-b from-neutral-900 to-black border-2 border-amber-500/30 flex flex-col justify-between gap-4 shadow-xl"
                          >
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-full bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 font-black text-sm">
                                  {p.name.charAt(0)}
                                </div>
                                <div>
                                  <h4 className="text-sm font-extrabold text-white flex items-center gap-1.5">
                                    <span>{p.name}</span>
                                  </h4>
                                  <p className="text-xs text-neutral-400 font-medium">{p.email}</p>
                                </div>
                              </div>
                              <span className="text-[9px] font-black uppercase px-2 py-0.5 rounded bg-amber-500/20 text-amber-400 border border-amber-500/30 flex items-center gap-1">
                                <Clock className="w-3 h-3 animate-spin" />
                                <span>Pendiente</span>
                              </span>
                            </div>

                            <div className="bg-black/50 p-3 rounded-xl border border-white/5 grid grid-cols-2 gap-2 text-xs">
                              <div>
                                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Objetivo</span>
                                <span className="text-white font-medium text-xs truncate block">{p.target || 'No especificado'}</span>
                              </div>
                              <div>
                                <span className="text-[10px] text-neutral-500 uppercase font-bold block">Registrado</span>
                                <span className="text-white font-medium text-xs block">{p.joined_date || 'Recientemente'}</span>
                              </div>
                            </div>

                            <div className="flex gap-2 pt-1">
                              <button
                                onClick={() => handleApproveClient(p.id, p.name)}
                                className="flex-1 py-2.5 px-3 rounded-xl bg-gymNeon text-black font-black text-xs uppercase tracking-wider flex items-center justify-center gap-1.5 hover:brightness-110 active:scale-98 transition-all cursor-pointer shadow-lg"
                              >
                                <UserCheck className="w-4 h-4" />
                                <span>Aprobar Acceso</span>
                              </button>

                              <button
                                onClick={() => handleRejectClient(p.id, p.name)}
                                className="py-2.5 px-3 rounded-xl bg-red-500/10 hover:bg-red-500/20 border border-red-500/30 text-red-400 font-bold text-xs uppercase flex items-center justify-center gap-1 transition-all cursor-pointer"
                                title="Rechazar y eliminar registro"
                              >
                                <UserX className="w-4 h-4" />
                              </button>

                              <a
                                href={`https://wa.me/573022114190?text=Hola%20${encodeURIComponent(p.name)},%20veo%20tu%20registro%20en%20Sierra%20Coaching%20(${encodeURIComponent(p.email)}).`}
                                target="_blank"
                                rel="noopener noreferrer"
                                className="py-2.5 px-3 rounded-xl bg-emerald-500/10 hover:bg-emerald-500/20 border border-emerald-500/30 text-emerald-400 font-bold text-xs flex items-center justify-center transition-all"
                                title="Verificar por WhatsApp"
                              >
                                <MessageCircle className="w-4 h-4" />
                              </a>
                            </div>
                          </div>
                        ))}
                      </div>
                    )}
                  </div>
                )}

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
                      <div className="flex items-center justify-between">
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Métricas de Progreso</h4>
                        <button
                          onClick={() => {
                            setEditClientHeight(selectedClient.profile?.height || 1.70);
                            setEditClientTarget(selectedClient.profile?.target || "Tonificar");
                            setEditClientWeight(selectedClient.profile?.initial_weight || 70);
                            setEditClientName(selectedClient.name || "");
                            setShowEditClientModal(true);
                          }}
                          className="flex items-center gap-1.5 px-3 py-1.5 bg-white/5 hover:bg-white/10 border border-white/10 text-neutral-300 hover:text-white rounded-xl text-xs font-semibold transition-all cursor-pointer"
                        >
                          <Edit3 className="w-3.5 h-3.5 text-gymNeon" />
                          <span>Editar Datos Alumno</span>
                        </button>
                      </div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                        <div className="bg-black/25 p-4 rounded-xl border border-white/5">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase">Objetivo</div>
                          <div className="text-white text-sm font-bold mt-1">{selectedClient.profile?.target}</div>
                        </div>
                        <div className="bg-black/25 p-4 rounded-xl border border-white/5">
                          <div className="text-[10px] text-neutral-500 font-bold uppercase">Estatura</div>
                          <div className="text-white text-sm font-bold mt-1">{selectedClient.profile?.height ? Number(selectedClient.profile.height).toFixed(2) : '1.70'} m</div>
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

                    {/* Edit Client Profile Modal for Coach */}
                    {showEditClientModal && (
                      <div className="fixed inset-0 bg-black/70 backdrop-blur-sm z-50 flex items-center justify-center p-4">
                        <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-md flex flex-col gap-4 animate-scale-in relative shadow-2xl">
                          <button
                            onClick={() => setShowEditClientModal(false)}
                            className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-white/5 border border-white/10 p-1.5 rounded-xl cursor-pointer"
                          >
                            <X className="w-4 h-4" />
                          </button>

                          <div>
                            <span className="text-[10px] font-extrabold text-gymNeon uppercase tracking-widest">Administración de Alumno</span>
                            <h3 className="text-lg font-bold text-white mt-0.5">Editar Perfil del Alumno</h3>
                            <p className="text-xs text-neutral-400 mt-1">Corrige la estatura, objetivo o peso inicial del alumno.</p>
                          </div>

                          <form onSubmit={handleSaveClientProfile} className="flex flex-col gap-4">
                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Nombre del Alumno</label>
                              <input
                                type="text"
                                value={editClientName}
                                onChange={(e) => setEditClientName(e.target.value)}
                                placeholder="Nombre completo"
                                required
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gymNeon"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Estatura (metros)</label>
                              <input
                                type="number"
                                step="0.01"
                                min="0.5"
                                max="2.5"
                                value={editClientHeight}
                                onChange={(e) => setEditClientHeight(e.target.value)}
                                placeholder="Ej. 1.70"
                                required
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gymNeon"
                              />
                              <span className="text-[9px] text-neutral-500">Ejemplo: 1.67 ó 1.70 m</span>
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Peso de Partida (kg)</label>
                              <input
                                type="number"
                                step="0.1"
                                min="20"
                                max="300"
                                value={editClientWeight}
                                onChange={(e) => setEditClientWeight(e.target.value)}
                                placeholder="Ej. 70"
                                required
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gymNeon"
                              />
                            </div>

                            <div className="flex flex-col gap-1.5">
                              <label className="text-[10px] text-neutral-400 font-bold uppercase tracking-wider">Objetivo Principal</label>
                              <input
                                type="text"
                                value={editClientTarget}
                                onChange={(e) => setEditClientTarget(e.target.value)}
                                placeholder="Objetivo"
                                required
                                className="bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-sm text-white focus:outline-none focus:border-gymNeon"
                              />
                            </div>

                            <div className="flex justify-end gap-2 mt-2">
                              <button
                                type="button"
                                onClick={() => setShowEditClientModal(false)}
                                className="px-4 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white text-xs font-bold cursor-pointer"
                              >
                                Cancelar
                              </button>
                              <button
                                type="submit"
                                disabled={savingClientProfile}
                                className="px-5 py-2.5 bg-gymNeon text-black rounded-xl text-xs font-black uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
                              >
                                {savingClientProfile ? "Guardando..." : "Guardar Cambios"}
                              </button>
                            </div>
                          </form>
                        </div>
                      </div>
                    )}

                    {/* Weight and measurements logs */}
                    <div className="glass-panel p-6 rounded-2xl md:col-span-2 flex flex-col gap-4">
                      <h4 className="text-xs font-bold text-white uppercase tracking-wider">Historial Corporal</h4>
                      <div className="flex flex-col gap-4">
                        <WeightChart history={selectedClient.weight_history} initialWeight={selectedClient.profile?.initial_weight} />
                        
                        <div className="text-xs font-bold text-neutral-400">Pesos Registrados:</div>
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
                    <div className="flex bg-neutral-900 border border-white/5 rounded-xl p-1 overflow-x-auto no-scrollbar gap-1">
                      {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes'].map(d => (
                        <button
                          key={d}
                          onClick={() => handleRoutineDayChange(d)}
                          className={`flex-1 shrink-0 min-w-[75px] text-center py-2 rounded-lg text-xs font-semibold transition-all ${
                            routineDay === d ? 'bg-gymNeon text-black font-extrabold' : 'text-neutral-400 hover:text-white'
                          }`}
                        >
                          {d}
                        </button>
                      ))}
                    </div>

                    {/* Routine Toolbar: Templates & Cloning */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Bookmark className="w-4 h-4 text-gymNeon" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Plantillas & Clonación de Rutinas</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {routineTemplates.length > 0 && (
                          <select
                            onChange={(e) => { if (e.target.value) handleApplyRoutineTemplate(e.target.value); }}
                            className="bg-black/50 border border-white/10 text-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>Cargar Plantilla...</option>
                            {routineTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveRoutineTemplate}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Bookmark className="w-3 h-3 text-gymNeon" />
                          <span>Guardar Plantilla</span>
                        </button>
                        <div className="flex items-center gap-1 bg-black/40 p-1 rounded-lg border border-white/5">
                          <span className="text-[9px] text-neutral-400 font-bold px-1">Clonar a:</span>
                          <select
                            value={cloneRoutineTargetDay}
                            onChange={(e) => setCloneRoutineTargetDay(e.target.value)}
                            className="bg-neutral-900 border border-white/10 text-white text-[10px] rounded px-1.5 py-0.5 focus:outline-none cursor-pointer"
                          >
                            {['Lunes', 'Martes', 'Miercoles', 'Jueves', 'Viernes', 'Sábado', 'Domingo'].map(d => (
                              <option key={d} value={d}>{d}</option>
                            ))}
                          </select>
                          <button
                            type="button"
                            onClick={handleCloneRoutineDayTo}
                            className="bg-gymNeon/15 hover:bg-gymNeon/30 border border-gymNeon/30 text-gymNeon text-[9px] font-extrabold px-2 py-0.5 rounded cursor-pointer transition-all flex items-center gap-1"
                            title="Copiar los ejercicios de hoy al día seleccionado"
                          >
                            <Copy className="w-2.5 h-2.5" />
                            <span>Clonar</span>
                          </button>
                        </div>
                      </div>
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
                        <div className="flex gap-2">
                          <button
                            type="button"
                            disabled={generatingAI}
                            onClick={handleAIGenerateRoutine}
                            className="bg-gymNeon/15 hover:bg-gymNeon/25 text-gymNeon font-extrabold border border-gymNeon/30 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                          >
                            <Sparkles className="w-3 h-3 animate-pulse" />
                            <span>{generatingAI ? 'Generando...' : 'Generar con IA'}</span>
                          </button>
                          <button
                            type="button"
                            onClick={handleAddExercise}
                            className="bg-white/5 hover:bg-white/10 text-white font-bold border border-white/15 px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer"
                          >
                            + Añadir Ejercicio
                          </button>
                        </div>
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
                                <div className="sm:col-span-2 flex flex-col gap-1">
                                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Notas / Instrucciones Especiales</span>
                                  <input
                                    type="text"
                                    placeholder="Ej. Dropset en última serie / negativa lenta"
                                    value={ex.notes || ''}
                                    onChange={(e) => handleExerciseChange(idx, 'notes', e.target.value)}
                                    className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                                  />
                                </div>
                                <div className="sm:col-span-2 flex flex-col gap-1">
                                  <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">URL Video Técnico (Opcional)</span>
                                  <div className="flex gap-1.5 items-center">
                                    <input
                                      type="text"
                                      placeholder="Ej. YouTube, Shorts, MP4, Reel..."
                                      value={ex.video_url || ''}
                                      onChange={(e) => handleExerciseChange(idx, 'video_url', e.target.value)}
                                      className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white flex-1"
                                    />
                                    <button
                                      type="button"
                                      onClick={() => handleOpenVideoPreview(ex)}
                                      className="px-2.5 py-1.5 bg-gymNeon/10 hover:bg-gymNeon/20 border border-gymNeon/30 text-gymNeon text-[10px] font-bold rounded flex items-center gap-1 transition-colors cursor-pointer flex-shrink-0"
                                      title="Probar Video de Ejemplo"
                                    >
                                      <Play className="w-3 h-3 fill-gymNeon text-gymNeon" />
                                      <span>Probar</span>
                                    </button>
                                  </div>
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
                    {/* Diet Toolbar: Templates & TDEE Calculator */}
                    <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/5 pb-3">
                      <div className="flex items-center gap-2">
                        <Calculator className="w-4 h-4 text-gymNeon" />
                        <h4 className="text-xs font-bold text-white uppercase tracking-wider">Plan Nutricional & Calculadora TDEE</h4>
                      </div>
                      <div className="flex flex-wrap items-center gap-2">
                        {dietTemplates.length > 0 && (
                          <select
                            onChange={(e) => { if (e.target.value) handleApplyDietTemplate(e.target.value); }}
                            className="bg-black/50 border border-white/10 text-neutral-300 text-xs rounded-lg px-2.5 py-1.5 focus:outline-none cursor-pointer"
                            defaultValue=""
                          >
                            <option value="" disabled>Cargar Plantilla Dieta...</option>
                            {dietTemplates.map(t => (
                              <option key={t.id} value={t.id}>{t.name}</option>
                            ))}
                          </select>
                        )}
                        <button
                          type="button"
                          onClick={handleSaveDietTemplate}
                          className="bg-white/5 hover:bg-white/10 border border-white/10 text-white font-bold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Bookmark className="w-3 h-3 text-gymNeon" />
                          <span>Guardar Plantilla</span>
                        </button>
                        <button
                          type="button"
                          onClick={() => setShowTdeeCalc(!showTdeeCalc)}
                          className="bg-gymNeon/15 hover:bg-gymNeon/25 border border-gymNeon/30 text-gymNeon font-extrabold px-3 py-1.5 rounded-lg text-[10px] uppercase tracking-wider transition-all cursor-pointer flex items-center gap-1"
                        >
                          <Calculator className="w-3 h-3" />
                          <span>{showTdeeCalc ? 'Ocultar Calculadora TDEE' : 'Calculadora TDEE / Macros'}</span>
                        </button>
                      </div>
                    </div>

                    {/* Interactive TDEE Panel */}
                    {showTdeeCalc && (
                      <div className="bg-black/40 border border-gymNeon/20 p-5 rounded-2xl flex flex-col gap-4 animate-slide-in">
                        <div className="flex justify-between items-center border-b border-white/5 pb-2">
                          <span className="text-xs font-bold text-gymNeon uppercase tracking-wider flex items-center gap-1.5">
                            <Sparkles className="w-3.5 h-3.5" />
                            <span>Calculadora de Requerimientos Calóricos (Mifflin-St Jeor)</span>
                          </span>
                          <span className="text-[10px] text-neutral-400">Peso actual: {latestWeight} kg</span>
                        </div>

                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 text-xs">
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-neutral-500 font-bold uppercase">Género Biológico</span>
                            <select value={tdeeGender} onChange={(e) => setTdeeGender(e.target.value)} className="bg-black/60 border border-white/10 text-white rounded p-2 text-xs">
                              <option value="M">Masculino</option>
                              <option value="F">Femenino</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-neutral-500 font-bold uppercase">Edad (años)</span>
                            <input type="number" value={tdeeAge} onChange={(e) => setTdeeAge(e.target.value)} className="bg-black/60 border border-white/10 text-white rounded p-2 text-xs" />
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-neutral-500 font-bold uppercase">Nivel de Actividad</span>
                            <select value={tdeeActivity} onChange={(e) => setTdeeActivity(e.target.value)} className="bg-black/60 border border-white/10 text-white rounded p-2 text-xs">
                              <option value="1.2">Sedentario (Poco ejercicio)</option>
                              <option value="1.375">Moderado (3-4 días/semana)</option>
                              <option value="1.55">Intenso (5-6 días/semana)</option>
                              <option value="1.725">Atleta (Doble sesión)</option>
                            </select>
                          </div>
                          <div className="flex flex-col gap-1">
                            <span className="text-[9px] text-neutral-500 font-bold uppercase">Objetivo Nutricional</span>
                            <select value={tdeeGoal} onChange={(e) => setTdeeGoal(e.target.value)} className="bg-black/60 border border-white/10 text-white rounded p-2 text-xs">
                              <option value="deficit">Déficit (-400 kcal)</option>
                              <option value="maintenance">Mantenimiento (0 kcal)</option>
                              <option value="bulk">Volumen (+350 kcal)</option>
                            </select>
                          </div>
                        </div>

                        {(() => {
                          const m = calculateTDEEMacros();
                          return (
                            <div className="bg-gymNeon/10 border border-gymNeon/30 p-4 rounded-xl flex flex-wrap justify-between items-center gap-4">
                              <div className="flex items-center gap-4 text-xs">
                                <div><span className="text-[9px] text-neutral-400 block uppercase font-bold">BMR</span><strong className="text-white text-sm">{m.bmr}</strong> <span className="text-[9px] text-neutral-500">kcal</span></div>
                                <div><span className="text-[9px] text-neutral-400 block uppercase font-bold">TDEE</span><strong className="text-white text-sm">{m.tdee}</strong> <span className="text-[9px] text-neutral-500">kcal</span></div>
                                <div className="border-l border-white/10 pl-4"><span className="text-[9px] text-gymNeon block uppercase font-extrabold">Meta Diaria</span><strong className="text-gymNeon text-base font-black">{m.targetCals}</strong> <span className="text-[9px] text-gymNeon">kcal</span></div>
                              </div>
                              <div className="flex items-center gap-3 text-xs">
                                <span className="text-neutral-300 font-bold text-[10px]">{m.proteinGrams}g Prot &middot; {m.carbGrams}g Carb &middot; {m.fatGrams}g Grasas</span>
                                <button
                                  type="button"
                                  onClick={handleApplySuggestedMacrosToDiet}
                                  className="bg-gymNeon text-black font-extrabold uppercase text-[10px] tracking-wider px-4 py-2 rounded-lg cursor-pointer shadow hover:opacity-90 transition-all"
                                >
                                  Aplicar a Todos los Días
                                </button>
                              </div>
                            </div>
                          );
                        })()}
                      </div>
                    )}
                    
                    <div className="flex flex-col gap-4 max-h-[420px] overflow-y-auto pr-1">
                      {editDiet.map((meal) => (
                        <div key={meal.day_number} className="bg-black/20 p-5 rounded-xl border border-white/5 flex flex-col gap-4">
                          <div className="flex justify-between items-center">
                            <span className="text-xs font-extrabold text-gymNeon uppercase tracking-widest">Día {meal.day_number}</span>
                            <div className="flex gap-2">
                              <button
                                type="button"
                                disabled={generatingAI}
                                onClick={() => handleAICalculateMacros(meal.day_number)}
                                className="bg-white/5 hover:bg-white/10 text-neutral-300 font-extrabold border border-white/10 px-2.5 py-1 rounded-[6px] text-[9px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                                title="Calcula automáticamente las calorías y macros basándose en el texto escrito"
                              >
                                <Calculator className="w-2.5 h-2.5" />
                                <span>Calcular Macros con IA</span>
                              </button>
                              <button
                                type="button"
                                disabled={generatingAI}
                                onClick={() => handleAIGenerateDiet(meal.day_number)}
                                className="bg-gymNeon/10 hover:bg-gymNeon/25 text-gymNeon font-extrabold border border-gymNeon/20 px-2.5 py-1 rounded-[6px] text-[9px] uppercase tracking-wider transition-all disabled:opacity-50 cursor-pointer flex items-center gap-1"
                              >
                                <Sparkles className="w-2.5 h-2.5 animate-pulse" />
                                <span>Generar Día con IA</span>
                              </button>
                            </div>
                          </div>
                          
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
                          
                          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 border-t border-white/5 pt-3 mt-1">
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Calorías (kcal)</span>
                              <input
                                type="number"
                                value={meal.calories || 0}
                                onChange={(e) => handleDietMealChange(meal.day_number, 'calories', parseInt(e.target.value) || 0)}
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Proteínas (g)</span>
                              <input
                                type="number"
                                value={meal.proteins || 0}
                                onChange={(e) => handleDietMealChange(meal.day_number, 'proteins', parseInt(e.target.value) || 0)}
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Carbohidratos (g)</span>
                              <input
                                type="number"
                                value={meal.carbs || 0}
                                onChange={(e) => handleDietMealChange(meal.day_number, 'carbs', parseInt(e.target.value) || 0)}
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
                              />
                            </div>
                            <div className="flex flex-col gap-1">
                              <span className="text-[8px] font-bold text-neutral-500 uppercase tracking-wider">Grasas (g)</span>
                              <input
                                type="number"
                                value={meal.fats || 0}
                                onChange={(e) => handleDietMealChange(meal.day_number, 'fats', parseInt(e.target.value) || 0)}
                                className="bg-black/40 border border-white/5 rounded px-2.5 py-1.5 text-xs text-white"
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
                {/* VIEW 5: FEEDBACK / WORKOUT SESSIONS TAB */}
                {adminTab === 'feedback' && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Activity className="w-4 h-4 text-gymNeon" />
                        <span>Diario de Entrenamientos & Sensaciones</span>
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Historial de entrenamientos completados por el alumno y evaluación de esfuerzo RPE.</p>
                    </div>

                    <div className="flex flex-col gap-4">
                      {(!selectedClient.workout_feedbacks || selectedClient.workout_feedbacks.length === 0) ? (
                        <div className="glass-panel p-12 text-center text-neutral-500 text-xs italic rounded-2xl bg-white/[0.01] border border-white/5">
                          El alumno aún no ha finalizado ningún entrenamiento ni enviado notas de sesión.
                        </div>
                      ) : (
                        selectedClient.workout_feedbacks.map((f, idx) => (
                          <div key={idx} className="glass-panel p-5 rounded-2xl flex flex-col gap-3 border border-white/5 bg-white/[0.01]">
                            <div className="flex justify-between items-center">
                              <div className="flex items-center gap-3">
                                {renderMoodBadge(f.mood_emoji)}
                                <div>
                                  <span className="text-xs font-black text-white">{f.routine_name}</span>
                                  <span className="text-[9px] text-neutral-500 block">{f.date}</span>
                                </div>
                              </div>
                              <span className={`text-[10px] font-black px-2.5 py-1 rounded-full ${
                                f.effort_rating >= 8 ? 'bg-red-500/10 text-red-400 border border-red-500/20' :
                                f.effort_rating >= 5 ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/20' :
                                'bg-green-500/10 text-green-400 border border-green-500/20'
                              }`}>
                                Esfuerzo: {f.effort_rating}/10
                              </span>
                            </div>
                            {f.notes && (
                              <p className="text-xs text-neutral-300 bg-black/20 rounded-xl p-3 border border-white/5 italic leading-relaxed">
                                "{f.notes}"
                              </p>
                            )}
                          </div>
                        ))
                      )}
                    </div>
                  </div>
                )}

                {/* VIEW: PRIVATE COACH NOTES TAB */}
                {adminTab === 'notes' && (
                  <div className="flex flex-col gap-6">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                        <Lock className="w-4 h-4 text-amber-400" />
                        <span>Notas Confidenciales del Entrenador</span>
                      </h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Espacio privado únicamente visible para el Coach sobre {selectedClient.name} (ej. lesiones previas, conducta, objetivos específicos).</p>
                    </div>

                    <div className="glass-panel p-5 rounded-2xl border border-white/10 bg-black/40 flex flex-col gap-4">
                      <textarea
                        rows={8}
                        value={privateNoteText}
                        onChange={(e) => setPrivateNoteText(e.target.value)}
                        placeholder="Escribe aquí las observaciones privadas del alumno..."
                        className="w-full bg-black/50 border border-white/10 rounded-xl p-4 text-xs text-white placeholder:text-neutral-600 focus:outline-none focus:border-amber-400/50 leading-relaxed resize-y font-mono"
                      />

                      <div className="flex justify-between items-center">
                        <span className="text-[10px] text-neutral-500">Privado &middot; Solo visible por Sierra Coaching</span>
                        <button
                          type="button"
                          onClick={handleSavePrivateNote}
                          className="bg-amber-400 hover:bg-amber-500 text-black font-extrabold uppercase text-xs tracking-wider px-6 py-2.5 rounded-xl transition-all cursor-pointer shadow-lg flex items-center gap-2"
                        >
                          <Lock className="w-3.5 h-3.5" />
                          <span>Guardar Nota Privada</span>
                        </button>
                      </div>
                    </div>
                  </div>
                )}
                {/* VIEW 6: CHAT TAB */}
                {adminTab === 'chat' && (
                  <div className="flex flex-col gap-4">
                    <div>
                      <h4 className="text-sm font-bold text-white uppercase tracking-wider">Chat Directo con {selectedClient.name}</h4>
                      <p className="text-[10px] text-neutral-500 mt-0.5">Resuelve dudas sobre el plan de entrenamiento o la dieta de forma interactiva.</p>
                    </div>
                    <ChatWindow 
                      contactId={selectedClient.id}
                      contactName={selectedClient.name}
                      currentUserId={JSON.parse(localStorage.getItem('gym_auth_user') || sessionStorage.getItem('gym_auth_user') || '{}').id || 1}
                      showToast={showToast}
                    />
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

      {/* Video Preview Modal for Coach */}
      {previewVideoModal.isOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/85 backdrop-blur-md p-4 animate-slide-in">
          <div className="glass-panel w-full max-w-2xl rounded-2xl overflow-hidden shadow-2xl border border-white/10 flex flex-col bg-gymDark-900">
            <div className="p-4 flex justify-between items-center border-b border-white/5">
              <h3 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-2">
                <Play className="w-4 h-4 text-gymNeon fill-gymNeon" />
                <span>Vista Previa: {previewVideoModal.name}</span>
              </h3>
              <button
                onClick={() => setPreviewVideoModal({ isOpen: false, parsedVideo: null, name: '', isLoading: true })}
                className="text-neutral-400 hover:text-white transition-colors cursor-pointer p-1 rounded-lg hover:bg-white/5"
              >
                <X className="w-5 h-5" />
              </button>
            </div>
            
            <div className="p-5 flex flex-col gap-4">
              {previewVideoModal.parsedVideo && previewVideoModal.parsedVideo.embedUrl ? (
                <div className="relative aspect-video rounded-xl overflow-hidden border border-white/5 bg-black">
                  {previewVideoModal.isLoading && (
                    <div className="absolute inset-0 flex flex-col items-center justify-center bg-black/80 z-10 gap-2">
                      <Loader2 className="w-8 h-8 text-gymNeon animate-spin" />
                      <span className="text-xs text-neutral-400 font-medium">Cargando demostración...</span>
                    </div>
                  )}

                  {previewVideoModal.parsedVideo.isDirectFile ? (
                    <video
                      src={previewVideoModal.parsedVideo.embedUrl}
                      controls
                      autoPlay
                      playsInline
                      preload="metadata"
                      className="w-full h-full object-contain"
                      onLoadedData={() => setPreviewVideoModal(prev => ({ ...prev, isLoading: false }))}
                      onError={() => setPreviewVideoModal(prev => ({ ...prev, isLoading: false }))}
                    />
                  ) : (
                    <iframe
                      src={previewVideoModal.parsedVideo.embedUrl}
                      title={`Video técnica ${previewVideoModal.name}`}
                      className="absolute inset-0 w-full h-full"
                      allowFullScreen
                      allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture; web-share"
                      onLoad={() => setPreviewVideoModal(prev => ({ ...prev, isLoading: false }))}
                    ></iframe>
                  )}
                </div>
              ) : (
                <div className="text-center py-10 flex flex-col items-center gap-3 border border-dashed border-white/10 rounded-xl bg-white/[0.01]">
                  <HelpCircle className="w-10 h-10 text-neutral-500" />
                  <p className="text-xs text-neutral-400 max-w-sm">
                    No se detectó un video específico. Si guardas, el alumno verá la búsqueda recomendada en YouTube.
                  </p>
                </div>
              )}
              
              <div className="flex flex-wrap justify-between items-center gap-2 mt-2 border-t border-white/5 pt-4">
                <span className="text-[10px] text-neutral-500 font-medium">Tipo detectado: {previewVideoModal.parsedVideo?.type || 'N/A'}</span>
                
                <div className="flex items-center gap-2">
                  {previewVideoModal.parsedVideo && previewVideoModal.parsedVideo.rawUrl && (
                    <a
                      href={previewVideoModal.parsedVideo.rawUrl}
                      target="_blank"
                      rel="noreferrer"
                      className="flex items-center gap-1.5 bg-white/10 hover:bg-white/20 text-white font-bold text-[10px] tracking-wider px-3 py-2.5 rounded-lg border border-white/10 transition-all cursor-pointer"
                    >
                      <ExternalLink className="w-3.5 h-3.5" />
                      <span>Abrir Link Directo</span>
                    </a>
                  )}
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
