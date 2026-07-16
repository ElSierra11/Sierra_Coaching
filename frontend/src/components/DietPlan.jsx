import React, { useState, useEffect } from 'react';
import { Lightbulb, Check, Calculator, ShoppingCart, Plus, RefreshCw, X, HelpCircle } from 'lucide-react';
import { api } from '../api';

const MacroCircle = ({ percentage, color, label, value, target }) => {
  const radius = 40;
  const stroke = 6;
  const normalizedRadius = radius - stroke * 1.5;
  const circumference = normalizedRadius * 2 * Math.PI;
  const strokeDashoffset = circumference - (Math.min(percentage, 100) / 100) * circumference;

  return (
    <div className="bg-black/25 rounded-2xl p-4 border border-white/5 flex flex-col gap-2 items-center text-center relative overflow-hidden flex-1 min-w-0 md:min-w-[90px]">
      <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">{label}</span>
      <div className="relative w-16 h-16 flex items-center justify-center">
        <svg className="w-full h-full transform -rotate-90">
          <circle
            stroke="rgba(255,255,255,0.03)"
            fill="transparent"
            strokeWidth={stroke}
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="translate-x-[0px] translate-y-[0px]"
          />
          <circle
            stroke={color}
            fill="transparent"
            strokeWidth={stroke}
            strokeDasharray={circumference + ' ' + circumference}
            style={{ strokeDashoffset }}
            strokeLinecap="round"
            r={normalizedRadius}
            cx={radius}
            cy={radius}
            className="translate-x-[0px] translate-y-[0px] transition-all duration-500 ease-out"
          />
        </svg>
        <div className="absolute text-center flex flex-col items-center">
          <span className="text-xs font-black text-white">{Math.round(percentage)}%</span>
        </div>
      </div>
      <span className="text-[11px] font-black text-white mt-1">
        {value}g <span className="text-[8px] text-neutral-500 font-normal">/ {target}g</span>
      </span>
    </div>
  );
};

export default function DietPlan({ client, onUpdateClient, showToast }) {
  const [activeDay, setActiveDay] = useState(1);
  const [completedMeals, setCompletedMeals] = useState({});
  const [nutritionLog, setNutritionLog] = useState({
    calories_consumed: 0,
    proteins_consumed: 0,
    carbs_consumed: 0,
    fats_consumed: 0,
    meals_completed: '{}'
  });

  // Calculators states
  const [showCalculator, setShowCalculator] = useState(false);
  const [gender, setGender] = useState(client.profile?.gender || 'male');
  const [age, setAge] = useState(client.profile?.age || 25);
  const [calcWeight, setCalcWeight] = useState(client.profile?.initial_weight || 75);
  const [calcHeight, setCalcHeight] = useState(client.profile?.height ? Math.round(client.profile.height * 100) : 170);
  const [activityLevel, setActivityLevel] = useState(client.profile?.activity_level || 'moderado');
  const [goal, setGoal] = useState('perder');
  const [calculatedCal, setCalculatedCal] = useState(0);
  const [calculatedMacros, setCalculatedMacros] = useState({ p: 0, c: 0, f: 0 });

  // Shopping List states
  const [showShoppingList, setShowShoppingList] = useState(false);
  const [shoppingItems, setShoppingItems] = useState([]);
  const [checkedItems, setCheckedItems] = useState({});

  // Manual log modal
  const [showManualLog, setShowManualLog] = useState(false);
  const [manualCal, setManualCal] = useState('');
  const [manualProt, setManualProt] = useState('');
  const [manualCarb, setManualCarb] = useState('');
  const [manualFat, setManualFat] = useState('');

  const diet = client.diet || [];
  const currentDayDiet = diet.find(d => d.day_number === activeDay) || {
    desayuno: "Sin asignar",
    almuerzo: "Sin asignar",
    cena: "Sin asignar",
    merienda: "Sin asignar",
    calories: 0,
    proteins: 0,
    carbs: 0,
    fats: 0
  };

  // Load nutrition log from client data
  useEffect(() => {
    if (client.today_nutrition_log) {
      setNutritionLog(client.today_nutrition_log);
      try {
        const parsed = JSON.parse(client.today_nutrition_log.meals_completed || '{}');
        setCompletedMeals(parsed);
      } catch (e) {
        setCompletedMeals({});
      }
    }
  }, [client]);

  // Recalculate TDEE when inputs change
  useEffect(() => {
    let tmb = 0;
    if (gender === 'male') {
      tmb = 10 * calcWeight + 6.25 * calcHeight - 5 * age + 5;
    } else {
      tmb = 10 * calcWeight + 6.25 * calcHeight - 5 * age - 161;
    }

    const activityFactors = {
      sedentario: 1.2,
      ligero: 1.375,
      moderado: 1.55,
      activo: 1.725,
      muy_activo: 1.9
    };
    const tdee = tmb * (activityFactors[activityLevel] || 1.2);

    let targetCal = Math.round(tdee);
    if (goal === 'perder') targetCal -= 400;
    if (goal === 'ganar') targetCal += 400;

    // Estimate macros
    const prot = Math.round(calcWeight * 2.0); // 2g per kg
    const fat = Math.round(calcWeight * 0.8);  // 0.8g per kg
    const remainingCal = targetCal - (prot * 4) - (fat * 9);
    const carb = Math.max(0, Math.round(remainingCal / 4));

    setCalculatedCal(targetCal);
    setCalculatedMacros({ p: prot, c: carb, f: fat });
  }, [gender, age, calcWeight, calcHeight, activityLevel, goal]);

  // Handle meal checked/unchecked (persisted in DB)
  const handleMealToggle = async (mealName) => {
    const isCompleted = !completedMeals[mealName];
    const updatedMeals = {
      ...completedMeals,
      [mealName]: isCompleted
    };

    setCompletedMeals(updatedMeals);

    // Calculate calories/macros to add or subtract
    // Desayuno 25%, Almuerzo 35%, Cena 25%, Merienda 15%
    const mealPercentages = {
      desayuno: 0.25,
      almuerzo: 0.35,
      cena: 0.25,
      merienda: 0.15
    };
    const factor = isCompleted ? 1 : -1;
    const percentage = mealPercentages[mealName] || 0.25;

    const baseCal = currentDayDiet.calories || 2000;
    const baseProt = currentDayDiet.proteins || 140;
    const baseCarb = currentDayDiet.carbs || 180;
    const baseFat = currentDayDiet.fats || 65;

    const newLog = {
      ...nutritionLog,
      calories_consumed: Math.max(0, nutritionLog.calories_consumed + Math.round(baseCal * percentage * factor)),
      proteins_consumed: Math.max(0, nutritionLog.proteins_consumed + Math.round(baseProt * percentage * factor)),
      carbs_consumed: Math.max(0, nutritionLog.carbs_consumed + Math.round(baseCarb * percentage * factor)),
      fats_consumed: Math.max(0, nutritionLog.fats_consumed + Math.round(baseFat * percentage * factor)),
      meals_completed: JSON.stringify(updatedMeals)
    };

    setNutritionLog(newLog);

    try {
      const saved = await api.updateTodayNutrition(client.id, newLog);
      if (onUpdateClient) {
        onUpdateClient({
          ...client,
          today_nutrition_log: saved
        });
      }
      const formattedMeal = mealName.charAt(0).toUpperCase() + mealName.slice(1);
      showToast(`¡${formattedMeal} ${isCompleted ? 'completado' : 'desmarcado'}! Progreso guardado.`, "success");
    } catch (err) {
      showToast("Error al guardar consumo: " + err.message, "error");
    }
  };

  // Register whole day diet macros automatically
  const handleRegisterWholeDay = async () => {
    const updatedMeals = {
      desayuno: true,
      almuerzo: true,
      cena: true,
      merienda: true
    };
    setCompletedMeals(updatedMeals);

    const newLog = {
      ...nutritionLog,
      calories_consumed: currentDayDiet.calories || 2000,
      proteins_consumed: currentDayDiet.proteins || 140,
      carbs_consumed: currentDayDiet.carbs || 180,
      fats_consumed: currentDayDiet.fats || 65,
      meals_completed: JSON.stringify(updatedMeals)
    };

    setNutritionLog(newLog);

    try {
      const saved = await api.updateTodayNutrition(client.id, newLog);
      if (onUpdateClient) {
        onUpdateClient({
          ...client,
          today_nutrition_log: saved
        });
      }
      showToast("¡Macros de la dieta completa de hoy registrados con éxito!", "success");
    } catch (err) {
      showToast("Error al guardar: " + err.message, "error");
    }
  };

  // Reset daily macros back to zero
  const handleResetDaily = async () => {
    if (!window.confirm("¿Seguro que deseas reiniciar tu consumo de macros de hoy a cero?")) return;
    const updatedMeals = {};
    setCompletedMeals(updatedMeals);

    const newLog = {
      ...nutritionLog,
      calories_consumed: 0,
      proteins_consumed: 0,
      carbs_consumed: 0,
      fats_consumed: 0,
      meals_completed: '{}'
    };

    setNutritionLog(newLog);

    try {
      const saved = await api.updateTodayNutrition(client.id, newLog);
      if (onUpdateClient) {
        onUpdateClient({
          ...client,
          today_nutrition_log: saved
        });
      }
      showToast("Macros diarios reseteados.", "info");
    } catch (err) {
      showToast("Error: " + err.message, "error");
    }
  };

  // Submit manual macros log
  const handleManualLogSubmit = async (e) => {
    e.preventDefault();
    const cal = parseInt(manualCal) || 0;
    const prot = parseInt(manualProt) || 0;
    const carb = parseInt(manualCarb) || 0;
    const fat = parseInt(manualFat) || 0;

    if (!cal && !prot && !carb && !fat) {
      showToast("Por favor, ingresa al menos un valor.", "info");
      return;
    }

    const newLog = {
      ...nutritionLog,
      calories_consumed: nutritionLog.calories_consumed + cal,
      proteins_consumed: nutritionLog.proteins_consumed + prot,
      carbs_consumed: nutritionLog.carbs_consumed + carb,
      fats_consumed: nutritionLog.fats_consumed + fat
    };

    setNutritionLog(newLog);
    setShowManualLog(false);
    setManualCal('');
    setManualProt('');
    setManualCarb('');
    setManualFat('');

    try {
      const saved = await api.updateTodayNutrition(client.id, newLog);
      if (onUpdateClient) {
        onUpdateClient({
          ...client,
          today_nutrition_log: saved
        });
      }
      showToast("¡Macros registrados manualmente!", "success");
    } catch (err) {
      showToast("Error al guardar macros: " + err.message, "error");
    }
  };

  // Save TDEE objectives to Profile
  const handleSaveTDEE = async () => {
    try {
      const savedProfile = await api.saveTDEE(client.id, {
        tdee: calculatedCal,
        targetCalories: calculatedCal,
        targetProteins: calculatedMacros.p,
        targetCarbs: calculatedMacros.c,
        targetFats: calculatedMacros.f,
        gender,
        activityLevel,
        age
      });
      
      if (onUpdateClient) {
        onUpdateClient({
          ...client,
          profile: savedProfile
        });
      }
      showToast("¡Objetivos nutricionales actualizados en tu perfil!", "success");
      setShowCalculator(false);
    } catch (err) {
      showToast("Error al guardar objetivos: " + err.message, "error");
    }
  };

  // Generate Weekly Shopping List
  const handleGenerateShoppingList = () => {
    const rawMeals = [];
    diet.forEach(d => {
      if (d.desayuno && d.desayuno !== "Sin asignar") rawMeals.push(d.desayuno);
      if (d.almuerzo && d.almuerzo !== "Sin asignar") rawMeals.push(d.almuerzo);
      if (d.cena && d.cena !== "Sin asignar") rawMeals.push(d.cena);
      if (d.merienda && d.merienda !== "Sin asignar") rawMeals.push(d.merienda);
    });

    const parsedItems = new Set();
    const categories = {
      proteinas: [],
      carbos: [],
      otros: []
    };

    // Very simple cleaning logic to separate ingredients
    rawMeals.forEach(meal => {
      const parts = meal.split(/[,\n+]/);
      parts.forEach(part => {
        const cleaned = part.trim().replace(/^(\d+g|\d+\s*tazas|\d+\s*huevos|\d+\s*claras|\d+\s*cucharadas|\d+\s*tajadas|\d+\s*arepas|\d+\s*arepa|\d+\s*banano|\d+\s*manzana|\d+\s*naranja|\d+\s*banana)\s*(de|con|y)?/i, "").trim();
        if (cleaned.length > 2 && !cleaned.toLowerCase().includes("sin asignar") && !cleaned.toLowerCase().includes("moderado")) {
          parsedItems.add(cleaned.charAt(0).toUpperCase() + cleaned.slice(1).toLowerCase());
        }
      });
    });

    const itemsArray = Array.from(parsedItems);
    
    // Categorize
    const pKeywords = ["huevo", "claras", "pollo", "pechuga", "carne", "pavo", "atun", "atún", "salmon", "salmón", "pescado", "queso", "yogurt", "yogur", "proteina"];
    const cKeywords = ["avena", "arroz", "pan", "papa", "yuca", "arepa", "arepas", "pasta", "banana", "banana", "banano", "manzana", "fresa", "naranja", "fruta", "verduras", "brocoli", "brócoli", "ensalada", "espinaca", "zanahoria"];
    
    const structuredItems = itemsArray.map(item => {
      const val = item.toLowerCase();
      let category = "otros";
      if (pKeywords.some(kw => val.includes(kw))) category = "proteinas";
      else if (cKeywords.some(kw => val.includes(kw))) category = "carbos";

      return { name: item, category };
    });

    setShoppingItems(structuredItems);
    setCheckedItems({});
    setShowShoppingList(true);
  };

  // Target values to display on progress circles
  // Priority: 1. Diet plan macros, 2. Cal TDEE saved profile macros, 3. Default fallbacks
  const targetCalories = currentDayDiet.calories || client.profile?.target_calories || 2000;
  const targetProteins = currentDayDiet.proteins || client.profile?.target_proteins || 140;
  const targetCarbs = currentDayDiet.carbs || client.profile?.target_carbs || 180;
  const targetFats = currentDayDiet.fats || client.profile?.target_fats || 65;

  const pctCalories = targetCalories > 0 ? (nutritionLog.calories_consumed / targetCalories) * 100 : 0;
  const pctProteins = targetProteins > 0 ? (nutritionLog.proteins_consumed / targetProteins) * 100 : 0;
  const pctCarbs = targetCarbs > 0 ? (nutritionLog.carbs_consumed / targetCarbs) * 100 : 0;
  const pctFats = targetFats > 0 ? (nutritionLog.fats_consumed / targetFats) * 100 : 0;

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
        <div>
          <h3 className="text-lg font-bold text-white uppercase tracking-wider">Plan de Alimentación Semanal</h3>
          <p className="text-neutral-500 text-xs mt-0.5">Sigue tu dieta, calcula requerimientos y consolida tu mercado.</p>
        </div>
        <div className="flex gap-2 w-full sm:w-auto">
          <button 
            onClick={() => setShowCalculator(!showCalculator)}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-white/5 border border-white/10 text-neutral-300 hover:text-white transition-all text-xs font-bold cursor-pointer"
          >
            <Calculator className="w-3.5 h-3.5" />
            <span>Calculadora TDEE</span>
          </button>
          <button 
            onClick={handleGenerateShoppingList}
            className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1.5 py-2 px-3 rounded-xl bg-gymNeon text-black hover:opacity-90 transition-all text-xs font-black cursor-pointer"
          >
            <ShoppingCart className="w-3.5 h-3.5" />
            <span>Lista de Compras</span>
          </button>
        </div>
      </div>

      {/* TDEE Calculator Panel (Expandable) */}
      {showCalculator && (
        <div className="glass-panel p-6 rounded-2xl bg-neutral-900/50 border border-gymNeon/15 flex flex-col gap-5">
          <div className="flex justify-between items-start">
            <div>
              <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Herramienta Nutricional</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Calculadora de Requerimiento Energético (TDEE)</h4>
            </div>
            <button onClick={() => setShowCalculator(false)} className="text-neutral-500 hover:text-white cursor-pointer">
              <X className="w-4 h-4" />
            </button>
          </div>

          <div className="grid grid-cols-2 sm:grid-cols-3 md:grid-cols-6 gap-4">
            {/* Gender */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-neutral-500 font-bold uppercase">Género</label>
              <select 
                value={gender} 
                onChange={(e) => setGender(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon/50"
              >
                <option value="male">Masculino</option>
                <option value="female">Femenino</option>
              </select>
            </div>
            {/* Age */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-neutral-500 font-bold uppercase">Edad (años)</label>
              <input 
                type="number" 
                value={age}
                onChange={(e) => setAge(Math.max(1, parseInt(e.target.value) || 25))}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon/50"
              />
            </div>
            {/* Weight */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-neutral-500 font-bold uppercase">Peso (kg)</label>
              <input 
                type="number" 
                value={calcWeight}
                onChange={(e) => setCalcWeight(Math.max(1, parseFloat(e.target.value) || 70))}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon/50"
              />
            </div>
            {/* Height */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-neutral-500 font-bold uppercase">Estatura (cm)</label>
              <input 
                type="number" 
                value={calcHeight}
                onChange={(e) => setCalcHeight(Math.max(1, parseInt(e.target.value) || 170))}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon/50"
              />
            </div>
            {/* Activity Level */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-neutral-500 font-bold uppercase">Actividad</label>
              <select 
                value={activityLevel} 
                onChange={(e) => setActivityLevel(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon/50"
              >
                <option value="sedentario">Sedentario</option>
                <option value="ligero">Ligero</option>
                <option value="moderado">Moderado</option>
                <option value="activo">Activo</option>
                <option value="muy_activo">Muy Activo</option>
              </select>
            </div>
            {/* Goal */}
            <div className="flex flex-col gap-1.5">
              <label className="text-[10px] text-neutral-500 font-bold uppercase">Objetivo</label>
              <select 
                value={goal} 
                onChange={(e) => setGoal(e.target.value)}
                className="bg-black/40 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon/50"
              >
                <option value="perder">Definición (-400 kcal)</option>
                <option value="mantener">Mantenimiento</option>
                <option value="ganar">Volumen (+400 kcal)</option>
              </select>
            </div>
          </div>

          {/* Calcs Output Visuals */}
          <div className="bg-black/35 rounded-xl p-4 border border-white/5 flex flex-col sm:flex-row justify-between items-center gap-4">
            <div className="flex flex-col text-center sm:text-left">
              <span className="text-[9px] text-neutral-500 font-bold uppercase">Meta Calórica Sugerida</span>
              <span className="text-2xl font-black text-white">{calculatedCal} <span className="text-sm font-bold text-gymNeon">kcal / día</span></span>
            </div>

            <div className="flex gap-4 items-center">
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-neutral-500 font-bold uppercase">Proteínas</span>
                <span className="text-xs font-bold text-white">{calculatedMacros.p}g</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-neutral-500 font-bold uppercase">Carbos</span>
                <span className="text-xs font-bold text-white">{calculatedMacros.c}g</span>
              </div>
              <div className="flex flex-col items-center">
                <span className="text-[8px] text-neutral-500 font-bold uppercase">Grasas</span>
                <span className="text-xs font-bold text-white">{calculatedMacros.f}g</span>
              </div>
              <button 
                onClick={handleSaveTDEE}
                className="ml-2 bg-gymNeon text-black font-extrabold uppercase py-2 px-3 rounded-lg text-[10px] tracking-wide hover:opacity-90 active:scale-95 transition-all cursor-pointer"
              >
                Guardar en Perfil
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Day Selector */}
      <div className="flex bg-neutral-900/50 rounded-2xl p-1 border border-white/5 overflow-x-auto no-scrollbar gap-1">
        {Array.from({ length: 7 }).map((_, idx) => {
          const dayNum = idx + 1;
          const isActive = activeDay === dayNum;
          return (
            <button
              key={dayNum}
              onClick={() => setActiveDay(dayNum)}
              className={`flex-1 shrink-0 min-w-[70px] text-center py-3 rounded-xl transition-all cursor-pointer ${
                isActive 
                  ? 'bg-gymNeon text-black font-extrabold shadow-md' 
                  : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'
              }`}
            >
              <div className="text-xs font-bold">Día {dayNum}</div>
            </button>
          );
        })}
      </div>

      {/* Semáforo de Macros Diario (Premium Widget con Anillos Circular SVG) */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 border border-white/5 bg-white/[0.01]">
        
        {/* Title of Widget & Progress Controls */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-3">
          <div>
            <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Progreso de Hoy</span>
            <h4 className="text-sm font-bold text-white mt-0.5">Semáforo de Macronutrientes Diario</h4>
          </div>
          <div className="flex gap-2 w-full sm:w-auto">
            <button
              onClick={() => setShowManualLog(true)}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 py-1.5 px-2.5 rounded-lg border border-white/10 text-neutral-300 hover:text-white hover:bg-white/5 transition-all text-[10px] font-semibold cursor-pointer"
            >
              <Plus className="w-3 h-3" />
              <span>Registro Manual</span>
            </button>
            <button
              onClick={handleRegisterWholeDay}
              className="flex-1 sm:flex-initial inline-flex items-center justify-center gap-1 py-1.5 px-2.5 bg-gymNeon/10 border border-gymNeon/25 text-gymNeon hover:bg-gymNeon/20 transition-all text-[10px] font-bold cursor-pointer animate-pulse"
            >
              <Check className="w-3 h-3" />
              <span>Comí Dieta de Hoy</span>
            </button>
            <button
              onClick={handleResetDaily}
              className="inline-flex items-center justify-center p-1.5 rounded-lg border border-red-500/20 text-red-400 hover:bg-red-500/10 transition-all cursor-pointer"
              title="Resetear macros de hoy"
            >
              <RefreshCw className="w-3.5 h-3.5" />
            </button>
          </div>
        </div>

        {/* Circular Progress Rings Grid */}
        <div className="grid grid-cols-3 md:flex md:flex-nowrap gap-4">
          {/* CALORIES CARD */}
          <div className="bg-black/25 rounded-2xl p-4 border border-white/5 flex flex-col justify-between items-center text-center col-span-3 md:flex-1 md:min-w-[130px]">
            <span className="text-[9px] text-neutral-500 font-bold uppercase tracking-wider">Calorías Consumidas</span>
            <span className="text-2xl font-black text-white mt-3 mb-2">
              {nutritionLog.calories_consumed} 
              <span className="text-xs font-bold text-gymNeon block mt-0.5">kcal / {targetCalories} kcal</span>
            </span>
            <div className="w-full h-1.5 bg-white/5 rounded-full mt-2 overflow-hidden">
              <div 
                className="h-full bg-gymNeon rounded-full transition-all duration-500 ease-out" 
                style={{ width: `${Math.min(pctCalories, 100)}%` }}
              ></div>
            </div>
            <span className="text-[9px] text-neutral-400 mt-2 uppercase font-bold tracking-wider">{Math.round(pctCalories)}% completado</span>
          </div>

          {/* PROTEINS CIRCLE */}
          <MacroCircle 
            percentage={pctProteins} 
            color="#FF5722" // Warm Orange for Proteins
            label="Proteínas" 
            value={nutritionLog.proteins_consumed} 
            target={targetProteins} 
          />

          {/* CARBS CIRCLE */}
          <MacroCircle 
            percentage={pctCarbs} 
            color="#3b82f6" // Vibrant Blue for Carbs
            label="Carbohidratos" 
            value={nutritionLog.carbs_consumed} 
            target={targetCarbs} 
          />

          {/* FATS CIRCLE */}
          <MacroCircle 
            percentage={pctFats} 
            color="#eab308" // Soft Yellow for Fats
            label="Grasas" 
            value={nutritionLog.fats_consumed} 
            target={targetFats} 
          />
        </div>
      </div>

      {/* Tip Box */}
      <div className="glass-panel p-4 rounded-xl flex items-start gap-3 border-l-4 border-gymNeon bg-gymNeon/5">
        <div className="text-gymNeon flex-shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </div>
        <p className="text-xs text-neutral-400 leading-normal">
          <strong>Tip de Alimentación:</strong> Marca tus comidas a medida que las completes. La calculadora del Semáforo de Macros sumará automáticamente tu ingesta de forma proporcional.
        </p>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        {[
          { key: 'desayuno', label: 'Desayuno', content: currentDayDiet.desayuno },
          { key: 'almuerzo', label: 'Almuerzo', content: currentDayDiet.almuerzo },
          { key: 'cena', label: 'Cena', content: currentDayDiet.cena },
          { key: 'merienda', label: 'Merienda', content: currentDayDiet.merienda }
        ].map((meal) => {
          const isCompleted = !!completedMeals[meal.key];
          return (
            <div 
              key={meal.key}
              onClick={() => handleMealToggle(meal.key)}
              className={`glass-panel p-6 rounded-2xl shadow-lg border cursor-pointer hover:bg-white/[0.01] transition-all flex justify-between items-start gap-4 ${
                isCompleted 
                  ? 'border-green-500/30 bg-green-500/[0.02]' 
                  : 'border-white/5'
              }`}
            >
              <div className="flex flex-col gap-2">
                <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Opción {meal.label}</span>
                <p className="text-white text-sm font-bold leading-normal">
                  {meal.content || 'Sin asignar'}
                </p>
              </div>
              <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
                isCompleted 
                  ? 'border-green-400 bg-green-400 text-black' 
                  : 'border-white/20'
              }`}>
                {isCompleted && <Check className="w-3.5 h-3.5" />}
              </div>
            </div>
          );
        })}
      </div>

      {/* Manual Macros Log Modal */}
      {showManualLog && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <form onSubmit={handleManualLogSubmit} className="bg-neutral-900 border border-white/10 rounded-2xl p-6 w-full max-w-sm flex flex-col gap-4 animate-scale-in relative">
            <button 
              type="button"
              onClick={() => setShowManualLog(false)} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>
            
            <div className="pb-2 border-b border-white/5">
              <h4 className="text-sm font-bold text-white">Registro Manual de Macros</h4>
              <p className="text-[10px] text-neutral-500 mt-0.5">Suma calorías y gramos extra consumidos en el día.</p>
            </div>

            <div className="flex flex-col gap-3">
              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase">Calorías (kcal)</label>
                  <input 
                    type="number"
                    value={manualCal}
                    onChange={(e) => setManualCal(e.target.value)}
                    placeholder="0"
                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase">Proteínas (g)</label>
                  <input 
                    type="number"
                    value={manualProt}
                    onChange={(e) => setManualProt(e.target.value)}
                    placeholder="0"
                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon"
                  />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase">Carbohidratos (g)</label>
                  <input 
                    type="number"
                    value={manualCarb}
                    onChange={(e) => setManualCarb(e.target.value)}
                    placeholder="0"
                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon"
                  />
                </div>
                <div className="flex flex-col gap-1">
                  <label className="text-[10px] text-neutral-400 font-bold uppercase">Grasas (g)</label>
                  <input 
                    type="number"
                    value={manualFat}
                    onChange={(e) => setManualFat(e.target.value)}
                    placeholder="0"
                    className="bg-black/30 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none focus:border-gymNeon"
                  />
                </div>
              </div>
            </div>

            <button 
              type="submit"
              className="bg-gymNeon text-black font-extrabold uppercase py-2.5 rounded-xl text-xs tracking-wider hover:opacity-90 active:scale-95 transition-all mt-2 cursor-pointer"
            >
              Registrar Consumo
            </button>
          </form>
        </div>
      )}

      {/* Shopping List Modal */}
      {showShoppingList && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="bg-neutral-900 border border-white/10 rounded-3xl p-6 w-full max-w-md flex flex-col gap-4 animate-scale-in relative max-h-[90vh]">
            <button 
              onClick={() => setShowShoppingList(false)} 
              className="absolute top-4 right-4 text-neutral-500 hover:text-white bg-white/5 border border-white/10 p-1 rounded-xl cursor-pointer"
            >
              <X className="w-4 h-4" />
            </button>

            <div className="pb-2 border-b border-white/5">
              <span className="text-[10px] font-black text-gymNeon uppercase tracking-widest">Lista Consolidada</span>
              <h4 className="text-sm font-bold text-white mt-0.5">Lista de Compras Semanal</h4>
              <p className="text-[10px] text-neutral-500 mt-0.5">Ingredientes sugeridos para comprar, agrupados por su aporte principal.</p>
            </div>

            <div className="flex-1 overflow-y-auto pr-1 flex flex-col gap-4 max-h-[50vh] no-scrollbar">
              {shoppingItems.length === 0 ? (
                <div className="text-center py-8 text-neutral-500 text-xs italic">
                  Tu plan no contiene comidas descriptivas asignadas de las que podamos extraer ingredientes.
                </div>
              ) : (
                ["proteinas", "carbos", "otros"].map((cat) => {
                  const items = shoppingItems.filter(item => item.category === cat);
                  if (items.length === 0) return null;

                  const catLabels = {
                    proteinas: "Fuentes de Proteína",
                    carbos: "Carbohidratos y Frutas",
                    otros: "Otros / Grasas saludables"
                  };

                  return (
                    <div key={cat} className="flex flex-col gap-2">
                      <h5 className="text-[10px] font-black text-gymNeon uppercase tracking-wider border-b border-white/5 pb-1">{catLabels[cat]}</h5>
                      <div className="flex flex-col gap-1.5">
                        {items.map((item, idx) => {
                          const key = `${cat}_${idx}`;
                          const isChecked = !!checkedItems[key];
                          return (
                            <div 
                              key={idx}
                              onClick={() => setCheckedItems(prev => ({ ...prev, [key]: !prev[key] }))}
                              className={`flex items-center gap-3 p-2.5 rounded-xl border cursor-pointer hover:bg-white/[0.02] transition-all ${
                                isChecked ? 'bg-white/[0.01] border-white/5' : 'bg-black/20 border-white/5'
                              }`}
                            >
                              <div className={`w-4 h-4 rounded border flex items-center justify-center flex-shrink-0 transition-all ${
                                isChecked ? 'border-gymNeon bg-gymNeon text-black' : 'border-white/20'
                              }`}>
                                {isChecked && <Check className="w-2.5 h-2.5" />}
                              </div>
                              <span className={`text-xs ${isChecked ? 'text-neutral-500 line-through' : 'text-neutral-200'}`}>{item.name}</span>
                            </div>
                          );
                        })}
                      </div>
                    </div>
                  );
                })
              )}
            </div>
            
            <button 
              onClick={() => setShowShoppingList(false)}
              className="bg-white/5 hover:bg-white/10 text-white font-extrabold uppercase py-2.5 rounded-xl text-xs transition-all mt-2 cursor-pointer border border-white/10"
            >
              Listo, Cerrar
            </button>
          </div>
        </div>
      )}

    </div>
  );
}
