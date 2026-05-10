const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');

const baseDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/runas';
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

const runes = [
    // Água (Reforçadas faltantes)
    { name: 'Drenagem Invertida', element: 'agua', tier: 'reinforced', desc: '1x/cena: ao receber 3+ acertos, recupere PE igual ao número de acertos.' },
    { name: 'Carapaça Fluida', element: 'agua', tier: 'reinforced', desc: '4 PE: por 2 rodadas, acertos com 1 hit não causam PV — apenas Proteção.' },
    // Terra
    { name: 'Inabalável', element: 'terra', tier: 'basic', desc: 'Imune a empurrão/deslocamento com 1-2 acertos. 3+: metade da distância.' },
    { name: 'Muralha de Pedra', element: 'terra', tier: 'basic', desc: '+2 Proteção base (adicionado ao cálculo de POT).' },
    { name: 'Âncora Gratuita', element: 'terra', tier: 'basic', desc: 'Em postura defensiva: +1 em testes de Resistência nessa rodada.' },
    { name: 'Escudo de Granito', element: 'terra', tier: 'reinforced', desc: '1x/cena: ao ser reduzido a 0 PV, gaste 5 PE — você chega a 1 PV.' },
    { name: 'Fragmentação Def.', element: 'terra', tier: 'reinforced', desc: 'Ao receber crítico: atacante recebe 1d6 fragmento; armadura perde 2 Prot.' },
    // Madeira
    { name: 'Regeneração Vegetal', element: 'madeira', tier: 'basic', desc: 'Descanso curto em ambiente natural: recupera 1 PV extra.' },
    { name: 'Espinhos de Vinhas', element: 'madeira', tier: 'basic', desc: '3+ acertos c/c: atacante recebe 1 dano perfurante.' },
    { name: 'Raiz Antiveneno', element: 'madeira', tier: 'basic', desc: 'Duração de venenos reduzida em 1 rodada (mínimo 1).' },
    { name: 'Casulo de Madeira', element: 'madeira', tier: 'reinforced', desc: '4 PE + 1 ação: madeira viva 1 rodada — +3 Proteção e imunidade a Sangramento.' },
    { name: 'Absorção Vital', element: 'madeira', tier: 'reinforced', desc: '1x/cena: ao causar PV em c/c, recupera metade do dano causado.' },
    // Metal
    { name: 'Têmpera Reativa', element: 'metal', tier: 'basic', desc: 'Margem de crítico inimigo +1 (precisam de resultado mais alto).' },
    { name: 'Liga Polida', element: 'metal', tier: 'basic', desc: '+1 em Persuasão/Intimidação em ambientes sociais formais (armadura visível).' },
    { name: 'Sequência Absorvida', element: 'metal', tier: 'basic', desc: 'Segundo ataque do mesmo alvo na rodada tem -1 acerto.' },
    { name: 'Blindagem Brutal', element: 'metal', tier: 'reinforced', desc: 'Ao receber 4 acertos: -3 dano. 1x/rodada.' },
    { name: 'Metal Assassino', element: 'metal', tier: 'reinforced', desc: '1x/cena: se agir antes do inimigo, +1d na primeira rolagem de ataque.' }
];

const elementFolderIds = {
    trovao: 'fldtrovao0000000',
    fogo: 'fldfogo000000000',
    vento: 'fldvento00000000',
    agua: 'fldagua000000000',
    terra: 'fldterra00000000',
    madeira: 'fldmadeira000000',
    metal: 'fldmetal00000000'
};

runes.forEach(r => {
    const folderName = r.element.charAt(0).toUpperCase() + r.element.slice(1);
    const elementDir = path.join(baseDir, folderName);
    const folderId = elementFolderIds[r.element];

    if (!fs.existsSync(elementDir)) {
        fs.mkdirSync(elementDir, { recursive: true });
        // Create _folder.yml
        const folderData = {
            _id: folderId,
            name: folderName,
            type: 'Item',
            sorting: 'a',
            folder: null,
            _key: `!folders!${folderId}`
        };
        fs.writeFileSync(path.join(elementDir, '_folder.yml'), yaml.dump(folderData));
    }

    const idBase = 'armor-' + r.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + r.element;
    const hash = crypto.createHash('md5').update(idBase).digest('hex').substring(0, 16);
    const fileName = r.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^\w]/g, '') + '.yml';
    const filePath = path.join(elementDir, fileName);
    
    const data = {
      _id: hash,
      name: r.name,
      type: 'rune',
      img: `systems/animus/assets/system-icons/elements/${r.element}.svg`,
      system: {
        description: r.desc,
        tier: r.tier,
        element: r.element,
        category: 'armor',
        price: r.tier === 'reinforced' ? 1200 : 600
      },
      folder: folderId,
      _key: `!items!${hash}`
    };
    
    fs.writeFileSync(filePath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    console.log(`Created Armor Rune: ${r.name} (${r.element})`);
});

console.log('Rune expansion complete.');
