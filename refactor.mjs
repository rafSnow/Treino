import fs from 'fs';

const wsFile = 'src/WorkoutSession.tsx';
let lines = fs.readFileSync(wsFile, 'utf8').split('\n');

lines[6] = "import ExerciseHelpModal from './ExerciseHelpModal';\nimport ExerciseExecutionCard from './components/ExerciseExecutionCard';";

const newContent = [
  ...lines.slice(0, 249),
  '              return (',
  '                <ExerciseExecutionCard',
  '                  key={exRealizado.exercicio_id}',
  '                  exRealizado={exRealizado}',
  '                  configEx={configEx}',
  '                  infoEx={infoEx}',
  '                  exIdx={exIdx}',
  '                  localIdx={localIdx}',
  '                  sessoesPassadas={sessoesPassadas}',
  '                  setHelpExercise={setHelpExercise}',
  '                />',
  '              );',
  ...lines.slice(463)
];
fs.writeFileSync(wsFile, newContent.join('\n'));

const rfFile = 'src/RoutineForm.tsx';
let rfLines = fs.readFileSync(rfFile, 'utf8').split('\n');

rfLines[3] = "import { X, Save, Plus, Trash2, GripVertical } from 'lucide-react';";
rfLines[4] = "import toast from 'react-hot-toast';\nimport ExerciseSelectorModal from './components/ExerciseSelectorModal';";

rfLines.splice(193, 1); 
rfLines.splice(158, 1); 

const modalStart = rfLines.findIndex(l => l.includes('{/* Exercise Selector Modal */}'));
const modalEnd = rfLines.findIndex((l, i) => i > modalStart && l === '    </div>' && rfLines[i+1] === '  );');

if (modalStart !== -1 && modalEnd !== -1) {
  const rfNew = [
    ...rfLines.slice(0, modalStart),
    '      {/* Exercise Selector Modal */}',
    '      {isSelectorOpen && (',
    '        <ExerciseSelectorModal',
    '          todosExercicios={todosExercicios}',
    '          onSelect={addExercicio}',
    '          onClose={() => setIsSelectorOpen(false)}',
    '        />',
    '      )}',
    ...rfLines.slice(modalEnd)
  ];
  fs.writeFileSync(rfFile, rfNew.join('\n'));
} else {
  console.log("Failed to find RoutineForm boundaries", modalStart, modalEnd);
}
