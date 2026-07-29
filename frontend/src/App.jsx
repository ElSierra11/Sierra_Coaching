import React, { useState, useEffect } from 'react';
import { api } from './api';
import Auth from './components/Auth';
import Header from './components/Header';
import Dashboard from './components/Dashboard';
import RoutineTracker from './components/RoutineTracker';
import DietPlan from './components/DietPlan';
import ProgressTracker from './components/ProgressTracker';
import CoachAdmin from './components/CoachAdmin';
import { LayoutDashboard, Dumbbell, Apple, TrendingUp, CheckCircle, AlertCircle, Info, X } from 'lucide-react';
import InstallPrompt from './components/InstallPrompt';
import SkeletonLoader from './components/SkeletonLoader';
import PendingApproval from './components/PendingApproval';
import SplashScreen from './components/SplashScreen';

class ErrorBoundary extends React.Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }

  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }

  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught error:", error, errorInfo);
  }

  render() {
    if (this.state.hasError) {
      return (
        <div className="glass-panel p-8 text-center flex flex-col items-center justify-center gap-4 rounded-2xl border border-red-500/20 max-w-lg mx-auto my-8">
          <div className="bg-red-500/10 p-3 rounded-full text-red-400">
            <AlertCircle className="w-8 h-8" />
          </div>
          <h3 className="text-sm font-bold text-white">Algo salió mal al cargar esta sección</h3>
          <p className="text-xs text-neutral-400">{this.state.error?.toString()}</p>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="px-4 py-2 bg-gymNeon text-black font-extrabold text-xs rounded-xl uppercase tracking-wider cursor-pointer"
          >
            Reintentar
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

export default function App() {
  const [user, setUser] = useState(null);
  const [clientData, setClientData] = useState(null);
  const [activeTab, setActiveTab] = useState('dashboard');
  const [loading, setLoading] = useState(false);
  const [toasts, setToasts] = useState([]);
  const [showSplash, setShowSplash] = useState(true);
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('gym_theme') || 'dark';
  });

  useEffect(() => {
    if (theme === 'light') {
      document.body.classList.add('light-theme');
    } else {
      document.body.classList.remove('light-theme');
    }
    localStorage.setItem('gym_theme', theme);
  }, [theme]);

  const toggleTheme = () => {
    setTheme(prev => prev === 'light' ? 'dark' : 'light');
  };
 
  const showToast = (message, type = 'success') => {
    const id = Date.now() + Math.random();
    setToasts(prev => [...prev, { id, message, type }]);
    setTimeout(() => {
      setToasts(prev => prev.filter(t => t.id !== id));
    }, 4000);
  };

  const [weeklyChallenge, setWeeklyChallenge] = useState("");

  useEffect(() => {
    const cachedUser = sessionStorage.getItem('gym_auth_user');
    if (cachedUser) {
      const parsed = JSON.parse(cachedUser);
      setUser(parsed);
    }
  }, []);

  // Fetch client details if logged in as client and approved
  useEffect(() => {
    if (user && user.is_approved !== false) {
      fetchWeeklyChallenge();
      if (user.role === 'client') {
        fetchClientDetails(user.id);
      }
    }
  }, [user]);

  const fetchWeeklyChallenge = async () => {
    try {
      const data = await api.getSetting("weekly_challenge");
      setWeeklyChallenge(data.value);
    } catch (err) {
      console.error("Error fetching weekly challenge:", err);
    }
  };

  const fetchClientDetails = async (clientId) => {
    setLoading(true);
    try {
      const data = await api.getClientDetail(clientId);
      setClientData(data);
    } catch (err) {
      console.error("Error fetching client details:", err);
    } finally {
      setLoading(false);
    }
  };

  const handleLogin = (authenticatedUser) => {
    setUser(authenticatedUser);
    sessionStorage.setItem('gym_auth_user', JSON.stringify(authenticatedUser));
  };

  const handleLogout = () => {
    setUser(null);
    setClientData(null);
    sessionStorage.removeItem('gym_auth_user');
    sessionStorage.removeItem('gym_auth_token');
  };

  // Callback passed to children to update the client details state locally when changes are saved
  const handleUpdateClient = (updatedData) => {
    if (updatedData && typeof updatedData === 'object') {
      setClientData(updatedData);
    } else if (user && user.id) {
      fetchClientDetails(user.id);
    }
  };

  if (showSplash) {
    return <SplashScreen onDone={() => setShowSplash(false)} />;
  }

  if (!user) {
    return <Auth onLogin={handleLogin} showToast={showToast} theme={theme} toggleTheme={toggleTheme} />;
  }

  // Check if client requires coach approval
  if (user.role === 'client' && user.is_approved === false) {
    return <PendingApproval user={user} onLogout={handleLogout} onApproved={(approvedUser) => handleLogin(approvedUser)} />;
  }


  const isCoach = user.role === 'coach';

  return (
    <div className="app-container min-h-screen pb-24 md:pb-8">
      {/* App Header */}
      <Header user={user} onLogout={handleLogout} theme={theme} toggleTheme={toggleTheme} />

      {isCoach ? (
        // Coach Dashboard View
        <CoachAdmin showToast={showToast} />
      ) : (
        // Client View
        <div>
          {loading && !clientData ? (
            <div className="max-w-7xl mx-auto px-6">
              <SkeletonLoader type={activeTab} />
            </div>
          ) : clientData ? (
            <div>
              {/* Tab Navigation — floating iOS-style tab bar on mobile, inline on md+ */}
              <nav className="fixed bottom-4 left-4 right-4 z-40 md:static md:mb-8 flex justify-around md:justify-center bg-gymDark-900/85 md:bg-gymDark-900 border border-white/10 md:border-white/5 p-1.5 md:p-1.5 rounded-2xl md:max-w-3xl md:mx-auto backdrop-blur-md gap-1 shadow-2xl">
                {[
                  { id: 'dashboard', label: 'Inicio', icon: LayoutDashboard },
                  { id: 'routine',   label: 'Rutina',  icon: Dumbbell },
                  { id: 'diet',      label: 'Dieta',   icon: Apple },
                  { id: 'progress',  label: 'Progreso', icon: TrendingUp },
                ].map(({ id, label, icon: Icon }) => (
                  <button
                    key={id}
                    onClick={() => setActiveTab(id)}
                    className={`flex-1 py-2.5 md:py-3 px-2 md:px-4 rounded-xl text-[10px] md:text-xs font-bold tracking-wide uppercase transition-all duration-300 flex flex-col md:flex-row items-center justify-center gap-1 md:gap-2 cursor-pointer ${
                      activeTab === id
                        ? 'bg-gymNeon text-black font-extrabold'
                        : 'text-neutral-400 hover:text-white hover:bg-white/[0.02]'
                    }`}
                  >
                    <Icon className="w-5 h-5 md:w-4 md:h-4" />
                    <span>{label}</span>
                  </button>
                ))}
              </nav>


              {/* Tab Content Panels — add bottom padding on mobile for fixed nav bar */}

              <main className="pb-20 md:pb-0">
                <ErrorBoundary key={activeTab}>
                  {activeTab === 'dashboard' && (
                    <Dashboard client={clientData} onUpdateClient={handleUpdateClient} showToast={showToast} weeklyChallenge={weeklyChallenge} />
                  )}
                  {activeTab === 'routine' && (
                    <RoutineTracker client={clientData} onUpdateClient={handleUpdateClient} showToast={showToast} />
                  )}
                  {activeTab === 'diet' && (
                    <DietPlan client={clientData} onUpdateClient={handleUpdateClient} showToast={showToast} />
                  )}
                  {activeTab === 'progress' && (
                    <ProgressTracker client={clientData} onUpdateClient={handleUpdateClient} showToast={showToast} />
                  )}
                </ErrorBoundary>
              </main>

            </div>
          ) : (
            <div className="glass-panel p-16 text-center text-red-400 text-sm rounded-2xl">
              Ocurrió un problema al sincronizar los datos. Reintenta iniciar sesión.
            </div>
          )}
        </div>
      )}

      {/* Toast Notification Container */}
      <div className="fixed bottom-6 right-6 z-50 flex flex-col gap-3 max-w-sm w-full pointer-events-none">
        {toasts.map(toast => (
          <div 
            key={toast.id}
            className={`pointer-events-auto flex items-start gap-3 p-4 rounded-xl border shadow-2xl transition-all duration-300 animate-slide-in ${
              toast.type === 'success' ? 'bg-gymDark-900/95 border-green-500/30 text-green-400' :
              toast.type === 'error' ? 'bg-gymDark-900/95 border-red-500/30 text-red-400' :
              'bg-gymDark-900/95 border-amber-500/30 text-amber-400'
            }`}
          >
            {toast.type === 'success' && <CheckCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {toast.type === 'error' && <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            {toast.type === 'info' && <Info className="w-5 h-5 flex-shrink-0 mt-0.5" />}
            
            <div className="flex-1 text-xs font-semibold leading-relaxed text-white">
              {toast.message.split('\n').map((line, i) => <div key={i}>{line}</div>)}
            </div>
            
            <button 
              onClick={() => setToasts(prev => prev.filter(t => t.id !== toast.id))}
              className="text-neutral-500 hover:text-white transition-colors cursor-pointer flex-shrink-0"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        ))}
      </div>

      {/* PWA Install Prompt Banner */}
      <InstallPrompt />
    </div>
  );
}
// Trigger build: Landing Page responsiveness and premium UI/UX features
