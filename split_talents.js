import fs from 'fs';
import path from 'path';

const talents = [
  // Comuns 01
  { id: 'npcTalent0000001', name: 'Musculatura Densa', cost: 3, cat: 'combate', desc: '<p>+1 POT efetivo. Ataques físicos causam +2 de dano fixo em todos os acertos.</p>', tier: 'comuns', icon: 'talentos/combate/28.png', bonuses: { attributes: { pot: 1 }, damage: 2 } },
  { id: 'npcTalent0000002', name: 'Agilidade Predatória', cost: 3, cat: 'combate', desc: '<p>+1 HAB efetivo. A criatura nunca fica Desprevenida enquanto consciente. +1d em iniciativa.</p>', tier: 'comuns', icon: 'talentos/combate/2.png', bonuses: { attributes: { hab: 1 } } },
  { id: 'npcTalent0000003', name: 'Constituição Robusta', cost: 3, cat: 'defensivo', desc: '<p>+15 PV máximos. Imune a dano de Sangramento.</p>', tier: 'comuns', bonuses: { hp: 15 } },
  { id: 'npcTalent0000004', name: 'Impassível', cost: 2, cat: 'mental', desc: '<p>Imune a medo, charme e condições psicológicas. Falha automática em testes de PRE/COG voluntários.</p>', tier: 'comuns', bonuses: { resistances: { mental: 2 } } },
  { id: 'npcTalent0000005', name: 'Pele Endurecida', cost: 3, cat: 'defensivo', desc: '<p>Redução de Dano 2 contra ataques físicos não-elementais.</p>', tier: 'comuns', bonuses: { resistances: { physical: 2 } } },
  // Comuns 02
  { id: 'npcTalent0000006', name: 'Presas e Garras', cost: 2, cat: 'combate', desc: '<p>Ataque causa Sangramento com X+ acertos (definido ao criar). CD Resistência para encerrar.</p>', tier: 'comuns', specialActions: ["Sangramento"] },
  { id: 'npcTalent0000007', name: 'Percepção Aguçada', cost: 2, cat: 'utilitario', desc: '<p>+1 PER efetiva. +1d em Percepção. Nunca surpreendido por ataques fora do campo visual.</p>', tier: 'comuns', bonuses: { attributes: { per: 1 } } },
  { id: 'npcTalent0000008', name: 'Anima Latente', cost: 3, cat: 'utilitario', desc: '<p>+8 PE máximos. Regenera PE mais rápido entre cenas.</p>', tier: 'comuns', bonuses: { pe: 8 } },
  { id: 'npcTalent0000009', name: 'Presença Ameaçadora', cost: 3, cat: 'combate', desc: '<p>+1 PRE efetivo. Alvo faz teste PRE (CD variável) ou perde 1 PA no 1º turno.</p>', tier: 'comuns', bonuses: { attributes: { pre: 1 } }, check: { attr: 'pre', cd: 'Variável' }, specialActions: ["Amedrontar"] },
  { id: 'npcTalent0000010', name: 'Mente de Predador', cost: 2, cat: 'utilitario', desc: '<p>Nunca enganada por ilusões ou Enganação. Detecta mentiras automaticamente.</p>', tier: 'comuns' },
  { id: 'npcTalent0000011', name: 'Adaptável', cost: 1, cat: 'utilitario', desc: '<p>Usa qualquer equipamento sem penalidade. Pode improvisar armas ou ferramentas.</p>', tier: 'comuns' },
  { id: 'npcTalent0000012', name: 'Corpo de Brasas', cost: 2, cat: 'combate', desc: '<p>Contato com a criatura causa 1d6 dano de fogo ao atacante corpo a corpo.</p>', tier: 'comuns', formula: '1d6' },
  // Raros
  { id: 'npcTalentR000001', name: 'Investida Esmagadora', cost: 4, cat: 'combate', desc: '<p>Com X+ acertos: o alvo deve fazer um teste de POT (CD variável) ou fica Derrubado e perde 1 PA.</p>', tier: 'raros', check: { attr: 'pot', cd: 'Variável' }, specialActions: ["Derrubar"] },
  { id: 'npcTalentR000002', name: 'Mordida Interna', cost: 4, cat: 'combate', desc: '<p>Com X+ acertos, pode gastar 2 PA para Agarrar o alvo automaticamente (CD POT para escapar).</p>', tier: 'raros', check: { attr: 'pot', cd: 'Variável' }, specialActions: ["Agarrar"] },
  { id: 'npcTalentR000003', name: 'Sopro Elemental', cost: 4, cat: 'elemental', desc: '<p>2-3 PA + PE: Cone ou área de dano elemental com CD Resistência para reduzir à metade.</p>', tier: 'raros', icon: 'elementais/fogo/1.png', formula: '3d6 + 5' },
  { id: 'npcTalentR000004', name: 'Canto Compulsório', cost: 5, cat: 'mental', desc: '<p><strong>Passiva:</strong> Alvos que se aproximarem da criatura devem fazer um teste de PRE (CD variável) ou perdem sua próxima ação.</p>', tier: 'raros', check: { attr: 'pre', cd: 'Variável' } },
  { id: 'npcTalentR000005', name: 'Toque do Abismo', cost: 4, cat: 'sobrenatural', desc: '<p>2 PA + PE: Toque que aplica a condição <strong>Enfeitiçado</strong> por X rodadas.</p>', tier: 'raros', specialActions: ["Enfeitiçar"] },
  { id: 'npcTalentR000006', name: 'Barreira de Maré', cost: 3, cat: 'defensivo', desc: '<p><strong>Reação + PE:</strong> Ao ser atingida, empurra o atacante X metros e pode cancelar o ataque completamente.</p>', tier: 'raros', specialActions: ["Empurrar"] },
  { id: 'npcTalentR000007', name: 'Ilusão de Trilha', cost: 3, cat: 'mental', desc: '<p>1 PA + PE: Alvo deve fazer um teste de PER ou gasta todo o seu movimento na direção errada.</p>', tier: 'raros', check: { attr: 'per', cd: 'Variável' } },
  { id: 'npcTalentR000008', name: 'Sumiço no Vento', cost: 4, cat: 'utilitario', desc: '<p>Após uma ação bem-sucedida: gasta 2 PE para ficar invisível até o início do seu próximo turno.</p>', tier: 'raros', specialActions: ["Invisibilidade"] },
  { id: 'npcTalentR000009', name: 'Água Corrosiva', cost: 3, cat: 'combate', desc: '<p><strong>Reação + PE:</strong> Atacante deve fazer um teste de HAB ou perde 1 PA e recebe uma penalidade de -1d por 1 rodada.</p>', tier: 'raros', check: { attr: 'hab', cd: 'Variável' } },
  { id: 'npcTalentR000010', name: 'Ataque Furtivo', cost: 3, cat: 'combate', desc: '<p>Se estiver oculto ou flanqueando: +1d de dano no primeiro ataque do turno.</p>', tier: 'raros' },
  { id: 'npcTalentR000011', name: 'Roubo de Oportunidade', cost: 3, cat: 'utilitario', desc: '<p><strong>Ação Livre (1x/rodada):</strong> Rouba um item não-equipado de um alvo a menos de 2 metros.</p>', tier: 'raros', specialActions: ["Roubar"] },
  { id: 'npcTalentR000012', name: 'Alvo Identificado', cost: 4, cat: 'combate', desc: '<p><strong>Pré-combate:</strong> Designa 1 alvo. Contra ele, você recebe +1d e a CD das suas condições aumenta em +2.</p>', tier: 'raros', specialActions: ["Marcar Alvo"] },
  { id: 'npcTalentR000013', name: 'Névoa de Memória', cost: 4, cat: 'mental', desc: '<p>2 PA + PE: Névoa em área. Alvos devem fazer teste de COG ou agem contra um aliado aleatório no próximo turno.</p>', tier: 'raros', check: { attr: 'cog', cd: 'Variável' } },
  { id: 'npcTalentR000014', name: 'Camuflagem Natural', cost: 3, cat: 'utilitario', desc: '<p>Em bioma específico: Vantagem em Furtividade. Exige teste de PER CD X para ser detectado estático.</p>', tier: 'raros' },
  { id: 'npcTalentR000015', name: 'Invocação de Servos', cost: 5, cat: 'sobrenatural', desc: '<p>3 PA: Invoca X aliados de ND menor por X rodadas. Máximo de 2x por combate.</p>', tier: 'raros', specialActions: ["Invocar"] },
  // Misticos
  { id: 'npcTalentM000001', name: 'Domínio Mental', cost: 6, cat: 'mental', desc: '<p>2 PA + PE: O alvo deve fazer um teste de PRE/COG (CD alta) ou fica <strong>Dominado</strong> por 1 rodada.</p>', tier: 'misticos', icon: 'criaturas/demonios/5.png', check: { attr: 'pre', cd: 'Alta' }, specialActions: ["Dominar"] },
  { id: 'npcTalentM000002', name: 'Resistência Ancestral', cost: 6, cat: 'defensivo', desc: '<p>Redução de Dano 3 contra todos os ataques. Pode ter uma condição de morte especial (ex: só morre se atingido por prata).</p>', tier: 'misticos', bonuses: { resistances: { physical: 3, elemental: 3, mental: 3 } } },
  { id: 'npcTalentM000003', name: 'Forma Fluida', cost: 5, cat: 'sobrenatural', desc: '<p>Não pode ser Agarrado ou Imobilizado. Ocupa qualquer espaço e ataques não-elementais causam metade do dano.</p>', tier: 'misticos' },
  { id: 'npcTalentM000004', name: 'Aura Elemental', cost: 5, cat: 'elemental', desc: '<p><strong>Passiva:</strong> Criaturas próximas recebem dano elemental por rodada de presença na aura da criatura.</p>', tier: 'misticos', formula: '1d6 + 2' },
  { id: 'npcTalentM000005', name: 'Profecia da Derrota', cost: 6, cat: 'mental', desc: '<p>1x/combate, 0 PA: Declara o "destino" de um alvo — penalidade severa em ataques por falha nos próximos X turnos.</p>', tier: 'misticos', specialActions: ["Profetizar"] },
  { id: 'npcTalentM000006', name: 'Dobra Espacial', cost: 7, cat: 'sobrenatural', desc: '<p>1x/combate: Teleporta aliados ou inimigos em área — pode separar o grupo completamente no campo de batalha.</p>', tier: 'misticos', specialActions: ["Teleportar Grupo"] },
  { id: 'npcTalentM000007', name: 'Essência Elemental', cost: 5, cat: 'elemental', desc: '<p>Imune ao próprio elemento. Ataques desse elemento causam efeito de condição adicional automático.</p>', tier: 'misticos', bonuses: { resistances: { elemental: 10 } } },
  { id: 'npcTalentM000008', name: 'Chamado da Mata', cost: 5, cat: 'sobrenatural', desc: '<p>2 PA, 0 PE: Convoca X animais silvestres do ambiente como aliados temporários para o combate.</p>', tier: 'misticos', specialActions: ["Convocar Animais"] },
  { id: 'npcTalentM000009', name: 'Chama do Fim', cost: 7, cat: 'elemental', desc: '<p>1x/combate: Área massiva de dano elemental com CD alta de Resistência. Deixa o terreno em chamas.</p>', tier: 'misticos', specialActions: ["Explosão Final"], formula: '5d6 + 10' },
  { id: 'npcTalentM000010', name: 'Caos Elemental', cost: 6, cat: 'elemental', desc: '<p>Início de cada rodada: Um efeito elemental aleatório (rola-se um dado) é usado gratuitamente contra os oponentes.</p>', tier: 'misticos' },
  { id: 'npcTalentM000011', name: 'Barreira de Essência', cost: 5, cat: 'defensivo', desc: '<p><strong>Inata:</strong> Absorve o próximo ataque elemental completamente e devolve PE ao atacante original.</p>', tier: 'misticos' },
  { id: 'npcTalentM000012', name: 'Rastro Invertido', cost: 4, cat: 'utilitario', desc: '<p>Não pode ser rastreado em bioma nativo por meios convencionais (Exige teste de CD extrema).</p>', tier: 'misticos' },
  { id: 'npcTalentM000013', name: 'Coroa da Supremacia', cost: 6, cat: 'sobrenatural', desc: '<p><strong>Especial:</strong> Condição de morte alternativa — é necessário destruir um item ou objeto específico primeiro.</p>', tier: 'misticos' },
  { id: 'npcTalentM000014', name: 'Regeneração Elemental', cost: 5, cat: 'defensivo', desc: '<p>Regenera X PV por rodada enquanto estiver em seu bioma nativo ou sob uma condição elemental específica.</p>', tier: 'misticos', formula: '2d6' },
];

const folderMapping = {
  "comuns": "fldbestcomun0000",
  "raros": "fldbestraros0000",
  "misticos": "fldbestmistic000"
};

const basePath = 'packs/_source/talentos-criaturas';

talents.forEach(t => {
  const folderId = folderMapping[t.tier];
  const dir = path.join(basePath, t.tier);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const folderPath = path.join(dir, '_folder.yml');
  if (!fs.existsSync(folderPath)) {
    const folderContent = `_id: ${folderId}
name: ${t.tier.charAt(0).toUpperCase() + t.tier.slice(1)}
type: Item
folder: null
sorting: a
_key: '!folders!${folderId}'
`;
    fs.writeFileSync(folderPath, folderContent);
  }

  const content = `_id: ${t.id}
name: "${t.name}"
type: talent
img: ${t.icon ? `systems/animus/assets/icons/skills/${t.icon}` : `systems/animus/assets/system-icons/talents/${t.cat}.svg`}
folder: ${folderId}
system:
  description: "${t.desc.replace(/"/g, '\\"')}"
  cost: ${t.cost}
  requirements: []
  category: ${t.cat}
  bonuses:
    hp: ${t.bonuses?.hp || 0}
    pe: ${t.bonuses?.pe || 0}
    pa: ${t.bonuses?.pa || 0}
    damage: ${t.bonuses?.damage || 0}
    attributes:
      pot: ${t.bonuses?.attributes?.pot || 0}
      hab: ${t.bonuses?.attributes?.hab || 0}
      cog: ${t.bonuses?.attributes?.cog || 0}
      per: ${t.bonuses?.attributes?.per || 0}
      pre: ${t.bonuses?.attributes?.pre || 0}
      ani: ${t.bonuses?.attributes?.ani || 0}
    resistances:
      physical: ${t.bonuses?.resistances?.physical || 0}
      elemental: ${t.bonuses?.resistances?.elemental || 0}
      mental: ${t.bonuses?.resistances?.mental || 0}
  check:
    attribute: "${t.check?.attr || ""}"
    difficulty: "${t.check?.cd || ""}"
  specialActions: ${JSON.stringify(t.specialActions || [])}
  formula: "${t.formula || ""}"
flags:
  animus:
    isNPCTalent: true
_key: '!items!${t.id}'
`;
  fs.writeFileSync(path.join(dir, `${t.name.replace(/\s+/g, '_')}.yml`), content);
});

console.log('Generated ' + talents.length + ' individual talent files with checks, special actions and formulas.');
