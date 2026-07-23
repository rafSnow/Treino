import { create } from 'zustand';
import { persist, createJSONStorage } from 'zustand/middleware';
import { db, type Rotina, type Serie, type SessaoTreino } from './db';
import toast from 'react-hot-toast';
import confetti from 'canvas-confetti';

interface ActiveWorkout {
  rotina: Rotina;
  data_inicio: Date;
  notas?: string;
  exercicios_realizados: {
    exercicio_id: string;
    notas?: string;
    series: Serie[];
  }[];
}

interface BeforeInstallPromptEvent extends Event {
  readonly platforms: string[];
  readonly userChoice: Promise<{
    outcome: 'accepted' | 'dismissed';
    platform: string;
  }>;
  prompt(): Promise<void>;
}

interface WorkoutStore {
  activeWorkout: ActiveWorkout | null;
  restTimer: number; // em segundos
  isTimerActive: boolean;
  installPrompt: BeforeInstallPromptEvent | null;
  theme: 'system' | 'light' | 'dark';
  setTheme: (theme: 'system' | 'light' | 'dark') => void;
  
  startWorkout: (rotina: Rotina) => void;
  finishWorkout: (meta?: { duracao_minutos?: number, rpe_sessao?: number, calorias?: number, fc_media?: number }) => Promise<void>;
  toggleSerie: (exercicio_id: string, serieIndex: number, data: Partial<Serie>) => void;
  setSessaoNotas: (notas: string) => void;
  setExercicioNotas: (exercicio_id: string, notas: string) => void;
  
  // Timer actions
  startTimer: (seconds: number) => void;
  stopTimer: () => void;
  tickTimer: () => void;

  // PWA actions
  setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => void;
  installApp: () => void;

  checkAndRecordPR: (exercicio_id: string, carga: number, reps: number) => Promise<void>;
}

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({
      activeWorkout: null,
      restTimer: 0,
      isTimerActive: false,
      installPrompt: null,
      theme: 'system',

      setTheme: (theme: 'system' | 'light' | 'dark') => set({ theme }),

      setInstallPrompt: (prompt: BeforeInstallPromptEvent | null) => set({ installPrompt: prompt }),
      
      installApp: async () => {
        const { installPrompt } = get();
        if (!installPrompt) return;
        
        await installPrompt.prompt();
        const { outcome } = await installPrompt.userChoice;
        if (outcome === 'accepted') {
          set({ installPrompt: null });
        }
      },

      startWorkout: (rotina: Rotina) => {
        const exercicios_realizados = rotina.exercicios.map(ex => {
          const aquecimento: Serie[] = Array.from({ length: ex.series_aquecimento }).map(() => ({
            exercicio_id: ex.exercicio_id,
            concluida: false,
            carga: 0,
            repeticoes: 0,
            tempo: ex.metas.tempo || 0,
            tipo: 'aquecimento'
          }));

          const trabalho: Serie[] = Array.from({ length: ex.series_trabalho }).map(() => ({
            exercicio_id: ex.exercicio_id,
            concluida: false,
            carga: 0,
            repeticoes: 0,
            tempo: ex.metas.tempo || 0,
            tipo: 'trabalho'
          }));

          return {
            exercicio_id: ex.exercicio_id,
            series: [...aquecimento, ...trabalho]
          };
        });

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

      finishWorkout: async (meta) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        try {
          const sessao: SessaoTreino = {
            rotina_id: activeWorkout.rotina.id,
            data_inicio: activeWorkout.data_inicio,
            data_fim: new Date(),
            notas: activeWorkout.notas,
            exercicios_realizados: activeWorkout.exercicios_realizados,
            duracao_minutos: meta?.duracao_minutos,
            rpe_sessao: meta?.rpe_sessao,
            calorias: meta?.calorias,
            fc_media: meta?.fc_media
          };
          
          await db.sessoes.add(sessao);
          toast.success('Treino finalizado e salvo!');
          set({ activeWorkout: null, isTimerActive: false, restTimer: 0 });
        } catch (error) {
          console.error('Falha ao salvar treino:', error);
          toast.error('Erro ao salvar o treino.');
          throw error;
        }
      },

      setSessaoNotas: (notas: string) => {
        const { activeWorkout } = get();
        if (activeWorkout) {
          set({ activeWorkout: { ...activeWorkout, notas } });
        }
      },

      setExercicioNotas: (exercicio_id: string, notas: string) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;
        const newExercicios = activeWorkout.exercicios_realizados.map(ex => 
          ex.exercicio_id === exercicio_id ? { ...ex, notas } : ex
        );
        set({ activeWorkout: { ...activeWorkout, exercicios_realizados: newExercicios } });
      },

      checkAndRecordPR: async (exercicio_id, carga, reps) => {
        if (!carga || !reps) return;

        const allPRs = await db.personal_records
          .where('exercicio_id')
          .equals(exercicio_id)
          .toArray();

        // Encontrar o melhor PR atual
        const bestPR = allPRs.length > 0 
          ? allPRs.reduce((prev, current) => (current.carga > prev.carga || (current.carga === prev.carga && current.repeticoes > prev.repeticoes)) ? current : prev)
          : null;

        const isNewPR = !bestPR || (carga > bestPR.carga) || (carga === bestPR.carga && reps > bestPR.repeticoes);

        if (isNewPR) {
          await db.personal_records.add({
            exercicio_id,
            carga,
            repeticoes: reps,
            data: new Date()
          });
          
          const ex = await db.exercicios.get(exercicio_id);
          toast.success(`Novo Recorde em ${ex?.nome}! 🏆\n${carga}kg x ${reps} reps`, {
            icon: '🔥',
            duration: 4000,
            style: {
              background: '#00C896',
              color: '#fff',
              border: '2px solid rgba(255,255,255,0.2)'
            }
          });

          // Check config and trigger effects
          const confs = await db.configuracoes.toArray();
          const vibracao = confs.find(c => c.chave === 'vibracao')?.valor !== false;
          
          if (vibracao && 'vibrate' in navigator) {
            navigator.vibrate([200, 100, 200, 100, 500]);
          }

          confetti({
            particleCount: 100,
            spread: 70,
            origin: { y: 0.6 },
            colors: ['#00C896', '#ffffff', '#FFD700']
          });
        }
      },

      toggleSerie: (exercicio_id: string, serieIndex: number, data: Partial<Serie>) => {
        const { activeWorkout } = get();
        if (!activeWorkout) return;

        // Busca a configuração do exercício para obter o tempo_descanso
        const configExercicio = activeWorkout.rotina.exercicios.find(ex => ex.exercicio_id === exercicio_id);
        const tempoDescanso = configExercicio?.tempo_descanso || 60;

        const newExercicios = activeWorkout.exercicios_realizados.map(ex => {
          if (ex.exercicio_id === exercicio_id) {
            const newSeries = [...ex.series];
            newSeries[serieIndex] = { ...newSeries[serieIndex], ...data };
            return { ...ex, series: newSeries };
          }
          return ex;
        });

        const updatedSerie = newExercicios.find(ex => ex.exercicio_id === exercicio_id)?.series[serieIndex];

        set({
          activeWorkout: {
            ...activeWorkout,
            exercicios_realizados: newExercicios
          }
        });

        // Se a série foi concluída, inicia o timer e verifica PR
        if (data.concluida && updatedSerie) {
          get().checkAndRecordPR(exercicio_id, updatedSerie.carga || 0, updatedSerie.repeticoes || updatedSerie.tempo || 0);

          // Lógica de Biset: Só dispara o timer se for o último exercício do grupo para esta rodada
          let shouldStartTimer = true;
          if (configExercicio?.grupo) {
            // Verifica se há outro exercício no mesmo grupo onde a série atual ainda NÃO foi concluída
            const outrosNoGrupo = activeWorkout.rotina.exercicios.filter(ex => ex.grupo === configExercicio.grupo && ex.exercicio_id !== exercicio_id);
            for (const outroConfig of outrosNoGrupo) {
              const outroRealizado = newExercicios.find(ex => ex.exercicio_id === outroConfig.exercicio_id);
              if (outroRealizado && outroRealizado.series[serieIndex] && !outroRealizado.series[serieIndex].concluida) {
                shouldStartTimer = false;
                break;
              }
            }
          }

          if (shouldStartTimer) {
            get().startTimer(tempoDescanso);
          }
        }
      },

      startTimer: (seconds: number) => {
        set({ restTimer: seconds, isTimerActive: true });
        
        // Notificação em Background via Service Worker
        if ('serviceWorker' in navigator && Notification.permission === 'granted') {
          navigator.serviceWorker.ready.then(registration => {
            registration.active?.postMessage({
              type: 'START_REST_TIMER',
              delay: seconds * 1000,
              title: 'Descanso Concluído! 🔔',
              body: 'Hora de começar a próxima série.'
            });
          });
        }
      },
      stopTimer: () => {
        set({ isTimerActive: false, restTimer: 0 });
        
        // Cancela notificação agendada
        if ('serviceWorker' in navigator) {
          navigator.serviceWorker.ready.then(registration => {
            registration.active?.postMessage({ type: 'CANCEL_REST_TIMER' });
          });
        }
      },
      tickTimer: () => set((state) => {
        if (state.restTimer <= 0) return { isTimerActive: false, restTimer: 0 };
        return { restTimer: state.restTimer - 1 };
      })
    }),
    {
      name: 'workout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeWorkout: state.activeWorkout }),
    }
  )
);
