# Análise e Propostas de Evolução - App de Treino Local-First

Este documento apresenta uma análise do estado atual do projeto e sugere melhorias e novas funcionalidades para elevar a maturidade da aplicação.

## 1. Análise Técnica do Estado Atual

### Pontos Fortes
- **Local-First Real:** O uso de Dexie.js (IndexedDB) garante persistência robusta e performance instantânea.
- **Gerenciamento de Estado:** Zustand foi bem aplicado para o "Modo Execução", mantendo o estado do treino isolado da persistência definitiva até a finalização.
- **UI Consistente:** O uso de Tailwind CSS com uma cor primária forte (`#00C896`) e suporte a Dark Mode cria uma identidade visual moderna.
- **Arquitetura PWA:** O setup com `vite-plugin-pwa` e o sistema de backup atendem aos requisitos de autonomia e segurança de dados.

### Oportunidades de Refatoração
- **Componentização:** Alguns componentes (como `WorkoutSession` e `RoutineForm`) estão ficando grandes. Podem ser divididos em sub-componentes (ex: `TimerDisplay`, `SeriesRow`, `ExerciseSelector`).
- **Validação de Formulários:** Atualmente a validação é básica (HTML `required`). O uso de uma biblioteca como `Zod` ou `React Hook Form` traria mais segurança.
- **Sincronização:** Embora seja offline-first, a falta de uma camada opcional de nuvem significa que os dados ficam "presos" no navegador.

---

## 2. Melhorias de UX/UI (Polimento)

### 2.1 Feedback Sensorial (Atenção ao RNF03)
- **Vibração:** Utilizar a `Vibration API` para vibrar o celular quando o cronômetro de descanso chegar a zero.
- **Sons:** Adicionar alertas sonoros discretos para o início e fim de timers (importante para treinos HIIT).
- **Wake Lock:** Implementar a `Screen Wake Lock API` para evitar que a tela do celular apague enquanto o usuário está no modo de execução do treino.

### 2.2 Customização do Timer
- **Timer por Exercício:** Atualmente o timer é fixo em 60s. Permitir configurar o tempo de descanso padrão no cadastro de cada exercício ou dentro da rotina.

### 2.3 Melhoria no Registro de Séries
- **Cópia da Série Anterior:** Ao iniciar um novo treino, carregar automaticamente os pesos/repetições realizados na última sessão daquele exercício como *placeholder*, facilitando a progressão de carga.

---

## 3. Novas Funcionalidades Sugeridas

### 3.1 Gestão de Medidas e Peso (RF12)
- Criar uma aba "Corpo" para registro periódico de peso corporal e medidas (braço, cintura, etc.).
- Gráfico de evolução do peso corporal integrado com o calendário de consistência.

### 3.2 RPE (Percepção de Esforço - RF08)
- Adicionar um seletor de 1 a 10 em cada série para registrar o quão difícil ela foi. Isso é fundamental para atletas avançados ajustarem a intensidade.

### 3.3 Substituição Rápida (RF07)
- Durante a execução do treino, permitir trocar um exercício ("O agachamento está ocupado, vou fazer Leg Press"). O sistema deve permitir buscar no catálogo e substituir apenas naquela sessão.

### 3.4 Calculadora de 1RM (Repetição Máxima)
- Uma ferramenta simples onde o usuário insere o peso e as repetições feitas para estimar sua carga máxima teórica.

### 3.5 Exportação para CSV/Excel
- Além do backup em JSON, permitir exportar o histórico de treinos em formato tabular para usuários que gostam de fazer análises próprias no Excel.

---

## 4. Evolução de Infraestrutura

### 4.1 Sincronização em Nuvem Opcional
- Implementar integração com **Supabase** ou **Firebase** apenas para sincronização entre dispositivos, mantendo o Dexie como a "fonte da verdade" local (arquitetura de sincronização).

### 4.2 Testes Automatizados
- Adicionar testes de integração com `Cypress` ou `Playwright` focados no fluxo crítico: Criar Exercício -> Criar Rotina -> Iniciar Treino -> Finalizar -> Verificar Histórico.

---

## 5. Próximo Roadmap Sugerido

### Sprint 7: Biometria e RPE
* [ ] Implementar tela de Medidas Corporais.
* [ ] Adicionar campo de RPE nas séries do treino ativo.
* [ ] Gráfico de evolução de peso corporal.

### Sprint 8: Inteligência e Facilitação
* [ ] Implementar o "Sugestão de Carga" baseado no treino anterior.
* [ ] Adicionar calculadora de 1RM.
* [ ] Adicionar sons e vibração no Timer.
