const fs = require('fs');
const path = require('path');

const filePath = path.join(__dirname, 'src', 'RoutineImporter.tsx');
let content = fs.readFileSync(filePath, 'utf8');

content = content.replace(
  /const existingEx = await db\.exercicios\.where\('nome'\)\.equalsIgnoreCase\(exData\.n\)\.first\(\);/,
  `const allEx = await db.exercicios.toArray();\n          const existingEx = allEx.find(e => e.nome.toLowerCase() === exData.n.toLowerCase());`
);

content = content.replace(
  /let exerciseId: number;/g,
  `let exerciseId: string;`
);

content = content.replace(
  /}\) as number;/g,
  `});`
);

fs.writeFileSync(filePath, content, 'utf8');
console.log('Fixed RoutineImporter');
