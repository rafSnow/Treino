import React, { useState, useEffect } from 'react';
import { db, type Exercicio } from './db';
import { X, Save, RefreshCw } from 'lucide-react';
import { useLiveQuery } from 'dexie-react-hooks';

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
  const [nome, setNome] = useState('');
  const [categoria, setCategoria] = useState('Peito');
  const [tipo, setTipo] = useState<'carga' | 'tempo'>('carga');
  const [selectedTags, setSelectedTags] = useState<string[]>([]);
  const [notas, setNotas] = useState('');
  const [sub1, setSub1] = useState<number | undefined>();
  const [sub2, setSub2] = useState<number | undefined>();

  const todosExercicios = useLiveQuery(() => db.exercicios.toArray()) || [];

  useEffect(() => {
    if (exerciseToEdit) {
      setNome(exerciseToEdit.nome);
      setCategoria(exerciseToEdit.categoria);
      setTipo(exerciseToEdit.tipo);
      setSelectedTags(exerciseToEdit.tags);
      setNotas(exerciseToEdit.notas_padrao || '');
      setSub1(exerciseToEdit.substituicao1_id);
      setSub2(exerciseToEdit.substituicao2_id);
    }
  }, [exerciseToEdit]);

  const toggleTag = (tag: string) => {
    setSelectedTags(prev => 
      prev.includes(tag) ? prev.filter(t => t !== tag) : [...prev, tag]
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const data: Exercicio = {
      nome,
      categoria,
      tipo,
      tags: selectedTags,
      notas_padrao: notas,
      substituicao1_id: sub1,
      substituicao2_id: sub2
    };

    if (exerciseToEdit?.id) {
      const updateData: Partial<Exercicio> = data;
      await db.exercicios.update(exerciseToEdit.id, updateData);
    } else {
      await db.exercicios.add(data);
    }
    onClose();
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
              className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-bold"
              placeholder="Ex: Supino Reto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">Categoria</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none font-bold"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">Registro</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as 'carga' | 'tempo')}
                className="w-full p-3 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none font-bold"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-[10px] font-bold mb-2 text-gray-400 uppercase tracking-widest flex items-center gap-2">
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
            <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">Notas Padrão</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none h-24 resize-none font-medium"
              placeholder="Ex: Ajustar banco no nível 3"
            />
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
