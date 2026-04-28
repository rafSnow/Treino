import React, { useState } from 'react';
import { Calculator, X } from 'lucide-react';

interface OneRMCalculatorProps {
  onClose: () => void;
}

const OneRMCalculator: React.FC<OneRMCalculatorProps> = ({ onClose }) => {
  const [peso, setPeso] = useState('');
  const [reps, setReps] = useState('');

  // Fórmula de Brzycki: 1RM = peso / (1.0278 - (0.0278 * repeticoes))
  const calculate1RM = () => {
    const p = parseFloat(peso);
    const r = parseInt(reps);
    if (!p || !r) return 0;
    if (r === 1) return p;
    return Math.round(p / (1.0278 - (0.0278 * r)));
  };

  const oneRM = calculate1RM();

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
      <div className="bg-white dark:bg-gray-800 w-full max-w-sm rounded-2xl p-6 shadow-2xl animate-in fade-in zoom-in duration-200">
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-2">
            <Calculator className="text-primary" size={24} />
            <h2 className="text-xl font-bold">Calculadora 1RM</h2>
          </div>
          <button onClick={onClose} className="p-1 hover:bg-gray-100 dark:hover:bg-gray-700 rounded-full">
            <X size={24} />
          </button>
        </div>

        <div className="space-y-4">
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Peso Levantado (kg)</label>
            <input
              type="number"
              value={peso}
              onChange={e => setPeso(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary outline-none text-lg font-bold"
              placeholder="Ex: 80"
            />
          </div>
          <div>
            <label className="block text-xs font-bold text-gray-400 uppercase mb-1">Repetições Realizadas</label>
            <input
              type="number"
              value={reps}
              onChange={e => setReps(e.target.value)}
              className="w-full p-4 rounded-xl bg-gray-50 dark:bg-gray-700 border-none focus:ring-2 focus:ring-primary outline-none text-lg font-bold"
              placeholder="Ex: 10"
            />
          </div>

          <div className="mt-8 bg-primary/10 p-6 rounded-2xl text-center border border-primary/20">
            <p className="text-sm text-primary font-bold uppercase tracking-widest mb-1">Sua 1RM Estimada</p>
            <p className="text-5xl font-black text-primary">
              {oneRM} <span className="text-lg font-bold">kg</span>
            </p>
          </div>

          <p className="text-[10px] text-gray-400 text-center mt-4">
            * Baseado na fórmula de Brzycki. A precisão é maior para repetições abaixo de 10.
          </p>
        </div>
      </div>
    </div>
  );
};

export default OneRMCalculator;
