import React from 'react';
import { Info, CheckCircle2, Circle, TrendingUp } from 'lucide-react';
import { useWorkoutStore } from '../store';
import type { SessaoTreino, Exercicio, Rotina } from '../db';

interface ExerciseExecutionCardProps {
  exRealizado: SessaoTreino['exercicios_realizados'][0];
  configEx: Rotina['exercicios'][0] | undefined;
  infoEx: Exercicio | undefined;
  exIdx: number;
  localIdx: number;
  sessoesPassadas: SessaoTreino[];
  setHelpExercise: (ex: Exercicio) => void;
}

const ExerciseExecutionCard: React.FC<ExerciseExecutionCardProps> = ({
  exRealizado,
  configEx,
  infoEx,
  exIdx,
  localIdx,
  sessoesPassadas,
  setHelpExercise,
}) => {
  const { toggleSerie, setExercicioNotas } = useWorkoutStore();

  const isFinished = exRealizado.series.every((s) => s.concluida);

  return (
    <div
      className={`transition-all duration-300 ${
        isFinished ? 'opacity-60 grayscale-[0.5]' : ''
      }`}
    >
      {/* Indicador de Biset/Grupo */}
      {configEx?.grupo && localIdx === 0 && (
        <div className="flex items-center gap-2 mb-2 px-2 text-primary font-black uppercase tracking-widest text-xs">
          <span className="w-4 h-4 rounded bg-primary/20 flex items-center justify-center">
            {configEx.grupo}
          </span>
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
              <h3 className="font-black text-lg leading-tight truncate dark:text-gray-100">
                {infoEx?.nome}
              </h3>
              <div className="flex gap-1 shrink-0">
                <button
                  aria-label="Anotações do exercício"
                  title="Anotações do exercício"
                  onClick={() => {
                    const note = prompt(
                      'Anotação para este exercício:',
                      exRealizado.notas || ''
                    );
                    if (note !== null)
                      setExercicioNotas(exRealizado.exercicio_id, note);
                  }}
                  className={`p-1.5 rounded-lg transition-colors ${
                    exRealizado.notas
                      ? 'text-primary bg-primary/10'
                      : 'text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/5'
                  }`}
                >
                  <svg
                    xmlns="http://www.w3.org/2000/svg"
                    width="18"
                    height="18"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    strokeLinecap="round"
                    strokeLinejoin="round"
                  >
                    <path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7" />
                    <path d="M18.5 2.5a2.12 2.12 0 0 1 3 3L12 15l-4 1 1-4Z" />
                  </svg>
                </button>
                <button
                  aria-label="Informações"
                  title="Informações"
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
              <span
                className="bg-primary/10 text-primary text-[11px] font-black px-3 py-1 
                               rounded-full border border-primary/20"
              >
                {configEx.series_aquecimento > 0 &&
                  `${configEx.series_aquecimento} aquec. + `}
                {configEx.series_trabalho} séries
                {' × '}
                {infoEx?.tipo === 'carga'
                  ? `${configEx.metas.repeticoes || '?'} reps`
                  : `${configEx.metas.tempo || '?'}s`}
              </span>
              {configEx.tempo_descanso && (
                <span
                  className="bg-blue-500/10 text-blue-500 text-[11px] font-black px-3 py-1 
                                 rounded-full border border-blue-500/20"
                >
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
                const ex = sessao.exercicios_realizados.find(
                  (e) => e.exercicio_id === exRealizado.exercicio_id
                );
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
                  <div
                    className={`flex flex-col items-center justify-center rounded-lg h-full ${
                      serie.tipo === 'aquecimento'
                        ? 'bg-orange-100 dark:bg-orange-900/20 text-orange-600'
                        : 'bg-primary/10 text-primary'
                    }`}
                  >
                    <span className="text-[7px] font-black uppercase tracking-tighter">
                      {serie.tipo === 'aquecimento' ? 'AQ' : 'TR'}
                    </span>
                    <span className="text-xs font-black leading-none">
                      {serie.tipo === 'trabalho'
                        ? `${
                            exRealizado.series.filter(
                              (s, i) => s.tipo === 'trabalho' && i <= sIdx
                            ).length
                          }/${configEx?.series_trabalho ?? '?'}`
                        : `${
                            exRealizado.series.filter(
                              (s, i) => s.tipo === 'aquecimento' && i <= sIdx
                            ).length
                          }/${configEx?.series_aquecimento ?? '?'}`}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      inputMode="decimal"
                      className="w-full h-10 bg-white dark:bg-gray-800 rounded-xl font-black text-center outline-none border border-gray-100 dark:border-gray-700 focus:border-primary transition-colors text-sm"
                      value={serie.carga || ''}
                      onChange={(e) =>
                        toggleSerie(exRealizado.exercicio_id, sIdx, {
                          carga: parseFloat(e.target.value) || 0,
                        })
                      }
                    />
                    <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">
                      kg
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      className="w-full h-10 bg-white dark:bg-gray-800 rounded-xl font-black text-center outline-none border border-gray-100 dark:border-gray-700 focus:border-primary transition-colors text-sm"
                      value={
                        infoEx?.tipo === 'carga'
                          ? serie.repeticoes || ''
                          : serie.tempo || ''
                      }
                      placeholder={
                        infoEx?.tipo === 'carga'
                          ? configEx?.metas.repeticoes || '0'
                          : String(configEx?.metas.tempo || '0')
                      }
                      onChange={(e) =>
                        toggleSerie(
                          exRealizado.exercicio_id,
                          sIdx,
                          infoEx?.tipo === 'carga'
                            ? { repeticoes: parseInt(e.target.value) || 0 }
                            : { tempo: parseInt(e.target.value) || 0 }
                        )
                      }
                    />
                    <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">
                      {infoEx?.tipo === 'carga' ? 'rep' : 'seg'}
                    </span>
                  </div>

                  <div className="relative">
                    <input
                      type="number"
                      inputMode="numeric"
                      className={`w-full h-10 bg-white dark:bg-gray-800 rounded-xl font-black text-center outline-none border border-gray-100 dark:border-gray-700 focus:border-primary transition-colors text-sm ${
                        !serie.rpe || serie.rpe < 6
                          ? 'text-gray-400 focus:text-primary'
                          : serie.rpe < 8
                          ? 'text-primary'
                          : serie.rpe < 10
                          ? 'text-orange-500'
                          : 'text-red-500'
                      }`}
                      placeholder="-"
                      value={serie.rpe || ''}
                      onChange={(e) =>
                        toggleSerie(exRealizado.exercicio_id, sIdx, {
                          rpe: parseInt(e.target.value) || 0,
                        })
                      }
                    />
                    <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">
                      rpe
                    </span>
                  </div>

                  <button
                    aria-label="Concluir Série"
                    title="Concluir Série"
                    onClick={() =>
                      toggleSerie(exRealizado.exercicio_id, sIdx, {
                        concluida: !serie.concluida,
                      })
                    }
                    className={`flex items-center justify-center h-10 w-10 rounded-xl transition-all ${
                      serie.concluida
                        ? 'bg-primary text-white shadow-lg shadow-primary/20'
                        : 'bg-white dark:bg-gray-800 text-gray-300 border border-gray-100 dark:border-gray-700'
                    }`}
                  >
                    {serie.concluida ? (
                      <CheckCircle2 size={20} />
                    ) : (
                      <Circle size={20} />
                    )}
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
            const hasLowRpeSuccess = exRealizado.series.some(
              (s) =>
                s.concluida &&
                s.tipo === 'trabalho' &&
                s.rpe !== undefined &&
                s.rpe > 0 &&
                s.rpe <= 7 &&
                s.repeticoes !== undefined &&
                s.repeticoes >= Number(configEx.metas.repeticoes || 0)
            );

            if (hasLowRpeSuccess) {
              return (
                <div className="mt-4 p-3 bg-primary/10 border border-primary/20 rounded-xl flex items-start gap-3">
                  <div className="bg-primary/20 p-2 rounded-full text-primary shrink-0 mt-0.5">
                    <TrendingUp size={16} />
                  </div>
                  <p className="text-xs font-medium text-primary">
                    <strong>Sobrecarga sugerida:</strong> Você atingiu a meta
                    com esforço moderado. Considere aumentar 1-2kg na próxima
                    sessão!
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
};

export default ExerciseExecutionCard;
