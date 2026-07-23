import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Biometria } from './db';
import { LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, ReferenceLine } from 'recharts';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { Scale, Ruler, Plus, Trash2, Save, X, Activity, Droplets, Camera, ChevronLeft, ChevronRight, Layers, SlidersHorizontal, Target } from 'lucide-react';
import toast from 'react-hot-toast';
import PhotoComparison from './PhotoComparison';

const Biometrics: React.FC = () => {
  const [showActionSheet, setShowActionSheet] = useState(false);
  const [formType, setFormType] = useState<'peso' | 'perimetria' | 'dobras' | 'fotos' | null>(null);
  const [selectedMetric, setSelectedMetric] = useState<'peso' | 'percentual_gordura' | 'massa_muscular'>('peso');
  const [carouselIndex, setCarouselIndex] = useState(0);
  const [isComparing, setIsComparing] = useState(false);
  
  // Form State
  const [formData, setFormData] = useState<Record<string, string>>({});
  const [fotos, setFotos] = useState<string[]>([]);
  const [fotoFrente, setFotoFrente] = useState<string | undefined>(undefined);
  const [fotoLado, setFotoLado] = useState<string | undefined>(undefined);
  const [fotoCostas, setFotoCostas] = useState<string | undefined>(undefined);
  const [fullScreenImage, setFullScreenImage] = useState<string | null>(null);
  
  // Goals State
  const [goalModalOpen, setGoalModalOpen] = useState(false);
  const [goalValue, setGoalValue] = useState<string>('');

  const medicoes = useLiveQuery(() => db.biometria.orderBy('data').toArray()) || [];
  const configuracoes = useLiveQuery(() => db.configuracoes.toArray()) || [];

  const updateForm = (field: string, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

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

  const handleSpecificPhotoUpload = (e: React.ChangeEvent<HTMLInputElement>, tipo: 'frente' | 'lado' | 'costas') => {
    const file = e.target.files?.[0];
    if (!file) return;
    
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
        
        if (tipo === 'frente') setFotoFrente(dataUrl);
        else if (tipo === 'lado') setFotoLado(dataUrl);
        else if (tipo === 'costas') setFotoCostas(dataUrl);
      };
      img.src = event.target?.result as string;
    };
    reader.readAsDataURL(file);
  };

  const removePhoto = (index: number) => {
    setFotos(prev => prev.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (formType === 'peso' && !formData.peso) {
      toast.error('O Peso é obrigatório.');
      return;
    }

    try {
      const parseField = (field: string) => formData[field] ? parseFloat(formData[field]) : undefined;
      
      const nova: Biometria = {
        data: new Date(),
        peso: parseField('peso'),
        percentual_gordura: parseField('percentual_gordura'),
        massa_muscular: parseField('massa_muscular'),
        
        // Perimetria
        pescoco: parseField('pescoco'),
        ombros: parseField('ombros'),
        torax: parseField('torax'),
        braco_relaxado_d: parseField('braco_relaxado_d'),
        braco_relaxado_e: parseField('braco_relaxado_e'),
        braco_contraido_d: parseField('braco_contraido_d'),
        braco_contraido_e: parseField('braco_contraido_e'),
        antebraco_d: parseField('antebraco_d'),
        antebraco_e: parseField('antebraco_e'),
        cintura: parseField('cintura'),
        abdomen: parseField('abdomen'),
        quadril: parseField('quadril'),
        coxa_proximal_d: parseField('coxa_proximal_d'),
        coxa_proximal_e: parseField('coxa_proximal_e'),
        coxa_medial_d: parseField('coxa_medial_d'),
        coxa_medial_e: parseField('coxa_medial_e'),
        panturrilha_d: parseField('panturrilha_d'),
        panturrilha_e: parseField('panturrilha_e'),

        // Dobras
        dobra_peitoral: parseField('dobra_peitoral'),
        dobra_tricipital: parseField('dobra_tricipital'),
        dobra_subescapular: parseField('dobra_subescapular'),
        dobra_axilar: parseField('dobra_axilar'),
        dobra_suprailiaca: parseField('dobra_suprailiaca'),
        dobra_abdominal: parseField('dobra_abdominal'),
        dobra_coxa: parseField('dobra_coxa'),

        // Legacy compatibility
        braco_d: parseField('braco_contraido_d'),
        braco_e: parseField('braco_contraido_e'),
        perna_d: parseField('coxa_medial_d'),
        perna_e: parseField('coxa_medial_e'),

        fotos: fotos.length > 0 ? fotos : undefined,
        foto_frente: fotoFrente,
        foto_lado: fotoLado,
        foto_costas: fotoCostas
      };

      await db.biometria.add(nova);
      toast.success('Medição salva com sucesso!');
      setFormType(null);
      resetForm();
    } catch (error) {
      console.error(error);
      toast.error('Erro ao salvar medição.');
    }
  };

  const resetForm = () => {
    setFormData({});
    setFotos([]);
    setFotoFrente(undefined);
    setFotoLado(undefined);
    setFotoCostas(undefined);
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

  const getConfig = (chave: string) => configuracoes.find(c => c.chave === chave)?.valor;
  const currentGoal = getConfig(`meta_${selectedMetric}`) as number | undefined;

  const calculateProgress = (start: number, current: number, goal: number) => {
    if (start === goal) return 100;
    if (start > goal) {
      if (current <= goal) return 100;
      if (current >= start) return 0;
      return ((start - current) / (start - goal)) * 100;
    }
    if (start < goal) {
      if (current >= goal) return 100;
      if (current <= start) return 0;
      return ((current - start) / (goal - start)) * 100;
    }
    return 0;
  };

  const handleSaveGoal = async (e: React.FormEvent) => {
    e.preventDefault();
    const chave = `meta_${selectedMetric}`;
    const valorNum = parseFloat(goalValue);
    
    try {
      if (isNaN(valorNum)) {
        const existing = await db.configuracoes.where('chave').equals(chave).first();
        if (existing?.id) {
          await db.configuracoes.delete(existing.id);
        }
      } else {
        const existing = await db.configuracoes.where('chave').equals(chave).first();
        if (existing?.id) {
          await db.configuracoes.update(existing.id, { valor: valorNum });
        } else {
          await db.configuracoes.add({ chave, valor: valorNum });
        }
      }
      setGoalModalOpen(false);
      toast.success('Meta atualizada!');
    } catch(err) {
      toast.error('Erro ao salvar meta.');
    }
  };

  const ultimaMedicao = medicoes[medicoes.length - 1];

  // Configuração do carrossel do quadro resumo
  let carouselItems: { label: string, value: number, unit: string }[] = [];
  if (ultimaMedicao) {
    const possiveis = [
      { key: 'cintura', label: 'Cintura', unit: 'cm' },
      { key: 'abdomen', label: 'Abdômen', unit: 'cm' },
      { key: 'quadril', label: 'Quadril', unit: 'cm' },
      { key: 'braco_contraido_d', fallback: 'braco_d', label: 'Braço Dir.', unit: 'cm' },
      { key: 'coxa_medial_d', fallback: 'perna_d', label: 'Coxa Dir.', unit: 'cm' },
      { key: 'panturrilha_d', label: 'Panturrilha Dir.', unit: 'cm' },
      { key: 'torax', label: 'Tórax', unit: 'cm' },
      { key: 'ombros', label: 'Ombros', unit: 'cm' },
    ];
    
    possiveis.forEach(item => {
      const val = ultimaMedicao[item.key as keyof Biometria] || (item.fallback && ultimaMedicao[item.fallback as keyof Biometria]);
      if (val !== undefined) {
        carouselItems.push({ label: item.label, value: val as number, unit: item.unit });
      }
    });

    if (carouselItems.length === 0) {
      carouselItems.push({ label: 'Cintura', value: 0, unit: 'cm' }); // Fallback visual
    }
  }

  const prevCarousel = () => setCarouselIndex(prev => prev === 0 ? carouselItems.length - 1 : prev - 1);
  const nextCarousel = () => setCarouselIndex(prev => prev === carouselItems.length - 1 ? 0 : prev + 1);

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Corpo</h1>
        <button aria-label="Nova Medição" 
          onClick={() => setShowActionSheet(true)}
          className="bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      {/* Resumo atual */}
      {ultimaMedicao && (
        <div className="grid grid-cols-2 gap-4">
          <button aria-label="Ver gráfico de Peso" 
            onClick={() => setSelectedMetric('peso')}
            className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center gap-3 ${selectedMetric === 'peso' ? 'bg-primary/5 border-primary' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
          >
            <div className={`p-2 rounded-lg ${selectedMetric === 'peso' ? 'bg-primary text-white' : 'bg-primary/10 text-primary'}`}>
              <Scale size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400">Peso</p>
              <p className="text-xl font-bold leading-tight">{ultimaMedicao.peso}<span className="text-xs ml-0.5">kg</span></p>
            </div>
          </button>
          
          <button aria-label="Ver gráfico de Gordura" 
            onClick={() => setSelectedMetric('percentual_gordura')}
            className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center gap-3 ${selectedMetric === 'percentual_gordura' ? 'bg-orange-500/5 border-orange-500' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
          >
            <div className={`p-2 rounded-lg ${selectedMetric === 'percentual_gordura' ? 'bg-orange-500 text-white' : 'bg-orange-500/10 text-orange-500'}`}>
              <Droplets size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400">% Gordura</p>
              <p className="text-xl font-bold leading-tight">{ultimaMedicao.percentual_gordura || '--'}<span className="text-xs ml-0.5">%</span></p>
            </div>
          </button>
          
          <button aria-label="Ver gráfico de Massa Muscular" 
            onClick={() => setSelectedMetric('massa_muscular')}
            className={`p-4 rounded-2xl shadow-sm border transition-all text-left flex items-center gap-3 ${selectedMetric === 'massa_muscular' ? 'bg-red-500/5 border-red-500' : 'bg-white dark:bg-gray-800 border-gray-100 dark:border-gray-700'}`}
          >
            <div className={`p-2 rounded-lg ${selectedMetric === 'massa_muscular' ? 'bg-red-500 text-white' : 'bg-red-500/10 text-red-500'}`}>
              <Activity size={24} />
            </div>
            <div>
              <p className="text-xs uppercase font-bold text-gray-600 dark:text-gray-400">Massa Musc.</p>
              <p className="text-xl font-bold leading-tight">{ultimaMedicao.massa_muscular || '--'}<span className="text-xs ml-0.5">kg</span></p>
            </div>
          </button>
          
          <div className="bg-white dark:bg-gray-800 p-2 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between relative overflow-hidden group">
            <button aria-label="Medida Anterior" onClick={prevCarousel} className="p-2 text-gray-400 hover:text-blue-500 z-10"><ChevronLeft size={20}/></button>
            <div className="flex flex-col items-center justify-center flex-1">
              <div className="text-blue-500/50 absolute top-2 right-2"><Ruler size={32} /></div>
              <p className="text-[10px] uppercase font-bold text-gray-600 dark:text-gray-400 text-center w-full truncate">
                {carouselItems[carouselIndex]?.label || 'Medidas'}
              </p>
              <p className="text-xl font-bold leading-tight z-10">
                {carouselItems[carouselIndex]?.value > 0 ? carouselItems[carouselIndex].value : '--'}
                <span className="text-xs ml-0.5">{carouselItems[carouselIndex]?.unit}</span>
              </p>
            </div>
            <button aria-label="Próxima Medida" onClick={nextCarousel} className="p-2 text-gray-400 hover:text-blue-500 z-10"><ChevronRight size={20}/></button>
          </div>
        </div>
      )}

      {/* Gráfico de Evolução */}
      <div className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700">
        <div className="flex justify-between items-center mb-6">
          <h3 className="font-bold text-lg">Evolução: {metricConfig[selectedMetric].label}</h3>
          <button 
            onClick={() => { setGoalValue(currentGoal?.toString() || ''); setGoalModalOpen(true); }}
            className="flex items-center gap-1.5 text-xs font-bold bg-green-500/10 text-green-600 dark:text-green-500 px-3 py-1.5 rounded-full hover:bg-green-500/20 transition-colors"
          >
            <Target size={14} />
            {currentGoal ? `Meta: ${currentGoal}${metricConfig[selectedMetric].unit}` : 'Definir Meta'}
          </button>
        </div>

        {currentGoal && chartData.length > 0 && ultimaMedicao && (
          <div className="mb-6 bg-gray-50 dark:bg-gray-900 rounded-xl p-4 border border-gray-100 dark:border-gray-800">
            <div className="flex justify-between text-xs font-bold mb-2">
              <span className="text-gray-500 flex flex-col items-start"><span className="text-[9px] uppercase tracking-wider">Início</span> {chartData[0].valor}{metricConfig[selectedMetric].unit}</span>
              <span className="text-primary flex flex-col items-center"><span className="text-[9px] uppercase tracking-wider">Atual</span> {ultimaMedicao[selectedMetric]}{metricConfig[selectedMetric].unit}</span>
              <span className="text-green-500 flex flex-col items-end"><span className="text-[9px] uppercase tracking-wider">Alvo</span> {currentGoal}{metricConfig[selectedMetric].unit}</span>
            </div>
            <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-3 overflow-hidden">
              <div className="bg-gradient-to-r from-primary to-green-500 h-3 rounded-full transition-all duration-1000 shadow-[inset_0_-2px_4px_rgba(0,0,0,0.1)]" style={{ width: `${calculateProgress(chartData[0].valor as number, ultimaMedicao[selectedMetric] as number, currentGoal)}%` }}></div>
            </div>
            <p className="text-[10px] text-center mt-2 text-gray-500 font-bold uppercase tracking-widest">{calculateProgress(chartData[0].valor as number, ultimaMedicao[selectedMetric] as number, currentGoal).toFixed(1)}% Concluído</p>
          </div>
        )}

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
                {currentGoal && (
                  <ReferenceLine 
                    y={currentGoal} 
                    stroke="#10b981" 
                    strokeDasharray="4 4" 
                    strokeWidth={2}
                    label={{ position: 'insideTopLeft', value: `Meta: ${currentGoal}${metricConfig[selectedMetric].unit}`, fill: '#10b981', fontSize: 10, fontWeight: 'bold' }} 
                  />
                )}
              </LineChart>
            </ResponsiveContainer>
          </div>
        ) : (
          <div className="py-10 text-center text-gray-600 dark:text-gray-400 italic text-sm">
            Adicione pelo menos duas medições com {metricConfig[selectedMetric].label.toLowerCase()} para ver o gráfico.
          </div>
        )}
      </div>

      {/* Histórico de Medições */}
      <div className="space-y-4">
        <div className="flex items-center justify-between px-1">
          <h3 className="font-bold text-lg">Histórico e Fotos</h3>
          {medicoes.filter(m => m.fotos && m.fotos.length > 0).length >= 2 && (
            <button 
              onClick={() => setIsComparing(true)}
              className="flex items-center gap-1.5 text-xs font-bold bg-primary/10 text-primary px-3 py-1.5 rounded-full hover:bg-primary/20 transition-colors"
            >
              <SlidersHorizontal size={14} /> COMPARAR
            </button>
          )}
        </div>
        {medicoes.slice().reverse().map(m => (
          <div key={m.id} className="bg-white dark:bg-gray-800 p-4 rounded-xl shadow-sm border border-gray-100 dark:border-gray-700 flex flex-col gap-3">
            <div className="flex justify-between items-start">
              <div className="flex-1">
                <div className="flex items-baseline gap-2">
                  <p className="font-bold text-lg">
                    {m.peso ? `${m.peso} kg` : 
                     (m.cintura || m.torax || m.braco_relaxado_d || m.coxa_medial_d || m.perna_d) ? 'Perimetria' :
                     (m.dobra_peitoral || m.dobra_abdominal) ? 'Dobras Cutâneas' :
                     (m.fotos?.length || m.foto_frente || m.foto_lado || m.foto_costas) ? 'Fotos de Progresso' : 'Registro corporal'}
                  </p>
                  {m.percentual_gordura && <span className="text-xs text-orange-500 font-bold bg-orange-500/10 px-2 py-0.5 rounded border border-orange-500/20">{m.percentual_gordura}% BF</span>}
                </div>
                <p className="text-xs text-gray-600 dark:text-gray-400 font-medium">{format(new Date(m.data), 'PPP', { locale: ptBR })}</p>
              </div>
              <button aria-label="Excluir" onClick={() => m.id && handleDelete(m.id)} className="p-2 text-gray-300 hover:text-red-500 transition-colors">
                <Trash2 size={18} />
              </button>
            </div>
            
            <div className="flex flex-wrap gap-2 text-xs text-gray-700 dark:text-gray-300">
              {m.massa_muscular && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Músculo: <strong className="text-gray-700 dark:text-gray-300">{m.massa_muscular}kg</strong></span>}
              {m.cintura && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Cintura: <strong className="text-gray-700 dark:text-gray-300">{m.cintura}cm</strong></span>}
              {(m.braco_contraido_d || m.braco_d) && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Braço D.: <strong className="text-gray-700 dark:text-gray-300">{m.braco_contraido_d || m.braco_d}cm</strong></span>}
              {(m.coxa_medial_d || m.perna_d) && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Coxa D.: <strong className="text-gray-700 dark:text-gray-300">{m.coxa_medial_d || m.perna_d}cm</strong></span>}
              {m.panturrilha_d && <span className="bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded">Panturrilha D.: <strong className="text-gray-700 dark:text-gray-300">{m.panturrilha_d}cm</strong></span>}
            </div>

            {/* Exibe todas as fotos de forma unificada no histórico */}
            {((m.fotos && m.fotos.length > 0) || m.foto_frente || m.foto_lado || m.foto_costas) && (
              <div className="flex gap-2 overflow-x-auto pt-2 pb-1 scrollbar-hide">
                {[m.foto_frente, m.foto_lado, m.foto_costas, ...(m.fotos || [])].filter(Boolean).map((foto, idx) => (
                  <img 
                    key={idx}
                    src={foto!} 
                    alt={`Progresso ${idx+1}`} 
                    onClick={() => setFullScreenImage(foto!)}
                    className="h-20 w-20 object-cover rounded-xl shadow-sm border border-gray-200 dark:border-gray-700 cursor-pointer hover:opacity-80 transition-opacity shrink-0"
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
          <button aria-label="Fechar Imagem" className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full"><X size={24}/></button>
          <img src={fullScreenImage} className="max-w-full max-h-[90vh] object-contain rounded-lg" alt="Progresso Fullscreen" />
        </div>
      )}

      {/* Modal de Comparação de Fotos */}
      {isComparing && (
        <PhotoComparison medicoes={medicoes} onClose={() => setIsComparing(false)} />
      )}

      {/* Action Sheet para escolher o tipo de medição */}
      {showActionSheet && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end animate-in fade-in duration-200" onClick={() => setShowActionSheet(false)}>
          <div className="bg-white dark:bg-gray-800 w-full sm:max-w-2xl sm:mx-auto sm:rounded-t-3xl rounded-t-3xl shadow-2xl overflow-hidden p-6 animate-in slide-in-from-bottom duration-300" onClick={e => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4 text-center">O que você deseja registrar?</h3>
            <div className="grid grid-cols-2 gap-4">
              <button onClick={() => { setShowActionSheet(false); setFormType('peso'); }} className="flex flex-col items-center gap-3 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95">
                <Scale size={32} />
                <span className="font-bold text-sm">Peso</span>
              </button>
              <button onClick={() => { setShowActionSheet(false); setFormType('perimetria'); }} className="flex flex-col items-center gap-3 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95">
                <Ruler size={32} />
                <span className="font-bold text-sm">Perimetria</span>
              </button>
              <button onClick={() => { setShowActionSheet(false); setFormType('dobras'); }} className="flex flex-col items-center gap-3 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95">
                <Activity size={32} />
                <span className="font-bold text-sm">Dobras Cutâneas</span>
              </button>
              <button onClick={() => { setShowActionSheet(false); setFormType('fotos'); }} className="flex flex-col items-center gap-3 p-5 bg-gray-50 dark:bg-gray-700/50 rounded-2xl border-2 border-transparent hover:border-primary/20 hover:bg-primary/5 hover:text-primary transition-all active:scale-95">
                <Camera size={32} />
                <span className="font-bold text-sm">Fotos de Progresso</span>
              </button>
            </div>
            <button onClick={() => setShowActionSheet(false)} className="w-full mt-6 py-4 font-bold text-gray-500 hover:text-gray-800 dark:hover:text-gray-200">Cancelar</button>
          </div>
        </div>
      )}

      {/* Modal de Formulário Específico (Bottom Sheet Full Width) */}
      {formType && (
        <div className="fixed inset-0 bg-black/60 z-[100] flex flex-col justify-end animate-in fade-in duration-200">
          <div className="bg-white dark:bg-gray-800 w-full h-[95vh] sm:h-[90vh] sm:max-w-2xl sm:mx-auto sm:rounded-t-3xl rounded-t-3xl flex flex-col animate-in slide-in-from-bottom duration-300 shadow-2xl overflow-hidden">
            
            {/* Header Fixo */}
            <div className="flex justify-between items-center p-5 border-b border-gray-100 dark:border-gray-700 shrink-0 bg-white dark:bg-gray-800 z-10">
              <h2 className="text-xl font-bold">
                {formType === 'peso' && 'Registrar Peso'}
                {formType === 'perimetria' && 'Registrar Perimetria'}
                {formType === 'dobras' && 'Registrar Dobras Cutâneas'}
                {formType === 'fotos' && 'Registrar Fotos'}
              </h2>
              <button aria-label="Fechar Formulário" onClick={() => setFormType(null)} className="p-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 rounded-full transition-colors"><X size={20}/></button>
            </div>
            
            {/* Corpo Rolável */}
            <div className="flex-1 overflow-y-auto p-5 pb-32">
              <form id="biometria-form" onSubmit={handleSubmit} className="space-y-6">
              
              {/* FORMULÁRIO: PESO */}
              {formType === 'peso' && (
                <div className="space-y-4">
                  <div>
                    <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-1">Peso (kg) *</label>
                    <input required autoFocus type="number" step="0.1" value={formData.peso || ''} onChange={e => updateForm('peso', e.target.value)} className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-2xl text-center" placeholder="Ex: 80.5" />
                  </div>
                </div>
              )}

              {/* FORMULÁRIO: PERIMETRIA */}
              {formType === 'perimetria' && (
                <div className="space-y-4">
                <p className="text-xs text-gray-500 mb-2 border-b pb-2 dark:border-gray-700"><Layers size={14} className="inline mr-1" />Tronco (cm)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Cintura</label>
                    <input type="number" step="0.1" value={formData.cintura || ''} onChange={e => updateForm('cintura', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Abdômen</label>
                    <input type="number" step="0.1" value={formData.abdomen || ''} onChange={e => updateForm('abdomen', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Quadril</label>
                    <input type="number" step="0.1" value={formData.quadril || ''} onChange={e => updateForm('quadril', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Tórax</label>
                    <input type="number" step="0.1" value={formData.torax || ''} onChange={e => updateForm('torax', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Ombros</label>
                    <input type="number" step="0.1" value={formData.ombros || ''} onChange={e => updateForm('ombros', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Pescoço</label>
                    <input type="number" step="0.1" value={formData.pescoco || ''} onChange={e => updateForm('pescoco', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                </div>
                
                <p className="text-xs text-gray-500 mb-2 mt-4 border-b pb-2 dark:border-gray-700"><Layers size={14} className="inline mr-1" />Membros Superiores (Lado Direito)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Braço (Contr.)</label>
                    <input type="number" step="0.1" value={formData.braco_contraido_d || ''} onChange={e => updateForm('braco_contraido_d', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Braço (Relax.)</label>
                    <input type="number" step="0.1" value={formData.braco_relaxado_d || ''} onChange={e => updateForm('braco_relaxado_d', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Antebraço</label>
                    <input type="number" step="0.1" value={formData.antebraco_d || ''} onChange={e => updateForm('antebraco_d', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                </div>

                <p className="text-xs text-gray-500 mb-2 mt-4 border-b pb-2 dark:border-gray-700"><Layers size={14} className="inline mr-1" />Membros Inferiores (Lado Direito)</p>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Coxa Proximal</label>
                    <input type="number" step="0.1" value={formData.coxa_proximal_d || ''} onChange={e => updateForm('coxa_proximal_d', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Coxa Medial</label>
                    <input type="number" step="0.1" value={formData.coxa_medial_d || ''} onChange={e => updateForm('coxa_medial_d', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                  <div>
                    <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">Panturrilha</label>
                    <input type="number" step="0.1" value={formData.panturrilha_d || ''} onChange={e => updateForm('panturrilha_d', e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all text-sm font-bold" />
                  </div>
                </div>
              </div>
              )}

              {/* FORMULÁRIO: DOBRAS CUTÂNEAS */}
              {formType === 'dobras' && (
                <div className="space-y-4">
                <p className="text-xs text-gray-500 mb-2 border-b pb-2 dark:border-gray-700"><Activity size={14} className="inline mr-1" />Dobras em Milímetros (mm)</p>
                <div className="grid grid-cols-2 gap-4">
                  {[
                    { key: 'dobra_peitoral', label: 'Peitoral' },
                    { key: 'dobra_tricipital', label: 'Tricipital' },
                    { key: 'dobra_subescapular', label: 'Subescapular' },
                    { key: 'dobra_axilar', label: 'Axilar Média' },
                    { key: 'dobra_suprailiaca', label: 'Suprailíaca' },
                    { key: 'dobra_abdominal', label: 'Abdominal' },
                    { key: 'dobra_coxa', label: 'Coxa' },
                  ].map(dobra => (
                    <div key={dobra.key}>
                      <label className="block text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase mb-1">{dobra.label}</label>
                      <input type="number" step="0.1" value={formData[dobra.key] || ''} onChange={e => updateForm(dobra.key, e.target.value)} className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-orange-500 outline-none transition-all text-sm font-bold" />
                    </div>
                  ))}
                </div>
              </div>
              )}

              {/* FORMULÁRIO: FOTOS */}
              {formType === 'fotos' && (
                <div>
                <p className="text-xs text-gray-500 mb-4 border-b pb-2 dark:border-gray-700">Adicione fotos padronizadas para facilitar a comparação visual da sua evolução.</p>
                
                <div className="grid grid-cols-3 gap-3 mb-6">
                  {/* Frente */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-full text-center truncate">Frente</span>
                    {fotoFrente ? (
                      <div className="relative w-full aspect-[3/4]">
                        <img src={fotoFrente} alt="Frente" className="w-full h-full object-cover rounded-xl border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFullScreenImage(fotoFrente)}/>
                        <button type="button" onClick={() => setFotoFrente(undefined)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={14}/></button>
                      </div>
                    ) : (
                      <label className="w-full aspect-[3/4] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900 group">
                        <Camera size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase text-center px-1">Adicionar</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleSpecificPhotoUpload(e, 'frente')} />
                      </label>
                    )}
                  </div>
                  
                  {/* Lado */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-full text-center truncate">Lado</span>
                    {fotoLado ? (
                      <div className="relative w-full aspect-[3/4]">
                        <img src={fotoLado} alt="Lado" className="w-full h-full object-cover rounded-xl border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFullScreenImage(fotoLado)}/>
                        <button type="button" onClick={() => setFotoLado(undefined)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={14}/></button>
                      </div>
                    ) : (
                      <label className="w-full aspect-[3/4] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900 group">
                        <Camera size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase text-center px-1">Adicionar</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleSpecificPhotoUpload(e, 'lado')} />
                      </label>
                    )}
                  </div>

                  {/* Costas */}
                  <div className="flex flex-col items-center gap-2">
                    <span className="text-[10px] font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest bg-gray-100 dark:bg-gray-700 px-2 py-1 rounded w-full text-center truncate">Costas</span>
                    {fotoCostas ? (
                      <div className="relative w-full aspect-[3/4]">
                        <img src={fotoCostas} alt="Costas" className="w-full h-full object-cover rounded-xl border-2 border-primary cursor-pointer hover:opacity-80 transition-opacity" onClick={() => setFullScreenImage(fotoCostas)}/>
                        <button type="button" onClick={() => setFotoCostas(undefined)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md hover:scale-110 transition-transform"><X size={14}/></button>
                      </div>
                    ) : (
                      <label className="w-full aspect-[3/4] flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900 group">
                        <Camera size={24} className="mb-2 group-hover:scale-110 transition-transform" />
                        <span className="text-[10px] font-bold uppercase text-center px-1">Adicionar</span>
                        <input type="file" accept="image/*" className="hidden" onChange={e => handleSpecificPhotoUpload(e, 'costas')} />
                      </label>
                    )}
                  </div>
                </div>

                <div className="border-t border-gray-200 dark:border-gray-800 pt-4">
                  <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-3">Outras Fotos (Opcional)</label>
                  <div className="flex flex-wrap gap-2">
                    {fotos.map((foto, idx) => (
                      <div key={idx} className="relative">
                        <img src={foto} alt={`Preview ${idx}`} className="w-16 h-16 object-cover rounded-xl border border-gray-200 dark:border-gray-700 cursor-pointer" onClick={() => setFullScreenImage(foto)}/>
                        <button aria-label="Remover Foto" type="button" onClick={() => removePhoto(idx)} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-md">
                          <X size={12} />
                        </button>
                      </div>
                    ))}
                    <label className="w-16 h-16 flex flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-300 dark:border-gray-600 text-gray-600 dark:text-gray-400 hover:border-primary hover:text-primary transition-colors cursor-pointer bg-gray-50 dark:bg-gray-900">
                      <Plus size={20} />
                      <input type="file" accept="image/*" multiple className="hidden" onChange={handlePhotoUpload} />
                    </label>
                  </div>
                </div>
              </div>
              )}

            </form>
            </div> {/* Fim do Corpo Rolável */}
            
            {/* Botão Fixo no Rodapé */}
            <div className="absolute bottom-0 left-0 right-0 p-5 bg-white dark:bg-gray-800 border-t border-gray-100 dark:border-gray-700 shadow-[0_-4px_20px_rgba(0,0,0,0.05)] pb-safe">
              <button form="biometria-form" type="submit" className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all active:scale-95">
                <Save size={20} />
                SALVAR MEDIÇÕES
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Modal de Definir Meta */}
      {goalModalOpen && (
        <div className="fixed inset-0 bg-black/60 z-[110] flex items-center justify-center p-4 animate-in fade-in duration-200" onClick={() => setGoalModalOpen(false)}>
          <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl p-6 shadow-2xl animate-in zoom-in-95 duration-200" onClick={e => e.stopPropagation()}>
            <div className="flex items-center gap-3 mb-6">
              <div className="bg-green-500/10 text-green-500 p-3 rounded-xl">
                <Target size={24} />
              </div>
              <div>
                <h3 className="font-bold text-lg leading-tight">Definir Meta</h3>
                <p className="text-xs text-gray-500 font-medium">{metricConfig[selectedMetric].label}</p>
              </div>
            </div>
            
            <form onSubmit={handleSaveGoal} className="space-y-4">
              <div>
                <label className="block text-xs font-bold text-gray-600 dark:text-gray-400 uppercase tracking-widest mb-2">Alvo Desejado ({metricConfig[selectedMetric].unit})</label>
                <input 
                  type="number" 
                  step="0.1" 
                  autoFocus
                  value={goalValue} 
                  onChange={e => setGoalValue(e.target.value)} 
                  className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-green-500 outline-none transition-all font-bold text-2xl text-center" 
                  placeholder="Ex: 75" 
                />
                <p className="text-[10px] text-gray-500 mt-2 text-center">Deixe em branco para remover a meta.</p>
              </div>
              <div className="flex gap-3 pt-2">
                <button type="button" onClick={() => setGoalModalOpen(false)} className="flex-1 py-3 font-bold text-gray-500 bg-gray-100 dark:bg-gray-700 rounded-xl hover:bg-gray-200 dark:hover:bg-gray-600 transition-colors">Cancelar</button>
                <button type="submit" className="flex-1 py-3 font-bold text-white bg-green-500 rounded-xl shadow-lg shadow-green-500/20 hover:bg-green-600 transition-colors">Salvar Meta</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default Biometrics;
