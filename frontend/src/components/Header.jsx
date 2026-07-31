import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, LogOut, Sun, Moon, Bell, BellRing, Check, MessageSquare, X, Loader2 } from 'lucide-react';
import { api } from '../api';
import ChatWindow from './ChatWindow';
import LogoInteractive from './LogoInteractive';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

export default function Header({ user, onLogout, theme, toggleTheme }) {
  const isCoach = user.role === 'coach';
  const [notifications, setNotifications] = useState([]);
  const [showNotifications, setShowNotifications] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [unreadChatCount, setUnreadChatCount] = useState(0);
  const dropdownRef = useRef(null);

  const unreadNotifications = notifications.filter(n => !n.is_read);

  const fetchNotificationsAndChat = async () => {
    try {
      const notifs = await api.getNotifications();
      setNotifications(notifs);

      const unreads = await api.getUnreadChatCounts();
      const totalUnread = unreads.reduce((sum, item) => sum + item.unread_count, 0);
      setUnreadChatCount(totalUnread);
    } catch (err) {
      console.error("Error al obtener notificaciones/mensajes:", err);
    }
  };

  useEffect(() => {
    fetchNotificationsAndChat();
    // Polling every 8 seconds for notifications and chat messages badge
    const interval = setInterval(fetchNotificationsAndChat, 8000);
    return () => clearInterval(interval);
  }, []);

  // Close dropdown on click outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setShowNotifications(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleMarkAsRead = async (id) => {
    try {
      await api.markNotificationAsRead(id);
      setNotifications(prev => prev.map(n => n.id === id ? { ...n, is_read: true } : n));
    } catch (err) {
      console.error(err);
    }
  };

  const handleEnablePushNotifications = async () => {
    if (!("Notification" in window)) {
      alert("Tu navegador o dispositivo no soporta notificaciones de escritorio.");
      return;
    }
    try {
      const perm = await Notification.requestPermission();
      if (perm === "granted") {
        new Notification("Sierra Coaching App 🏋️", {
          body: "¡Recordatorios de entrenamiento e hidratación activados correctamente!",
          icon: "/coach.png"
        });
        localStorage.setItem("gym_push_enabled", "true");
      } else {
        alert("Permiso de notificaciones denegado en tu navegador.");
      }
    } catch (e) {
      console.error("Error al solicitar permisos de notificación:", e);
    }
  };

  const handleMarkAllAsRead = async () => {
    try {
      await api.markAllNotificationsAsRead();
      setNotifications(prev => prev.map(n => ({ ...n, is_read: true })));
    } catch (err) {
      console.error(err);
    }
  };

  const handleWhatsAppClick = () => {
    const phoneNumber = "+573022114190";
    const cleanNumber = phoneNumber.replace(/[^\d]/g, "");
    const message = encodeURIComponent("¡Hola Alejandro! Vengo de mi app Gym Progress. Quiero reportar mi avance.");
    window.open(`https://wa.me/${cleanNumber}?text=${message}`, '_blank');
  };

  return (
    <header className="glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-3xl border border-white/10 border-l-4 border-l-gymNeon mb-8 shadow-2xl relative overflow-hidden bg-gradient-to-r from-neutral-900/90 via-neutral-900/60 to-black/80">
      <div className="absolute top-0 right-0 w-96 h-96 bg-gymNeon/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Profile info left side */}
      <div className="flex items-center gap-5 relative z-10">
        <LogoInteractive size="lg" />
        
        <div className="flex flex-col gap-1">
          <div className="flex flex-wrap items-center gap-2 mt-0.5">
            <span className="text-gymNeon text-[10px] font-black tracking-widest uppercase bg-gymNeon/10 border border-gymNeon/30 px-2.5 py-0.5 rounded-md flex items-center gap-1.5">
              <span className="w-2 h-2 rounded-full bg-emerald-500 animate-ping"></span>
              <span>Asesoría Activa</span>
            </span>
            <a 
              href="https://www.instagram.com/sierrafitn_" 
              target="_blank" 
              rel="noopener noreferrer"
              className="text-xs font-bold text-pink-400 hover:text-white bg-gradient-to-r from-purple-600/30 to-pink-600/30 border border-pink-500/30 px-2.5 py-0.5 rounded-md flex items-center gap-1 transition-all cursor-pointer hover:scale-105"
              title="Ver perfil oficial de Instagram"
            >
              <InstagramIcon className="w-3.5 h-3.5 text-pink-400" />
              <span>@sierrafitn_</span>
            </a>
          </div>
          <h1 className="text-xl md:text-2xl font-black tracking-tight text-white mt-1">Alejandro Sierra Rincones</h1>
          <p className="text-gymNeon font-extrabold text-xs tracking-wider uppercase mt-0.5">
            Asesoría de Alto Rendimiento • Entrenamiento & Nutrición Personalizada
          </p>
        </div>
      </div>

      {/* Action buttons right side */}
      <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4 w-full md:w-auto z-20">
        
        {/* WhatsApp & Chat Direct Buttons */}
        {!isCoach && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={() => setShowChat(true)}
              className="relative inline-flex items-center gap-2 bg-gymNeon text-white font-extrabold uppercase py-2.5 px-4 rounded-xl text-xs tracking-wider shadow-md hover:opacity-90 active:scale-95 transition-all flex-1 sm:flex-initial justify-center cursor-pointer"
            >
              <MessageSquare className="w-4 h-4" />
              <span>Chat Interno</span>
              {unreadChatCount > 0 && (
                <span className="absolute -top-1.5 -right-1.5 bg-red-500 text-white font-bold text-[9px] w-5 h-5 rounded-full flex items-center justify-center border-2 border-gymDark-950 animate-bounce">
                  {unreadChatCount}
                </span>
              )}
            </button>
            <button 
              type="button" 
              onClick={handleWhatsAppClick}
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-extrabold uppercase py-2.5 px-4 rounded-xl text-xs tracking-wider shadow-md hover:opacity-90 active:scale-95 transition-all flex-1 sm:flex-initial justify-center cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        )}
        
        {/* User state, theme and logout */}
        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
          <span className="text-neutral-400 text-xs">
            Conectado como <strong className="text-white font-bold">{user.name}</strong>
          </span>
          <div className="flex items-center gap-2">
            
            {/* Notifications Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-slate-100 dark:bg-white/5 border border-slate-200 dark:border-white/10 text-slate-700 dark:text-neutral-300 hover:text-slate-900 dark:hover:text-white transition-all cursor-pointer relative"
                title="Notificaciones"
              >
                {unreadNotifications.length > 0 ? (
                  <>
                    <BellRing className="w-4 h-4 text-gymNeon" />
                    <span className="absolute -top-1 -right-1 bg-red-500 text-white text-[8px] font-black w-4.5 h-4.5 rounded-full flex items-center justify-center border border-gymDark-950">
                      {unreadNotifications.length}
                    </span>
                  </>
                ) : (
                  <Bell className="w-4 h-4" />
                )}
              </button>

              {/* Notifications Dropdown Panel */}
              {showNotifications && (
                <div className="absolute right-0 mt-3 w-80 bg-neutral-900/95 border border-white/10 rounded-2xl shadow-2xl p-4 flex flex-col gap-3 backdrop-blur-xl z-50">
                  <div className="flex justify-between items-center pb-2 border-b border-white/5">
                    <span className="text-xs font-bold text-white uppercase tracking-wider">Centro de Notificaciones</span>
                    {unreadNotifications.length > 0 && (
                      <button 
                        onClick={handleMarkAllAsRead}
                        className="text-[9px] font-extrabold text-gymNeon hover:underline uppercase cursor-pointer"
                      >
                        Marcar todo leído
                      </button>
                    )}
                  </div>
                  
                  {/* Push Notification permission activator */}
                  <div className="bg-gymNeon/10 border border-gymNeon/30 p-2.5 rounded-xl flex items-center justify-between gap-2">
                    <div className="flex flex-col">
                      <span className="text-[10px] font-bold text-white">Recordatorios de Entreno</span>
                      <span className="text-[8px] text-neutral-400">Recibir avisos en tu pantalla</span>
                    </div>
                    <button
                      onClick={handleEnablePushNotifications}
                      className="px-2.5 py-1 bg-gymNeon text-black font-extrabold text-[9px] rounded-lg uppercase tracking-wider hover:opacity-90 transition-all cursor-pointer"
                    >
                      Activar
                    </button>
                  </div>
                  <div className="max-h-60 overflow-y-auto flex flex-col gap-2 no-scrollbar">
                    {notifications.length === 0 ? (
                      <div className="text-center py-6 text-neutral-500 text-xs italic">
                        No tienes notificaciones
                      </div>
                    ) : (
                      notifications.map(n => (
                        <div 
                          key={n.id}
                          onClick={() => handleMarkAsRead(n.id)}
                          className={`p-3 rounded-xl border transition-all cursor-pointer flex flex-col gap-1 ${
                            n.is_read 
                              ? 'bg-black/10 border-white/5 opacity-60' 
                              : 'bg-gymNeon/5 border-gymNeon/20 hover:bg-gymNeon/10'
                          }`}
                        >
                          <div className="flex justify-between items-start gap-2">
                            <span className="text-xs font-bold text-white leading-snug">{n.title}</span>
                            {!n.is_read && <span className="w-2 h-2 rounded-full bg-gymNeon flex-shrink-0 mt-1"></span>}
                          </div>
                          <p className="text-[10px] text-neutral-400 leading-normal">{n.message}</p>
                          <span className="text-[8px] text-neutral-600 self-end">{n.created_at.split(' ')[0]}</span>
                        </div>
                      ))
                    )}
                  </div>
                </div>
              )}
            </div>

            {/* Toggle Theme */}
            <button
              type="button"
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title={theme === 'light' ? 'Activar Modo Oscuro' : 'Activar Modo Claro'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            {/* Logout */}
            <button 
              type="button" 
              onClick={onLogout}
              className="inline-flex items-center gap-1.5 text-red-400 font-extrabold uppercase text-[10px] tracking-wider py-2 px-3.5 rounded-xl bg-red-500/10 border border-red-500/20 hover:bg-red-500/20 active:scale-95 transition-all cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span>Salir</span>
            </button>
          </div>
        </div>
      </div>

      {/* Chat Window Modal (For client chat with coach) */}
      {showChat && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm z-50 flex items-center justify-center p-4">
          <div className="w-full max-w-lg relative animate-scale-in">
            <button 
              onClick={() => setShowChat(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-neutral-900 border border-white/5 p-1.5 rounded-xl transition-all cursor-pointer z-10"
            >
              <X className="w-4 h-4" />
            </button>
            <ChatWindow 
              contactId={user.coach_id || 1} 
              contactName="Coach Alejandro Sierra" 
              currentUserId={user.id} 
              showToast={(msg, type) => {}} 
            />
          </div>
        </div>
      )}
    </header>
  );
}
