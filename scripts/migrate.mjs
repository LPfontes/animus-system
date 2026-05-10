import fs from 'fs';
import path from 'path';

const DADOS_PATH = '../animus-generator/src/dados.json';
const PACKS_BASE = './packs';

if (!fs.existsSync(DADOS_PATH)) {
    console.error('dados.json não encontrado!');
    process.exit(1);
}

const dados = JSON.parse(fs.readFileSync(DADOS_PATH, 'utf8'));

const generateId = (name, salt = '') => {
    // Gerar um ID determinístico de 16 caracteres baseado no nome
    let hash = 0;
    const str = name + salt;
    for (let i = 0; i < str.length; i++) {
        hash = ((hash << 5) - hash) + str.charCodeAt(i);
        hash |= 0;
    }
    const hex = Math.abs(hash).toString(36).padStart(8, '0');
    const hex2 = Math.abs(hash * 31).toString(36).padStart(8, '0');
    return (hex + hex2).substring(0, 16);
};

const parseDamage = (str) => {
    if (!str) return { base: 0, mult: 0 };
    const match = str.match(/(\d+)(?:\s*\+\s*(\d+)x[A-Z]+)?/);
    if (!match) return { base: parseInt(str) || 0, mult: 0 };
    return {
        base: parseInt(match[1]) || 0,
        mult: parseInt(match[2]) || 0
    };
};

// --- Armas ---
const migrateWeapons = () => {
    const cats = ['corpo_a_corpo', 'longa_distancia', 'fogo'];
    let count = 0;
    cats.forEach(cat => {
        const list = dados.armas[cat];
        if (!list) return;
        list.forEach(w => {
            const id = generateId(w.nome, 'weapon');
            const item = {
                _id: id,
                _key: `!items!${id}`,
                name: w.nome,
                type: 'weapon',
                img: 'icons/weapons/swords/sword-guard-bronze.webp',
                system: {
                    description: `Tipo: ${w.tipo || ''}<br>${w.caracteristicas ? w.caracteristicas.join(', ') : ''}`,
                    damage: {
                        ac1: parseDamage(w.dano?.ac1),
                        ac2: parseDamage(w.dano?.ac2),
                        ac3: parseDamage(w.dano?.ac3),
                        ac4: parseDamage(w.dano?.ac4)
                    },
                    weight: parseInt(w.slots_mochila) || 0,
                    price: parseInt(w.preco) || 0,
                    properties: w.caracteristicas || []
                }
            };
            fs.writeFileSync(path.join(PACKS_BASE, 'armas', `${id}.json`), JSON.stringify(item, null, 2));
            count++;
        });
    });
    console.log(`Migradas ${count} armas.`);
};

// --- Talentos ---
const migrateTalents = () => {
    const cats = ['combate', 'pericia', 'elemento', 'ascendencia'];
    let count = 0;
    cats.forEach(cat => {
        const subCats = dados.talentos[cat];
        if (!subCats) return;
        
        // Iterar sobre as subcategorias (iniciantes, mestre, ou índices de ascendência)
        Object.values(subCats).forEach(content => {
            const items = Array.isArray(content) ? content : [content];
            items.forEach(t => {
                if (!t || !t.nome) return;
                const id = generateId(t.nome, 'talent');
                const item = {
                    _id: id,
                    _key: `!items!${id}`,
                    name: t.nome,
                    type: 'talent',
                    img: 'icons/skills/melee/strike-greataxe-orange.webp',
                    system: {
                        description: t.efeito || t.descricao || '',
                        trigger: t.gatilho || '',
                        requirements: {
                            description: t.requisito || ''
                        },
                        cost: parseInt(t.custo) || 0
                    }
                };
                fs.writeFileSync(path.join(PACKS_BASE, 'talentos', `${id}.json`), JSON.stringify(item, null, 2));
                count++;
            });
        });
    });
    console.log(`Migrados ${count} talentos.`);
};

// --- Propriedades ---
const migrateProperties = () => {
    let count = 0;
    Object.entries(dados.caracteristicas_armas).forEach(([name, desc]) => {
        const id = generateId(name, 'property');
        const item = {
            _id: id,
            _key: `!items!${id}`,
            name: name,
            type: 'property',
            img: 'icons/skills/trades/smithing-anvil-silver.webp',
            system: {
                description: typeof desc === 'string' ? desc : JSON.stringify(desc)
            }
        };
        fs.writeFileSync(path.join(PACKS_BASE, 'propriedades', `${id}.json`), JSON.stringify(item, null, 2));
        count++;
    });
    console.log(`Migradas ${count} propriedades.`);
};

migrateWeapons();
migrateTalents();
migrateProperties();
console.log('Migração concluída!');
