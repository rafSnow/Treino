import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { format, startOfMonth, endOfMonth, eachDayOfInterval, isSameDay, subMonths, addMonths } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, ChevronLeft, ChevronRight, TrendingUp, History as HistoryIcon } from 'lucide-react';
import Progress from './Progress';

const History: React.FC = () => {
  const [currentMonth, setCurrentMonth] = useState(new Date());
  const [view, setView] = useState<'list' | 'stats'>('list');

  const sessoes = useLiveQuery(() => db.sessoes.orderBy('data_inicio').reverse().toArray());
  const rotinas = useLiveQuery(() => db.rotinas.toArray()) || [];
  const exercicios = useLiveQuery(() => db.exercicios.toArray()) || [];

  const days = eachDayOfInterval({
    start: startOfMonth(currentMonth),
    end: endOfMonth(currentMonth),
  });

  const getRoutineName = (id?: number) => rotinas.find(r => r.id === id)?.nome || 'Treino Avulso';

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      {/* Header Tabs */}
      <div className="flex gap-2">
        <button
          onClick={() => setView('list')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            view === 'list' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700'
          }`}
        >
          <HistoryIcon size={18} />
          Histórico
        </button>
        <button
          onClick={() => setView('stats')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            view === 'stats' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-500 border border-gray-100 dark:border-gray-700'
          }`}
        >
          <TrendingUp size={18} />
          Evolução
        </button>
      </div>

      <div className="flex-1">
        {view === 'list' ? (
          <div className="space-y-6">
            {/* Calendário de Consistência */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <div className="flex justify-between items-center mb-4">
                <h3 className="font-bold flex items-center gap-2">
                  <CalendarIcon size={18} className="text-primary" />
                  {format(currentMonth, 'MMMM yyyy', { locale: ptBR })}
                </h3>
                <div className="flex gap-2">
                  <button onClick={() => setCurrentMonth(subMonths(currentMonth, 1))} className="p-1"><ChevronLeft size={20}/></button>
                  <button onClick={() => setCurrentMonth(addMonths(currentMonth, 1))} className="p-1"><ChevronRight size={20}/></button>
                </div>
              </div>
              <div className="grid grid-cols-7 gap-1">
                {['D', 'S', 'T', 'Q', 'Q', 'S', 'S'].map(d => (
                  <div key={d} className="text-center text-[10px] font-bold text-gray-400 py-1">{d}</div>
                ))}
                {days.map(day => {
                  const hasWorkout = sessoes?.some(s => isSameDay(new Date(s.data_inicio), day));
                  return (
                    <div
                      key={day.toString()}
                      className={`aspect-square flex items-center justify-center text-xs rounded-lg transition-colors ${
                        hasWorkout 
                          ? 'bg-primary text-white font-bold' 
                          : 'text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700'
                      }`}
                    >
                      {format(day, 'd')}
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Lista de Sessões */}
            <div className="space-y-4">
              <h3 className="font-bold text-lg px-1">Atividades Recentes</h3>
              {sessoes?.map(sessao => (
                <div key={sessao.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-primary">{getRoutineName(sessao.rotina_id)}</h4>
                      <p className="text-xs text-gray-500">
                        {format(new Date(sessao.data_inicio), "PPP 'às' p", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="text-right">
                      <span className="text-[10px] font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full uppercase">
                        {sessao.exercicios_realizados.length} Exercícios
                      </span>
                    </div>
                  </div>
                  
                  <div className="mt-3 pt-3 border-t dark:border-gray-700 space-y-1">
                    {sessao.exercicios_realizados.slice(0, 3).map(ex => {
                      const nomeEx = exercicios.find(e => e.id === ex.exercicio_id)?.nome;
                      const seriesConcluidas = ex.series.filter(s => s.concluida).length;
                      return (
                        <div key={ex.exercicio_id} className="text-xs flex justify-between">
                          <span className="text-gray-600 dark:text-gray-400">{nomeEx}</span>
                          <span className="font-medium">{seriesConcluidas} séries</span>
                        </div>
                      );
                    })}
                    {sessao.exercicios_realizados.length > 3 && (
                      <p className="text-[10px] text-gray-400 text-center mt-2">+ {sessao.exercicios_realizados.length - 3} outros</p>
                    )}
                  </div>
                </div>
              ))}
              {sessoes?.length === 0 && (
                <p className="text-center text-gray-500 py-12 italic">Nenhum treino registrado ainda.</p>
              )}
            </div>
          </div>
        ) : (
          <Progress />
        )}
      </div>
    </div>
  );
};

export default History;
