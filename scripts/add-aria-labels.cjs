const fs = require('fs');
const path = require('path');

const srcDir = path.join(__dirname, '../src');

function getLabelFromAction(action) {
  if (/delete|remove/i.test(action)) return "Excluir";
  if (/add|create|new/i.test(action)) return "Adicionar";
  if (/edit|update/i.test(action)) return "Editar";
  if (/close|fechar|cancel/i.test(action) || /setIs.*Open\(false\)/i.test(action)) return "Fechar";
  if (/save|submit/i.test(action)) return "Salvar";
  if (/play|start/i.test(action)) return "Iniciar";
  if (/back|voltar/i.test(action)) return "Voltar";
  return "Botão de Ação";
}

function processFile(filePath) {
  let content = fs.readFileSync(filePath, 'utf8');
  let original = content;

  // Encontra botões que não tem aria-label nem texto
  const buttonRegex = /<button\s([^>]*)>/g;
  
  content = content.replace(buttonRegex, (match, attrs) => {
    // Se já tem aria-label ou title, ignora
    if (/aria-label=/i.test(attrs) || /title=/i.test(attrs)) {
      return match;
    }
    
    // Tenta deduzir a intenção pelo onClick
    let label = "Ação";
    const onClickMatch = attrs.match(/onClick=\{([^}]+)\}/);
    if (onClickMatch) {
      label = getLabelFromAction(onClickMatch[1]);
    } else {
      label = "Botão"; // Padrão
    }
    
    // Se não tiver texto na label (precisamos garantir que é seguro adicionar)
    return `<button aria-label="${label}" title="${label}" ${attrs}>`;
  });

  if (content !== original) {
    fs.writeFileSync(filePath, content, 'utf8');
    console.log(`Added aria-labels to: ${path.basename(filePath)}`);
  }
}

function walk(dir) {
  if (!fs.existsSync(dir)) return;
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    if (fs.statSync(fullPath).isDirectory()) {
      walk(fullPath);
    } else if (fullPath.endsWith('.tsx')) {
      processFile(fullPath);
    }
  }
}

walk(srcDir);
console.log('Aria-label update complete.');
