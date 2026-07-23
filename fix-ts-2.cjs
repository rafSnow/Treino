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

patch('Settings.tsx', [
  [/import { Download, Upload, /, 'import { '],
  [/const \[isExporting, setIsExporting\] = useState\(false\);\n  const \[isImporting, setIsImporting\] = useState\(false\);\n  const fileInputRef = useRef<HTMLInputElement>\(null\);\n/, ''],
  [/await db\.plano_semanal\.put\(\{ dia_semana: dia, rotina_id: Number\(rotinaId\) \}\);/, 'await db.plano_semanal.put({ dia_semana: dia, rotina_id: rotinaId });']
]);

patch('ExerciseForm.tsx', [
  [/Number\(id\)/g, 'id'],
  [/\.sortBy\('data'\)/, '.toArray().then(arr => arr.sort((a,b) => new Date(a.data).getTime() - new Date(b.data).getTime()))']
]);

patch('ExerciseList.tsx', [
  [/db\.exercicios\.orderBy\('nome'\)\.toArray\(\)/, 'db.exercicios.toArray().then(arr => arr.sort((a,b) => a.nome.localeCompare(b.nome)))'],
  [/await db\.rotinas\n\s*\.filter\(r => r\.exercicios\.some\(e => e\.exercicio_id === id\)\)\n\s*\.toArray\(\)/, 'await db.rotinas.toArray().then(arr => arr.filter(r => r.exercicios.some(e => e.exercicio_id === id)))'],
  [/await db\.sessoes\n\s*\.filter\(s => s\.exercicios_realizados\.some\(e => e\.exercicio_id === id\)\)\n\s*\.toArray\(\)/, 'await db.sessoes.toArray().then(arr => arr.filter(s => s.exercicios_realizados.some(e => e.exercicio_id === id)))'],
  [/Object\.keys\(grouped\)/, '(Object.keys(grouped) as string[])'],
  [/\[categoria\]\.map/g, '[categoria as string].map']
]);

patch('RoutineList.tsx', [
  [/db\.exercicios\.where\('id'\)\.anyOf\(exerciseIds\)\.toArray\(\)/, 'db.exercicios.toArray().then(arr => arr.filter(e => exerciseIds.includes(e.id!)))']
]);

patch('seed.ts', [
  [/await db\.transaction\('rw', db\.exercicios, db\.rotinas, async \(\) => {/, "await db.transaction('rw', null, async () => {"]
]);

patch('db.ts', [
  [/import \{ User \} from 'firebase\/auth';/, "import type { User } from 'firebase/auth';"]
]);

patch('AuthContext.tsx', [
  [/import \{ User, /, "import type { User } from 'firebase/auth';\nimport { "]
]);

console.log('Patches applied.');
