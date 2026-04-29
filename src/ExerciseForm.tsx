import React, { useState } from 'react';
import { db, type Exercicio } from './db';
import { X, Save, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';
import toast from 'react-hot-toast';

interface ExerciseFormProps {
  exerciseToEdit?: Exercicio;
  onClose: () => void;
}

const CATEGORIES = ['Peito', 'Costas', 'Pernas', 'Ombros', 'Braços', 'Core', 'Cardio'];
const TYPES = [
  { value: 'carga', label: 'Carga / Repetições' },
  { value: 'tempo', label: 'Tempo / Distância' }
];
const MOBILITY_TAGS = ['Sentado', 'Sem impacto', 'Fisioterapia', 'Mobilidade'];

const ExerciseForm: React.FC<ExerciseFormProps> = ({ exerciseToEdit, onClose }) => {
  const [nome, setNome] = useState(() => exerciseToEdit?.nome ?? '');
  const [categoria, setCategoria] = useState(() => exerciseToEdit?.categoria ?? 'Peito');
  const [tipo, setTipo] = useState<'carga' | 'tempo'>(() => exerciseToEdit?.tipo ?? 'carga');
  const [selectedTags, setSelectedTags] = useState<string[]>(() => exerciseToEdit?.tags ?? []);
  const [notas, setNotas] = useState(() => exerciseToEdit?.notas_padrao ?? '');
  const [ajuda, setAjuda] = useState(() => exerciseToEdit?.ajuda ?? '');
  const [videoUrl, setVideoUrl] = useState(() => exerciseToEdit?.video_url ?? '');
  const [sub1, setSub1] = useState<number | undefined>(() => exerciseToEdit?.substituicao1_id);
  const [sub2, setSub2] = useState<number | undefined>(() => exerciseToEdit?.substituicao2_id);

  const todosExercicios = useLiveQuery(() => db.exercicios.toArray()) || [];

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      const data: Exercicio = {
        nome,
        categoria,
        tipo,
        tags: selectedTags,
        notas_padrao: notas,
        ajuda,
        video_url: videoUrl,
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
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1 text-gray-400">NOME</label>
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
              <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">Categoria</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none font-bold text-base"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">Registro</label>
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
            <label className="text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-widest flex items-center gap-2">
              <RefreshCw size={12} className="text-primary" /> Substituições Sugeridas
            </label>
            <div className="grid grid-cols-2 gap-3">
              <select
                value={sub1 || ''}
                onChange={e => setSub1(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 text-xs font-bold"
              >
                <option value="">Nenhuma 1...</option>
                {todosExercicios.filter(ex => ex.id !== exerciseToEdit?.id).map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.nome}</option>
                ))}
              </select>
              <select
                value={sub2 || ''}
                onChange={e => setSub2(e.target.value ? Number(e.target.value) : undefined)}
                className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 text-xs font-bold"
              >
                <option value="">Nenhuma 2...</option>
                {todosExercicios.filter(ex => ex.id !== exerciseToEdit?.id && ex.id !== sub1).map(ex => (
                  <option key={ex.id} value={ex.id}>{ex.nome}</option>
                ))}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-widest">Tags Rápidas</label>
            <div className="flex flex-wrap gap-2">
              {MOBILITY_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1.5 rounded-xl border-2 text-xs font-black transition-all ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-white border-primary shadow-lg shadow-primary/20'
                      : 'border-gray-100 dark:border-gray-700 text-gray-400'
                  }`}
                >
                  {tag.toUpperCase()}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">Notas Padrão (Privadas)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none h-20 resize-none font-medium text-base"
              placeholder="Ex: Ajustar banco no nível 3"
            />
          </div>

          <div className="space-y-4 pt-4 border-t dark:border-gray-700">
            <h3 className="text-xs font-black text-primary uppercase tracking-widest">Ajuda e Vídeo (Público no Compartilhamento)</h3>
            
            <div>
              <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">Instruções de Execução</label>
              <textarea
                value={ajuda}
                onChange={e => setAjuda(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none h-24 resize-none font-medium text-base"
                placeholder="Como realizar o exercício corretamente..."
              />
            </div>

            <div>
              <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">URL do Vídeo (YouTube)</label>
              <input
                type="url"
                value={videoUrl}
                onChange={e => setVideoUrl(e.target.value)}
                className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none font-bold text-base"
                placeholder="https://www.youtube.com/watch?v=..."
              />
            </div>
          </div>

          <button
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
