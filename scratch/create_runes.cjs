const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');

const baseDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/itens/Runas';
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

const runes = [
    // Trovão
    { name: 'Reflexo Galvânico', element: 'trovao', tier: 'basic', desc: '1x/cena: ao ser atingido em c/c com 3+ acertos, atacante recebe 3 dano elétrico.' },
    { name: 'Isolamento', element: 'trovao', tier: 'basic', desc: '-2 dano de Trovão recebido.' },
    { name: 'Celeridade Def.', element: 'trovao', tier: 'basic', desc: '-1 na CD de iniciativa; age primeiro em empates.' },
    { name: 'Para-Raios Inv.', element: 'trovao', tier: 'reinforced', desc: 'Ao receber dano elétrico, converta até 3 pts em PE recuperado. 1x/rodada.' },
    { name: 'Descarga Impacto', element: 'trovao', tier: 'reinforced', desc: '1x/combate: ao receber 4 acertos, gaste 4 PE; atacante fica Atordoado.' },
    // Fogo
    { name: 'Aura Aquecida', element: 'fogo', tier: 'basic', desc: 'Imunidade a frio extremo. Resistência 2 a dano de Água.' },
    { name: 'Represália Ígnea', element: 'fogo', tier: 'basic', desc: '3+ acertos c/c: atacante recebe 1 dano de fogo.' },
    { name: 'Farol Interno', element: 'fogo', tier: 'basic', desc: 'Emite luz suave 3m. Furtividade contra você tem CD +2.' },
    { name: 'Chama Protetora', element: 'fogo', tier: 'reinforced', desc: 'Ao chegar à metade de PV: aura de fogo 1 rodada — 2 dano fogo em atacantes c/c.' },
    { name: 'Carapaça Incand.', element: 'fogo', tier: 'reinforced', desc: '3 PE como reação: -2 dano no próximo ataque físico. 1x/turno.' },
    // Vento
    { name: 'Leveza Aérea', element: 'vento', tier: 'basic', desc: '-1 na penalidade operacional da armadura.' },
    { name: 'Empurrão Reativo', element: 'vento', tier: 'basic', desc: '1x/cena: ao ser atacado, gaste 1 PE como reação e mova até 3m.' },
    { name: 'Corrente de Ar', element: 'vento', tier: 'basic', desc: 'Sem penalidade de movimento em terreno irregular. +1 em Acrobacia.' },
    { name: 'Véu do Vendaval', element: 'vento', tier: 'reinforced', desc: 'Gaste 5 PE: role Atletismo vs acerto; projétil desviado se vencer.' },
    { name: 'Armadura Ciclônica', element: 'vento', tier: 'reinforced', desc: '5 PE + 1 ação: campo de vento 2 rodadas — inimigos precisam +1 ação p/ se aproximar.' },
    // Água
    { name: 'Fluxo Vital', element: 'agua', tier: 'basic', desc: 'Ao receber dano > metade PV, recupere 1 Proteção no início do próximo turno.' },
    { name: 'Frieza Líquida', element: 'agua', tier: 'basic', desc: 'Resistência 2 a fogo. Imunidade a calor extremo e desidratação.' },
    { name: 'Pressão Constante', element: 'agua', tier: 'basic', desc: 'Ataques de Água contra você custam +1 PE.' }
];

runes.forEach(r => {
    const id = r.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + r.element;
    const fileName = r.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^\w]/g, '') + '.yml';
    const filePath = path.join(baseDir, fileName);
    
    const data = {
        _id: id.substring(0, 16).padEnd(16, '0'),
        name: r.name,
        type: 'rune',
        img: `systems/animus/assets/system-icons/elements/${r.element}.svg`,
        system: {
            description: r.desc,
            tier: r.tier,
            element: r.element,
            price: r.tier === 'reinforced' ? 1200 : 600
        },
        _key: `!items!${id.substring(0, 16).padEnd(16, '0')}`
    };
    
    fs.writeFileSync(filePath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    console.log(`Created Rune: ${r.name} (${r.element})`);
});

console.log('Rune creation complete.');
