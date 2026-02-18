import fs from 'fs';
import path from 'path';

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

function processRev2Controls() {
  const inputPath = path.join(process.cwd(), '../800-171r2_Controls_ordered.json');
  const outputPath = path.join(process.cwd(), '../srm-app/public/data/controls-v2.json');

  const rev2Data = JSON.parse(fs.readFileSync(inputPath, 'utf-8'));

  const familiesMap = {};

  for (const control of rev2Data) {
    const controlId = control.Control_ID;
    const parts = controlId.split('.');
    const familyCode = parts[0];
    const controlNum = parts.slice(1).join('.');

    if (!familiesMap[familyCode]) {
      familiesMap[familyCode] = {
        id: FAMILY_IDS[familyCode] || `03.${familyCode}`,
        title: FAMILY_NAMES[familyCode] || familyCode,
        label: `${FAMILY_NAMES[familyCode] || familyCode} (${FAMILY_IDS[familyCode] || `03.${familyCode}`})`,
        controls: []
      };
    }

    const statement = control.Items
      .map((item, idx) => {
        const letter = String.fromCharCode(97 + idx);
        return `SR-${controlId.replace(familyCode + '.', '')}.${letter} ${item.Description.replace(/^the /i, '')}`;
      })
      .join('\n');

    const objectives = control.Items.map((item, idx) => {
      const letter = String.fromCharCode(97 + idx);
      return {
        id: `assessment-objective_${familyCode}-${controlNum}.${letter}`,
        prose: item.Description,
        label: `assessment-objective_${familyCode}-${controlNum}.${letter}`
      };
    });

    const level = controlId.includes('L1') ? 'Basic' : 'Derived';
    const title = controlId.replace(familyCode + '.', '').replace(/L\d+-/g, '');

    familiesMap[familyCode].controls.push({
      id: `${FAMILY_IDS[familyCode]}.${controlNum.replace(/L\d+-/g, '')}`,
      title: title,
      label: `${controlId}`,
      statement: objectives.map((obj, idx) => {
        const letter = String.fromCharCode(97 + idx);
        return `${familyCode}.${controlNum}.${letter} ${obj.prose}`;
      }).join('\n\n'),
      objectives: objectives
    });
  }

  const families = Object.values(familiesMap).sort((a, b) => {
    return parseInt(a.id) - parseInt(b.id);
  });

  const result = { families };

  fs.writeFileSync(outputPath, JSON.stringify(result, null, 2));
  console.log(`Processed ${rev2Data.length} controls into ${families.length} families`);
  console.log(`Output written to: ${outputPath}`);
}

processRev2Controls();
