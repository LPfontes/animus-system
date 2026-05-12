import fs from 'fs';
import path from 'path';

const monsters = [
  {
    name: "Raivoso",
    nd: 1,
    classification: "comum",
    type: "animal",
    hp: 26,
    pe: 10,
    pa: 3,
    atk: { formula: "2d6", attribute: "pot", bonus: 1, label: "Mordida" },
    attributes: { pot: 1, hab: 1, cog: 0, per: 0, pre: 0, ani: 0 },
    skills: [
      { key: "atletismo", rank: 1 },
      { key: "percepcao", rank: 1 }
    ],
    abilities: [
      { 
        name: "Presas Afiadas", 
        rarity: "comum", 
        description: "<p>Com 3+ acertos, aplica Sangramento (1 PV/turno por 2 turnos). O alvo testa Resistência CD 7 para encerrar antecipadamente.</p>",
        check: { attribute: "pot", difficulty: "7" },
        specialActions: ["Sangramento"]
      },
      { 
        name: "Matilha", 
        rarity: "comum", 
        description: "<p>Se dois ou mais Raivosos atacam o mesmo alvo nessa rodada, cada um ganha +1d na rolagem de ataque.</p>" 
      }
    ],
    ecology: "<p>Um predador territorial que vaga em matilhas. Sua agressividade é alimentada por uma fome constante e um instinto de dominância primitivo.</p>",
    weaknesses: "<p><b>Fogo os afasta:</b> tocha acesa direcionada exige PRE CD 7 ou recuam na próxima ação. <b>Ruído alto:</b> (ex: explosão) causa Atordoamento por 1 turno (PER CD 6 para evitar).</p>",
    availableActions: "<p><b>Mordida:</b> Ataque corpo a corpo, 2 PA. Causa 2d6+1 de dano. Pode aplicar Sangramento.</p>",
    loot: "<p><b>Pele de Raivoso:</b> Pode ser vendida por 5 moedas. <b>Dentes Afiados:</b> Componente para flechas.</p>",
    narratorNotes: "<p><b>Uivo de alerta:</b> ao recuar, o líder ulula — se ouvido por outros Raivosos em 50m, chegam em 2 rodadas. Aparecem em grupos de 2–4. Um distrai a frente enquanto os outros flanqueiam. Recuam se dois da matilha forem derrubados.</p>",
    turnPatterns: [
      { label: "Bote de Caça", description: "Mordida (2) + Movimentação (1)", totalPA: 3 }
    ]
  },
  {
    name: "Urso-Cinzeiro",
    nd: 4,
    classification: "raro",
    type: "animal",
    hp: 110,
    pe: 20,
    pa: 5,
    atk: { formula: "3d6", attribute: "pot", bonus: 2, label: "Garras" },
    attributes: { pot: 2, hab: 1, cog: 0, per: 1, pre: 0, ani: 0 },
    skills: [
      { key: "atletismo", rank: 2 },
      { key: "luta", rank: 1 },
      { key: "resistencia", rank: 1 },
      { key: "percepcao", rank: 1 }
    ],
    abilities: [
      { 
        name: "Musculatura Densa", 
        rarity: "comum", 
        icon: "talentos/combate/28.png",
        description: "<p>Ataques físicos causam +2 de dano fixo em todos os acertos. Redução de Dano 1 contra ataques não-elementais.</p>",
        bonuses: { damage: 2, resistances: { physical: 1 } }
      },
      { 
        name: "Investida Esmagadora", 
        rarity: "raro", 
        icon: "talentos/combate/10.png",
        description: "<p>Com 3+ acertos em um ataque, o alvo testa POT CD 11 ou fica Derrubado + perde 1 PA no próximo turno.</p>",
        check: { attribute: "pot", difficulty: "11" },
        specialActions: ["Derrubar"]
      }
    ],
    ecology: "<p>Um gigante solitário que habita as florestas queimadas. Sua musculatura é densa como carvalho e sua fúria é tão devastadora quanto um incêndio florestal.</p>",
    weaknesses: "<p><b>Lento em terreno alagado:</b> +1 PA de custo em todo movimento em charcos.</p>",
    narratorNotes: "<p><b>PV < 40%:</b> entra em frenesi (+1d em ataques, perde capacidade de recuar). Prioriza derrubar o maior combatente primeiro.</p>",
    turnPatterns: [
      { label: "Carga Brutal", description: "Garras (2) + Investida Esmagadora (2) + Movimentação (1)", totalPA: 5 }
    ]
  },
  {
    name: "Erguido",
    nd: 2,
    classification: "comum",
    type: "morto-vivo",
    hp: 59,
    pe: 12,
    pa: 3,
    atk: { formula: "2d6", attribute: "pot", bonus: 1, label: "Soco" },
    attributes: { pot: 1, hab: 0, cog: 0, per: 0, pre: 0, ani: 0 },
    skills: [
      { key: "luta", rank: 1 },
      { key: "resistencia", rank: 1 }
    ],
    abilities: [
      { 
        name: "Constituição Robusta", 
        rarity: "comum", 
        description: "<p>+15 PV máximos (incluído no total). Imune a dano de sangramento.</p>",
        bonuses: { hp: 15 }
      },
      { 
        name: "Impassível", 
        rarity: "comum", 
        description: "<p>Imune a medo, charme, exaustão e condições psicológicas. Falha automática em testes de PRE e COG.</p>",
        bonuses: { resistances: { mental: 10 } }
      },
      {
        name: "Infecção Latente",
        rarity: "comum",
        description: "<p>Com 3+ acertos, o alvo testa Resistência CD 8 ou contrai Infecção Latente: -1 em todos os testes por 24h.</p>",
        check: { attribute: "pot", difficulty: "8" }
      }
    ],
    ecology: "<p>Cadáveres reanimados por resíduos de Anima. Não possuem vontade própria, servindo apenas como recipientes para uma fome insaciável de vida.</p>",
    weaknesses: "<p><b>Fogo:</b> dano de fogo causa +2 extra por acerto. <b>Foco necrótico:</b> se o necromante controlador for eliminado, ficam Atordoados 1 rodada e depois deambulam aleatoriamente. <b>Decapitação:</b> acerto com 4+ que declare ataque à cabeça (CD 10 de HAB) destrói instantaneamente.</p>",
    narratorNotes: "<p>Sem estratégia — serve apenas ao controlador. Quando em massa, seu principal objetivo é cercar os alvos e criar pressão de posicionamento.</p>",
    turnPatterns: [
      { label: "Avanço Lento", description: "Soco (2) + Movimentação (1)", totalPA: 3 }
    ]
  },
  {
    name: "Cavaleiro da Cinza",
    nd: 5,
    classification: "raro",
    type: "morto-vivo",
    hp: 110,
    pe: 28,
    pa: 5,
    atk: { formula: "4d6", attribute: "pot", bonus: 2, label: "Espada" },
    attributes: { pot: 2, hab: 1, cog: 0, per: 1, pre: 1, ani: 0 },
    skills: [
      { key: "luta", rank: 2 },
      { key: "resistencia", rank: 2 },
      { key: "atletismo", rank: 1 },
      { key: "proeza", rank: 1 }
    ],
    abilities: [
      { 
        name: "Musculatura Densa", 
        rarity: "comum", 
        description: "<p>+1 POT efetivo. +2 de dano fixo em todos os acertos.</p>",
        bonuses: { attributes: { pot: 1 }, damage: 2 }
      },
      { 
        name: "Pele Endurecida", 
        rarity: "comum", 
        description: "<p>Redução de Dano 2 contra ataques físicos não-elementais.</p>",
        bonuses: { resistances: { physical: 2 } }
      },
      {
        name: "Ímpeto Mortal",
        rarity: "raro",
        description: "<p>Gasta 3 PE: ataque adicional como ação livre (1x/rodada). Se o ataque tiver 3+ acertos, o alvo testa POT CD 12 ou perde 1 PA no próximo turno.</p>",
        check: { attribute: "pot", difficulty: "12" }
      }
    ],
    ecology: "<p>Um antigo campeão que mantém fragmentos de sua perícia marcial mesmo após a morte. Suas cinzas são mantidas juntas por uma promessa de vingança nunca cumprida.</p>",
    weaknesses: "<p><b>Fogo e luz de Anima:</b> +3 de dano extra por acerto. <b>Símbolo sagrado:</b> teste PRE CD 10 ou perde 1 PA de aproximação (não se aplica após 2 rodadas). <b>Armadura:</b> se destruída (PV=0), perde Redução de Dano e sofre -1d em ataques.</p>",
    narratorNotes: "<p>Combate até a destruição total — não recua mesmo com PV crítico. Sua honra distorcida o obriga a terminar o que começou.</p>",
    turnPatterns: [
      { label: "Duelo Imortal", description: "Espada (2) + Ímpeto Mortal (3)", totalPA: 5 }
    ]
  },
  {
    name: "Regente Sepulcral",
    nd: 8,
    classification: "místico",
    type: "morto-vivo",
    hp: 215,
    pe: 55,
    pa: 6,
    atk: { formula: "5d6", attribute: "pre", bonus: 4, label: "Toque da Tumba" },
    attributes: { pot: 3, hab: 2, cog: 2, per: 2, pre: 4, ani: 3 },
    skills: [
      { key: "luta", rank: 4 },
      { key: "resistencia", rank: 4 },
      { key: "aura", rank: 2 }
    ],
    abilities: [
      { 
        name: "Resistência Ancestral", 
        rarity: "místico", 
        description: "<p>Passiva: Enquanto a Coroa de Osso estiver intacta, o Regente tem Redução de Dano 4 contra todas as fontes e não pode ser reduzido a 0 PV.</p>",
        bonuses: { resistances: { physical: 4, mental: 4 } }
      },
      { 
        name: "Regeneração Óssea", 
        rarity: "raro", 
        description: "<p>Regenera 10 PV no início de cada um de seus turnos, a menos que tenha sofrido dano de fogo ou luz na rodada anterior.</p>",
        specialActions: ["Regenerar PV"]
      },
      {
        name: "Comando dos Mortos",
        rarity: "místico",
        description: "<p>2 PA, 6 PE: Ergue 1d4 Erguidos dos arredores. Eles agem imediatamente após o Regente.</p>",
        specialActions: ["Erguer Mortos"],
        formula: "1d4"
      }
    ],
    ecology: "<p>Um soberano de eras esquecidas, cuja vontade de governar transcendeu a decomposição da carne. Ele não comanda por medo, mas por um vínculo metafísico com os restos mortais de seus súditos.</p>",
    weaknesses: "<p><b>Condição de morte:</b> a Coroa de Osso deve ser destruída primeiro (Dureza 14, PV 30). <b>Fogo e luz elemental:</b> +3 de dano por acerto. <b>Sem a coroa:</b> perde Resistência Ancestral e Regeneração — torna-se mortal.</p>",
    loot: "<p><b>Fragmento da Coroa de Osso:</b> Runa Necrótica — arma aplica Maldição em vez de Sangramento (CD PRE = 10 + nível). Valor: 300 Đ. <b>Osso Ancestral:</b> Armadura com osso sepulcral concede imunidade a medo/charme, mas portador perde 1 PRE permanente ao vesti-la. Valor: 120 Đ/kg. <b>Coroa de Osso Completa:</b> Artefato único. Uso por 7+ dias inicia transformação em Regente Sepulcral. Valor: 2.000 Đ.</p>",
    narratorNotes: "<p>O Regente prioriza proteger sua coroa acima de tudo. Ele usará seus subordinados como escudos vivos. Se a coroa for roubada em vez de destruída, ele fará qualquer acordo para recuperá-la.</p>",
    turnPatterns: [
      { label: "Assalto Majestoso", description: "Toque da Tumba (2) + Comando dos Mortos (2) + Mov (1) + Mov (1)", totalPA: 6 }
    ]
  },
  {
    name: "Sombra Faminta",
    nd: 2,
    classification: "comum",
    type: "espírito",
    hp: 30,
    pe: 16,
    pa: 3,
    atk: { formula: "2d6", attribute: "hab", bonus: 1, label: "Garras Etéreas" },
    attributes: { pot: 0, hab: 1, cog: 0, per: 1, pre: 1, ani: 1 },
    skills: [
      { key: "furtividade", rank: 1 },
      { key: "intuicao", rank: 1 }
    ],
    abilities: [
      { 
        name: "Etéreo", 
        rarity: "comum", 
        description: "<p>Atravessa sólidos não-mágicos. Imune a dano físico não-mágico. Ataques físicos convencionais falham automaticamente.</p>",
        bonuses: { resistances: { physical: 10 } }
      },
      { 
        name: "Drenagem de Anima", 
        rarity: "comum", 
        description: "<p>Com 2+ acertos, o alvo testa PRE CD 9 ou perde 2 PE (independente de escudos ou Proteção).</p>",
        check: { attribute: "pre", difficulty: "9" },
        specialActions: ["Drenar PE"]
      },
      {
        name: "Sombra",
        rarity: "comum",
        description: "<p>Em ambientes sem luz elemental: Vantagem em Furtividade. Sem fonte de luz elemental ou mágica, não se pode atacar a Sombra sem testar PER CD 11 primeiro.</p>",
        check: { attribute: "per", difficulty: "11" }
      }
    ],
    ecology: "<p>Um espírito furtivo que se alimenta da essência vital (Anima) de suas presas. Habita locais de escuridão profunda, onde sua forma etérea é quase indistinguível das sombras naturais.</p>",
    weaknesses: "<p><b>Luz de Anima:</b> ataques elementais ou habilidades com componente ANI causam dano dobrado. <b>Sal abençoado:</b> cria barreira que ela não pode cruzar. <b>Luz ativa:</b> fontes de luz elemental ativa removem Vantagem em Furtividade e a forçam a recuar (PRE CD 8 por rodada).</p>",
    narratorNotes: "<p>Prefere alvos com muitos PE — prioriza elementalistas. Foge imediatamente se for exposta diretamente à luz elemental intensa.</p>",
    turnPatterns: [
      { label: "Emboscada Etérea", description: "Garras Etéreas (2) + Movimentação (1)", totalPA: 3 }
    ]
  },
  {
    name: "A Que Não Foi Dita",
    nd: 7,
    classification: "místico",
    type: "espírito",
    hp: 170,
    pe: 60,
    pa: 6,
    atk: { formula: "5d6", attribute: "ani", bonus: 4, label: "Palavras Proibidas" },
    attributes: { pot: 0, hab: 2, cog: 2, per: 3, pre: 3, ani: 4 },
    skills: [
      { key: "intuicao", rank: 4 },
      { key: "enganacao", rank: 2 },
      { key: "aura", rank: 2 }
    ],
    abilities: [
      { 
        name: "Mente de Predador", 
        rarity: "comum", 
        description: "<p>Nunca enganada por ilusões. Lê a Anima dos presentes: sabe HP, PE e a maior vulnerabilidade de cada um (Narrador revela 1 segredo por oponente por combate).</p>"
      },
      { 
        name: "Domínio Mental", 
        rarity: "místico", 
        description: "<p>2 PA, 6 PE: alvo testa PRE CD 15 ou fica Dominado por 1 rodada (age contra o próprio grupo, 1 ação, sem ataques letais a aliados).</p>",
        check: { attribute: "pre", difficulty: "15" },
        specialActions: ["Dominar"]
      },
      {
        name: "Barreira de Essência",
        rarity: "raro",
        description: "<p>1 PA, 5 PE: escudo que absorve o próximo ataque elemental completamente e devolve 2 PE ao atacante.</p>",
        specialActions: ["Escudo Elemental"]
      },
      {
        name: "Profecia da Derrota",
        rarity: "místico",
        description: "<p>1x/combate, 0 PA, 0 PE: declara o \"destino\" de um personagem. Por 3 rodadas, todo ataque que falhar causa -1 PA acumulativo (máx. -2). CD PRE 14 para resistir.</p>",
        check: { attribute: "pre", difficulty: "14" },
        specialActions: ["Profetizar"]
      }
    ],
    ecology: "<p>Diz-se que ela não fala, mas que suas palavras vibram diretamente na alma. Aqueles que sobrevivem relatam um silêncio ensurdecedor que revela as fraquezas mais ocultas.</p>",
    weaknesses: "<p><b>Espelho de Anima:</b> um espelho existe no local — destruí-lo (Dureza 10, PV 10) cancela Barreira de Essência e Profecia da Derrota. <b>Verdades não-ditas:</b> contar uma verdade genuína que ela não conhece a Atordoa por 1 rodada (PER CD 13 para resistir).</p>",
    availableActions: "<p><b>Palavras Proibidas:</b> 2 PA. Ataque mental (18m), 5d6 de dano de Anima. Ignora 2 de Proteção.</p>",
    loot: "<p><b>Cristal de Memória:</b> Runa Mental — arma pode usar PRE como atributo de ataque 1×/combate. Valor: 180 Đ. <b>Véu da Oráculo:</b> Armadura leve com +1 PER permanente e Vantagem contra ilusões. Valor: 250 Đ.</p>",
    narratorNotes: "<p>Nunca ataca corpo a corpo — mantém distância mínima de 9m. Ela deve ser jogada como uma presença psicológica que ataca a mente e o destino dos jogadores.</p>",
    turnPatterns: [
      { label: "Dominação", description: "Domínio Mental (2) + Profetizar (0) + Mov (1)", totalPA: 3 },
      { label: "Assalto Mental", description: "Palavras Proibidas (2) + Palavras Proibidas (2) + Mov (1)", totalPA: 5 }
    ]
  },
  {
    name: "Guardião da Floresta",
    nd: 5,
    classification: "místico",
    type: "espírito",
    hp: 150,
    pe: 55,
    pa: 5,
    atk: { formula: "4d6", attribute: "hab", bonus: 3, label: "Bastão" },
    attributes: { pot: 1, hab: 3, cog: 1, per: 3, pre: 2, ani: 3 },
    skills: [
      { key: "sobrevivencia", rank: 4 },
      { key: "furtividade", rank: 4 },
      { key: "percepcao", rank: 2 },
      { key: "luta", rank: 1 }
    ],
    abilities: [
      { 
        name: "Rastro Invertido", 
        rarity: "místico", 
        description: "<p>Não pode ser rastreado por meios convencionais. Rastrear exige COG CD 14 e 1d4 horas — falha resulta em 1d6 horas perdidos na floresta.</p>",
        check: { attribute: "cog", difficulty: "14" }
      },
      { 
        name: "Ilusão de Trilha", 
        rarity: "raro", 
        description: "<p>1 PA, 3 PE: alvo testa PER CD 13 ou se move na direção errada, desperdiçando todo o movimento. Falha por 3+: separa completamente do grupo.</p>",
        check: { attribute: "per", difficulty: "13" },
        specialActions: ["Desorientar"]
      },
      {
        name: "Chamado da Mata",
        rarity: "místico",
        description: "<p>2 PA, 0 PE: convoca 1d4 animais silvestres (ND 1) da floresta. Agem na próxima rodada. Máximo 2x/combate.</p>",
        specialActions: ["Convocar Animais"],
        formula: "1d4"
      },
      {
        name: "Pele de Casca",
        rarity: "comum",
        description: "<p>Em floresta: Vantagem em Furtividade. Quando estático, PER CD 15 para detectar visualmente. Absorve 2 de qualquer dano de corte.</p>",
        bonuses: { resistances: { physical: 2 } }
      }
    ],
    ecology: "<p>Um místico protetor da mata antiga. Sua pele é composta por cascas de árvores milenares e sua presença pode desorientar até o mais experiente dos caçadores.</p>",
    weaknesses: "<p><b>Fogo direto:</b> +2 de dano por acerto. <b>Território:</b> fora da floresta, perde Rastro Invertido e Pele de Casca.</p>",
    loot: "<p><b>Raiz do Guardião da Floresta:</b> Runa de Madeira — Vantagem em ataques contra criaturas em ambiente natural. Valor: 100 Đ. <b>Gorro do Guardião:</b> Vantagem em Sobrevivência e pedido de passagem segura de animais 1×/descanso longo. Valor: 350 Đ.</p>",
    narratorNotes: "<p>Nunca ataca diretamente de início. Usa Ilusão de Trilha para separar o grupo. <b>Negociação:</b> PRE CD 10 com promessa de não caçar no território — o Guardião recua e torna-se um aliado passivo.</p>",
    turnPatterns: [
      { label: "Guarda da Mata", description: "Bastão (2) + Ilusão de Trilha (1) + Movimentação (1) + Movimentação (1)", totalPA: 5 }
    ]
  },
  {
    name: "Sereia das Águas Profundas",
    nd: 6,
    classification: "místico",
    type: "espírito",
    hp: 175,
    pe: 55,
    pa: 5,
    atk: { formula: "4d6", attribute: "pre", bonus: 4, label: "Canto Sedutor" },
    attributes: { pot: 1, hab: 2, cog: 2, per: 3, pre: 4, ani: 3 },
    skills: [
      { key: "persuasao", rank: 4 },
      { key: "percepcao", rank: 2 },
      { key: "natacao", rank: 4 }
    ],
    abilities: [
      { 
        name: "Canto Compulsório", 
        rarity: "místico", 
        description: "<p>Passiva: todo personagem que entrar no combate (ou se aproximar a 20m fora dele) testa PRE CD 14 ou gasta todo seu movimento se aproximando da água. Enfeitiçados têm Desvantagem em ataques contra a Sereia.</p>",
        check: { attribute: "pre", difficulty: "14" }
      },
      { 
        name: "Domínio Aquático", 
        rarity: "místico", 
        description: "<p>Em contato com água: ataques de Elemento Água custam 0 PE e são Nível 2 automaticamente. Move-se na água sem custo de PA.</p>" 
      },
      {
        name: "Toque do Abismo",
        rarity: "raro",
        description: "<p>2 PA, 5 PE: drena a vontade — alvo testa PRE CD 14 ou fica Enfeitiçado por 2 rodadas (não pode atacar a Sereia, apenas se defender passivamente).</p>",
        check: { attribute: "pre", difficulty: "14" },
        specialActions: ["Enfeitiçar"]
      },
      {
        name: "Barreira de Maré",
        rarity: "raro",
        description: "<p>Reação, 4 PE: quando atingida, cria parede de água. Atacante testa HAB CD 12 ou é empurrado 3m e perde o ataque.</p>",
        check: { attribute: "hab", difficulty: "12" },
        specialActions: ["Empurrar"]
      }
    ],
    ecology: "<p>Uma entidade aquática mística cuja beleza esconde uma natureza predatória. Seu canto vibra na frequência da alma, atraindo os incautos para as profundezas.</p>",
    weaknesses: "<p><b>Fora d'água:</b> após 3+ rodadas fora da água, perde Domínio Aquático e sofre –1d em todos os ataques. <b>Metal:</b> armas e projéteis de metal causam +2 de dano por acerto.</p>",
    loot: "<p><b>Escama da Sereia:</b> Runa de Encantamento — arma pode usar PRE como atributo de dano 1×/combate. Valor: 150 Đ. <b>Lágrima da Sereia:</b> 3 doses de antídoto permanente contra qualquer veneno aquático. Valor: 200 Đ.</p>",
    narratorNotes: "<p><b>Negociação:</b> aceita oferta de 'companhia' (promessa de retornar ou objeto pessoal valioso) em troca de ajuda ou passagem livre. A promessa é um gancho narrativo forte — ela virá cobrar o preço.</p>",
    turnPatterns: [
      { label: "Canto Mortal", description: "Canto Sedutor (4) + Movimentação (1)", totalPA: 5 }
    ]
  },
  {
    name: "Espírito Travesso",
    nd: 3,
    classification: "raro",
    type: "espírito",
    hp: 55,
    pe: 35,
    pa: 4,
    atk: { formula: "3d6", attribute: "hab", bonus: 2, label: "Tapas" },
    attributes: { pot: 0, hab: 4, cog: 2, per: 3, pre: 2, ani: 2 },
    skills: [
      { key: "furtividade", rank: 4 },
      { key: "acrobacia", rank: 4 },
      { key: "percepcao", rank: 2 },
      { key: "prestidigitacao", rank: 2 }
    ],
    abilities: [
      { 
        name: "Rodamoinho", 
        rarity: "místico", 
        description: "<p>Movimento: viaja até 18m em forma de redemoinho, imune a dano em trânsito. Personagens no caminho testam HAB CD 11 ou perdem 1 PA. Não funciona em terreno molhado.</p>",
        check: { attribute: "hab", difficulty: "11" },
        specialActions: ["Desorientar"]
      },
      { 
        name: "Sumiço no Vento", 
        rarity: "raro", 
        description: "<p>Após qualquer ação bem-sucedida: gasta 2 PE para se tornar invisível até o início do próximo turno. Ataques contra ele enquanto invisível têm Desvantagem.</p>",
        specialActions: ["Invisibilidade"]
      },
      {
        name: "Roubo de Oportunidade",
        rarity: "raro",
        description: "<p>Ação livre 1x/rodada: se a menos de 2m, pode roubar 1 item não-equipado sem teste se o personagem não estiver em guarda total. Se em guarda: PER oposto.</p>",
        specialActions: ["Roubar"]
      }
    ],
    ecology: "<p>Um espírito menor do vento que encontra prazer no caos e na confusão. Embora raramente letal sozinho, sua capacidade de desorientar viajantes pode levá-los a perigos maiores.</p>",
    weaknesses: "<p><b>Terreno molhado:</b> Rodamoinho não funciona e sofre –1d em testes de Acrobacia. <b>Gorro capturado:</b> HAB oposta durante Rodamoinho — se o gorro for capturado, o espírito fica imóvel, visível e torna-se negociável.</p>",
    narratorNotes: "<p>Nunca inicia combate direto. Usa Roubo de Oportunidade e desaparece. <b>Fumo de cachimbo:</b> oferecer fumo de qualidade causa recuo imediato e possível aliança (PRE CD 9).</p>",
    turnPatterns: [
      { label: "Caos do Vento", description: "Rodamoinho (3) + Sumiço no Vento (1)", totalPA: 4 }
    ]
  },
  {
    name: "Espírito das Correntezas",
    nd: 4,
    classification: "raro",
    type: "espírito",
    hp: 80,
    pe: 50,
    pa: 4,
    atk: { formula: "3d6", attribute: "ani", bonus: 3, label: "Correntes" },
    attributes: { pot: 0, hab: 2, cog: 2, per: 2, pre: 3, ani: 3 },
    skills: [
      { key: "medicina", rank: 4 },
      { key: "percepcao", rank: 2 },
      { key: "persuasao", rank: 1 }
    ],
    abilities: [
      { 
        name: "Cura das Águas", 
        rarity: "místico", 
        description: "<p>1x/cena: todos em 9m recebem 2d6+ANI PV. Remove Sangramento, Envenenado e Infecção.</p>",
        formula: "2d6 + 3"
      },
      { 
        name: "Água Corrosiva", 
        rarity: "raro", 
        description: "<p>Reação, 3 PE: quando atacada, envolve o atacante em água densa. Atacante testa HAB CD 11 ou perde 1 PA no próximo turno e sofre -1d em ataques corporais por 1 rodada.</p>",
        check: { attribute: "hab", difficulty: "11" }
      },
      {
        name: "Barreira de Maré",
        rarity: "raro",
        description: "<p>2 PA, 4 PE: barreira de água em linha de 6m. Inimigos que tentarem cruzar testam POT CD 12 ou são empurrados 3m e perdem o turno de movimento.</p>",
        check: { attribute: "pot", difficulty: "12" },
        specialActions: ["Empurrar"]
      }
    ],
    ecology: "<p>Um espírito protetor que habita rios e nascentes. Sua natureza é ambivalente: cura os que respeitam a água e afoga os que a profanam.</p>",
    weaknesses: "<p><b>Metal:</b> armas e projéteis de metal causam +2 de dano por acerto. <b>Fora d'água:</b> após 2+ rodadas fora da água, sofre –1d em todos os testes.</p>",
    narratorNotes: "<p>Raramente hostil de início. <b>Negociação:</b> pode ser acalmada com oferenda de ervas medicinais (PRE CD 8) ou promessa solene de limpar o rio mais próximo.</p>",
    turnPatterns: [
      { label: "Fluxo e Refluxo", description: "Correntes (3) + Cura das Águas (1)", totalPA: 4 }
    ]
  },
  {
    name: "O Lamento Eterno",
    nd: 10,
    classification: "místico",
    type: "espírito",
    hp: 290,
    pe: 80,
    pa: 6,
    atk: { formula: "5d6", attribute: "ani", bonus: 5, label: "Lamento" },
    attributes: { pot: 2, hab: 2, cog: 2, per: 2, pre: 2, ani: 5 },
    skills: [
      { key: "resistencia", rank: 2 },
      { key: "aura", rank: 2 }
    ],
    abilities: [
      { 
        name: "Essência Elemental - Fogo", 
        rarity: "comum", 
        description: "<p>+2 ANI. Imune a Fogo. Regenera 10 PV por rodada em contato com superfície inflamável. Seus ataques de fogo aplicam Ignição automaticamente (sem teste).</p>",
        bonuses: { attributes: { ani: 2 } }
      },
      { 
        name: "Aura de Chama", 
        rarity: "comum", 
        description: "<p>Passiva: personagens a menos de 3m recebem 3 de dano de fogo por rodada. Armaduras de couro sofrem -5 Proteção por rodada. A 1m: PER CD 12 ou cegado por 1 turno.</p>",
        check: { attribute: "per", difficulty: "12" },
        formula: "3"
      },
      {
        name: "Chama do Fim",
        rarity: "místico",
        description: "<p>1x/combate: 6 PA, 12 PE — explosão Nível 3 em área de 20m. CD Resistência 16 para metade. Quem falhar fica em Ignição por 3 rodadas. Apaga toda luz elemental na área.</p>",
        check: { attribute: "pre", difficulty: "16" },
        specialActions: ["Explosão Final"],
        formula: "5d6 + 10"
      },
      {
        name: "Forma Fluida",
        rarity: "comum",
        description: "<p>Não pode ser Agarrado ou Imobilizado. Ocupa qualquer espaço com ar. Ataques com armas não-elementais causam metade do dano.</p>"
      }
    ],
    ecology: "<p>O remanescente do Primeiro Incêndio. Sua dor é eterna e se manifesta como uma chama que consome tudo ao redor. Não busca destruição, apenas o fim de seu próprio sofrimento através do consumo de Anima.</p>",
    weaknesses: "<p><b>Condição de extinção:</b> núcleo de fogo negro deve ser atingido com Elemento Água Nível 3 (CD ANI 15) — extinção temporária por 24h. <b>Frio extremo:</b> abaixo de –10°C, sofre –1d em todos os ataques e perde Regeneração.</p>",
    loot: "<p><b>Núcleo de Fogo Negro:</b> Runa de Fogo Nível 3 — 1×/descanso longo sem custo de PE. Valor: 500 Đ. <b>Cinza Primordial:</b> Ingrediente para Bálsamo Superior (dobro de efeito) e Elixir de Clareza (+10 PE). Valor: 50 Đ/porção, até 6 porções. <b>Escama de Brasas:</b> +2 resistência a Fogo, impermeável a temperaturas abaixo de 1000°C. Forja: 20 dias, 800 Đ.</p>",
    narratorNotes: "<p><b>Asfixia:</b> uma câmara selada sem oxigênio reduz sua forma a apenas 1 PA por rodada. Ele não busca o combate, mas sua mera presença é um desastre ambiental.</p>",
    turnPatterns: [
      { label: "Incineração Total", description: "Lamento (2) + Lamento (2) + Movimentação (1) + Movimentação (1)", totalPA: 6 }
    ]
  },
  {
    name: "Serpente de Fogo Ancestral",
    nd: 7,
    classification: "místico",
    type: "espírito",
    hp: 190,
    pe: 75,
    pa: 6,
    atk: { formula: "4d6", attribute: "pot", bonus: 3, label: "Cauda Flamejante" },
    attributes: { pot: 3, hab: 2, cog: 1, per: 3, pre: 2, ani: 4 },
    skills: [
      { key: "luta", rank: 2 },
      { key: "resistencia", rank: 2 },
      { key: "percepcao", rank: 4 },
      { key: "sobrevivencia", rank: 4 }
    ],
    abilities: [
      { 
        name: "Olhos de Fogo", 
        rarity: "místico", 
        description: "<p>Passiva: luz dos olhos cega em 30m — PER CD 12 ou cegado por 1 rodada. Imune a Cegueira. Foco: 1 PA, 4 PE — raio de calor concentrado, 3d6+ANI dano de fogo, CD Resistência 13.</p>",
        check: { attribute: "per", difficulty: "12" },
        formula: "3d6 + 4"
      },
      { 
        name: "Corpo de Brasas", 
        rarity: "comum", 
        description: "<p>Contato com escamas: 1d6 dano de fogo ao atacante corpo a corpo. Imune a dano de fogo. RD 2 contra físico.</p>",
        bonuses: { resistances: { physical: 2 } },
        formula: "1d6"
      },
      {
        name: "Rastro de Fogo",
        rarity: "comum",
        description: "<p>O caminho da Serpente pega fogo — deixa área de 1,5m de largura queimando por 3 rodadas (2 de dano de fogo para cruzar). Divide o grupo.</p>",
        formula: "2"
      },
      {
        name: "Ignição em Área",
        rarity: "místico",
        description: "<p>3 PA, 8 PE: baforada em cone de 12m. CD Resistência 14 ou Ignição por 3 rodadas + dano elemental total. Metade em caso de sucesso.</p>",
        check: { attribute: "pre", difficulty: "14" },
        specialActions: ["Explosão de Fogo"]
      }
    ],
    ecology: "<p>Uma serpente colossal cujo corpo é feito de brasas vivas e metal derretido. Sua passagem deixa um rastro de destruição ígnea que pode durar dias.</p>",
    weaknesses: "<p><b>Água:</b> dano de Elemento Água é dobrado. <b>Chuvas:</b> em dias de chuva, perde Rastro de Fogo e sofre –1d em ataques.</p>",
    loot: "<p><b>Olho da Serpente:</b> Runa de Visão — visão no escuro ilimitada e +2 PER permanentemente. Valor: 400 Đ. <b>Escama de Brasas:</b> +1 RD contra Fogo e imune a Cegueira por brilho. 60 Đ/escama; armadura completa = 40 escamas.</p>",
    narratorNotes: "<p><b>Cegueira:</b> apagar os dois olhos (exige 4+ acertos com declaração de alvo em cada, CD 13) deixa a criatura Cega por 2 rodadas.</p>",
    turnPatterns: [
      { label: "Ira de Vulcão", description: "Cauda Flamejante (2) + Cauda Flamejante (2) + Mov (1) + Mov (1)", totalPA: 6 }
    ]
  },
  {
    name: "Eco do Devasto",
    nd: 6,
    classification: "raro",
    type: "elemental",
    hp: 105,
    pe: 38,
    pa: 5,
    atk: { formula: "4d6", attribute: "ani", bonus: 2, label: "Fragmentos" },
    attributes: { pot: 1, hab: 2, cog: 1, per: 2, pre: 2, ani: 3 },
    skills: [
      { key: "controle_elemental", rank: 2 },
      { key: "intuicao", rank: 2 },
      { key: "aura", rank: 2 }
    ],
    abilities: [
      { 
        name: "Anima Latente", 
        rarity: "comum", 
        description: "<p>+8 PE máximos. Regenera 4 PE por rodada.</p>",
        bonuses: { pe: 8 },
        specialActions: ["Regenerar PE"]
      },
      { 
        name: "Sopro Elemental", 
        rarity: "raro", 
        description: "<p>2 PA, 5 PE: cone de 6m de dano elemental (aleatório). Alvo testa Resistência CD 12 ou sofre condição elemental do tipo.</p>",
        check: { attribute: "pre", difficulty: "12" }
      },
      {
        name: "Aura Instável",
        rarity: "raro",
        description: "<p>Passiva: personagens a menos de 3m testam PER CD 10 no início do turno ou sofrem 1d6 de dano elemental aleatório.</p>",
        check: { attribute: "per", difficulty: "10" },
        formula: "1d6"
      }
    ],
    ecology: "<p>Um resíduo de energia elemental deixado por grandes catástrofes. Sua forma é instável e destrutiva, reagindo violentamente a qualquer presença estranha.</p>",
    weaknesses: "<p><b>Elemento oposto:</b> causa +50% de dano e desativa Aura Instável por 1 rodada. <b>Círculo de Sal:</b> pode ser aprisionado temporariamente em círculo de sal com runa elemental oposta.</p>",
    narratorNotes: "<p>Prioriza personagens com baixo PE ou alta concentração de Anima (elementalistas). Ele é um predador de energia, buscando sempre a fonte mais instável.</p>",
    turnPatterns: [
      { label: "Pulso de Destruição", description: "Fragmentos (2) + Sopro Elemental (3)", totalPA: 5 }
    ]
  },
  {
    name: "Sentinela de Areia",
    nd: 3,
    classification: "comum",
    type: "elemental",
    hp: 65,
    pe: 20,
    pa: 3,
    atk: { formula: "3d6", attribute: "pot", bonus: 1, label: "Punho de Pedra" },
    attributes: { pot: 2, hab: 0, cog: 0, per: 0, pre: 0, ani: 2 },
    skills: [
      { key: "atletismo", rank: 1 },
      { key: "resistencia", rank: 1 }
    ],
    abilities: [
      { 
        name: "Pele de Pedra", 
        rarity: "comum", 
        description: "<p>RD 2 contra ataques físicos. RD 3 contra ataques perfurantes (a pedra desvia a ponta).</p>",
        bonuses: { resistances: { physical: 2 } }
      },
      { 
        name: "Slam de Terra", 
        rarity: "comum", 
        description: "<p>2 PA, 3 PE: soco que faz o chão tremer em 3m. Alvos na área testam HAB CD 10 ou ficam Derrubados.</p>",
        check: { attribute: "hab", difficulty: "10" },
        specialActions: ["Derrubar"]
      },
      {
        name: "Fundir-se ao Chão",
        rarity: "comum",
        description: "<p>Em terreno de rocha ou terra: 1 PA para se enterrar parcialmente — Camuflado (PER CD 12), imóvel. Emerge como ação livre no próximo turno.</p>",
        check: { attribute: "per", difficulty: "12" }
      }
    ],
    ecology: "<p>Um guardião silencioso feito de camadas de pedra e areia compactada. Reage apenas quando o território que protege é violado.</p>",
    weaknesses: "<p><b>Água:</b> +50% de dano de Água (amolece a argila entre as camadas de pedra). <b>Fogo:</b> seca a argila (+1 de dano extra por acerto), mas endurece a pedra por 1 rodada (+1 RD).</p>",
    narratorNotes: "<p>Não persegue por mais de 30m do local que defende. Sua programação de guarda é absoluta e previsível.</p>",
    turnPatterns: [
      { label: "Defesa de Rocha", description: "Punho de Pedra (2) + Movimentação (1)", totalPA: 3 }
    ]
  },
  {
    name: "Tempesta",
    nd: 6,
    classification: "raro",
    type: "elemental",
    hp: 130,
    pe: 40,
    pa: 5,
    atk: { formula: "4d6", attribute: "hab", bonus: 2, label: "Impacto de Trovão" },
    attributes: { pot: 0, hab: 3, cog: 0, per: 1, pre: 0, ani: 3 },
    skills: [
      { key: "acrobacia", rank: 1 }
    ],
    abilities: [
      { 
        name: "Essência Elemental - Trovão", 
        rarity: "comum", 
        description: "<p>+2 ANI efetivo. Imune a dano de Trovão. Seus ataques de Trovão causam Atordoamento por 1 turno (PER CD 12 para resistir).</p>",
        bonuses: { attributes: { ani: 2 } },
        check: { attribute: "per", difficulty: "12" }
      },
      { 
        name: "Explosão Elemental", 
        rarity: "raro", 
        description: "<p>3 PA, 6 PE: descarga em área de 4m. Alvo testa Resistência CD 13 ou sofre dano total + Atordoado por 1 turno. Metade em caso de sucesso.</p>",
        check: { attribute: "pre", difficulty: "13" },
        specialActions: ["Descarga Elétrica"]
      },
      {
        name: "Sobrecarga Metálica",
        rarity: "comum",
        description: "<p>Criaturas com armadura metálica sofrem +2 de dano por acerto de Trovão. Por rodada: item metálico não-mágico tem 20% de chance de inutilizar.</p>",
        bonuses: { damage: 2 }
      }
    ],
    ecology: "<p>Uma manifestação caótica de eletricidade e neblina. Surge onde a energia elétrica ambiental atinge níveis críticos, destruindo equipamentos metálicos por sua mera presença.</p>",
    weaknesses: "<p><b>Terra:</b> elemento oposto causa +50% de dano e desativa Essência por 1 rodada. <b>Aterramento:</b> gaiola de Faraday improvisada (metal + terra elemental) força o Tempesta a sair da área ou sofrer Aprisionamento (CD ANI 13).</p>",
    narratorNotes: "<p>Nunca fica estático — usa Explosão Elemental como abertura e depois reposiciona constantemente. É uma criatura de puro movimento.</p>",
    turnPatterns: [
      { label: "Choque de Reação", description: "Impacto de Trovão (2) + Explosão Elemental (3)", totalPA: 5 }
    ]
  },
  {
    name: "Senhor da Pilha",
    nd: 7,
    classification: "místico",
    type: "elemental",
    hp: 225,
    pe: 50,
    pa: 6,
    atk: { formula: "4d6", attribute: "ani", bonus: 4, label: "Golpe Elemental" },
    attributes: { pot: 2, hab: 1, cog: 2, per: 2, pre: 2, ani: 4 },
    skills: [
      { key: "atletismo", rank: 2 },
      { key: "resistencia", rank: 2 },
      { key: "intimidacao", rank: 2 }
    ],
    abilities: [
      { 
        name: "Presença Ameaçadora", 
        rarity: "comum", 
        icon: "talentos/combate/40.png",
        description: "<p>+1 PRE. CD PRE 12: personagens no 1º turno testam ou perdem 1 PA (autoridade de guerra).</p>",
        bonuses: { attributes: { pre: 1 } },
        check: { attribute: "pre", difficulty: "12" }
      },
      { 
        name: "Anima de Campo", 
        rarity: "comum", 
        icon: "elementais/terra/5.png",
        description: "<p>+8 PE máximos. Em locais com estruturas destruídas ao redor: regenera 4 PE por rodada.</p>",
        bonuses: { pe: 8 },
        specialActions: ["Regenerar PE"]
      },
      {
        name: "Forma de Batalha",
        rarity: "místico",
        icon: "talentos/combate/1.png",
        description: "<p>Ativa (0 PE): entra em estado de guerra — ataques elementais +2 de dano e -1 PE de custo. Dura o combate inteiro.</p>",
        bonuses: { damage: 2 }
      },
      {
        name: "Invocação de Servos",
        rarity: "raro",
        icon: "criaturas/demonios/10.png",
        description: "<p>3 PA: invoca 2 elementais de ND 3 por 3 rodadas. Máximo 2 invocações por combate.</p>",
        specialActions: ["Invocar Servos"],
        formula: "2"
      }
    ],
    ecology: "<p>Um general de guerra elemental que governa as ruínas e escombros. Absorve Anima dos campos de batalha para se tornar um exército de um homem só.</p>",
    weaknesses: "<p><b>Elemento oposto:</b> +50% de dano e desativa Essência por 2 rodadas.</p><p><b>Campo aberto:</b> sem estruturas, perde Anima de Campo (sem regeneração de PE).</p>",
    loot: "<ul><li><b>Cristal de Anima Pura:</b> Runa Elemental — replica o elemento do Senhor da Pilha em escala menor (Nível 2, 1×/combate). Valor: 250 Đ.</li><li><b>Armadura de Batalha:</b> Já possui 2 runas elementais integradas (não removíveis). +3 PV e ignora a 1ª condição de Derrubado por combate. Reparo: 500 Đ.</li></ul>",
    narratorNotes: "<p><b>Combate de honra:</b> Pode ser rendido por combate de honra pessoal (desafio 1v1) — seu código guerreiro força a aceitar.</p>",
    turnPatterns: [
      { label: "Comando das Ruínas", description: "Golpe Elemental (2) + Invocação de Servos (3) + Mov (1)", totalPA: 6 }
    ]
  },
  {
    name: "Observador de Borda",
    nd: 2,
    classification: "comum",
    type: "aberração",
    hp: 37,
    pe: 16,
    pa: 3,
    atk: { formula: "2d6", attribute: "per", bonus: 1, label: "Tentáculo" },
    attributes: { pot: 0, hab: 1, cog: 1, per: 2, pre: 0, ani: 1 },
    skills: [
      { key: "percepcao", rank: 1 },
      { key: "intuicao", rank: 1 }
    ],
    abilities: [
      { 
        name: "Sentidos Acuados", 
        rarity: "comum", 
        description: "<p>+1 PER efetivo. +1d em Percepção. Nunca surpreendido por ataques fora do campo visual. Detecta criaturas invisíveis em 6m.</p>",
        bonuses: { attributes: { per: 1 } }
      },
      { 
        name: "Olhar Paralisante", 
        rarity: "comum", 
        description: "<p>2 PA, 4 PE: raio do olho central — alvo testa COG CD 10 ou fica Paralisado por 1 turno. CD reduzida em 2 se o alvo não olhar diretamente.</p>",
        check: { attribute: "cog", difficulty: "10" },
        specialActions: ["Paralisar"]
      }
    ],
    ecology: "<p>Um observador silencioso de outras realidades. Transmite tudo o que vê para algo maior além da compreensão humana, priorizando a fuga sobre o combate direto.</p>",
    turnPatterns: [
      { label: "Observação Hostil", description: "Tentáculo (2) + Movimentação (1)", totalPA: 3 }
    ]
  },
  {
    name: "Dente-de-Dentro",
    nd: 5,
    classification: "raro",
    type: "aberração",
    hp: 112,
    pe: 33,
    pa: 5,
    atk: { formula: "4d6", attribute: "pot", bonus: 2, label: "Presas" },
    attributes: { pot: 2, hab: 2, cog: 1, per: 3, pre: 0, ani: 2 },
    skills: [
      { key: "furtividade", rank: 2 },
      { key: "percepcao", rank: 2 },
      { key: "intuicao", rank: 1 },
      { key: "acrobacia", rank: 1 }
    ],
    abilities: [
      { 
        name: "Faro Apurado", 
        rarity: "comum", 
        description: "<p>+1 PER. Detecta criaturas ocultas em 6m pelo rastro de Anima. Não pode ser enganado por disfarce físico.</p>",
        bonuses: { attributes: { per: 1 } }
      },
      { 
        name: "Mordida Interna", 
        rarity: "raro", 
        description: "<p>Com 3+ acertos, gasta 2 PA adicionais para Agarrar automaticamente (POT CD 12 para escapar). Enquanto Agarrado: 4d6+2 dano automático por rodada, mas o Dente fica imóvel.</p>",
        check: { attribute: "pot", difficulty: "12" },
        specialActions: ["Agarrar"]
      },
      {
        name: "Névoa de Memória",
        rarity: "raro",
        description: "<p>2 PA, 5 PE: névoa psíquica em 4m. Alvo testa COG CD 12 ou fica Confuso por 2 rodadas — age contra aliado aleatório mais próximo.</p>",
        check: { attribute: "cog", difficulty: "12" },
        specialActions: ["Confundir"]
      }
    ],
    ecology: "<p>Uma abominação alongada que consome memórias e Anima através de suas presas voltadas para dentro. Aqueles que sobrevivem raramente se lembram do ataque.</p>",
    turnPatterns: [
      { label: "Consumir Memória", description: "Presas (2) + Névoa de Memória (2) + Mov (1)", totalPA: 5 }
    ]
  },
  {
    name: "O Não-Lugar",
    nd: 8,
    classification: "místico",
    type: "aberração",
    hp: 235,
    pe: 60,
    pa: 6,
    atk: { formula: "5d6", attribute: "per", bonus: 4, label: "Distorção" },
    attributes: { pot: 1, hab: 2, cog: 2, per: 4, pre: 1, ani: 3 },
    skills: [
      { key: "percepcao", rank: 4 },
      { key: "intuicao", rank: 4 },
      { key: "conhecimento_arcano", rank: 2 },
      { key: "aura", rank: 2 }
    ],
    abilities: [
      { 
        name: "Escudo de Essência", 
        rarity: "comum", 
        description: "<p>RD 3 contra tudo. Só reduzida por 4+ acertos consecutivos no mesmo ponto — ataques dispersos não chegam ao núcleo.</p>",
        bonuses: { resistances: { physical: 3, mental: 3 } }
      },
      { 
        name: "Distorção de Posição", 
        rarity: "místico", 
        description: "<p>Passiva: por rodada, pode teleportar para qualquer ponto em 12m como ação livre. Ataques de oportunidade têm Desvantagem dobrada.</p>",
        specialActions: ["Teleporte"]
      },
      {
        name: "Domínio Mental",
        rarity: "místico",
        description: "<p>2 PA, 8 PE: alvo testa COG CD 15 ou fica Dominado por 1 rodada — age contra o próprio grupo.</p>",
        check: { attribute: "cog", difficulty: "15" },
        specialActions: ["Dominar"]
      },
      {
        name: "Dobra Espacial",
        rarity: "místico",
        description: "<p>1x/combate, 4 PA, 10 PE: o grupo inteiro testa HAB CD 14 ou é teleportado para posição aleatória em 20m. Pode separar completamente.</p>",
        check: { attribute: "hab", difficulty: "14" },
        specialActions: ["Dobra Espacial"]
      }
    ],
    ecology: "<p>Uma distorção pura do espaço-tempo. Onde você olha, ele parece estar; onde você não olha, ele definitivamente está.</p>",
    turnPatterns: [
      { label: "Colapso Espacial", description: "Distorção (2) + Dobra Espacial (2) + Mov (1) + Mov (1)", totalPA: 6 }
    ]
  },
  {
    name: "O Caos Primordial",
    nd: 9,
    classification: "místico",
    type: "aberração",
    hp: 260,
    pe: 90,
    pa: 7,
    atk: { formula: "5d6", attribute: "pot", bonus: 3, label: "Golpe Caótico" },
    attributes: { pot: 3, hab: 3, cog: 0, per: 2, pre: 2, ani: 5 },
    skills: [
      { key: "resistencia", rank: 4 },
      { key: "luta", rank: 2 },
      { key: "percepcao", rank: 2 }
    ],
    abilities: [
      { 
        name: "Forma Inconstante", 
        rarity: "místico", 
        description: "<p>Ataques têm -1d (a forma se reorganiza evitando o golpe). Imune a Imobilizar, Agarrar e condições posicionais.</p>"
      },
      { 
        name: "Caos Elemental", 
        rarity: "místico", 
        description: "<p>Início de cada rodada: 1d6 — 1-2 usa Trovão, 3-4 usa Vento, 5-6 usa ambos (ataque elemental Nível 2 grátis).</p>",
        formula: "1d6"
      },
      {
        name: "Ímpeto Desconstrutivo",
        rarity: "comum",
        description: "<p>Ataque com 4+ acertos: alvo testa POT CD 15 ou é Derrubado + empurrado 6m + perde 1 PA. Cada condição testada separadamente.</p>",
        check: { attribute: "pot", difficulty: "15" },
        specialActions: ["Derrubar"]
      },
      {
        name: "Rugido do Caos",
        rarity: "místico",
        description: "<p>1x/combate, 0 PA, 0 PE: todos testam PRE CD 14 ou ficam Atordoados por 1 rodada.</p>",
        check: { attribute: "pre", difficulty: "14" },
        specialActions: ["Atordoar"]
      }
    ],
    ecology: "<p>A personificação do estado anterior à criação. Uma massa de tecido inconstante que reage violentamente à ordem e à estabilidade.</p>",
    turnPatterns: [
      { label: "Onda de Entropia", description: "Golpe Caótico (2) + Rugido do Caos (0) + Caos Elemental (0) + Mov (1)", totalPA: 3 }
    ]
  },
  {
    name: "Senescal Corrompido",
    nd: 6,
    classification: "raro",
    type: "humanoide",
    hp: 125,
    pe: 40,
    pa: 5,
    atk: { formula: "4d6", attribute: "hab", bonus: 2, label: "Adaga de Prata" },
    attributes: { pot: 1, hab: 2, cog: 3, per: 2, pre: 3, ani: 1 },
    skills: [
      { key: "enganacao", rank: 3 },
      { key: "intuicao", rank: 3 },
      { key: "luta", rank: 2 },
      { key: "persuasao", rank: 2 }
    ],
    abilities: [
      { 
        name: "Escudo de Guardas", 
        rarity: "raro", 
        description: "<p>Passiva: Enquanto houver pelo menos um aliado humanoide a menos de 3m, o Senescal recebe +2 de Redução de Dano Físico e Vantagem em testes de Resistência.</p>",
        bonuses: { resistances: { physical: 2 } }
      },
      { 
        name: "Traição Calculada", 
        rarity: "raro", 
        description: "<p>Reação, 3 PE: Quando for alvo de um ataque, pode forçar um aliado a menos de 2m a se tornar o novo alvo. O aliado recebe o dano em seu lugar.</p>",
        specialActions: ["Trocar Alvo"]
      },
      {
        name: "Língua de Serpente",
        rarity: "comum",
        description: "<p>1 PA, 4 PE: Alvo testa PRE CD 13 ou sofre -2 em todos os testes de Atributo por 2 rodadas devido a insultos e manipulação psicológica.</p>",
        check: { attribute: "pre", difficulty: "13" }
      }
    ],
    ecology: "<p>Um antigo conselheiro que vendeu sua alma e seu povo por promessas de poder eterno. Sua aparência é impecável, mas sua presença emite um odor de decadência e falsidade.</p>",
    weaknesses: "<p><b>Sem os guardas:</b> perde Escudo de Guardas e fica visivelmente perturbado (–1d em Intimidação). <b>Segredos expostos:</b> se o grupo revelar seus crimes publicamente antes do confronto, chega ao combate com –10 PV e sem Traição Calculada. <b>Elemento Terra ou Água:</b> fraqueza elemental por trauma específico da história.</p>",
    narratorNotes: "<p><b>PV < 50%:</b> tenta fugir via passagem secreta (Percepção CD 13 para notar). Se capturado, negocia com segredos. Ele nunca luta de forma justa; sempre terá capangas para se esconder atrás.</p>",
    turnPatterns: [
      { label: "Manipulação", description: "Língua de Serpente (1) + Adaga (2) + Movimentação (1)", totalPA: 4 },
      { label: "Fuga Desesperada", description: "Movimentação (1) + Movimentação (1) + Ação de Fuga (Percepção oposta)", totalPA: 3 }
    ]
  },
  {
    name: "Salteador das Estradas",
    nd: 1,
    classification: "comum",
    type: "humanoide",
    hp: 26,
    pe: 11,
    pa: 3,
    atk: { formula: "2d6", attribute: "pot", bonus: 1, label: "Espada" },
    attributes: { pot: 1, hab: 1, cog: 0, per: 0, pre: 0, ani: 0 },
    skills: [
      { key: "luta", rank: 1 },
      { key: "furtividade", rank: 1 }
    ],
    abilities: [
      { 
        name: "Adaptável", 
        rarity: "comum", 
        description: "<p>Usa qualquer equipamento encontrado sem penalidade. Pode improvisar armas sem teste.</p>"
      },
      { 
        name: "Rendição Estratégica", 
        rarity: "comum", 
        description: "<p>Se Intimidação CD 7 bem-sucedida, rende-se imediatamente. Se mais da metade do grupo cair: teste de Moral PRE CD 8 ou fogem.</p>",
        check: { attribute: "pre", difficulty: "8" }
      }
    ],
    ecology: "<p>Humanos comuns impulsionados pelo desespero ou pela ganância. Operam em pequenos grupos, flanqueando presas que parecem vulneráveis.</p>",
    weaknesses: "<p><b>Moral baixa:</b> Intimidação CD 7 pode fazer um ou mais recuarem imediatamente.</p><p><b>Equipamento improvisado:</b> sem arma real, –1d em ataque.</p>",
    narratorNotes: "<p><b>Vantagem social:</b> se o personagem os reconhecer ou souber o nome, +2 em todas as negociações.</p>",
    turnPatterns: [
      { label: "Assalto em Grupo", description: "Espada (2) + Movimentação (1)", totalPA: 3 }
    ]
  },
  {
    name: "Caçador de Cabeças",
    nd: 5,
    classification: "raro",
    type: "humanoide",
    hp: 110,
    pe: 33,
    pa: 5,
    atk: { formula: "4d6", attribute: "hab", bonus: 3, label: "Punhal" },
    attributes: { pot: 1, hab: 3, cog: 1, per: 1, pre: 1, ani: 0 },
    skills: [
      { key: "furtividade", rank: 2 },
      { key: "percepcao", rank: 2 },
      { key: "atletismo", rank: 1 }
    ],
    abilities: [
      { 
        name: "Agilidade Predatória", 
        rarity: "comum", 
        description: "<p>+1 HAB efetivo. Nunca fica Desprevenido enquanto consciente. +1d em iniciativa.</p>",
        bonuses: { attributes: { hab: 1 } }
      },
      { 
        name: "Ataque Furtivo", 
        rarity: "comum", 
        description: "<p>Se oculto ou flanqueando: +1d de dano no primeiro ataque do turno. Após atacar de oculto, testa Furtividade para manter posição (CD = 8 + número de oponentes que o viram).</p>",
        bonuses: { damage: 2 }
      },
      {
        name: "Alvo Identificado",
        rarity: "raro",
        description: "<p>Pré-combate: escolhe 1 alvo. Contra ele: +1d e CD de condições +2. Contra outros: -1d (não os estudou).</p>",
        specialActions: ["Marcar Alvo"]
      }
    ],
    ecology: "<p>Um caçador profissional altamente especializado. Estuda suas vítimas meticulosamente antes do combate para explorar cada falha em sua defesa.</p>",
    weaknesses: "<p><b>Combate corpo a corpo:</b> Luta mal em combate corpo a corpo (–1d). Prioriza distância de 15m do alvo.</p>",
    narratorNotes: "<p><b>Negociação:</b> Pode ser negociado se o pagante do contrato for identificado e uma oferta melhor for feita (PRE CD 14 + prova de pagamento). </p>",
    turnPatterns: [
      { label: "Execução Furtiva", description: "Punhal (2) + Punhal (2) + Movimentação (1)", totalPA: 5 }
    ]
  }
];

const typeMapping = {
  "animal": "animais",
  "morto-vivo": "mortos-vivos",
  "espírito": "espíritos",
  "elemental": "elementais",
  "aberração": "aberrações",
  "humanoide": "humanoides"
};

const folderMapping = {
  "animal": "fldbestanimai000",
  "morto-vivo": "fldbestmortos000",
  "espírito": "fldbestespiri000",
  "elemental": "fldbestelemen000",
  "aberração": "fldbestaberr0000",
  "humanoide": "fldbesthumano000"
};

const basePath = './packs/_source/bestiario';

monsters.forEach(m => {
  const folderName = typeMapping[m.type] || m.type;
  const dir = path.join(basePath, folderName);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });

  const folderId = folderMapping[m.type];
  const folderPath = path.join(dir, '_folder.yml');
  const folderContent = `_id: ${folderId}
name: ${folderName.charAt(0).toUpperCase() + folderName.slice(1)}
type: Actor
folder: null
sorting: a
_key: '!folders!${folderId}'
`;
  fs.writeFileSync(folderPath, folderContent);
  
  const processedAbilities = m.abilities.map(a => {
    const abilityImg = a.icon ? `systems/animus/assets/icons/skills/${a.icon}` : `systems/animus/assets/system-icons/talents/${a.rarity || 'comum'}.svg`;
    const { icon, ...rest } = a; // Remove icon from output
    return { ...rest, img: abilityImg };
  });

  const content = `_id: ${m.name.toLowerCase().replace(/\s+/g, '')}0001
name: "${m.name}"
type: npc
img: systems/animus/assets/system-icons/types/${m.type}.svg
folder: ${folderId}
system:
  nd: ${m.nd}
  classification: "${m.classification}"
  innateIdentity: "${m.type}"
  quote: "${m.quote || ""}"
  attributes:
    pot: { value: ${m.attributes.pot} }
    hab: { value: ${m.attributes.hab} }
    cog: { value: ${m.attributes.cog} }
    per: { value: ${m.attributes.per} }
    pre: { value: ${m.attributes.pre} }
    ani: { value: ${m.attributes.ani} }
  status:
    hp: { value: ${m.hp}, max: ${m.hp} }
    pe: { value: ${m.pe}, max: ${m.pe} }
    pa: { value: ${m.pa}, max: ${m.pa} }
  attack:
    label: "${m.atk.label}"
    formula: "${m.atk.formula}"
    attribute: "${m.atk.attribute}"
    baseBonus: ${m.atk.bonus}
  damageTable:
    damageType: "${m.atk.label.includes('(') ? m.atk.label.split('(')[0].trim() : m.atk.label}"
    attribute: "${m.atk.attribute}"
    ac1: ${m.nd * 2}
    ac2: ${m.nd * 3}
    ac3: ${m.nd * 4}
    ac4: ${m.nd * 5}
    ac5: ${m.nd * 6}
    ac6: ${m.nd * 8}
  skills: ${JSON.stringify(m.skills)}
  abilities: ${JSON.stringify(processedAbilities, null, 2).split('\n').map(l => '    ' + l).join('\n').trim()}
  turnPatterns: ${JSON.stringify(m.turnPatterns || [])}
  availableActions: "${m.availableActions || ""}"
  ecology: "${m.ecology || ""}"
  weaknesses: "${m.weaknesses || ""}"
  loot: "${m.loot || ""}"
  narratorNotes: "${m.narratorNotes || ""}"
flags: {}
_key: '!actors!${m.name.toLowerCase().replace(/\s+/g, '')}0001'
`;
  fs.writeFileSync(path.join(dir, `${m.name.replace(/\s+/g, '_')}.yml`), content);
});

console.log('Generated ' + monsters.length + ' monster files with full data in plural folders.');
