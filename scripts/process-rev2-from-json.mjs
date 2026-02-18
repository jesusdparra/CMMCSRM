import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAMILY_IDS = {
  AC: '03.01',
  AT: '03.02',
  AU: '03.03',
  CA: '03.12',
  CM: '03.04',
  IA: '03.05',
  IR: '03.06',
  MA: '03.07',
  MP: '03.08',
  PE: '03.10',
  PS: '03.09',
  RA: '03.11',
  SC: '03.13',
  SI: '03.14'
};

function processRev2ControlsFromJSON() {
  const projectRoot = path.join(__dirname, '../..');
  const inputPath = path.join(projectRoot, '800-171rev2_Controls.json');
  const outputPath = path.join(projectRoot, 'srm-app/public/data/controls-v2.json');

  const jsonData = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));
  const practices = jsonData.CMMC_Level_2_Practices;

  const familiesMap = {};

  for (const familyData of practices) {
    const familyCode = familyData.family_code;
    const familyName = familyData.family_name;

    if (!familiesMap[familyCode]) {
      familiesMap[familyCode] = {
        id: FAMILY_IDS[familyCode] || `03.${familyCode}`,
        title: familyName,
        label: `${familyName} (${FAMILY_IDS[familyCode] || `03.${familyCode}`})`,
        controls: []
      };
    }

    for (const practice of familyData.practices) {
      const practiceId = practice.id;
      const match = practiceId.match(/^([A-Z]+)\.L\d+-(\d+\.\d+\.\d+)$/);
      
      if (!match) {
        console.log('No match for:', practiceId);
        continue;
      }
      
      const controlNum = match[2];
      const nistControlId = `${FAMILY_IDS[familyCode]}.${controlNum}`;

      const objectives = practice.objectives.map(obj => {
        const objMatch = obj.id.match(/\[([a-z])\]$/);
        const letter = objMatch ? objMatch[1] : 'a';
        
        return {
          id: `assessment-objective_${familyCode}-${controlNum}.${letter}`,
          prose: obj.description,
          label: obj.id
        };
      });

      const statement = objectives.map((obj, idx) => {
        const letter = String.fromCharCode(97 + idx);
        return `${familyCode}.${controlNum}.${letter} ${obj.prose}`;
      }).join('\n\n');

      familiesMap[familyCode].controls.push({
        id: nistControlId,
        title: `Control ${nistControlId}`,
        label: practiceId,
        statement: statement,
        objectives: objectives
      });
    }
  }

  const families = Object.values(familiesMap).sort((a, b) => {
    return parseInt(a.id) - parseInt(b.id);
  });

  const result = { families };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));

  const totalControls = families.reduce((sum, f) => sum + f.controls.length, 0);
  const totalObjectives = families.reduce((sum, f) =>
    sum + f.controls.reduce((s, c) => s + c.objectives.length, 0), 0);

  console.log(`Processed Rev 2 controls from JSON`);
  console.log(`Families: ${families.length}`);
  console.log(`Controls: ${totalControls}`);
  console.log(`Objectives: ${totalObjectives}`);
  console.log(`Output written to: ${outputPath}`);
}

processRev2ControlsFromJSON();
