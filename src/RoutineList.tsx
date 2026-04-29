import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Rotina } from './db';
import { Play, Plus, Trash2, Edit2, CalendarCheck, Share2 } from 'lucide-react';
import RoutineForm from './RoutineForm';
import { useWorkoutStore } from './store';
import { useConfirm } from './ConfirmDialog';
import toast from 'react-hot-toast';

const RoutineList: React.FC = () => {
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingRoutine, setEditingRoutine] = useState<Rotina | undefined>();
  const startWorkout = useWorkoutStore(state => state.startWorkout);
  const confirm = useConfirm();

  const rotinas = useLiveQuery(() => db.rotinas.toArray());
  const planoSemanal = useLiveQuery(() => db.plano_semanal.toArray()) || [];
  
  const today = new Date().getDay();
  const suggestionId = planoSemanal.find(p => p.dia_semana === today)?.rotina_id;

  const handleShare = async (routine: Rotina) => {
    try {
      // Busca todos os exercícios da rotina para incluir no payload
      const exerciseIds = routine.exercicios.map(e => e.exercicio_id);
      const exercises = await db.exercicios.where('id').anyOf(exerciseIds).toArray();
      
      const payload = {
        n: routine.nome,
        e: routine.exercicios.map(re => {
          const info = exercises.find(e => e.id === re.exercicio_id);
          return {
            ...re,
            // Dados do exercício para recriar se necessário
            ex: {
              n: info?.nome,
              c: info?.categoria,
              t: info?.tipo,
              g: info?.tags,
              a: info?.ajuda,
              v: info?.video_url
            }
          };
        })
      };

      const base64 = btoa(unescape(encodeURIComponent(JSON.stringify(payload))));
      const shareUrl = `${window.location.origin}${window.location.pathname}?import=${base64}`;

      if (navigator.share) {
        await navigator.share({
          title: `Minha ficha de treino: ${routine.nome}`,
          text: `Confira minha ficha de treino "${routine.nome}" no Treino PWA!`,
          url: shareUrl
        });
      } else {
        await navigator.clipboard.writeText(shareUrl);
        toast.success('Link de compartilhamento copiado!');
      }
    } catch (error) {
      console.error('Erro ao compartilhar:', error);
      toast.error('Erro ao gerar link de compartilhamento.');
    }
  };

  const handleDelete = async (id: number, nome: string) => {
    if (await confirm({
      title: 'Excluir Rotina',
      message: `Tem certeza que deseja excluir a rotina "${nome}"?`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    })) {
      try {
        await db.rotinas.delete(id);
      } catch (error) {
        console.error('Falha ao excluir rotina:', error);
        alert('Erro ao excluir rotina.');
      }
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
            <Play size={48} className="mx-auto mb-4 opacity-20" />
            <p>Você ainda não criou nenhuma ficha de treino.</p>
            <button 
              onClick={handleAddNew}
              className="mt-4 text-primary font-bold"
            >
              Criar minha primeira ficha
            </button>
          </div>
        ) : (
          rotinas?.map(routine => {
            const isSuggested = routine.id === suggestionId;
            return (
              <div 
                key={routine.id}
                className={`bg-white dark:bg-gray-800 p-5 rounded-2xl shadow-sm border transition-all ${
                  isSuggested 
                    ? 'ring-2 ring-primary border-primary' 
                    : 'border-gray-100 dark:border-gray-700'
                }`}
              >
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="font-bold text-xl">{routine.nome}</h3>
                      {isSuggested && (
                        <span className="bg-primary/10 text-primary text-[10px] font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter">
                          <CalendarCheck size={10} /> Sugestão de Hoje
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {routine.exercicios.length} exercícios
                    </p>
                  </div>
                  <div className="flex gap-1">
                    <button 
                      onClick={() => handleShare(routine)}
                      className="p-2 text-gray-400 hover:text-primary transition-colors"
                      title="Compartilhar"
                    >
                      <Share2 size={18} />
                    </button>
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
            );
          })
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
