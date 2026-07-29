import React, { useState, useEffect, useRef } from 'react';
import { api } from '../api';
import { Dumbbell, Apple, TrendingUp, Droplet, MessageCircle, Check, KeyRound, Crown, ArrowRight, Sun, Moon, Activity, Flame, Heart, X, Star, UserCheck, ClipboardList, Smartphone, Menu, Eye, EyeOff } from 'lucide-react';
import LogoInteractive from './LogoInteractive';

const InstagramIcon = ({ className = "w-4 h-4" }) => (
  <svg className={className} fill="currentColor" viewBox="0 0 24 24">
    <path d="M12 2.163c3.204 0 3.584.012 4.85.07 3.252.148 4.771 1.691 4.919 4.919.058 1.265.069 1.645.069 4.849 0 3.205-.012 3.584-.069 4.849-.149 3.225-1.664 4.771-4.919 4.919-1.266.058-1.644.07-4.85.07-3.204 0-3.584-.012-4.849-.07-3.26-.149-4.771-1.699-4.919-4.92-.058-1.265-.07-1.644-.07-4.849 0-3.204.013-3.583.07-4.849.149-3.227 1.664-4.771 4.919-4.919 1.266-.057 1.645-.069 4.849-.069zm0-2.163c-3.259 0-3.667.014-4.947.072-4.358.2-6.78 2.618-6.98 6.98-.059 1.281-.073 1.689-.073 4.948 0 3.259.014 3.668.072 4.948.2 4.358 2.618 6.78 6.98 6.98 1.281.058 1.689.072 4.948.072 3.259 0 3.668-.014 4.948-.072 4.354-.2 6.782-2.618 6.979-6.98.059-1.28.073-1.689.073-4.948 0-3.259-.014-3.667-.072-4.947-.196-4.354-2.617-6.78-6.979-6.98-1.281-.059-1.69-.073-4.949-.073zm0 5.838c-3.403 0-6.162 2.759-6.162 6.162s2.759 6.163 6.162 6.163 6.162-2.759 6.162-6.163c0-3.403-2.759-6.162-6.162-6.162zm0 10.162c-2.209 0-4-1.79-4-4 0-2.209 1.791-4 4-4s4 1.791 4 4c0 2.21-1.791 4-4 4zm6.406-11.845c-.796 0-1.441.645-1.441 1.44s.645 1.44 1.441 1.44c.795 0 1.439-.645 1.439-1.44s-.644-1.44-1.439-1.44z"/>
  </svg>
);

const BeforeAfterSlider = () => {
  const [sliderPosition, setSliderPosition] = useState(50);
  const containerRef = useRef(null);

  const handleMove = (clientX) => {
    if (!containerRef.current) return;
    const rect = containerRef.current.getBoundingClientRect();
    const x = clientX - rect.left;
    const position = Math.max(0, Math.min(100, (x / rect.width) * 100));
    setSliderPosition(position);
  };

  const handleTouchMove = (e) => {
    if (e.touches.length > 0) {
      handleMove(e.touches[0].clientX);
    }
  };

  const handleMouseMove = (e) => {
    if (e.buttons === 1) { // Left click held
      handleMove(e.clientX);
    }
  };

  return (
    <div className="flex flex-col gap-4 items-center w-full">
      <div className="text-center">
        <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Caso de Éxito Principal</span>
        <h3 className="text-lg font-black uppercase text-white mt-1">El Cambio del Coach</h3>
        <p className="text-neutral-500 text-xs mt-1">Arrastra el botón azul para ver el cambio de antes a después.</p>
      </div>

      <div 
        ref={containerRef}
        onMouseMove={handleMouseMove}
        onTouchMove={handleTouchMove}
        className="relative w-full max-w-[340px] h-[400px] rounded-2xl overflow-hidden shadow-2xl border border-white/10 select-none cursor-ew-resize"
      >
        {/* AFTER (Current) */}
        <img 
          src="/coach.png" 
          alt="Después" 
          className="absolute inset-0 w-full h-full object-cover object-top pointer-events-none"
        />
        
        {/* BEFORE */}
        <div 
          className="absolute inset-0 w-full h-full overflow-hidden" 
          style={{ width: `${sliderPosition}%` }}
        >
          <img 
            src="/before_coach.jpg" 
            alt="Antes" 
            className="absolute inset-0 w-[340px] h-[400px] object-cover object-top max-w-none pointer-events-none"
            style={{ width: '340px', height: '400px' }}
          />
        </div>

        {/* Separator bar */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-gymNeon cursor-ew-resize"
          style={{ left: `${sliderPosition}%` }}
        >
          <div className="absolute top-1/2 -translate-y-1/2 -translate-x-1/2 w-8 h-8 rounded-full bg-gymNeon text-black flex items-center justify-center font-black shadow-lg text-sm border border-black">
            ↔
          </div>
        </div>
      </div>
    </div>
  );
};

const FreeCalorieCalculator = () => {
  const [gender, setGender] = useState('male');
  const [weight, setWeight] = useState(70);
  const [height, setHeight] = useState(170);
  const [age, setAge] = useState(25);
  const [activity, setActivity] = useState(1.375); // moderate
  const [goal, setGoal] = useState('perder');
  const [result, setResult] = useState(null);

  const calculate = (e) => {
    e.preventDefault();
    let bmr = 0;
    if (gender === 'male') {
      bmr = 10 * weight + 6.25 * height - 5 * age + 5;
    } else {
      bmr = 10 * weight + 6.25 * height - 5 * age - 161;
    }
    const tdee = Math.round(bmr * activity);
    let targetCal = tdee;
    if (goal === 'perder') targetCal -= 400;
    if (goal === 'ganar') targetCal += 400;

    const prot = Math.round(weight * 2.0);
    const fat = Math.round(weight * 0.8);
    const remaining = targetCal - (prot * 4) - (fat * 9);
    const carb = Math.max(0, Math.round(remaining / 4));

    setResult({
      calories: targetCal,
      proteins: prot,
      carbs: carb,
      fats: fat
    });
  };

  return (
    <div className="glass-panel p-6 rounded-3xl border border-white/5 bg-white/[0.01] flex flex-col gap-5 w-full">
      <div className="text-center">
        <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Calculadora Nutricional</span>
        <h3 className="text-lg font-black uppercase text-white mt-1">Estima tus Requerimientos</h3>
        <p className="text-neutral-500 text-xs mt-1">Ingresa tus datos y descubre tus macros sugeridos.</p>
      </div>

      <form onSubmit={calculate} className="grid grid-cols-2 gap-4 text-left">
        <div className="flex flex-col gap-1.5 col-span-2">
          <label className="text-[10px] text-neutral-400 font-bold uppercase">Género</label>
          <div className="flex gap-2 bg-black/40 rounded-xl p-1 border border-white/5">
            <button
              type="button"
              onClick={() => setGender('male')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                gender === 'male' ? 'bg-gymNeon text-black' : 'text-neutral-400'
              }`}
            >
              Masculino
            </button>
            <button
              type="button"
              onClick={() => setGender('female')}
              className={`flex-1 py-2 text-xs font-bold rounded-lg transition-all ${
                gender === 'female' ? 'bg-gymNeon text-black' : 'text-neutral-400'
              }`}
            >
              Femenino
            </button>
          </div>
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-neutral-400 font-bold uppercase">Peso (kg)</label>
          <input 
            type="number" 
            value={weight} 
            onChange={(e) => setWeight(Number(e.target.value))}
            className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-neutral-400 font-bold uppercase">Estatura (cm)</label>
          <input 
            type="number" 
            value={height} 
            onChange={(e) => setHeight(Number(e.target.value))}
            className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-neutral-400 font-bold uppercase">Edad (años)</label>
          <input 
            type="number" 
            value={age} 
            onChange={(e) => setAge(Number(e.target.value))}
            className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          />
        </div>

        <div className="flex flex-col gap-1">
          <label className="text-[10px] text-neutral-400 font-bold uppercase">Objetivo</label>
          <select 
            value={goal} 
            onChange={(e) => setGoal(e.target.value)}
            className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none h-full"
          >
            <option value="perder">Definición</option>
            <option value="mantener">Mantenimiento</option>
            <option value="ganar">Volumen</option>
          </select>
        </div>

        <div className="flex flex-col gap-1 col-span-2">
          <label className="text-[10px] text-neutral-400 font-bold uppercase">Nivel de Actividad</label>
          <select 
            value={activity} 
            onChange={(e) => setActivity(Number(e.target.value))}
            className="bg-black/35 border border-white/10 rounded-xl px-3 py-2 text-xs text-white focus:outline-none"
          >
            <option value="1.2">Poco o ningún ejercicio</option>
            <option value="1.375">Ligero (1-3 días/sem)</option>
            <option value="1.55">Moderado (3-5 días/sem)</option>
            <option value="1.725">Fuerte (6-7 días/sem)</option>
          </select>
        </div>

        <button
          type="submit"
          className="col-span-2 bg-gymNeon text-black font-extrabold uppercase py-3 rounded-xl tracking-wider text-xs shadow-lg mt-2 cursor-pointer"
        >
          Calcular Requerimientos
        </button>
      </form>

      {result && (
        <div className="bg-black/40 rounded-2xl p-4 border border-white/5 flex flex-col gap-3 text-center animate-scale-in">
          <div>
            <span className="text-[9px] text-neutral-500 font-bold uppercase">Calorías Sugeridas</span>
            <div className="text-xl font-black text-white mt-0.5">{result.calories} kcal/día</div>
          </div>
          <div className="grid grid-cols-3 gap-2">
            <div className="bg-white/5 rounded-xl p-2.5">
              <span className="text-[8px] text-neutral-400 font-bold uppercase block">Proteínas</span>
              <span className="text-xs font-black text-white">{result.proteins}g</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5">
              <span className="text-[8px] text-neutral-400 font-bold uppercase block">Carbos</span>
              <span className="text-xs font-black text-white">{result.carbs}g</span>
            </div>
            <div className="bg-white/5 rounded-xl p-2.5">
              <span className="text-[8px] text-neutral-400 font-bold uppercase block">Grasas</span>
              <span className="text-xs font-black text-white">{result.fats}g</span>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

const FAQAccordion = () => {
  const [activeIndex, setActiveIndex] = useState(null);

  const faqs = [
    {
      q: "¿Necesito ir al gimnasio o puedo entrenar en casa?",
      a: "Tus rutinas se diseñan a tu medida. Si entrenas en casa, planificaremos usando mancuernas, bandas o peso corporal. Si tienes acceso a gimnasio, maximizaremos el uso de máquinas."
    },
    {
      q: "¿Cómo funciona el soporte de WhatsApp?",
      a: "Tendrás chat directo conmigo para resolver dudas de técnica (puedes mandarme videos de tus series), dolores o ajustes en la dieta en cualquier momento del día."
    },
    {
      q: "¿Qué pasa si tengo una lesión?",
      a: "Haremos una adaptación completa de los ejercicios para evitar dolor y rehabilitar la zona. Tu salud y seguridad van primero."
    },
    {
      q: "¿Los planes de comida incluyen alimentos costosos o difíciles?",
      a: "Para nada. Trabajo con comida real y accesible: huevos, pollo, arroz, avena, papas, verduras y frutas comunes. Adaptaremos el menú a tus gustos y presupuesto."
    }
  ];

  return (
    <div className="flex flex-col gap-4 w-full">
      <div className="text-center">
        <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Preguntas Frecuentes</span>
        <h2 className="text-2xl font-black uppercase text-white mt-1">Dudas Comunes</h2>
      </div>

      <div className="flex flex-col gap-3">
        {faqs.map((faq, idx) => {
          const isOpen = activeIndex === idx;
          return (
            <div 
              key={idx} 
              className="glass-panel rounded-2xl border border-white/5 overflow-hidden transition-all duration-300"
            >
              <button
                type="button"
                onClick={() => setActiveIndex(isOpen ? null : idx)}
                className="w-full text-left p-5 flex justify-between items-center text-sm font-bold text-white uppercase tracking-wide bg-white/[0.01] hover:bg-white/[0.03] transition-all cursor-pointer"
              >
                <span>{faq.q}</span>
                <span className="text-gymNeon text-lg">{isOpen ? '−' : '+'}</span>
              </button>
              
              <div 
                className={`transition-all duration-300 ease-in-out overflow-hidden ${
                  isOpen ? 'max-h-40 border-t border-white/5' : 'max-h-0'
                }`}
              >
                <p className="p-5 text-xs text-neutral-400 leading-relaxed bg-black/10">
                  {faq.a}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
};

const InstagramFeed = () => {
  const posts = [
    { url: '/transformation.jpg', title: 'MI TRANSFORMACIÓN', likes: '1.8K', comments: '124' },
    { url: '/app_banner.jpg', title: 'TODO EN TU APP', likes: '2.4K', comments: '189' },
    { url: '/sierra_logo.jpg', title: 'SIERRA COACHING', likes: '3.1K', comments: '240' },
    { url: '/coach.png', title: 'RESULTADOS REALES', likes: '1.5K', comments: '95' }
  ];

  const instagramUrl = "https://www.instagram.com/sierrafitn_";

  return (
    <div className="flex flex-col gap-6 w-full text-center items-center">
      <div className="flex flex-col items-center gap-2">
        <div className="flex items-center gap-3">
          <LogoInteractive size="sm" showBadge={false} />
          <div className="text-left">
            <h3 className="text-base font-black text-white flex items-center gap-1.5">
              <span>Alejandro Sierra</span>
              <span className="text-blue-400 text-xs" title="Verificado">✓</span>
            </h3>
            <span className="text-xs text-neutral-400 font-bold">@sierrafitn_</span>
          </div>
        </div>

        <span className="text-[10px] font-black text-gymNeon uppercase tracking-widest mt-2 bg-gymNeon/10 border border-gymNeon/30 px-3 py-1 rounded-full">
          Comunidad & Resultados
        </span>
        <h2 className="text-3xl font-black uppercase text-white mt-1">
          SIGUE EL PROGRESO EN INSTAGRAM
        </h2>
        <p className="text-neutral-400 text-xs max-w-md">
          Transformaciones reales. No excusas. Rutinas y nutrición inteligente.
        </p>

        <a 
          href={instagramUrl} 
          target="_blank" 
          rel="noopener noreferrer"
          className="mt-2 inline-flex items-center gap-2 bg-gradient-to-r from-purple-600 via-pink-600 to-orange-500 text-white font-extrabold uppercase py-2.5 px-6 rounded-xl text-xs tracking-wider shadow-lg hover:opacity-90 active:scale-95 transition-all cursor-pointer"
        >
          <InstagramIcon className="w-4 h-4" />
          <span>Ver Perfil en Instagram (@sierrafitn_)</span>
        </a>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 w-full max-w-5xl">
        {posts.map((post, idx) => (
          <a
            key={idx}
            href={instagramUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="relative rounded-2xl overflow-hidden aspect-square border border-white/10 group shadow-xl bg-black cursor-pointer"
          >
            <img 
              src={post.url} 
              className="w-full h-full object-cover object-top group-hover:scale-105 transition-all duration-500 filter brightness-95 group-hover:brightness-100" 
              alt={post.title} 
            />
            <div className="absolute inset-0 bg-gradient-to-t from-black/80 via-black/30 to-transparent opacity-0 group-hover:opacity-100 flex flex-col justify-end p-3 transition-all duration-300">
              <span className="text-[10px] font-black text-gymNeon uppercase tracking-wider text-left">{post.title}</span>
              <div className="flex items-center justify-between text-xs font-bold text-white mt-1">
                <span className="flex items-center gap-1 text-[11px]">❤️ {post.likes}</span>
                <span className="flex items-center gap-1 text-[11px]">💬 {post.comments}</span>
              </div>
            </div>
          </a>
        ))}
      </div>
    </div>
  );
};

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
  const [successMessage, setSuccessMessage] = useState('');
  const [loading, setLoading] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showForgotModal, setShowForgotModal] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotSuccess, setForgotSuccess] = useState(false);

  // Password strength checker
  const getPasswordStrength = (pw) => {
    if (!pw) return { score: 0, label: '', color: '' };
    let score = 0;
    if (pw.length >= 8) score++;
    if (pw.length >= 12) score++;
    if (/[0-9]/.test(pw)) score++;
    if (/[^a-zA-Z0-9]/.test(pw)) score++;
    const levels = [
      { label: 'Muy débil', color: 'bg-red-500' },
      { label: 'Débil', color: 'bg-orange-500' },
      { label: 'Regular', color: 'bg-yellow-400' },
      { label: 'Buena', color: 'bg-lime-400' },
      { label: 'Fuerte', color: 'bg-gymNeon' },
    ];
    return { score, ...levels[score] };
  };

  const handleForgotPassword = async (e) => {
    e.preventDefault();
    setForgotLoading(true);
    try {
      await api.forgotPassword(forgotEmail);
      setForgotSuccess(true);
    } catch {
      setForgotSuccess(true); // Always show success to avoid email enumeration
    } finally {
      setForgotLoading(false);
    }
  };

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
          showToast("¡Registro recibido con éxito! En espera de aprobación por el Coach Alejandro.", "info");
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
          <div className="flex items-center gap-3">
            <LogoInteractive size="sm" showBadge={false} />
            <span className="text-sm font-black tracking-widest uppercase text-white">SIERRA COACHING</span>
          </div>
          <nav className="hidden md:flex items-center gap-8 text-xs font-bold uppercase tracking-wider text-neutral-400">
            <a href="#beneficios" className="hover:text-white transition-colors">Beneficios</a>
            <a href="#calcs" className="hover:text-white transition-colors">Calculadora</a>
            <a href="#precios" className="hover:text-white transition-colors">Precios</a>
            <a href="#faq" className="hover:text-white transition-colors">FAQ</a>
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
              href="#calcs" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors py-2 border-b border-white/5"
            >
              Calculadora
            </a>
            <a 
              href="#precios" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors py-2 border-b border-white/5"
            >
              Precios
            </a>
            <a 
              href="#faq" 
              onClick={() => setMobileMenuOpen(false)}
              className="text-sm font-bold uppercase tracking-wider text-neutral-300 hover:text-white transition-colors py-2 border-b border-white/5"
            >
              FAQ
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
      <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 py-10 md:py-20 grid grid-cols-1 lg:grid-cols-12 gap-8 lg:gap-16 items-center overflow-hidden">
        {/* Left Column: Headline and Call-to-actions */}
        <div className="lg:col-span-7 flex flex-col gap-5 justify-center">
          <div className="inline-flex items-center gap-2 bg-gymNeon/10 text-gymNeon border border-gymNeon/30 rounded-full px-3 py-1.5 text-[10px] font-bold tracking-widest uppercase self-start">
            <Crown className="w-3 h-3" /> Asesoría Online Premium
          </div>
          <h1 className="text-2xl xs:text-3xl sm:text-4xl md:text-5xl lg:text-6xl font-black uppercase tracking-tight leading-tight text-white break-words">
            BIENVENIDO A LA<br />
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-gymNeon via-orange-400 to-amber-500">
              CONSTRUCCIÓN<br className="sm:hidden" /> DE TU CUERPO
            </span>
          </h1>
          <p className="text-neutral-400 text-xs sm:text-sm md:text-base leading-relaxed max-w-xl transition-colors duration-300">
            No soy entrenador certificado, pero soy prueba viviente del impacto de un sistema estructurado. Accede a rutinas planificadas, menús de alimentación personalizados y monitorea tu sobrecarga progresiva día a día en una sola app.
          </p>
          <div className="flex items-center gap-3 mt-1 flex-wrap">
            <button
              onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
              className="bg-gymNeon text-black font-extrabold uppercase py-3 px-6 rounded-xl tracking-wider text-xs shadow-[0_4px_14px_rgba(255,87,34,0.3)] hover:bg-white hover:shadow-none hover:-translate-y-0.5 active:translate-y-0 transition-all cursor-pointer"
            >
              Comenzar Ahora →
            </button>
            <button
              onClick={() => { setIsLogin(true); setShowAuthModal(true); }}
              className="bg-white/5 border border-white/10 hover:bg-white/10 text-white font-extrabold uppercase py-3 px-5 rounded-xl tracking-wider text-xs transition-all cursor-pointer"
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

      {/* Visual transformation slider and free calorie calculator grid */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 border-t border-white/5 pt-16 grid grid-cols-1 lg:grid-cols-2 gap-12 items-start" id="calcs">
        <BeforeAfterSlider />
        <FreeCalorieCalculator />
      </section>

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

      {/* Transformation & Proof Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full border-t border-white/5">
        <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
          <div className="lg:col-span-6 flex flex-col gap-4">
            <span className="text-[10px] font-black text-gymNeon uppercase tracking-widest bg-gymNeon/10 border border-gymNeon/30 px-3 py-1 rounded-full self-start">
              Prueba Real & Disciplina
            </span>
            <h2 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight leading-tight">
              MI TRANSFORMACIÓN
            </h2>
            <p className="text-neutral-400 text-sm leading-relaxed">
              "No fue genética. No fue suerte. Fue disciplina todos los días." Esta es la metodología real que aplico conmigo mismo y con cada uno de mis alumnos para lograr resultados físicos contundentes.
            </p>
            <div className="grid grid-cols-2 gap-3 mt-2">
              <div className="bg-black/30 border border-white/5 p-3.5 rounded-xl">
                <span className="text-gymNeon text-xs font-black uppercase block">Antes (2022)</span>
                <span className="text-neutral-400 text-[11px]">Inicio sin estructura</span>
              </div>
              <div className="bg-black/30 border border-gymNeon/40 p-3.5 rounded-xl">
                <span className="text-gymNeon text-xs font-black uppercase block">Ahora (Actual)</span>
                <span className="text-white text-[11px] font-bold">Físico magro y fuerte</span>
              </div>
            </div>
          </div>

          <div className="lg:col-span-6 flex justify-center">
            <div className="relative rounded-3xl overflow-hidden border-2 border-gymNeon/30 shadow-[0_0_40px_rgba(255,87,34,0.25)] group hover:border-gymNeon/60 transition-all duration-300">
              <img 
                src="/transformation.jpg" 
                alt="Mi Transformación - Alejandro Sierra" 
                className="w-full h-auto max-h-[480px] object-cover group-hover:scale-[1.02] transition-all duration-500"
              />
            </div>
          </div>
        </div>
      </section>

      {/* App Mobile Showcase Banner Section */}
      <section className="max-w-7xl mx-auto px-6 py-12 w-full">
        <div className="relative rounded-3xl overflow-hidden border border-white/10 shadow-2xl bg-gradient-to-r from-neutral-900 via-black to-neutral-900 p-6 md:p-10">
          <div className="grid grid-cols-1 lg:grid-cols-12 gap-8 items-center">
            <div className="lg:col-span-7 flex flex-col gap-4">
              <div className="flex items-center gap-2 text-gymNeon text-[10px] font-black uppercase tracking-widest">
                <Smartphone className="w-4 h-4" />
                <span>Aplicación Web & PWA</span>
              </div>
              <h2 className="text-3xl sm:text-4xl font-black uppercase text-white tracking-tight leading-tight">
                TODO TU ENTRENAMIENTO EN UNA SOLA APP
              </h2>
              <p className="text-neutral-300 text-sm leading-relaxed">
                Lleva tus rutinas, tu semáforo de macronutrientes, el cálculo de calorías y tu progreso de fuerza directamente en tu teléfono o computadora sin instalar nada pesado.
              </p>
              <div className="flex flex-wrap gap-4 mt-2">
                <button
                  onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
                  className="bg-gymNeon text-black font-extrabold uppercase py-3 px-6 rounded-xl text-xs tracking-wider hover:opacity-90 transition-all cursor-pointer shadow-lg"
                >
                  Unirme Ahora →
                </button>
              </div>
            </div>

            <div className="lg:col-span-5 flex justify-center">
              <img 
                src="/app_banner.jpg" 
                alt="Todo tu entrenamiento en una sola app - Sierra Coaching" 
                className="w-full h-auto max-h-[420px] object-contain rounded-2xl border border-white/10 shadow-2xl"
              />
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
            { name: 'Denilson R.', result: '-2.5 kg en 1 mes', text: '"La app me ayuda a registrar todo. Ya no tengo excusa para no saber cuánto levanto o qué como. El seguimiento es brutal."', stars: 5 },
            { name: 'Juan C.', result: '+4 kg músculo en 2 meses', text: '"Antes entrenaba sin orden. Con la rutina de Alejandro entendí qué es la sobrecarga progresiva de verdad. Ya veo la diferencia en el espejo."', stars: 5 },
            { name: 'Andrés M.', result: 'Bajó 8% grasa corporal', text: '"El plan de alimentación está adaptado a lo que como normalmente. No es una dieta imposible. Llevo 3 meses y sigo motivado."', stars: 5 },
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

      {/* Pricing Section */}
      <section className="max-w-7xl mx-auto px-4 sm:px-6 py-12 border-t border-white/5 w-full" id="planes">
        <div className="text-center mb-10">
          <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Sin letra pequeña</span>
          <h2 className="text-2xl font-black uppercase text-white mt-1">Elige tu Plan</h2>
          <p className="text-neutral-400 text-xs mt-2">Pago mensual. Cancela cuando quieras. Sin contratos.</p>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6 items-start">
          {[
            {
              name: 'Esencial',
              price: '50K',
              period: 'COP / mes',
              color: 'border-white/10',
              badge: null,
              features: ['Rutina de entrenamiento personalizada', 'Actualización mensual de rutina', 'Seguimiento de pesos y medidas', 'Acceso a la app Sierra Coaching'],
              cta: 'Empezar Ahora',
            },
            {
              name: 'Premium',
              price: '80K',
              period: 'COP / mes',
              color: 'border-gymNeon/50',
              badge: 'Más popular',
              features: ['Todo lo del plan Esencial', 'Plan de alimentación semanal', 'Seguimiento de progreso fotográfico', 'Chat directo con el coach', 'Copiloto IA integrado'],
              cta: 'Empezar Premium',
            },
            {
              name: 'Elite',
              price: '120K',
              period: 'COP / mes',
              color: 'border-amber-500/40',
              badge: 'Resultados rápidos',
              features: ['Todo lo del plan Premium', 'Rutina actualizada semanalmente', 'Llamada de seguimiento mensual', 'Análisis de macros personalizado', 'Prioridad en respuesta del coach'],
              cta: 'Empezar Elite',
            },
          ].map(plan => (
            <div key={plan.name} className={`glass-panel p-6 rounded-2xl border ${plan.color} flex flex-col gap-5 relative transition-all hover:scale-[1.02] duration-300`}>
              {plan.badge && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-gymNeon text-black text-[9px] font-black uppercase tracking-widest px-3 py-1 rounded-full">{plan.badge}</div>
              )}
              <div>
                <p className="text-[10px] font-bold text-neutral-400 uppercase tracking-widest">{plan.name}</p>
                <div className="flex items-end gap-1 mt-1">
                  <span className="text-4xl font-black text-white">{plan.price}</span>
                  <span className="text-xs text-neutral-500 mb-1">{plan.period}</span>
                </div>
              </div>
              <ul className="flex flex-col gap-2.5">
                {plan.features.map(f => (
                  <li key={f} className="flex items-start gap-2 text-xs text-neutral-300">
                    <Check className="w-3.5 h-3.5 text-gymNeon flex-shrink-0 mt-0.5" />
                    {f}
                  </li>
                ))}
              </ul>
              <button
                onClick={() => { setIsLogin(false); setShowAuthModal(true); }}
                className={`mt-auto py-3 px-4 rounded-xl text-xs font-extrabold uppercase tracking-wider cursor-pointer transition-all ${
                  plan.badge === 'Más popular'
                    ? 'bg-gymNeon text-black hover:bg-white'
                    : 'bg-white/5 border border-white/10 text-white hover:bg-white/10'
                }`}
              >
                {plan.cta}
              </button>
            </div>
          ))}
        </div>
      </section>

      {/* FAQs Section */}
      <section className="max-w-4xl mx-auto w-full px-6 py-12 border-t border-white/5 pt-16" id="faq">
        <FAQAccordion />
      </section>

      {/* Instagram Feed Section */}
      <section className="max-w-7xl mx-auto w-full px-6 py-12 border-t border-white/5 pt-16">
        <InstagramFeed />
      </section>

      {/* Auth Modal Overlay */}
      {showAuthModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md transition-all duration-300">
          <div className="glass-panel w-full max-w-md max-h-[90vh] overflow-y-auto no-scrollbar rounded-3xl p-6 md:p-8 shadow-2xl relative border border-gymNeon/30 bg-neutral-900/98 backdrop-blur-xl animate-slide-in">
            {/* Close Button */}
            <button
              onClick={() => setShowAuthModal(false)}
              className="absolute top-4 right-4 text-neutral-400 hover:text-white bg-white/5 p-1.5 rounded-full border border-white/10 transition-colors cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            {/* Form Header */}
            <div className="text-center mb-6 flex flex-col items-center">
              <LogoInteractive size="md" showBadge={false} className="mb-2" />
              <span className="text-[10px] font-bold text-gymNeon uppercase tracking-widest">Sierra Coaching App</span>
              <h2 className="text-2xl font-extrabold uppercase text-white mt-0.5">
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
                <div className="bg-red-500/10 text-red-400 border border-red-500/30 p-3.5 rounded-xl text-xs leading-relaxed flex flex-col gap-1.5">
                  <span>{errorMessage}</span>
                  {!isLogin && (errorMessage.includes('registrado') || errorMessage.includes('sesión')) && (
                    <button
                      type="button"
                      onClick={() => { setIsLogin(true); setErrorMessage(''); }}
                      className="text-gymNeon underline font-bold text-left hover:text-white cursor-pointer uppercase text-[10px]"
                    >
                      👉 Ir a Iniciar Sesión
                    </button>
                  )}
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
                <div className="relative">
                  <input 
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••" 
                    value={password} 
                    onChange={(e) => setPassword(e.target.value)} 
                    className="w-full bg-black/40 border border-white/10 rounded-lg text-white px-4 py-2.5 pr-11 text-sm focus:outline-none focus:border-gymNeon focus:ring-1 focus:ring-gymNeon transition-all placeholder:text-neutral-600"
                    required 
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(p => !p)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 text-neutral-400 hover:text-gymNeon transition-colors cursor-pointer"
                    tabIndex={-1}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </button>
                </div>

                {/* Password strength indicator — only show when typing */}
                {!isLogin && password.length > 0 && (() => {
                  const strength = getPasswordStrength(password);
                  return (
                    <div className="flex flex-col gap-1">
                      <div className="flex gap-1">
                        {[0,1,2,3].map(i => (
                          <div key={i} className={`h-1 flex-1 rounded-full transition-all duration-300 ${i < strength.score ? strength.color : 'bg-white/10'}`} />
                        ))}
                      </div>
                      {strength.label && (
                        <p className="text-[10px] text-neutral-500">{strength.label} — {strength.score < 3 ? 'añade números o símbolos' : '¡Contraseña segura!'}</p>
                      )}
                    </div>
                  );
                })()}

                {/* Forgot password — only on login */}
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => { setShowForgotModal(true); setForgotSuccess(false); setForgotEmail(''); }}
                    className="text-[10px] text-gymNeon/70 hover:text-gymNeon transition-colors text-right self-end cursor-pointer"
                  >
                    ¿Olvidaste tu contraseña?
                  </button>
                )}
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

      {/* Forgot Password Modal */}
      {showForgotModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4" onClick={() => setShowForgotModal(false)}>
          <div className="bg-[#17171e] border border-white/10 rounded-2xl p-6 w-full max-w-sm shadow-2xl" onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-white font-bold uppercase tracking-widest text-sm">Recuperar Contraseña</h3>
              <button onClick={() => setShowForgotModal(false)} className="text-neutral-500 hover:text-white transition-colors cursor-pointer"><X className="w-4 h-4"/></button>
            </div>

            {forgotSuccess ? (
              <div className="text-center py-4">
                <div className="w-14 h-14 rounded-full bg-gymNeon/10 border border-gymNeon/30 flex items-center justify-center mx-auto mb-3">
                  <Check className="w-7 h-7 text-gymNeon" />
                </div>
                <p className="text-white font-bold text-sm mb-1">¡Correo enviado!</p>
                <p className="text-neutral-400 text-xs">Si el correo existe, recibirás un enlace de recuperación en tu bandeja de entrada.</p>
                <button onClick={() => setShowForgotModal(false)} className="mt-4 bg-gymNeon text-black font-bold text-xs uppercase py-2.5 px-6 rounded-lg w-full cursor-pointer">Cerrar</button>
              </div>
            ) : (
              <form onSubmit={handleForgotPassword} className="flex flex-col gap-4">
                <p className="text-neutral-400 text-xs">Escribe tu correo y te enviaremos un enlace para restablecer tu contraseña.</p>
                <div className="flex flex-col gap-1.5">
                  <label className="text-neutral-400 text-[10px] font-bold uppercase tracking-wider">Correo Electrónico</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={e => setForgotEmail(e.target.value)}
                    placeholder="tucorreo@gmail.com"
                    className="bg-black/40 border border-white/10 rounded-lg text-white px-4 py-2.5 text-sm focus:outline-none focus:border-gymNeon focus:ring-1 focus:ring-gymNeon transition-all placeholder:text-neutral-600"
                    required
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="bg-gymNeon text-black font-extrabold uppercase py-2.5 text-xs rounded-lg tracking-wider disabled:opacity-60 cursor-pointer"
                >
                  {forgotLoading ? 'Enviando...' : 'Enviar enlace de recuperación'}
                </button>
              </form>
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
