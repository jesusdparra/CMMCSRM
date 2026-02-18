import fs from 'fs';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const FAMILY_NAMES = {
  AC: 'Access Control',
  AT: 'Awareness and Training',
  AU: 'Audit and Accountability',
  CA: 'Security Assessment and Authorization',
  CM: 'Configuration Management',
  IA: 'Identification and Authentication',
  IR: 'Incident Response',
  MA: 'Maintenance',
  MP: 'Media Protection',
  PE: 'Physical and Environmental Protection',
  PS: 'Personnel Security',
  RA: 'Risk Assessment',
  SC: 'System and Communications Protection',
  SI: 'System and Information Integrity'
};

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

function processRev2ControlsFromCSV() {
  const projectRoot = path.join(__dirname, '../..');
  const inputPath = path.join(projectRoot, '800-171r2_Controls.csv');
  const outputPath = path.join(projectRoot, 'srm-app/public/data/controls-v2.json');

  const csvContent = fs.readFileSync(inputPath, 'utf-8');
  const lines = csvContent.trim().split('\n');

  const familiesMap = {};
  const controlsMap = {};

  for (const line of lines) {
    const parts = line.split(',');
    if (parts.length < 3) continue;

    const controlFullId = parts[0].trim();
    const subItem = parts[1].trim();
    const description = parts[2].trim();

    const match = controlFullId.match(/^([A-Z]+)\.L(\d+)-(\d+\.\d+\.\d+)$/);
    if (!match) continue;

    const familyCode = match[1];
    const level = match[2];
    const controlNum = match[3];

    if (!familiesMap[familyCode]) {
      familiesMap[familyCode] = {
        id: FAMILY_IDS[familyCode] || `03.${familyCode}`,
        title: FAMILY_NAMES[familyCode] || familyCode,
        label: `${FAMILY_NAMES[familyCode] || familyCode} (${FAMILY_IDS[familyCode] || `03.${familyCode}`})`,
        controls: []
      };
    }

    const controlId = `${familyCode}.L${level}-${controlNum}`;
    const objectiveId = `assessment-objective_${familyCode}-${controlNum}.${subItem}`;

    if (!controlsMap[controlId]) {
      controlsMap[controlId] = {
        familyCode,
        level,
        controlNum,
        objectives: []
      };
    }

    controlsMap[controlId].objectives.push({
      id: objectiveId,
      prose: description.charAt(0).toUpperCase() + description.slice(1).replace(/;$/, ''),
      label: objectiveId
    });
  }

  for (const controlId of Object.keys(controlsMap).sort()) {
    const ctrl = controlsMap[controlId];
    const { familyCode, level, controlNum, objectives } = ctrl;

    const levelLabel = level === '1' ? 'Basic' : 'Derived';
    const nistControlId = `${FAMILY_IDS[familyCode]}.${controlNum}`;

    const statement = objectives.map((obj, idx) => {
      const letter = String.fromCharCode(97 + idx);
      return `${familyCode}.${controlNum}.${letter} ${obj.prose}`;
    }).join('\n\n');

    familiesMap[familyCode].controls.push({
      id: nistControlId,
      title: `Control ${nistControlId}`,
      label: controlId,
      statement: statement,
      objectives: objectives
    });
  }

  const families = Object.values(familiesMap).sort((a, b) => {
    return parseInt(a.id) - parseInt(b.id);
  });

  const result = { families };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  
  const totalControls = families.reduce((sum, f) => sum + f.controls.length, 0);
  const totalObjectives = families.reduce((sum, f) => 
    sum + f.controls.reduce((s, c) => s + c.objectives.length, 0), 0);
  
  console.log(`Processed Rev 2 controls from CSV`);
  console.log(`Families: ${families.length}`);
  console.log(`Controls: ${totalControls}`);
  console.log(`Objectives: ${totalObjectives}`);
  console.log(`Output written to: ${outputPath}`);
}

processRev2ControlsFromCSV();
