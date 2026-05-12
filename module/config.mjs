const ANIMUS = {};

/* -------------------------------------------- */
/*  Atributos e Perícias                        */
/* -------------------------------------------- */

ANIMUS.attributes = {
  pot: { label: "POT", i18n: "ANIMUS.POT", index: 0 },
  hab: { label: "HAB", i18n: "ANIMUS.HAB", index: 1 },
  cog: { label: "COG", i18n: "ANIMUS.COG", index: 2 },
  per: { label: "PER", i18n: "ANIMUS.PER", index: 3 },
  pre: { label: "PRE", i18n: "ANIMUS.PRE", index: 4 },
  ani: { label: "ANI", i18n: "ANIMUS.ANI", index: 5 }
};

ANIMUS.attributesByIndex = Object.fromEntries(
  Object.entries(ANIMUS.attributes).map(([key, val]) => [val.index, key])
);

ANIMUS.attributesEnum = Object.fromEntries(
  Object.entries(ANIMUS.attributes).map(([key, val]) => [key, val.label])
);

ANIMUS.skills = {
  atletismo: { label: "ANIMUS.SkillAtletismo", attr: "pot", index: 0 },
  luta: { label: "ANIMUS.SkillLuta", attr: "pot", index: 1 },
  resistencia: { label: "ANIMUS.SkillResistencia", attr: "pot", index: 2 },
  proeza: { label: "ANIMUS.SkillProeza", attr: "pot", index: 3 },
  acrobacia: { label: "ANIMUS.SkillAcrobacia", attr: "hab", index: 4 },
  furtividade: { label: "ANIMUS.SkillFurtividade", attr: "hab", index: 5 },
  pontaria: { label: "ANIMUS.SkillPontaria", attr: "hab", index: 6 },
  prestidigitacao: { label: "ANIMUS.SkillPrestidigitacao", attr: "hab", index: 7 },
  oficio: { label: "ANIMUS.SkillOficio", attr: "cog", index: 8 },
  natureza: { label: "ANIMUS.SkillNatureza", attr: "cog", index: 9 },
  con_arcano: { label: "ANIMUS.SkillConArcano", attr: "cog", index: 10 },
  medicina: { label: "ANIMUS.SkillMedicina", attr: "cog", index: 11 },
  percepcao: { label: "ANIMUS.SkillPercepcao", attr: "per", index: 12 },
  compreensao: { label: "ANIMUS.SkillCompreensao", attr: "per", index: 13 },
  sobrevivencia: { label: "ANIMUS.SkillSobrevivencia", attr: "per", index: 14 },
  investigacao: { label: "ANIMUS.SkillInvestigacao", attr: "per", index: 15 },
  persuasao: { label: "ANIMUS.SkillPersuasao", attr: "pre", index: 16 },
  intimidacao: { label: "ANIMUS.SkillIntimidacao", attr: "pre", index: 17 },
  enganacao: { label: "ANIMUS.SkillEnganacao", attr: "pre", index: 18 },
  performance: { label: "ANIMUS.SkillPerformance", attr: "pre", index: 19 },
  elemento: { label: "ANIMUS.SkillElemento", attr: "ani", index: 20 },
  aura: { label: "ANIMUS.SkillAura", attr: "ani", index: 21 },
  intuicao: { label: "ANIMUS.SkillIntuicao", attr: "ani", index: 22 },
  controle: { label: "ANIMUS.SkillControle", attr: "ani", index: 23 }
};

ANIMUS.skillsByIndex = Object.fromEntries(
  Object.entries(ANIMUS.skills).map(([key, val]) => [val.index, key])
);

/* -------------------------------------------- */
/*  Tipos e Categorias                          */
/* -------------------------------------------- */

ANIMUS.itemTypes = {
  weapon: "ANIMUS.ItemWeapon",
  armor: "ANIMUS.ItemArmor",
  shield: "ANIMUS.ItemShield",
  secondary: "ANIMUS.ItemSecondary",
  gear: "ANIMUS.ItemGear",
  talent: "ANIMUS.ItemTalent",
  element: "ANIMUS.ItemElement",
  ascendancy: "ANIMUS.ItemAscendancy",
  property: "ANIMUS.ItemProperty",
  action: "ANIMUS.ItemAction",
  condition: "ANIMUS.ItemCondition",
  rune: "ANIMUS.ItemRune"
};

ANIMUS.weaponTypes = {
  cortante_leve: "ANIMUS.WeaponType.cortante_leve",
  cortante_medio: "ANIMUS.WeaponType.cortante_medio",
  contusa_leve: "ANIMUS.WeaponType.contusa_leve",
  contusa_medio: "ANIMUS.WeaponType.contusa_medio",
  perfurante_leve: "ANIMUS.WeaponType.perfurante_leve",
  perfurante_medio: "ANIMUS.WeaponType.perfurante_medio",
  distancia_leve: "ANIMUS.WeaponType.distancia_leve",
  distancia_media: "ANIMUS.WeaponType.distancia_media",
  fogo_leve: "ANIMUS.WeaponType.fogo_leve",
  fogo_media: "ANIMUS.WeaponType.fogo_media"
};

ANIMUS.armorTypes = {
  none: "ANIMUS.ArmorNone",
  leve: "ANIMUS.ArmorLeve",
  media: "ANIMUS.ArmorMedia",
  pesada: "ANIMUS.ArmorPesada"
};

ANIMUS.weaponCategories = {
  branca: "ANIMUS.WeaponCategoryBranca",
  fogo: "ANIMUS.WeaponCategoryFogo",
  projetil: "ANIMUS.WeaponCategoryProjetil"
};

ANIMUS.damageTypes = {
  cortante: "ANIMUS.DamageCortante",
  perfurante: "ANIMUS.DamagePerfurante",
  contuso: "ANIMUS.DamageContuso",
  fogo: "ANIMUS.DamageFogo",
  energia: "ANIMUS.DamageEnergia",
  venenoso: "ANIMUS.DamageVenenoso",
  eletrico: "ANIMUS.DamageEletrico",
  gelo: "ANIMUS.DamageGelo",
  luz: "ANIMUS.DamageLuz",
  trevas: "ANIMUS.DamageTrevas",
  distancia: "ANIMUS.DamageDistancia"
};

ANIMUS.weaponSubTypes = {
  cortante_leve: "ANIMUS.WeaponType.cortante_leve",
  cortante_medio: "ANIMUS.WeaponType.cortante_medio",
  contusa_leve: "ANIMUS.WeaponType.contusa_leve",
  contusa_medio: "ANIMUS.WeaponType.contusa_medio",
  perfurante_leve: "ANIMUS.WeaponType.perfurante_leve",
  perfurante_medio: "ANIMUS.WeaponType.perfurante_medio",
  distancia_leve: "ANIMUS.WeaponType.distancia_leve",
  distancia_media: "ANIMUS.WeaponType.distancia_media",
  fogo_leve: "ANIMUS.WeaponType.fogo_leve",
  fogo_media: "ANIMUS.WeaponType.fogo_media"
};

// Mapeamentos para compatibilidade com dados legados (índices numéricos)
ANIMUS.weaponTypesByIndex = {
  0: "cortante_leve", 1: "cortante_medio", 2: "contusa_leve", 3: "contusa_medio",
  4: "perfurante_leve", 5: "perfurante_medio", 6: "distancia_leve", 7: "distancia_media",
  8: "fogo_leve", 9: "fogo_media"
};

ANIMUS.weaponActionCosts = {
  cortante_leve: 1,
  cortante_medio: 2,
  contusa_leve: 1,
  contusa_medio: 2,
  perfurante_leve: 1,
  perfurante_medio: 2,
  distancia_leve: 1,
  distancia_media: 2,
  fogo_leve: 1,
  fogo_media: 2
};

ANIMUS.damageTypesByIndex = {
  0: "cortante", 1: "perfurante", 2: "contuso", 3: "fogo", 4: "energia",
  5: "venenoso", 6: "eletrico", 7: "gelo", 8: "luz", 9: "trevas"
};

ANIMUS.weaponRanges = {
  0: "ANIMUS.RangeCorpoACorpo",
  1: "ANIMUS.RangeCurto",
  2: "ANIMUS.RangeMedio",
  3: "ANIMUS.RangeLongo"
};

ANIMUS.talentTypes = {
  0: "ANIMUS.TalentPassiva",
  1: "ANIMUS.TalentAtiva",
  2: "ANIMUS.TalentReacao",
  3: "ANIMUS.TalentGatilho"
};

ANIMUS.propertyTypes = {
  0: "ANIMUS.PropertyMecanica",
  1: "ANIMUS.PropertyFogo",
  2: "ANIMUS.PropertyPrincipal",
  3: "ANIMUS.PropertyModular"
};

ANIMUS.actionTypes = {
  0: "ANIMUS.ActionAtaque",
  1: "ANIMUS.ActionDefesa",
  2: "ANIMUS.ActionUtilitaria"
};

ANIMUS.gearCategories = {
  cura: "ANIMUS.GearCura",
  tatico: "ANIMUS.GearTatico",
  viagem: "ANIMUS.GearViagem",
  especial: "ANIMUS.GearEspecial",
  iluminacao: "ANIMUS.GearIluminacao"
};

ANIMUS.talentCategories = {
  "Combate": { label: "ANIMUS.TalentCategoryCombate", icon: "fas fa-swords" },
  "Elemento": { label: "ANIMUS.TalentCategoryElemento", icon: "fas fa-fire-alt" },
  "Pericia": { label: "ANIMUS.TalentCategoryPericia", icon: "fas fa-scroll" }
};

ANIMUS.ascendancies = {
  felino: "Felino",
  lupino: "Lupino",
  falko: "Falko",
  reptilia: "Reptilia",
  roedor: "Roedor",
  primata: "Primata",
  mestico: "Mestiço"
};

ANIMUS.elements = {
  trovao: "Trovão",
  fogo: "Fogo",
  vento: "Vento",
  agua: "Água",
  madeira: "Madeira",
  terra: "Terra",
  metal: "Metal",
  gelo: "Gelo",
  luz: "Luz",
  trevas: "Trevas"
};

ANIMUS.weaponProperties = [
  "Arremessável",
  "Ocultável",
  "Defensiva",
  "Encurvada",
  "Longo Alcance",
  "Pesada",
  "Leve",
  "Versátil",
  "Brutal",
  "Ágil"
];

ANIMUS.basicActions = [
  { name: "Mover", cost: 1, img: "systems/animus/assets/system-icons/action/sprint.svg", description: "Desloca-se até 9 metros pelo campo de batalha." },
  { name: "Atacar", cost: 1, img: "systems/animus/assets/system-icons/weapon/sword-clash.svg", description: "Realiza um ataque com uma arma pronta (Leve = 1 PA, Média = 2 PA)." },
  { name: "Sacar Arma", cost: 1, img: "systems/animus/assets/system-icons/action/switch-weapon.svg", description: "Saca ou guarda uma arma pronta para uso." },
  { name: "Usar Item", cost: 1, img: "systems/animus/assets/system-icons/action/targeting.svg", description: "Consome ou ativa um item do seu inventário." },
  { name: "Manobra", cost: 1, img: "systems/animus/assets/system-icons/action/grab.svg", description: "Realiza uma manobra de combate (Empurrar, Agarrar, etc)." },
  { name: "Reação Defensiva", cost: 0, img: "systems/animus/assets/system-icons/action/broken-shield.svg", description: "Gasta PA do próximo turno para aumentar sua Proteção contra um ataque." }
];

/* -------------------------------------------- */
/*  Progressão                                  */
/* -------------------------------------------- */

ANIMUS.LEVEL_CAPS = {
  1: { pa: 4, attrCap: 2, attrPoints: 1 },
  2: { pa: 4, attrCap: 2, attrPoints: 1 },
  3: { pa: 4, attrCap: 2, attrPoints: 2 },
  4: { pa: 5, attrCap: 2, attrPoints: 2 },
  5: { pa: 5, attrCap: 3, attrPoints: 3 },
  6: { pa: 5, attrCap: 3, attrPoints: 3 },
  7: { pa: 5, attrCap: 3, attrPoints: 4 },
  8: { pa: 6, attrCap: 3, attrPoints: 4 },
  9: { pa: 6, attrCap: 3, attrPoints: 5 },
  10: { pa: 6, attrCap: 3, attrPoints: 5 },
};

export default ANIMUS;
