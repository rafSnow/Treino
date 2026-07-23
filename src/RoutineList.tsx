import React, { useState } from 'react';
import { useLiveQuery } from 'dexie-react-hooks';
import { db, type Rotina } from './db';
import { Play, Plus, Trash2, Edit2, CalendarCheck, Share2, Copy, Clock } from 'lucide-react';
import RoutineForm from './RoutineForm';
import { useWorkoutStore } from './store';
import { useConfirm } from './ConfirmDialog';
import toast from 'react-hot-toast';

export const calcularTempoEstimado = (rotina: Rotina) => {
  let totalSegundos = 0;
  rotina.exercicios.forEach(ex => {
    const sets = ex.series_aquecimento + ex.series_trabalho;
    // Assumir 45s de duração média por série se não for por tempo
    const duracaoSet = ex.metas.tempo || 45; 
    const descanso = ex.tempo_descanso || 60;
    
    totalSegundos += sets * duracaoSet;
    // O descanso ocorre apenas entre as séries, e não após a última série do exercício.
    // Para simplificar e prever transições, podemos somar o descanso para cada série ou sets - 1
    totalSegundos += sets > 0 ? sets * descanso : 0; 
  });
  return Math.ceil(totalSegundos / 60); // em minutos
};

interface RoutineListProps {
  onOpenCatalog: () => void;
}

const RoutineList: React.FC<RoutineListProps> = ({ onOpenCatalog }) => {
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
      const exerciseIds = routine.exercicios.map(e => String(e.exercicio_id));
      const allEx = await db.exercicios.toArray();
      const exercises = allEx.filter(e => exerciseIds.includes(String(e.id)));
      
      const payload = {
        n: routine.nome,
        e: routine.exercicios.map(re => {
          const info = exercises.find(e => e.id === re.exercicio_id);
          return {
            ...re,
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

  const handleClone = async (routine: Rotina) => {
    try {
      const clone = {
        nome: `${routine.nome} (Cópia)`,
        exercicios: [...routine.exercicios]
      };
      await db.rotinas.add(clone);
      toast.success('Rotina clonada com sucesso!');
    } catch (error) {
      console.error('Falha ao clonar rotina:', error);
      toast.error('Erro ao clonar rotina.');
    }
  };

  const handleDelete = async (id: string, nome: string) => {
    if (await confirm({
      title: 'Excluir Rotina',
      message: `Tem certeza que deseja excluir a rotina "${nome}"?`,
      confirmLabel: 'Excluir',
      variant: 'danger'
    })) {
      try {
        await db.rotinas.delete(String(id));
      } catch (error) {
        console.error('Falha ao excluir rotina:', error);
        toast.error('Erro ao excluir rotina.');
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
        <div className="flex gap-2">
          <button aria-label="Botão de Ação" 
            onClick={onOpenCatalog}
            className="bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700 p-2 rounded-xl shadow-sm hover:scale-105 transition-transform flex items-center gap-1 text-xs font-bold uppercase"
          >
            Catálogo
          </button>
          <button aria-label="Adicionar" 
            onClick={handleAddNew}
            className="bg-primary text-white p-2 rounded-xl shadow-lg hover:scale-105 transition-transform"
          >
            <Plus size={24} />
          </button>
        </div>
      </div>

      <div className="space-y-4">
        {rotinas?.length === 0 ? (
          <div className="text-center py-12 text-gray-700 dark:text-gray-300">
            <Play size={48} className="mx-auto mb-4 opacity-20" />
            <p>Você ainda não criou nenhuma ficha de treino.</p>
            <button aria-label="Adicionar" 
              onClick={handleAddNew}
              className="mt-4 text-primary font-bold"
            >
              Criar minha primeira ficha
            </button>
          </div>
        ) : (
          rotinas?.map(routine => {
            const isSuggested = routine.id === suggestionId;
            const tempoEstimado = calcularTempoEstimado(routine);
            const totalSeries = routine.exercicios.reduce((acc, ex) => acc + ex.series_trabalho + ex.series_aquecimento, 0);

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
                        <span className="bg-primary/10 text-primary text-xs font-black px-2 py-0.5 rounded-full flex items-center gap-1 uppercase tracking-tighter">
                          <CalendarCheck size={10} /> Sugestão de Hoje
                        </span>
                      )}
                    </div>
                    <div className="flex gap-3 text-sm text-gray-700 dark:text-gray-300 font-medium">
                      <span>{routine.exercicios.length} exercícios</span>
                      <span>&bull;</span>
                      <span>{totalSeries} séries</span>
                      <span>&bull;</span>
                      <span className="flex items-center gap-1"><Clock size={14} /> ~{tempoEstimado} min</span>
                    </div>
                  </div>
                  <div className="flex gap-1">
                    <button aria-label="Botão" 
                      onClick={() => handleEdit(routine)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors"
                      title="Editar Rotina"
                    >
                      <Edit2 size={18} />
                    </button>
                    <button aria-label="Botão" 
                      onClick={() => routine.id && handleDelete(String(routine.id), routine.nome)}
                      className="p-2 text-gray-600 dark:text-gray-400 hover:bg-red-50 dark:hover:bg-red-900/20 hover:text-red-500 rounded-xl transition-colors"
                      title="Excluir Rotina"
                    >
                      <Trash2 size={18} />
                    </button>
                  </div>
                </div>

                <div className="flex gap-2">
                  <button aria-label="Botão" 
                    onClick={() => handleShare(routine)}
                    className="p-3 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center justify-center"
                    title="Compartilhar"
                  >
                    <Share2 size={20} />
                  </button>
                  <button aria-label="Botão" 
                    onClick={() => handleClone(routine)}
                    className="p-3 text-gray-700 dark:text-gray-300 bg-gray-50 dark:bg-gray-700/50 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-xl transition-colors flex items-center justify-center"
                    title="Clonar Rotina"
                  >
                    <Copy size={20} />
                  </button>
                  <button aria-label="Botão" 
                    className="flex-1 bg-primary text-white py-3 rounded-xl font-bold flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all shadow-sm"
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

