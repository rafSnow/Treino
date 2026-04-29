import React, { useState, useMemo } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db } from './db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Activity, Calculator } from 'lucide-react';
import OneRMCalculator from './OneRMCalculator';

const Progress: React.FC = () => {
  const [selectedExerciseId, setSelectedExerciseId] = useState<number | null>(null);
  const [isCalculatorOpen, setIsCalculatorOpen] = useState(false);

  const exercicios = useLiveQuery(() => db.exercicios.toArray()) || [];
  const sessoes = useLiveQuery(() => db.sessoes.toArray());

  const chartData = useMemo(() => {
    if (!selectedExerciseId || !sessoes) return [];

    return sessoes
      .filter(s => s.exercicios_realizados.some(ex => ex.exercicio_id === selectedExerciseId))
      .map(s => {
        const exRealizado = s.exercicios_realizados.find(ex => ex.exercicio_id === selectedExerciseId);
        const maxCarga = Math.max(...(exRealizado?.series.filter(ser => ser.concluida).map(ser => ser.carga || 0) || [0]));
        
        return {
          data: format(new Date(s.data_inicio), 'dd/MM'),
          carga: maxCarga,
          fullDate: format(new Date(s.data_inicio), 'PPP', { locale: ptBR })
        };
      })
      .sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [selectedExerciseId, sessoes]);

  const currentEx = exercicios.find(e => e.id === selectedExerciseId);

  return (
    <div className="space-y-6 pb-10">
      <div className="flex gap-2">
        <div className="flex-1 bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <label className="block text-sm font-bold mb-3 text-gray-500 uppercase tracking-wider">
            Selecionar Exercício
          </label>
          <select
            value={selectedExerciseId || ''}
            onChange={(e) => setSelectedExerciseId(Number(e.target.value))}
            className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary outline-none font-bold"
          >
            <option value="">Escolha um exercício...</option>
            {exercicios.map(ex => (
              <option key={ex.id} value={ex.id}>{ex.nome}</option>
            ))}
          </select>
        </div>
        <button 
          onClick={() => setIsCalculatorOpen(true)}
          className="bg-white dark:bg-gray-800 px-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-center text-primary hover:bg-primary/5 transition-colors"
          title="Calculadora 1RM"
        >
          <Calculator size={28} />
        </button>
      </div>

      {isCalculatorOpen && <OneRMCalculator onClose={() => setIsCalculatorOpen(false)} />}

      {selectedExerciseId ? (
        <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
          <div className="mb-6">
            <h3 className="font-bold text-xl">{currentEx?.nome}</h3>
            <p className="text-sm text-gray-500">Progressão de Carga Máxima (kg)</p>
          </div>

          {chartData.length > 1 ? (
            <div className="h-64 w-full">
              <ResponsiveContainer width="100%" height="100%">
                <LineChart data={chartData}>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                  <XAxis 
                    dataKey="data" 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#999' }}
                    dy={10}
                  />
                  <YAxis 
                    axisLine={false} 
                    tickLine={false} 
                    tick={{ fontSize: 12, fill: '#999' }}
                  />
                  <Tooltip 
                    contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                    labelStyle={{ fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Line 
                    type="monotone" 
                    dataKey="carga" 
                    stroke="#00C896" 
                    strokeWidth={4} 
                    dot={{ r: 6, fill: '#00C896', strokeWidth: 2, stroke: '#fff' }}
                    activeDot={{ r: 8, fill: '#00C896' }}
                  />
                </LineChart>
              </ResponsiveContainer>
            </div>
          ) : (
            <div className="py-12 text-center text-gray-400">
              <Activity size={48} className="mx-auto mb-4 opacity-20" />
              <p>Dados insuficientes para gerar o gráfico.</p>
              <p className="text-xs">Realize este exercício em pelo menos 2 treinos diferentes.</p>
            </div>
          )}
        </div>
      ) : (
        <div className="py-20 text-center text-gray-400 bg-white dark:bg-gray-800 rounded-2xl border border-dashed border-gray-200 dark:border-gray-700">
          <p>Selecione um exercício acima para visualizar sua evolução.</p>
        </div>
      )}
    </div>
  );
};

export default Progress;
