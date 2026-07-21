/**
 * utils/metabolic.ts
 *
 * Módulo para cálculos de gasto energético e metabolismo.
 */

/**
 * Calcula o gasto calórico usando a tabela MET.
 * @param pesoKg Peso do usuário em quilogramas.
 * @param horas Duração da atividade em horas.
 * @param rpe Percepção de esforço (0-10)
 * @returns Estimativa de calorias gastas.
 */
export function calcularCaloriasMet(pesoKg: number, horas: number, rpe: number): number {
  if (pesoKg <= 0 || horas <= 0) return 0;
  
  // MET 6.0 para treino vigoroso (RPE 8-10), 3.5 para treino leve/moderado
  const met = rpe >= 8 ? 6.0 : 3.5;
  
  const gasto = met * pesoKg * horas;
  return Math.round(gasto);
}

/**
 * Calcula o gasto calórico baseado na frequência cardíaca usando a fórmula de Keytel.
 * Esta versão é a geral/masculina, mais amplamente utilizada para estimativas brutas de smartwatches
 * quando o sexo não é um dado limitante. 
 * Fórmula: Gasto = Tempo(min) * [(0.6309 * FC) + (0.1988 * Peso) + (0.2017 * Idade) - 55.0969] / 4.184
 * 
 * @param idade Idade em anos.
 * @param pesoKg Peso do usuário em quilogramas.
 * @param fcMedia Frequência Cardíaca média (bpm).
 * @param minutos Duração do treino em minutos.
 * @returns Estimativa de calorias gastas.
 */
export function calcularCaloriasKeytel(idade: number, pesoKg: number, fcMedia: number, minutos: number): number {
  if (idade <= 0 || pesoKg <= 0 || fcMedia <= 0 || minutos <= 0) return 0;

  const energiaKJ = (0.6309 * fcMedia) + (0.1988 * pesoKg) + (0.2017 * idade) - 55.0969;
  
  // Se a FC for muito baixa, a fórmula pode resultar em valores negativos.
  if (energiaKJ <= 0) return 0;

  const gasto = minutos * (energiaKJ / 4.184);
  return Math.round(gasto);
}
