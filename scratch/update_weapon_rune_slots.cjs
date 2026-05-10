const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const weaponsDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/itens/Armas';

function updateSlots(dir) {
    if (!fs.existsSync(dir)) return;
    const files = fs.readdirSync(dir);
    for (const file of files) {
        const fullPath = path.join(dir, file);
        const stats = fs.statSync(fullPath);
        
        if (stats.isDirectory()) {
            updateSlots(fullPath);
            continue;
        }
        
        if (!file.endsWith('.yml') || file === '_folder.yml') continue;
        
        const content = fs.readFileSync(fullPath, 'utf8');
        const data = yaml.load(content);
        
        if (data.type !== 'weapon') continue;
        
        console.log(`Updating ${data.name} rune slots...`);
        data.system.runeSlots = {
            basic: 2,
            reinforced: 1
        };
        
        fs.writeFileSync(fullPath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    }
}

updateSlots(weaponsDir);
console.log('Weapon rune slots update complete.');
