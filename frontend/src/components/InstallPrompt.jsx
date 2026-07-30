import React, { useState, useEffect } from 'react';
import { Download, X, Smartphone, Check, Sparkles, Share, PlusSquare, ArrowUpRight } from 'lucide-react';
import LogoInteractive from './LogoInteractive';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [showPrompt, setShowPrompt] = useState(false);
  const [isIOS, setIsIOS] = useState(false);
  const [isStandalone, setIsStandalone] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // Check if app is already running in standalone mode (installed PWA)
    const isStandaloneApp = window.matchMedia('(display-mode: standalone)').matches || window.navigator.standalone === true;
    setIsStandalone(isStandaloneApp);

    // Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const isIosDevice = /iphone|ipad|ipod/.test(userAgent);
    setIsIOS(isIosDevice);

    // Check if user dismissed prompt previously
    const dismissedTime = localStorage.getItem('pwa_prompt_dismissed');
    const isDismissedRecently = dismissedTime && (Date.now() - parseInt(dismissedTime, 10)) < 86400000; // 24h

    // Handle standard PWA prompt for Android/Chrome
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      if (!isStandaloneApp && !isDismissedRecently) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // Show prompt for iOS if not installed and not dismissed
    if (isIosDevice && !isStandaloneApp && !isDismissedRecently) {
      const timer = setTimeout(() => setShowPrompt(true), 3000);
      return () => clearTimeout(timer);
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (deferredPrompt) {
      deferredPrompt.prompt();
      const { outcome } = await deferredPrompt.userChoice;
      if (outcome === 'accepted') {
        setShowPrompt(false);
      }
      setDeferredPrompt(null);
    } else if (isIOS) {
      setShowIOSInstructions(true);
    }
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    localStorage.setItem('pwa_prompt_dismissed', Date.now().toString());
  };

  if (isStandalone || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-scale-in">
      <div className="glass-panel p-5 rounded-3xl relative flex flex-col gap-4 bg-gradient-to-b from-neutral-900/95 via-neutral-900/98 to-black/95 border-2 border-gymNeon/40 shadow-[0_0_30px_rgba(255,87,34,0.3)] backdrop-blur-xl">
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white bg-white/5 p-1 rounded-full border border-white/10 transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4 items-center">
          <LogoInteractive size="md" showBadge={true} />
          
          <div className="flex flex-col gap-1 pr-6">
            <div className="flex items-center gap-1.5 text-gymNeon text-[10px] font-black uppercase tracking-widest">
              <span className="w-2 h-2 rounded-full bg-green-400 animate-ping"></span>
              <span>Instalación Gratuita</span>
            </div>
            <h4 className="text-sm font-black tracking-tight text-white">Sierra Coaching App</h4>
            <p className="text-neutral-400 text-xs leading-relaxed font-medium">
              Agrégala a tu pantalla de inicio para un acceso instantáneo como App nativa.
            </p>
          </div>
        </div>

        {/* Feature badges */}
        <div className="flex gap-2">
          <span className="text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Zap className="w-3 h-3 text-gymNeon" />
            <span>Ultrarrápida</span>
          </span>
          <span className="text-[10px] font-bold bg-white/5 border border-white/10 text-neutral-300 px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Smartphone className="w-3 h-3 text-white" />
            <span>Sin Tiendas</span>
          </span>
          <span className="text-[10px] font-bold bg-gymNeon/10 border border-gymNeon/30 text-gymNeon px-2.5 py-1 rounded-lg flex items-center gap-1">
            <Sparkles className="w-3 h-3 text-gymNeon" />
            <span>100% Gratis</span>
          </span>
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={handleInstallClick}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gymNeon text-black font-black uppercase py-3 px-4 rounded-xl text-xs tracking-wider shadow-[0_4px_14px_rgba(255,87,34,0.35)] hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <Download className="w-4 h-4" />
            <span>Instalar en Pantalla</span>
          </button>
          <button 
            onClick={handleDismiss}
            className="px-3 py-3 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
          >
            Ahora no
          </button>
        </div>

        {/* iOS Specific Instructions Modal/Section */}
        {showIOSInstructions && (
          <div className="mt-2 p-3.5 rounded-xl bg-black/40 border border-gymNeon/30 flex flex-col gap-2.5 text-xs text-neutral-300 animate-slide-in">
            <div className="flex items-start gap-2">
              <Share className="w-4 h-4 text-gymNeon flex-shrink-0 mt-0.5" />
              <span>
                1. Toca el botón <strong>Compartir</strong> en la barra inferior de tu navegador (Safari).
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowUpRight className="w-4 h-4 text-gymNeon flex-shrink-0 mt-0.5" />
              <span>
                2. Selecciona <strong>"Agregar a la pantalla de inicio"</strong>.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
