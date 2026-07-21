import React, { useState, useEffect, useMemo } from 'react';
import { XCircle, Flame, Heart, Clock } from 'lucide-react';
import { calcularCaloriasMet, calcularCaloriasKeytel } from '../utils/metabolic';

interface EndWorkoutModalProps {
  isOpen: boolean;
  onClose: () => void;
  onFinish: (data: { duracao_minutos: number, rpe_sessao: number, calorias: number, fc_media?: number }) => void;
  dataInicio: Date;
  pesoKg: number;
  idadeAnos: number;
}

const EndWorkoutModal: React.FC<EndWorkoutModalProps> = ({
  isOpen,
  onClose,
  onFinish,
  dataInicio,
  pesoKg,
  idadeAnos
}) => {
  const [duracao, setDuracao] = useState(0);
  const [rpe, setRpe] = useState(7);
  const [fcMedia, setFcMedia] = useState<string>('');

  useEffect(() => {
    if (isOpen) {
      const diffMs = new Date().getTime() - dataInicio.getTime();
      const diffMins = Math.max(1, Math.round(diffMs / 60000));
      setDuracao(diffMins);
    }
  }, [isOpen, dataInicio]);

  const calorias = useMemo(() => {
    const fc = parseInt(fcMedia);
    if (!isNaN(fc) && fc > 40) {
      return calcularCaloriasKeytel(idadeAnos, pesoKg, fc, duracao);
    }
    return calcularCaloriasMet(pesoKg, duracao / 60, rpe);
  }, [duracao, rpe, fcMedia, pesoKg, idadeAnos]);

  if (!isOpen) return null;

  const handleSave = () => {
    const fc = parseInt(fcMedia);
    onFinish({
      duracao_minutos: duracao,
      rpe_sessao: rpe,
      calorias,
      fc_media: !isNaN(fc) ? fc : undefined
    });
  };

  return (
    <div className="fixed inset-0 bg-black/60 z-50 flex items-center justify-center p-4 backdrop-blur-sm animate-in fade-in duration-200">
      <div className="bg-white dark:bg-gray-800 rounded-3xl w-full max-w-sm overflow-hidden shadow-2xl flex flex-col animate-in zoom-in-95 duration-200 border border-gray-100 dark:border-gray-700">
        
        {/* Header */}
        <div className="relative p-6 pb-4 flex flex-col items-center border-b border-gray-100 dark:border-gray-700 bg-gradient-to-b from-primary/10 to-transparent">
          <button 
            onClick={onClose}
            className="absolute top-4 right-4 text-gray-400 hover:text-gray-600 dark:hover:text-gray-300"
          >
            <XCircle size={24} />
          </button>
          
          <div className="w-16 h-16 bg-primary/20 rounded-full flex items-center justify-center mb-3">
            <Flame size={32} className="text-primary" />
          </div>
          <h2 className="text-xl font-black text-center">Treino Concluído!</h2>
          <p className="text-sm text-gray-500 dark:text-gray-400 text-center mt-1">Como foi a sua sessão de treino hoje?</p>
        </div>

        {/* Content */}
        <div className="p-6 space-y-6">
          
          <div className="flex gap-4">
            {/* Duração */}
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1 uppercase">
                <Clock size={14} /> Duração (min)
              </label>
              <input 
                type="number" 
                value={duracao}
                onChange={(e) => setDuracao(Math.max(1, parseInt(e.target.value) || 1))}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-lg font-bold text-center focus:ring-2 focus:ring-primary outline-none transition-all"
              />
            </div>
            
            {/* RPE */}
            <div className="flex-1 space-y-2">
              <label className="text-xs font-bold text-gray-500 flex items-center gap-1 uppercase">
                <Flame size={14} /> Esforço (RPE)
              </label>
              <select 
                value={rpe}
                onChange={(e) => setRpe(parseInt(e.target.value))}
                className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-lg font-bold text-center focus:ring-2 focus:ring-primary outline-none transition-all appearance-none"
              >
                <option value={5}>5 (Leve)</option>
                <option value={6}>6 (Moderado)</option>
                <option value={7}>7 (Difícil)</option>
                <option value={8}>8 (Muito Difícil)</option>
                <option value={9}>9 (Extremo)</option>
                <option value={10}>10 (Máximo)</option>
              </select>
            </div>
          </div>

          <div className="space-y-2">
            <label className="text-xs font-bold text-gray-500 flex items-center gap-1 justify-between uppercase">
              <span className="flex items-center gap-1"><Heart size={14} /> FC Média (Opcional)</span>
            </label>
            <input 
              type="number" 
              placeholder="ex: 125 bpm"
              value={fcMedia}
              onChange={(e) => setFcMedia(e.target.value)}
              className="w-full bg-gray-50 dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-xl p-3 text-lg font-bold text-center focus:ring-2 focus:ring-primary outline-none transition-all"
            />
            <p className="text-[10px] text-gray-400 text-center">Use os dados do seu Smartwatch para maior precisão (Fórmula Keytel).</p>
          </div>
          
          <div className="bg-primary/10 rounded-xl p-4 flex flex-col items-center justify-center border border-primary/20">
            <span className="text-xs font-bold text-primary uppercase tracking-widest mb-1">Gasto Estimado</span>
            <div className="flex items-end gap-1">
              <span className="text-3xl font-black text-primary leading-none">{calorias}</span>
              <span className="text-sm font-bold text-primary/70 mb-1">kcal</span>
            </div>
          </div>
          
        </div>

        {/* Footer */}
        <div className="p-4 bg-gray-50 dark:bg-gray-900/50 border-t border-gray-100 dark:border-gray-800">
          <button 
            onClick={handleSave}
            className="w-full bg-primary text-white font-black text-lg py-4 rounded-xl shadow-[0_0_15px_rgba(0,200,150,0.4)] hover:shadow-[0_0_25px_rgba(0,200,150,0.6)] transition-all"
          >
            Salvar Treino
          </button>
        </div>
      </div>
    </div>
  );
};

export default EndWorkoutModal;
