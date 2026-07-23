const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');

function patch(filename, replacements) {
  const file = path.join(srcDir, filename);
  if (!fs.existsSync(file)) return;
  let content = fs.readFileSync(file, 'utf8');
  for (const [regex, replacement] of replacements) {
    content = content.replace(regex, replacement);
  }
  fs.writeFileSync(file, content, 'utf8');
}

patch('Progress.tsx', [
  [/ex\.exercicio_id === Number\(selectedExercise\)/g, "String(ex.exercicio_id) === String(selectedExercise)"],
  [/e\.exercicio_id === Number\(selectedExercise\)/g, "String(e.exercicio_id) === String(selectedExercise)"]
]);

// For RoutineList: remove db.exercicios.where('id').anyOf(...).toArray()
// replace it with:
// let exs = await db.exercicios.toArray();
// let exerciciosEnvolvidos = exs.filter(ex => rotina.exercicios.some(e => e.exercicio_id === ex.id));
patch('RoutineList.tsx', [
  [/const exerciciosEnvolvidos = await db\.exercicios\n[\s\S]*?\.anyOf\(rotina\.exercicios\.map\(e => e\.exercicio_id\)\)\n[\s\S]*?\.toArray\(\);/g, 
   `const exs = await db.exercicios.toArray();\n    const exerciciosEnvolvidos = exs.filter(ex => rotina.exercicios.some(e => String(e.exercicio_id) === String(ex.id)));`],
  // Also handle another occurrence if not exact match:
  [/const exerciciosEnvolvidos = await db\.exercicios\.where\('id'\)\.anyOf\(rotina\.exercicios\.map\(e => e\.exercicio_id\)\)\.toArray\(\);/g,
   `const exs = await db.exercicios.toArray();\n    const exerciciosEnvolvidos = exs.filter(ex => rotina.exercicios.some(e => String(e.exercicio_id) === String(ex.id)));`],
  [/handleDelete\(rotina\.id, rotina\.nome\)/g, "handleDelete(String(rotina.id), rotina.nome)"],
  [/onClick=\{\(\) => onStartRotina\(rotina\.id\)\}/g, "onClick={() => rotina.id && onStartRotina(String(rotina.id))}"],
  [/onClick=\{\(\) => onEditRotina\(rotina\.id\)\}/g, "onClick={() => rotina.id && onEditRotina(String(rotina.id))}"],
  [/handleShare\(rotina\.id\)/g, "handleShare(String(rotina.id))"],
  [/handleDuplicate\(rotina\.id\)/g, "handleDuplicate(String(rotina.id))"]
]);

console.log('Patches applied.');
