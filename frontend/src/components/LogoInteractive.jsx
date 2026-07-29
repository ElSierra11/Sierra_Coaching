import React, { useState } from 'react';
import { X, Sparkles, RefreshCw, Smartphone, MessageCircle, CheckCircle, ShieldCheck, Zap } from 'lucide-react';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function LogoInteractive({ 
  size = "md", // sm, md, lg, xl
  showBadge = true,
  className = "",
  alt = "Sierra Coaching Official Logo"
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [isUpdating, setIsUpdating] = useState(false);
  const [updateStatus, setUpdateStatus] = useState(null);
  const [activeTab, setActiveTab] = useState('pwa');

  const sizeClasses = {
    sm: "w-10 h-10 border-2",
    md: "w-16 h-16 md:w-20 md:h-20 border-2",
    lg: "w-20 h-20 md:w-24 md:h-24 border-3",
    xl: "w-28 h-28 md:w-32 md:h-32 border-4"
  };

  const badgeSizeClasses = {
    sm: "text-[7px] px-1.5 py-0.2 -bottom-1",
    md: "text-[9px] px-2.5 py-0.5 -bottom-1.5",
    lg: "text-[10px] px-3 py-0.5 -bottom-2",
    xl: "text-[11px] px-3.5 py-1 -bottom-2.5"
  };

  const handleLogoClick = (e) => {
    e.stopPropagation();
    setIsOpen(true);
  };

  const handleForceUpdatePwa = async () => {
    setIsUpdating(true);
    setUpdateStatus("Borrando caché antiguo...");
    
    try {
      if ('caches' in window) {
        const cacheNames = await caches.keys();
        await Promise.all(cacheNames.map(name => caches.delete(name)));
      }

      if ('serviceWorker' in navigator) {
        const registrations = await navigator.serviceWorker.getRegistrations();
        for (let registration of registrations) {
          await registration.update();
        }
      }

      setUpdateStatus("¡Logo y PWA actualizados correctamente!");
      setTimeout(() => {
        window.location.reload(true);
      }, 1200);
    } catch (err) {
      console.error(err);
      setUpdateStatus("Caché limpiado. Reiniciando...");
      setTimeout(() => {
        window.location.reload(true);
      }, 1000);
    }
  };

  return (
    <>
      {/* Interactive Logo Avatar */}
      <div 
        onClick={handleLogoClick}
        className={`relative flex-shrink-0 group cursor-pointer select-none transition-transform duration-300 active:scale-95 ${className}`}
        title="Haz clic para interactuar con el Logo y PWA"
      >
        {/* Animated Background Aura Glow */}
        <div className="absolute -inset-1 rounded-full bg-gradient-to-r from-orange-600 via-gymNeon to-red-600 opacity-60 group-hover:opacity-100 blur-md group-hover:blur-lg transition-all duration-500 animate-pulse pointer-events-none"></div>

        {/* Rotating Outer Ring */}
        <div className="absolute -inset-0.5 rounded-full bg-gradient-to-tr from-gymNeon via-amber-500 to-red-600 group-hover:rotate-180 transition-transform duration-700 pointer-events-none opacity-80"></div>

        {/* Main Logo Image */}
        <div className="relative rounded-full overflow-hidden bg-black p-[2px]">
          <img 
            src="/sierra_logo.jpg?v=3" 
            alt={alt}
            className={`${sizeClasses[size] || sizeClasses.md} rounded-full object-cover border-gymNeon shadow-[0_0_20px_rgba(255,87,34,0.5)] group-hover:scale-110 transition-transform duration-500`} 
            onError={(e) => {
              e.target.src = "/coach.png";
            }}
          />
          {/* Glass Lens reflection effect */}
          <div className="absolute inset-0 rounded-full bg-gradient-to-tr from-transparent via-white/10 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none"></div>
        </div>

        {/* Floating Badge */}
        {showBadge && (
          <div className={`absolute left-1/2 -translate-x-1/2 bg-gradient-to-r from-gymNeon to-orange-600 text-black font-black tracking-widest uppercase rounded-full shadow-lg border border-black/80 flex items-center gap-1 z-10 ${badgeSizeClasses[size] || badgeSizeClasses.md}`}>
            <Sparkles className="w-2.5 h-2.5 animate-spin" />
            <span>OFFICIAL</span>
          </div>
        )}
      </div>

      {/* Interactive Modal */}
      {isOpen && (
        <div 
          className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-fade-in"
          onClick={() => setIsOpen(false)}
        >
          <div 
            className="relative w-full max-w-md bg-neutral-900 border-2 border-gymNeon/50 rounded-3xl p-6 shadow-[0_0_50px_rgba(255,87,34,0.4)] overflow-hidden text-white animate-scale-in"
            onClick={(e) => e.stopPropagation()}
          >
            {/* Background Glow */}
            <div className="absolute -top-24 -right-24 w-48 h-48 bg-gymNeon/20 rounded-full blur-3xl pointer-events-none"></div>
            <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-orange-600/20 rounded-full blur-3xl pointer-events-none"></div>

            {/* Close Button */}
            <button 
              onClick={() => setIsOpen(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-white/10 p-2 rounded-full border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Header / Logo Preview */}
            <div className="flex flex-col items-center text-center mt-2 mb-6">
              <div className="relative group mb-3">
                <div className="absolute -inset-2 rounded-full bg-gradient-to-r from-gymNeon via-orange-500 to-amber-500 blur-xl opacity-75 animate-pulse"></div>
                <img 
                  src="/sierra_logo.jpg?v=3" 
                  alt="Sierra Coaching Logo Preview"
                  className="relative w-28 h-28 rounded-full object-cover border-4 border-gymNeon shadow-2xl group-hover:scale-105 transition-transform duration-300" 
                />
                <span className="absolute -bottom-2 left-1/2 -translate-x-1/2 bg-gymNeon text-black font-black text-xs px-3 py-0.5 rounded-full border border-black shadow-lg">
                  VERSIÓN OFICIAL 2.0
                </span>
              </div>
              <h3 className="text-xl font-black uppercase tracking-tight text-white mt-3 flex items-center gap-1.5">
                <span>SIERRA COACHING</span>
                <ShieldCheck className="w-5 h-5 text-gymNeon" />
              </h3>
              <p className="text-xs text-neutral-400 font-medium">Entrenamiento • Nutrición • Disciplina</p>
            </div>

            {/* Content Body */}
            <div className="flex flex-col gap-4">
              {/* PWA Icon & Cache Refresh Box */}
              <div className="p-4 rounded-2xl bg-neutral-950/80 border border-white/10 flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Smartphone className="w-5 h-5 text-gymNeon" />
                    <span className="text-xs font-bold uppercase tracking-wider text-neutral-200">Icono PWA & Caché</span>
                  </div>
                  <span className="text-[10px] font-black uppercase px-2 py-0.5 rounded bg-green-500/20 text-green-400 border border-green-500/30">
                    Sincronizado
                  </span>
                </div>
                
                <p className="text-xs text-neutral-400 leading-relaxed">
                  Si estás usando la App instalada (PWA) o el navegador y deseas que el nuevo logo oficial se refleje en la pantalla de inicio o ícono, haz clic abajo para recargar datos frescos.
                </p>

                <button
                  onClick={handleForceUpdatePwa}
                  disabled={isUpdating}
                  className="w-full py-3 px-4 rounded-xl bg-gradient-to-r from-gymNeon to-orange-600 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2 shadow-lg hover:brightness-110 active:scale-98 transition-all cursor-pointer disabled:opacity-50"
                >
                  <RefreshCw className={`w-4 h-4 ${isUpdating ? 'animate-spin' : ''}`} />
                  <span>{isUpdating ? updateStatus : "Actualizar Logo & Forzar Caché PWA"}</span>
                </button>
              </div>

              {/* Quick Contact Links */}
              <div className="grid grid-cols-2 gap-3">
                <a
                  href="https://wa.me/573022114190?text=Hola%20Alejandro,%20vengo%20de%20la%20App"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-emerald-500/10 border border-emerald-500/30 hover:bg-emerald-500/20 text-emerald-400 flex flex-col items-center gap-1.5 transition-all text-center group"
                >
                  <MessageCircle className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-black uppercase">WhatsApp</span>
                  <span className="text-[9px] text-neutral-400">Contacto Directo</span>
                </a>

                <a
                  href="https://www.instagram.com/sierrafitn_"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-3 rounded-2xl bg-pink-500/10 border border-pink-500/30 hover:bg-pink-500/20 text-pink-400 flex flex-col items-center gap-1.5 transition-all text-center group"
                >
                  <InstagramIcon className="w-5 h-5 group-hover:scale-110 transition-transform" />
                  <span className="text-[11px] font-black uppercase">Instagram</span>
                  <span className="text-[9px] text-neutral-400">@sierrafitn_</span>
                </a>
              </div>
            </div>

            {/* Footer */}
            <div className="mt-5 text-center">
              <button 
                onClick={() => setIsOpen(false)}
                className="text-xs font-bold text-neutral-400 hover:text-white underline cursor-pointer"
              >
                Cerrar
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
