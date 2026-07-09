import React, { useState, useEffect } from 'react';
import { Download, Share, X, ArrowUpRight } from 'lucide-react';

export default function InstallPrompt() {
  const [deferredPrompt, setDeferredPrompt] = useState(null);
  const [isIOS, setIsIOS] = useState(false);
  const [isInstalled, setIsInstalled] = useState(false);
  const [showPrompt, setShowPrompt] = useState(false);
  const [showIOSInstructions, setShowIOSInstructions] = useState(false);

  useEffect(() => {
    // 1. Detect if already installed (standalone mode)
    const isStandalone = window.matchMedia('(display-mode: standalone)').matches 
      || window.navigator.standalone 
      || document.referrer.includes('android-app://');
    
    setIsInstalled(isStandalone);

    // 2. Detect iOS
    const userAgent = window.navigator.userAgent.toLowerCase();
    const ios = /iphone|ipad|ipod/.test(userAgent) && !/fdsb/.test(userAgent);
    setIsIOS(ios);

    // 3. Listen to beforeinstallprompt (Android / Chrome)
    const handleBeforeInstallPrompt = (e) => {
      e.preventDefault();
      setDeferredPrompt(e);
      
      // Only show if the user hasn't dismissed it in this session/localstorage
      const isDismissed = localStorage.getItem('gym_install_dismissed');
      if (!isDismissed && !isStandalone) {
        setShowPrompt(true);
      }
    };

    window.addEventListener('beforeinstallprompt', handleBeforeInstallPrompt);

    // For iOS: since there is no event, show prompt after a short delay if not installed/dismissed
    if (ios && !isStandalone) {
      const isDismissed = localStorage.getItem('gym_install_dismissed');
      if (!isDismissed) {
        const timer = setTimeout(() => {
          setShowPrompt(true);
        }, 3000); // show after 3 seconds
        return () => clearTimeout(timer);
      }
    }

    return () => {
      window.removeEventListener('beforeinstallprompt', handleBeforeInstallPrompt);
    };
  }, []);

  const handleInstallClick = async () => {
    if (isIOS) {
      setShowIOSInstructions(true);
      return;
    }

    if (!deferredPrompt) return;

    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    console.log(`User response to the install prompt: ${outcome}`);
    
    // Clear prompt event
    setDeferredPrompt(null);
    setShowPrompt(false);
  };

  const handleDismiss = () => {
    setShowPrompt(false);
    setShowIOSInstructions(false);
    // Persist dismiss so we don't prompt on every reload
    localStorage.setItem('gym_install_dismissed', 'true');
  };

  // If already installed or shouldn't show prompt, render nothing
  if (isInstalled || !showPrompt) return null;

  return (
    <div className="fixed bottom-20 md:bottom-6 left-4 right-4 md:left-auto md:right-6 md:w-96 z-50 animate-slide-in">
      <div className="glass-panel-neon p-5 rounded-2xl relative flex flex-col gap-4 bg-gymDark-900/95 border-gymNeon border shadow-2xl backdrop-blur-lg">
        {/* Close Button */}
        <button 
          onClick={handleDismiss}
          className="absolute top-3.5 right-3.5 text-neutral-400 hover:text-white transition-colors cursor-pointer"
        >
          <X className="w-4 h-4" />
        </button>

        <div className="flex gap-4">
          <div className="w-12 h-12 rounded-xl bg-gymNeon/10 border border-gymNeon/25 flex items-center justify-center text-gymNeon flex-shrink-0">
            <Download className="w-6 h-6 animate-pulse" />
          </div>
          <div className="flex flex-col gap-1 pr-6">
            <h4 className="text-sm font-extrabold tracking-tight text-white">Instalar Sierra Coaching</h4>
            <p className="text-neutral-400 text-xs leading-relaxed">
              Instala la aplicación en tu pantalla de inicio para un acceso rápido y mejor rendimiento.
            </p>
          </div>
        </div>

        <div className="flex gap-2.5">
          <button 
            onClick={handleInstallClick}
            className="flex-1 inline-flex items-center justify-center gap-2 bg-gradient-premium text-white font-extrabold uppercase py-2.5 px-4 rounded-xl text-xs tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
          >
            <span>Instalar Ahora</span>
          </button>
          <button 
            onClick={handleDismiss}
            className="px-4 py-2.5 rounded-xl border border-white/10 text-neutral-400 hover:text-white hover:bg-white/5 text-xs font-bold transition-all cursor-pointer"
          >
            Más tarde
          </button>
        </div>

        {/* iOS Specific Instructions Modal/Section */}
        {showIOSInstructions && (
          <div className="mt-3 p-3.5 rounded-xl bg-white/5 border border-white/10 flex flex-col gap-2.5 text-xs text-neutral-300">
            <div className="flex items-start gap-2">
              <Share className="w-4 h-4 text-gymNeon flex-shrink-0 mt-0.5" />
              <span>
                1. Toca el botón de <strong>Compartir</strong> en la barra inferior de Safari.
              </span>
            </div>
            <div className="flex items-start gap-2">
              <ArrowUpRight className="w-4 h-4 text-gymNeon flex-shrink-0 mt-0.5" />
              <span>
                2. Desplázate hacia abajo y selecciona <strong>"Agregar a la pantalla de inicio"</strong>.
              </span>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
