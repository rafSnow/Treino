import { create } from 'zustand';
import { type Rotina, type Serie } from './db';

interface ActiveWorkout {
  rotina: Rotina;
  data_inicio: Date;
  exercicios_realizados: {
    exercicio_id: number;
    series: Serie[];
  }[];
}

interface WorkoutStore {
  activeWorkout: ActiveWorkout | null;
  restTimer: number; // em segundos
  isTimerActive: boolean;
  installPrompt: any;
  
  startWorkout: (rotina: Rotina) => void;
  finishWorkout: () => void;
  toggleSerie: (exercicio_id: number, serieIndex: number, data: Partial<Serie>) => void;
  
  // Timer actions
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  tickTimer: () => void;

  // PWA actions
  setInstallPrompt: (prompt: any) => void;
  installApp: () => void;
}

export const useWorkoutStore = create<WorkoutStore>((set, get) => ({
  activeWorkout: null,
  restTimer: 0,
  isTimerActive: false,
  installPrompt: null,

  setInstallPrompt: (prompt: any) => set({ installPrompt: prompt }),
  
  installApp: async () => {
    const { installPrompt } = get();
    if (!installPrompt) return;
    
    installPrompt.prompt();
    const { outcome } = await installPrompt.userChoice;
    if (outcome === 'accepted') {
      set({ installPrompt: null });
    }
  },

  startWorkout: (rotina: Rotina) => {
    const exercicios_realizados = rotina.exercicios.map(ex => ({
      exercicio_id: ex.exercicio_id,
      series: Array.from({ length: ex.series }).map(() => ({
        exercicio_id: ex.exercicio_id,
        concluida: false,
        carga: 0,
        repeticoes: 0,
        tempo: ex.metas.tempo || 0
      }))
    }));

    set({
      activeWorkout: {
        rotina,
        data_inicio: new Date(),
        exercicios_realizados
      },
      restTimer: 0,
      isTimerActive: false
    });
  },

  finishWorkout: () => {
    set({ activeWorkout: null, isTimerActive: false, restTimer: 0 });
  },

  toggleSerie: (exercicio_id: number, serieIndex: number, data: Partial<Serie>) => {
    const { activeWorkout } = get();
    if (!activeWorkout) return;

    const newExercicios = activeWorkout.exercicios_realizados.map(ex => {
      if (ex.exercicio_id === exercicio_id) {
        const newSeries = [...ex.series];
        newSeries[serieIndex] = { ...newSeries[serieIndex], ...data };
        return { ...ex, series: newSeries };
      }
      return ex;
    });

    set({
      activeWorkout: {
        ...activeWorkout,
        exercicios_realizados: newExercicios
      }
    });

    // Se a série foi concluída, inicia o timer (ex: 60s padrão se não houver meta)
    if (data.concluida) {
      get().startTimer(60);
    }
  },

  startTimer: (seconds: number) => set({ restTimer: seconds, isTimerActive: true }),
  stopTimer: () => set({ isTimerActive: false, restTimer: 0 }),
  tickTimer: () => set((state) => {
    if (state.restTimer <= 1) return { isTimerActive: false, restTimer: 0 };
    return { restTimer: state.restTimer - 1 };
  })
}));
