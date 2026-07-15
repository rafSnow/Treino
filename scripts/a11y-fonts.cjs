const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // 1. Aumentar tamanho das fontes pequenas
  content = content.replace(/text-\[9px\]/g, 'text-[11px]');
  content = content.replace(/text-\[10px\]/g, 'text-xs');

  // 2. Melhorar contraste (text-gray-400 para text-gray-600 dark:text-gray-400)
  // Mas de forma cuidadosa para não duplicar e não estragar outros contextos
  content = content.replace(/text-gray-400(?!\s*dark:)/g, 'text-gray-600 dark:text-gray-400');
  content = content.replace(/text-gray-500(?!\s*dark:)/g, 'text-gray-700 dark:text-gray-300');

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Updated fonts/contrast in: ${path.basename(filePath)}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx') || fullPath.endsWith('.ts')) {
      processFile(fullPath);
    }
  }
}

walk(srcDir);
console.log('Font and contrast update complete.');
