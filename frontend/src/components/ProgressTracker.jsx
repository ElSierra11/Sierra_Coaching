import React, { useState } from 'react';
import { api } from '../api';
import { Scale, Ruler, Camera, Plus, Dumbbell, TrendingUp } from 'lucide-react';

export default function ProgressTracker({ client, onUpdateClient, showToast }) {
  const [newWeight, setNewWeight] = useState('');
  const [selectedForceExerciseId, setSelectedForceExerciseId] = useState('');
  
  // Measurements inputs
  const [waist, setWaist] = useState('');
  const [hip, setHip] = useState('');
  const [thigh, setThigh] = useState('');

  // Calculators states
  const [calcTab, setCalcTab] = useState('1rm');
  const [calcWeight, setCalcWeight] = useState(80);
  const [calcReps, setCalcReps] = useState(5);
  const [calcGender, setCalcGender] = useState('male');
  const [calcNeck, setCalcNeck] = useState(38);
  const [calcWaist, setCalcWaist] = useState(88);
  const [calcHip, setCalcHip] = useState(94);
  const [calcHeight, setCalcHeight] = useState(170);
  const [calcAge, setCalcAge] = useState(25);
  const [calcActivity, setCalcActivity] = useState(1.375);

  // Photos inputs
  const [photoLabel, setPhotoLabel] = useState('');
  const [photoUrl, setPhotoUrl] = useState('');

  const [savingWeight, setSavingWeight] = useState(false);
  const [savingMetrics, setSavingMetrics] = useState(false);
  const [savingPhoto, setSavingPhoto] = useState(false);

  const weightHistory = client.weight_history || [];
  const measurementsHistory = client.measurements_history || [];
  const progressPhotos = client.progress_photos || [];

  // Weight Logging Handler
  const handleWeightSubmit = async (e) => {
    e.preventDefault();
    if (!newWeight || savingWeight) return;
    setSavingWeight(true);

    try {
      const addedLog = await api.logWeight(client.id, newWeight);
      onUpdateClient({
        ...client,
        weight_history: [...weightHistory, addedLog]
      });
      setNewWeight('');
      showToast("¡Peso registrado con éxito!", "success");
    } catch (err) {
      showToast("Error al guardar peso: " + err.message, "error");
    } finally {
      setSavingWeight(false);
    }
  };

  // Measurements Logging Handler
  const handleMeasurementsSubmit = async (e) => {
    e.preventDefault();
    if (!waist || !hip || !thigh || savingMetrics) return;
    setSavingMetrics(true);

    try {
      const addedLog = await api.logMeasurements(client.id, { waist, hip, thigh });
      onUpdateClient({
        ...client,
        measurements_history: [...measurementsHistory, addedLog]
      });
      setWaist('');
      setHip('');
      setThigh('');
      showToast("¡Medidas corporales registradas!", "success");
    } catch (err) {
      showToast("Error al guardar medidas: " + err.message, "error");
    } finally {
      setSavingMetrics(false);
    }
  };

  // Photo Upload Handler
  const handlePhotoSubmit = async (e) => {
    e.preventDefault();
    if (!photoLabel || !photoUrl || savingPhoto) return;
    setSavingPhoto(true);

    try {
      const addedPhoto = await api.addProgressPhoto(client.id, photoLabel, photoUrl);
      onUpdateClient({
        ...client,
        progress_photos: [...progressPhotos, addedPhoto]
      });
      setPhotoLabel('');
      setPhotoUrl('');
      showToast("¡Foto de progreso añadida!", "success");
    } catch (err) {
      showToast("Error al guardar foto: " + err.message, "error");
    } finally {
      setSavingPhoto(false);
    }
  };

  const getEstimated1RM = () => {
    const w = parseFloat(calcWeight);
    const r = parseInt(calcReps);
    if (isNaN(w) || isNaN(r) || r <= 0) return 0;
    return Math.round(w * (1 + r / 30) * 10) / 10;
  };

  const getBodyFat = () => {
    const neck = parseFloat(calcNeck);
    const waist = parseFloat(calcWaist);
    const hip = parseFloat(calcHip);
    const h = parseFloat(calcHeight);
    if (isNaN(neck) || isNaN(waist) || isNaN(h) || h <= 0) return 0;
    
    let bf = 0;
    if (calcGender === 'male') {
      const logDiff = Math.log10(waist - neck);
      const logH = Math.log10(h);
      if (waist > neck) {
        bf = 86.010 * logDiff - 70.041 * logH + 36.76;
      }
    } else {
      const logDiff = Math.log10(waist + hip - neck);
      const logH = Math.log10(h);
      if ((waist + hip) > neck) {
        bf = 163.205 * logDiff - 97.684 * logH - 78.387;
      }
    }
    return Math.max(2, Math.round(bf * 10) / 10);
  };

  const getTDEE = () => {
    const w = client.weight_history && client.weight_history.length > 0 
      ? client.weight_history[client.weight_history.length - 1].weight 
      : (client.profile?.initial_weight || 70.0);
    const h = (client.profile?.height || 1.70) * 100;
    
    let bmr = 0;
    if (calcGender === 'male') {
      bmr = 10 * w + 6.25 * h - 5 * calcAge + 5;
    } else {
      bmr = 10 * w + 6.25 * h - 5 * calcAge - 161;
    }
    return Math.round(bmr * parseFloat(calcActivity));
  };

  // --- SVG Chart Calculations ---
  const renderWeightChart = () => {
    if (weightHistory.length === 0) return null;

    const weights = weightHistory.map(w => w.weight);
    const minWeight = Math.min(...weights) - 1;
    const maxWeight = Math.max(...weights) + 1;
    const weightRange = maxWeight - minWeight;

    // SVG sizes
    const width = 500;
    const height = 180;
    const padding = 25;

    // Calculate points coordinates
    const points = weightHistory.map((item, idx) => {
      const x = padding + (idx * (width - (padding * 2))) / Math.max(1, weightHistory.length - 1);
      const y = height - padding - ((item.weight - minWeight) * (height - (padding * 2))) / Math.max(1, weightRange);
      return { x, y, weight: item.weight, date: item.date };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    
    // Path for the filled gradient area under the line
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

    return (
      <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto">
        <defs>
          <linearGradient id="weightGrad" x1="0" y1="0" x2="0" y2="1">
            <stop offset="0%" stopColor="#e6ff00" stopOpacity="0.25" />
            <stop offset="100%" stopColor="#e6ff00" stopOpacity="0.0" />
          </linearGradient>
        </defs>

        {/* Horizontal grid lines */}
        {Array.from({ length: 4 }).map((_, i) => {
          const yVal = padding + (i * (height - (padding * 2))) / 3;
          return (
            <line 
              key={i} 
              x1={padding} 
              y1={yVal} 
              x2={width - padding} 
              y2={yVal} 
              stroke="rgba(255,255,255,0.03)" 
              strokeWidth="1" 
            />
          );
        })}

        {/* Gradient fill */}
        {areaPath && <path d={areaPath} fill="url(#weightGrad)" />}

        {/* Neon chart line */}
        <path 
          d={linePath} 
          fill="none" 
          stroke="#e6ff00" 
          strokeWidth="3" 
          strokeLinecap="round" 
          strokeLinejoin="round" 
          className="drop-shadow-[0_0_6px_rgba(230,255,0,0.5)]"
        />

        {/* Data points */}
        {points.map((p, idx) => (
          <g key={idx} className="group cursor-pointer">
            <circle 
              cx={p.x} 
              cy={p.y} 
              r="4.5" 
              fill="#0a0a0c" 
              stroke="#e6ff00" 
              strokeWidth="2.5" 
            />
            {/* Tooltip on point */}
            <text 
              x={p.x} 
              y={p.y - 10} 
              textAnchor="middle" 
              fill="#ffffff" 
              className="text-[9px] font-bold bg-neutral-900 px-1 py-0.5 rounded pointer-events-none"
            >
              {p.weight}kg
            </text>
          </g>
        ))}
      </svg>
    );
  };

  const renderStrengthChart = () => {
    const liftLogs = client.lift_logs || [];
    if (liftLogs.length === 0) return null;

    const exerciseNamesMap = {};
    
    (client.routines || []).forEach(day => {
      (day.exercises || []).forEach(ex => {
        exerciseNamesMap[ex.id] = ex.name;
      });
    });

    const loggedExIds = [...new Set(liftLogs.map(l => l.exercise_id))];
    const exerciseOptions = loggedExIds.map(id => ({
      id,
      name: exerciseNamesMap[id] || `Ejercicio #${id}`
    }));

    const activeExId = selectedForceExerciseId || (exerciseOptions[0]?.id || '');
    if (!selectedForceExerciseId && activeExId) {
      setSelectedForceExerciseId(activeExId);
    }

    const exerciseLogs = liftLogs.filter(l => l.exercise_id === Number(activeExId));
    if (exerciseLogs.length === 0) {
      return (
        <div className="flex flex-col gap-2">
          <select 
            value={selectedForceExerciseId} 
            onChange={(e) => setSelectedForceExerciseId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-white focus:outline-none w-full"
          >
            {exerciseOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
          <div className="text-center py-10 text-neutral-500 text-xs italic">Sin registros para este ejercicio.</div>
        </div>
      );
    }

    const calc1RM = (weight, reps) => weight * (1 + reps / 30);
    const weekly1RM = {};
    exerciseLogs.forEach(log => {
      const oneRM = calc1RM(log.weight, log.reps);
      const week = log.week_number;
      if (!weekly1RM[week] || oneRM > weekly1RM[week]) {
        weekly1RM[week] = oneRM;
      }
    });

    const chartData = Object.keys(weekly1RM).map(wk => ({
      week: Number(wk),
      oneRM: Math.round(weekly1RM[wk] * 10) / 10
    })).sort((a, b) => a.week - b.week);

    if (chartData.length === 0) return null;

    const oneRMs = chartData.map(d => d.oneRM);
    const minRM = Math.min(...oneRMs) - 2;
    const maxRM = Math.max(...oneRMs) + 2;
    const rmRange = maxRM - minRM || 1;

    const width = 500;
    const height = 160;
    const padding = 25;

    const points = chartData.map((d, idx) => {
      const x = padding + (idx * (width - (padding * 2))) / Math.max(1, chartData.length - 1);
      const y = height - padding - ((d.oneRM - minRM) * (height - (padding * 2))) / rmRange;
      return { x, y, oneRM: d.oneRM, week: d.week };
    });

    const linePath = points.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');
    const areaPath = points.length > 0 
      ? `${linePath} L ${points[points.length - 1].x} ${height - padding} L ${points[0].x} ${height - padding} Z`
      : "";

    return (
      <div className="flex flex-col gap-3">
        <div className="flex justify-between items-center gap-4">
          <label className="text-[10px] font-bold text-neutral-500 uppercase tracking-wide">Seleccionar Ejercicio</label>
          <select 
            value={activeExId} 
            onChange={(e) => setSelectedForceExerciseId(e.target.value)}
            className="bg-black/40 border border-white/10 rounded px-2.5 py-1.5 text-xs text-gymNeon focus:outline-none w-52 font-bold"
          >
            {exerciseOptions.map(opt => <option key={opt.id} value={opt.id}>{opt.name}</option>)}
          </select>
        </div>
        
        <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
          <svg viewBox={`0 0 ${width} ${height}`} className="w-full h-auto animate-slide-in">
            <defs>
              <linearGradient id="forceGrad" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="#ff5e3a" stopOpacity="0.25" />
                <stop offset="100%" stopColor="#ff2a54" stopOpacity="0.0" />
              </linearGradient>
            </defs>

            {Array.from({ length: 4 }).map((_, i) => {
              const yVal = padding + (i * (height - (padding * 2))) / 3;
              return <line key={i} x1={padding} y1={yVal} x2={width - padding} y2={yVal} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />;
            })}

            {areaPath && <path d={areaPath} fill="url(#forceGrad)" />}

            <path 
              d={linePath} 
              fill="none" 
              stroke="#ff5e3a" 
              strokeWidth="3" 
              strokeLinecap="round" 
              strokeLinejoin="round" 
              className="drop-shadow-[0_0_6px_rgba(255,94,58,0.5)]"
            />

            {points.map((p, idx) => (
              <g key={idx} className="group cursor-pointer">
                <circle cx={p.x} cy={p.y} r="4.5" fill="#09090c" stroke="#ff5e3a" strokeWidth="2.5" />
                <text x={p.x} y={p.y - 10} textAnchor="middle" fill="#ffffff" className="text-[9px] font-bold">
                  {p.oneRM} kg
                </text>
                <text x={p.x} y={height - 6} textAnchor="middle" fill="rgba(255,255,255,0.25)" className="text-[8px]">
                  Sem {p.week}
                </text>
              </g>
            ))}
          </svg>
        </div>
      </div>
    );
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-slide-in">
      
      {/* LEFT SECTION: WEIGHT PROGRESS CHART */}
      <div className="lg:col-span-2 flex flex-col gap-6">
        
        {/* Weight Graph Card */}
        <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Scale className="w-4 h-4 text-gymNeon" />
              <span>Historial de Peso Corporal</span>
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5 ml-5.5">Control semanal en ayunas.</p>
          </div>
          
          <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
            {weightHistory.length === 0 ? (
              <div className="text-center py-16 text-neutral-500 text-xs">
                No hay suficientes registros de peso para graficar.
              </div>
            ) : (
              renderWeightChart()
            )}
          </div>

          {/* Inline Weight Form */}
          <form onSubmit={handleWeightSubmit} className="flex gap-3 mt-2">
            <input 
              type="number" 
              step="0.1" 
              placeholder="Ej. 80.5" 
              value={newWeight} 
              onChange={(e) => setNewWeight(e.target.value)} 
              className="bg-black/30 border border-white/10 rounded-lg text-xs text-white px-3.5 py-2.5 focus:outline-none focus:border-gymNeon flex-1"
              required 
            />
            <button 
              type="submit" 
              disabled={savingWeight}
              className="bg-gymNeon text-black font-extrabold uppercase text-xs tracking-wider px-5 py-2.5 rounded-lg shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{savingWeight ? 'Registrando...' : 'Log Peso Hoy'}</span>
            </button>
          </form>
        </div>

        {/* Strength Progress Card */}
        {client.lift_logs && client.lift_logs.length > 0 && (
          <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-4">
            <div>
              <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
                <Dumbbell className="w-4 h-4 text-gymNeon" />
                <span>Historial de Fuerza Progresiva</span>
              </h4>
              <p className="text-[10px] text-neutral-500 mt-0.5 ml-5.5">1-Rep Max estimado en base a tus entrenamientos.</p>
            </div>
            {renderStrengthChart()}
          </div>
        )}

        {/* Measurements List Card */}
        <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Ruler className="w-4 h-4 text-gymNeon" />
              <span>Historial de Medidas Corporales</span>
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5 ml-5.5">Control cada 2 semanas en cintura, cadera y muslo.</p>
          </div>

          {/* Measurements Chart */}
          {measurementsHistory.length >= 2 && (() => {
            const WIDTH = 500, HEIGHT = 160, PAD = 30;
            const allVals = measurementsHistory.flatMap(m => [m.waist, m.hip, m.thigh]);
            const minVal = Math.min(...allVals) - 3;
            const maxVal = Math.max(...allVals) + 3;
            const range = maxVal - minVal || 1;
            const total = measurementsHistory.length;
            const px = (idx) => PAD + (idx * (WIDTH - PAD * 2)) / Math.max(1, total - 1);
            const py = (v) => HEIGHT - PAD - ((v - minVal) / range) * (HEIGHT - PAD * 2);
            const line = (key) => measurementsHistory.map((m, i) => `${i === 0 ? 'M' : 'L'} ${px(i)} ${py(m[key])}`).join(' ');
            const series = [
              { key: 'waist', label: 'Cintura', color: '#ff5722' },
              { key: 'hip',   label: 'Cadera',  color: '#a78bfa' },
              { key: 'thigh', label: 'Muslo',   color: '#34d399' },
            ];
            return (
              <div className="bg-black/20 p-3 rounded-xl border border-white/5">
                <div className="flex gap-4 mb-2">
                  {series.map(s => (
                    <div key={s.key} className="flex items-center gap-1.5">
                      <div className="w-3 h-1 rounded-full" style={{ background: s.color }} />
                      <span className="text-[9px] font-bold text-neutral-400 uppercase">{s.label}</span>
                    </div>
                  ))}
                </div>
                <svg viewBox={`0 0 ${WIDTH} ${HEIGHT}`} className="w-full h-auto">
                  {Array.from({ length: 4 }).map((_, i) => {
                    const yVal = PAD + (i * (HEIGHT - PAD * 2)) / 3;
                    return <line key={i} x1={PAD} y1={yVal} x2={WIDTH - PAD} y2={yVal} stroke="rgba(255,255,255,0.04)" strokeWidth="1" />;
                  })}
                  {series.map(s => (
                    <g key={s.key}>
                      <path d={line(s.key)} fill="none" stroke={s.color} strokeWidth="2.5" strokeLinecap="round" strokeLinejoin="round" />
                      {measurementsHistory.map((m, i) => (
                        <g key={i}>
                          <circle cx={px(i)} cy={py(m[s.key])} r="4" fill="#0a0a0c" stroke={s.color} strokeWidth="2" />
                          <text x={px(i)} y={py(m[s.key]) - 8} textAnchor="middle" fill={s.color} fontSize="9" fontWeight="bold">{m[s.key]}</text>
                        </g>
                      ))}
                    </g>
                  ))}
                  {measurementsHistory.map((m, i) => (
                    <text key={i} x={px(i)} y={HEIGHT - 6} textAnchor="middle" fill="rgba(255,255,255,0.25)" fontSize="8">{m.date?.slice(5)}</text>
                  ))}
                </svg>
              </div>
            );
          })()}

          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs">
              <thead>
                <tr className="text-neutral-500 border-b border-white/5 pb-2">
                  <th className="pb-2 font-bold uppercase tracking-wider">Fecha</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Cintura</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Cadera</th>
                  <th className="pb-2 font-bold uppercase tracking-wider">Muslo</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {measurementsHistory.length === 0 ? (
                  <tr>
                    <td colSpan="4" className="py-6 text-center text-neutral-500 italic">
                      Aún no hay medidas registradas.
                    </td>
                  </tr>
                ) : (
                  measurementsHistory.map((item, idx) => (
                    <tr key={item.id || idx}>
                      <td className="py-3 font-semibold text-white">{item.date}</td>
                      <td className="py-3 text-neutral-300">{item.waist} cm</td>
                      <td className="py-3 text-neutral-300">{item.hip} cm</td>
                      <td className="py-3 text-neutral-300">{item.thigh} cm</td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>

          {/* Measurements Form */}
          <form onSubmit={handleMeasurementsSubmit} className="grid grid-cols-3 sm:grid-cols-4 gap-3 items-end border-t border-white/5 pt-4 mt-2">
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Cintura (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                placeholder="90" 
                value={waist} 
                onChange={(e) => setWaist(e.target.value)} 
                className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                required 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Cadera (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                placeholder="100" 
                value={hip} 
                onChange={(e) => setHip(e.target.value)} 
                className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                required 
              />
            </div>
            <div className="flex flex-col gap-1.5">
              <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Muslo (cm)</label>
              <input 
                type="number" 
                step="0.1" 
                placeholder="60" 
                value={thigh} 
                onChange={(e) => setThigh(e.target.value)} 
                className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                required 
              />
            </div>
            <button 
              type="submit" 
              disabled={savingMetrics}
              className="bg-gymNeon text-black font-extrabold uppercase text-[10px] tracking-wider py-3 rounded-lg shadow hover:opacity-90 active:scale-95 transition-all col-span-3 sm:col-span-1 disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
            >
              <Plus className="w-3.5 h-3.5" />
              <span>{savingMetrics ? 'Guardando...' : 'Log Medidas'}</span>
            </button>
          </form>
        </div>

      </div>

      {/* RIGHT SECTION: PROGRESS PHOTOS */}
      <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-4">
        <div>
          <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
            <Camera className="w-4 h-4 text-gymNeon" />
            <span>Fotos de Progreso</span>
          </h4>
          <p className="text-[10px] text-neutral-500 mt-0.5 ml-5.5">Control fotográfico cada 4 semanas.</p>
        </div>

        {/* Photos grid */}
        <div className="grid grid-cols-1 gap-4 flex-1 overflow-y-auto max-h-[360px] pr-1">
          {progressPhotos.length === 0 ? (
            <div className="text-center py-20 text-neutral-500 text-xs border border-dashed border-white/10 rounded-xl">
              Sube tu primera foto para empezar el historial visual.
            </div>
          ) : (
            progressPhotos.map((photo, idx) => (
              <div key={photo.id || idx} className="relative rounded-xl overflow-hidden border border-white/10 aspect-video group">
                <img 
                  src={photo.url} 
                  alt={photo.label} 
                  className="w-full h-full object-cover group-hover:scale-105 transition-all duration-500" 
                  onError={(e) => {
                    e.target.src = "https://images.unsplash.com/photo-1517838277536-f5f99be501cd?w=500";
                  }}
                />
                <div className="absolute inset-0 bg-gradient-to-t from-black via-black/35 to-transparent p-3 flex flex-col justify-end">
                  <span className="text-xs font-bold text-white leading-none">{photo.label}</span>
                  <span className="text-[9px] text-neutral-400 mt-1">{photo.date}</span>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Add photo link form */}
        <form onSubmit={handlePhotoSubmit} className="flex flex-col gap-3 border-t border-white/5 pt-4 mt-2">
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Etiqueta de la Foto</label>
            <input 
              type="text" 
              placeholder="Ej. Semana 4 o Control Julio" 
              value={photoLabel} 
              onChange={(e) => setPhotoLabel(e.target.value)} 
              className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
              required 
            />
          </div>
          <div className="flex flex-col gap-1.5">
            <label className="text-[9px] font-bold text-neutral-500 uppercase tracking-wide">Enlace de Imagen (URL)</label>
            <input 
              type="url" 
              placeholder="https://enlace-imagen.com/foto.jpg" 
              value={photoUrl} 
              onChange={(e) => setPhotoUrl(e.target.value)} 
              className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
              required 
            />
          </div>
          <button 
            type="submit" 
            disabled={savingPhoto}
            className="bg-gymNeon text-black font-extrabold uppercase text-xs tracking-wider py-2.5 rounded-lg shadow hover:opacity-90 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-1 cursor-pointer"
          >
            <Plus className="w-3.5 h-3.5" />
            <span>{savingPhoto ? 'Registrando...' : 'Añadir Foto'}</span>
          </button>
        </form>
      </div>

      {/* ADDITIONAL TOOLS SECTION: CALCULATORS & ANALYTICS */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-6">
        
        {/* Calculators Card */}
        <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-5">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <Dumbbell className="w-4 h-4 text-gymNeon" />
              <span>Calculadoras de Rendimiento y Salud</span>
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5 ml-5.5">Estima tu fuerza, grasa y gasto energético diario.</p>
          </div>

          {/* Calculator tab switcher */}
          <div className="flex bg-neutral-900/50 rounded-xl p-1 border border-white/5 gap-1">
            <button
              onClick={() => setCalcTab('1rm')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                calcTab === '1rm' ? 'bg-gymNeon/15 text-gymNeon border border-gymNeon/25' : 'text-neutral-500 hover:text-white'
              }`}
            >
              1RM Cargas
            </button>
            <button
              onClick={() => setCalcTab('fat')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                calcTab === 'fat' ? 'bg-gymNeon/15 text-gymNeon border border-gymNeon/25' : 'text-neutral-500 hover:text-white'
              }`}
            >
              % Grasa Navy
            </button>
            <button
              onClick={() => setCalcTab('tdee')}
              className={`flex-1 py-1.5 rounded-lg text-[10px] font-bold uppercase tracking-wider transition-all cursor-pointer ${
                calcTab === 'tdee' ? 'bg-gymNeon/15 text-gymNeon border border-gymNeon/25' : 'text-neutral-500 hover:text-white'
              }`}
            >
              Gasto Diario (TDEE)
            </button>
          </div>

          {/* Calculator content */}
          {calcTab === '1rm' && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-neutral-500 uppercase">Peso Levantado (kg)</label>
                  <input
                    type="number"
                    value={calcWeight}
                    onChange={(e) => setCalcWeight(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-neutral-500 uppercase">Repeticiones Logradas</label>
                  <input
                    type="number"
                    value={calcReps}
                    onChange={(e) => setCalcReps(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                  />
                </div>
              </div>

              <div className="bg-gymNeon/10 border border-gymNeon/30 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-[9px] text-neutral-400 font-bold uppercase">1RM Estimado</span>
                <span className="text-3xl font-black text-white mt-1">{getEstimated1RM()} <span className="text-xs font-bold text-gymNeon">kg</span></span>
              </div>

              {/* Repetition chart */}
              <div className="grid grid-cols-4 gap-2">
                {[1, 3, 5, 10].map(r => {
                  const oneRM = getEstimated1RM();
                  const targetLoad = Math.round((oneRM / (1 + r / 30)) * 10) / 10;
                  return (
                    <div key={r} className="bg-black/20 rounded-lg p-2 border border-white/5 text-center">
                      <span className="text-[8px] text-neutral-500 font-bold block uppercase">{r} reps</span>
                      <span className="text-xs font-bold text-white block mt-1">{targetLoad} kg</span>
                    </div>
                  );
                })}
              </div>
            </div>
          )}

          {calcTab === 'fat' && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-neutral-500 uppercase">Género</label>
                  <select
                    value={calcGender}
                    onChange={(e) => setCalcGender(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon font-bold"
                  >
                    <option value="male" className="bg-[#0c0c12]">Masculino</option>
                    <option value="female" className="bg-[#0c0c12]">Femenino</option>
                  </select>
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-neutral-500 uppercase">Cintura (cm)</label>
                  <input
                    type="number"
                    value={calcWaist}
                    onChange={(e) => setCalcWaist(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-neutral-500 uppercase">Cuello (cm)</label>
                  <input
                    type="number"
                    value={calcNeck}
                    onChange={(e) => setCalcNeck(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-neutral-500 uppercase">Altura (cm)</label>
                  <input
                    type="number"
                    value={calcHeight}
                    onChange={(e) => setCalcHeight(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                  />
                </div>
                {calcGender === 'female' && (
                  <div className="flex flex-col gap-1.5 col-span-2">
                    <label className="text-[8px] font-bold text-neutral-500 uppercase">Cadera (cm)</label>
                    <input
                      type="number"
                      value={calcHip}
                      onChange={(e) => setCalcHip(e.target.value)}
                      className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none focus:border-gymNeon"
                    />
                  </div>
                )}
              </div>

              <div className="bg-gymNeon/10 border border-gymNeon/30 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-[9px] text-neutral-400 font-bold uppercase">Grasa Corporal Estimada</span>
                <span className="text-3xl font-black text-white mt-1">{getBodyFat()}%</span>
              </div>
            </div>
          )}

          {calcTab === 'tdee' && (
            <div className="flex flex-col gap-4 animate-slide-in">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-neutral-500 uppercase">Edad (años)</label>
                  <input
                    type="number"
                    value={calcAge}
                    onChange={(e) => setCalcAge(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none"
                  />
                </div>
                <div className="flex flex-col gap-1.5">
                  <label className="text-[8px] font-bold text-neutral-500 uppercase">Actividad Física</label>
                  <select
                    value={calcActivity}
                    onChange={(e) => setCalcActivity(e.target.value)}
                    className="bg-black/30 border border-white/10 rounded-lg text-xs text-white p-2.5 focus:outline-none font-bold"
                  >
                    <option value="1.2" className="bg-[#0c0c12]">Sedentario (Oficina)</option>
                    <option value="1.375" className="bg-[#0c0c12]">Ligero (Entreno 1-3d)</option>
                    <option value="1.55" className="bg-[#0c0c12]">Moderado (Entreno 3-5d)</option>
                    <option value="1.725" className="bg-[#0c0c12]">Intenso (Entreno 6-7d)</option>
                  </select>
                </div>
              </div>

              <div className="bg-gymNeon/10 border border-gymNeon/30 rounded-xl p-4 flex flex-col items-center justify-center">
                <span className="text-[9px] text-neutral-400 font-bold uppercase">Gasto Energético Total (TDEE)</span>
                <span className="text-3xl font-black text-white mt-1">{getTDEE()} <span className="text-xs font-bold text-gymNeon">kcal / día</span></span>
              </div>
            </div>
          )}
        </div>

        {/* Habit Analytics Card */}
        <div className="glass-panel p-6 rounded-2xl shadow-lg flex flex-col gap-4">
          <div>
            <h4 className="text-sm font-bold text-white uppercase tracking-wider flex items-center gap-1.5">
              <TrendingUp className="w-4 h-4 text-gymNeon" />
              <span>Analíticas y Progreso de Hábitos</span>
            </h4>
            <p className="text-[10px] text-neutral-500 mt-0.5 ml-5.5">Cumplimiento de agua y sueño en las últimas semanas.</p>
          </div>

          {(() => {
            const logs = [...(client.all_habit_logs || [])].sort((a, b) => new Date(a.date) - new Date(b.date)).slice(-7);
            if (logs.length === 0) {
              return <div className="text-center py-20 text-neutral-500 text-xs italic">Aún no hay logs de hábitos suficientes para mostrar analíticas.</div>;
            }

            const chartW = 400;
            const chartH = 140;
            const pad = 20;

            const waterPoints = logs.map((l, idx) => {
              const val = l.water_cups * 0.25; 
              const pct = Math.min(100, (val / 3.0) * 100);
              const x = pad + (idx * (chartW - pad * 2)) / Math.max(1, logs.length - 1);
              const y = chartH - pad - (pct * (chartH - pad * 2)) / 100;
              return { x, y, val, date: l.date?.slice(8) };
            });

            const sleepPoints = logs.map((l, idx) => {
              const val = l.sleep_hours;
              const pct = Math.min(100, (val / 10.0) * 100);
              const x = pad + (idx * (chartW - pad * 2)) / Math.max(1, logs.length - 1);
              const y = chartH - pad - (pct * (chartH - pad * 2)) / 100;
              return { x, y, val };
            });

            const sleepLine = sleepPoints.map((p, idx) => `${idx === 0 ? 'M' : 'L'} ${p.x} ${p.y}`).join(' ');

            return (
              <div className="flex flex-col gap-4">
                <div className="bg-black/20 p-2.5 rounded-xl border border-white/5">
                  <div className="flex gap-4 justify-between items-center mb-2">
                    <span className="text-[8px] font-bold text-neutral-500 uppercase">Hidratación (L) vs Sueño (h)</span>
                    <div className="flex gap-3">
                      <div className="flex items-center gap-1 text-[8px] font-bold text-blue-400">
                        <div className="w-2 h-2 bg-blue-500/30 border border-blue-400 rounded-sm" />
                        <span>AGUA</span>
                      </div>
                      <div className="flex items-center gap-1 text-[8px] font-bold text-purple-400">
                        <div className="w-2 h-0.5 bg-purple-400" />
                        <span>SUEÑO</span>
                      </div>
                    </div>
                  </div>

                  <svg viewBox={`0 0 ${chartW} ${chartH}`} className="w-full h-auto">
                    {Array.from({ length: 4 }).map((_, i) => {
                      const y = pad + (i * (chartH - pad * 2)) / 3;
                      return <line key={i} x1={pad} y1={y} x2={chartW - pad} y2={y} stroke="rgba(255,255,255,0.03)" strokeWidth="1" />;
                    })}

                    {waterPoints.map((p, idx) => (
                      <g key={idx}>
                        <rect
                          x={p.x - 6}
                          y={p.y}
                          width="12"
                          height={chartH - pad - p.y}
                          fill="rgba(96, 165, 250, 0.25)"
                          stroke="#60a5fa"
                          strokeWidth="1"
                          rx="2"
                        />
                        <text x={p.x} y={p.y - 4} textAnchor="middle" fill="#60a5fa" className="text-[7px] font-extrabold">{p.val}L</text>
                      </g>
                    ))}

                    <path d={sleepLine} fill="none" stroke="#a78bfa" strokeWidth="2.5" strokeLinecap="round" />
                    {sleepPoints.map((p, idx) => (
                      <g key={idx}>
                        <circle cx={p.x} cy={p.y} r="3" fill="#09090c" stroke="#a78bfa" strokeWidth="2" />
                        <text x={p.x} y={p.y - 8} textAnchor="middle" fill="#a78bfa" className="text-[7px] font-extrabold">{p.val}h</text>
                        <text x={p.x} y={chartH - 6} textAnchor="middle" fill="rgba(255,255,255,0.2)" className="text-[7px] font-semibold">{waterPoints[idx].date}</text>
                      </g>
                    ))}
                  </svg>
                </div>
              </div>
            );
          })()}
        </div>

      </div>

    </div>
  );
}
