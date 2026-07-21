import React, { useState, useEffect } from 'react';
import { db, type Exercicio, type Rotina, type ExercicioNoTreino } from './db';
import { useLiveQuery } from 'dexie-react-hooks';
import { X, Save, Plus, Trash2, GripVertical } from 'lucide-react';
import toast from 'react-hot-toast';
import ExerciseSelectorModal from './components/ExerciseSelectorModal';

import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
} from '@dnd-kit/core';
import type { DragEndEvent } from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  verticalListSortingStrategy,
  useSortable,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';

type ExercicioEditavel = ExercicioNoTreino & { _uid: string };

interface RoutineFormProps {
  routineToEdit?: Rotina;
  onClose: () => void;
}

// Sortable Item Component
function SortableExerciseCard({ 
  item, 
  idx, 
  ex, 
  removeExercicio, 
  updateMeta 
}: { 
  item: ExercicioEditavel; 
  idx: number; 
  ex?: Exercicio;
  removeExercicio: (id: string) => void;
  updateMeta: (id: string, updates: Partial<ExercicioNoTreino>) => void;
}) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: item._uid });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    zIndex: isDragging ? 10 : 1,
    opacity: isDragging ? 0.9 : 1,
  };

  return (
    <div 
      ref={setNodeRef} 
      style={style} 
      className={`bg-gray-50 dark:bg-gray-700/30 p-5 rounded-3xl border-2 transition-colors ${
        isDragging ? 'border-primary shadow-xl' : 'border-transparent dark:border-gray-700/50'
      }`}
    >
      <div className="flex justify-between items-start mb-4 gap-2">
        <div 
          {...attributes} 
          {...listeners}
          className="cursor-grab active:cursor-grabbing p-1 mt-1 text-gray-600 dark:text-gray-400 hover:text-primary transition-colors touch-none"
        >
          <GripVertical size={20} />
        </div>
        <div className="flex-1 flex gap-3 items-center">
          <span className="w-6 h-6 bg-gray-200 dark:bg-gray-600 rounded-lg flex items-center justify-center text-xs font-black text-gray-500 dark:text-gray-300">
            {idx + 1}
          </span>
          <h4 className="font-black text-base dark:text-gray-100">{ex?.nome}</h4>
        </div>
        <button aria-label="Botão" type="button" onClick={() => removeExercicio(item._uid)} className="p-1.5 text-gray-600 dark:text-gray-400 hover:text-red-500 ml-1">
          <Trash2 size={18}/>
        </button>
      </div>

      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 pl-8">
        <div className="space-y-1">
          <label className="text-[11px] uppercase font-black text-orange-500 tracking-widest pl-1">Aquec.</label>
          <input
            type="number"
            value={item.series_aquecimento}
            onChange={e => updateMeta(item._uid, { series_aquecimento: parseInt(e.target.value) || 0 })}
            className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-orange-500 outline-none text-center font-black"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] uppercase font-black text-primary tracking-widest pl-1">Trabalho</label>
          <input
            type="number"
            value={item.series_trabalho}
            onChange={e => updateMeta(item._uid, { series_trabalho: parseInt(e.target.value) || 0 })}
            className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-primary outline-none text-center font-black"
          />
        </div>
        <div className="space-y-1">
          <label className="text-[11px] uppercase font-black text-gray-600 dark:text-gray-400 tracking-widest pl-1">Meta</label>
          {ex?.tipo === 'carga' ? (
            <input
              type="text"
              value={item.metas.repeticoes || ''}
              onChange={e => updateMeta(item._uid, { metas: { ...item.metas, repeticoes: e.target.value } })}
              placeholder="Reps"
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-gray-400 outline-none text-center font-black text-xs"
            />
          ) : (
            <input
              type="number"
              value={item.metas.tempo || 0}
              onChange={e => updateMeta(item._uid, { metas: { ...item.metas, tempo: parseInt(e.target.value) || 0 } })}
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-gray-400 outline-none text-center font-black text-xs"
            />
          )}
        </div>
        <div className="space-y-1">
          <label className="text-[11px] uppercase font-black text-blue-500 tracking-widest pl-1">Descanso</label>
          <div className="relative">
            <input
              type="number"
              value={item.tempo_descanso || 60}
              onChange={e => updateMeta(item._uid, { tempo_descanso: parseInt(e.target.value) || 0 })}
              className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-blue-500 outline-none text-center font-black text-xs"
            />
            <span className="absolute bottom-1 right-1 text-[7px] font-black text-gray-300 uppercase">seg</span>
          </div>
        </div>
        <div className="space-y-1">
          <label className="text-[11px] uppercase font-black text-purple-500 tracking-widest pl-1">Biset</label>
          <input
            type="text"
            maxLength={2}
            value={item.grupo || ''}
            onChange={e => updateMeta(item._uid, { grupo: e.target.value.toUpperCase() })}
            placeholder="A, B"
            className="w-full p-3 rounded-xl bg-white dark:bg-gray-800 border-2 border-transparent focus:border-purple-500 outline-none text-center font-black text-xs uppercase"
          />
        </div>
      </div>
    </div>
  );
}

const RoutineForm: React.FC<RoutineFormProps> = ({ routineToEdit, onClose }) => {
  const [nome, setNome] = useState('');
  const [exerciciosSelecionados, setExerciciosSelecionados] = useState<ExercicioEditavel[]>([]);
  const [isSelectorOpen, setIsSelectorOpen] = useState(false);

  const todosExercicios = useLiveQuery(() => db.exercicios.toArray()) || [];

  const sensors = useSensors(
    useSensor(PointerSensor, {
      activationConstraint: {
        distance: 5,
      },
    }),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  useEffect(() => {
    if (routineToEdit) {
      setNome(routineToEdit.nome);
      setExerciciosSelecionados(
        routineToEdit.exercicios.map(ex => ({ ...ex, _uid: Math.random().toString(36).substr(2, 9) }))
      );
    }
  }, [routineToEdit]);

  const addExercicio = (ex: Exercicio) => {
    if (!ex.id) return;
    const novo: ExercicioEditavel = {
      _uid: Math.random().toString(36).substr(2, 9),
      exercicio_id: ex.id,
      series_aquecimento: 0,
      series_trabalho: 3,
      metas: ex.tipo === 'carga' ? { repeticoes: '10-12' } : { tempo: 60 }
    };
    setExerciciosSelecionados([...exerciciosSelecionados, novo]);
    setIsSelectorOpen(false);
  };

  const removeExercicio = (id: string) => {
    setExerciciosSelecionados(exerciciosSelecionados.filter((ex) => ex._uid !== id));
  };

  const updateMeta = (id: string, updates: Partial<ExercicioNoTreino>) => {
    setExerciciosSelecionados(
      exerciciosSelecionados.map((ex) => (ex._uid === id ? { ...ex, ...updates } : ex))
    );
  };

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;
    
    if (over && active.id !== over.id) {
      setExerciciosSelecionados((items) => {
        const oldIndex = items.findIndex((item) => item._uid === active.id);
        const newIndex = items.findIndex((item) => item._uid === over.id);
        return arrayMove(items, oldIndex, newIndex);
      });
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!nome || exerciciosSelecionados.length === 0) return;

    try {
      // Remove _uid before saving
      const data: Rotina = {
        nome,
        exercicios: exerciciosSelecionados.map(({ _uid, ...rest }) => rest)
      };

      if (routineToEdit?.id) {
        await db.rotinas.update(routineToEdit.id, data as any);
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
          <button aria-label="Fechar" onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="flex-1 overflow-y-auto p-6 space-y-6">
          <div>
            <label className="block text-xs font-bold mb-1 text-gray-600 dark:text-gray-400 uppercase tracking-widest">NOME DA FICHA</label>
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
              <h3 className="font-black text-gray-700 dark:text-gray-300 uppercase tracking-tighter">EXERCÍCIOS ({exerciciosSelecionados.length})</h3>
              <button aria-label="Botão" 
                type="button"
                onClick={() => setIsSelectorOpen(true)}
                className="bg-primary/10 text-primary px-4 py-2 rounded-xl font-bold text-xs flex items-center gap-1 active:scale-95 transition-all"
              >
                <Plus size={14} /> ADICIONAR
              </button>
            </div>

            <DndContext 
              sensors={sensors}
              collisionDetection={closestCenter}
              onDragEnd={handleDragEnd}
            >
              <SortableContext 
                items={exerciciosSelecionados.map(i => i._uid)}
                strategy={verticalListSortingStrategy}
              >
                <div className="space-y-4">
                  {exerciciosSelecionados.map((item, idx) => {
                    const ex = todosExercicios.find(e => e.id === item.exercicio_id);
                    return (
                      <SortableExerciseCard
                        key={item._uid}
                        item={item}
                        idx={idx}
                        ex={ex}
                        removeExercicio={removeExercicio}
                        updateMeta={updateMeta}
                      />
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        </form>

        <div className="p-6 pb-10 sm:pb-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
          <button aria-label="Salvar" 
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
        <ExerciseSelectorModal
          todosExercicios={todosExercicios}
          onSelect={addExercicio}
          onClose={() => setIsSelectorOpen(false)}
        />
      )}
    </div>
  );
};

export default RoutineForm;
