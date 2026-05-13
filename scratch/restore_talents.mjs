import fs from 'fs';
import yaml from 'js-yaml';
import crypto from 'crypto';
import path from 'path';

const talentsDir = 'c:\\Users\\lpfon\\Downloads\\animus\\animus-system\\packs\\_source\\Animus\\regras\\Talentos';

const updates = {
  '8cbdc7d928351cf9': { // Alquimista de Campo
    items: [
      { name: "Bomba de Fumaça", img: "icons/weapons/bombs/bomb-fire-grey.webp", quantity: 1, description: "Uma bomba que cria uma nuvem de fumaça, dificultando a visão na área." },
      { name: "Ácido", img: "icons/consumables/potions/potion-flask-corked-vial-green.webp", quantity: 1, description: "Um frasco de ácido corrosivo que causa dano contínuo." },
      { name: "Bálsamo", img: "icons/consumables/potions/potion-flask-corked-vial-red.webp", quantity: 1, description: "Um bálsamo curativo que recupera HP ao ser aplicado." }
    ]
  },
  'bf036223acd4ba3a': { // Apotecário
    items: [
      { name: "Bálsamo", img: "icons/consumables/potions/potion-flask-corked-vial-red.webp", quantity: 1, description: "Cura ANIMA+COGNIÇÃO do criador; 10 dinheiros." },
      { name: "Antídoto", img: "icons/consumables/potions/potion-flask-corked-vial-blue.webp", quantity: 1, description: "Remove Envenenado, purifica água/alimentos; 10 dinheiros." },
      { name: "Toxina básica", img: "icons/consumables/potions/potion-flask-corked-vial-green.webp", quantity: 1, description: "Causa dano igual a ANIMA+COGNIÇÃO do criador." }
    ]
  },
  '6f862b9412e6d5f4': { // Armadilheiro
    items: [
      { name: "Armadilha de Lentidão", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "Movimento custa +1 ação — Custo: 2 PE para armar." },
      { name: "Armadilha de Dano", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "Causa 3+PERSPICÁCIA de dano — Custo: 2 PE para armar." },
      { name: "Armadilha de Alerta", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "Causa som alto ao ser disparada — Custo: 2 PE para armar." }
    ]
  },
  '4e60933a890b7624': { // Armadilheiro Profissional
    items: [
      { name: "Mod: Paralisar", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "+5 PE para aplicar. Alvo deve passar em CD 7+PERSPICÁCIA ou ficar paralisado." },
      { name: "Mod: Drenante", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "+4 PE para aplicar. Drena 3+PERSPICÁCIA PE do alvo." },
      { name: "Mod: Área Maior", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "+5 PE para aplicar. Aumenta o raio da armadilha para 3m." },
      { name: "Mod: Dano Extra", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "+4 PE para aplicar. Adiciona +3 de dano fixo à armadilha." },
      { name: "Mod: Empurrão", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "+5 PE para aplicar. Teste de resistência; se falhar, acertos = metros empurrados." },
      { name: "Mod: Extenuante", img: "icons/sundries/survival/trap-bear.webp", quantity: 1, description: "+8 PE para aplicar. Alvo perde 1 ação até o fim da cena." }
    ]
  }
};

const files = fs.readdirSync(talentsDir);

for (const file of files) {
  if (!file.endsWith('.yml')) continue;
  
  const filePath = path.join(talentsDir, file);
  const content = fs.readFileSync(filePath, 'utf8');
  let doc = yaml.load(content);
  let changed = false;

  // 1. Re-apply manual items
  if (updates[doc._id]) {
    console.log(`Applying items to ${doc.name}`);
    doc.system.grantedItems = updates[doc._id].items.map(i => ({
      id: crypto.randomBytes(8).toString('hex'),
      ...i
    }));
    changed = true;
  }

  // 2. Automated Action Extraction (from earlier session logic)
  // Check if cost/action are > 0 AND there's no grantedActions yet
  if ((doc.system.cost > 0 || doc.system.action > 0) && (!doc.system.grantedActions || doc.system.grantedActions.length === 0)) {
    console.log(`Extracting action for ${doc.name}`);
    doc.system.grantedActions = [
      {
        id: crypto.randomBytes(8).toString('hex'),
        name: doc.name,
        cost: doc.system.action || 0,
        peCost: doc.system.cost || 0,
        type: 2, // Utilitária
        description: doc.system.description
      }
    ];
    // Reset base cost/action to avoid redundancy if desired, 
    // but the user might want to keep them for info.
    // doc.system.cost = 0;
    // doc.system.action = 0;
    changed = true;
  }

  if (changed) {
    fs.writeFileSync(filePath, yaml.dump(doc, { lineWidth: -1 }), 'utf8');
  }
}

console.log('Done!');
