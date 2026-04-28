import { useState } from 'react'
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
    <div className="flex flex-col h-screen bg-gray-50 dark:bg-[#1a1a1a] text-gray-900 dark:text-gray-100 overflow-hidden">
      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto pb-20 max-w-2xl mx-auto w-full">
        {renderContent()}
      </main>

      {/* Bottom Navigation Bar */}
      <nav className="fixed bottom-0 left-0 right-0 bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800 px-4 py-3 z-20">
        <div className="max-w-2xl mx-auto flex justify-between items-center">
          <button 
            onClick={() => setActiveTab('workout')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'workout' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Play size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tight">Treinar</span>
          </button>
          
          <button 
            onClick={() => setActiveTab('catalog')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'catalog' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Dumbbell size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tight">Catálogo</span>
          </button>

          <button 
            onClick={() => setActiveTab('history')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'history' ? 'text-primary' : 'text-gray-400'}`}
          >
            <HistoryIcon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tight">Histórico</span>
          </button>

          <button 
            onClick={() => setActiveTab('biometrics')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'biometrics' ? 'text-primary' : 'text-gray-400'}`}
          >
            <Scale size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tight">Corpo</span>
          </button>

          <button 
            onClick={() => setActiveTab('settings')}
            className={`flex flex-col items-center gap-1 transition-colors ${activeTab === 'settings' ? 'text-primary' : 'text-gray-400'}`}
          >
            <SettingsIcon size={20} />
            <span className="text-[9px] font-bold uppercase tracking-tight">Ajustes</span>
          </button>
        </div>
      </nav>
    </div>
  )
}

export default App
