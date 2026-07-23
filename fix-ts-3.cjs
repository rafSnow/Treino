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

patch('App.tsx', [
  [/import \{ db, useCollection \} from '.\/db';/, "import { db } from './db';"],
  [/const isLoaded = useLiveQuery\([\s\S]*?\}\);/m, ''],
  [/if \(isLoaded === undefined\) \{\n    return <SplashScreen \/>;\n  \}/m, '']
]);

patch('ExerciseList.tsx', [
  [/import \{ useCollection \} from '.\/db';\n/, ''],
  [/import \{ useLiveQuery \} from 'dexie-react-hooks';\n/, '']
]);

patch('History.tsx', [
  [/import \{ db, type SessaoTreino \} from '.\/db';/, "import { type SessaoTreino } from './db';"]
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
