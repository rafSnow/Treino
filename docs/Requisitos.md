# Documento de Requisitos - App de Treino Local-First (PWA)

## 1. Visão Geral
O objetivo é desenvolver um Progressive Web App (PWA) focado em mobilidade e performance para registro de treinos de musculação e cardio. O sistema deve ser "offline-first", funcionando inteiramente sem conexão com internet, utilizando o armazenamento local do navegador para persistência de dados.

## 2. Tecnologias Sugeridas
- **Frontend:** Next.js 14+ ou Vite (React) com TypeScript.
- **Estilização:** Tailwind CSS (Mobile-first).
- **Banco de Dados Local:** IndexedDB com a biblioteca **Dexie.js**.
- **Gerenciamento de Estado:** Zustand (para sessões de treino ativas e timers).
- **Service Workers:** `next-pwa` ou `vite-plugin-pwa` para suporte offline.

## 3. Requisitos Funcionais (RF)

### 3.1 Gestão de Exercícios e Rotinas
- **RF01 - Catálogo de Exercícios:** O usuário deve poder cadastrar exercícios informando nome, grupo muscular e tipo (carga/repetição ou tempo/distância).
- **RF02 - Sistema de Tags de Mobilidade:** Permitir a marcação de exercícios com tags como "Sentado", "Sem impacto" ou "Fisioterapia". 
    - *Utilidade:* Filtrar opções de treino em casos de limitações temporárias de movimento (ex: lesões em membros inferiores).
- **RF03 - Montagem de Fichas (Rotinas):** O usuário deve poder criar rotinas (ex: Treino A, B, C) e adicionar exercícios do catálogo a elas, definindo ordem e metas.
- **RF04 - Histórico de Treinos:** Listagem cronológica de todas as sessões de treino finalizadas.

### 3.2 Execução de Treino (Modo Ativo)
- **RF05 - Registro de Séries em Tempo Real:** Interface otimizada para marcar séries como concluídas, permitindo ajustar carga e repetições na hora.
- **RF06 - Cronômetro de Descanso Automático:** Disparar um temporizador ao concluir uma série, com feedback visual/vibratório.
- **RF07 - Substituição Rápida de Exercício:** Permitir trocar um exercício da rotina por outro do catálogo durante a execução do treino.
- **RF08 - Percepção de Esforço (RPE):** Registro de uma nota de 1 a 10 após cada série ou exercício.
- **RF09 - Modo HIIT / Timer:** Cronômetro configurável para treinos intervalados com avisos sonoros de transição.

### 3.3 Métricas e Progresso
- **RF10 - Gráfico de Progressão de Carga:** Visualização da evolução do peso levantado em exercícios específicos ao longo do tempo.
- **RF11 - Calendário de Consistência:** Mapa de calor ou calendário destacando os dias de atividade.
- **RF12 - Registro de Peso Corporal:** Acompanhamento simples da variação de peso do usuário.

### 3.4 Gestão de Dados (Local-First)
- **RF13 - Exportação de Backup:** Gerar um arquivo `.json` com todos os dados do banco local para download.
- **RF14 - Importação de Backup:** Restaurar dados a partir de um arquivo `.json` previamente exportado.

## 4. Requisitos Não Funcionais (RNF)
- **RNF01 - Offline-First:** O app deve ser totalmente funcional sem internet após o primeiro carregamento.
- **RNF02 - Persistência Segura:** Utilizar IndexedDB para garantir que os dados não sejam apagados pelo sistema operacional em limpezas de cache automáticas.
- **RNF03 - UI Mobile-First:** Interface pensada para uso com apenas uma mão e botões grandes para fácil interação durante o exercício.
- **RNF04 - Latência Zero:** As transições de tela e salvamento de dados devem ser instantâneos, sem esperar por respostas de rede.
- **RNF05 - PWA Installable:** Atender a todos os critérios do manifesto PWA para instalação na tela inicial.

## 5. Modelo de Dados (Entidades)
- **Exercicio:** { id, nome, categoria, tipo, tags, notas_padrao }
- **Rotina:** { id, nome, exercicios_ids: [] }
- **SessaoTreino:** { id, rotina_id, data_inicio, data_fim, exercicios_realizados: [] }
- **Serie:** { id, exercicio_id, carga, repeticoes, rpe, tempo, concluida }
- **Usuario:** { peso_atual, data_ultimo_backup }
