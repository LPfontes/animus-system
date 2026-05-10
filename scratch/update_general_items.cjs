const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const itemsDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/itens';

const itemPrices = {
    'Tocha': 2,
    'Lanterna de Óleo': 10,
    'Pederneira e Isqueiro': 5,
    'Corda de Cânhamo 15m': 10,
    'Rações (5 dias)': 5,
    'Saco de Dormir': 5,
    'Tenda Leve (1p)': 20,
    'Tenda Reforçada (2p)': 40,
    'Mochila de Couro': 10,
    'Bálsamo Curativo': 10,
    'Bálsamo Superior': 30,
    'Refresco Vigorizante': 14,
    'Elixir de Clareza': 45,
    'Antídoto Universal': 10,
    'Ervas Medicinais': 5,
    'Kit Primeiros Socorros': 15,
    'Kit de Alquimista': 40,
    'Pé de Cabra': 12,
    'Kit de Prestidigitação': 15,
    'Kit de Escalador': 40,
    'Kit de Disfarce': 40,
    'Espelho Pequeno': 8,
    'Armadilha de Caça': 15,
    'Luneta de Campo': 35,
    'Fogo Engarrafado': 7,
    'Bomba de Fumaça': 12,
    'Granada de Flash': 15,
    'Veneno de Contato': 20,
    'Óleo Inflamável': 10,
    'Veneno Paralisante': 35,
    'Veneno Letal': 60,
    'Veneno Elemental': 50,
    'Perfume Nobre': 25,
    'Mapa da Região': 10,
    'Bússola Arcana': 120,
    'Pombo Mensageiro': 50
};

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
    
    if (data.type !== 'item') continue;

    let match = null;
    for (const [name, price] of Object.entries(itemPrices)) {
        if (data.name.toLowerCase().includes(name.toLowerCase()) || name.toLowerCase().includes(data.name.toLowerCase())) {
            match = price;
            break;
        }
    }

    if (match !== null) {
        console.log(`Updating ${data.name} price to ${match} Đ...`);
        data.system.price = match;
        // Initialize slots to 1 for small items if not set
        if (data.system.slots === undefined) data.system.slots = 1;
        
        fs.writeFileSync(fullPath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    }
  }
}

processDirectory(itemsDir);
console.log('General items update complete.');
