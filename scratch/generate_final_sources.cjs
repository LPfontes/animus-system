
const fs = require('fs');
const path = require('path');
const YAML = require('js-yaml');
const crypto = require('crypto');

const dadosPath = 'c:/Users/lpfon/Downloads/animus/animus-generator/src/dados.json';
const targetBaseDir = 'c:/Users/lpfon/Downloads/animus/animus-system/packs/_source';

const dados = JSON.parse(fs.readFileSync(dadosPath, 'utf8'));

function generateStableId(input) {
    return crypto.createHash('md5').update(input).digest('hex').substring(0, 16);
}

function getSafeFilename(name) {
    if (!name) return "unnamed";
    return name.normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]/gi, '_');
}

const CONFIG_MAPS = {
    attributes: {
        pot: 0, hab: 1, cog: 2, per: 3, pre: 4, ani: 5
    },
    skills: {
        atletismo: 0, luta: 1, resistencia: 2, proeza: 3,
        acrobacia: 4, furtividade: 5, pontaria: 6, prestidigitacao: 7,
        oficio: 8, natureza: 9, con_arcano: 10, medicina: 11,
        percepcao: 12, compreensao: 13, sobrevivencia: 14, investigacao: 15,
        persuasao: 16, intimidacao: 17, enganacao: 18, performance: 19,
        elemento: 20, aura: 21, intuicao: 22, controle: 23
    }
};

const DADOS_SKILLS_ID_MAP = {
    1: "atletismo", 2: "luta", 3: "resistencia", 4: "proeza",
    5: "acrobacia", 6: "furtividade", 7: "pontaria", 8: "prestidigitacao",
    9: "oficio", 10: "natureza", 11: "con_arcano", 12: "medicina",
    13: "percepcao", 14: "compreensao", 15: "sobrevivencia", 16: "investigacao",
    17: "persuasao", 18: "intimidacao", 19: "enganacao", 20: "performance",
    21: "elemento", 22: "aura", 23: "intuicao", 24: "controle"
};

const DADOS_ATTR_ID_MAP = {
    1: "pot", 2: "hab", 3: "cog", 4: "per", 5: "pre", 6: "ani"
};

const TALENT_ID_TO_NAME = {};
const TALENT_ID_TO_STABLE_ID = {};
const TALENT_NAME_TO_STABLE_ID = {};

// Mapear todos os nomes e IDs estáveis para poder resolver requisitos
Object.values(dados.talentos).forEach(category => {
    Object.values(category).forEach(subList => {
        if (Array.isArray(subList)) {
            subList.forEach(t => {
                const stableId = generateStableId(t.nome);
                TALENT_ID_TO_NAME[t.id] = t.nome;
                TALENT_ID_TO_STABLE_ID[t.id] = stableId;
                TALENT_NAME_TO_STABLE_ID[t.nome.toLowerCase()] = stableId;
            });
        }
    });
});

function parseCost(costStr) {
    if (!costStr) return { pa: 0, pe: 0 };
    const paMatch = costStr.match(/(\d+)\s*PA/i);
    const peMatch = costStr.match(/(\d+)\s*PE/i);
    return {
        pa: paMatch ? parseInt(paMatch[1]) : 0,
        pe: peMatch ? parseInt(peMatch[1]) : 0
    };
}

function findTalentsInText(text) {
    if (!text) return {};
    const found = {};
    const lowerText = text.toLowerCase();
    
    const sortedNames = Object.keys(TALENT_NAME_TO_STABLE_ID).sort((a, b) => b.length - a.length);
    
    let remainingLowerText = lowerText;
    for (const name of sortedNames) {
        if (name.length < 4) continue;
        
        if (remainingLowerText.includes(name)) {
            const stableId = TALENT_NAME_TO_STABLE_ID[name];
            // Encontrar o nome original (com casing correto)
            const originalName = Object.values(TALENT_ID_TO_NAME).find(n => n.toLowerCase() === name);
            found[originalName || name] = stableId;
            remainingLowerText = remainingLowerText.replace(name, ""); 
        }
    }
    return found;
}

function ensureFolder(parentPath, folderName, folderId, parentFolderId = null) {
    const physicalPath = path.join(parentPath, getSafeFilename(folderName));
    if (!fs.existsSync(physicalPath)) fs.mkdirSync(physicalPath, { recursive: true });

    const folderFile = path.join(physicalPath, '_folder.yml');
    if (!fs.existsSync(folderFile)) {
        const folderDoc = {
            _id: folderId,
            name: folderName,
            type: "Item",
            folder: parentFolderId,
            sorting: "a",
            _key: `!folders!${folderId}`
        };
        fs.writeFileSync(folderFile, YAML.dump(folderDoc));
    }
    return { physicalPath, folderId };
}

async function generate() {
    if (fs.existsSync(targetBaseDir)) fs.rmSync(targetBaseDir, { recursive: true, force: true });
    fs.mkdirSync(targetBaseDir, { recursive: true });

    // --- PACK: ITENS ---
    const itensPath = path.join(targetBaseDir, 'itens');
    fs.mkdirSync(itensPath, { recursive: true });

    // 1. Armas
    const armasFolder = ensureFolder(itensPath, "Armas", generateStableId("root_armas"));
    for (const [cat, list] of Object.entries(dados.armas)) {
        if (!Array.isArray(list)) continue;
        const catFolder = ensureFolder(armasFolder.physicalPath, cat.replace(/_/g, ' ').toUpperCase(), generateStableId(`armas_${cat}`), armasFolder.folderId);
        list.forEach(item => {
            const id = generateStableId(`itens_weapon_${cat}_${item.nome}`);
            const doc = {
                _id: id,
                name: item.nome,
                type: "weapon",
                img: `systems/animus/assets/system-icons/weapon/${getSafeFilename(item.nome).toLowerCase()}.svg`,
                system: {
                    description: `Tipo: ${item.tipo || ""}<br>${Array.isArray(item.caracteristicas) ? item.caracteristicas.join(', ') : ""}`,
                    damage: item.dano || {},
                    weight: item.peso || 0,
                    price: item.preco || "",
                    check: {
                        attribute: item.tipo === "Ranged" ? 1 : 0,
                        skill: item.tipo === "Ranged" ? 6 : 1,
                        dc: 0
                    }
                },
                folder: catFolder.folderId,
                _key: `!items!${id}`
            };
            fs.writeFileSync(path.join(catFolder.physicalPath, `${getSafeFilename(item.nome)}_${id}.yml`), YAML.dump(doc));
        });
    }

    // 2. Armaduras & Escudos
    const equipFolder = ensureFolder(itensPath, "Equipamento", generateStableId("root_equip"));
    if (dados.armaduras && Array.isArray(dados.armaduras.tabela_base)) {
        const armadurasFolder = ensureFolder(equipFolder.physicalPath, "Armaduras", generateStableId("equip_armaduras"), equipFolder.folderId);
        dados.armaduras.tabela_base.forEach(item => {
            const itemName = item.categoria || "Armadura Desconhecida";
            const id = generateStableId(`itens_armor_base_${itemName}`);
            const doc = {
                _id: id,
                name: itemName,
                type: "armor",
                img: "systems/animus/assets/system-icons/armor/breastplate.svg",
                system: {
                    description: `Proteção: +${item.protecao_base || 0}<br>Penalidade: ${item.penalidade || "Nenhuma"}<br>Lógica: ${item.logica_calculo || ""}`,
                    weight: item.peso || 0,
                    price: item.preco || ""
                },
                folder: armadurasFolder.folderId,
                _key: `!items!${id}`
            };
            fs.writeFileSync(path.join(armadurasFolder.physicalPath, `${getSafeFilename(itemName)}_${id}.yml`), YAML.dump(doc));
        });
    }

    if (dados.escudos && Array.isArray(dados.escudos.tabela_base)) {
        const escudosFolder = ensureFolder(equipFolder.physicalPath, "Escudos", generateStableId("equip_escudos"), equipFolder.folderId);
        dados.escudos.tabela_base.forEach(item => {
            const itemName = item.categoria || "Escudo Desconhecido";
            const id = generateStableId(`itens_shield_base_${itemName}`);
            const doc = {
                _id: id,
                name: itemName,
                type: "armor",
                img: "systems/animus/assets/system-icons/armor/dragon-shield.svg",
                system: {
                    description: `PVs Base: ${item.pvs_base || 0}<br>Restrição: ${item.restricao || "Nenhuma"}<br>Lógica: ${item.logica_calculo || ""}`,
                    weight: item.peso || 0,
                    price: item.preco || ""
                },
                folder: escudosFolder.folderId,
                _key: `!items!${id}`
            };
            fs.writeFileSync(path.join(escudosFolder.physicalPath, `${getSafeFilename(itemName)}_${id}.yml`), YAML.dump(doc));
        });
    }

    // 3. Itens Secundários
    const secundaryFolder = ensureFolder(itensPath, "Secundarios", generateStableId("root_secundary"));
    for (const [cat, list] of Object.entries(dados.itens_secundarios)) {
        if (!Array.isArray(list)) continue;
        const catFolder = ensureFolder(secundaryFolder.physicalPath, cat.replace(/_/g, ' ').toUpperCase(), generateStableId(`itens_sec_${cat}`), secundaryFolder.folderId);
        list.forEach(item => {
            const id = generateStableId(`itens_sec_${cat}_${item.nome}`);
            const doc = {
                _id: id,
                name: item.nome,
                type: "item",
                img: "icons/svg/item-bag.svg",
                system: {
                    description: item.efeito || item.descricao || "",
                    weight: item.peso || 0,
                    price: item.preco || ""
                },
                folder: catFolder.folderId,
                _key: `!items!${id}`
            };
            fs.writeFileSync(path.join(catFolder.physicalPath, `${getSafeFilename(item.nome)}_${id}.yml`), YAML.dump(doc));
        });
    }

    // --- PACK: TALENTOS ---
    const talentosPath = path.join(targetBaseDir, 'talentos');
    fs.mkdirSync(talentosPath, { recursive: true });
    for (const [cat, subCats] of Object.entries(dados.talentos)) {
        if (cat === "ascendencia") continue;
        const catFolder = ensureFolder(talentosPath, cat.charAt(0).toUpperCase() + cat.slice(1), generateStableId(`tal_root_${cat}`));
        if (Array.isArray(subCats)) {
            subCats.forEach(item => {
                const id = generateStableId(`talentos_${cat}_root_${item.nome}`);
                const doc = {
                    _id: id,
                    name: item.nome,
                    type: "talent",
                    img: "systems/animus/assets/system-icons/book/book-aura.svg",
                    system: {
                        description: item.efeito || "",
                        trigger: item.gatilho || "",
                        requirements: { 
                            description: item.requisito || "",
                            talents: {
                                ...Object.fromEntries((item.requisitos_talentos_ids || []).map(id => [TALENT_ID_TO_NAME[id], TALENT_ID_TO_STABLE_ID[id]]).filter(([n, id]) => !!n && !!id)),
                                ...findTalentsInText(item.requisito)
                            },
                            attributes: (item.requisitos_atributos || []).map(r => ({
                                key: DADOS_ATTR_ID_MAP[r.id] || "pot",
                                value: r.valor || 1
                            })),
                            skills: (item.requisitos_pericias || []).map(r => ({
                                key: DADOS_SKILLS_ID_MAP[r.id] || "atletismo",
                                rank: r.rank || 1
                            }))
                        },
                        cost: parseCost(item.custo).pe,
                        action: parseCost(item.custo).pa,
                        check: {
                            attribute: -1,
                            skill: item.teste ? (CONFIG_MAPS.skills[item.teste.tipo?.toLowerCase().replace(/[^a-z]/g, '')] ?? -1) : -1,
                            dc: parseInt(item.teste?.cd) || 0
                        }
                    },
                    folder: catFolder.folderId,
                    _key: `!items!${id}`
                };
                fs.writeFileSync(path.join(catFolder.physicalPath, `${getSafeFilename(item.nome)}_${id}.yml`), YAML.dump(doc));
            });
        } else {
            for (const [sub, list] of Object.entries(subCats)) {
                if (!Array.isArray(list)) continue;
                const subFolder = ensureFolder(catFolder.physicalPath, sub.charAt(0).toUpperCase() + sub.slice(1), generateStableId(`tal_${cat}_${sub}`), catFolder.folderId);
                list.forEach(item => {
                    const id = generateStableId(`talentos_${cat}_${sub}_${item.nome}`);
                    const doc = {
                        _id: id,
                        name: item.nome,
                        type: "talent",
                        img: "systems/animus/assets/system-icons/book/book-aura.svg",
                        system: {
                            description: item.efeito || "",
                            trigger: item.gatilho || "",
                            requirements: { 
                                description: item.requisito || "",
                                talents: {
                                    ...Object.fromEntries((item.requisitos_talentos_ids || []).map(id => [TALENT_ID_TO_NAME[id], TALENT_ID_TO_STABLE_ID[id]]).filter(([n, id]) => !!n && !!id)),
                                    ...findTalentsInText(item.requisito)
                                },
                                attributes: (item.requisitos_atributos || []).map(r => ({
                                    key: DADOS_ATTR_ID_MAP[r.id] || "pot",
                                    value: r.valor || 1
                                })),
                                skills: (item.requisitos_pericias || []).map(r => ({
                                    key: DADOS_SKILLS_ID_MAP[r.id] || "atletismo",
                                    rank: r.rank || 1
                                }))
                            },
                            cost: parseCost(item.custo).pe,
                            action: parseCost(item.custo).pa,
                            check: {
                                attribute: -1,
                                skill: item.teste ? (CONFIG_MAPS.skills[item.teste.tipo?.toLowerCase().replace(/[^a-z]/g, '')] ?? -1) : -1,
                                dc: parseInt(item.teste?.cd) || 0
                            }
                        },
                        folder: subFolder.folderId,
                        _key: `!items!${id}`
                    };
                    fs.writeFileSync(path.join(subFolder.physicalPath, `${getSafeFilename(item.nome)}_${id}.yml`), YAML.dump(doc));
                });
            }
        }
    }

    // --- PACK: ASCENDENCIAS ---
    const ascPath = path.join(targetBaseDir, 'ascendencias');
    fs.mkdirSync(ascPath, { recursive: true });
    dados.ascendencias.forEach(item => {
        const id = generateStableId(`asc_${item.nome}`);
        let abilitiesHtml = "<h3>Habilidades Inatas</h3><ul>";
        if (Array.isArray(item.habilidades_inatas)) {
            item.habilidades_inatas.forEach(h => {
                abilitiesHtml += `<li><strong>${h.nome}:</strong> ${h.efeito_mecanico || ""}<br>${h.descricao || ""}</li>`;
            });
        }
        abilitiesHtml += "</ul>";
        const doc = {
            _id: id,
            name: item.nome,
            type: "ascendancy",
            img: `systems/animus/assets/system-icons/ascendancies/${getSafeFilename(item.nome).toLowerCase()}.svg`,
            system: {
                description: abilitiesHtml,
                bonus: {
                    value: item.bonus_valor || 0,
                    attributes: (item.bonus_atributo_opcoes || []).map(a => a.toLowerCase()),
                    selectedAttribute: ""
                },
                innateAbilities: (item.habilidades_inatas || []).map(h => ({
                    name: h.nome,
                    description: h.descricao || "",
                    mechanicalEffect: h.efeito_mecanico || ""
                }))
            },
            _key: `!items!${id}`
        };
        fs.writeFileSync(path.join(ascPath, `${getSafeFilename(item.nome)}_${id}.yml`), YAML.dump(doc));
    });

    // --- PACK: ELEMENTOS ---
    const elemPath = path.join(targetBaseDir, 'elementos');
    fs.mkdirSync(elemPath, { recursive: true });
    dados.elementos.forEach(item => {
        const id = generateStableId(`elem_${item.nome}`);
        // 1. Tabela de Dano
        let descriptionHtml = "<h3>Tabela de Dano</h3><table border='1'><tr><th>Nível PE</th><th>AC1</th><th>AC2</th><th>AC3</th><th>AC4</th></tr>";
        if (item.tabela_dano) {
            for (const [lvl, data] of Object.entries(item.tabela_dano)) {
                descriptionHtml += `<tr><td>${data.pe} PE</td><td>${data.ac1.base}+${data.ac1.mult}d</td><td>${data.ac2.base}+${data.ac2.mult}d</td><td>${data.ac3.base}+${data.ac3.mult}d</td><td>${data.ac4.base}+${data.ac4.mult}d</td></tr>`;
            }
        }
        descriptionHtml += "</table>";

        // 2. Tabela de Cura (Se existir)
        if (item.tabela_cura) {
            descriptionHtml += "<h3>Tabela de Cura</h3><table border='1'><tr><th>Nível PE</th><th>1 acerto</th><th>2 acertos</th><th>3 acertos</th><th>4 acertos (crít.)</th></tr>";
            for (const [lvl, data] of Object.entries(item.tabela_cura)) {
                descriptionHtml += `<tr><td>${data.pe} PE</td><td>${data.ac1.base}+${data.ac1.mult}×ANI</td><td>${data.ac2.base}+${data.ac2.mult}×ANI</td><td>${data.ac3.base}+${data.ac3.mult}×ANI</td><td>${data.ac4.base}+${data.ac4.mult}×ANI</td></tr>`;
            }
            descriptionHtml += "</table>";
        }

        const doc = {
            _id: id,
            name: item.nome,
            type: "element",
            img: `systems/animus/assets/system-icons/elements/${getSafeFilename(item.nome).toLowerCase()}.svg`,
            system: {
                description: descriptionHtml,
                strength: item.forca,
                weakness: item.fraqueza,
                bonus: {
                    value: 1,
                    attributes: (item.bonus || "").toLowerCase().split(/ ou | e /).map(s => s.trim()).filter(s => s),
                    selectedAttribute: ""
                },
                range: item.alcance_nativo,
                rhythm: item.ritmo,
                damageTable: item.tabela_dano || {},
                healTable: item.tabela_cura || {}
            },
            _key: `!items!${id}`
        };
        fs.writeFileSync(path.join(elemPath, `${getSafeFilename(item.nome)}_${id}.yml`), YAML.dump(doc));
    });

    // --- PACK: PROPRIEDADES ---
    const propPath = path.join(targetBaseDir, 'propriedades');
    fs.mkdirSync(propPath, { recursive: true });
    
    // 1. Características Básicas
    const basePropFolder = ensureFolder(propPath, "Basicas", generateStableId("prop_root_base"));
    for (const [name, desc] of Object.entries(dados.caracteristicas_armas)) {
        const id = generateStableId(`prop_base_${name}`);
        const doc = {
            _id: id,
            name: name,
            type: "item",
            img: "icons/svg/gear.svg",
            system: { description: desc },
            folder: basePropFolder.folderId,
            _key: `!items!${id}`
        };
        fs.writeFileSync(path.join(basePropFolder.physicalPath, `${getSafeFilename(name)}_${id}.yml`), YAML.dump(doc));
    }

    // 2. Características Modulares
    const modPropFolder = ensureFolder(propPath, "Modulares", generateStableId("prop_root_mod"));
    if (dados.armas.caracteristicas_modulares) {
        for (const [sub, list] of Object.entries(dados.armas.caracteristicas_modulares)) {
            const subFolder = ensureFolder(modPropFolder.physicalPath, sub.replace(/_/g, ' ').toUpperCase(), generateStableId(`prop_mod_${sub}`), modPropFolder.folderId);
            list.forEach(item => {
                const id = generateStableId(`prop_mod_${sub}_${item.nome}`);
                const doc = {
                    _id: id,
                    name: item.nome,
                    type: "item",
                    img: "icons/svg/upgrade.svg",
                    system: {
                        description: `${item.efeito || ""}<br>${item.requisito ? `Requisito: ${item.requisito}` : ""}`,
                        price: item.preco || ""
                    },
                    folder: subFolder.folderId,
                    _key: `!items!${id}`
                };
                fs.writeFileSync(path.join(subFolder.physicalPath, `${getSafeFilename(item.nome)}_${id}.yml`), YAML.dump(doc));
            });
        }
    }

    // --- PACK: ACOES ---
    const acoesPath = path.join(targetBaseDir, 'acoes');
    if (!fs.existsSync(acoesPath)) fs.mkdirSync(acoesPath, { recursive: true });

    const commonActions = [
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

    commonActions.forEach(a => {
        const id = generateStableId(`action_${a.name.toLowerCase()}`);
        let img = "systems/animus/assets/system-icons/action/targeting.svg";
        if (a.name.includes("Atacar")) img = "systems/animus/assets/system-icons/weapon/sword-clash.svg";
        if (a.name.includes("Mover")) img = "systems/animus/assets/system-icons/action/sprint.svg";
        if (a.name.includes("Manobra")) img = "systems/animus/assets/system-icons/action/grab.svg";
        if (a.name.includes("Sacar")) img = "systems/animus/assets/system-icons/action/switch-weapon.svg";
        if (a.name.includes("Item")) img = "systems/animus/assets/system-icons/bag/briefcase.svg";
        if (a.name.includes("Reações")) img = "systems/animus/assets/system-icons/action/broken-shield.svg";
        if (a.name.includes("Elemental")) img = "systems/animus/assets/system-icons/elements/caos.svg";

        const doc = {
            _id: id,
            name: a.name,
            type: "action",
            img: img,
            system: {
                description: a.desc,
                cost: a.pa
            },
            _key: `!items!${id}`
        };
        fs.writeFileSync(path.join(acoesPath, `${getSafeFilename(a.name)}_${id}.yml`), YAML.dump(doc));
    });

    console.log('V6 (Heal Table & Actions Integration) generation of YAML sources finished.');
}

generate();
