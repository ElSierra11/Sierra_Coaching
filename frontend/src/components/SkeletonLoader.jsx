import React from 'react';

export default function SkeletonLoader({ type = 'dashboard' }) {
  if (type === 'diet') {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-6 bg-white/5 rounded-lg w-48"></div>
            <div className="h-3 bg-white/5 rounded-lg w-72"></div>
          </div>
          <div className="h-10 bg-white/5 rounded-xl w-full sm:w-40"></div>
        </div>
        
        {/* Days selector */}
        <div className="h-14 bg-white/5 rounded-2xl w-full"></div>

        {/* Macro Progress Panel */}
        <div className="h-44 bg-white/5 rounded-2xl w-full"></div>

        {/* Meals Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-32 bg-white/5 rounded-2xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  if (type === 'routine') {
    return (
      <div className="flex flex-col gap-6 animate-pulse">
        {/* Header */}
        <div className="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
          <div className="flex flex-col gap-2">
            <div className="h-6 bg-white/5 rounded-lg w-48"></div>
            <div className="h-3 bg-white/5 rounded-lg w-72"></div>
          </div>
          <div className="h-10 bg-white/5 rounded-xl w-full sm:w-40"></div>
        </div>
        
        {/* Days selector */}
        <div className="h-12 bg-white/5 rounded-xl w-full"></div>

        {/* Exercises list */}
        <div className="flex flex-col gap-4">
          {[1, 2, 3, 4].map(i => (
            <div key={i} className="h-28 bg-white/5 rounded-2xl w-full"></div>
          ))}
        </div>
      </div>
    );
  }

  // Default Dashboard/Summary skeleton
  return (
    <div className="flex flex-col gap-6 animate-pulse">
      {/* Welcome banner */}
      <div className="h-36 bg-white/5 rounded-2xl w-full"></div>

      {/* Habits and workout summary */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="h-60 bg-white/5 rounded-2xl w-full md:col-span-2"></div>
        <div className="h-60 bg-white/5 rounded-2xl w-full"></div>
      </div>
    </div>
  );
}
