import fs from 'fs';
import path from 'path';
import yaml from 'js-yaml';

const BASE_PATH = 'c:/Users/lpfon/Downloads/animus/animus-system';
const REGRAS_PATH = path.join(BASE_PATH, 'packs/_source/Animus/regras/regras');
const ITENS_PATH = path.join(BASE_PATH, 'packs/_source/Animus/itens');
const LANG_FILE = path.join(BASE_PATH, 'lang/pt-BR.json');

function cleanDescription(desc) {
    if (!desc) return '';
    return desc
        .replace(/<br>/g, '\n')
        .replace(/<[^>]*>/g, '')
        .replace(/&nbsp;/g, ' ')
        .trim();
}

async function compileRules() {
    let output = '# Regras do Sistema Animus RPG\n\n';

    // 1. Attributes and Skills
    const lang = JSON.parse(fs.readFileSync(LANG_FILE, 'utf8'));
    output += '## Atributos e Perícias\n\n';
    output += '### Atributos\n';
    const attributes = [
        ['ANIMUS.POT', 'Potência'],
        ['ANIMUS.HAB', 'Habilidade'],
        ['ANIMUS.COG', 'Cognição'],
        ['ANIMUS.PER', 'Perspicácia'],
        ['ANIMUS.PRE', 'Presença'],
        ['ANIMUS.ANI', 'Anima']
    ];
    attributes.forEach(([key, name]) => {
        output += `- **${lang[key]}**: ${name}\n`;
    });

    output += '\n### Recursos\n';
    const resources = [
        ['ANIMUS.HP', 'Pontos de Vida'],
        ['ANIMUS.PE', 'Pontos de Energia'],
        ['ANIMUS.PA', 'Pontos de Ação']
    ];
    resources.forEach(([key, name]) => {
        output += `- **${lang[key]}**: ${name}\n`;
    });

    output += '\n### Perícias\n';
    const skills = Object.keys(lang).filter(k => k.startsWith('ANIMUS.Skill')).map(k => lang[k]);
    skills.forEach(skill => {
        output += `- ${skill}\n`;
    });

    output += '\n---\n\n';

    // 2. Sections from Regras Compendium
    const sections = [
        { name: 'Ações', path: 'Ações', title: 'Ações de Combate', base: REGRAS_PATH },
        { name: 'Condições', path: 'Condições', title: 'Condições', base: REGRAS_PATH },
        { name: 'Ascendências', path: 'Ascendências', title: 'Ascendências (Raças)', base: REGRAS_PATH },
        { name: 'Elementos', path: 'Elementos', title: 'Elementos', base: REGRAS_PATH }
    ];

    for (const section of sections) {
        output += `## ${section.title}\n\n`;
        const dirPath = path.join(section.base, section.path);
        if (fs.existsSync(dirPath)) {
            const files = fs.readdirSync(dirPath).filter(f => f.endsWith('.yml') && !f.startsWith('_'));
            files.sort().forEach(file => {
                const content = yaml.load(fs.readFileSync(path.join(dirPath, file), 'utf8'));
                output += `### ${content.name}\n`;
                if (content.system?.description) {
                    output += `${cleanDescription(content.system.description)}\n\n`;
                }
                if (content.system?.cost !== undefined && content.system.cost > 0) {
                    output += `**Custo:** ${content.system.cost} PA\n\n`;
                }
                if (content.system?.requirements?.description) {
                    output += `**Requisitos:** ${content.system.requirements.description}\n\n`;
                }
            });
        }
        output += '\n---\n\n';
    }

    // 3. Weapon Properties
    output += '## Propriedades de Armas\n\n';
    const propsPaths = [
        { title: 'Características Principais', path: 'Personalização/Características Principais' },
        { title: 'Características Complementares', path: 'Personalização/Características Complementares' }
    ];

    for (const propSection of propsPaths) {
        output += `### ${propSection.title}\n\n`;
        const dirPath = path.join(ITENS_PATH, propSection.path);
        if (fs.existsSync(dirPath)) {
            const processDir = (d) => {
                const items = fs.readdirSync(d);
                items.sort().forEach(item => {
                    const fullPath = path.join(d, item);
                    if (fs.statSync(fullPath).isDirectory()) {
                        processDir(fullPath);
                    } else if (item.endsWith('.yml') && !item.startsWith('_')) {
                        const content = yaml.load(fs.readFileSync(fullPath, 'utf8'));
                        output += `#### ${content.name}\n`;
                        if (content.system?.description) {
                            output += `${cleanDescription(content.system.description)}\n\n`;
                        }
                    }
                });
            };
            processDir(dirPath);
        }
    }
    output += '\n---\n\n';

    // 4. Talents
    output += '## Talentos\n\n';
    const talentsPath = path.join(REGRAS_PATH, 'Talentos');
    if (fs.existsSync(talentsPath)) {
        const files = fs.readdirSync(talentsPath).filter(f => f.endsWith('.yml') && !f.startsWith('_'));
        files.sort().forEach(file => {
            const content = yaml.load(fs.readFileSync(path.join(talentsPath, file), 'utf8'));
            output += `### ${content.name}\n`;
            if (content.system?.description) {
                output += `${cleanDescription(content.system.description)}\n\n`;
            }
            if (content.system?.cost !== undefined && content.system.cost > 0) {
                output += `**Custo:** ${content.system.cost} PA\n\n`;
            }
            if (content.system?.requirements?.description) {
                output += `**Requisitos:** ${content.system.requirements.description}\n\n`;
            }
        });
    }

    fs.writeFileSync(path.join(BASE_PATH, 'Regras_do_Sistema_Animus.md'), output);
    console.log('Documento de regras gerado com sucesso!');
}

compileRules().catch(console.error);
