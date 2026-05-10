const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const weaponsDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/itens/Armas';

const weaponStats = {
  'Adaga': { ac1: '2', ac2: '3+1xP', ac3: '4+2xP', ac4: '5+3xP', price: 15 },
  'Facão': { ac1: '2', ac2: '3+1xP', ac3: '4+2xP', ac4: '5+3xP', price: 15 },
  'Machado de mão': { ac1: '2', ac2: '3+1xP', ac3: '4+2xP', ac4: '5+3xP', price: 10 },
  'Espada curta': { ac1: '2', ac2: '3+1xP', ac3: '4+2xP', ac4: '5+3xP', price: 5 },
  'Espada longa': { ac1: '3', ac2: '4+2xP', ac3: '6+3xP', ac4: '8+3xP', price: 15 },
  'Montante': { ac1: '3', ac2: '4+2xP', ac3: '6+3xP', ac4: '8+3xP', price: 20 },
  'Alabarda': { ac1: '3', ac2: '4+2xP', ac3: '6+3xP', ac4: '8+3xP', price: 30 },
  'Soco / Arma nat.': { ac1: '1+1xP', ac2: '2+2xP', ac3: '3+3xP', ac4: '4+4xP', price: 0 },
  'Clava / Porrete': { ac1: '1+1xP', ac2: '2+2xP', ac3: '3+3xP', ac4: '4+4xP', price: 5 },
  'Maça': { ac1: '2+1xP', ac2: '3+2xP', ac3: '5+3xP', ac4: '6+5xP', price: 15 },
  'Martelo de guerra': { ac1: '2+1xP', ac2: '3+2xP', ac3: '5+3xP', ac4: '6+5xP', price: 20 },
  'Punhal': { ac1: '1', ac2: '2+1xP', ac3: '3+2xP', ac4: '5+5xP', price: 8 },
  'Lança longa': { ac1: '2', ac2: '3+1xP', ac3: '4+3xP', ac4: '7+6xP', price: 25 },
  'Rapieira': { ac1: '2', ac2: '3+1xP', ac3: '4+3xP', ac4: '7+6xP', price: 10 },
  'Arco curto': { ac1: '2', ac2: '3+1xP', ac3: '4+2xP', ac4: '5+3xP', price: 15 },
  'Arco longo': { ac1: '3', ac2: '4+2xP', ac3: '6+3xP', ac4: '8+3xP', price: 35 },
  'Besta pesada': { ac1: '2', ac2: '3+1xP', ac3: '4+3xP', ac4: '7+6xP', price: 30 },
};

function parseDamage(str) {
  if (typeof str === 'number') return { base: str, mult: 0 };
  if (!str || typeof str !== 'string') return { base: 0, mult: 0 };
  
  const s = str.replace(/\s+/g, '');
  let base = 0;
  let mult = 0;
  
  const parts = s.split('+');
  for (const p of parts) {
    if (p.includes('x')) {
      const multPart = p.split('x')[0];
      mult = parseInt(multPart) || 1;
    } else {
      base += parseInt(p) || 0;
    }
  }
  
  return { base, mult };
}

function processDirectory(dir) {
  const files = fs.readdirSync(dir);
  for (const file of files) {
    const fullPath = path.join(dir, file);
    const stats = fs.statSync(fullPath);
    
    if (stats.isDirectory()) {
      processDirectory(fullPath);
      continue;
    }
    
    if (!file.endsWith('.yml') || file === '_folder.yml') continue;
    
    const content = fs.readFileSync(fullPath, 'utf8');
    const data = yaml.load(content);
    
    if (data.type !== 'weapon') continue;

    // Search for match in stats table
    let match = null;
    for (const [name, stats] of Object.entries(weaponStats)) {
        if (data.name.toLowerCase().includes(name.toLowerCase())) {
            match = stats;
            break;
        }
    }

    if (match) {
        console.log(`Updating ${data.name} with new table values...`);
        const newDamage = {};
        for (const ac of ['ac1', 'ac2', 'ac3', 'ac4']) {
            newDamage[ac] = parseDamage(match[ac]);
        }
        data.system.damage = newDamage;
        data.system.price = match.price;
        // Keep existing slots, type, damageType from previous migration or schema
        
        fs.writeFileSync(fullPath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    }
  }
}

processDirectory(weaponsDir);
console.log('Update complete.');
