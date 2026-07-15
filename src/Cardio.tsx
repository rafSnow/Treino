import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type SessaoCardio } from './db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format, startOfMonth } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Plus, Trash2, Save, X, Activity, Footprints, Bike, Dumbbell, Timer, Flame, HeartPulse } from 'lucide-react';
import toast from 'react-hot-toast';

const TIPOS_CARDIO = ['Corrida', 'Caminhada', 'Ciclismo', 'Escada'] as const;
type TipoCardio = typeof TIPOS_CARDIO[number];

const Cardio: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [tipo, setTipo] = useState<TipoCardio>('Corrida');
  const [data, setData] = useState(format(new Date(), 'yyyy-MM-dd'));
  const [duracao, setDuracao] = useState('');
  const [distancia, setDistancia] = useState('');
  const [calorias, setCalorias] = useState('');
  const [bpm, setBpm] = useState('');
  const [notas, setNotas] = useState('');

  const sessoes = useLiveQuery(() => db.cardio.orderBy('data').toArray()) || [];

  const getPace = (duracaoMinutos: number, distanciaKm: number) => {
    if (!duracaoMinutos || !distanciaKm) return null;
    const paceTotalMinutes = duracaoMinutos / distanciaKm;
    const paceMinutes = Math.floor(paceTotalMinutes);
    const paceSeconds = Math.round((paceTotalMinutes - paceMinutes) * 60);
    return `${paceMinutes}:${paceSeconds.toString().padStart(2, '0')}`;
  };

  // Preview the pace in the form
  const duracaoNum = parseFloat(duracao);
  const distanciaNum = parseFloat(distancia);
  const pacePreview = (!isNaN(duracaoNum) && !isNaN(distanciaNum) && distanciaNum > 0) 
    ? getPace(duracaoNum, distanciaNum) 
    : '--:--';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!duracao || isNaN(duracaoNum)) {
      toast.error('Informe a duração válida em minutos.');
      return;
    }

    try {
      const nova: SessaoCardio = {
        tipo,
        data: new Date(data + 'T12:00:00'), // avoids timezone shifting
        duracao_minutos: duracaoNum,
        distancia_km: parseFloat(distancia) || undefined,
        calorias: parseFloat(calorias) || undefined,
        bpm_medio: parseFloat(bpm) || undefined,
        notas: notas.trim() || undefined
      };

      await db.cardio.add(nova);
      toast.success('Cardio registrado com sucesso!');
      setIsFormOpen(false);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar cardio.');
    }
  };

  const resetForm = () => {
    setTipo('Corrida');
    setData(format(new Date(), 'yyyy-MM-dd'));
    setDuracao('');
    setDistancia('');
    setCalorias('');
    setBpm('');
    setNotas('');
  };

  const handleDelete = async (id: number) => {
    if(confirm('Tem certeza que deseja excluir este registro de cardio?')) {
      try {
        await db.cardio.delete(id);
        toast.success('Registro excluído.');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir.');
      }
    }
  };

  // Stats for the current month
  const currentMonthStart = startOfMonth(new Date());
  const thisMonthSessions = sessoes.filter(s => new Date(s.data) >= currentMonthStart);
  const totalDistanceThisMonth = thisMonthSessions.reduce((acc, s) => acc + (s.distancia_km || 0), 0);
  const totalTimeThisMonth = thisMonthSessions.reduce((acc, s) => acc + s.duracao_minutos, 0);

  const getIconForType = (tipo: TipoCardio, size = 24) => {
    switch (tipo) {
      case 'Corrida': return <Activity size={size} />;
      case 'Caminhada': return <Footprints size={size} />;
      case 'Ciclismo': return <Bike size={size} />;
      case 'Escada': return <Dumbbell size={size} />;
      default: return <HeartPulse size={size} />;
    }
  };

  const chartData = sessoes
    .filter(s => s.distancia_km)
    .map(s => ({
      data: format(new Date(s.data), 'dd/MM'),
      distancia: s.distancia_km,
      fullDate: format(new Date(s.data), 'PPP', { locale: ptBR })
    }));

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Cardio</h1>
        <button aria-label="Botão" 
          onClick={() => setIsFormOpen(true)}
          className="bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Resumo do Mês */}
      <div className="grid grid-cols-2 gap-4">
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
          <p className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
            <Footprints size={12} /> Distância (Mês)
          </p>
          <p className="text-2xl font-black leading-none text-primary">
            {totalDistanceThisMonth.toFixed(1)} <span className="text-xs uppercase text-gray-700 dark:text-gray-300">km</span>
          </p>
        </div>
        <div className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col justify-center">
          <p className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400 mb-1 flex items-center gap-1">
            <Timer size={12} /> Tempo (Mês)
          </p>
          <p className="text-2xl font-black leading-none text-blue-500">
            {totalTimeThisMonth} <span className="text-xs uppercase text-gray-700 dark:text-gray-300">min</span>
          </p>
        </div>
      </div>

      {/* Gráfico de Evolução de Distância */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <h3 className="font-bold text-lg mb-6 flex items-center gap-2">
          <Activity size={18} className="text-primary"/>
          Distância Percorrida (km)
        </h3>
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
                  formatter={(value) => [`${value} km`, 'Distância']}
                />
                <Line 
                  type="monotone" 
                  dataKey="distancia" 
                  stroke="#00C896" 
                  strokeWidth={3} 
                  dot={{ r: 4, fill: "#00C896" }}
                />
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-600 dark:text-gray-400 italic text-sm">
            Adicione pelo menos dois treinos com distância para ver a evolução.
          </div>
        )}
      </div>

      {/* Feed de Cardio */}
      <div className="space-y-4">
        <h3 className="font-bold text-lg px-1">Registros</h3>
        {sessoes.slice().reverse().map(m => (
          <div key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex gap-4">
            <div className="w-12 h-12 bg-primary/10 text-primary rounded-xl flex items-center justify-center shrink-0">
              {getIconForType(m.tipo)}
            </div>
            <div className="flex-1 min-w-0">
              <div className="flex justify-between items-start mb-1">
                <h4 className="font-black text-lg truncate">{m.tipo}</h4>
                <button aria-label="Botão" onClick={() => m.id && handleDelete(m.id)} className="p-1 text-gray-300 hover:text-red-500 transition-colors">
                  <Trash2 size={16} />
                </button>
              </div>
              <p className="text-xs text-gray-600 dark:text-gray-400 uppercase font-bold tracking-wider mb-2">
                {format(new Date(m.data), 'PPP', { locale: ptBR })}
              </p>
              
              <div className="flex flex-wrap gap-2 text-[11px] font-bold">
                <span className="bg-blue-500/10 text-blue-500 px-2 py-1 rounded flex items-center gap-1">
                  <Timer size={12} /> {m.duracao_minutos} min
                </span>
                {m.distancia_km && (
                  <span className="bg-primary/10 text-primary px-2 py-1 rounded flex items-center gap-1">
                    <Footprints size={12} /> {m.distancia_km} km
                  </span>
                )}
                {(m.distancia_km && m.duracao_minutos) && (
                  <span className="bg-gray-100 dark:bg-gray-700 text-gray-600 dark:text-gray-300 px-2 py-1 rounded">
                    Pace: {getPace(m.duracao_minutos, m.distancia_km)} /km
                  </span>
                )}
                {m.calorias && (
                  <span className="bg-orange-500/10 text-orange-500 px-2 py-1 rounded flex items-center gap-1">
                    <Flame size={12} /> {m.calorias} kcal
                  </span>
                )}
                {m.bpm_medio && (
                  <span className="bg-red-500/10 text-red-500 px-2 py-1 rounded flex items-center gap-1">
                    <HeartPulse size={12} /> {m.bpm_medio} bpm
                  </span>
                )}
              </div>
              
              {m.notas && (
                <div className="mt-2 text-xs text-gray-700 dark:text-gray-300 italic border-l-2 border-gray-200 dark:border-gray-700 pl-2">
                  {m.notas}
                </div>
              )}
            </div>
          </div>
        ))}
        {sessoes.length === 0 && (
          <div className="text-center py-10 text-gray-600 dark:text-gray-400 text-sm">
            Nenhum cardio registrado ainda.
          </div>
        )}
      </div>

      {/* Modal de Formulário */}
      {isFormOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-end sm:items-center justify-center z-[100] p-4 overflow-y-auto backdrop-blur-sm">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 pb-10 sm:pb-6 shadow-xl animate-in slide-in-from-bottom duration-300 my-auto border border-gray-100 dark:border-gray-700">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-xl font-bold">Registrar Cardio</h2>
              <button aria-label="Botão" onClick={() => setIsFormOpen(false)} className="text-gray-600 dark:text-gray-400 hover:text-gray-600 dark:hover:text-white"><X size={24}/></button>
            </div>
            
            <form onSubmit={handleSubmit} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">Tipo *</label>
                  <select
                    value={tipo}
                    onChange={e => setTipo(e.target.value as TipoCardio)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
                  >
                    {TIPOS_CARDIO.map(t => <option key={t} value={t}>{t}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">Data *</label>
                  <input
                    required
                    type="date"
                    value={data}
                    onChange={e => setData(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
                  />
                </div>
              </div>
              
              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">Duração (min) *</label>
                  <input
                    required
                    type="number"
                    step="1"
                    min="1"
                    value={duracao}
                    onChange={e => setDuracao(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-blue-500 outline-none transition-all font-bold text-xl text-blue-500"
                    placeholder="30"
                  />
                  <Timer className="absolute right-4 top-[38px] text-gray-300" size={20} />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1 flex justify-between">
                    Distância (km)
                    <span className="text-[11px] text-primary bg-primary/10 px-1 rounded">Pace: {pacePreview}</span>
                  </label>
                  <input
                    type="number"
                    step="0.01"
                    min="0.1"
                    value={distancia}
                    onChange={e => setDistancia(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-xl text-primary"
                    placeholder="5.0"
                  />
                  <Footprints className="absolute right-4 top-[38px] text-gray-300" size={20} />
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">Calorias (kcal)</label>
                  <input
                    type="number"
                    step="1"
                    value={calorias}
                    onChange={e => setCalorias(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-orange-500 outline-none transition-all font-bold text-base"
                    placeholder="300"
                  />
                  <Flame className="absolute right-4 top-[36px] text-gray-300" size={16} />
                </div>
                <div className="relative">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">BPM Médio</label>
                  <input
                    type="number"
                    step="1"
                    value={bpm}
                    onChange={e => setBpm(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-red-500 outline-none transition-all font-bold text-base"
                    placeholder="140"
                  />
                  <HeartPulse className="absolute right-4 top-[36px] text-gray-300" size={16} />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">Notas (Opcional)</label>
                <textarea
                  value={notas}
                  onChange={e => setNotas(e.target.value)}
                  rows={2}
                  className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm resize-none"
                  placeholder="Como foi o treino?"
                />
              </div>

              <button aria-label="Botão"                 type="submit"
                className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all mt-6"
              >
                <Save size={20} />
                SALVAR CARDIO
              </button>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Cardio;
