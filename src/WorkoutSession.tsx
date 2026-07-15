import React, { useEffect, useState, useMemo } from 'react';
import { useWorkoutStore } from './store';
import { db, type Exercicio } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { CheckCircle2, Circle, Clock, ChevronRight, ChevronLeft, XCircle, TrendingUp, Info } from 'lucide-react';
import { useConfirm } from './ConfirmDialog';
import ExerciseHelpModal from './ExerciseHelpModal';

const WorkoutSession: React.FC = () => {
  const { activeWorkout, restTimer, isTimerActive, tickTimer, toggleSerie, finishWorkout, stopTimer } = useWorkoutStore();
  const [helpExercise, setHelpExercise] = useState<Exercicio | null>(null);
  const todosExercicios = useLiveQuery(() => db.exercicios.toArray()) || [];
  const sessoesPassadas = useLiveQuery(() => db.sessoes.orderBy('data_inicio').reverse().toArray()) || [];
  const confirm = useConfirm();

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
              const isFinished = exRealizado.series.every(s => s.concluida);
              
              return (
                <div 
                  key={exRealizado.exercicio_id} 
                  className={`transition-all duration-300 ${isFinished ? 'opacity-60 grayscale-[0.5]' : ''}`}
                >
                  {/* Indicador de Biset/Grupo */}
                  {configEx?.grupo && localIdx === 0 && (
                    <div className="flex items-center gap-2 mb-2 px-2 text-primary font-black uppercase tracking-widest text-xs">
                      <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">{configEx.grupo}</span>
                      <span>Biset {configEx.grupo}</span>
                    </div>
                  )}

                  <div className="bg-white dark:bg-gray-800 rounded-3xl p-5 shadow-xl shadow-black/5 border border-gray-100 dark:border-gray-700/50">
                    <div className="flex items-start gap-4 mb-4">
                      <div className="w-10 h-10 bg-primary text-white rounded-2xl flex items-center justify-center font-black text-lg shadow-lg shadow-primary/20 shrink-0">
                        {exIdx + 1}
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between gap-2">
                          <h3 className="font-black text-lg leading-tight truncate dark:text-gray-100">{infoEx?.nome}</h3>
                          <div className="flex gap-1 shrink-0">
                            <button aria-label="Anotações do exercício" title="Anotações do exercício" 
                              onClick={() => {
                                const note = prompt('Anotação para este exercício:', exRealizado.notas || '');
                                if (note !== null) useWorkoutStore.getState().setExercicioNotas(exRealizado.exercicio_id, note);
                              }}
                              className={`p-1.5 rounded-lg transition-colors ${exRealizado.notas ? 'text-primary bg-primary/10' : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/5'}`}
                            >
                              <svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z"/></svg>
                            </button>
                            <button aria-label="Informações" title="Informações" 
                              onClick={() => infoEx && setHelpExercise(infoEx)}
                              className="p-1.5 text-primary hover:bg-primary/10 rounded-lg transition-colors"
                            >
                              <Info size={18} />
                            </button>
                          </div>
                        </div>
                        <div className="flex flex-wrap items-center gap-2 mt-1">
                          <span className="text-xs bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-md text-gray-500 dark:text-gray-600 dark:text-gray-400 font-bold uppercase tracking-tighter">
                            {infoEx?.categoria}
                          </span>
                        </div>
                        {exRealizado.notas && (
                          <div className="mt-2 text-xs text-gray-600 dark:text-gray-600 dark:text-gray-400 bg-yellow-50 dark:bg-yellow-900/20 p-2 rounded-lg border border-yellow-100 dark:border-yellow-900/30">
                            <span className="font-bold block mb-1">Nota:</span>
                            {exRealizado.notas}
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="space-y-3">
                      {/* Meta da Rotina */}
                      {configEx && (
                        <div className="flex flex-wrap items-center gap-2 mb-3 px-1">
                          <span className="text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest">
                            Meta:
                          </span>
                          <span className="bg-primary/10 text-primary text-[11px] font-black px-3 py-1 
                                           rounded-full border border-primary/20">
                            {configEx.series_aquecimento > 0 && (
                              `${configEx.series_aquecimento} aquec. + `
                            )}
                            {configEx.series_trabalho} séries
                            {' × '}
                            {infoEx?.tipo === 'carga'
                              ? `${configEx.metas.repeticoes || '?'} reps`
                              : `${configEx.metas.tempo || '?'}s`
                            }
                          </span>
                          {configEx.tempo_descanso && (
                            <span className="bg-blue-500/10 text-blue-500 text-[11px] font-black px-3 py-1 
                                             rounded-full border border-blue-500/20">
                              {configEx.tempo_descanso}s descanso
                            </span>
                          )}
                        </div>
                      )}

                      {/* Header das colunas */}
                      <div className="grid grid-cols-[30px_1fr_1fr_1fr_44px] gap-2 px-2 text-[11px] font-black text-gray-600 dark:text-gray-400 uppercase tracking-widest text-center">
                        <span>TIPO</span>
                        <span>Carga</span>
                        <span>{infoEx?.tipo === 'carga' ? 'Reps' : 'Tempo'}</span>
                        <span>RPE</span>
                        <span></span>
                      </div>

                      {exRealizado.series.map((serie, sIdx) => {
                        const ghostData = (() => {
                          for (const sessao of sessoesPassadas) {
                            const ex = sessao.exercicios_realizados.find(e => e.exercicio_id === exRealizado.exercicio_id);
                            if (ex && ex.series[sIdx] && ex.series[sIdx].concluida) {
                              const s = ex.series[sIdx];
                              return `${s.carga}kg × ${s.repeticoes || s.tempo}`;
                            }
                          }
                          return null;
                        })();

                        return (
                          <div key={sIdx} className="flex flex-col gap-1">
                            <div 
                              className={`grid grid-cols-[30px_1fr_1fr_1fr_44px] gap-2 items-center p-1.5 rounded-2xl border-2 transition-all ${
                                serie.concluida 
                                  ? 'bg-primary/5 border-primary/20' 
                                  : 'bg-gray-50 dark:bg-gray-900/40 border-transparent'
                              }`}
                            >
                              <div className={`flex flex-col items-center justify-center rounded-lg h-full ${serie.tipo === 'aquecimento' ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600' : 'bg-primary/10 text-primary'}`}>
                                <span className="text-[7px] font-black uppercase tracking-tighter">{serie.tipo === 'aquecimento' ? 'AQ' : 'TR'}</span>
                                <span className="text-xs font-black leading-none">
                                  {serie.tipo === 'trabalho'
                                    ? `${exRealizado.series.filter((s, i) => s.tipo === 'trabalho' && i <= sIdx).length}/${configEx?.series_trabalho ?? '?'}`
                                    : `${exRealizado.series.filter((s, i) => s.tipo === 'aquecimento' && i <= sIdx).length}/${configEx?.series_aquecimento ?? '?'}`
                                  }
                                </span>
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
                                  placeholder={
                                    infoEx?.tipo === 'carga'
                                      ? (configEx?.metas.repeticoes || '0')
                                      : String(configEx?.metas.tempo || '0')
                                  }
                                  onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, infoEx?.tipo === 'carga' ? { repeticoes: parseInt(e.target.value) || 0 } : { tempo: parseInt(e.target.value) || 0 })}
                                />
                                <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">{infoEx?.tipo === 'carga' ? 'rep' : 'seg'}</span>
                              </div>

                              <div className="relative">
                                <input
                                  type="number"
                                  inputMode="numeric"
                                  className={`w-full h-10 bg-white dark:bg-gray-800 rounded-xl font-black text-center outline-none border border-gray-100 dark:border-gray-700 focus:border-primary transition-colors text-sm ${
                                    !serie.rpe || serie.rpe < 6 ? 'text-gray-400 focus:text-primary' :
                                    serie.rpe < 8 ? 'text-primary' :
                                    serie.rpe < 10 ? 'text-orange-500' : 'text-red-500'
                                  }`}
                                  placeholder="-"
                                  value={serie.rpe || ''}
                                  onChange={(e) => toggleSerie(exRealizado.exercicio_id, sIdx, { rpe: parseInt(e.target.value) || 0 })}
                                />
                                <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">rpe</span>
                              </div>

                              <button aria-label="Concluir Série" title="Concluir Série" 
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
                            {ghostData && !serie.concluida && (
                              <div className="flex justify-center -mt-1">
                                <span className="text-xs font-bold text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-700 px-2 py-0.5 rounded-b-lg border-b border-l border-r border-gray-200 dark:border-gray-600">
                                  ÚLTIMO: {ghostData}
                                </span>
                              </div>
                            )}
                          </div>
                        );
                      })}

                      {/* IA - Sugestão de Sobrecarga */}
                      {(() => {
                        if (!configEx || infoEx?.tipo !== 'carga') return null;
                        const hasLowRpeSuccess = exRealizado.series.some(s => 
                          s.concluida && 
                          s.tipo === 'trabalho' && 
                          s.rpe !== undefined && s.rpe > 0 && s.rpe <= 7 && 
                          s.repeticoes !== undefined && s.repeticoes >= Number(configEx.metas.repeticoes || 0)
                        );
                        
                        if (hasLowRpeSuccess) {
                          return (
                            <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
                              <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0 mt-0.5">
                                <TrendingUp size={16} />
                              </div>
                              <p className="text-xs font-medium text-primary">
                                <strong>Sobrecarga sugerida:</strong> Você atingiu a meta com esforço moderado. Considere aumentar 1-2kg na próxima sessão!
                              </p>
                            </div>
                          );
                        }
                        return null;
                      })()}
                    </div>
                  </div>
                </div>
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
    </div>
  );
};

export default WorkoutSession;
