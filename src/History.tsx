import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SessaoTreino } from './db';
import { format, isSameDay, subDays } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Calendar as CalendarIcon, TrendingUp, History as HistoryIcon, Search, Share2 } from 'lucide-react';
import Progress from './Progress';
import ShareWorkoutModal from './ShareWorkoutModal';

const History: React.FC = () => {
  const [view, setView] = useState<'list' | 'stats'>('list');
  const [filterText, setFilterText] = useState('');
  const [shareSessao, setShareSessao] = useState<SessaoTreino | null>(null);

  const sessoes = useLiveQuery(() => db.sessoes.orderBy('data_inicio').reverse().toArray());
  const rotinas = useLiveQuery(() => db.rotinas.toArray()) || [];
  const exercicios = useLiveQuery(() => db.exercicios.toArray()) || [];

  const getRoutineName = (id?: number) => rotinas.find(r => r.id === id)?.nome || 'Treino Avulso';

  const filteredSessoes = sessoes?.filter(s => {
    if (!filterText) return true;
    const nome = getRoutineName(s.rotina_id).toLowerCase();
    return nome.includes(filterText.toLowerCase());
  });

  // Heatmap - Últimos 365 dias (ou menos dependendo do layout, vamos fazer últimos 150 dias para caber bem no mobile ou scroll)
  const today = new Date();
  const heatmapDays = Array.from({ length: 180 }).map((_, i) => subDays(today, 179 - i));

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      {/* Header Tabs */}
      <div className="flex gap-2">
        <button aria-label="Botão"           onClick={() => setView('list')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            view === 'list' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
          }`}
        >
          <HistoryIcon size={18} />
          Histórico
        </button>
        <button aria-label="Botão"           onClick={() => setView('stats')}
          className={`flex-1 py-3 rounded-xl font-bold flex items-center justify-center gap-2 transition-all ${
            view === 'stats' ? 'bg-primary text-white shadow-lg' : 'bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-100 dark:border-gray-700'
          }`}
        >
          <TrendingUp size={18} />
          Evolução
        </button>
      </div>

      <div className="flex-1">
        {view === 'list' ? (
          <div className="space-y-6">
            {/* Heatmap de Consistência */}
            <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
              <h3 className="font-bold flex items-center gap-2 mb-4 text-sm">
                <CalendarIcon size={18} className="text-primary" />
                Consistência (Últimos 6 meses)
              </h3>
              <div className="overflow-x-auto scrollbar-hide">
                <div 
                  className="grid gap-1 pb-2" 
                  style={{ 
                    gridTemplateRows: 'repeat(7, 1fr)',
                    gridAutoFlow: 'column',
                    gridAutoColumns: '12px'
                  }}
                >
                  {heatmapDays.map(day => {
                    const countWorkouts = sessoes?.filter(s => isSameDay(new Date(s.data_inicio), day)).length || 0;
                    
                    let bgColor = 'bg-gray-100 dark:bg-gray-700';
                    if (countWorkouts === 1) bgColor = 'bg-primary/40';
                    if (countWorkouts === 2) bgColor = 'bg-primary/70';
                    if (countWorkouts > 2) bgColor = 'bg-primary';

                    return (
                      <div
                        key={day.toString()}
                        className={`w-3 h-3 rounded-[3px] ${bgColor}`}
                        title={`${countWorkouts} treino(s) em ${format(day, 'dd/MM/yyyy')}`}
                      />
                    );
                  })}
                </div>
              </div>
            </div>

            {/* Barra de Busca */}
            <div className="relative">
              <Search className="absolute left-4 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400" size={18} />
              <input
                type="text"
                placeholder="Filtrar por nome do treino..."
                value={filterText}
                onChange={(e) => setFilterText(e.target.value)}
                className="w-full pl-11 pr-4 py-3 bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 rounded-xl font-medium outline-none focus:border-primary transition-colors text-sm shadow-sm"
              />
            </div>

            {/* Lista de Sessões */}
            <div className="space-y-4">
              {filteredSessoes?.map(sessao => (
                <div key={sessao.id} className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
                  <div className="flex justify-between items-start mb-2">
                    <div>
                      <h4 className="font-bold text-primary text-lg">{getRoutineName(sessao.rotina_id)}</h4>
                      <p className="text-xs text-gray-700 dark:text-gray-300 font-medium">
                        {format(new Date(sessao.data_inicio), "PPP 'às' p", { locale: ptBR })}
                      </p>
                    </div>
                    <div className="flex items-center gap-2">
                      <button aria-label="Botão" 
                        onClick={() => setShareSessao(sessao)}
                        className="p-2 text-gray-600 dark:text-gray-400 hover:text-primary hover:bg-primary/10 rounded-xl transition-colors border border-gray-100 dark:border-gray-700"
                        title="Compartilhar Resumo"
                      >
                        <Share2 size={16} />
                      </button>
                    </div>
                  </div>
                  
                  <div className="flex flex-wrap gap-2 mb-3">
                    <span className="text-xs font-bold bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded-full uppercase">
                      {sessao.exercicios_realizados.length} Exercícios
                    </span>
                    {(() => {
                      const vol = sessao.exercicios_realizados.reduce(
                        (acc, ex) => acc + ex.series.filter(s => s.concluida).reduce((sAcc, s) => sAcc + (s.carga || 0) * (s.repeticoes || 0), 0),
                        0
                      );
                      return vol > 0 ? (
                        <span className="text-xs font-black text-primary bg-primary/10 px-2 py-1 rounded-full border border-primary/20 uppercase">
                          {vol.toLocaleString()}kg Volume
                        </span>
                      ) : null;
                    })()}
                    {sessao.data_fim && (
                      <span className="text-xs font-bold text-blue-500 bg-blue-500/10 px-2 py-1 rounded-full border border-blue-500/20 uppercase">
                        {Math.max(1, Math.round((new Date(sessao.data_fim).getTime() - new Date(sessao.data_inicio).getTime()) / 60000))} Min
                      </span>
                    )}
                  </div>
                  
                  <div className="pt-3 border-t dark:border-gray-700 space-y-1">
                    {sessao.exercicios_realizados.slice(0, 3).map(ex => {
                      const nomeEx = exercicios.find(e => e.id === ex.exercicio_id)?.nome;
                      const seriesConcluidas = ex.series.filter(s => s.concluida).length;
                      return (
                        <div key={ex.exercicio_id} className="text-xs flex justify-between">
                          <span className="text-gray-600 dark:text-gray-600 dark:text-gray-400 truncate pr-2">{nomeEx}</span>
                          <span className="font-medium shrink-0">{seriesConcluidas} séries</span>
                        </div>
                      );
                    })}
                    {sessao.exercicios_realizados.length > 3 && (
                      <p className="text-xs text-gray-600 dark:text-gray-400 text-center mt-2 font-bold">+ {sessao.exercicios_realizados.length - 3} outros</p>
                    )}
                  </div>
                </div>
              ))}
              {filteredSessoes?.length === 0 && (
                <p className="text-center text-gray-700 dark:text-gray-300 py-12 italic">Nenhum treino encontrado.</p>
              )}
            </div>
          </div>
        ) : (
          <Progress />
        )}
      </div>

      {shareSessao && (
        <ShareWorkoutModal
          sessao={shareSessao}
          rotina={rotinas.find(r => r.id === shareSessao.rotina_id)}
          exercicios={exercicios}
          onClose={() => setShareSessao(null)}
        />
      )}
    </div>
  );
};

export default History;
