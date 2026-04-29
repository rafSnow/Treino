import React, { useEffect, useState } from 'react';
import { db, type ExercicioNoTreino } from './db';
import { useConfirm } from './ConfirmDialog';
import toast from 'react-hot-toast';
import { Download, ChevronRight, Dumbbell } from 'lucide-react';

const RoutineImporter: React.FC = () => {
  const confirm = useConfirm();
  const [importData, setImportData] = useState<{
    n: string;
    e: (ExercicioNoTreino & { ex: any })[];
  } | null>(null);

  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const importBase64 = params.get('import');

    if (importBase64) {
      try {
        const decoded = JSON.parse(decodeURIComponent(escape(atob(importBase64))));
        setImportData(decoded);
        // Limpa a URL para não importar novamente ao recarregar
        window.history.replaceState({}, document.title, window.location.pathname);
      } catch (error) {
        console.error('Falha ao decodificar importação:', error);
        toast.error('O link de importação é inválido.');
      }
    }
  }, []);

  const handleImport = async () => {
    if (!importData) return;

    if (await confirm({
      title: 'Importar Rotina',
      message: `Deseja importar a rotina "${importData.n}" com ${importData.e.length} exercícios?`,
      confirmLabel: 'Importar Agora',
      variant: 'primary'
    })) {
      try {
        const mappedExercises: ExercicioNoTreino[] = [];

        for (const item of importData.e) {
          const exData = item.ex;
          // Verifica se o exercício já existe pelo nome
          let existingEx = await db.exercicios.where('nome').equalsIgnoreCase(exData.n).first();
          
          let exerciseId: number;
          if (!existingEx) {
            // Cria o exercício se não existir
            exerciseId = await db.exercicios.add({
              nome: exData.n,
              categoria: exData.c,
              tipo: exData.t,
              tags: exData.g || [],
              ajuda: exData.a,
              video_url: exData.v
            }) as number;
          } else {
            exerciseId = existingEx.id!;
          }

          const { ex, ...config } = item;
          mappedExercises.push({
            ...config,
            exercicio_id: exerciseId
          });
        }

        await db.rotinas.add({
          nome: importData.n,
          exercicios: mappedExercises
        });

        toast.success('Rotina importada com sucesso!');
        setImportData(null);
      } catch (error) {
        console.error('Falha ao importar:', error);
        toast.error('Erro ao importar rotina.');
      }
    } else {
      setImportData(null);
    }
  };

  if (!importData) return null;

  return (
    <div className="fixed inset-0 bg-black/60 backdrop-blur-md flex items-center justify-center z-[200] p-6">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-3xl overflow-hidden shadow-2xl animate-in zoom-in duration-300">
        <div className="p-8 text-center space-y-4">
          <div className="w-20 h-20 bg-primary/20 text-primary rounded-full flex items-center justify-center mx-auto mb-4">
            <Download size={40} className="animate-bounce" />
          </div>
          <h2 className="text-2xl font-black leading-tight">Nova Rotina Encontrada!</h2>
          <p className="text-gray-500 dark:text-gray-400 font-medium">
            Você recebeu a ficha <strong>{importData.n}</strong>. Deseja adicioná-la aos seus treinos?
          </p>

          <div className="bg-gray-50 dark:bg-gray-900/50 rounded-2xl p-4 text-left space-y-2 mt-4 max-h-48 overflow-y-auto">
            <span className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Exercícios incluídos:</span>
            {importData.e.map((item, i) => (
              <div key={i} className="flex items-center gap-2 text-sm font-bold">
                <Dumbbell size={14} className="text-primary" />
                <span>{item.ex.n}</span>
              </div>
            ))}
          </div>
        </div>

        <div className="p-6 pt-0 flex gap-3">
          <button
            onClick={() => setImportData(null)}
            className="flex-1 py-4 font-bold text-gray-400 hover:text-gray-600 transition-colors"
          >
            RECUSAR
          </button>
          <button
            onClick={handleImport}
            className="flex-[2] bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 flex items-center justify-center gap-2 hover:bg-opacity-90 transition-all"
          >
            IMPORTAR
            <ChevronRight size={20} />
          </button>
        </div>
      </div>
    </div>
  );
};

export default RoutineImporter;
