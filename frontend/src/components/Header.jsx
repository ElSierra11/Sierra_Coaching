import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, LogOut, Sun, Moon, Bell, BellRing, Check, MessageSquare, X, Loader2 } from 'lucide-react';
import { api } from '../api';
import ChatWindow from './ChatWindow';

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
    <header className="glass-panel flex flex-col md:flex-row justify-between items-start md:items-center gap-6 p-6 rounded-2xl border-l-4 border-gymNeon mb-8 shadow-xl relative">
      
      {/* Profile info left side */}
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

      {/* Action buttons right side */}
      <div className="flex flex-col sm:flex-row md:flex-col items-start sm:items-center md:items-end gap-4 w-full md:w-auto z-20">
        
        {/* WhatsApp & Chat Direct Buttons */}
        {!isCoach && (
          <div className="flex gap-2 w-full sm:w-auto">
            <button 
              type="button" 
              onClick={() => setShowChat(true)}
              className="relative inline-flex items-center gap-2 bg-gymNeon text-black font-extrabold uppercase py-2.5 px-4 rounded-xl text-xs tracking-wider shadow-[0_4px_12px_rgba(255,87,34,0.15)] hover:opacity-90 active:scale-95 transition-all flex-1 sm:flex-initial justify-center cursor-pointer"
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
              className="inline-flex items-center gap-2 bg-[#25D366] text-white font-extrabold uppercase py-2.5 px-4 rounded-xl text-xs tracking-wider shadow-[0_4px_12px_rgba(37,211,102,0.15)] hover:opacity-90 active:scale-95 transition-all flex-1 sm:flex-initial justify-center cursor-pointer"
            >
              <MessageCircle className="w-4 h-4" />
              <span>WhatsApp</span>
            </button>
          </div>
        )}
        
        {/* User state, theme and logout */}
        <div className="flex items-center justify-between sm:justify-start gap-4 w-full sm:w-auto">
          <span className="text-neutral-400 text-xs">
            Conectado como <strong className="text-white font-semibold">{user.name}</strong>
          </span>
          <div className="flex items-center gap-2">
            
            {/* Notifications Bell */}
            <div className="relative" ref={dropdownRef}>
              <button
                type="button"
                onClick={() => setShowNotifications(!showNotifications)}
                className="inline-flex items-center justify-center p-2.5 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer relative"
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
