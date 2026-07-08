import React from 'react';
import { MessageCircle, LogOut, Sun, Moon } from 'lucide-react';

export default function Header({ user, onLogout, theme, toggleTheme }) {
  const isCoach = user.role === 'coach';

  const handleWhatsAppClick = () => {
    const phoneNumber = "+573022114190";
    const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
    const message = encodeURIComponent("¡Hola Alejandro! Vengo de mi app Gym Progress. Quiero reportar mi avance.");
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <header className="glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-2xl border-l-4 border-gymNeon mb-8 shadow-xl">
      <div className="flex items-center gap-5">
        <div className="relative flex-shrink-0">
          <img 
            src="/coach.png" 
            alt="Coach Alejandro Sierra" 
            className="w-20 h-20 md:w-24 md:h-24 rounded-full object-cover border-2 border-gymNeon shadow-[0_0_15px_rgba(255,87,34,0.25)]" 
            onError={(e) => {
              e.target.src = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=150";
            }}
          />
          <div className="absolute -bottom-1.5 left-1/2 -translate-x-1/2 bg-gymNeon text-black font-extrabold text-[10px] tracking-wider px-2 py-0.5 rounded-full shadow">
            COACH
          </div>
        </div>
        
        <div className="flex flex-col gap-1">
          <span className="text-gymNeon text-[10px] font-bold tracking-widest uppercase">Tu Asesoría Activa con</span>
          <h1 className="text-xl md:text-2xl font-extrabold tracking-tight text-white">Alejandro Sierra Rincones</h1>
          <p className="text-neutral-400 text-xs italic leading-relaxed max-w-lg mt-1">
            "No soy entrenador certificado, pero sí soy prueba viviente de que la constancia funciona. Te voy a enseñar lo que a mí me funcionó."
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-3.5 w-full md:w-auto">
        {!isCoach && (
          <button 
            type="button" 
            onClick={handleWhatsAppClick}
            className="inline-flex items-center gap-2 bg-[#25D366] text-white font-extrabold uppercase py-2.5 px-4 rounded-xl text-xs tracking-wider shadow-[0_4px_12px_rgba(37,211,102,0.25)] hover:opacity-90 active:scale-95 transition-all w-full sm:w-auto justify-center cursor-pointer"
          >
            <MessageCircle className="w-4 h-4" />
            <span>Contacto Coach</span>
          </button>
        )}
        
        <div className="flex items-center gap-4 w-full sm:w-auto justify-between sm:justify-start">
          <span className="text-neutral-400 text-xs">
            Conectado como <strong className="text-white font-semibold">{user.name}</strong>
          </span>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>
            <button 
              type="button" 
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-red-400 font-extrabold uppercase text-[10px] tracking-wider py-2 px-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Cerrar Sesión</span>
            </button>
          </div>
        </div>
      </div>
    </header>
  );
}
