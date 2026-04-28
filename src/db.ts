import Dexie, { type Table } from 'dexie';

export interface Exercicio {
  id?: number;
  nome: string;
  categoria: string;
  tipo: 'carga' | 'tempo';
  tags: string[];
  notas_padrao?: string;
}

export interface ExercicioNoTreino {
  exercicio_id: number;
  series: number;
  metas: {
    repeticoes?: string;
    carga?: string;
    tempo?: number;
  };
}

export interface Rotina {
  id?: number;
  nome: string;
  exercicios: ExercicioNoTreino[];
}

export interface Serie {
  id?: number;
  exercicio_id: number;
  carga?: number;
  repeticoes?: number;
  rpe?: number;
  tempo?: number;
  concluida: boolean;
}

export interface SessaoTreino {
  id?: number;
  rotina_id?: number;
  data_inicio: Date;
  data_fim?: Date;
  exercicios_realizados: {
    exercicio_id: number;
    series: Serie[];
  }[];
}

export interface Configuracao {
  id?: number;
  chave: string;
  valor: string | number | boolean | object;
}

export interface Biometria {
  id?: number;
  data: Date;
  peso: number;
  cintura?: number;
  braco_d?: number;
  braco_e?: number;
  perna_d?: number;
  perna_e?: number;
  notas?: string;
}

export class AppDatabase extends Dexie {
  exercicios!: Table<Exercicio>;
  rotinas!: Table<Rotina>;
  sessoes!: Table<SessaoTreino>;
  configuracoes!: Table<Configuracao>;
  biometria!: Table<Biometria>;

  constructor() {
    super('TreinoDB');
    this.version(2).stores({
      exercicios: '++id, nome, categoria, *tags',
      rotinas: '++id, nome',
      sessoes: '++id, rotina_id, data_inicio',
      configuracoes: '++id, chave',
      biometria: '++id, data'
    });
  }
}

export const db = new AppDatabase();
