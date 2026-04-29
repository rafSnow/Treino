import React, { useState, useEffect } from 'react';
import { db, type Exercicio, type Rotina, type ExercicioNoTreino } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Save, Plus, ChevronUp, ChevronDown, Trash2, Search } from 'lucide-react';
import toast from 'react-hot-toast';

interface RoutineFormProps {
  routineToEdit?: Rotina;
  onClose: () => void;
}

const RoutineForm: React.FC<RoutineFormProps> = ({ routineToEdit, onClose }) => {
  const [nome, setNome] = useState('');
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<ExercicioNoTreino[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);
  const [searchExercicio, setSearchExercicio] = useState('');

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
      series_aquecimento: 0,
      series_trabalho: 3,
      metas: ex.tipo === 'carga' ? { repeticoes: '10-12' } : { tempo: 60 }
    };
    setExerciciosSelecionados([...exerciciosSelecionados, novo]);
    setIsSelectorOpen(false);
    setSearchExercicio('');
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

    try {
      const data: Rotina = {
        nome,
        exercicios: exerciciosSelecionados
      };

      if (routineToEdit?.id) {
        const updateData: Partial<Rotina> = data;
        await db.rotinas.update(routineToEdit.id, updateData);
        toast.success('Rotina atualizada!');
      } else {
        await db.rotinas.add(data);
        toast.success('Rotina criada!');
      }
      onClose();
    } catch (error) {
      console.error('Falha ao salvar rotina:', error);
      toast.error('Erro ao salvar rotina.');
    }
  };

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[100]">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl overflow-hidden">
        <div className="p-6 border-b dark:border-gray-700 flex justify-between items-center bg-white dark:bg-gray-800 sticky top-0 z-10">
          <h2 className="text-xl font-bold">{routineToEdit ? 'Editar Rotina' : 'Nova Rotina'}</h2>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-[10px] font-bold mb-1 text-gray-400 uppercase tracking-widest">NOME DA FICHA</label>
            <input
              required
              type="text"
              value={nome}
              onChange={e => setNome(e.target.value)}
              className="w-full p-4 rounded-xl border-2 border-gray-100 dark:border-gray-700 dark:bg-gray-900 focus:border-primary outline-none transition-all font-black text-base"
              placeholder="Ex: Treino A - Empurrar"
            />
          </div>

          <div className="space-y-4">
            <div className="flex justify-between items-center px-1">
              <h3 className="font-black text-gray-500 uppercase tracking-tighter">EXERCÍCIOS ({exerciciosSelecionados.length})</h3>
              <button
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                <Plus size={14} /> ADICIONAR
              </button>
            </div>

            <div className="space-y-4">
              {exerciciosSelecionados.map((item, idx) => {
                const ex = todosExercicios.find(e => e.id === item.exercicio_id);
                return (
                  <div key={idx} className="bg-gray-50 dark:bg-gray-700/30 p-5 rounded-3xl border-2 border-transparent dark:border-gray-700/50">
                    <div className="flex justify-between items-start mb-4">
                      <div className="flex gap-3 items-center">
                        <span className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-[10px] font-black text-gray-500 dark:text-gray-300">
                          {idx + 1}
                        </span>
                        <h4 className="font-black text-base dark:text-gray-100">{ex?.nome}</h4>
                      </div>
                      <div className="flex gap-1 bg-white dark:bg-gray-800 p-1 rounded-xl shadow-sm border dark:border-gray-700">
                        <button type="button" onClick={() => moveExercicio(idx, 'up')} className="p-1.5 text-gray-400 hover:text-primary"><ChevronUp size={18}/></button>
                        <button type="button" onClick={() => moveExercicio(idx, 'down')} className="p-1.5 text-gray-400 hover:text-primary"><ChevronDown size={18}/></button>
                        <button type="button" onClick={() => removeExercicio(idx)} className="p-1.5 text-gray-400 hover:text-red-500 ml-1"><Trash2 size={18}/></button>
                      </div>
                    </div>

                    <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-orange-500 tracking-widest pl-1">Aquec.</label>
                        <input
                          type="number"
                          value={item.series_aquecimento}
                          onChange={e => updateMeta(idx, { series_aquecimento: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 outline-none text-center font-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-primary tracking-widest pl-1">Trabalho</label>
                        <input
                          type="number"
                          value={item.series_trabalho}
                          onChange={e => updateMeta(idx, { series_trabalho: parseInt(e.target.value) || 0 })}
                          className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-primary outline-none text-center font-black"
                        />
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-gray-400 tracking-widest pl-1">Meta</label>
                        {ex?.tipo === 'carga' ? (
                          <input
                            type="text"
                            value={item.metas.repeticoes || ''}
                            onChange={e => updateMeta(idx, { metas: { ...item.metas, repeticoes: e.target.value } })}
                            placeholder="Reps"
                            className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-gray-400 outline-none text-center font-black text-xs"
                          />
                        ) : (
                          <input
                            type="number"
                            value={item.metas.tempo || 0}
                            onChange={e => updateMeta(idx, { metas: { ...item.metas, tempo: parseInt(e.target.value) || 0 } })}
                            className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-gray-400 outline-none text-center font-black text-xs"
                          />
                        )}
                      </div>
                      <div className="space-y-1">
                        <label className="text-[9px] uppercase font-black text-blue-500 tracking-widest pl-1">Descanso</label>
                        <div className="relative">
                          <input
                            type="number"
                            value={item.tempo_descanso || 60}
                            onChange={e => updateMeta(idx, { tempo_descanso: parseInt(e.target.value) || 0 })}
                            className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 outline-none text-center font-black text-xs"
                          />
                          <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">seg</span>
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        </form>

        <div className="p-6 pb-10 sm:pb-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
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
        <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4">
          <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 max-h-[70vh] flex flex-col shadow-2xl">
            <div className="flex justify-between items-center mb-4">
              <h3 className="text-lg font-bold">Selecionar Exercício</h3>
              <button onClick={() => { setIsSelectorOpen(false); setSearchExercicio(''); }} className="p-1"><X size={20}/></button>
            </div>
            
            <div className="relative mb-3">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400" size={16} />
              <input
                type="text"
                placeholder="Buscar exercício..."
                value={searchExercicio}
                onChange={e => setSearchExercicio(e.target.value)}
                className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
                autoFocus
              />
            </div>

            <div className="flex-1 overflow-y-auto space-y-2">
              {todosExercicios
                .filter(ex => ex.nome.toLowerCase().includes(searchExercicio.toLowerCase()))
                .map(ex => (
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
