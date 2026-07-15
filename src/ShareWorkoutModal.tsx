import React, { useRef, useState } from 'react';
import { toPng } from 'html-to-image';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { X, Share2, TrendingUp, Clock, Calendar, CheckCircle2 } from 'lucide-react';
import type { SessaoTreino, Rotina, Exercicio } from './db';
import toast from 'react-hot-toast';

interface Props {
  sessao: SessaoTreino;
  rotina: Rotina | undefined;
  exercicios: Exercicio[];
  onClose: () => void;
}

const ShareWorkoutModal: React.FC<Props> = ({ sessao, rotina, exercicios, onClose }) => {
  const [isGenerating, setIsGenerating] = useState(false);
  const cardRef = useRef<HTMLDivElement>(null);

  const tempoTotalMin = sessao.data_fim 
    ? Math.max(1, Math.round((new Date(sessao.data_fim).getTime() - new Date(sessao.data_inicio).getTime()) / 60000))
    : 0;

  const totalSeries = sessao.exercicios_realizados.reduce(
    (acc, ex) => acc + ex.series.filter(s => s.concluida).length, 0
  );

  const totalVolume = sessao.exercicios_realizados.reduce(
    (acc, ex) => acc + ex.series.filter(s => s.concluida).reduce((sAcc, s) => sAcc + (s.carga || 0) * (s.repeticoes || 0), 0),
    0
  );

  const handleShare = async () => {
    if (!cardRef.current) return;
    
    try {
      setIsGenerating(true);
      // Wait a bit for fonts/styles to ensure rendering
      await new Promise(r => setTimeout(r, 100));
      
      const dataUrl = await toPng(cardRef.current, { 
        quality: 1.0, 
        pixelRatio: 2,
        backgroundColor: '#1a1a1a',
        style: { transform: 'scale(1)', transformOrigin: 'top left' }
      });

      if (navigator.share) {
        try {
          const blob = await (await fetch(dataUrl)).blob();
          const file = new File([blob], 'treino.png', { type: blob.type });
          await navigator.share({
            title: 'Meu Treino',
            text: `Treino concluído: ${rotina?.nome || 'Treino'}!`,
            files: [file]
          });
          toast.success('Compartilhado!');
        } catch (e) {
          handleDownload(dataUrl);
        }
      } else {
        handleDownload(dataUrl);
      }
    } catch (err) {
      console.error('Erro ao gerar imagem', err);
      toast.error('Erro ao gerar a imagem.');
    } finally {
      setIsGenerating(false);
    }
  };

  const handleDownload = (dataUrl: string) => {
    const link = document.createElement('a');
    link.download = `treino-${format(new Date(sessao.data_inicio), 'yyyy-MM-dd')}.png`;
    link.href = dataUrl;
    link.click();
    toast.success('Imagem salva!');
  };

  return (
    <div className="fixed inset-0 z-[100] bg-black/80 flex flex-col items-center justify-center p-4">
      {/* Container de Download - Esse será convertido em imagem */}
      <div className="w-full max-w-sm rounded-3xl overflow-hidden relative" ref={cardRef}>
        <div className="absolute inset-0 bg-gradient-to-br from-gray-900 via-gray-800 to-black z-0"></div>
        <div className="absolute -top-24 -right-24 w-48 h-48 bg-primary/20 rounded-full blur-3xl"></div>
        <div className="absolute -bottom-24 -left-24 w-48 h-48 bg-blue-500/20 rounded-full blur-3xl"></div>
        
        <div className="relative z-10 p-6 flex flex-col h-full text-white">
          <div className="flex justify-between items-start mb-6">
            <div>
              <h2 className="font-black text-2xl tracking-tight leading-none mb-1">
                {rotina?.nome || 'Treino Avulso'}
              </h2>
              <p className="text-gray-600 dark:text-gray-400 font-bold text-xs flex items-center gap-1">
                <Calendar size={12} />
                {format(new Date(sessao.data_inicio), "dd 'de' MMMM", { locale: ptBR })}
              </p>
            </div>
            <div className="w-10 h-10 rounded-full bg-primary flex items-center justify-center shadow-[0_0_15px_rgba(0,200,150,0.5)]">
              <CheckCircle2 className="text-white" size={24} />
            </div>
          </div>

          <div className="grid grid-cols-3 gap-2 mb-6">
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
              <Clock size={16} className="text-blue-400 mb-1" />
              <span className="font-black text-lg leading-none">{tempoTotalMin}</span>
              <span className="text-[11px] uppercase font-bold text-gray-600 dark:text-gray-400 tracking-wider">Min</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
              <TrendingUp size={16} className="text-primary mb-1" />
              <span className="font-black text-lg leading-none">{(totalVolume / 1000).toFixed(1)}k</span>
              <span className="text-[11px] uppercase font-bold text-gray-600 dark:text-gray-400 tracking-wider">Volume</span>
            </div>
            <div className="bg-white/10 backdrop-blur-sm p-3 rounded-2xl border border-white/10 flex flex-col items-center justify-center text-center">
              <CheckCircle2 size={16} className="text-purple-400 mb-1" />
              <span className="font-black text-lg leading-none">{totalSeries}</span>
              <span className="text-[11px] uppercase font-bold text-gray-600 dark:text-gray-400 tracking-wider">Séries</span>
            </div>
          </div>

          <div className="space-y-2 mb-4">
            <h3 className="text-xs uppercase font-black tracking-widest text-gray-700 dark:text-gray-300 mb-2">Principais Movimentos</h3>
            {sessao.exercicios_realizados.slice(0, 4).map((ex) => {
              const nomeEx = exercicios.find(e => e.id === ex.exercicio_id)?.nome;
              const series = ex.series.filter(s => s.concluida).length;
              return (
                <div key={ex.exercicio_id} className="flex justify-between items-center text-sm border-b border-white/5 pb-1">
                  <span className="font-medium text-gray-300 truncate pr-4">{nomeEx}</span>
                  <span className="font-black text-primary">{series}x</span>
                </div>
              );
            })}
            {sessao.exercicios_realizados.length > 4 && (
              <p className="text-center text-xs text-gray-700 dark:text-gray-300 font-bold mt-2 pt-2">
                + {sessao.exercicios_realizados.length - 4} outros exercícios
              </p>
            )}
          </div>
          
          <div className="mt-4 pt-4 border-t border-white/10 flex justify-center items-center">
            <span className="text-[11px] font-black uppercase tracking-[0.2em] text-gray-700 dark:text-gray-300">Antigravity Workout</span>
          </div>
        </div>
      </div>

      <div className="flex gap-4 mt-8">
        <button aria-label="Fechar"           onClick={onClose}
          className="w-14 h-14 bg-gray-800 text-white rounded-full flex items-center justify-center shadow-lg border border-gray-700 active:scale-95 transition-transform"
        >
          <X size={24} />
        </button>
        <button aria-label="Botão de Ação"           onClick={handleShare}
          disabled={isGenerating}
          className="h-14 px-8 bg-primary text-white font-black rounded-full flex items-center gap-2 shadow-[0_5px_20px_rgba(0,200,150,0.4)] active:scale-95 transition-transform disabled:opacity-50"
        >
          {isGenerating ? (
            <span className="animate-pulse">Gerando...</span>
          ) : (
            <>
              <Share2 size={20} />
              COMPARTILHAR
            </>
          )}
        </button>
      </div>
    </div>
  );
};

export default ShareWorkoutModal;
