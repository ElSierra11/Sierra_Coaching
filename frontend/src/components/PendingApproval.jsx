import React, { useState } from 'react';
import { Clock, MessageCircle, RefreshCw, LogOut, ShieldAlert, Sparkles, CheckCircle2, Mail, UserCheck } from 'lucide-react';
import LogoInteractive from './LogoInteractive';
import { api } from '../api';

export default function PendingApproval({ user, onLogout, onApproved }) {
  const [checking, setChecking] = useState(false);
  const [statusMessage, setStatusMessage] = useState('');

  const handleCheckStatus = async () => {
    setChecking(true);
    setStatusMessage('');
    try {
      const me = await api.getMe();
      if (me && me.is_approved) {
        setStatusMessage('¡Tu cuenta ha sido aprobada! Redirigiendo...');
        setTimeout(() => {
          if (onApproved) onApproved(me);
          else window.location.reload();
        }, 1000);
      } else {
        setStatusMessage('Tu cuenta aún está pendiente de aprobación por el Coach.');
      }
    } catch (err) {
      console.error(err);
      setStatusMessage('No se pudo verificar la aprobación en este momento.');
    } finally {
      setChecking(false);
    }
  };

  const handleWhatsAppContact = () => {
    const message = encodeURIComponent(
      `¡Hola Alejandro! Acabo de registrarme en tu app Sierra Coaching con el correo ${user.email} (${user.name}). ¿Podrías por favor verificar mi pago y aprobar mi cuenta?`
    );
    window.open(`https://wa.me/573022114190?text=${message}`, '_blank');
  };

  return (
    <div className="min-h-screen bg-gymDark-950 text-white flex flex-col justify-between items-center p-4 md:p-8 relative overflow-hidden">
      {/* Background glow effects */}
      <div className="absolute top-1/4 left-1/2 -translate-x-1/2 w-96 h-96 bg-gymNeon/15 rounded-full blur-[120px] pointer-events-none"></div>
      <div className="absolute bottom-10 right-10 w-80 h-80 bg-amber-500/10 rounded-full blur-[100px] pointer-events-none"></div>

      {/* Top Navbar */}
      <header className="w-full max-w-4xl flex justify-between items-center py-4 border-b border-white/10 z-10">
        <div className="flex items-center gap-3">
          <LogoInteractive size="sm" showBadge={false} />
          <span className="font-black text-sm uppercase tracking-widest text-white">SIERRA COACHING</span>
        </div>
        <button
          onClick={onLogout}
          className="flex items-center gap-2 text-xs font-bold text-neutral-400 hover:text-red-400 bg-white/5 hover:bg-red-500/10 px-3 py-1.5 rounded-xl border border-white/10 transition-colors cursor-pointer"
        >
          <LogOut className="w-4 h-4" />
          <span>Cerrar Sesión</span>
        </button>
      </header>

      {/* Main Container Card */}
      <main className="w-full max-w-lg my-auto z-10">
        <div className="glass-panel bg-neutral-900/90 border-2 border-gymNeon/40 rounded-3xl p-6 md:p-8 shadow-[0_0_50px_rgba(255,87,34,0.2)] flex flex-col items-center text-center gap-6 backdrop-blur-xl">
          
          {/* Logo & Badge Header */}
          <div className="flex flex-col items-center gap-3">
            <LogoInteractive size="xl" showBadge={true} />
            
            <div className="mt-2 inline-flex items-center gap-2 bg-amber-500/15 border border-amber-500/30 text-amber-400 text-xs font-black uppercase tracking-widest px-3.5 py-1 rounded-full animate-pulse">
              <Clock className="w-4 h-4" />
              <span>Pendiente de Aprobación</span>
            </div>
          </div>

          {/* User & Request Info */}
          <div className="flex flex-col gap-2">
            <h2 className="text-2xl font-black uppercase tracking-tight text-white">
              ¡Hola, {user.name.split(' ')[0]}!
            </h2>
            <p className="text-xs text-neutral-300 leading-relaxed font-medium">
              Tu solicitud de registro ha sido recibida con éxito. Por seguridad y control de cupos, el <strong className="text-gymNeon">Coach Alejandro Sierra</strong> activará tu acceso completo al confirmar tu plan o suscripción.
            </p>
          </div>

          {/* Registration Details Box */}
          <div className="w-full p-4 rounded-2xl bg-black/60 border border-white/10 flex flex-col gap-2.5 text-left text-xs">
            <div className="flex items-center justify-between text-neutral-400">
              <span className="flex items-center gap-1.5">
                <Mail className="w-3.5 h-3.5 text-gymNeon" />
                <span>Correo registrado:</span>
              </span>
              <span className="font-bold text-white">{user.email}</span>
            </div>
            <div className="flex items-center justify-between text-neutral-400">
              <span className="flex items-center gap-1.5">
                <UserCheck className="w-3.5 h-3.5 text-gymNeon" />
                <span>Estado de cuenta:</span>
              </span>
              <span className="font-bold text-amber-400 uppercase text-[10px] bg-amber-500/20 px-2 py-0.5 rounded border border-amber-500/30">
                En revisión por el Coach
              </span>
            </div>
          </div>

          {/* Action Buttons */}
          <div className="w-full flex flex-col gap-3">
            <button
              onClick={handleWhatsAppContact}
              className="w-full py-3.5 px-5 rounded-2xl bg-emerald-500 text-black font-black text-xs uppercase tracking-widest flex items-center justify-center gap-2.5 shadow-[0_0_20px_rgba(16,185,129,0.4)] hover:brightness-110 active:scale-98 transition-all cursor-pointer"
            >
              <MessageCircle className="w-5 h-5 fill-black" />
              <span>Contactar al Coach por WhatsApp</span>
            </button>

            <button
              onClick={handleCheckStatus}
              disabled={checking}
              className="w-full py-3 px-5 rounded-2xl bg-white/10 hover:bg-white/15 text-white font-bold text-xs uppercase tracking-wider border border-white/15 flex items-center justify-center gap-2 transition-all cursor-pointer disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 text-gymNeon ${checking ? 'animate-spin' : ''}`} />
              <span>{checking ? 'Comprobando...' : 'Comprobar si ya fui aprobado'}</span>
            </button>
          </div>

          {/* Feedback Status Alert */}
          {statusMessage && (
            <div className="w-full p-3 rounded-xl bg-neutral-950 border border-gymNeon/30 text-xs font-bold text-gymNeon animate-fade-in">
              {statusMessage}
            </div>
          )}

          {/* Notice Footer */}
          <p className="text-[10px] text-neutral-500 italic">
            ¿Ya realizaste tu pago? Envía el comprobante al WhatsApp del Coach Alejandro para activar tu acceso inmediatamente.
          </p>
        </div>
      </main>

      {/* Footer */}
      <footer className="w-full max-w-4xl text-center py-4 text-[11px] text-neutral-500 border-t border-white/5 z-10">
        Sierra Coaching App &copy; {new Date().getFullYear()} • Todos los derechos reservados
      </footer>
    </div>
  );
}
