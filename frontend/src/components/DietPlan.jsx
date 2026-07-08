import React, { useState } from 'react';
import { Lightbulb, Check } from 'lucide-react';

export default function DietPlan({ client, showToast }) {
  const [activeDay, setActiveDay] = useState(1);
  const [completedMeals, setCompletedMeals] = useState({});

  const diet = client.diet || [];
  const currentDayDiet = diet.find(d => d.day_number === activeDay) || {
    desayuno: "Sin asignar",
    almuerzo: "Sin asignar",
    cena: "Sin asignar",
    merienda: "Sin asignar"
  };

  const handleMealToggle = (mealName) => {
    const key = `${activeDay}_${mealName}`;
    const willBeCompleted = !completedMeals[key];
    setCompletedMeals(prev => ({
      ...prev,
      [key]: willBeCompleted
    }));
    
    if (willBeCompleted) {
      const formattedMeal = mealName.charAt(0).toUpperCase() + mealName.slice(1);
      showToast(`¡${formattedMeal} completado! Sigues firme en tu plan.`, "success");
    }
  };

  return (
    <div className="flex flex-col gap-6">
      
      {/* Header */}
      <div>
        <h3 className="text-lg font-bold text-white uppercase tracking-wider">Plan de Alimentación Semanal</h3>
        <p className="text-neutral-500 text-xs mt-0.5">Sigue tu dieta y optimiza tu recuperación y ganancia muscular.</p>
      </div>

      {/* Day Selector */}
      <div className="flex bg-neutral-900/50 rounded-2xl p-1 border border-white/5 overflow-x-auto no-scrollbar gap-1">
        {Array.from({ length: 7 }).map((_, idx) => {
          const dayNum = idx + 1;
          const isActive = activeDay === dayNum;
          return (
            <button
              key={dayNum}
              onClick={() => setActiveDay(dayNum)}
              className={`flex-1 min-w-[70px] text-center py-3 rounded-xl transition-all cursor-pointer ${
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

      {/* Calories & Macros Summary Panel */}
      <div className="glass-panel p-5 rounded-2xl flex flex-col gap-4 bg-white/[0.01]">
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-2">
          <div>
            <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Objetivo Nutricional</span>
            <h4 className="text-sm font-bold text-white mt-0.5">Distribución de Macronutrientes</h4>
          </div>
          <div className="bg-gymNeon/15 border border-gymNeon/25 px-4 py-2 rounded-xl text-center">
            <span className="text-[9px] text-neutral-400 block font-bold uppercase">Calorías Totales</span>
            <span className="text-xl font-black text-white">{currentDayDiet.calories || '—'} <span className="text-xs font-bold text-gymNeon">kcal</span></span>
          </div>
        </div>

        {currentDayDiet.calories > 0 ? (
          <div className="grid grid-cols-3 gap-3">
            {/* PROTEIN CARD */}
            <div className="bg-black/20 rounded-xl p-3.5 border border-white/5 flex flex-col gap-1 items-center text-center">
              <span className="text-[9px] text-neutral-500 font-bold uppercase">Proteínas</span>
              <span className="text-base font-extrabold text-white">{currentDayDiet.proteins}g</span>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-gymNeon rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-[8px] text-neutral-400 mt-1 uppercase font-semibold">{currentDayDiet.proteins * 4} kcal</span>
            </div>
            {/* CARBS CARD */}
            <div className="bg-black/20 rounded-xl p-3.5 border border-white/5 flex flex-col gap-1 items-center text-center">
              <span className="text-[9px] text-neutral-500 font-bold uppercase">Carbohidratos</span>
              <span className="text-base font-extrabold text-white">{currentDayDiet.carbs}g</span>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-blue-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-[8px] text-neutral-400 mt-1 uppercase font-semibold">{currentDayDiet.carbs * 4} kcal</span>
            </div>
            {/* FATS CARD */}
            <div className="bg-black/20 rounded-xl p-3.5 border border-white/5 flex flex-col gap-1 items-center text-center">
              <span className="text-[9px] text-neutral-500 font-bold uppercase">Grasas</span>
              <span className="text-base font-extrabold text-white">{currentDayDiet.fats}g</span>
              <div className="w-full h-1 bg-white/5 rounded-full mt-2 overflow-hidden">
                <div className="h-full bg-yellow-500 rounded-full" style={{ width: '100%' }}></div>
              </div>
              <span className="text-[8px] text-neutral-400 mt-1 uppercase font-semibold">{currentDayDiet.fats * 9} kcal</span>
            </div>
          </div>
        ) : (
          <div className="text-center py-4 text-neutral-500 text-xs italic">
            El coach no ha configurado los macros específicos para este día.
          </div>
        )}
      </div>

      {/* Diet recommendations alert card */}
      <div className="glass-panel p-4 rounded-xl flex items-start gap-3 border-l-4 border-gymNeon bg-gymNeon/5">
        <div className="text-gymNeon flex-shrink-0 mt-0.5">
          <Lightbulb className="w-5 h-5" />
        </div>
        <p className="text-xs text-neutral-400 leading-normal">
          <strong>Tip de Alimentación:</strong> Evita jugos y bebidas azucaradas con tus comidas principales. Reemplázalos por agua pura para mantener una digestión limpia y evitar calorías líquidas vacías.
        </p>
      </div>

      {/* Meals Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
        
        {/* DESAYUNO */}
        <div 
          onClick={() => handleMealToggle('desayuno')}
          className={`glass-panel p-6 rounded-2xl shadow-lg border cursor-pointer hover:bg-white/[0.01] transition-all flex justify-between items-start gap-4 ${
            completedMeals[`${activeDay}_desayuno`] 
              ? 'border-green-500/30 bg-green-500/[0.02]' 
              : 'border-white/5'
          }`}
        >
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Opción Desayuno</span>
            <p className="text-white text-sm font-bold leading-normal">
              {currentDayDiet.desayuno}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
            completedMeals[`${activeDay}_desayuno`] 
              ? 'border-green-400 bg-green-400 text-black' 
              : 'border-white/20'
          }`}>
            {completedMeals[`${activeDay}_desayuno`] && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* ALMUERZO */}
        <div 
          onClick={() => handleMealToggle('almuerzo')}
          className={`glass-panel p-6 rounded-2xl shadow-lg border cursor-pointer hover:bg-white/[0.01] transition-all flex justify-between items-start gap-4 ${
            completedMeals[`${activeDay}_almuerzo`] 
              ? 'border-green-500/30 bg-green-500/[0.02]' 
              : 'border-white/5'
          }`}
        >
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Opción Almuerzo</span>
            <p className="text-white text-sm font-bold leading-normal">
              {currentDayDiet.almuerzo}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
            completedMeals[`${activeDay}_almuerzo`] 
              ? 'border-green-400 bg-green-400 text-black' 
              : 'border-white/20'
          }`}>
            {completedMeals[`${activeDay}_almuerzo`] && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* CENA */}
        <div 
          onClick={() => handleMealToggle('cena')}
          className={`glass-panel p-6 rounded-2xl shadow-lg border cursor-pointer hover:bg-white/[0.01] transition-all flex justify-between items-start gap-4 ${
            completedMeals[`${activeDay}_cena`] 
              ? 'border-green-500/30 bg-green-500/[0.02]' 
              : 'border-white/5'
          }`}
        >
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Opción Cena</span>
            <p className="text-white text-sm font-bold leading-normal">
              {currentDayDiet.cena}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
            completedMeals[`${activeDay}_cena`] 
              ? 'border-green-400 bg-green-400 text-black' 
              : 'border-white/20'
          }`}>
            {completedMeals[`${activeDay}_cena`] && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

        {/* MERIENDA */}
        <div 
          onClick={() => handleMealToggle('merienda')}
          className={`glass-panel p-6 rounded-2xl shadow-lg border cursor-pointer hover:bg-white/[0.01] transition-all flex justify-between items-start gap-4 ${
            completedMeals[`${activeDay}_merienda`] 
              ? 'border-green-500/30 bg-green-500/[0.02]' 
              : 'border-white/5'
          }`}
        >
          <div className="flex flex-col gap-2">
            <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Opción Merienda</span>
            <p className="text-white text-sm font-bold leading-normal">
              {currentDayDiet.merienda}
            </p>
          </div>
          <div className={`w-6 h-6 rounded-full border flex items-center justify-center flex-shrink-0 transition-all ${
            completedMeals[`${activeDay}_merienda`] 
              ? 'border-green-400 bg-green-400 text-black' 
              : 'border-white/20'
          }`}>
            {completedMeals[`${activeDay}_merienda`] && <Check className="w-3.5 h-3.5" />}
          </div>
        </div>

      </div>

    </div>
  );
}
