import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Rotina } from './db';
import { Plus, Edit2, Trash2, Play, LayoutList } from 'lucide-react';
import RoutineForm from './RoutineForm';

import { useWorkoutStore } from './store';

const RoutineList: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Rotina | undefined>();
  const startWorkout = useWorkoutStore(state => state.startWorkout);

  const rotinas = useLiveQuery(() => db.rotinas.toArray());

  const handleDelete = async (id: number, nome: string) => {
    if (confirm(`Tem certeza que deseja excluir a rotina "${nome}"?`)) {
      await db.rotinas.delete(id);
    }
  };

  const handleEdit = (routine: Rotina) => {
    setEditingRoutine(routine);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingRoutine(undefined);
    setIsFormOpen(true);
  };

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      {/* Header */}
      <div className="flex items-center justify-between">
        <h1 className="text-2xl font-bold">Treinar</h1>
        <button 
          onClick={handleAddNew}
          className="bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
        >
          <Plus size={24} />
        </button>
      </div>

      <div className="space-y-4">
        {rotinas?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <LayoutList size={48} className="mx-auto mb-4 opacity-20" />
            <p>Você ainda não criou nenhuma ficha de treino.</p>
            <button 
              onClick={handleAddNew}
              className="mt-4 text-primary font-bold"
            >
              Criar minha primeira ficha
            </button>
          </div>
        ) : (
          rotinas?.map(routine => (
            <div 
              key={routine.id}
              className="bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700"
            >
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h3 className="font-bold text-xl mb-1">{routine.nome}</h3>
                  <p className="text-sm text-gray-500">
                    {routine.exercicios.length} exercícios
                  </p>
                </div>
                <div className="flex gap-1">
                  <button 
                    onClick={() => handleEdit(routine)}
                    className="p-2 text-gray-400 hover:text-primary transition-colors"
                  >
                    <Edit2 size={18} />
                  </button>
                  <button 
                    onClick={() => routine.id && handleDelete(routine.id, routine.nome)}
                    className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                  >
                    <Trash2 size={18} />
                  </button>
                </div>
              </div>

              <div className="flex gap-2">
                <button 
                  className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all"
                  onClick={() => startWorkout(routine)}
                >
                  <Play size={18} fill="currentColor" />
                  Treinar Agora
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isFormOpen && (
        <RoutineForm
          routineToEdit={editingRoutine}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default RoutineList;
