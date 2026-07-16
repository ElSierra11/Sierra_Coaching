import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Dumbbell, Apple, TrendingUp, Droplet, MessageCircle, Check, KeyRound, Crown, ArrowRight, Sun, Moon, Activity, Flame, Heart, X, Star, UserCheck, ClipboardList, Smartphone, Menu } from 'lucide-react';

export default function Auth({ onLogin, showToast, theme, toggleTheme }) {
  const [showAuthModal, setShowAuthModal] = useState(false);
  const [isLogin, setIsLogin] = useState(true);
  const [role, setRole] = useState('client'); // 'client' | 'coach'
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  
  // Registration physical data
  const [height, setHeight] = useState('');
  const [initialWeight, setInitialWeight] = useState('');
  const [target, setTarget] = useState('Tonificar y reducir porcentaje de grasa');

  const [errorMessage, setErrorMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setErrorMessage('');
    setLoading(true);

    try {
      if (isLogin) {
        // Authenticate
        const res = await api.login(email, password);
        const { token, user } = res;
        
        if (user.role !== role) {
          setErrorMessage(`Esta cuenta está registrada como ${user.role === 'coach' ? 'Entrenador' : 'Alumno'}. Por favor selecciona el rol correcto.`);
          setLoading(false);
          return;
        }
        sessionStorage.setItem('gym_auth_token', token);
        if (showToast) {
          showToast(`¡Bienvenido de nuevo, ${user.name}!`, "success");
        }
        onLogin(user);
      } else {
        // Register new client
        if (!name || !email || !password || !height || !initialWeight || !target) {
          setErrorMessage('Por favor llena todos los campos.');
          setLoading(false);
          return;
        }

        const res = await api.register(name, email, password, height, initialWeight, target);
        const { token, user } = res;
        sessionStorage.setItem('gym_auth_token', token);
        if (showToast) {
          showToast("¡Cuenta creada exitosamente! Bienvenido al equipo.", "success");
        }
        onLogin(user);
      }
    } catch (err) {
      setErrorMessage(err.message || 'Error al conectar con el servidor.');
    } finally {
      setLoading(false);
    }
  };

  // Quick setup helpers to speed up testing
  const handleQuickPrefill = (type) => {
    if (type === 'coach') {
      setRole('coach');
      setEmail('alejosierra656@gmail.com');
      setPassword('Alejandro10@');
      setIsLogin(true);
    } else {
      setRole('client');
      setEmail('denilson@gym.com');
      setPassword('client123');
      setIsLogin(true);
    }
  };

  return (
    <div className="min-h-screen flex flex-col justify-between text-white bg-gymDark-950 pb-12 transition-colors duration-300">
      {/* Top Navbar */}
      <header className="border-b border-white/5 bg-gymDark-900/50 backdrop-blur-md sticky top-0 z-40 transition-colors duration-300">
        <div className="max-w-7xl mx-auto px-6 py-4 flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Crown className="w-5 h-5 text-gymNeon" />
            <span className="text-sm font-black tracking-widest uppercase text-white">SIERRA COACHING</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <a href="#beneficios" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
            <button 
              onClick={() => { setIsLogin(true); setShowAuthModal(true); }}
              className="text-gymNeon hover:text-white transition-colors uppercase cursor-pointer"
            >
              Acceso Alumnos
            </button>
          </nav>
          
          <div className="flex items-center gap-3">
            {/* Theme Toggle Switch */}
            <button
              onClick={toggleTheme}
              className="inline-flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title={theme === 'light' ? 'Modo Oscuro' : 'Modo Claro'}
            >
              {theme === 'light' ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            </button>

            <a
              href="https://wa.me/573022114190"
              target="_blank"
              rel="noopener noreferrer"
              className="hidden sm:flex items-center gap-1.5 bg-white/5 border border-white/10 hover:bg-white/10 text-white text-xs font-extrabold uppercase px-3 py-2 rounded-xl transition-all"
            >
              <MessageCircle className="w-4 h-4 text-green-500" />
              <span>Contacto Coach</span>
            </a>

            {/* Mobile Menu Toggle Button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="md:hidden inline-flex items-center justify-center p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-neutral-300 hover:text-white transition-all cursor-pointer"
              title="Menu"
            >
              {mobileMenuOpen ? <X className="w-4 h-4" /> : <Menu className="w-4 h-4" />}
            </button>
          </div>
        </div>
        {/* Mobile Menu Panel */}
        {mobileMenuOpen && (
          <div className="md:hidden border-t border-white/5 bg-gymDark-900/95 backdrop-blur-lg px-6 py-4 flex flex-col gap-4 animate-slide-in">
            <a 
              href="#beneficios" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors py-2 border-b border-white/5"
            >
              Beneficios
            </a>
            <a 
              href="#precios" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors py-2 border-b border-white/5"
            >
              Precios
            </a>
            <button 
              onClick={() => { setMobileMenuOpen(false); setIsLogin(true); setShowAuthModal(true); }}
              className="text-sm font-bold uppercase tracking-wider text-gymNeon hover:text-white transition-colors py-2 border-b border-white/5 text-left cursor-pointer"
            >
              Acceso Alumnos
            </button>
            <a
              href="https://wa.me/573022114190"
              target="_blank"
              rel="noopener noreferrer"
              onClick={() => setMobileMenuOpen(false)}
              className="flex items-center justify-center gap-1.5 bg-gymNeon text-black font-extrabold uppercase py-3 rounded-xl transition-all text-xs tracking-wider shadow-lg"
            >
              <MessageCircle className="w-4 h-4" />
              <span>Contacto Coach</span>
            </a>
          </div>
        )}
      </header>

      {/* Main Grid: Hero section & visual coach display */}
      <main className="flex-1 max-w-7xl w-full mx-auto px-6 py-12 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-12 lg:gap-16 items-center">
        {/* Left Column: Headline and Call-to-actions */}
        <div className="lg:col-span-7 flex flex-col gap-6 justify-center">
          <div className="inline-flex items-center gap-2 bg-gymNeon/10 text-gymNeon border border-gymNeon/30 rounded-full px-4 py-1.5 text-xs font-bold tracking-widest uppercase self-start">
            <Crown className="w-3.5 h-3.5" /> Asesoría Online Premium
          </div>
          <h1 className="text-5xl sm:text-7xl font-black uppercase tracking-tight leading-none text-white">
            NEVER<br />GIVE UP!
          </h1>
          <p className="text-neutral-400 text-sm sm:text-base leading-relaxed max-w-xl transition-colors duration-300">
            No soy entrenador certificado, pero soy prueba viviente del impacto de un sistema estructurado. Accede a rutinas planificadas, menús de alimentación personalizados y monitorea tu sobrecarga progresiva día a día en una sola app.
          </p>
          <div className="flex items-center gap-4 mt-2">
            <button
              onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
              className="bg-gymNeon text-black font-extrabold uppercase py-3.5 px-8 rounded-xl tracking-wider text-xs shadow-[0_4px_14px_rgba(255,87,34,0.3)] hover:bg-white hover:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              Comenzar Ahora →
            </button>
            <button
              onClick={() => { setIsLogin(true); setShowAuthModal(true); }}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold uppercase py-3.5 px-6 rounded-xl tracking-wider text-xs transition-all cursor-pointer"
            >
              Ver Planes
            </button>
          </div>
        </div>

        {/* Right Column: Visual display of coach with interactive floaters */}
        <div className="lg:col-span-5 relative flex justify-center items-end min-h-[380px] sm:min-h-[460px] mt-6 lg:mt-0">
          {/* Deep radial orange glow backdrop */}
          <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
            <div className="w-[280px] h-[280px] sm:w-[380px] sm:h-[380px] rounded-full bg-gymNeon/25 blur-[80px]"></div>
          </div>
          {/* Subtle rim light ring */}
          <div className="absolute w-[240px] h-[240px] sm:w-[340px] sm:h-[340px] rounded-full border-2 border-gymNeon/20 pointer-events-none"></div>
          
          {/* Coach Photo Container */}
          <div className="relative z-10 flex items-end justify-center">
            <img
              src="/coach.png"
              alt="Sierra Coaching - Alejandro Sierra"
              className="w-auto max-w-[260px] sm:max-w-[340px] h-[340px] sm:h-[420px] object-cover object-top relative z-10 filter brightness-105 contrast-105 saturate-110"
              style={{ 
                filter: 'drop-shadow(0 0 30px rgba(255, 87, 34, 0.6)) drop-shadow(0 20px 40px rgba(0,0,0,0.8)) brightness(1.08) contrast(1.05) saturate(1.1)'
              }}
              onError={(e) => {
                e.target.src = "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?w=500";
              }}
            />
            {/* Ground shadow */}
            <div className="absolute -bottom-2 left-1/2 -translate-x-1/2 w-36 sm:w-48 h-4 bg-gymNeon/20 rounded-full blur-xl pointer-events-none z-0"></div>
          </div>

          {/* Floating Widget 1: Calories */}
          <div className="absolute top-2 left-2 sm:left-4 bg-gymDark-900/90 border border-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center gap-2.5 z-20 shadow-lg transition-colors duration-300">
            <div className="bg-gymNeon/10 text-gymNeon p-1.5 rounded-lg">
              <Activity className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[8px] text-neutral-400 font-bold uppercase block">Calorías Quemadas</span>
              <span className="text-[11px] font-black text-white">220 kcal</span>
            </div>
          </div>

          {/* Floating Widget 2: Fat burning */}
          <div className="absolute top-1/2 -translate-y-1/2 right-2 sm:-right-8 bg-gymDark-900/90 border border-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center gap-2.5 z-20 shadow-lg transition-colors duration-300">
            <div className="bg-red-500/10 text-red-500 p-1.5 rounded-lg">
              <Flame className="w-4 h-4" />
            </div>
            <div>
              <span className="text-[8px] text-neutral-400 font-bold uppercase block">Quema de Grasa</span>
              <span className="text-[11px] font-black text-white">57%</span>
            </div>
          </div>

          {/* Floating Widget 3: Heart Rate */}
          <div className="absolute bottom-2 left-1/2 -translate-x-1/2 bg-gymDark-900/90 border border-white/10 backdrop-blur-md rounded-xl p-2.5 flex items-center gap-2.5 z-20 shadow-lg transition-colors duration-300">
            <div className="bg-gymNeon/10 text-gymNeon p-1.5 rounded-lg">
              <Heart className="w-3.5 h-3.5 text-red-500 animate-pulse" />
            </div>
            <div>
              <span className="text-[8px] text-neutral-400 font-bold uppercase block">Ritmo Cardíaco</span>
              <span className="text-[11px] font-black text-white">130 lpm</span>
            </div>
          </div>
        </div>
      </main>

      {/* Pricing Card Section */}
      <section className="max-w-7xl mx-auto w-full px-6 py-6" id="precios">
        <div className="glass-panel p-6 rounded-2xl border-gymNeon/20 bg-gymNeon/[0.01] relative overflow-hidden flex flex-col sm:flex-row justify-between items-start sm:items-center gap-6 shadow-xl transition-all duration-300">
          <div className="absolute top-0 right-0 w-32 h-32 bg-gymNeon/5 rounded-full blur-3xl pointer-events-none"></div>
          <div>
            <span className="text-[9px] font-bold text-gymNeon uppercase tracking-widest">Plan Mensual Asesoría Completa</span>
            <div className="flex items-baseline gap-1 mt-1">
              <span className="text-3xl font-black text-white">$50.000</span>
              <span className="text-xs text-neutral-400 font-bold uppercase">COP / mes</span>
            </div>
            <p className="text-[10px] text-neutral-500 mt-2">Acceso completo e interactivo a la Web App.</p>
          </div>
          <div className="flex flex-col gap-2.5 w-full sm:w-auto border-t sm:border-t-0 sm:border-l border-white/5 pt-4 sm:pt-0 sm:pl-6">
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 transition-colors">
              <Check className="w-4 h-4 text-gymNeon" />
              <span>Acceso completo a la Web App</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 transition-colors">
              <Check className="w-4 h-4 text-gymNeon" />
              <span>Soporte por WhatsApp con tu Coach</span>
            </div>
            <div className="flex items-center gap-2 text-xs font-bold text-neutral-300 transition-colors">
              <Check className="w-4 h-4 text-gymNeon" />
              <span>Modificación de dieta y rutina</span>
            </div>
          </div>
        </div>
      </section>

      {/* Bottom Features Row */}
      <section className="max-w-7xl mx-auto px-6 py-12 border-t border-white/5 mt-12 grid grid-cols-1 md:grid-cols-3 gap-8 w-full transition-colors duration-300">
        <div className="flex items-start gap-4">
          <div className="bg-gymNeon text-black p-3 rounded-xl flex-shrink-0 flex items-center justify-center font-bold">
            <Dumbbell className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Entrenamiento Personalizado</h3>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed transition-colors">
              Rutinas adaptadas con precisión a tu nivel y metas de fuerza o hipertrofia.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="bg-gymNeon text-black p-3 rounded-xl flex-shrink-0 flex items-center justify-center font-bold">
            <TrendingUp className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Programas de Rutinas</h3>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed transition-colors">
              Semanas estructuradas de sobrecarga progresiva guiadas paso a paso en la app.
            </p>
          </div>
        </div>
        <div className="flex items-start gap-4">
          <div className="bg-gymNeon text-black p-3 rounded-xl flex-shrink-0 flex items-center justify-center font-bold">
            <Apple className="w-6 h-6" />
          </div>
          <div>
            <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">Planes de Alimentación</h3>
            <p className="text-xs text-neutral-400 mt-2 leading-relaxed transition-colors">
              Dieta calculada según tus calorías y requerimientos diarios de macronutrientes.
            </p>
          </div>
        </div>
      </section>

      {/* Animated Stats Counter Section */}
      <section className="max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
          {[
            { number: '12+', label: 'Alumnos Activos', icon: UserCheck },
            { number: '3', label: 'Meses de Experiencia', icon: Star },
            { number: '97%', label: 'Satisfacción', icon: Heart },
            { number: '50K', label: 'COP / mes', icon: Crown },
          ].map(({ number, label, icon: Icon }) => (
            <div key={label} className="glass-panel p-5 rounded-2xl flex flex-col items-center text-center gap-2 hover:border-gymNeon/20 transition-all group">
              <div className="bg-gymNeon/10 p-2.5 rounded-xl border border-gymNeon/20 group-hover:bg-gymNeon/15 transition-all">
                <Icon className="w-5 h-5 text-gymNeon" />
              </div>
              <span className="text-3xl font-black text-white">{number}</span>
              <span className="text-[10px] font-bold text-neutral-400 uppercase tracking-wider">{label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* How it Works Section */}
      <section className="max-w-7xl mx-auto px-6 py-10 w-full" id="beneficios">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Proceso Simple</span>
          <h2 className="text-2xl font-black uppercase text-white mt-1">¿Cómo Funciona?</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 relative">
          {/* Connecting line on md+ */}
          <div className="hidden md:block absolute top-8 left-[20%] right-[20%] h-px bg-gymNeon/20" />
          {[
            { step: '01', icon: UserCheck, title: 'Te Registras', desc: 'Crea tu cuenta gratis y agenda tu primera consulta con el coach por WhatsApp.' },
            { step: '02', icon: ClipboardList, title: 'Recibes tu Plan', desc: 'El coach sube tu rutina personalizada y menú de alimentación adaptado a tus metas.' },
            { step: '03', icon: Smartphone, title: 'Registras Progreso', desc: 'Usa la app para loguear tus pesos, medidas y hábitos. El coach monitorea tu avance.' },
          ].map(({ step, icon: Icon, title, desc }) => (
            <div key={step} className="flex flex-col items-center text-center gap-4 relative z-10">
              <div className="relative">
                <div className="bg-gymNeon text-black w-16 h-16 rounded-2xl flex items-center justify-center shadow-[0_4px_20px_rgba(255,87,34,0.3)]">
                  <Icon className="w-7 h-7" />
                </div>
                <span className="absolute -top-2 -right-2 bg-gymDark-950 text-gymNeon text-[9px] font-black border border-gymNeon/30 rounded-full w-6 h-6 flex items-center justify-center">{step}</span>
              </div>
              <h3 className="text-sm font-extrabold uppercase tracking-wider text-white">{title}</h3>
              <p className="text-xs text-neutral-400 leading-relaxed max-w-xs">{desc}</p>
            </div>
          ))}
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="max-w-7xl mx-auto px-6 py-10 w-full">
        <div className="text-center mb-8">
          <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Resultados Reales</span>
          <h2 className="text-2xl font-black uppercase text-white mt-1">Lo que Dicen mis Alumnos</h2>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-5">
          {[
            { name: 'Denilson R.', result: '-2.5 kg en 1 mes', text: '"La app me ayuda a registrar todo. Ya no tengo excusa para no saber cuánto levanto o qué como."', stars: 5 },
            { name: 'Alumno A.', result: 'Ganó músculo visiblemente', text: '"La rutina está bien estructurada y el seguimiento de medidas me motiva a ver el cambio real en mi cuerpo."', stars: 5 },
            { name: 'Alumno B.', result: 'Mejoró disciplina de hábitos', text: '"Lo que más me gusta es el tracker de hábitos. Me hace consciente de mi agua y mi sueño cada día."', stars: 5 },
          ].map(({ name, result, text, stars }) => (
            <div key={name} className="glass-panel p-6 rounded-2xl flex flex-col gap-4 hover:border-gymNeon/20 transition-all">
              <div className="flex gap-1">
                {Array.from({ length: stars }).map((_, i) => (
                  <Star key={i} className="w-4 h-4 fill-gymNeon text-gymNeon" />
                ))}
              </div>
              <p className="text-sm text-neutral-300 leading-relaxed italic flex-1">{text}</p>
              <div className="border-t border-white/5 pt-3">
                <div className="text-xs font-extrabold text-white">{name}</div>
                <div className="text-[10px] text-gymNeon font-bold mt-0.5">{result}</div>
              </div>
            </div>
          ))}
        </div>
      </section>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md transition-all duration-300">
          <div className="glass-panel w-full max-w-md rounded-2xl p-6 md:p-8 shadow-2xl relative border-gymNeon/20 bg-gymDark-900/95 animate-slide-in">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Form Header */}
            <div className="text-center mb-6">
              <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Sierra Coaching App</span>
              <h2 className="text-2xl font-extrabold uppercase text-white mt-1">
                {isLogin ? 'Ingresar a la App' : 'Crea tu Cuenta'}
              </h2>
              <p className="text-neutral-400 text-xs mt-1">
                {isLogin ? 'Accede para ver tu plan y registrar avances.' : 'Regístrate para iniciar tu asesoría personalizada.'}
              </p>
            </div>

            {/* Role toggler (Only on Login) */}
            {isLogin && (
              <div className="flex bg-neutral-950 rounded-xl p-1 mb-6 border border-white/5">
                <button 
                  type="button"
                  onClick={() => { setRole('client'); setErrorMessage(''); }}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    role === 'client' 
                      ? 'bg-gymNeon text-black shadow-md font-extrabold' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Soy Alumno
                </button>
                <button 
                  type="button"
                  onClick={() => { setRole('coach'); setErrorMessage(''); }}
                  className={`flex-1 py-2 text-xs font-bold uppercase rounded-lg transition-all cursor-pointer ${
                    role === 'coach' 
                      ? 'bg-gymNeon text-black shadow-md font-extrabold' 
                      : 'text-neutral-400 hover:text-white'
                  }`}
                >
                  Soy Entrenador
                </button>
              </div>
            )}

            {/* Actual Form */}
            <form onSubmit={handleSubmit} className="flex flex-col gap-4">
              {errorMessage && (
                <div className="bg-red-500/10 text-red-500 border border-red-500/25 p-3 rounded-lg text-xs leading-relaxed">
                  {errorMessage}
                </div>
              )}

              {!isLogin && (
                <div className="flex flex-col gap-1.5">
                  <label className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Nombre Completo</label>
                  <input 
                    type="text" 
                    placeholder="Ej. Denilson Rincones" 
                    value={name} 
                    onChange={(e) => setName(e.target.value)} 
                    className="bg-black/40 border border-white/10 rounded-lg text-white px-4 py-2.5 text-sm focus:outline-none focus:border-gymNeon focus:ring-1 focus:ring-gymNeon transition-all placeholder:text-neutral-600"
                    required 
                  />
                </div>
              )}

              <div className="flex flex-col gap-1.5">
                <label className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Correo Electrónico</label>
                <input 
                  type="email" 
                  placeholder="ejemplo@correo.com" 
                  value={email} 
                  onChange={(e) => setEmail(e.target.value)} 
                  className="bg-black/40 border border-white/10 rounded-lg text-white px-4 py-2.5 text-sm focus:outline-none focus:border-gymNeon focus:ring-1 focus:ring-gymNeon transition-all placeholder:text-neutral-600"
                  required 
                />
              </div>

              <div className="flex flex-col gap-1.5">
                <label className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Contraseña</label>
                <input 
                  type="password" 
                  placeholder="••••••••" 
                  value={password} 
                  onChange={(e) => setPassword(e.target.value)} 
                  className="bg-black/40 border border-white/10 rounded-lg text-white px-4 py-2.5 text-sm focus:outline-none focus:border-gymNeon focus:ring-1 focus:ring-gymNeon transition-all placeholder:text-neutral-600"
                  required 
                />
              </div>

              {/* Registration specific fields */}
              {!isLogin && (
                <>
                  <div className="grid grid-cols-2 gap-4">
                    <div className="flex flex-col gap-1.5">
                      <label className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Peso Inicial (kg)</label>
                      <input 
                        type="number" 
                        step="0.1" 
                        placeholder="83" 
                        value={initialWeight} 
                        onChange={(e) => setInitialWeight(e.target.value)} 
                        className="bg-black/40 border border-white/10 rounded-lg text-white px-4 py-2.5 text-sm focus:outline-none focus:border-gymNeon focus:ring-1 focus:ring-gymNeon transition-all placeholder:text-neutral-600"
                        required 
                      />
                    </div>
                    <div className="flex flex-col gap-1.5">
                      <label className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Estatura (m)</label>
                      <input 
                        type="number" 
                        step="0.01" 
                        placeholder="1.67" 
                        value={height} 
                        onChange={(e) => setHeight(e.target.value)} 
                        className="bg-black/40 border border-white/10 rounded-lg text-white px-4 py-2.5 text-sm focus:outline-none focus:border-gymNeon focus:ring-1 focus:ring-gymNeon transition-all placeholder:text-neutral-600"
                        required 
                      />
                    </div>
                  </div>

                  <div className="flex flex-col gap-1.5">
                    <label className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Objetivo Fitness</label>
                    <input 
                      type="text" 
                      placeholder="Ej. Tonificar y reducir grasa" 
                      value={target} 
                      onChange={(e) => setTarget(e.target.value)} 
                      className="bg-black/40 border border-white/10 rounded-lg text-white px-4 py-2.5 text-sm focus:outline-none focus:border-gymNeon focus:ring-1 focus:ring-gymNeon transition-all placeholder:text-neutral-600"
                      required 
                    />
                  </div>
                </>
              )}

              <button 
                type="submit" 
                disabled={loading}
                className="w-full bg-gymNeon text-black font-extrabold uppercase py-3 rounded-xl tracking-wider text-xs shadow-[0_4px_14px_rgba(255,87,34,0.25)] hover:bg-white hover:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all disabled:opacity-50 disabled:pointer-events-none cursor-pointer flex items-center justify-center gap-1.5 mt-2"
              >
                <span>{loading ? 'Procesando...' : isLogin ? 'Iniciar Sesión' : 'Registrarme e Iniciar'}</span>
                {!loading && <ArrowRight className="w-4 h-4" />}
              </button>
            </form>

            {/* Switch between Login and Registration */}
            {role === 'client' && (
              <div className="text-center mt-5 pt-4 border-t border-white/5">
                <p className="text-neutral-500 text-xs mb-1.5">
                  {isLogin ? '¿No tienes cuenta de alumno?' : '¿Ya tienes una cuenta registrada?'}
                </p>
                <button 
                  type="button" 
                  onClick={() => { setIsLogin(!isLogin); setErrorMessage(''); }}
                  className="text-gymNeon font-bold text-xs hover:underline cursor-pointer uppercase tracking-wider"
                >
                  {isLogin ? 'Crear Cuenta' : 'Iniciar Sesión'}
                </button>
              </div>
            )}



          </div>
        </div>
      )}

      {/* Footer */}
      <footer className="border-t border-white/5 pt-6 text-center text-[10px] text-neutral-500 uppercase tracking-widest max-w-7xl mx-auto w-full px-6 transition-colors duration-300">
        <p>&copy; {new Date().getFullYear()} Sierra Coaching. Todos los derechos reservados. Diseñado para alto rendimiento.</p>
      </footer>
    </div>
  );
}
