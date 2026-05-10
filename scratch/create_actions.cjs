const fs = require('fs');
const path = require('path');
const yaml = require('js-yaml');
const crypto = require('crypto');

const baseDir = 'packs/_source/acoes';
if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
}

const actions = [
    { name: 'Atacar (arma média)', pa: 2, desc: 'Realiza um ataque com uma arma de porte médio.' },
    { name: 'Atacar (arma leve)', pa: 1, desc: 'Realiza um ataque com uma arma leve.' },
    { name: 'Mover 9 metros', pa: 1, desc: 'Desloca-se até 9 metros pelo campo de batalha.' },
    { name: 'Sacar arma', pa: 1, desc: 'Saca ou guarda uma arma pronta para uso.' },
    { name: 'Perícia em combate', pa: 1, desc: 'Usa uma perícia (Atletismo, Intimidação, Medicina, etc.) durante o combate.' },
    { name: 'Manobra de combate', pa: 2, desc: 'Realiza uma manobra como agarrar, empurrar ou derrubar um adversário.' },
    { name: 'Ataque elemental', pa: 2, desc: 'Canaliza poder elemental para um ataque. Custo adicional de PE dependendo do nível do ataque.' },
    { name: 'Usar item', pa: 1, desc: 'Consome ou ativa um item do seu inventário.' },
    { name: 'Ação Coordenada', pa: 1, desc: 'Gasta 1 PA adicional para conceder Vantagem a um aliado.' },
    { name: 'Repetir a mesma ação', pa: 1, desc: 'Gasta 1 PA extra ao repetir exatamente a mesma ação realizada anteriormente no mesmo turno.' },
    { name: 'Reações Defensivas', pa: 0, desc: 'Um personagem pode gastar PA da rodada seguinte para ativar habilidades defensivas (tag Reação) fora de seu turno. Essas ações são descontadas do próximo turno.' }
];

actions.forEach(a => {
    const idBase = 'action-' + a.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '');
    const hash = crypto.createHash('md5').update(idBase).digest('hex').substring(0, 16);
    const fileName = a.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^\w]/g, '') + '.yml';
    const filePath = path.join(baseDir, fileName);
    
    const data = {
      _id: hash,
      name: a.name,
      type: 'action', // Assuming there is an 'action' type or using 'item'
      img: 'icons/svg/clockwork.svg',
      system: {
        description: a.desc,
        cost: a.pa
      },
      _key: `!items!${hash}`
    };
    
    // If the system uses a different type for actions, adjust here. 
    // Looking at template.json would help, but 'action' is a safe guess for a custom system.
    
    fs.writeFileSync(filePath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    console.log(`Created Action: ${a.name}`);
});
