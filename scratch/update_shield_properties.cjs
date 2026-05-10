const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');

const baseDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source/propriedades/Modulares/ESCUDOS';
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

const properties = [
    { name: 'Reforçado', desc: '+3 PVs base. Adquirível até 2×.', price: 250, id: 'prop-reforcado-01' },
    { name: 'Ágil', desc: '+1×HAB no multiplicador.', price: 200, id: 'prop-agil-01' },
    { name: 'Pontudo', desc: 'O escudo pode ser usado como arma (Contusa Leve). Requer 1 ação.', price: 150, id: 'prop-pontudo-01' },
    { name: 'Resistente', desc: 'Teste de resistência contra o ataque; sucesso reduz Acerto em 1.', price: 500, id: 'prop-resistente-01' },
    { name: 'Ancorado', desc: 'Sem movimento: imune a empurrão e Derrubado.', price: 50, id: 'prop-ancorado-01' },
    { name: 'Espaço p/ Runa', desc: 'Slot para Runa Básica elemental.', price: 600, id: 'prop-runa-01' },
    { name: 'Cobertura Total', desc: 'Reação (1 PE/rodada): +2 Proteção temporário a aliado adjacente.', price: 350, id: 'prop-cobertura-01' }
];

properties.forEach(p => {
    const fileName = p.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/\//g, '') + '_' + p.id + '.yml';
    const filePath = path.join(baseDir, fileName);
    
    const data = {
        _id: p.id,
        name: p.name,
        type: 'property',
        img: 'icons/svg/upgrade.svg',
        system: {
            description: p.desc,
            price: p.price
        },
        _key: `!items!${p.id}`
    };
    
    fs.writeFileSync(filePath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    console.log(`Created/Updated ${p.name}`);
});

console.log('Shield properties update complete.');
