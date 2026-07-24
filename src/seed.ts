import { db } from './db';

const parseRest = (rest: string) => {
  if (rest.includes('3-4 min') || rest.includes('3-5 min')) return 210;
  if (rest.includes('2-3 min')) return 150;
  if (rest.includes('1-2 min')) return 90;
  if (rest === '0 min') return 0;
  return 120;
};

export const seedDatabase = async () => {
  const rotinaTeste = await db.rotinas.where('nome').equals('Push #1').first();
  if (rotinaTeste) {
    console.log("Found English seed, clearing database to replace with Portuguese...");
    await db.exercicios.clear();
    await db.rotinas.clear();
  } else {
    const exCount = await db.exercicios.count();
    const rotCount = await db.rotinas.count();
    if (exCount > 0 && rotCount > 0) return; // Already seeded
    
    // If we have partial seed, let's clear it and try again to avoid duplicates
    if (exCount > 0 || rotCount > 0) {
      console.log("Partial seed detected, clearing to try again...");
      await db.exercicios.clear();
      await db.rotinas.clear();
    }
  }

  console.log("Seeding database (PT-BR)...");

  const rawExercises = [
    // Treino Empurrar (Push)
    { nome: "Supino Reto", cat: "Peito", subs: ["Supino Reto com Halteres", "Supino Máquina"], note: "Ajuste um arco confortável, faça uma pausa rápida no peito e suba de forma explosiva em cada repetição" },
    { nome: "Supino Reto com Halteres", cat: "Peito", subs: [], note: "" },
    { nome: "Supino Máquina", cat: "Peito", subs: [], note: "" },
    { nome: "Supino Larsen", cat: "Peito", subs: ["Supino Reto com Halteres (Sem Apoio de Perna)", "Supino Máquina (Sem Apoio de Perna)"], note: "Escápulas retraídas e deprimidas. Leve arco na parte superior das costas. Zero impulso com as pernas." },
    { nome: "Supino Reto com Halteres (Sem Apoio de Perna)", cat: "Peito", subs: [], note: "" },
    { nome: "Supino Máquina (Sem Apoio de Perna)", cat: "Peito", subs: [], note: "" },
    { nome: "Desenvolvimento Arnold em Pé", cat: "Ombros", subs: ["Desenvolvimento Sentado com Halteres", "Desenvolvimento Máquina"], note: "Comece com os cotovelos à frente e as palmas viradas para dentro. Gire os halteres para que as palmas fiquem para frente ao subir." },
    { nome: "Desenvolvimento Sentado com Halteres", cat: "Ombros", subs: [], note: "" },
    { nome: "Desenvolvimento Máquina", cat: "Ombros", subs: [], note: "" },
    { nome: "Crossover Unilateral (Press-Around)", cat: "Peito", subs: ["Crucifixo com Halteres", "Flexão com Déficit"], note: "Estabilize com o braço que não está trabalhando, esprema o peitoral pressionando o cabo através do corpo" },
    { nome: "Crucifixo com Halteres", cat: "Peito", subs: [], note: "" },
    { nome: "Flexão com Déficit", cat: "Peito", subs: [], note: "" },
    { nome: "Alongamento Estático de Peitoral (30s)", cat: "Peito", subs: [], note: "Mantenha o alongamento do peitoral por 30 segundos com uma intensidade de cerca de 7/10.", tipo: "tempo" },
    { nome: "Elevação Lateral Y na Polia Cruzada", cat: "Ombros", subs: ["Elevação Lateral com Halteres", "Elevação Lateral Máquina"], note: "Pense em jogar o cabo para fora e para cima como se estivesse 'desembainhando uma espada'" },
    { nome: "Elevação Lateral com Halteres", cat: "Ombros", subs: [], note: "" },
    { nome: "Elevação Lateral Máquina", cat: "Ombros", subs: [], note: "" },
    { nome: "Tríceps Pulley (Só Contração) + Tríceps Testa (Só Alongamento)", cat: "Braços", subs: ["Tríceps Pulley", "Tríceps Testa com Halteres"], note: "Faça a segunda metade da amplitude no pulley ('a contração') e a primeira metade da amplitude na extensão testa ('o alongamento')" },
    { nome: "Tríceps Pulley", cat: "Braços", subs: [], note: "" },
    { nome: "Tríceps Testa com Halteres", cat: "Braços", subs: [], note: "" },
    { nome: "Tríceps Cruzado na Polia (Estilo N1)", cat: "Braços", subs: ["Tríceps Pulley Unilateral", "Tríceps Coice na Polia"], note: "Estenda o tríceps com o braço mais para o lado do que em um pulley normal. Sinta o alongamento enquanto o cabo passa pelo tronco" },
    { nome: "Tríceps Pulley Unilateral", cat: "Braços", subs: [], note: "" },
    { nome: "Tríceps Coice na Polia", cat: "Braços", subs: [], note: "" },
    
    // Treino Puxar (Pull)
    { nome: "Puxada Frontal (Séries de Aquecimento)", cat: "Costas", subs: ["Puxada Máquina", "Barra Fixa"], note: "Faça 4 séries de aquecimento de 10 repetições aumentando o peso gradualmente. Série 1 é leve (RPE 4-5). Série 4 é pesada: tente chegar à falha em 10 repetições." },
    { nome: "Puxada Máquina", cat: "Costas", subs: [], note: "" },
    { nome: "Barra Fixa", cat: "Costas", subs: [], note: "" },
    { nome: "Puxada Frontal (Série até a Falha)", cat: "Costas", subs: ["Puxada Máquina", "Barra Fixa"], note: "Após falhar nas ~10 repetições, faça um dropset. Reduza o peso de 30-50% e faça mais 5 repetições controladas." },
    { nome: "Remada Máquina com Apoio de Peito (Pegada Variada)", cat: "Costas", subs: ["Remada com Halteres no Banco Inclinado", "Remada Baixa na Polia"], note: "Use 3 pegadas diferentes nas 3 séries (idealmente indo da mais aberta para a mais fechada)" },
    { nome: "Remada com Halteres no Banco Inclinado", cat: "Costas", subs: [], note: "" },
    { nome: "Remada Baixa na Polia", cat: "Costas", subs: [], note: "" },
    { nome: "Pullover com Halteres (Metade Inferior)", cat: "Costas", subs: ["Pullover na Polia", "Puxada Unilateral Fechada"], note: "Faça o pullover, mas corte a metade superior do movimento (fique apenas na fase de maior alongamento)" },
    { nome: "Pullover na Polia", cat: "Costas", subs: [], note: "" },
    { nome: "Puxada Unilateral Fechada", cat: "Costas", subs: [], note: "" },
    { nome: "Alongamento Estático de Dorsal (30s)", cat: "Costas", subs: [], note: "Mantenha o alongamento de dorsal por 30 segundos com intensidade de 7/10.", tipo: "tempo" },
    { nome: "Face Pull (Várias Direções)", cat: "Costas", subs: ["Crucifixo Invertido na Polia", "Crucifixo Invertido com Halteres"], note: "1ª série: de baixo para cima, 2ª série: altura média, 3ª série: de cima para baixo" },
    { nome: "Crucifixo Invertido na Polia", cat: "Costas", subs: [], note: "" },
    { nome: "Crucifixo Invertido com Halteres", cat: "Costas", subs: [], note: "" },
    { nome: "Rosca Direta com Barra EZ", cat: "Braços", subs: ["Rosca Direta com Halteres", "Rosca Direta na Polia"], note: "Foque na contração dos bíceps, minimize o balanço do tronco" },
    { nome: "Rosca Direta com Halteres", cat: "Braços", subs: [], note: "" },
    { nome: "Rosca Direta na Polia", cat: "Braços", subs: [], note: "" },
    { nome: "Rosca Scott (Metade Inferior)", cat: "Braços", subs: ["Rosca Spider (Metade Inferior)", "Rosca Bayesiana (Metade Inferior)"], note: "Faça a rosca scott, mas corte a metade superior do movimento (fique apenas na fase de maior alongamento)" },
    { nome: "Rosca Spider (Metade Inferior)", cat: "Braços", subs: [], note: "" },
    { nome: "Rosca Bayesiana (Metade Inferior)", cat: "Braços", subs: [], note: "" },

    // Treino Pernas (Legs)
    { nome: "Agachamento Livre", cat: "Pernas", subs: ["Agachamento Hack", "Agachamento Búlgaro com Halteres"], note: "Jogue os quadris para trás e para baixo, mantenha as costas firmes na barra" },
    { nome: "Agachamento Hack", cat: "Pernas", subs: [], note: "" },
    { nome: "Agachamento Búlgaro com Halteres", cat: "Pernas", subs: [], note: "" },
    { nome: "Agachamento com Pausa (Série de Back-off)", cat: "Pernas", subs: ["Agachamento Hack com Pausa", "Agachamento Búlgaro com Pausa"], note: "Reduza o peso em ~25% da sua série mais pesada. Pausa de 2 segundos. Jogue os quadris para trás e para baixo." },
    { nome: "Agachamento Hack com Pausa", cat: "Pernas", subs: [], note: "" },
    { nome: "Agachamento Búlgaro com Pausa", cat: "Pernas", subs: [], note: "" },
    { nome: "RDL com Barra", cat: "Pernas", subs: ["RDL com Halteres", "Extensão Lombar 45°"], note: "Mantenha a lombar neutra, jogue os quadris para trás, não deixe a coluna curvar" },
    { nome: "RDL com Halteres", cat: "Pernas", subs: [], note: "" },
    { nome: "Extensão Lombar 45°", cat: "Pernas", subs: [], note: "" },
    { nome: "Passada (Avanço)", cat: "Pernas", subs: ["Subida no Banco com Halteres", "Agachamento Goblet"], note: "Dê passos médios, minimize o impulso feito com a perna de trás" },
    { nome: "Subida no Banco com Halteres", cat: "Pernas", subs: [], note: "" },
    { nome: "Agachamento Goblet", cat: "Pernas", subs: [], note: "" },
    { nome: "Cadeira Flexora", cat: "Pernas", subs: ["Mesa Flexora", "Flexão Nórdica"], note: "Foque em contrair os posteriores de coxa para mover o peso" },
    { nome: "Mesa Flexora", cat: "Pernas", subs: [], note: "" },
    { nome: "Flexão Nórdica", cat: "Pernas", subs: [], note: "" },
    { nome: "Panturrilha no Leg Press", cat: "Pernas", subs: ["Panturrilha Sentado (Máquina)", "Panturrilha em Pé (Máquina)"], note: "Empurre até a ponta dos pés, alongue as panturrilhas na descida, sem quicar" },
    { nome: "Panturrilha Sentado (Máquina)", cat: "Pernas", subs: [], note: "" },
    { nome: "Panturrilha em Pé (Máquina)", cat: "Pernas", subs: [], note: "" },
    { nome: "Abdominal Declinado com Anilha", cat: "Core", subs: ["Abdominal na Polia", "Abdominal Máquina"], note: "Segure uma anilha ou halter no peito e contraia o abdômen com força!" },
    { nome: "Abdominal na Polia", cat: "Core", subs: [], note: "" },
    { nome: "Abdominal Máquina", cat: "Core", subs: [], note: "" },

    // Treino Superior (Upper)
    { nome: "Barra Fixa (Superior)", cat: "Costas", subs: ["Puxada Frontal", "Puxada Máquina"], note: "Pegada 1.5x a largura dos ombros, puxe o peito em direção à barra" },
    { nome: "Puxada Frontal", cat: "Costas", subs: [], note: "" },
    { nome: "Supino Inclinado Fechado com Barra", cat: "Peito", subs: ["Supino Inclinado Fechado com Halteres", "Supino Fechado Máquina"], note: "Use um banco com inclinação de ~45° e pegada ligeiramente mais larga que os ombros" },
    { nome: "Supino Inclinado Fechado com Halteres", cat: "Peito", subs: [], note: "" },
    { nome: "Supino Fechado Máquina", cat: "Peito", subs: [], note: "" },
    { nome: "Remada Serrote (Kroc Row)", cat: "Costas", subs: ["Remada Unilateral com Halter", "Remada Meadows"], note: "Remada Serrote (Kroc Row) é uma remada com halter com um leve impulso. Não tenha medo de colocar peso e usar straps." },
    { nome: "Remada Unilateral com Halter", cat: "Costas", subs: [], note: "" },
    { nome: "Remada Meadows", cat: "Costas", subs: [], note: "" },
    { nome: "Elevação Lateral Polia (Fase Excêntrica Lenta) + Elevação Lateral Polia (Tensão Constante)", cat: "Ombros", subs: ["Elevação Lateral com Halteres", "Elevação Lateral Máquina"], note: "Primeiras 5 reps: descida de 5 segundos. Últimas 15 reps: tensão constante (sem pausa embaixo ou em cima)" },
    { nome: "Rosca Cruzada na Polia (Estilo N1)", cat: "Braços", subs: ["Rosca Inclinada com Halteres", "Rosca Direta com Halteres"], note: "Cruze o corpo puxando com o braço a ~60° de abertura lateral" },
    { nome: "Rosca Inclinada com Halteres", cat: "Braços", subs: [], note: "" },
    { nome: "Flexão Diamante", cat: "Peito", subs: ["Flexão Fechada", "Flexão de Joelhos"], note: "Mãos juntas formando um diamante no chão, faça o máximo de repetições possíveis (AMRAP)" },
    { nome: "Flexão Fechada", cat: "Peito", subs: [], note: "" },
    { nome: "Flexão de Joelhos", cat: "Peito", subs: [], note: "" },

    // Treino Inferior (Lower)
    { nome: "Levantamento Terra", cat: "Pernas", subs: ["Levantamento Terra com Trap Bar", "Elevação Pélvica com Barra"], note: "Estabilize os dorsais, peito estufado, tire a folga da barra antes de puxar" },
    { nome: "Levantamento Terra com Trap Bar", cat: "Pernas", subs: [], note: "" },
    { nome: "Elevação Pélvica com Barra", cat: "Pernas", subs: [], note: "" },
    { nome: "Stiff com Barra", cat: "Pernas", subs: ["RDL com Barra", "RDL com Halteres"], note: "Pense em fazer um terra convencional com quadril alto e leve dobra nos joelhos" },
    { nome: "Leg Press", cat: "Pernas", subs: ["Agachamento Goblet", "Passada (Avanço)"], note: "Pés na largura dos ombros, não deixe a lombar arredondar no final do movimento" },
    { nome: "Glute Ham Raise (GHR)", cat: "Pernas", subs: ["Flexão Nórdica", "Mesa Flexora"], note: "Mantenha o quadril reto. Faça flexão nórdica se não tiver máquina de GHR" },
    { nome: "Cadeira Extensora (Fase Excêntrica Lenta)", cat: "Pernas", subs: ["Subida no Banco com Halteres", "Agachamento Goblet"], note: "Controle o peso com uma fase negativa de 3 a 4 segundos" },
    { nome: "Elevação de Pernas na Cadeira Romana", cat: "Core", subs: ["Elevação de Pernas Suspenso", "Abdominal Reverso"], note: "Não balance as pernas embaixo, evite impulsos. Flexione os joelhos se levantar as pernas retas for muito difícil" },
    { nome: "Elevação de Pernas Suspenso", cat: "Core", subs: [], note: "" },
    { nome: "Abdominal Reverso", cat: "Core", subs: [], note: "" }
  ];

  // Remove duplicatas
  const uniqueExercises = Array.from(new Map(rawExercises.map(item => [item.nome, item])).values());
  const exerciseIds = new Map<string, string>();

  await db.transaction('rw', null, async () => {
    for (const ex of uniqueExercises) {
      const id = await db.exercicios.add({
        nome: ex.nome,
        categoria: ex.cat,
        tipo: ((ex as any).tipo as 'carga'|'tempo') || 'carga',
        tags: [ex.cat],
        ajuda: ex.note
      });
      exerciseIds.set(ex.nome, id as string);
    }

    for (const ex of uniqueExercises) {
      if (ex.subs && ex.subs.length > 0) {
        const sub1 = exerciseIds.get(ex.subs[0]);
        const sub2 = ex.subs.length > 1 ? exerciseIds.get(ex.subs[1]) : undefined;
        await db.exercicios.update(exerciseIds.get(ex.nome)!, {
          substituicao1_id: sub1,
          substituicao2_id: sub2
        });
      }
    }

    const routinesRaw = [
      {
        nome: "Treino Push 1 (Empurrar)",
        exercicios: [
          { nome: "Supino Reto", warm: 4, work: 1, reps: "3-5", rest: "3-4 min" },
          { nome: "Supino Larsen", warm: 0, work: 2, reps: "10", rest: "3-4 min" },
          { nome: "Desenvolvimento Arnold em Pé", warm: 2, work: 3, reps: "8-10", rest: "2-3 min" },
          { nome: "Crossover Unilateral (Press-Around)", warm: 1, work: 2, reps: "12-15", rest: "0 min" },
          { nome: "Alongamento Estático de Peitoral (30s)", warm: 0, work: 2, reps: "30s HOLD", rest: "0 min", tipo: "tempo" },
          { nome: "Elevação Lateral Y na Polia Cruzada", warm: 1, work: 3, reps: "12-15", rest: "1-2 min" },
          { nome: "Tríceps Pulley (Só Contração) + Tríceps Testa (Só Alongamento)", warm: 1, work: 3, reps: "8 + 8", rest: "1-2 min" },
          { nome: "Tríceps Cruzado na Polia (Estilo N1)", warm: 0, work: 2, reps: "10-12", rest: "1-2 min" }
        ]
      },
      {
        nome: "Treino Pull 1 (Puxar)",
        exercicios: [
          { nome: "Puxada Frontal (Séries de Aquecimento)", warm: 0, work: 4, reps: "10", rest: "2-3 min" },
          { nome: "Puxada Frontal (Série até a Falha)", warm: 0, work: 1, reps: "10+5", rest: "2-3 min" },
          { nome: "Remada Máquina com Apoio de Peito (Pegada Variada)", warm: 2, work: 3, reps: "10-12", rest: "2-3 min" },
          { nome: "Pullover com Halteres (Metade Inferior)", warm: 1, work: 2, reps: "10-12", rest: "0 min" },
          { nome: "Alongamento Estático de Dorsal (30s)", warm: 0, work: 2, reps: "30s HOLD", rest: "0 min", tipo: "tempo" },
          { nome: "Face Pull (Várias Direções)", warm: 1, work: 3, reps: "12-15", rest: "1-2 min" },
          { nome: "Rosca Direta com Barra EZ", warm: 1, work: 3, reps: "6-8", rest: "1-2 min" },
          { nome: "Rosca Scott (Metade Inferior)", warm: 0, work: 2, reps: "10-12", rest: "1-2 min" }
        ]
      },
      {
        nome: "Treino Pernas 1",
        exercicios: [
          { nome: "Agachamento Livre", warm: 4, work: 1, reps: "2-4", rest: "3-4 min" },
          { nome: "Agachamento com Pausa (Série de Back-off)", warm: 0, work: 2, reps: "5", rest: "3-4 min" },
          { nome: "RDL com Barra", warm: 2, work: 3, reps: "8-10", rest: "2-3 min" },
          { nome: "Passada (Avanço)", warm: 1, work: 2, reps: "10", rest: "2-3 min" },
          { nome: "Cadeira Flexora", warm: 1, work: 3, reps: "10-12", rest: "1-2 min" },
          { nome: "Panturrilha no Leg Press", warm: 1, work: 4, reps: "10-12", rest: "1-2 min" },
          { nome: "Abdominal Declinado com Anilha", warm: 1, work: 3, reps: "10-12", rest: "1-2 min" }
        ]
      },
      {
        nome: "Treino Superior 1",
        exercicios: [
          { nome: "Barra Fixa (Superior)", warm: 2, work: 2, reps: "8-10", rest: "2-3 min" },
          { nome: "Supino Inclinado Fechado com Barra", warm: 3, work: 3, reps: "8, 5, 12", rest: "3-4 min" },
          { nome: "Remada Serrote (Kroc Row)", warm: 2, work: 3, reps: "10-12", rest: "2-3 min" },
          { nome: "Elevação Lateral Polia (Fase Excêntrica Lenta) + Elevação Lateral Polia (Tensão Constante)", warm: 1, work: 3, reps: "5, 15", rest: "1-2 min" },
          { nome: "Rosca Cruzada na Polia (Estilo N1)", warm: 1, work: 3, reps: "10-12", rest: "1-2 min" },
          { nome: "Flexão Diamante", warm: 0, work: 1, reps: "AMRAP", rest: "0 min" }
        ]
      },
      {
        nome: "Treino Inferior 1",
        exercicios: [
          { nome: "Levantamento Terra", warm: 4, work: 1, reps: "5", rest: "3-5 min" },
          { nome: "Stiff com Barra", warm: 0, work: 2, reps: "8", rest: "3-4 min" },
          { nome: "Leg Press", warm: 3, work: 4, reps: "10-12", rest: "2-3 min" },
          { nome: "Glute Ham Raise (GHR)", warm: 1, work: 3, reps: "8-10", rest: "1-2 min" },
          { nome: "Cadeira Extensora (Fase Excêntrica Lenta)", warm: 1, work: 3, reps: "8-10", rest: "1-2 min" },
          { nome: "Panturrilha Sentado (Máquina)", warm: 1, work: 4, reps: "15-20", rest: "1-2 min" },
          { nome: "Elevação de Pernas na Cadeira Romana", warm: 1, work: 3, reps: "10-20", rest: "1-2 min" }
        ]
      }
    ];

    for (const r of routinesRaw) {
      await db.rotinas.add({
        nome: r.nome,
        exercicios: r.exercicios.map(ex => ({
          exercicio_id: exerciseIds.get(ex.nome)!,
          series_aquecimento: ex.warm,
          series_trabalho: ex.work,
          tempo_descanso: parseRest(ex.rest),
          metas: {
            repeticoes: (ex as any).tipo === "tempo" ? undefined : ex.reps,
            tempo: (ex as any).tipo === "tempo" ? 30 : undefined
          }
        }))
      });
    }
  });
  
  console.log("Database seeded successfully (PT-BR)!");
};
