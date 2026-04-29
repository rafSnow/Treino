import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Exercicio } from './db';
import { Search, Plus, Edit2, Trash2, Filter } from 'lucide-react';
import ExerciseForm from './ExerciseForm';
import { useConfirm } from './ConfirmDialog';

const ExerciseList: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedTag, setSelectedTag] = useState<string | null>(null);
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingExercise, setEditingExercise] = useState<Exercicio | undefined>();
  const confirm = useConfirm();

  const exercicios = useLiveQuery(
    async () => {
      let collection = db.exercicios.orderBy('nome');
      
      if (searchTerm) {
        collection = collection.filter(ex => 
          ex.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }

      const results = await collection.toArray();
      
      if (selectedTag) {
        return results.filter(ex => ex.tags.includes(selectedTag));
      }
      
      return results;
    },
    [searchTerm, selectedTag]
  );

  const handleDelete = async (id: number, nome: string) => {
    // 3.4 Deleção sem Verificação de Integridade Referencial
    const rotinasUsando = await db.rotinas
      .filter(r => r.exercicios.some(e => e.exercicio_id === id))
      .count();

    const sessoesUsando = await db.sessoes
      .filter(s => s.exercicios_realizados.some(e => e.exercicio_id === id))
      .count();

    if (rotinasUsando > 0 || sessoesUsando > 0) {
      await confirm({
        title: 'Não é possível excluir',
        message: `O exercício "${nome}" está sendo usado em ${rotinasUsando} rotina(s) e ${sessoesUsando} treino(s) salvo(s). Para manter a integridade dos seus dados, você não pode excluí-lo.`,
        confirmLabel: 'Entendido',
        variant: 'primary'
      });
      return;
    }

    if (await confirm({
      title: 'Excluir Exercício',
      message: `Tem certeza que deseja excluir o exercício "${nome}"?`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    })) {
      try {
        await db.exercicios.delete(id);
      } catch (error) {
        console.error('Falha ao excluir exercício:', error);
        alert('Erro ao excluir exercício.');
      }
    }
  };

  const handleEdit = (ex: Exercicio) => {
    setEditingExercise(ex);
    setIsFormOpen(true);
  };

  const handleAddNew = () => {
    setEditingExercise(undefined);
    setIsFormOpen(true);
  };

  const tagsDisponiveis = Array.from(new Set(exercicios?.flatMap(ex => ex.tags) || []));

  return (
    <div className="flex flex-col h-full bg-gray-50 dark:bg-[#1a1a1a] p-4 space-y-6 overflow-y-auto pb-24">
      {/* Header Elegante */}
      <div>
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Catálogo</h1>
          <button 
            onClick={handleAddNew}
            className="bg-primary text-white p-2 rounded-full shadow-lg hover:scale-105 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>

        <div className="relative group mb-4">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-gray-400 group-focus-within:text-primary transition-colors" size={18} />
          <input
            type="text"
            placeholder="Buscar exercício..."
            value={searchTerm}
            onChange={e => setSearchTerm(e.target.value)}
            className="w-full pl-10 pr-4 py-3 rounded-xl bg-white dark:bg-gray-800 border border-gray-100 dark:border-gray-700 focus:ring-2 focus:ring-primary outline-none transition-all text-sm"
          />
        </div>

        {tagsDisponiveis.length > 0 && (
          <div className="flex gap-2 overflow-x-auto pb-1 scrollbar-hide">
            <button
              onClick={() => setSelectedTag(null)}
              className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                selectedTag === null ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'
              }`}
            >
              TODOS
            </button>
            {tagsDisponiveis.map(tag => (
              <button
                key={tag}
                onClick={() => setSelectedTag(tag === selectedTag ? null : tag)}
                className={`px-4 py-1.5 rounded-lg text-xs font-bold whitespace-nowrap transition-all ${
                  selectedTag === tag ? 'bg-primary text-white' : 'bg-white dark:bg-gray-800 text-gray-400 border border-gray-100 dark:border-gray-700'
                }`}
              >
                {tag.toUpperCase()}
              </button>
            ))}
          </div>
        )}
      </div>

      <div className="space-y-3">
        {exercicios?.length === 0 ? (
          <div className="text-center py-12 text-gray-500">
            <Filter size={48} className="mx-auto mb-4 opacity-20" />
            <p>Nenhum exercício encontrado.</p>
          </div>
        ) : (
          exercicios?.map(ex => (
            <div 
              key={ex.id}
              className="bg-white dark:bg-gray-800 p-4 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 flex items-center justify-between group"
            >
              <div className="flex-1">
                <div className="flex items-center gap-2">
                  <h3 className="font-bold text-lg">{ex.nome}</h3>
                  <span className="text-xs px-2 py-0.5 bg-gray-100 dark:bg-gray-700 rounded text-gray-500">
                    {ex.categoria}
                  </span>
                </div>
                <div className="flex flex-wrap gap-1 mt-1">
                  {ex.tags.map(tag => (
                    <span key={tag} className="text-[10px] uppercase tracking-wider font-semibold text-primary">
                      #{tag}
                    </span>
                  ))}
                </div>
              </div>
              <div className="flex gap-1">
                <button 
                  onClick={() => handleEdit(ex)}
                  className="p-2 text-gray-400 hover:text-primary transition-colors"
                >
                  <Edit2 size={18} />
                </button>
                <button 
                  onClick={() => ex.id && handleDelete(ex.id, ex.nome)}
                  className="p-2 text-gray-400 hover:text-red-500 transition-colors"
                >
                  <Trash2 size={18} />
                </button>
              </div>
            </div>
          ))
        )}
      </div>

      {isFormOpen && (
        <ExerciseForm
          exerciseToEdit={editingExercise}
          onClose={() => setIsFormOpen(false)}
        />
      )}
    </div>
  );
};

export default ExerciseList;
