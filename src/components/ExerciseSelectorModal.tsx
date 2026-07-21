import React, { useState } from 'react';
import { X, Search } from 'lucide-react';
import type { Exercicio } from '../db';

interface ExerciseSelectorModalProps {
  todosExercicios: Exercicio[];
  onSelect: (ex: Exercicio) => void;
  onClose: () => void;
}

const ExerciseSelectorModal: React.FC<ExerciseSelectorModalProps> = ({
  todosExercicios,
  onSelect,
  onClose,
}) => {
  const [searchExercicio, setSearchExercicio] = useState('');

  return (
    <div className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-[110] p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-md rounded-2xl p-6 max-h-[70vh] flex flex-col shadow-2xl">
        <div className="flex justify-between items-center mb-4">
          <h3 className="text-lg font-bold">Selecionar Exercício</h3>
          <button
            aria-label="Fechar modal"
            onClick={onClose}
            className="p-1 hover:text-red-500 transition-colors"
          >
            <X size={20} />
          </button>
        </div>

        <div className="relative mb-3">
          <Search
            className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-600 dark:text-gray-400"
            size={16}
          />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={searchExercicio}
            onChange={(e) => setSearchExercicio(e.target.value)}
            className="w-full pl-9 pr-4 py-2.5 rounded-xl bg-gray-50 dark:bg-gray-700 text-sm font-bold outline-none focus:ring-2 focus:ring-primary"
            autoFocus
          />
        </div>

        <div className="flex-1 overflow-y-auto space-y-2 pr-1">
          {todosExercicios
            .filter((ex) =>
              ex.nome.toLowerCase().includes(searchExercicio.toLowerCase())
            )
            .map((ex) => (
              <button
                aria-label={`Selecionar ${ex.nome}`}
                key={ex.id}
                onClick={() => onSelect(ex)}
                className="w-full text-left p-4 rounded-xl hover:bg-gray-100 dark:hover:bg-gray-700 border dark:border-gray-700 transition-colors focus:ring-2 focus:ring-primary outline-none"
              >
                <div className="font-bold text-gray-900 dark:text-gray-100">{ex.nome}</div>
                <div className="text-xs text-gray-700 dark:text-gray-300">
                  {ex.categoria}
                </div>
              </button>
            ))}
          {todosExercicios.length === 0 && (
            <p className="text-center text-gray-700 dark:text-gray-300 py-8">
              Nenhum exercício cadastrado no catálogo.
            </p>
          )}
          {todosExercicios.length > 0 &&
            todosExercicios.filter((ex) =>
              ex.nome.toLowerCase().includes(searchExercicio.toLowerCase())
            ).length === 0 && (
              <p className="text-center text-gray-700 dark:text-gray-300 py-8">
                Nenhum exercício encontrado na busca.
              </p>
            )}
        </div>
      </div>
    </div>
  );
};

export default ExerciseSelectorModal;
