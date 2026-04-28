import React, { useState, useEffect } from 'react';
import { db, type Exercicio } from './db';
import { X, Save } from 'lucide-react';

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

  useEffect(() => {
    if (exerciseToEdit) {
      setNome(exerciseToEdit.nome);
      setCategoria(exerciseToEdit.categoria);
      setTipo(exerciseToEdit.tipo);
      setSelectedTags(exerciseToEdit.tags);
      setNotas(exerciseToEdit.notas_padrao || '');
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
      notas_padrao: notas
    };

    if (exerciseToEdit?.id) {
      await db.exercicios.update(exerciseToEdit.id, data);
    } else {
      await db.exercicios.add(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg rounded-t-2xl sm:rounded-2xl p-6 shadow-xl animate-in slide-in-from-bottom duration-300">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-bold">{exerciseToEdit ? 'Editar Exercício' : 'Novo Exercício'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium mb-1">Nome</label>
            <input
              required
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Ex: Supino Reto"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1">Categoria</label>
              <select
                value={categoria}
                onChange={e => setCategoria(e.target.value)}
                className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none"
              >
                {CATEGORIES.map(c => <option key={c} value={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1">Tipo de Registro</label>
              <select
                value={tipo}
                onChange={e => setTipo(e.target.value as 'carga' | 'tempo')}
                className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none"
              >
                {TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-2">Tags de Mobilidade/Apoio</label>
            <div className="flex flex-wrap gap-2">
              {MOBILITY_TAGS.map(tag => (
                <button
                  key={tag}
                  type="button"
                  onClick={() => toggleTag(tag)}
                  className={`px-3 py-1 rounded-full border text-sm transition-colors ${
                    selectedTags.includes(tag)
                      ? 'bg-primary text-white border-primary'
                      : 'border-gray-300 dark:border-gray-600 hover:border-primary'
                  }`}
                >
                  {tag}
                </button>
              ))}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium mb-1">Notas Padrão (Opcional)</label>
            <textarea
              value={notas}
              onChange={e => setNotas(e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none h-24 resize-none"
              placeholder="Ex: Ajustar banco no nível 3"
            />
          </div>

          <button
            type="submit"
            className="w-full bg-primary text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all mt-6"
          >
            <Save size={20} />
            Salvar Exercício
          </button>
        </form>
      </div>
    </div>
  );
};

export default ExerciseForm;
