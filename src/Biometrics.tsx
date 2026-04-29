import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Biometria } from './db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scale, Ruler, Plus, Trash2, Save, X, Activity, Droplets } from 'lucide-react';
import toast from 'react-hot-toast';

const Biometrics: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'peso' | 'percentual_gordura' | 'massa_muscular'>('peso');
  const [peso, setPeso] = useState('');
  const [gordura, setGordura] = useState('');
  const [musculo, setMusculo] = useState('');
  const [cintura, setCintura] = useState('');
  const [bracoD, setBracoD] = useState('');
  const [bracoE, setBracoE] = useState('');

  const medicoes = useLiveQuery(() => db.biometria.orderBy('data').toArray()) || [];

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!peso) return;

    try {
      const nova: Biometria = {
        data: new Date(),
        peso: parseFloat(peso),
        percentual_gordura: gordura ? parseFloat(gordura) : undefined,
        massa_muscular: musculo ? parseFloat(musculo) : undefined,
        cintura: cintura ? parseFloat(cintura) : undefined,
        braco_d: bracoD ? parseFloat(bracoD) : undefined,
        braco_e: bracoE ? parseFloat(bracoE) : undefined,
      };

      await db.biometria.add(nova);
      toast.success('Medição salva com sucesso!');
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar medição.');
    }
  };

  const resetForm = () => {
    setPeso('');
    setGordura('');
    setMusculo('');
    setCintura('');
    setBracoD('');
    setBracoE('');
  };

  const handleDelete = async (id: number) => {
    try {
      await db.biometria.delete(id);
      toast.success('Medição excluída.');
    } catch (error) {
      console.error(error);
      toast.error('Erro ao excluir.');
    }
  };

  const chartData = medicoes
    .filter(m => m[selectedMetric] !== undefined)
    .map(m => ({
      data: format(new Date(m.data), 'dd/MM'),
      valor: m[selectedMetric],
      fullDate: format(new Date(m.data), 'PPP', { locale: ptBR })
    }));

  const metricConfig = {
    peso: { label: 'Peso', color: '#00C896', unit: 'kg' },
    percentual_gordura: { label: '% Gordura', color: '#f97316', unit: '%' },
    massa_muscular: { label: 'Massa Muscular', color: '#ef4444', unit: 'kg' }
  };

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
          <button 
            onClick={() => setSelectedMetric('peso')}
            className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center gap-3 ${selectedMetric === 'peso' ? 'bg-primary/5 border-primary' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
          >
            <div className={`p-2 rounded-lg ${selectedMetric === 'peso' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
              <Scale size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Peso</p>
              <p className="text-xl font-bold leading-tight">{ultimaMedicao.peso}<span className="text-[10px] ml-0.5">kg</span></p>
            </div>
          </button>
          <button 
            onClick={() => setSelectedMetric('percentual_gordura')}
            className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center gap-3 ${selectedMetric === 'percentual_gordura' ? 'bg-orange-500/5 border-orange-500' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
          >
            <div className={`p-2 rounded-lg ${selectedMetric === 'percentual_gordura' ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-500'}`}>
              <Droplets size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">% Gordura</p>
              <p className="text-xl font-bold leading-tight">{ultimaMedicao.percentual_gordura || '--'}<span className="text-[10px] ml-0.5">%</span></p>
            </div>
          </button>
          <button 
            onClick={() => setSelectedMetric('massa_muscular')}
            className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center gap-3 ${selectedMetric === 'massa_muscular' ? 'bg-red-500/5 border-red-500' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
          >
            <div className={`p-2 rounded-lg ${selectedMetric === 'massa_muscular' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500'}`}>
              <Activity size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Massa Musc.</p>
              <p className="text-xl font-bold leading-tight">{ultimaMedicao.massa_muscular || '--'}<span className="text-[10px] ml-0.5">kg</span></p>
            </div>
          </button>
          <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center gap-3">
            <div className="bg-blue-500/10 p-2 rounded-lg text-blue-500">
              <Ruler size={24} />
            </div>
            <div>
              <p className="text-[10px] uppercase font-bold text-gray-400">Cintura</p>
              <p className="text-xl font-bold leading-tight">{ultimaMedicao.cintura || '--'}<span className="text-[10px] ml-0.5">cm</span></p>
            </div>
          </div>
        </div>
      )}

      {/* Gráfico de Evolução */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-6">Evolução: {metricConfig[selectedMetric].label}</h3>
        {chartData.length > 1 ? (
          <div className="h-48 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <LineChart data={chartData}>
                <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#eee" />
                <XAxis dataKey="data" axisLine={false} tickLine={false} tick={{fontSize: 10}} dy={10} />
                <YAxis hide domain={['dataMin - 1', 'dataMax + 1']} />
                <Tooltip 
                  contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 12px rgba(0,0,0,0.1)' }}
                  labelStyle={{ fontWeight: 'bold' }}
                  formatter={(value) => [`${value} ${metricConfig[selectedMetric].unit}`, metricConfig[selectedMetric].label]}
                />
                <Line 
                  type="monotone" 
                  dataKey="valor" 
                  stroke={metricConfig[selectedMetric].color} 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: metricConfig[selectedMetric].color }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-400 italic text-sm">
            Adicione pelo menos duas medições com {metricConfig[selectedMetric].label.toLowerCase()} para ver o gráfico.
          </div>
        )}
      </div>

      {/* Histórico de Medições */}
      <div className="space-y-3">
        <h3 className="font-bold text-lg px-1">Histórico</h3>
        {medicoes.slice().reverse().map(m => (
          <div key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex justify-between items-center">
            <div className="flex-1">
              <div className="flex items-baseline gap-2">
                <p className="font-bold">{m.peso} kg</p>
                {m.percentual_gordura && <span className="text-[10px] text-orange-500 font-bold">{m.percentual_gordura}% BF</span>}
              </div>
              <p className="text-[10px] text-gray-400">{format(new Date(m.data), 'PPP', { locale: ptBR })}</p>
            </div>
            <div className="flex flex-wrap justify-end gap-x-4 gap-y-1 text-[10px] text-gray-500 max-w-[150px] text-right">
              {m.massa_muscular && <span>Músculo: {m.massa_muscular}kg</span>}
              {m.cintura && <span>Cintura: {m.cintura}cm</span>}
              {(m.braco_d || m.braco_e) && <span>Braço: {m.braco_d}/{m.braco_e}cm</span>}
            </div>
            <button onClick={() => m.id && handleDelete(m.id)} className="ml-4 text-gray-300 hover:text-red-500 transition-colors">
              <Trash2 size={16} />
            </button>
          </div>
        ))}
      </div>

      {/* Modal de Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[100] p-4 overflow-y-auto">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 pb-10 sm:pb-6 shadow-xl animate-in slide-in-from-bottom duration-300 my-auto">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Nova Medição</h2>
              <button onClick={() => setIsFormOpen(false)}><X size={24}/></button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Peso (kg) *</label>
                <input
                  required
                  type="number"
                  step="0.1"
                  value={peso}
                  onChange={e => setPeso(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
                  placeholder="Ex: 80.5"
                />
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">% Gordura</label>
                  <input
                    type="number"
                    step="0.1"
                    value={gordura}
                    onChange={e => setGordura(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
                    placeholder="BF %"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Massa Musc. (kg)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={musculo}
                    onChange={e => setMusculo(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
                    placeholder="Músculo kg"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Cintura (cm)</label>
                <input
                  type="number"
                  step="0.1"
                  value={cintura}
                  onChange={e => setCintura(e.target.value)}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
                  placeholder="Ex: 85"
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Braço Dir. (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bracoD}
                    onChange={e => setBracoD(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
                    placeholder="Dir"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1">Braço Esq. (cm)</label>
                  <input
                    type="number"
                    step="0.1"
                    value={bracoE}
                    onChange={e => setBracoE(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
                    placeholder="Esq"
                  />
                </div>
              </div>
              <button
                type="submit"
                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all mt-6"
              >
                <Save size={20} />
                SALVAR MEDIÇÕES
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Biometrics;
