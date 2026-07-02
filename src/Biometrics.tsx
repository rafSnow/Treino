import React, { useState, useEffect } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Biometria } from './db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scale, Ruler, Plus, Trash2, Save, X, Activity, Droplets, Camera } from 'lucide-react';
import toast from 'react-hot-toast';

const Biometrics: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [selectedMetric, setSelectedMetric] = useState<'peso' | 'percentual_gordura' | 'massa_muscular'>('peso');
  
  // Form State
  const [peso, setPeso] = useState('');
  const [gordura, setGordura] = useState('');
  const [musculo, setMusculo] = useState('');
  const [cintura, setCintura] = useState('');
  const [bracoD, setBracoD] = useState('');
  const [bracoE, setBracoE] = useState('');
  const [fotos, setFotos] = useState<string[]>([]);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);

  const medicoes = useLiveQuery(() => db.biometria.orderBy('data').toArray()) || [];

  // Auto-cálculo de massa magra
  useEffect(() => {
    if (peso && gordura && !musculo) {
      const p = parseFloat(peso);
      const g = parseFloat(gordura);
      if (!isNaN(p) && !isNaN(g)) {
        const massaMagra = p - (p * (g / 100));
        setMusculo(massaMagra.toFixed(1));
      }
    }
  }, [peso, gordura]); // intentionally only trigger on peso/gordura change

  const handlePhotoUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const files = e.target.files;
    if (!files) return;
    
    Array.from(files).forEach(file => {
      const reader = new FileReader();
      reader.onload = (event) => {
        const img = new Image();
        img.onload = () => {
          const canvas = document.createElement('canvas');
          const MAX_WIDTH = 800;
          let scaleSize = 1;
          if (img.width > MAX_WIDTH) {
            scaleSize = MAX_WIDTH / img.width;
          }
          canvas.width = img.width * scaleSize;
          canvas.height = img.height * scaleSize;
          const ctx = canvas.getContext('2d');
          ctx?.drawImage(img, 0, 0, canvas.width, canvas.height);
          const dataUrl = canvas.toDataURL('image/jpeg', 0.7);
          setFotos(prev => [...prev, dataUrl]);
        };
        img.src = event.target?.result as string;
      };
      reader.readAsDataURL(file);
    });
  };

  const removePhoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

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
        fotos: fotos.length > 0 ? fotos : undefined
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
    setFotos([]);
  };

  const handleDelete = async (id: number) => {
    if(confirm('Tem certeza que deseja excluir esta medição?')) {
      try {
        await db.biometria.delete(id);
        toast.success('Medição excluída.');
      } catch (error) {
        console.error(error);
        toast.error('Erro ao excluir.');
      }
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
      <div className="space-y-4">
        <h3 className="font-bold text-lg px-1">Histórico e Fotos</h3>
        {medicoes.slice().reverse().map(m => (
          <div key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="font-bold text-lg">{m.peso} kg</p>
                  {m.percentual_gordura && <span className="text-[10px] text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{m.percentual_gordura}% BF</span>}
                </div>
                <p className="text-xs text-gray-400 font-medium">{format(new Date(m.data), 'PPP', { locale: ptBR })}</p>
              </div>
              <button onClick={() => m.id && handleDelete(m.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 text-[10px] text-gray-500">
              {m.massa_muscular && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Músculo: <strong className="text-gray-700 dark:text-gray-300">{m.massa_muscular}kg</strong></span>}
              {m.cintura && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Cintura: <strong className="text-gray-700 dark:text-gray-300">{m.cintura}cm</strong></span>}
              {(m.braco_d || m.braco_e) && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Braço: <strong className="text-gray-700 dark:text-gray-300">{m.braco_d}/{m.braco_e}cm</strong></span>}
            </div>

            {m.fotos && m.fotos.length > 0 && (
              <div className="flex gap-2 overflow-x-auto pt-2 pb-1 scrollbar-hide">
                {m.fotos.map((foto, idx) => (
                  <img 
                    key={idx}
                    src={foto} 
                    alt={`Progresso ${idx+1}`} 
                    onClick={() => setFullScreenImage(foto)}
                    className="h-20 w-20 object-cover rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity"
                  />
                ))}
              </div>
            )}
          </div>
        ))}
      </div>

      {/* Modal de Imagem Fullscreen */}
      {fullScreenImage && (
        <div className="fixed inset-0 z-[110] bg-black/90 flex items-center justify-center p-4" onClick={() => setFullScreenImage(null)}>
          <button className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full"><X size={24}/></button>
          <img src={fullScreenImage} className="max-w-full max-h-[90vh] object-contain rounded-lg" alt="Progresso Fullscreen" />
        </div>
      )}

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
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-orange-500 outline-none transition-all font-bold text-base"
                    placeholder="BF %"
                  />
                </div>
                <div>
                  <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-1 flex justify-between">
                    <span>Massa Musc. (kg)</span>
                    {(peso && gordura) && <span className="text-[8px] bg-primary/20 text-primary px-1 rounded">AUTO</span>}
                  </label>
                  <input
                    type="number"
                    step="0.1"
                    value={musculo}
                    onChange={e => setMusculo(e.target.value)}
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-red-500 outline-none transition-all font-bold text-base"
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
                  className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-blue-500 outline-none transition-all font-bold text-base"
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
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-gray-500 outline-none transition-all font-bold text-base"
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
                    className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-gray-500 outline-none transition-all font-bold text-base"
                    placeholder="Esq"
                  />
                </div>
              </div>

              <div>
                <label className="block text-xs font-bold text-gray-400 uppercase tracking-widest mb-2 mt-2">Fotos de Progresso</label>
                <div className="flex flex-wrap gap-2">
                  {fotos.map((foto, idx) => (
                    <div key={idx} className="relative">
                      <img src={foto} alt={`Preview ${idx}`} className="w-16 h-16 object-cover rounded-xl border border-gray-200 dark:border-gray-700" />
                      <button 
                        type="button" 
                        onClick={() => removePhoto(idx)}
                        className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-0.5 shadow-md"
                      >
                        <X size={12} />
                      </button>
                    </div>
                  ))}
                  
                  <label className="w-16 h-16 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900">
                    <Camera size={20} className="mb-1" />
                    <span className="text-[8px] font-bold uppercase tracking-wider">Adicionar</span>
                    <input 
                      type="file" 
                      accept="image/*" 
                      multiple 
                      className="hidden" 
                      onChange={handlePhotoUpload} 
                    />
                  </label>
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
