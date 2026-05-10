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
    { name: 'Velocidade', element: 'trovao', tier: 'basic', desc: '-1 PA no primeiro ataque do turno. À distância: -1 PA na recarga.' },
    { name: 'Chocante', element: 'trovao', tier: 'basic', desc: '+2 dano elétrico em todos os acertos.' },
    { name: 'Fulgurante', element: 'trovao', tier: 'basic', desc: '3+ acertos: alvo perde 1 PA no próximo turno.' },
    { name: 'Clarão', element: 'trovao', tier: 'basic', desc: 'CD 8+ANI: alvo fica Desprevenido contra o próximo ataque recebido.' },
    { name: 'Celeridade', element: 'trovao', tier: 'reinforced', desc: '-1 PA em todos os ataques com esta arma.' },
    { name: 'Trovejante', element: 'trovao', tier: 'reinforced', desc: '+4 dano elétrico em todos os acertos.' },
    { name: 'Fulminante', element: 'trovao', tier: 'reinforced', desc: '3+ acertos: alvo perde 1 PA e +1 custo em ações de movimento.' },
    { name: 'Flash', element: 'trovao', tier: 'reinforced', desc: 'CD 8+ANI: todos que virem ficam Desprevenidos até o próximo turno.' },
    // Fogo
    { name: 'Chamuscar', element: 'fogo', tier: 'basic', desc: '+1 dano de fogo em todos os acertos.' },
    { name: 'Luminosa', element: 'fogo', tier: 'basic', desc: 'Ilumina 9m como tocha. Sem efeito de combate.' },
    { name: 'Fervorosa', element: 'fogo', tier: 'basic', desc: 'Altera tipo para fogo; ignição em materiais inflamáveis.' },
    { name: 'Cauterizadora', element: 'fogo', tier: 'basic', desc: 'Acerto: cura recebida pelo alvo reduzida à metade até próximo descanso.' },
    { name: 'Flamejante', element: 'fogo', tier: 'reinforced', desc: '+3 dano de fogo em todos os acertos.' },
    { name: 'Incendiária', element: 'fogo', tier: 'reinforced', desc: 'Acerto: fogo líquido — 2 dano/turno até ser apagado.' },
    { name: 'Explosão de Fogo', element: 'fogo', tier: 'reinforced', desc: '3+ acertos: efeitos básicos em área de 3m de raio.' },
    { name: 'Ardente', element: 'fogo', tier: 'reinforced', desc: 'Ao atacar, área ardente de 1,5m ao redor do usuário (1 dano/turno).' },
    // Vento
    { name: 'Brisa Leve', element: 'vento', tier: 'basic', desc: 'Alcance +3m; à distância: +6m de alcance efetivo.' },
    { name: 'Repulsão', element: 'vento', tier: 'basic', desc: 'CD 8+ANI (Resistência): empurra o alvo 4,5m.' },
    { name: 'Companheira', element: 'vento', tier: 'basic', desc: 'Arma de arremesso que retorna automaticamente.' },
    { name: 'Velocidade', element: 'vento', tier: 'basic', desc: '+1 PA gratuito após atacar (somente movimento).' },
    { name: 'Tornado', element: 'vento', tier: 'reinforced', desc: 'Ao atacar: tufão em área de alcance — dano de Vento em todos.' },
    { name: 'Vendaval', element: 'vento', tier: 'reinforced', desc: '+2 dano de vento em todos os acertos.' },
    { name: 'Leal', element: 'vento', tier: 'reinforced', desc: '2 PA + 3 PE: arma ataca sozinha e flutua ao lado do dono.' },
    { name: 'Ciclone', element: 'vento', tier: 'reinforced', desc: 'Ao atacar, ganhe 2 PA de movimento gratuitos naquele turno.' },
    // Água
    { name: 'Fluidez', element: 'agua', tier: 'basic', desc: 'Gaste 4 PE para causar 3 acertos automaticamente no próximo ataque.' },
    { name: 'Correnteza', element: 'agua', tier: 'basic', desc: 'Cada acerto aumenta a CD de acertos do alvo em +1 (acumula).' },
    { name: 'Fluxo', element: 'agua', tier: 'basic', desc: '+1 dano fixo no próximo ataque para cada 4 PE gastos no turno.' },
    { name: 'Osmótica', element: 'agua', tier: 'basic', desc: 'Drena PE do alvo igual ao número de acertos causados.' },
    { name: 'Liquefeita', element: 'agua', tier: 'reinforced', desc: 'Ignora armaduras — dano vai direto para PV.' },
    { name: 'Drenante', element: 'agua', tier: 'reinforced', desc: 'Recupera Proteção igual ao número de acertos causados.' },
    { name: 'Exauriente', element: 'agua', tier: 'reinforced', desc: 'Acertos aumentam o custo de PE do alvo (acumula).' },
    { name: 'Carreadora', element: 'agua', tier: 'reinforced', desc: 'Dano dobrado contra Proteção metálica; se Prot=0, destrói o item.' },
    // Terra
    { name: 'Inabalável', element: 'terra', tier: 'basic', desc: 'Arma conta como escudo leve para fins de PV extras.' },
    { name: 'Geodizar', element: 'terra', tier: 'basic', desc: 'Crítico: Terreno Difícil + 3 dano de esmagamento.' },
    { name: 'Poeira', element: 'terra', tier: 'basic', desc: 'Acerto: Desvantagem no próximo ataque do alvo.' },
    { name: 'Pesada', element: 'terra', tier: 'basic', desc: 'Dano extra de esmagamento = POT em todos os acertos.' },
    { name: 'Tectônica', element: 'terra', tier: 'reinforced', desc: 'Acerto: CD 8+ANI (Acrobacia) ou alvo é Derrubado.' },
    { name: 'Gravitacional', element: 'terra', tier: 'reinforced', desc: 'Acerto: alvo fica Agarrado (POT oposto para escapar).' },
    { name: 'Fragmentada', element: 'terra', tier: 'reinforced', desc: 'Arma vira pedras — ignora coberturas; dano vira Terra.' },
    { name: 'Drenante', element: 'terra', tier: 'reinforced', desc: 'Recupera PV ao portador igual ao número de acertos.' },
    // Madeira
    { name: 'Venenosa', element: 'madeira', tier: 'basic', desc: 'Acerto: CD 8+ANI ou Envenenado (2 dano/turno).' },
    { name: 'Raízes', element: 'madeira', tier: 'basic', desc: 'Acerto: +1 PA em ações de movimento até fim do turno.' },
    { name: 'Folha Navalha', element: 'madeira', tier: 'basic', desc: 'Ao atacar, dispara folhas cortantes até 9m.' },
    { name: 'Fertilizante', element: 'madeira', tier: 'basic', desc: 'Acerto: Terreno Difícil de vegetação na posição do alvo.' },
    { name: 'Sangue-Suga', element: 'madeira', tier: 'reinforced', desc: 'CD 8+ANI ou alvo perde 2 PV/turno; portador recupera igual.' },
    { name: 'Forma Viva', element: 'madeira', tier: 'reinforced', desc: 'Arma se torna Leve e regenera Proteção sozinha (1/turno).' },
    { name: 'Enraizadora', element: 'madeira', tier: 'reinforced', desc: 'TODAS as ações do alvo custam +1 PA até fim do turno.' },
    { name: 'Diamantada', element: 'madeira', tier: 'reinforced', desc: 'Ignora toda Redução de Dano.' },
    // Metal
    { name: 'Têmpera', element: 'metal', tier: 'basic', desc: 'Ao rolar 6 e 5: gaste 2 PE para transformar o 5 em 6 (Crítico Natural).' },
    { name: 'Liga Leve', element: 'metal', tier: 'basic', desc: 'Arma passa a ser Leve (custo de PA -1, se aplicável).' },
    { name: 'Sequente', element: 'metal', tier: 'basic', desc: 'Primeiro ataque subsequente no turno custa 1 PA a menos.' },
    { name: 'Ameaçadora', element: 'metal', tier: 'basic', desc: '+2 dano base em todos os acertos.' },
    { name: 'Sequente Maior', element: 'metal', tier: 'reinforced', desc: 'Primeiro ataque subsequente no turno é gratuito (0 PA).' },
    { name: 'Brutal', element: 'metal', tier: 'reinforced', desc: '+1 dano por nível de acerto (1->+1, 2->+2, 3->+3, 4->+4).' },
    { name: 'Fúria', element: 'metal', tier: 'reinforced', desc: '3+ acertos: ganhe 1 PA extra naquele turno.' },
    { name: 'Assassina', element: 'metal', tier: 'reinforced', desc: 'Ao matar um alvo: +1 dano até próximo descanso (cumulativo).' }
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

    const idBase = 'weapon-' + r.name.toLowerCase().replace(/\s+/g, '-').replace(/[^\w-]/g, '') + '-' + r.element;
    const hash = crypto.createHash('md5').update(idBase).digest('hex').substring(0, 16);
    const fileName = 'Weapon_' + r.name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/\s+/g, '_').replace(/[^\w]/g, '') + '.yml';
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
        category: 'weapon',
        price: r.tier === 'reinforced' ? 1200 : 600
      },
      folder: folderId,
      _key: `!items!${hash}`
    };
    
    fs.writeFileSync(filePath, yaml.dump(data, { indent: 2, lineWidth: -1 }));
    console.log(`Created Weapon Rune: ${r.name} (${r.element})`);
});

console.log('Weapon Rune creation complete.');
