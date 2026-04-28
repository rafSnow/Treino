import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Biometria } from './db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scale, Ruler, Plus, Trash2, Save, X } from 'lucide-react';

const Biometrics: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [peso, setPeso] = useState('');
  const [cintura, setCintura] = useState('');
  const [bracoD, setBracoD] = useState('');
  const [bracoE, setBracoE] = useState('');

  const medicoes = useLiveQuery(() => db.biometria.orderBy('data').toArray()) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peso) return;

    const nova: Biometria = {
      data: new Date(),
      peso: parseFloat(peso),
      cintura: cintura ? parseFloat(cintura) : undefined,
      braco_d: bracoD ? parseFloat(bracoD) : undefined,
      braco_e: bracoE ? parseFloat(bracoE) : undefined,
    };

    await db.biometria.add(nova);
    setIsFormOpen(false);
    setPeso('');
    setCintura('');
    setBracoD('');
    setBracoE('');
  };

  const chartData = medicoes.map(m => ({
    data: format(new Date(m.data), 'dd/MM'),
    peso: m.peso,
    fullDate: format(new Date(m.data), 'PPP', { locale: ptBR })
  }));

  const ultimaMedicao = medicoes[medicoes.length - 1];

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Corpo</h1>
        <button 
          onClick={() => setIsFormOpen(true)}
          className="bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Resumo atual */}
      {ultimaMedicao && (
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="bg-primary/10 p-2 rounded-lg text-primary">
              <Scale size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Peso Atual</p>
              <p className="text-xl font-bold">{ultimaMedicao.peso} <span className="text-xs font-normal">kg</span></p>
            </div>
          </div>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
              <Ruler size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Cintura</p>
              <p className="text-xl font-bold">{ultimaMedicao.cintura || '--'} <span className="text-xs font-normal">cm</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Peso */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-6">Evolução do Peso</h3>
        {medicoes.length > 1 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={10} />
                <YAxis hide domain={['dataMin - 2', 'dataMax + 2']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                />
                <Line 
                  type="monotone" 
                  dataKey="peso" 
                  stroke="#00C896" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: '#00C896' }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400 italic text-sm">
            Adicione pelo menos duas medições para ver o gráfico.
          </div>
        )}
      </div>

      {/* Histórico de Medições */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg px-1">Histórico</h3>
        {medicoes.slice().reverse().map(m => (
          <div key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div>
              <p className="font-bold">{m.peso} kg</p>
              <p className="text-xs text-gray-400">{format(new Date(m.data), 'PPP', { locale: ptBR })}</p>
            </div>
            <div className="flex gap-4 text-xs text-gray-500">
              {m.cintura && <span>C: {m.cintura}cm</span>}
              {(m.braco_d || m.braco_e) && <span>B: {m.braco_d}/{m.braco_e}cm</span>}
            </div>
            <button onClick={() => m.id && db.biometria.delete(m.id)} className="text-gray-300 hover:text-red-500">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal de Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[100] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 pb-10 sm:pb-6 shadow-xl animate-in slide-in-from-bottom duration-300">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nova Medição</h2>
              <button onClick={() => setIsFormOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium mb-1">Peso (kg) *</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={e => setPeso(e.target.value)}
                  className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none"
                  placeholder="Ex: 80.5"
                />
              </div>
              <div className="grid grid-cols-1 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Cintura (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={cintura}
                    onChange={e => setCintura(e.target.value)}
                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Ex: 85"
                  />
                </div>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium mb-1">Braço Dir. (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bracoD}
                    onChange={e => setBracoD(e.target.value)}
                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Dir"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium mb-1">Braço Esq. (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bracoE}
                    onChange={e => setBracoE(e.target.value)}
                    className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none"
                    placeholder="Esq"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all mt-6"
              >
                <Save size={20} />
                Salvar Medições
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Biometrics;
