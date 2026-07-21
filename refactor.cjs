const fs = require('fs');
const path = require('path');

// 1. Refactor WorkoutSession.tsx
const wsFile = path.join(process.cwd(), 'src', 'WorkoutSession.tsx');
let wsContent = fs.readFileSync(wsFile, 'utf8');

// Add import
wsContent = wsContent.replace(
  "import ExerciseHelpModal from './ExerciseHelpModal';",
  "import ExerciseHelpModal from './ExerciseHelpModal';\nimport ExerciseExecutionCard from './components/ExerciseExecutionCard';"
);

// Replace mapping block
const wsMatch = wsContent.match(/              return \([\s\S]*?              \);\n            }\)/);
if (wsMatch) {
  const replacement = `              return (
                <ExerciseExecutionCard
                  key={exRealizado.exercicio_id}
                  exRealizado={exRealizado}
                  configEx={configEx}
                  infoEx={infoEx}
                  exIdx={exIdx}
                  localIdx={localIdx}
                  sessoesPassadas={sessoesPassadas}
                  setHelpExercise={setHelpExercise}
                />
              );
            })`;
  wsContent = wsContent.replace(wsMatch[0], replacement);
  fs.writeFileSync(wsFile, wsContent, 'utf8');
  console.log('WorkoutSession.tsx refactored');
} else {
  console.log('WorkoutSession match not found!');
}

// 2. Refactor RoutineForm.tsx
const rfFile = path.join(process.cwd(), 'src', 'RoutineForm.tsx');
let rfContent = fs.readFileSync(rfFile, 'utf8');

// Add import
rfContent = rfContent.replace(
  "import toast from 'react-hot-toast';",
  "import toast from 'react-hot-toast';\nimport ExerciseSelectorModal from './components/ExerciseSelectorModal';"
);

// Remove search icon import
rfContent = rfContent.replace('Trash2, Search, GripVertical', 'Trash2, GripVertical');

// Remove states
rfContent = rfContent.replace("  const [searchExercicio, setSearchExercicio] = useState('');\n", "");
rfContent = rfContent.replace("    setSearchExercicio('');\n", "");

// Replace modal
const rfMatch = rfContent.match(/      {\/\* Exercise Selector Modal \*\/}[\s\S]*?      \)}\n    <\/div>\n  \);\n};\n\nexport default RoutineForm;/);
if (rfMatch) {
  const rfReplacement = `      {/* Exercise Selector Modal */}
      {isSelectorOpen && (
        <ExerciseSelectorModal
          todosExercicios={todosExercicios}
          onSelect={addExercicio}
          onClose={() => setIsSelectorOpen(false)}
        />
      )}
    </div>
  );
};

export default RoutineForm;`;
  rfContent = rfContent.replace(rfMatch[0], rfReplacement);
  fs.writeFileSync(rfFile, rfContent, 'utf8');
  console.log('RoutineForm.tsx refactored');
} else {
  console.log('RoutineForm match not found!');
}
