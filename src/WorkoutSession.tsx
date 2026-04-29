import React, { useEffect, useState } from 'react';
import { useWorkoutStore } from './store';
import { db, type Exercicio } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Circle, Clock, ChevronRight, XCircle, TrendingUp, RefreshCw, Info } from 'lucide-react';
import { useConfirm } from './ConfirmDialog';
import ExerciseHelpModal from './ExerciseHelpModal';

const WorkoutSession: React.FC = () => {
  const { activeWorkout, restTimer, isTimerActive, tickTimer, toggleSerie, finishWorkout, stopTimer } = useWorkoutStore();
  const [helpExercise, setHelpExercise] = useState<Exercicio | null>(null);
  const todosExercicios = useLiveQuery(() => db.exercicios.toArray()) || [];
  const sessoesPassadas = useLiveQuery(() => db.sessoes.orderBy('data_inicio').reverse().toArray()) || [];
  const confirm = useConfirm();

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
      if ('vibrate' in navigator) navigator.vibrate([200, 100, 200]);
      playBeep();
      stopTimer();
    }
    return () => clearInterval(interval);
  }, [isTimerActive, restTimer, tickTimer, stopTimer]);

  if (!activeWorkout) return null;

  const getUltimaPerformance = (exercicioId: number) => {
    for (const sessao of sessoesPassadas) {
      const ex = sessao.exercicios_realizados.find(e => e.exercicio_id === exercicioId);
      if (ex && ex.series.some(s => s.concluida)) {
        const serieValida = ex.series.find(s => s.concluida);
        return serieValida ? `${serieValida.carga}kg x ${serieValida.repeticoes || serieValida.tempo}` : null;
      }
    }
    return null;
  };

  const handleFinish = async () => {
    if (await confirm({
      title: 'Finalizar Treino',
      message: 'Deseja finalizar o treino agora? Os dados serão salvos no histórico.',
      confirmLabel: 'Finalizar',
      variant: 'primary'
    })) {
      try {
        await finishWorkout();
      } catch (err) {
        console.error('Falha ao finalizar treino:', err);
      }
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
                  <p className="text-[10px] text-gray-500 font-bold uppercase tracking-widest">Sessão em andamento</p>
                </div>
                <div className="flex items-center gap-1 bg-primary/10 px-2 py-0.5 rounded-lg text-primary font-black text-[10px] border border-primary/20">
                  <TrendingUp size={10} />
                  <span>{totalVolume.toLocaleString()} kg VOLUME</span>
                </div>
              </div>
            </div>
            
            {isTimerActive ? (
              <div className="bg-primary text-white pl-4 pr-1 py-1 rounded-full flex items-center gap-3 shadow-lg shadow-primary/30 border border-white/20">
                <div className="flex flex-col items-center">
                  <span className="text-[8px] font-black uppercase leading-none opacity-80">Descanso</span>
                  <span className="font-mono text-xl font-black leading-none">{restTimer}s</span>
                </div>
                <button onClick={stopTimer} className="bg-white/20 hover:bg-white/30 rounded-full p-2 transition-colors">
                  <XCircle size={18} />
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-1 text-gray-400">
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
      <div className="flex-1 overflow-y-auto p-4 space-y-6 pb-44 scroll-smooth scrollbar-hide">
        <div className="max-w-md mx-auto w-full space-y-6">
          {activeWorkout.exercicios_realizados.map((exRealizado, exIdx) => {
            const infoEx = todosExercicios.find(e => e.id === exRealizado.exercicio_id);
            const isFinished = exRealizado.series.every(s => s.concluida);
            
            return (
              <div 
                key={exRealizado.exercicio_id} 
                className={`transition-all duration-300 ${isFinished ? 'opacity-60 grayscale-[0.5]' : ''}`}
              >
                <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xl shadow-black/5 border border-gray-100 dark:border-gray-700/50">
                  <div className="flex items-start gap-4 mb-6">
                    <div className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 shrink-0">
                      {exIdx + 1}
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between gap-2">
                        <h3 className="font-black text-lg leading-tight truncate dark:text-gray-100">{infoEx?.nome}</h3>
                        <button 
                          onClick={() => infoEx && setHelpExercise(infoEx)}
                          className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                        >
                          <Info size={18} />
                        </button>
                      </div>
                      <div className="flex flex-wrap items-center gap-2 mt-1">
                        <span className="text-[10px] bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-gray-500 dark:text-gray-400 font-bold uppercase tracking-tighter">
                          {infoEx?.categoria}
                        </span>
                        {getUltimaPerformance(exRealizado.exercicio_id) && (
                          <div className="flex items-center gap-1 text-[10px] text-primary font-bold bg-primary/5 px-2 py-0.5 rounded-md border border-primary/10">
                            <TrendingUp size={10} />
                            <span>ANTERIOR: {getUltimaPerformance(exRealizado.exercicio_id)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  </div>

                  <div className="space-y-3">
                    {/* Substitutos Sugeridos */}
                    {(infoEx?.substituicao1_id || infoEx?.substituicao2_id) && (
                      <div className="flex flex-wrap gap-2 mb-4 px-1">
                        <span className="text-[8px] font-black text-gray-400 uppercase tracking-widest w-full">Sugestões de troca:</span>
                        {[infoEx.substituicao1_id, infoEx.substituicao2_id].map(subId => {
                          if (!subId) return null;
                          const subEx = todosExercicios.find(e => e.id === subId);
                          return subEx ? (
                            <div key={subId} className="text-[10px] font-bold text-gray-500 bg-gray-100 dark:bg-gray-700/50 px-2 py-1 rounded-lg border dark:border-gray-600 flex items-center gap-1">
                              <RefreshCw size={10} className="text-primary" />
                              {subEx.nome}
                            </div>
                          ) : null;
                        })}
                      </div>
                    )}

                    {/* Header das colunas */}
                    <div className="grid grid-cols-[30px_1fr_1fr_1fr_44px] gap-2 px-2 text-[9px] font-black text-gray-400 uppercase tracking-widest text-center">
                      <span>TIPO</span>
                      <span>Carga</span>
                      <span>{infoEx?.tipo === 'carga' ? 'Reps' : 'Tempo'}</span>
                      <span>RPE</span>
                      <span></span>
                    </div>

                    {exRealizado.series.map((serie, sIdx) => (
                      <div 
                        key={sIdx} 
                        className={`grid grid-cols-[30px_1fr_1fr_1fr_44px] gap-2 items-center p-1.5 rounded-2xl border-2 transition-all ${
                          serie.concluida 
                            ? 'bg-primary/5 border-primary/20' 
                            : 'bg-gray-50 dark:bg-gray-900/40 border-transparent'
                        }`}
                      >
                        <div className={`flex flex-col items-center justify-center rounded-lg h-full ${serie.tipo === 'aquecimento' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                          <span className="text-[7px] font-black uppercase tracking-tighter">{serie.tipo === 'aquecimento' ? 'AQ' : 'TR'}</span>
                          <span className="text-[10px] font-black leading-none">{sIdx + 1}</span>
                        </div>
                        
                        <div className="relative">
                          <input
                            type="number"
                            inputMode="decimal"
                            className="w-full h-10 bg-white dark:bg-gray-800 rounded-xl font-black text-center outline-none border border-gray-100 dark:border-gray-700 focus:border-primary transition-colors text-sm"
                            value={serie.carga || ''}
                            onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, { carga: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">kg</span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-full h-10 bg-white dark:bg-gray-800 rounded-xl font-black text-center outline-none border border-gray-100 dark:border-gray-700 focus:border-primary transition-colors text-sm"
                            value={infoEx?.tipo === 'carga' ? (serie.repeticoes || '') : (serie.tempo || '')}
                            onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, infoEx?.tipo === 'carga' ? { repeticoes: parseInt(e.target.value) || 0 } : { tempo: parseInt(e.target.value) || 0 })}
                          />
                          <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">{infoEx?.tipo === 'carga' ? 'rep' : 'seg'}</span>
                        </div>

                        <div className="relative">
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-full h-10 bg-white dark:bg-gray-800 rounded-xl font-black text-center outline-none border border-gray-100 dark:border-gray-700 focus:border-primary transition-colors text-sm text-primary"
                            placeholder="-"
                            value={serie.rpe || ''}
                            onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, { rpe: parseInt(e.target.value) || 0 })}
                          />
                          <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">rpe</span>
                        </div>

                        <button
                          onClick={() => toggleSerie(exRealizado.exercicio_id, sIdx, { concluida: !serie.concluida })}
                          className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all ${
                            serie.concluida 
                              ? 'bg-primary text-white shadow-lg shadow-primary/20' 
                              : 'bg-white dark:bg-gray-800 text-gray-300 border border-gray-100 dark:border-gray-700'
                          }`}
                        >
                          {serie.concluida ? <CheckCircle2 size={20} /> : <Circle size={20} />}
                        </button>
                      </div>
                    ))}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Rodapé de Ações de Alta Prioridade */}
      <div className="absolute bottom-0 left-0 right-0 p-6 bg-gradient-to-t from-gray-50 dark:from-[#1a1a1a] via-gray-50/95 dark:via-[#1a1a1a]/95 to-transparent pt-12 z-40">
        <div className="flex gap-4 max-w-md mx-auto pb-safe">
          <button
            onClick={handleCancel}
            className="h-14 w-14 bg-white dark:bg-gray-800 text-red-500 border-2 border-red-500/10 rounded-2xl flex items-center justify-center shadow-xl active:scale-90 transition-all shrink-0"
            title="Cancelar Treino"
          >
            <XCircle size={26} />
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 h-14 bg-primary text-white rounded-2xl font-black text-lg shadow-[0_10px_25px_-5px_rgba(0,200,150,0.4)] flex items-center justify-center gap-3 active:scale-[0.97] transition-all border-b-4 border-[#00a87d]"
          >
            FINALIZAR TREINO
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
    </div>
  );
};

export default WorkoutSession;
