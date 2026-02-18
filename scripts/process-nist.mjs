import fs from 'fs';
import path from 'path';

const inputPath = path.resolve('../NIST_SP800-171_rev3_catalog.json');
const outputPath = path.resolve('public/data/controls.json');

function processCatalog() {
  const rawData = fs.readFileSync(inputPath, 'utf8');
  const data = JSON.parse(rawData);

  const families = data.catalog.groups.map(group => {
    const familyId = group.props.find(p => p.name === 'sort-id')?.value || group.id;
    const familyLabel = group.props.find(p => p.name === 'label')?.value || group.title;
    
    const controls = group.controls.map(control => {
      const controlId = control.props.find(p => p.name === 'sort-id')?.value || control.id;
      const controlLabel = control.props.find(p => p.name === 'label')?.value || control.title;
      
      // Extract statement
      const statementPart = control.parts?.find(p => p.name === 'statement');
      let statementProse = '';
      if (statementPart) {
        statementProse = extractProse(statementPart);
      }

      // Extract objectives
      const objectives = control.parts
        ?.filter(p => p.name === 'assessment-objective')
        .map(obj => ({
          id: obj.id,
          prose: obj.prose,
          label: obj.props?.find(p => p.name === 'label')?.value || obj.id
        })) || [];

      return {
        id: controlId,
        title: control.title,
        label: controlLabel,
        statement: statementProse,
        objectives: objectives
      };
    });

    return {
      id: familyId,
      title: group.title,
      label: familyLabel,
      controls: controls
    };
  });

  fs.writeFileSync(outputPath, JSON.stringify({ families }, null, 2));
  console.log(`Processed ${families.length} families into ${outputPath}`);
}

function extractProse(part) {
  let text = part.prose || '';
  if (part.parts) {
    text += '\\n' + part.parts.map(p => {
      const label = p.props?.find(pr => pr.name === 'label')?.value || '';
      return `${label ? label + ' ' : ''}${extractProse(p)}`;
    }).join('\\n');
  }
  return text.trim();
}

processCatalog();
