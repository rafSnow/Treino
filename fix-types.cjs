const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, 'src');
const files = fs.readdirSync(srcDir).filter(f => f.endsWith('.tsx') || f.endsWith('.ts'));

for (const file of files) {
  const filePath = path.join(srcDir, file);
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Replace type definitions that hardcode 'number' for IDs
  content = content.replace(/exercicio_id:\s*number/g, 'exercicio_id: string');
  content = content.replace(/rotina_id:\s*number/g, 'rotina_id: string');
  content = content.replace(/rotina_id\?:\s*number/g, 'rotina_id?: string');
  content = content.replace(/id:\s*number/g, 'id: string');
  content = content.replace(/id\?:\s*number/g, 'id?: string');

  // Any explicit Number() casts for IDs, remove or change (hard to regex, we'll see)
  
  if (content !== original) {
    console.log('Fixed types in', file);
    fs.writeFileSync(filePath, content, 'utf8');
  }
}
console.log('Done fixing types.');
