const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const armorDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/itens/Equipamento/Armaduras';
const shieldDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/itens/Equipamento/Escudos';

function updateSlots(dir, basic, reinforced) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        if (!file.endsWith('.yml') || file === '_folder.yml') continue;
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = yaml.load(content);
        
        if (data.type !== 'armor') continue;
        
        console.log(`Updating ${data.name} slots...`);
        data.system.runeSlots = {
            basic: basic,
            reinforced: reinforced
        };
        
        fs.writeFileSync(fullPath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    }
}

updateSlots(armorDir, 2, 1);
updateSlots(shieldDir, 1, 1);
console.log('Armor/Shield slots update complete.');
