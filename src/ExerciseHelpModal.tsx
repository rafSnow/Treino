import React from 'react';
import { X, PlayCircle, Info } from 'lucide-react';
import { type Exercicio } from './db';

interface ExerciseHelpModalProps {
  exercise: Exercicio;
  onClose: () => void;
}

const ExerciseHelpModal: React.FC<ExerciseHelpModalProps> = ({ exercise, onClose }) => {
  const getYoutubeId = (url: string) => {
    const regExp = /^.*(youtu.be\/|v\/|u\/\w\/|embed\/|watch\?v=|&v=)([^#&?]*).*/;
    const match = url.match(regExp);
    return (match && match[2].length === 11) ? match[2] : null;
  };

  const videoId = exercise.video_url ? getYoutubeId(exercise.video_url) : null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-end sm:items-center justify-center z-[110]">
      <div className="bg-white dark:bg-gray-800 w-full max-w-lg h-[90vh] sm:h-auto sm:max-h-[80vh] rounded-t-2xl sm:rounded-2xl flex flex-col shadow-xl overflow-hidden">
        <div className="flex justify-between items-center p-6 border-b dark:border-gray-700 bg-white dark:bg-gray-800 sticky top-0 z-10">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-primary/10 text-primary rounded-xl">
              <Info size={20} />
            </div>
            <h2 className="text-xl font-black truncate">{exercise.nome}</h2>
          </div>
          <button onClick={onClose} className="p-2 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full transition-colors">
            <X size={24} />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto p-6 space-y-6">
          {videoId ? (
            <div className="aspect-video w-full rounded-2xl overflow-hidden bg-black shadow-lg">
              <iframe
                width="100%"
                height="100%"
                src={`https://www.youtube.com/embed/${videoId}`}
                title="YouTube video player"
                frameBorder="0"
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen
              ></iframe>
            </div>
          ) : (
            exercise.video_url && (
              <div className="bg-orange-50 dark:bg-orange-900/10 p-4 rounded-2xl flex items-center gap-3 text-orange-600 border border-orange-100 dark:border-orange-900/20">
                <PlayCircle size={20} />
                <p className="text-xs font-bold">URL de vídeo inválida ou não suportada.</p>
              </div>
            )
          )}

          <div className="space-y-2">
            <h3 className="text-[10px] font-black text-gray-400 uppercase tracking-widest">Instruções de Execução</h3>
            <div className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap font-medium">
              {exercise.ajuda || "Nenhuma instrução cadastrada para este exercício."}
            </div>
          </div>
        </div>

        <div className="p-6 pb-10 sm:pb-6 bg-gray-50 dark:bg-gray-900 border-t dark:border-gray-700">
          <button
            onClick={onClose}
            className="w-full bg-primary text-white py-4 rounded-2xl font-black shadow-lg shadow-primary/20 hover:bg-opacity-90 transition-all"
          >
            ENTENDI
          </button>
        </div>
      </div>
    </div>
  );
};

export default ExerciseHelpModal;
