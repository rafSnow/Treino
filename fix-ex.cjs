const fs = require('fs');
const path = require('path');

const file = path.join(__dirname, 'src', 'ExerciseList.tsx');
let content = fs.readFileSync(file, 'utf8');

content = content.replace(
  /let collection = db\.exercicios\.orderBy\('nome'\);[\s\S]*?let results = await collection\.toArray\(\);/,
  `let results = await db.exercicios.toArray();
      results.sort((a,b) => a.nome.localeCompare(b.nome));
      
      if (searchTerm) {
        results = results.filter(ex => 
          ex.nome.toLowerCase().includes(searchTerm.toLowerCase()) ||
          ex.categoria.toLowerCase().includes(searchTerm.toLowerCase())
        );
      }`
);

content = content.replace(
  /const rotinasUsando = await db\.rotinas[\s\S]*?\.count\(\);/g,
  `const rotinasUsando = (await db.rotinas.toArray()).filter(r => r.exercicios.some(e => e.exercicio_id === id)).length;`
);

content = content.replace(
  /const sessoesUsando = await db\.sessoes[\s\S]*?\.count\(\);/g,
  `const sessoesUsando = (await db.sessoes.toArray()).filter(s => s.exercicios_realizados.some(e => e.exercicio_id === id)).length;`
);

content = content.replace(
  /const tagsDisponiveis = Array\.from\(new Set\(exercicios\?\.flatMap\(ex => ex\.tags\) \|\| \[\]\)\);/,
  `const tagsDisponiveis = Array.from(new Set(exercicios?.flatMap(ex => ex.tags) || [])) as string[];`
);

content = content.replace(
  /const categoriasDisponiveis = Array\.from\(new Set\(exercicios\?\.map\(ex => ex\.categoria\) \|\| \[\]\)\);/,
  `const categoriasDisponiveis = Array.from(new Set(exercicios?.map(ex => ex.categoria) || [])) as string[];`
);

content = content.replace(/import \{ useCollection \} from '.\/db';\n/, '');
content = content.replace(/import \{ useLiveQuery \} from 'dexie-react-hooks';\n/, '');

// Fix Type 'unknown' is not assignable to type 'Key'.
content = content.replace(/\[categoria\].map/g, '[categoria as string].map');
content = content.replace(/Object.keys\(grouped\)/g, '(Object.keys(grouped) as string[])');

fs.writeFileSync(file, content, 'utf8');
console.log('Fixed ExerciseList');
