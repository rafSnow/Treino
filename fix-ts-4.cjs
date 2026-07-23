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
  [/import React, \{ useRef, useState \} from 'react';/, "import React, { useState } from 'react';"],
  [/updatePlano\(index, e\.target\.value\)/g, "updatePlano(index, String(e.target.value))"],
  [/dia_semana: dia, rotina_id: rotinaId/g, "dia_semana: dia, rotina_id: String(rotinaId)"]
]);

patch('ExerciseForm.tsx', [
  [/useState<number \| undefined>/g, "useState<string | undefined>"]
]);

patch('db.ts', [
  [/setDoc, /, ''],
  [/as unknown as T/g, 'as any as T'],
  [/transaction: async \(mode: any, tables: any, callback: \(\) => Promise<void>\)/, "transaction: async (_mode: any, _tables: any, callback: () => Promise<void>)"]
]);

console.log('Patches applied.');
