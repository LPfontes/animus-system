const fs = require('fs');
const path = require('path');

const targetDir = 'c:\\Users\\lpfon\\Downloads\\animus\\animus-system\\packs\\_source\\Animus\\itens\\Personalização\\Características Principais';

const properties = [
    { 
        name: "Equilibrada", 
        desc: "Troque o modificador de POTÊNCIA por HABILIDADE; adicione +1×HAB no multiplicador de cada acerto.",
        bonus: { attributeOverride: "hab", attrMult: { hab: 1 } },
        price: "100 Đ"
    },
    { 
        name: "Reforçada", 
        desc: "Aumente o multiplicador de POTÊNCIA (ou atributo base) de todos os acertos em 1.",
        bonus: { mult: 1 },
        price: "100 Đ"
    },
    { 
        name: "Estratégica", 
        desc: "Adicione 1×PERSPICÁCIA nos multiplicadores de dano.",
        bonus: { attrMult: { per: 1 } },
        price: "100 Đ"
    },
    { 
        name: "Peculiar", 
        desc: "Adicione 1×COGNIÇÃO nos multiplicadores de dano.",
        bonus: { attrMult: { cog: 1 } },
        price: "100 Đ"
    },
    { name: "Arremessável", desc: "Esta arma pode ser arremessada como um ataque à distância.", price: "50 Đ", bonus: { flags: { isThrown: true } } },
    { name: "Ocultável", desc: "Fácil de esconder; bônus em testes de Prestidigitação para ocultar.", price: "50 Đ", bonus: {} },
    { name: "Leve", desc: "Pode ser usada com Habilidade em vez de Potência; fácil de manejar.", price: "50 Đ", bonus: { flags: { isLight: true } } },
    { name: "Pesada", desc: "Exige POT 3+ para ser usada sem penalidade; dano massivo.", price: "50 Đ", bonus: {} },
    { name: "Versátil", desc: "Pode ser usada com uma ou duas mãos.", price: "50 Đ", bonus: { flags: { isVersatile: true } } },
    { name: "Ágil", desc: "Reduz o custo de PA para ataques rápidos.", price: "50 Đ", bonus: {} }
];

function generateId() {
    return Math.random().toString(36).substring(2, 18).padEnd(16, '0');
}

if (!fs.existsSync(targetDir)) fs.mkdirSync(targetDir, { recursive: true });

properties.forEach(p => {
    const id = generateId();
    const fileName = `${p.name.replace(/\s+/g, '_')}_${id}.yml`;
    const content = `_id: ${id}
name: ${p.name}
type: property
img: icons/svg/gear.svg
system:
  description: '${p.desc}'
  price: '${p.price}'
  subCategory: '2'
  bonus:
    damage: 0
    mult: ${p.bonus.mult || 0}
    defense: 0
    defenseMult: 0
    reach: 0
    attributeOverride: '${p.bonus.attributeOverride || ''}'
    attrMult:
      pot: ${p.bonus.attrMult?.pot || 0}
      hab: ${p.bonus.attrMult?.hab || 0}
      cog: ${p.bonus.attrMult?.cog || 0}
      per: ${p.bonus.attrMult?.per || 0}
      pre: 0
      ani: 0
    ac:
      ac1: 0
      ac2: 0
      ac3: 0
      ac4: 0
  flags:
    isLight: ${!!p.bonus.flags?.isLight}
    isVersatile: ${!!p.bonus.flags?.isVersatile}
    ignoreShields: false
    isSilent: false
    isThrown: ${!!p.bonus.flags?.isThrown}
folder: caracprincipai01
_key: '!items!${id}'
`;
    fs.writeFileSync(path.join(targetDir, fileName), content);
    console.log(`Recreated: ${fileName}`);
});
