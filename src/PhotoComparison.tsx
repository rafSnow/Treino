import React, { useState, useMemo } from 'react';
import { type Biometria } from './db';
import { format } from 'date-fns';
import { X, SlidersHorizontal, AlertCircle } from 'lucide-react';

interface Props {
  medicoes: Biometria[];
  onClose: () => void;
}

const PhotoComparison: React.FC<Props> = ({ medicoes, onClose }) => {
  const fotosComData = useMemo(() => {
    const list: { data: Date, url: string, label: string }[] = [];
    medicoes.forEach(m => {
      const dateStr = format(new Date(m.data), 'dd/MM/yyyy');
      
      if (m.foto_frente) list.push({ data: m.data, url: m.foto_frente, label: `${dateStr} (Frente)` });
      if (m.foto_lado) list.push({ data: m.data, url: m.foto_lado, label: `${dateStr} (Lado)` });
      if (m.foto_costas) list.push({ data: m.data, url: m.foto_costas, label: `${dateStr} (Costas)` });
      
      if (m.fotos && m.fotos.length > 0) {
        m.fotos.forEach((url, index) => {
           list.push({ 
             data: m.data, 
             url, 
             label: `${dateStr} ${m.fotos!.length > 1 ? `(Outra ${index+1})` : '(Outra)'}` 
           });
        });
      }
    });
    // Ordena da mais antiga para a mais recente
    return list.sort((a, b) => new Date(a.data).getTime() - new Date(b.data).getTime());
  }, [medicoes]);

  const [antesIdx, setAntesIdx] = useState<number>(0);
  const [depoisIdx, setDepoisIdx] = useState<number>(Math.max(0, fotosComData.length - 1));
  const [sliderPos, setSliderPos] = useState<number>(50);

  if (fotosComData.length < 2) {
    return (
      <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col items-center justify-center p-6 animate-in fade-in duration-200">
        <button aria-label="Fechar" onClick={onClose} className="absolute top-6 right-6 text-white p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={24}/></button>
        <div className="bg-gray-900 p-8 rounded-3xl flex flex-col items-center text-center max-w-sm border border-gray-800">
          <div className="bg-primary/20 text-primary p-4 rounded-full mb-4">
            <AlertCircle size={32} />
          </div>
          <h2 className="text-xl font-bold text-white mb-2">Fotos Insuficientes</h2>
          <p className="text-gray-400 text-sm">Você precisa adicionar pelo menos duas fotos ao seu histórico de biometria (em dias ou medições diferentes) para utilizar a comparação de evolução.</p>
        </div>
      </div>
    );
  }

  const imgAntes = fotosComData[antesIdx]?.url;
  const imgDepois = fotosComData[depoisIdx]?.url;

  return (
    <div className="fixed inset-0 z-[110] bg-black/95 flex flex-col p-4 animate-in slide-in-from-bottom duration-300">
      <div className="flex justify-between items-center text-white mb-4 pt-2">
        <h2 className="text-xl font-bold flex items-center gap-2"><SlidersHorizontal size={22} className="text-primary"/> Comparar Evolução</h2>
        <button aria-label="Fechar" onClick={onClose} className="p-2 bg-white/10 rounded-full hover:bg-white/20 transition-colors"><X size={20}/></button>
      </div>

      <div className="flex gap-3 mb-4">
        <div className="flex-1 bg-gray-900 rounded-2xl p-3 border border-gray-800">
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Antes</label>
          <select 
            value={antesIdx} 
            onChange={e => setAntesIdx(Number(e.target.value))}
            className="w-full bg-transparent text-white font-semibold outline-none text-sm appearance-none truncate"
          >
            {fotosComData.map((f, i) => <option key={i} value={i} className="bg-gray-900">{f.label}</option>)}
          </select>
        </div>
        <div className="flex-1 bg-gray-900 rounded-2xl p-3 border border-gray-800">
          <label className="text-[10px] text-gray-500 uppercase font-bold tracking-wider block mb-1">Depois</label>
          <select 
            value={depoisIdx} 
            onChange={e => setDepoisIdx(Number(e.target.value))}
            className="w-full bg-transparent text-white font-semibold outline-none text-sm appearance-none truncate"
          >
            {fotosComData.map((f, i) => <option key={i} value={i} className="bg-gray-900">{f.label}</option>)}
          </select>
        </div>
      </div>

      <div className="relative flex-1 rounded-3xl overflow-hidden bg-gray-900 border border-gray-800 touch-none mb-safe">
        {/* Depois (Background) */}
        <img src={imgDepois} alt="Depois" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" />
        
        {/* Antes (Foreground) clipado */}
        <img src={imgAntes} alt="Antes" className="absolute inset-0 w-full h-full object-contain pointer-events-none select-none" style={{ clipPath: `inset(0 ${100 - sliderPos}% 0 0)` }} />

        {/* Divisor Visual */}
        <div 
          className="absolute top-0 bottom-0 w-1 bg-white shadow-[0_0_20px_rgba(0,0,0,0.8)] pointer-events-none flex items-center justify-center"
          style={{ left: `${sliderPos}%`, transform: 'translateX(-50%)' }}
        >
          <div className="w-10 h-10 bg-white rounded-full shadow-xl flex items-center justify-center border-2 border-gray-200">
            <div className="flex gap-1.5">
              <div className="w-0.5 h-4 bg-gray-400 rounded-full"></div>
              <div className="w-0.5 h-4 bg-gray-400 rounded-full"></div>
            </div>
          </div>
        </div>

        {/* Range Input Invisível para Controle Nativo */}
        <input 
          type="range" 
          min="0" 
          max="100" 
          value={sliderPos}
          onChange={e => setSliderPos(Number(e.target.value))}
          className="absolute inset-0 w-full h-full opacity-0 cursor-ew-resize z-10 touch-pan-x"
        />
        
        {/* Labels flutuantes das fotos no slider */}
        <div className="absolute bottom-4 left-4 right-4 flex justify-between pointer-events-none">
          <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm opacity-70">
            ANTES
          </span>
          <span className="bg-black/60 text-white text-[10px] font-bold px-2 py-1 rounded backdrop-blur-sm opacity-70">
            DEPOIS
          </span>
        </div>
      </div>
    </div>
  );
};
export default PhotoComparison;
