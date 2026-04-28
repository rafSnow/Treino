import React, { useEffect } from 'react';
import { useWorkoutStore } from './store';
import { db } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Circle, Clock, ChevronRight, XCircle } from 'lucide-react';

const WorkoutSession: React.FC = () => {
  const { activeWorkout, restTimer, isTimerActive, tickTimer, toggleSerie, finishWorkout, stopTimer } = useWorkoutStore();
  const todosExercicios = useLiveQuery(() => db.exercicios.toArray()) || [];
  const sessoesPassadas = useLiveQuery(() => db.sessoes.orderBy('data_inicio').reverse().toArray()) || [];

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
    if (confirm('Deseja finalizar o treino agora?')) {
      const sessao = {
        rotina_id: activeWorkout.rotina.id,
        data_inicio: activeWorkout.data_inicio,
        data_fim: new Date(),
        exercicios_realizados: activeWorkout.exercicios_realizados
      };
      await db.sessoes.add(sessao);
      finishWorkout();
    }
  };

  const handleCancel = () => {
    if (confirm('Tem certeza que deseja cancelar o treino? Os dados não serão salvos.')) {
      finishWorkout();
    }
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] overflow-hidden">
      {/* Header Fixo e Compacto */}
      <div className="bg-white/80 dark:bg-gray-900/80 backdrop-blur-md border-b dark:border-gray-800 p-3 z-30 shadow-sm">
        <div className="flex justify-between items-center w-full max-w-md mx-auto">
          <div className="overflow-hidden">
            <h2 className="font-bold text-base truncate">{activeWorkout.rotina.nome}</h2>
            <p className="text-[10px] text-primary font-bold uppercase tracking-widest">Treino Ativo</p>
          </div>
          
          {isTimerActive && (
            <div className="bg-primary text-white px-3 py-1.5 rounded-full flex items-center gap-2 animate-pulse shadow-lg shadow-primary/20">
              <Clock size={16} />
              <span className="font-bold font-mono text-lg">{restTimer}s</span>
              <button onClick={stopTimer} className="ml-1 bg-white/20 rounded-full p-0.5">
                <XCircle size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Lista de Exercícios com Scroll Próprio */}
      <div className="flex-1 overflow-y-auto p-4 space-y-4 pb-40">
        <div className="max-w-md mx-auto w-full space-y-4">
          {activeWorkout.exercicios_realizados.map((exRealizado, exIdx) => {
            const infoEx = todosExercicios.find(e => e.id === exRealizado.exercicio_id);
            
            return (
              <div key={exRealizado.exercicio_id} className="bg-white dark:bg-gray-800 rounded-2xl p-4 shadow-sm border border-gray-100 dark:border-gray-700">
                <div className="flex items-center gap-3 mb-4">
                  <div className="w-8 h-8 bg-primary/10 rounded-lg flex items-center justify-center text-primary font-bold text-sm">
                    {exIdx + 1}
                  </div>
                  <div className="flex-1 overflow-hidden">
                    <h3 className="font-bold text-base leading-tight truncate">{infoEx?.nome}</h3>
                    <div className="flex flex-wrap items-center gap-x-2">
                      <p className="text-[10px] text-gray-500 uppercase font-bold">{infoEx?.categoria}</p>
                      {getUltimaPerformance(exRealizado.exercicio_id) && (
                        <p className="text-[10px] text-primary/60 font-medium italic">
                          Prev: {getUltimaPerformance(exRealizado.exercicio_id)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>
                <div className="space-y-2">

                  {exRealizado.series.map((serie, sIdx) => (
                    <div 
                      key={sIdx} 
                      className={`flex items-center gap-3 p-2 rounded-xl border transition-all ${
                        serie.concluida 
                          ? 'bg-primary/5 border-primary/20' 
                          : 'bg-gray-50 dark:bg-gray-700/30 border-transparent'
                      }`}
                    >
                      <div className="w-5 text-center text-[10px] font-black text-gray-400">#{sIdx + 1}</div>
                      
                      <div className="flex-1 grid grid-cols-3 gap-2">
                        <div className="flex items-center gap-1 border-b dark:border-gray-700 pb-1">
                          <input
                            type="number"
                            inputMode="decimal"
                            className="w-full bg-transparent font-bold text-center outline-none"
                            placeholder="0"
                            value={serie.carga || ''}
                            onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, { carga: parseFloat(e.target.value) || 0 })}
                          />
                          <span className="text-[8px] text-gray-400 font-bold uppercase">kg</span>
                        </div>
                        <div className="flex items-center gap-1 border-b dark:border-gray-700 pb-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            className="w-full bg-transparent font-bold text-center outline-none"
                            placeholder="0"
                            value={infoEx?.tipo === 'carga' ? (serie.repeticoes || '') : (serie.tempo || '')}
                            onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, infoEx?.tipo === 'carga' ? { repeticoes: parseInt(e.target.value) || 0 } : { tempo: parseInt(e.target.value) || 0 })}
                          />
                          <span className="text-[8px] text-gray-400 font-bold uppercase">{infoEx?.tipo === 'carga' ? 'rep' : 's'}</span>
                        </div>
                        <div className="flex items-center gap-1 border-b dark:border-gray-700 pb-1">
                          <input
                            type="number"
                            inputMode="numeric"
                            min="1"
                            max="10"
                            className="w-full bg-transparent font-bold text-center outline-none text-primary"
                            placeholder="-"
                            value={serie.rpe || ''}
                            onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, { rpe: parseInt(e.target.value) || 0 })}
                          />
                          <span className="text-[8px] text-gray-400 font-bold uppercase">rpe</span>
                        </div>
                      </div>

                      <button
                        onClick={() => toggleSerie(exRealizado.exercicio_id, sIdx, { concluida: !serie.concluida })}
                        className={`p-1.5 transition-colors ${serie.concluida ? 'text-primary' : 'text-gray-300'}`}
                      >
                        {serie.concluida ? <CheckCircle2 size={28} /> : <Circle size={28} />}
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>

      {/* Floating Footer - Fixado e Seguro */}
      <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-gray-50 dark:from-[#121212] via-gray-50/80 dark:via-[#121212]/80 to-transparent pt-10">
        <div className="flex gap-3 max-w-md mx-auto pb-safe">
          <button
            onClick={handleCancel}
            className="bg-white dark:bg-gray-800 text-red-500 border border-red-500/20 p-4 rounded-2xl font-bold shadow-lg active:scale-95 transition-all"
          >
            <XCircle size={24} />
          </button>
          <button
            onClick={handleFinish}
            className="flex-1 bg-primary text-white p-4 rounded-2xl font-bold shadow-lg shadow-primary/20 flex items-center justify-center gap-2 active:scale-[0.98] transition-all"
          >
            Finalizar Treino
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default WorkoutSession;
