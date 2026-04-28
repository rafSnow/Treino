import React, { useState, useEffect } from 'react';
import { db, type Exercicio, type Rotina, type ExercicioNoTreino } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Save, Plus, ChevronUp, ChevronDown, Trash2 } from 'lucide-react';

interface RoutineFormProps {
  routineToEdit?: Rotina;
  onClose: () => void;
}

const RoutineForm: React.FC<RoutineFormProps> = ({ routineToEdit, onClose }) => {
  const [nome, setNome] = useState('');
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<ExercicioNoTreino[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const todosExercicios = useLiveQuery(() => db.exercicios.toArray()) || [];

  useEffect(() => {
    if (routineToEdit) {
      setNome(routineToEdit.nome);
      setExerciciosSelecionados(routineToEdit.exercicios);
    }
  }, [routineToEdit]);

  const addExercicio = (ex: Exercicio) => {
    if (!ex.id) return;
    const novo: ExercicioNoTreino = {
      exercicio_id: ex.id,
      series: 3,
      metas: ex.tipo === 'carga' ? { repeticoes: '10-12' } : { tempo: 60 }
    };
    setExerciciosSelecionados([...exerciciosSelecionados, novo]);
    setIsSelectorOpen(false);
  };

  const removeExercicio = (index: number) => {
    setExerciciosSelecionados(exerciciosSelecionados.filter((_, i) => i !== index));
  };

  const moveExercicio = (index: number, direction: 'up' | 'down') => {
    const newArr = [...exerciciosSelecionados];
    const target = direction === 'up' ? index - 1 : index + 1;
    if (target < 0 || target >= newArr.length) return;
    [newArr[index], newArr[target]] = [newArr[target], newArr[index]];
    setExerciciosSelecionados(newArr);
  };

  const updateMeta = (index: number, updates: Partial<ExercicioNoTreino>) => {
    const newArr = [...exerciciosSelecionados];
    newArr[index] = { ...newArr[index], ...updates };
    setExerciciosSelecionados(newArr);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || exerciciosSelecionados.length === 0) return;

    const data: Rotina = {
      nome,
      exercicios: exerciciosSelecionados
    };

    if (routineToEdit?.id) {
      const updateData: Partial<Rotina> = data;
      await db.rotinas.update(routineToEdit.id, updateData);
    } else {
      await db.rotinas.add(data);
    }
    onClose();
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky top-0 z-10">
          <h2 className="text-xl font-bold">{routineToEdit ? 'Editar Rotina' : 'Nova Rotina'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-sm font-medium mb-1">Nome da Rotina</label>
            <input
              required
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full p-3 rounded-lg border dark:bg-gray-700 dark:border-gray-600 focus:ring-2 focus:ring-primary outline-none"
              placeholder="Ex: Treino A - Peito e Tríceps"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center">
              <h3 className="font-bold">Exercícios ({exerciciosSelecionados.length})</h3>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="text-primary flex items-center gap-1 font-semibold text-sm"
              >
                <Plus size={16} /> Adicionar
              </button>
            </div>

            <div className="space-y-3">
              {exerciciosSelecionados.map((item, idx) => {
                const ex = todosExercicios.find(e => e.id === item.exercicio_id);
                return (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-700/50 p-4 rounded-xl border dark:border-gray-600">
                    <div className="flex justify-between items-start mb-3">
                      <div>
                        <span className="text-xs text-gray-500 block">#{idx + 1}</span>
                        <h4 className="font-bold">{ex?.nome || 'Exercício não encontrado'}</h4>
                      </div>
                      <div className="flex gap-1">
                        <button type="button" onClick={() => moveExercicio(idx, 'up')} className="p-1 text-gray-400 hover:text-primary"><ChevronUp size={20}/></button>
                        <button type="button" onClick={() => moveExercicio(idx, 'down')} className="p-1 text-gray-400 hover:text-primary"><ChevronDown size={20}/></button>
                        <button type="button" onClick={() => removeExercicio(idx)} className="p-1 text-gray-400 hover:text-red-500 ml-2"><Trash2 size={20}/></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 gap-3">
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">Séries</label>
                        <input
                          type="number"
                          value={item.series}
                          onChange={e => updateMeta(idx, { series: parseInt(e.target.value) || 0 })}
                          className="w-full p-2 rounded bg-white dark:bg-gray-800 border dark:border-gray-600 text-sm"
                        />
                      </div>
                      <div>
                        <label className="text-[10px] uppercase font-bold text-gray-500">
                          {ex?.tipo === 'carga' ? 'Repetições' : 'Segundos'}
                        </label>
                        {ex?.tipo === 'carga' ? (
                          <input
                            type="text"
                            value={item.metas.repeticoes || ''}
                            onChange={e => updateMeta(idx, { metas: { ...item.metas, repeticoes: e.target.value } })}
                            placeholder="Ex: 10-12"
                            className="w-full p-2 rounded bg-white dark:bg-gray-800 border dark:border-gray-600 text-sm"
                          />
                        ) : (
                          <input
                            type="number"
                            value={item.metas.tempo || 0}
                            onChange={e => updateMeta(idx, { metas: { ...item.metas, tempo: parseInt(e.target.value) || 0 } })}
                            className="w-full p-2 rounded bg-white dark:bg-gray-800 border dark:border-gray-600 text-sm"
                          />
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        <div className="p-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
          <button
            onClick={handleSubmit}
            disabled={!nome || exerciciosSelecionados.length === 0}
            className="w-full bg-primary disabled:opacity-50 text-white py-4 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all"
          >
            <Save size={20} />
            Salvar Rotina
          </button>
        </div>
      </div>

      {/* Exercise Selector Modal */}
      {isSelectorOpen && (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[60] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 max-h-[70vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Selecionar Exercício</h3>
              <button onClick={() => setIsSelectorOpen(false)} className="p-1"><X size={20}/></button>
            </div>
            <div className="flex-1 overflow-y-auto space-y-2">
              {todosExercicios.map(ex => (
                <button
                  key={ex.id}
                  onClick={() => addExercicio(ex)}
                  className="w-full text-left p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700 transition-colors"
                >
                  <div className="font-bold">{ex.nome}</div>
                  <div className="text-xs text-gray-500">{ex.categoria}</div>
                </button>
              ))}
              {todosExercicios.length === 0 && (
                <p className="text-center text-gray-500 py-8">Nenhum exercício cadastrado no catálogo.</p>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default RoutineForm;
