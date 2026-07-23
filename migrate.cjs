const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.tsx'));

for (const file of files) {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');

  if (!content.includes('useLiveQuery')) continue;

  console.log('Migrando', file);

  // Remove import
  content = content.replace(/import { useLiveQuery } from 'dexie-react-hooks';?\n/g, '');

  // Add useCollection to db import
  if (content.includes("import { db } from './db'")) {
    content = content.replace(/import { db } from '\.\/db';?/, "import { db, useCollection } from './db';");
  } else if (!content.includes('useCollection')) {
    content = "import { useCollection } from './db';\n" + content;
  }

  // Replace orderBy + reverse
  content = content.replace(/useLiveQuery\(\s*\(\)\s*=>\s*db\.(\w+)\.orderBy\('([^']+)'\)\.reverse\(\)\.toArray\(\)\s*\)/g, "useCollection<any>('$1', '$2', true)");
  
  // Replace orderBy only
  content = content.replace(/useLiveQuery\(\s*\(\)\s*=>\s*db\.(\w+)\.orderBy\('([^']+)'\)\.toArray\(\)\s*\)/g, "useCollection<any>('$1', '$2')");

  // Replace toArray
  content = content.replace(/useLiveQuery\(\s*\(\)\s*=>\s*db\.(\w+)\.toArray\(\)\s*\)/g, "useCollection<any>('$1')");

  fs.writeFileSync(filePath, content, 'utf8');
}
console.log('Migração concluída.');
