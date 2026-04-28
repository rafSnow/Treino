# Roadmap de Desenvolvimento - App de Treino PWA

Este roadmap divide o projeto em 6 Sprints lógicas, focadas em entregar valor contínuo e testável desde o início. Sendo um app *local-first*, a persistência de dados é resolvida logo na primeira etapa.

---

## Sprint 1: Fundação, Arquitetura e Configuração (Setup)
**Objetivo:** Ter a aplicação rodando localmente, configurada como PWA e com o banco de dados local estruturado.

* [ ] Inicializar o projeto com Next.js (ou Vite) + TypeScript.
* [ ] Configurar o Tailwind CSS (incluindo a paleta de cores, definindo a cor primária como `#00C896`).
* [ ] Configurar o manifesto PWA e o Service Worker (`next-pwa` ou `vite-plugin-pwa`).
* [ ] Instalar e configurar o Dexie.js.
* [ ] Criar a classe/schema do banco local definindo as tabelas: `exercicios`, `rotinas`, `sessoes` e `configuracoes`.
* [ ] Testar a persistência: Inserir um dado *mock* no Dexie e verificar se ele sobrevive ao recarregar a página (F15).

## Sprint 2: Catálogo de Exercícios (CRUD)
**Objetivo:** Permitir que o usuário gerencie os exercícios que farão parte das rotinas.

* [ ] Criar tela de Listagem de Exercícios com barra de busca.
* [ ] Criar formulário de Cadastro/Edição de Exercício.
* [ ] Implementar a lógica de salvar/atualizar no Dexie.js.
* [ ] Adicionar o sistema de Tags (Grupo Muscular, "Sem impacto", "Sentado", etc.) para facilitar a busca.
* [ ] Criar a funcionalidade de deletar exercício (com alerta de confirmação).

## Sprint 3: Construtor de Fichas e Rotinas
**Objetivo:** Criar os templates de treino (Ex: Treino A, Treino de Recuperação).

* [ ] Criar tela de Listagem de Rotinas.
* [ ] Criar interface de Criação de Rotina.
* [ ] Implementar a seleção de exercícios do catálogo para adicionar à rotina.
* [ ] Configurar os inputs de metas por exercício dentro da rotina (ex: 3 séries, 10-12 repetições).
* [ ] Permitir a reordenação dos exercícios na rotina (ordenar listas).

## Sprint 4: O "Play" do Treino (Modo Execução)
**Objetivo:** A tela principal de uso na academia. Deve ser à prova de falhas e rápida.

* [ ] Configurar o Zustand para gerenciar o estado da sessão de treino atual (em andamento).
* [ ] Criar a interface de Execução: exibir a lista de exercícios do dia com as metas.
* [ ] Implementar os botões de *check* para marcar séries como concluídas, registrando a carga real e repetições reais.
* [ ] Adicionar o Cronômetro de Descanso (Timer) que inicia automaticamente ao concluir uma série.
* [ ] Criar o botão de "Finalizar Treino", que compila os dados da sessão e salva a `SessaoTreino` definitiva no Dexie.js.

## Sprint 5: Dashboard e Histórico de Evolução
**Objetivo:** Mostrar ao usuário que o esforço está gerando resultados.

* [ ] Desenvolver a tela de Histórico (lista cronológica das sessões concluídas).
* [ ] Criar o Calendário de Consistência (destacando dias de treino no mês atual).
* [ ] Implementar gráficos de progressão (ex: selecionar "Agachamento" e ver um gráfico de linha do peso máximo levantado ao longo do tempo).
* [ ] *Opcional:* Tela para registro e gráfico de peso corporal.

## Sprint 6: Configurações, Backup e Polimento Final
**Objetivo:** Garantir que o usuário não perca seus dados e melhorar a experiência (UX).

* [ ] Criar o serviço de Exportação de Dados: ler todo o Dexie.js e gerar um download de `backup_treino.json`.
* [ ] Criar o serviço de Importação de Dados: ler o `.json` e reidratar o banco local.
* [ ] Revisão de UX Mobile-first: aumentar áreas de clique (touch targets) e revisar os contrastes do Tailwind.
* [ ] Teste offline final: Desligar o Wi-Fi/4G do celular, abrir o PWA, fazer um treino e verificar se salva e sincroniza corretamente.
* [ ] Preparar para build de produção (*Static HTML Export* se usar Next.js).
