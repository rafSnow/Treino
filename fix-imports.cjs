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
  [/import \{ useLiveQuery \} from 'dexie-react-hooks';\n/g, '']
]);

patch('RoutineForm.tsx', [
  [/import \{ useLiveQuery \} from 'dexie-react-hooks';\n/g, '']
]);

patch('RoutineList.tsx', [
  [/import \{ useLiveQuery \} from 'dexie-react-hooks';\n/g, '']
]);

console.log('Patches applied.');
