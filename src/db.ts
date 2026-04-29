import Dexie, { type Table } from 'dexie';

export interface Exercicio {
  id?: number;
  nome: string;
  categoria: string;
  tipo: 'carga' | 'tempo';
  tags: string[];
  notas_padrao?: string;
  substituicao1_id?: number;
  substituicao2_id?: number;
  ajuda?: string;
  video_url?: string;
}

export interface ExercicioNoTreino {
  exercicio_id: number;
  series_aquecimento: number;
  series_trabalho: number;
  tempo_descanso?: number;
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
  tipo: 'aquecimento' | 'trabalho';
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
  percentual_gordura?: number;
  massa_muscular?: number;
  cintura?: number;
  braco_d?: number;
  braco_e?: number;
  perna_d?: number;
  perna_e?: number;
  notas?: string;
}

export interface PersonalRecord {
  id?: number;
  exercicio_id: number;
  carga: number;
  repeticoes: number;
  data: Date;
}

export interface PlanoSemanal {
  dia_semana: number; // 0-6 (Dom-Sab)
  rotina_id: number;
}

export class AppDatabase extends Dexie {
  exercicios!: Table<Exercicio>;
  rotinas!: Table<Rotina>;
  sessoes!: Table<SessaoTreino>;
  configuracoes!: Table<Configuracao>;
  biometria!: Table<Biometria>;
  personal_records!: Table<PersonalRecord>;
  plano_semanal!: Table<PlanoSemanal>;

  constructor() {
    super('TreinoDB');
    
    // Schema original v1
    this.version(1).stores({
      exercicios: '++id, nome, categoria, *tags',
      rotinas: '++id, nome',
      sessoes: '++id, rotina_id, data_inicio',
      configuracoes: '++id, chave'
    });

    // v2: Adiciona biometria básica
    this.version(2).stores({
      exercicios: '++id, nome, categoria, *tags',
      rotinas: '++id, nome',
      sessoes: '++id, rotina_id, data_inicio',
      configuracoes: '++id, chave',
      biometria: '++id, data'
    }).upgrade(tx => {
      return tx.table('biometria').toCollection().count();
    });

    // v3: Adiciona campos extras na biometria
    this.version(3).stores({
      exercicios: '++id, nome, categoria, *tags',
      rotinas: '++id, nome',
      sessoes: '++id, rotina_id, data_inicio',
      configuracoes: '++id, chave',
      biometria: '++id, data'
    });

    // v4: Adiciona records pessoais (PRs)
    this.version(4).stores({
      exercicios: '++id, nome, categoria, *tags',
      rotinas: '++id, nome',
      sessoes: '++id, rotina_id, data_inicio',
      configuracoes: '++id, chave',
      biometria: '++id, data',
      personal_records: '++id, exercicio_id, data'
    });

    // v5: Adiciona planejamento semanal
    this.version(5).stores({
      exercicios: '++id, nome, categoria, *tags',
      rotinas: '++id, nome',
      sessoes: '++id, rotina_id, data_inicio',
      configuracoes: '++id, chave',
      biometria: '++id, data',
      personal_records: '++id, exercicio_id, data',
      plano_semanal: 'dia_semana'
    });

    // v6: Adiciona ajuda e vídeo no exercício
    this.version(6).stores({
      exercicios: '++id, nome, categoria, *tags',
      rotinas: '++id, nome',
      sessoes: '++id, rotina_id, data_inicio',
      configuracoes: '++id, chave',
      biometria: '++id, data',
      personal_records: '++id, exercicio_id, data',
      plano_semanal: 'dia_semana'
    });
  }
}

export const db = new AppDatabase();
