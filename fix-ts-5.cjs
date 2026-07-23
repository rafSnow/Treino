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

patch('db.ts', [
  [/constructor\(private name: string\) \{\}/, "private name: string;\n  constructor(name: string) { this.name = name; }"]
]);

patch('ExerciseList.tsx', [
  [/=== id\)\)\.length;/g, "=== String(id))).length;"],
  [/db\.exercicios\.delete\(id\)/, "db.exercicios.delete(String(id))"],
  [/handleDelete\(ex\.id, ex\.nome\)/, "handleDelete(String(ex.id), ex.nome)"]
]);

patch('Progress.tsx', [
  [/import \{ useLiveQuery \} from 'dexie-react-hooks';\n/, ''],
  [/import \{ db \} from '.\/db';\n/, '']
]);

patch('RoutineForm.tsx', [
  [/import \{ useLiveQuery \} from 'dexie-react-hooks';\n/, '']
]);

patch('RoutineList.tsx', [
  [/import \{ useLiveQuery \} from 'dexie-react-hooks';\n/, '']
]);

console.log('Patches applied.');
