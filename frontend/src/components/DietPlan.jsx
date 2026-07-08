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
