# Code Review — Treino PWA
> **Perspectiva:** Engenheiro de Software Sênior com foco em aplicações mobile-first e PWA  
> **Data:** Abril de 2026  
> **Stack analisada:** React + TypeScript + Dexie.js + Zustand + Tailwind CSS + Vite PWA

---

## 1. Impressão Geral

O projeto demonstra **boa maturidade arquitetural** para uma aplicação pessoal. A escolha de tecnologias é coesa — Dexie para persistência local, Zustand para estado global de sessão e uma separação razoável de responsabilidades entre componentes. O visual mobile-first é consistente e bem cuidado. Dito isso, há pontos críticos de confiabilidade, UX e escalabilidade que merecem atenção antes de qualquer crescimento da base de usuários.

---

## 2. Pontos Fortes ✅

- **Offline-first correto:** Uso de IndexedDB via Dexie é a escolha certa para uma PWA que precisa funcionar sem internet.
- **Design system implícito:** A variável `primary` (#00C896) e as classes Tailwind estão sendo usadas de forma consistente por todos os componentes.
- **Safe Area tratada:** O uso de `env(safe-area-inset-bottom)` e `pb-safe` demonstra preocupação real com iPhones com notch.
- **UX de treino bem pensada:** A lógica de timer de descanso com vibração e beep ao fim é um detalhe de produto excelente.
- **PWA install prompt:** Tratamento correto do `beforeinstallprompt` com persistência no store global.

---

## 3. Problemas Críticos 🔴

### 3.1 Perda de Dados em Sessão de Treino Ativa

O estado do `activeWorkout` vive **apenas em memória** (Zustand sem persistência). Se o usuário fechar o app, receber uma ligação que mata o processo, ou o sistema operacional limpar o app em background, **o treino em andamento é perdido por completo** sem aviso.

**Solução recomendada:**
```typescript
// store.ts — adicionar middleware persist do Zustand
import { persist, createJSONStorage } from 'zustand/middleware';

export const useWorkoutStore = create<WorkoutStore>()(
  persist(
    (set, get) => ({ /* ... seu store atual ... */ }),
    {
      name: 'active-workout-storage',
      storage: createJSONStorage(() => localStorage),
      partialize: (state) => ({ activeWorkout: state.activeWorkout }),
    }
  )
);
```

---

### 3.2 Timer de Descanso Hardcoded

Em `store.ts`, ao concluir qualquer série, o timer é sempre iniciado com 60 segundos fixos:

```typescript
// store.ts — linha problemática
if (data.concluida) {
  get().startTimer(60); // ← hardcoded, ignora configurações do exercício
}
```

O correto é respeitar uma configuração por rotina/exercício. O usuário que faz musculação pesada precisa de 3-5 minutos; quem faz circuito precisa de 30 segundos.

**Solução:** Adicionar `tempo_descanso` em `ExercicioNoTreino` e ler de lá ao chamar `startTimer`.

---

### 3.3 Confirmações via `window.confirm()` (Bloqueante e Inconsistente)

Há pelo menos 5 chamadas a `confirm()` espalhadas pelo código. Em iOS Safari instalado como PWA, o `confirm()` pode ter comportamento inconsistente. Além disso, é impossível customizar o visual, o que quebra a identidade do app.

**Solução:** Criar um componente `<ConfirmDialog>` reutilizável com Promise-based API:

```typescript
// hooks/useConfirm.ts
export function useConfirm() {
  // retorna uma função async que mostra modal customizado
  // e resolve true/false dependendo da ação do usuário
}
```

---

### 3.4 Deleção sem Verificação de Integridade Referencial

Ao deletar um `Exercicio` do catálogo, nenhuma verificação é feita para saber se ele está em uso em alguma `Rotina` ou referenciado em `SessaoTreino` passada. Isso vai corromper silenciosamente o histórico do usuário (o nome do exercício vai sumir dos logs).

**Solução:**
```typescript
// Antes de deletar, verificar referências
const rotinasUsando = await db.rotinas
  .filter(r => r.exercicios.some(e => e.exercicio_id === id))
  .count();

if (rotinasUsando > 0) {
  // mostrar aviso ao usuário em vez de deletar direto
}
```

---

## 4. Problemas de Média Severidade 🟡

### 4.1 Schema do Banco Sem Migração Planejada

O banco está na `version(2)` mas não há `upgrade()` definido para migração da v1 → v2. Usuários que instalaram a v1 podem ter o banco em estado corrompido silenciosamente.

```typescript
// db.ts — padrão correto Dexie
this.version(1).stores({ /* schema inicial */ });
this.version(2).stores({ /* schema v2 */ })
  .upgrade(tx => {
    // script de migração de dados da v1 para v2
  });
```

### 4.2 Lógica de Negócio Misturada com UI

A função `handleFinish` em `WorkoutSession.tsx` contém lógica de persistência diretamente no componente. O ideal é que o `finishWorkout` do store receba os dados e faça o `db.sessoes.add()` internamente, mantendo o componente apenas como UI.

### 4.3 Ausência de Tratamento de Erro nas Operações de DB

Todas as chamadas ao Dexie (`.add()`, `.update()`, `.delete()`) são feitas sem `try/catch`. Uma falha de escrita no IndexedDB (ex: storage cheio) vai travar a UI silenciosamente.

### 4.4 `font-size: 16px !important` Global em Inputs

Embora a intenção seja evitar o zoom automático no iOS, aplicar isso globalmente afeta a consistência visual de toda a aplicação. O ideal é aplicar via classe utilitária apenas nos inputs que precisam.

### 4.5 Calendário de Consistência sem Tratamento de Timezone

```typescript
// History.tsx
isSameDay(new Date(s.data_inicio), day)
```

`s.data_inicio` salvo como `Date` no Dexie é serializado como string UTC. Em fusos como `America/Sao_Paulo` (UTC-3), um treino feito às 23h local pode aparecer no dia seguinte no calendário.

---

## 5. Melhorias de Experiência do Usuário 🟠

### 5.1 Ausência de Feedback Visual ao Salvar

Nenhum formulário exibe feedback de sucesso após salvar. O modal simplesmente fecha. Adicionar um toast/snackbar (`react-hot-toast` é leve e perfeito para PWA) melhora muito a percepção de confiabilidade.

### 5.2 Sem Estado de Loading no Startup

Quando o app abre pela primeira vez, o Dexie pode levar alguns milissegundos para inicializar. Sem um estado de loading, a tela pode piscar. Adicione um `<SplashScreen>` simples controlado pelo hook `useLiveQuery`.

### 5.3 Campo de Peso na Biometria Não Salva Histórico de Gordura Corporal

O modelo `Biometria` já tem os campos para medidas corporais (braço, cintura), mas não tem `%_gordura` nem `massa_muscular`. Se o usuário usa uma balança smart, não tem onde registrar esses dados.

---

## 6. Novas Funcionalidades Sugeridas 💡

### 6.1 🏆 Marcação de PRs (Personal Records) Automática

A cada série concluída, comparar com o histórico e, se for um novo recorde de carga ou repetição para aquele exercício, exibir uma animação de conquista e registrar automaticamente no DB.

```typescript
// Tabela nova: personal_records
// { exercicio_id, carga_maxima, reps_maximas, data }
```

### 6.2 📊 Volume de Treino por Sessão

Calcular e exibir o volume total por sessão (`soma(carga × reps)` de todas as séries). É a métrica mais importante de progressão de volume e está completamente ausente no histórico.

### 6.3 🔔 Notificação Push de Descanso Concluído

Quando o app está em background (tela bloquada), o timer de descanso atual não funciona. Implementar Web Push Notifications via Service Worker para disparar a notificação mesmo com a tela apagada.

```typescript
// sw.ts — no service worker
// usar self.registration.showNotification() com um setTimeout
```

### 6.4 📅 Planejamento Semanal (Split A/B/C)

Atualmente o usuário precisa escolher manualmente qual rotina vai fazer. Adicionar um "plano semanal" onde ele mapeia cada dia da semana para uma rotina. O app então sugere automaticamente o treino do dia ao abrir.

### 6.5 💪 Progressão Automática (Progressive Overload)

Com base no histórico, o app pode sugerir um aumento de carga quando o usuário concluir todas as séries com RPE abaixo de 7 por 2 treinos seguidos. Isso automatiza a principal regra de musculação.

### 6.6 🔄 Supersets e Dropsets

O modelo atual de `ExercicioNoTreino` é linear. Adicionar um campo opcional `grupo_superset_id` permitiria encadear exercícios para serem executados em sequência sem descanso entre eles.

### 6.7 📤 Compartilhamento de Fichas

Serializar uma `Rotina` em base64 e gerar um link ou QR Code que outro usuário do app pode importar. Funciona 100% offline sem precisar de backend.

---

## 7. Checklist de Qualidade para Próximo Sprint

| Item | Prioridade | Esforço |
|---|---|---|
| Persistência do `activeWorkout` no localStorage | 🔴 Alta | Baixo |
| Timer de descanso configurável por exercício | 🔴 Alta | Médio |
| Substituir `confirm()` por modal customizado | 🔴 Alta | Médio |
| Verificação de integridade ao deletar exercício | 🔴 Alta | Baixo |
| Migração de schema Dexie com `upgrade()` | 🟡 Média | Baixo |
| Try/catch em todas as operações de DB | 🟡 Média | Baixo |
| Toast de feedback ao salvar | 🟠 Normal | Baixo |
| Correção de timezone no calendário | 🟡 Média | Baixo |
| PRs automáticos | 💡 Feature | Alto |
| Volume total por sessão | 💡 Feature | Médio |
| Planejamento semanal | 💡 Feature | Alto |

---

## 8. Conclusão

O projeto tem uma **base técnica sólida e uma visão de produto clara**. O maior risco hoje é operacional: a perda de dados de treino em andamento pode destruir a confiança do usuário no app instantaneamente. Corrija os pontos 🔴 antes de divulgar o app para outras pessoas.

A stack escolhida (Dexie + Zustand + Vite PWA) é adequada e escalável para este domínio. Com as melhorias de confiabilidade aplicadas, o app tem potencial real de substituir soluções pagas como Hevy e Strong para usuários que valorizam privacidade e controle dos próprios dados.

---

*Revisão gerada com base na análise estática dos arquivos: `App.tsx`, `db.ts`, `store.ts`, `WorkoutSession.tsx`, `Biometrics.tsx`, `History.tsx`, `Progress.tsx`, `ExerciseList.tsx`, `ExerciseForm.tsx`, `RoutineList.tsx`, `RoutineForm.tsx`, `Settings.tsx`, `OneRMCalculator.tsx`, `index.css`, `main.tsx`.*
