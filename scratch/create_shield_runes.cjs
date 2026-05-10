const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');

const baseDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/runas';
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

const runes = [
    // Trovão
    { name: 'Escudo Relâmpago', element: 'trovao', tier: 'basic', desc: 'Ao bloquear ataque c/c: atacante recebe 2 dano elétrico.' },
    { name: 'Barreira Galvânica', element: 'trovao', tier: 'reinforced', desc: '1x/cena: bloqueio 3+ acertos, gaste 3 PE — atacante Atordoado.' },
    // Fogo
    { name: 'Escudo Flamejante', element: 'fogo', tier: 'basic', desc: 'Armas orgânicas/madeira contra você sofrem -1 acerto.' },
    { name: 'Explosão de Bloqueio', element: 'fogo', tier: 'reinforced', desc: '1x/combate: bloqueio -> gaste 4 PE -> 1d6+ANI fogo em 3m.' },
    // Vento
    { name: 'Desvio Aéreo', element: 'vento', tier: 'basic', desc: '1x/rodada: ao ser alvo de projétil, gaste 1 PE — projétil sofre -1 acerto.' },
    { name: 'Escudo Ciclone', element: 'vento', tier: 'reinforced', desc: '5 PE + 1 ação: empurra inimigos em 3m por 1d6+3 metros.' },
    // Água
    { name: 'Absorção Líquida', element: 'agua', tier: 'basic', desc: 'Ao bloquear: recupere 1 PE. Máx. 3 PE por combate.' },
    { name: 'Maré Protetora', element: 'agua', tier: 'reinforced', desc: '1x/cena: ao ser reduzido abaixo de metade PV, gaste 5 PE — recupera Proteção.' },
    // Terra
    { name: 'Muro de Pedra', element: 'terra', tier: 'basic', desc: '+1 Proteção adicional; ataques que zeram Proteção não ultrapassam para PV no turno.' },
    { name: 'Baluarte Inabalável', element: 'terra', tier: 'reinforced', desc: '1x/cena: postura defensiva (1 ação) — 2 rodadas, acertos 1-2 causam 0 Proteção.' },
    // Madeira
    { name: 'Escudo Vivo', element: 'madeira', tier: 'basic', desc: 'Ao final de cada combate: recupera 1d6 Proteção sem reparo.' },
    { name: 'Raízes do Impacto', element: 'madeira', tier: 'reinforced', desc: 'Bloqueio 3+ acertos: atacante fica Imobilizado 1 rodada. 1x/cena.' },
    // Metal
    { name: 'Escudo Perfurante', element: 'metal', tier: 'basic', desc: 'Ao bloquear com Aparar: alvo recebe 2 dano cortante como rebatida.' },
    { name: 'Contra-Ataque', element: 'metal', tier: 'reinforced', desc: '1x/rodada: bloqueio 3+ acertos -> 1 ataque de Luta como reação.' }
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

    const idBase = 'shield-' + r.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + r.element;
    const hash = crypto.createHash('md5').update(idBase).digest('hex').substring(0, 16);
    const fileName = 'Shield_' + r.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^\w]/g, '') + '.yml';
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
        category: 'shield',
        price: r.tier === 'reinforced' ? 1200 : 600
      },
      folder: folderId,
      _key: `!items!${hash}`
    };
    
    fs.writeFileSync(filePath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    console.log(`Created Shield Rune: ${r.name} (${r.element})`);
});

console.log('Shield Rune creation complete.');
