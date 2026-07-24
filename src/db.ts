import { useState, useEffect } from 'react';
import { collection, doc, addDoc, updateDoc, deleteDoc, getDocs, getDoc, query, orderBy, onSnapshot, where, limit } from 'firebase/firestore';
import { db as firestore, auth } from './firebase';

export interface Exercicio { id?: string; nome: string; categoria: string; tipo: 'carga' | 'tempo'; tags: string[]; notas_padrao?: string; substituicao1_id?: string; substituicao2_id?: string; ajuda?: string; video_url?: string; imagem?: string; }
export interface ExercicioNoTreino { exercicio_id: string; series_aquecimento: number; series_trabalho: number; tempo_descanso?: number; grupo?: string; metas: { repeticoes?: string; carga?: string; tempo?: number; }; }
export interface Rotina { id?: string; nome: string; exercicios: ExercicioNoTreino[]; }
export interface Serie { id?: string; exercicio_id: string; carga?: number; repeticoes?: number; rpe?: number; tempo?: number; tipo: 'aquecimento' | 'trabalho'; concluida: boolean; }
export interface SessaoTreino { id?: string; rotina_id?: string; data_inicio: Date; data_fim?: Date; notas?: string; exercicios_realizados: { exercicio_id: string; notas?: string; series: Serie[]; }[]; duracao_minutos?: number; rpe_sessao?: number; calorias?: number; fc_media?: number; }
export interface Configuracao { id?: string; chave: string; valor: any; }
export interface Biometria { id?: string; data: Date; peso?: number; percentual_gordura?: number; massa_muscular?: number; cintura?: number; braco_d?: number; braco_e?: number; perna_d?: number; perna_e?: number; pescoco?: number; ombros?: number; torax?: number; braco_relaxado_d?: number; braco_relaxado_e?: number; braco_contraido_d?: number; braco_contraido_e?: number; antebraco_d?: number; antebraco_e?: number; abdomen?: number; quadril?: number; coxa_proximal_d?: number; coxa_proximal_e?: number; coxa_medial_d?: number; coxa_medial_e?: number; panturrilha_d?: number; panturrilha_e?: number; dobra_peitoral?: number; dobra_tricipital?: number; dobra_subescapular?: number; dobra_axilar?: number; dobra_suprailiaca?: number; dobra_abdominal?: number; dobra_coxa?: number; diam_umero?: number; diam_femur?: number; diam_punho?: number; notas?: string; fotos?: string[]; foto_frente?: string; foto_lado?: string; foto_costas?: string; }
export interface PersonalRecord { id?: string; exercicio_id: string; carga: number; repeticoes: number; data: Date; }
export interface PlanoSemanal { id?: string; dia_semana: number; rotina_id: string; }
export interface SessaoCardio { id?: string; tipo: 'Corrida' | 'Caminhada' | 'Ciclismo' | 'Escada'; data: Date; duracao_minutos: number; distancia_km?: number; calorias?: number; bpm_medio?: number; notas?: string; }

const mapTimestamps = (data: any) => {
  if (!data) return data;
  const out = { ...data };
  for (const key in out) {
    if (out[key] && typeof out[key].toDate === 'function') {
      out[key] = out[key].toDate();
    }
  }
  return out;
};

const removeUndefined = (obj: any): any => {
  if (Array.isArray(obj)) {
    return obj.map(removeUndefined);
  } else if (obj !== null && typeof obj === 'object') {
    if (typeof obj.toDate === 'function' || obj instanceof Date) {
      return obj;
    }
    const newObj: any = {};
    for (const key in obj) {
      if (obj[key] !== undefined) {
        newObj[key] = removeUndefined(obj[key]);
      }
    }
    return newObj;
  }
  return obj;
};

class FirebaseTable<T> {
  private name: string;
  constructor(name: string) { this.name = name; }

  get ref() {
    const uid = auth.currentUser?.uid;
    if (!uid) throw new Error("Usuário não autenticado");
    return collection(firestore, `users/${uid}/${this.name}`);
  }

  async toArray(): Promise<T[]> {
    const snap = await getDocs(this.ref);
    return snap.docs.map(d => ({ id: d.id, ...mapTimestamps(d.data()) } as any as T));
  }

  async add(data: any) {
    const res = await addDoc(this.ref, removeUndefined(data));
    return res.id;
  }

  async put(data: any) {
    if (data.id) {
      const { id, ...rest } = data;
      await updateDoc(doc(this.ref, id), removeUndefined(rest));
      return id;
    }
    return this.add(data);
  }
  
  async get(id: string) {
    const snap = await getDoc(doc(this.ref, id));
    if (!snap.exists()) return undefined;
    return { id: snap.id, ...mapTimestamps(snap.data()) } as any as T;
  }

  async delete(id: string) {
    await deleteDoc(doc(this.ref, id));
  }
  
  async update(id: string, data: any) {
    await updateDoc(doc(this.ref, id), removeUndefined(data));
  }

  async clear() {
    const all = await this.toArray();
    for (const item of all as any) {
      if (item.id) await this.delete(item.id);
    }
  }

  async count() {
    const all = await this.toArray();
    return all.length;
  }

  where(field: string) {
    return {
      equals: (val: any) => ({
        first: async (): Promise<T | undefined> => {
          const q = query(this.ref, where(field, '==', val), limit(1));
          const snap = await getDocs(q);
          if (snap.empty) return undefined;
          return { id: snap.docs[0].id, ...mapTimestamps(snap.docs[0].data()) } as any as T;
        },
        toArray: async (): Promise<T[]> => {
          const q = query(this.ref, where(field, '==', val));
          const snap = await getDocs(q);
          return snap.docs.map(d => ({ id: d.id, ...mapTimestamps(d.data()) } as any as T));
        },
        delete: async () => {
          const q = query(this.ref, where(field, '==', val));
          const snap = await getDocs(q);
          for (const doc of snap.docs) {
            await deleteDoc(doc.ref);
          }
        },
        modify: async (data: any) => {
          const q = query(this.ref, where(field, '==', val));
          const snap = await getDocs(q);
          const sanitized = removeUndefined(data);
          for (const docSnap of snap.docs) {
            await updateDoc(docSnap.ref, sanitized);
          }
        }
      })
    };
  }
}

export const db = {
  exercicios: new FirebaseTable<Exercicio>('exercicios'),
  rotinas: new FirebaseTable<Rotina>('rotinas'),
  sessoes: new FirebaseTable<SessaoTreino>('sessoes'),
  configuracoes: new FirebaseTable<Configuracao>('configuracoes'),
  biometria: new FirebaseTable<Biometria>('biometria'),
  personal_records: new FirebaseTable<PersonalRecord>('personal_records'),
  plano_semanal: new FirebaseTable<PlanoSemanal>('plano_semanal'),
  cardio: new FirebaseTable<SessaoCardio>('cardio'),
  transaction: async (_mode: any, _tables: any, callback: () => Promise<void>) => {
    // Mock dexie transaction
    await callback();
  }
};

export function useCollection<T>(collectionName: string, orderByField?: string, desc?: boolean) {
  const [data, setData] = useState<T[] | undefined>(undefined);

  useEffect(() => {
    const uid = auth.currentUser?.uid;
    if (!uid) {
      setData(undefined);
      return;
    }

    let q = query(collection(firestore, `users/${uid}/${collectionName}`));
    if (orderByField) {
      q = query(q, orderBy(orderByField, desc ? 'desc' : 'asc'));
    }

    const unsubscribe = onSnapshot(q, (snapshot) => {
      const docs = snapshot.docs.map(d => ({ id: d.id, ...mapTimestamps(d.data()) } as any as T));
      setData(docs);
    });

    return () => unsubscribe();
  }, [collectionName, orderByField, desc]);

  return data;
}
