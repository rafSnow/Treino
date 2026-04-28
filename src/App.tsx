import { useState, useEffect } from 'react'
import ExerciseList from './ExerciseList'
import { Dumbbell, History as HistoryIcon, Settings as SettingsIcon, Play, Scale } from 'lucide-react'

import RoutineList from './RoutineList'
import WorkoutSession from './WorkoutSession'
import History from './History'
import Settings from './Settings'
import Biometrics from './Biometrics'
import { useWorkoutStore } from './store'

type Tab = 'catalog' | 'workout' | 'history' | 'biometrics' | 'settings'

function App() {
  const [activeTab, setActiveTab] = useState<Tab>('workout')
  const activeWorkout = useWorkoutStore(state => state.activeWorkout)
  const setInstallPrompt = useWorkoutStore(state => state.setInstallPrompt)

  useEffect(() => {
    const handler = (e: Event) => {
      e.preventDefault();
      setInstallPrompt(e as Parameters<typeof setInstallPrompt>[0]);
    };
    window.addEventListener('beforeinstallprompt', handler);
    return () => window.removeEventListener('beforeinstallprompt', handler);
  }, [setInstallPrompt]);

  if (activeWorkout) {
    return <WorkoutSession />
  }

  const renderContent = () => {
    switch (activeTab) {
      case 'catalog':
        return <ExerciseList />
      case 'workout':
        return <RoutineList />
      case 'history':
        return <History />
      case 'biometrics':
        return <Biometrics />
      case 'settings':
        return <Settings />
      default:
        return <History />
    }
  }

  return (
    <div className="flex flex-col h-full w-full bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Conteúdo Principal com Scroll Independente */}
      <main className="flex-1 overflow-y-auto scrollbar-hide">
        <div className="max-w-md mx-auto w-full min-h-full flex flex-col">
          {renderContent()}
        </div>
      </main>

      {/* Barra de Navegação Inferior Otimizada */}
      <nav className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-lg border-t border-gray-200 dark:border-gray-800 px-2 pt-2 pb-safe z-50">
        <div className="max-w-md mx-auto flex justify-around items-center">
          {[
            { id: 'workout', icon: Play, label: 'Treinar' },
            { id: 'catalog', icon: Dumbbell, label: 'Catálogo' },
            { id: 'history', icon: HistoryIcon, label: 'Histórico' },
            { id: 'biometrics', icon: Scale, label: 'Corpo' },
            { id: 'settings', icon: SettingsIcon, label: 'Ajustes' }
          ].map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id as Tab)}
              className={`flex flex-col items-center gap-1 py-2 px-3 rounded-xl transition-all duration-200 ${
                activeTab === tab.id 
                  ? 'text-primary scale-110' 
                  : 'text-gray-400 active:scale-95'
              }`}
            >
              <tab.icon size={22} strokeWidth={activeTab === tab.id ? 2.5 : 2} />
              <span className={`text-[10px] font-bold uppercase tracking-tight ${activeTab === tab.id ? 'opacity-100' : 'opacity-70'}`}>
                {tab.label}
              </span>
            </button>
          ))}
        </div>
        {/* Espaçador para Safe Area inferior */}
        <div className="h-[env(safe-area-inset-bottom)]" />
      </nav>
    </div>
  )
}

export default App
