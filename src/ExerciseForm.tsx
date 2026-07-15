import React, { useState } from 'react';
import { db, type Exercicio } from './db';
import { X, Save, RefreshCw, Search } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from 'recharts';
import { format } from 'date-fns';

interface ExerciseFormProps {
  exerciseToEdit?: Exercicio;
  onClose: () => void;
}

const CATEGORIES = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio'];
const TYPES = [
  { value: 'carga', label: 'Carga / Repetições' },
  { value: 'tempo', label: 'Tempo / Distância' }
];

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exerciseToEdit, onClose }) => {
  const [nome, setNome] = useState(() => exerciseToEdit?.nome ?? '');
  const [categoria, setCategoria] = useState(() => exerciseToEdit?.categoria ?? 'Peito');
  const [tipo, setTipo] = useState<'carga' | 'tempo'>(() => exerciseToEdit?.tipo ?? 'carga');
  const [ajuda, setAjuda] = useState(() => exerciseToEdit?.ajuda ?? '');
  const [videoUrl, setVideoUrl] = useState(() => exerciseToEdit?.video_url ?? '');
  const [sub1, setSub1] = useState<number | undefined>(() => exerciseToEdit?.substituicao1_id);
  const [sub2, setSub2] = useState<number | undefined>(() => exerciseToEdit?.substituicao2_id);
  const [imagem, setImagem] = useState(() => exerciseToEdit?.imagem ?? '');

  const [searchSub1, setSearchSub1] = useState('');
  const [searchSub2, setSearchSub2] = useState('');
  const [focusedSub, setFocusedSub] = useState<1 | 2 | null>(null);

  const todosExercicios = useLiveQuery(() => db.exercicios.toArray()) || [];
  
  const prHistory = useLiveQuery(
    () => exerciseToEdit?.id ? db.personal_records.where('exercicio_id').equals(exerciseToEdit.id).sortBy('data') : Promise.resolve([]),
    [exerciseToEdit?.id]
  ) || [];

  const handleImageUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagem(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Exercicio = {
        nome,
        categoria,
        tipo,
        tags: exerciseToEdit?.tags ?? [],
        notas_padrao: exerciseToEdit?.notas_padrao ?? '',
        ajuda,
        video_url: videoUrl,
        imagem,
        substituicao1_id: sub1,
        substituicao2_id: sub2
      };

      if (exerciseToEdit?.id) {
        const updateData: Partial<Exercicio> = data;
        await db.exercicios.update(exerciseToEdit.id, updateData);
        toast.success('Exercício atualizado!');
      } else {
        await db.exercicios.add(data);
        toast.success('Exercício criado!');
      }
      onClose();
    } catch (error) {
      console.error('Falha ao salvar exercício:', error);
      toast.error('Erro ao salvar exercício.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 pb-10 sm:pb-6 shadow-xl animate-in slide-in-from-bottom duration-300 max-h-[90vh] overflow-y-auto">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{exerciseToEdit ? 'Editar Exercício' : 'Novo Exercício'}</h2>
          <button aria-label="Fechar" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-600 dark:text-gray-400">NOME</label>
            <input
              required
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold text-base"
              placeholder="Ex: Supino Reto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400 uppercase tracking-widest">Categoria</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none font-bold text-base"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400 uppercase tracking-widest">Registro</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as 'carga' | 'tempo')}
                className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none font-bold text-base"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="text-xs font-bold mb-2 text-gray-600 dark:text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <RefreshCw size={12} className="text-primary" /> Substituições Sugeridas
            </label>
            <div className="grid grid-cols-2 gap-3">
              <div className="relative">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                  <input
                    type="text"
                    value={searchSub1}
                    onChange={e => setSearchSub1(e.target.value)}
                    onFocus={() => setFocusedSub(1)}
                    onBlur={() => setTimeout(() => setFocusedSub(null), 200)}
                    placeholder="Buscar substituição..."
                    className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
                {focusedSub === 1 && searchSub1 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 z-10 shadow-xl">
                    {todosExercicios
                      .filter(ex => 
                        ex.id !== exerciseToEdit?.id && 
                        ex.id !== sub2 && 
                        ex.nome.toLowerCase().includes(searchSub1.toLowerCase())
                      )
                      .map(ex => (
                        <button aria-label="Botão" 
                          key={ex.id}
                          type="button"
                          onClick={() => {
                            setSub1(ex.id);
                            setSearchSub1('');
                            setFocusedSub(null);
                          }}
                          className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold border-b last:border-0 border-gray-100 dark:border-gray-700"
                        >
                          {ex.nome}
                        </button>
                      ))
                    }
                  </div>
                )}
                {sub1 && (
                  <div className="mt-2 flex">
                    <div className="bg-primary/10 text-primary text-xs font-black px-2 py-1 rounded-lg flex items-center gap-1 border border-primary/20">
                      <span className="truncate max-w-[100px]">{todosExercicios.find(ex => ex.id === sub1)?.nome}</span>
                      <button aria-label="Botão" type="button" onClick={() => { setSub1(undefined); setSearchSub1(''); }} className="hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>

              <div className="relative">
                <div className="relative group">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400 group-focus-within:text-primary transition-colors" size={14} />
                  <input
                    type="text"
                    value={searchSub2}
                    onChange={e => setSearchSub2(e.target.value)}
                    onFocus={() => setFocusedSub(2)}
                    onBlur={() => setTimeout(() => setFocusedSub(null), 200)}
                    placeholder="Buscar substituição..."
                    className="w-full pl-9 pr-4 py-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 text-xs font-bold outline-none focus:border-primary transition-all"
                  />
                </div>
                {focusedSub === 2 && searchSub2 && (
                  <div className="absolute top-full left-0 right-0 mt-1 max-h-40 overflow-y-auto border border-gray-100 dark:border-gray-700 rounded-xl bg-white dark:bg-gray-900 z-10 shadow-xl">
                    {todosExercicios
                      .filter(ex => 
                        ex.id !== exerciseToEdit?.id && 
                        ex.id !== sub1 && 
                        ex.nome.toLowerCase().includes(searchSub2.toLowerCase())
                      )
                      .map(ex => (
                        <button aria-label="Botão" 
                          key={ex.id}
                          type="button"
                          onClick={() => {
                            setSub2(ex.id);
                            setSearchSub2('');
                            setFocusedSub(null);
                          }}
                          className="w-full text-left p-3 hover:bg-gray-50 dark:hover:bg-gray-800 text-xs font-bold border-b last:border-0 border-gray-100 dark:border-gray-700"
                        >
                          {ex.nome}
                        </button>
                      ))
                    }
                  </div>
                )}
                {sub2 && (
                  <div className="mt-2 flex">
                    <div className="bg-primary/10 text-primary text-xs font-black px-2 py-1 rounded-lg flex items-center gap-1 border border-primary/20">
                      <span className="truncate max-w-[100px]">{todosExercicios.find(ex => ex.id === sub2)?.nome}</span>
                      <button aria-label="Botão" type="button" onClick={() => { setSub2(undefined); setSearchSub2(''); }} className="hover:text-red-500 transition-colors">
                        <X size={14} />
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>

          <div className="space-y-4 pt-4 border-t dark:border-gray-700">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest">Mídia e Instruções</h3>
            
            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400 uppercase tracking-widest">Imagem / GIF do Exercício</label>
              {imagem && (
                <div className="relative w-32 h-32 mb-3">
                  <img src={imagem} alt="Preview" className="w-full h-full object-cover rounded-xl border-2 border-primary/20" />
                  <button aria-label="Botão" type="button" onClick={() => setImagem('')} className="absolute -top-2 -right-2 bg-red-500 text-white rounded-full p-1 shadow-lg hover:scale-110 transition-transform">
                    <X size={14} />
                  </button>
                </div>
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleImageUpload}
                className="w-full text-sm text-gray-700 dark:text-gray-300 file:mr-4 file:py-2 file:px-4 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-primary/10 file:text-primary hover:file:bg-primary/20 transition-all cursor-pointer"
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400 uppercase tracking-widest">Instruções de Execução</label>
              <textarea
                value={ajuda}
                onChange={e => setAjuda(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none h-24 resize-none font-medium text-base"
                placeholder="Como realizar o exercício corretamente..."
              />
            </div>

            <div>
              <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400 uppercase tracking-widest">URL do Vídeo (YouTube)</label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none font-bold text-base"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>

          {exerciseToEdit && prHistory.length > 0 && (
            <div className="space-y-4 pt-4 border-t dark:border-gray-700">
              <h3 className="text-xs font-black text-primary uppercase tracking-widest flex items-center justify-between">
                <span>Evolução de Carga (PRs)</span>
                <span className="text-xs text-gray-600 dark:text-gray-400 bg-gray-100 dark:bg-gray-800 px-2 py-1 rounded-full">{prHistory.length} registros</span>
              </h3>
              <div className="h-48 w-full bg-white dark:bg-gray-900 rounded-xl p-2 border-2 border-gray-100 dark:border-gray-700">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={prHistory} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                    <XAxis 
                      dataKey="data" 
                      tickFormatter={(date) => format(new Date(date), 'dd/MM')} 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      minTickGap={20}
                    />
                    <YAxis 
                      stroke="#888888" 
                      fontSize={10} 
                      tickLine={false} 
                      axisLine={false} 
                      tickFormatter={(value) => `${value}`}
                    />
                    <Tooltip 
                      labelFormatter={(label) => format(new Date(label), 'dd/MM/yyyy')}
                      formatter={(value: number, _name: string, props: any) => [`${value}kg (${props.payload.repeticoes} reps)`, 'PR']}
                      contentStyle={{ borderRadius: '12px', border: 'none', boxShadow: '0 4px 6px -1px rgb(0 0 0 / 0.1)', background: '#1a1a1a', color: '#fff' }}
                    />
                    <Line type="monotone" dataKey="carga" stroke="#00C896" strokeWidth={3} dot={{ r: 4, fill: '#00C896', strokeWidth: 0 }} activeDot={{ r: 6 }} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          )}

          <button aria-label="Botão" 
            type="submit"
            className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all mt-6"
          >
            <Save size={20} />
            SALVAR EXERCÍCIO
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExerciseForm;
