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
    const audioCtx = new (window.AudioContext || (window as any).webkitAudioContext)();
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
  }, [isTimerActive, restTimer]);

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
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] pb-32">
      {/* Header com Timer */}
      <div className="sticky top-0 bg-white dark:bg-gray-900 border-b dark:border-gray-800 p-4 z-20 shadow-sm">
        <div className="flex justify-between items-center max-w-2xl mx-auto w-full">
          <div>
            <h2 className="font-bold text-lg">{activeWorkout.rotina.nome}</h2>
            <p className="text-xs text-primary font-mono">Em andamento...</p>
          </div>
          
          {isTimerActive && (
            <div className="bg-primary/10 text-primary px-4 py-2 rounded-full flex items-center gap-2 animate-pulse border border-primary/20">
              <Clock size={18} />
              <span className="font-bold font-mono text-xl">{restTimer}s</span>
              <button onClick={stopTimer} className="ml-2 bg-primary text-white rounded-full p-0.5">
                <XCircle size={14} />
              </button>
            </div>
          )}
        </div>
      </div>

      <div className="flex-1 overflow-y-auto p-4 space-y-6 max-w-2xl mx-auto w-full">
        {activeWorkout.exercicios_realizados.map((exRealizado, exIdx) => {
          const infoEx = todosExercicios.find(e => e.id === exRealizado.exercicio_id);
          const metaEx = activeWorkout.rotina.exercicios.find(e => e.exercicio_id === exRealizado.exercicio_id);
          
          return (
            <div key={exRealizado.exercicio_id} className="bg-white dark:bg-gray-800 rounded-2xl p-5 shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex items-center gap-3 mb-4">
                <div className="w-10 h-10 bg-primary/10 rounded-full flex items-center justify-center text-primary font-bold">
                  {exIdx + 1}
                </div>
                <div>
                  <h3 className="font-bold text-lg leading-tight">{infoEx?.nome}</h3>
                  <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                    <p className="text-xs text-gray-500">{infoEx?.categoria} • {metaEx?.series} séries</p>
                    {getUltimaPerformance(exRealizado.exercicio_id) && (
                      <p className="text-[10px] bg-gray-100 dark:bg-gray-700 px-1.5 py-0.5 rounded text-gray-400 font-medium italic">
                        Último: {getUltimaPerformance(exRealizado.exercicio_id)}
                      </p>
                    )}
                  </div>
                </div>
              </div>

              <div className="space-y-2">
                {exRealizado.series.map((serie, sIdx) => (
                  <div 
                    key={sIdx} 
                    className={`flex items-center gap-4 p-3 rounded-xl border transition-all ${
                      serie.concluida 
                        ? 'bg-primary/5 border-primary/20' 
                        : 'bg-gray-50 dark:bg-gray-700/30 border-transparent'
                    }`}
                  >
                    <div className="w-6 text-center text-sm font-bold text-gray-400">#{sIdx + 1}</div>
                    
                    <div className="flex-1 grid grid-cols-3 gap-2">
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-full bg-transparent font-bold text-center border-b border-gray-300 dark:border-gray-600 focus:border-primary outline-none py-1"
                          placeholder="0"
                          value={serie.carga || ''}
                          onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, { carga: parseFloat(e.target.value) || 0 })}
                        />
                        <span className="text-[10px] text-gray-400 uppercase font-bold">kg</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          className="w-full bg-transparent font-bold text-center border-b border-gray-300 dark:border-gray-600 focus:border-primary outline-none py-1"
                          placeholder="0"
                          value={infoEx?.tipo === 'carga' ? (serie.repeticoes || '') : (serie.tempo || '')}
                          onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, infoEx?.tipo === 'carga' ? { repeticoes: parseInt(e.target.value) || 0 } : { tempo: parseInt(e.target.value) || 0 })}
                        />
                        <span className="text-[10px] text-gray-400 uppercase font-bold">{infoEx?.tipo === 'carga' ? 'reps' : 's'}</span>
                      </div>
                      <div className="flex items-center gap-1">
                        <input
                          type="number"
                          min="1"
                          max="10"
                          className="w-full bg-transparent font-bold text-center border-b border-gray-300 dark:border-gray-600 focus:border-primary outline-none py-1 text-primary"
                          placeholder="-"
                          value={serie.rpe || ''}
                          onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, { rpe: parseInt(e.target.value) || 0 })}
                        />
                        <span className="text-[10px] text-gray-400 uppercase font-bold">rpe</span>
                      </div>
                    </div>

                    <button
                      onClick={() => toggleSerie(exRealizado.exercicio_id, sIdx, { concluida: !serie.concluida })}
                      className={`p-2 transition-colors ${serie.concluida ? 'text-primary' : 'text-gray-300'}`}
                    >
                      {serie.concluida ? <CheckCircle2 size={32} /> : <Circle size={32} />}
                    </button>
                  </div>
                ))}
              </div>
            </div>
          );
        })}
      </div>

      {/* Floating Footer para Finalizar */}
      <div className="fixed bottom-24 left-4 right-4 flex gap-3 max-w-2xl mx-auto z-30">
        <button
          onClick={handleCancel}
          className="bg-white dark:bg-gray-800 text-red-500 border border-red-500/20 p-4 rounded-2xl font-bold shadow-lg hover:bg-red-50 transition-colors"
        >
          <XCircle size={24} />
        </button>
        <button
          onClick={handleFinish}
          className="flex-1 bg-primary text-white p-4 rounded-2xl font-bold shadow-lg flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all"
        >
          Finalizar Treino
          <ChevronRight size={20} />
        </button>
      </div>
    </div>
  );
};

export default WorkoutSession;
