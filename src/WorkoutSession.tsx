import { useCollection } from './db';
import React, { useEffect, useState, useMemo } from 'react';
import { useWorkoutStore } from './store';
import { db, type Exercicio } from './db';
import { Clock, ChevronRight, ChevronLeft, XCircle, TrendingUp } from 'lucide-react';
import { useConfirm } from './ConfirmDialog';
import ExerciseHelpModal from './ExerciseHelpModal';
import ExerciseExecutionCard from './components/ExerciseExecutionCard';
import EndWorkoutModal from './components/EndWorkoutModal';

const WorkoutSession: React.FC = () => {
  const { activeWorkout, restTimer, isTimerActive, tickTimer, finishWorkout, stopTimer } = useWorkoutStore();
  const [helpExercise, setHelpExercise] = useState<Exercicio | null>(null);
  const todosExercicios = useCollection<any>('exercicios') || [];
  const sessoesPassadas = useCollection<any>('sessoes', 'data_inicio', true) || [];
  const biometrias = useCollection<any>('biometria', 'data', true) || [];
  const configuracoes = useCollection<any>('configuracoes') || [];
  const confirm = useConfirm();

  const [isEndModalOpen, setIsEndModalOpen] = useState(false);
  const pesoKg = biometrias.length > 0 ? biometrias[0].peso : 70;
  const dataNascimento = configuracoes.find(c => c.chave === 'data_nascimento')?.valor as string;
  const idadeAnos = dataNascimento ? Math.floor((new Date().getTime() - new Date(dataNascimento).getTime()) / 31557600000) : 30;

  // Focus Mode States
  const [currentGroupIndex, setCurrentGroupIndex] = useState(0);
  const [touchStart, setTouchStart] = useState<number | null>(null);
  const [touchEnd, setTouchEnd] = useState<number | null>(null);

  const minSwipeDistance = 50;

  const onTouchStart = (e: React.TouchEvent) => {
    setTouchEnd(null);
    setTouchStart(e.targetTouches[0].clientX);
  };

  const onTouchMove = (e: React.TouchEvent) => {
    setTouchEnd(e.targetTouches[0].clientX);
  };

  const onTouchEnd = () => {
    if (!touchStart || !touchEnd) return;
    const distance = touchStart - touchEnd;
    const isLeftSwipe = distance > minSwipeDistance;
    const isRightSwipe = distance < -minSwipeDistance;
    
    if (isLeftSwipe && currentGroupIndex < focusGroups.length - 1) {
      setCurrentGroupIndex(prev => prev + 1);
    }
    if (isRightSwipe && currentGroupIndex > 0) {
      setCurrentGroupIndex(prev => prev - 1);
    }
  };

  const focusGroups = useMemo(() => {
    if (!activeWorkout) return [];
    
    const groups: { label: string | null; exercicios: typeof activeWorkout.exercicios_realizados }[] = [];
    let currentGroup: string | null = null;
    let currentExercises: typeof activeWorkout.exercicios_realizados = [];

    activeWorkout.exercicios_realizados.forEach(exRealizado => {
      const configEx = activeWorkout.rotina.exercicios.find(e => e.exercicio_id === exRealizado.exercicio_id);
      const grupo = configEx?.grupo || null;

      if (grupo && grupo === currentGroup) {
        currentExercises.push(exRealizado);
      } else {
        if (currentExercises.length > 0) {
          groups.push({ label: currentGroup, exercicios: currentExercises });
        }
        currentGroup = grupo;
        currentExercises = [exRealizado];
      }
    });
    if (currentExercises.length > 0) {
      groups.push({ label: currentGroup, exercicios: currentExercises });
    }
    return groups;
  }, [activeWorkout]);

  const playBeep = () => {
    // @ts-expect-error - Handling vendor prefix for legacy browsers
    const AudioContextClass = window.AudioContext || window.webkitAudioContext;
    if (!AudioContextClass) return;
    
    const audioCtx = new AudioContextClass();
    const oscillator = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioCtx.destination);

    oscillator.type = 'sine';
    oscillator.frequency.setValueAtTime(880, audioCtx.currentTime); // A5
    gainNode.gain.setValueAtTime(0.1, audioCtx.currentTime);

    oscillator.start();
    oscillator.stop(audioCtx.currentTime + 0.2);
  };

  useEffect(() => {
    let interval: number;
    if (isTimerActive && restTimer > 0) {
      interval = setInterval(() => {
        tickTimer();
      }, 1000);
    } else if (isTimerActive && restTimer === 0) {
      db.configuracoes.toArray().then(confs => {
        const som = confs.find(c => c.chave === 'som')?.valor !== false;
        const vibracao = confs.find(c => c.chave === 'vibracao')?.valor !== false;
        
        if (vibracao && 'vibrate' in navigator) navigator.vibrate([200, 100, 200]);
        if (som) playBeep();
      });
      stopTimer();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, restTimer, tickTimer, stopTimer]);

  if (!activeWorkout) return null;

  const handleFinish = () => {
    setIsEndModalOpen(true);
  };

  const handleFinishConfirm = async (meta: { duracao_minutos: number, rpe_sessao: number, calorias: number, fc_media?: number }) => {
    setIsEndModalOpen(false);
    try {
      await finishWorkout(meta);
    } catch (err) {
      console.error('Falha ao finalizar treino:', err);
    }
  };

  const handleCancel = async () => {
    if (await confirm({
      title: 'Cancelar Treino',
      message: 'Tem certeza que deseja cancelar o treino? Os dados não serão salvos.',
      confirmLabel: 'Sim, Cancelar',
      variant: 'danger'
    })) {
      // Para cancelar sem salvar, podemos simplesmente limpar a store
      useWorkoutStore.setState({ activeWorkout: null, isTimerActive: false, restTimer: 0 });
    }
  };

  const totalSeries = activeWorkout.exercicios_realizados.reduce((acc, ex) => acc + ex.series.length, 0);
  const seriesConcluidas = activeWorkout.exercicios_realizados.reduce(
    (acc, ex) => acc + ex.series.filter(s => s.concluida).length, 0
  );
  const totalVolume = activeWorkout.exercicios_realizados.reduce(
    (acc, ex) => acc + ex.series.filter(s => s.concluida).reduce((sAcc, s) => sAcc + (s.carga || 0) * (s.repeticoes || 0), 0),
    0
  );
  const progresso = (seriesConcluidas / totalSeries) * 100;

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] overflow-hidden text-gray-900 dark:text-gray-100">
      {/* Header Imersivo */}
      <div className="bg-white/90 dark:bg-gray-900/90 backdrop-blur-xl border-b dark:border-gray-800 z-30 shadow-sm">
        <div className="max-w-md mx-auto px-4 py-3">
          <div className="flex justify-between items-center mb-2">
            <div className="overflow-hidden flex-1">
              <h2 className="font-black text-lg truncate tracking-tight">{activeWorkout.rotina.nome}</h2>
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <span className="flex h-2 w-2 rounded-full bg-primary animate-pulse" />
                  <p className="text-xs text-gray-700 dark:text-gray-300 font-bold uppercase tracking-widest">Sessão em andamento</p>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-lg text-primary font-black text-xs border border-primary/20">
                  <TrendingUp size={10} />
                  <span>{totalVolume.toLocaleString()} kg VOLUME</span>
                </div>
              </div>
            </div>
            
            {isTimerActive ? (
              <div className="bg-primary text-white pl-4 pr-1 py-1 rounded-full flex items-center gap-3 shadow-lg shadow-primary/30 border border-white/20">
                <div className="flex flex-col items-center">
                  <span className="text-[11px] font-black uppercase leading-none opacity-80">Descanso</span>
                  <span className="font-mono text-xl font-black leading-none">{restTimer}s</span>
                </div>
                <button aria-label="Botão de Ação" onClick={stopTimer} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-600 dark:text-gray-400">
                <Clock size={14} />
                <span className="text-xs font-bold font-mono">--:--</span>
              </div>
            )}
          </div>
          
          {/* Barra de Progresso do Treino */}
          <div className="w-full h-1.5 bg-gray-100 dark:bg-gray-800 rounded-full overflow-hidden">
            <div 
              className="h-full bg-primary transition-all duration-500 ease-out shadow-[0_0_8px_rgba(0,200,150,0.5)]"
              style={{ width: `${progresso}%` }}
            />
          </div>
        </div>
      </div>

      {/* Lista de Exercícios - Área de Foco */}
      <div 
        className="flex-1 overflow-y-auto p-4 space-y-6 pb-44 scroll-smooth scrollbar-hide"
        onTouchStart={onTouchStart}
        onTouchMove={onTouchMove}
        onTouchEnd={onTouchEnd}
      >
        <div className="max-w-md mx-auto w-full flex flex-col h-full">
          {/* Navegação Focus Mode */}
          {focusGroups.length > 1 && (
            <div className="flex justify-between items-center px-2 mb-4 bg-white/50 dark:bg-gray-800/50 p-2 rounded-2xl backdrop-blur-sm border border-gray-200 dark:border-gray-700">
              <button 
                onClick={() => setCurrentGroupIndex(prev => Math.max(0, prev - 1))}
                disabled={currentGroupIndex === 0}
                className="p-2 disabled:opacity-30 text-gray-500 hover:text-primary transition-colors"
                aria-label="Voltar Exercício"
              >
                <ChevronLeft size={24} />
              </button>
              
              <div className="flex gap-1.5 overflow-x-auto px-2 max-w-[200px] scrollbar-hide items-center justify-center">
                {focusGroups.map((_, idx) => (
                  <div 
                    key={idx} 
                    className={`h-2 rounded-full transition-all shrink-0 ${idx === currentGroupIndex ? 'w-6 bg-primary' : 'w-2 bg-gray-300 dark:bg-gray-700'}`}
                  />
                ))}
              </div>

              <button 
                onClick={() => setCurrentGroupIndex(prev => Math.min(focusGroups.length - 1, prev + 1))}
                disabled={currentGroupIndex === focusGroups.length - 1}
                className="p-2 disabled:opacity-30 text-gray-500 hover:text-primary transition-colors"
                aria-label="Avançar Exercício"
              >
                <ChevronRight size={24} />
              </button>
            </div>
          )}

          <div className="space-y-6 animate-in slide-in-from-right-4 fade-in duration-300 fill-mode-forwards" key={currentGroupIndex}>
            {focusGroups[currentGroupIndex]?.exercicios.map((exRealizado, localIdx) => {
              // Precisamos encontrar o índice global original para o exIdx (número do exercício)
              const exIdx = activeWorkout.exercicios_realizados.findIndex(e => e.exercicio_id === exRealizado.exercicio_id);
              
              const infoEx = todosExercicios.find(e => e.id === exRealizado.exercicio_id);
              const configEx = activeWorkout.rotina.exercicios.find(
                e => e.exercicio_id === exRealizado.exercicio_id
              );
              
              return (
                <ExerciseExecutionCard
                  key={exRealizado.exercicio_id}
                  exRealizado={exRealizado}
                  configEx={configEx}
                  infoEx={infoEx}
                  exIdx={exIdx}
                  localIdx={localIdx}
                  sessoesPassadas={sessoesPassadas}
                  setHelpExercise={setHelpExercise}
                />
              );
            })}
          </div>
        </div>
      </div>

      {/* Rodapé de Ações de Alta Prioridade */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 dark:from-[#1a1a1a] via-gray-50/95 dark:via-[#1a1a1a]/95 to-transparent pt-12 z-40">
        <div className="flex gap-4 max-w-md mx-auto pb-safe">
          <button
            aria-label="Cancelar Treino"
            onClick={handleCancel}
            className="h-14 w-14 bg-white dark:bg-gray-800 text-red-500 border-2 border-red-500/10 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all shrink-0"
            title="Cancelar Treino"
          >
            <XCircle size={26} />
          </button>
          
          <button aria-label="Anotações do treino" title="Anotações do treino" 
            onClick={() => {
              const note = prompt('Anotação geral para este treino:', activeWorkout.notas || '');
              if (note !== null) useWorkoutStore.getState().setSessaoNotas(note);
            }}
            className={`h-14 w-14 border-2 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all shrink-0 ${activeWorkout.notas ? 'bg-primary/10 text-primary border-primary/20' : 'bg-white dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700'}`}
          >
            <svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
          </button>

          <button aria-label="Finalizar Treino" 
            onClick={handleFinish}
            className="flex-1 h-14 bg-primary text-white rounded-2xl font-black text-lg shadow-[0_10px_25px_-5px_rgba(0,200,150,0.4)] flex items-center justify-center gap-3 active:scale-[0.97] transition-all border-b-4 border-[#00a87d]"
          >
            FINALIZAR
            <ChevronRight size={24} />
          </button>
        </div>
      </div>

      {helpExercise && (
        <ExerciseHelpModal 
          exercise={helpExercise} 
          onClose={() => setHelpExercise(null)} 
        />
      )}

      {activeWorkout && (
        <EndWorkoutModal 
          isOpen={isEndModalOpen}
          onClose={() => setIsEndModalOpen(false)}
          onFinish={handleFinishConfirm}
          dataInicio={activeWorkout.data_inicio}
          pesoKg={pesoKg}
          idadeAnos={idadeAnos}
        />
      )}
    </div>
  );
};

export default WorkoutSession;
