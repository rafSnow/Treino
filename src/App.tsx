import { useState, useEffect } from 'react'
import ExerciseList from './ExerciseList'
import { History as HistoryIcon, Settings as SettingsIcon, Play, Scale, HeartPulse } from 'lucide-react'
import { AnimatePresence, motion } from 'framer-motion'

import RoutineList from './RoutineList'
import WorkoutSession from './WorkoutSession'
import History from './History'
import Settings from './Settings'
import Biometrics from './Biometrics'
import Cardio from './Cardio'
import { useWorkoutStore } from './store'
import { ConfirmProvider } from './ConfirmDialog'
import { Toaster } from 'react-hot-toast'
import SplashScreen from './SplashScreen'
import { useLiveQuery } from 'dexie-react-hooks'
import { db } from './db'

import RoutineImporter from './RoutineImporter'
import ReloadPrompt from './ReloadPrompt'

type Tab = 'catalog' | 'workout' | 'history' | 'biometrics' | 'cardio' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workout')
  const activeWorkout = useWorkoutStore(state => state.activeWorkout)
  const setInstallPrompt = useWorkoutStore(state => state.setInstallPrompt)
  const theme = useWorkoutStore(state => state.theme)

  // Aplica o tema
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');

    if (theme === 'system') {
      const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
      root.classList.add(systemTheme);
      
      const listener = (e: MediaQueryListEvent) => {
        root.classList.remove('light', 'dark');
        root.classList.add(e.matches ? 'dark' : 'light');
      };
      const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');
      mediaQuery.addEventListener('change', listener);
      return () => mediaQuery.removeEventListener('change', listener);
    } else {
      root.classList.add(theme);
    }
  }, [theme]);


  // 5.2 Sem Estado de Loading no Startup
  const isLoaded = useLiveQuery(async () => {
    const count = await db.exercicios.count();
    // Apenas para garantir que o Dexie inicializou e respondeu
    return count >= 0;
  });

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as Parameters<typeof setInstallPrompt>[0]);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setInstallPrompt]);

  if (isLoaded === undefined) {
    return <SplashScreen />;
  }

  const renderTabContent = () => {
    switch (activeTab) {
      case 'catalog':
        return <ExerciseList onBack={() => setActiveTab('workout')} />
      case 'workout':
        return <RoutineList onOpenCatalog={() => setActiveTab('catalog')} />
      case 'history':
        return <History />
      case 'biometrics':
        return <Biometrics />
      case 'cardio':
        return <Cardio />
      case 'settings':
        return <Settings />
      default:
        return <History />
    }
  }

  const renderAppContent = () => {
    return (
      <AnimatePresence mode="wait">
        {activeWorkout ? (
          <motion.div 
            key="workout-session"
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.3, ease: 'easeOut' }}
            className="h-full w-full"
          >
            <WorkoutSession />
          </motion.div>
        ) : (
          <motion.div 
            key="main-app"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.3 }}
            className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 overflow-hidden"
          >
            {/* Conteúdo Principal com Scroll Independente */}
            <main className="flex-1 overflow-y-auto scrollbar-hide">
              <AnimatePresence mode="wait">
                <motion.div
                  key={activeTab}
                  initial={{ opacity: 0, x: -15 }}
                  animate={{ opacity: 1, x: 0 }}
                  exit={{ opacity: 0, x: 15 }}
                  transition={{ duration: 0.2, ease: 'easeInOut' }}
                  className="max-w-md mx-auto w-full min-h-full flex flex-col"
                >
                  {renderTabContent()}
                </motion.div>
              </AnimatePresence>
            </main>

            {/* Barra de Navegação Inferior Otimizada */}
            <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-2 pt-2 pb-safe z-50">
              <div className="max-w-md mx-auto flex justify-around items-center">
                {[
                  { id: 'workout', icon: Play, label: 'Treinar' },
                  { id: 'history', icon: HistoryIcon, label: 'Histórico' },
                  { id: 'cardio', icon: HeartPulse, label: 'Cardio' },
                  { id: 'biometrics', icon: Scale, label: 'Corpo' },
                  { id: 'settings', icon: SettingsIcon, label: 'Ajustes' }
                ].map((tab) => (
                  <button aria-label={tab.label} title={tab.label}
                    key={tab.id}
                    onClick={() => setActiveTab(tab.id as Tab)}
                    className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 relative ${
                      activeTab === tab.id 
                        ? 'text-primary' 
                        : 'text-gray-600 dark:text-gray-400 active:scale-95'
                    }`}
                  >
                    {activeTab === tab.id && (
                      <motion.div
                        layoutId="activeTabIndicator"
                        className="absolute inset-0 bg-primary/10 rounded-xl"
                        transition={{ type: 'spring', bounce: 0.2, duration: 0.5 }}
                      />
                    )}
                    <motion.div 
                      animate={activeTab === tab.id ? { scale: 1.1 } : { scale: 1 }}
                      transition={{ type: 'spring', stiffness: 300, damping: 20 }}
                      className="relative z-10"
                    >
                      <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
                    </motion.div>
                    <span className={`text-xs font-bold uppercase tracking-tight relative z-10 transition-opacity duration-200 ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
                      {tab.label}
                    </span>
                  </button>
                ))}
              </div>
              {/* Espaçador para Safe Area inferior */}
              <div className="h-[env(safe-area-inset-bottom)]" />
            </nav>
          </motion.div>
        )}
      </AnimatePresence>
    )
  }

  return (
    <ConfirmProvider>
      <Toaster 
        position="top-center"
        toastOptions={{
          duration: 3000,
          style: {
            background: '#333',
            color: '#fff',
            borderRadius: '12px',
            fontSize: '14px',
            fontWeight: 'bold',
          },
          success: {
            iconTheme: {
              primary: '#00C896',
              secondary: '#fff',
            },
          },
        }}
      />
      {renderAppContent()}
      <RoutineImporter />
      <ReloadPrompt />
    </ConfirmProvider>
  )
}

export default App;
