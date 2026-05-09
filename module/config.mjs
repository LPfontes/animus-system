const ANIMUS = {};

ANIMUS.attributes = {
  pot: "ANIMUS.POT",
  hab: "ANIMUS.HAB",
  cog: "ANIMUS.COG",
  per: "ANIMUS.PER",
  pre: "ANIMUS.PRE",
  ani: "ANIMUS.ANI"
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

ANIMUS.weaponTypes = {
  0: "ANIMUS.WeaponCortante",
  1: "ANIMUS.WeaponPerfurante",
  2: "ANIMUS.WeaponImpacto",
  3: "ANIMUS.WeaponFogo",
  4: "ANIMUS.WeaponEnergia"
};

ANIMUS.weaponRanges = {
  0: "ANIMUS.RangeCorpoACorpo",
  1: "ANIMUS.RangeCurto",
  2: "ANIMUS.RangeMedio",
  3: "ANIMUS.RangeLongo"
};

ANIMUS.attributesEnum = {
  0: "POT",
  1: "HAB",
  2: "COG",
  3: "PER",
  4: "PRE",
  5: "ANI"
};

ANIMUS.applicationTypes = {
  none: "ANIMUS.AppNone",
  damage: "ANIMUS.AppDamage",
  heal: "ANIMUS.AppHeal",
  condition: "ANIMUS.AppCondition",
  test: "ANIMUS.AppTest"
};

ANIMUS.resources = {
  pv: "ANIMUS.PV",
  pe: "ANIMUS.PE"
};

ANIMUS.skillsEnum = {
  0: "ANIMUS.SkillAtletismo",
  1: "ANIMUS.SkillLuta",
  2: "ANIMUS.SkillResistencia",
  3: "ANIMUS.SkillProeza",
  4: "ANIMUS.SkillAcrobacia",
  5: "ANIMUS.SkillFurtividade",
  6: "ANIMUS.SkillPontaria",
  7: "ANIMUS.SkillPrestidigitacao",
  8: "ANIMUS.SkillOficio",
  9: "ANIMUS.SkillNatureza",
  10: "ANIMUS.SkillConArcano",
  11: "ANIMUS.SkillMedicina",
  12: "ANIMUS.SkillPercepcao",
  13: "ANIMUS.SkillCompreensao",
  14: "ANIMUS.SkillSobrevivencia",
  15: "ANIMUS.SkillInvestigacao",
  16: "ANIMUS.SkillPersuasao",
  17: "ANIMUS.SkillIntimidacao",
  18: "ANIMUS.SkillEnganacao",
  19: "ANIMUS.SkillPerformance",
  20: "ANIMUS.SkillElemento",
  21: "ANIMUS.SkillAura",
  22: "ANIMUS.SkillIntuicao",
  23: "ANIMUS.SkillControle"
};

ANIMUS.skills = {
  atletismo: { label: "ANIMUS.SkillAtletismo", attr: "pot" },
  luta: { label: "ANIMUS.SkillLuta", attr: "pot" },
  resistencia: { label: "ANIMUS.SkillResistencia", attr: "pot" },
  proeza: { label: "ANIMUS.SkillProeza", attr: "pot" },
  acrobacia: { label: "ANIMUS.SkillAcrobacia", attr: "hab" },
  furtividade: { label: "ANIMUS.SkillFurtividade", attr: "hab" },
  pontaria: { label: "ANIMUS.SkillPontaria", attr: "hab" },
  prestidigitacao: { label: "ANIMUS.SkillPrestidigitacao", attr: "hab" },
  oficio: { label: "ANIMUS.SkillOficio", attr: "cog" },
  natureza: { label: "ANIMUS.SkillNatureza", attr: "cog" },
  con_arcano: { label: "ANIMUS.SkillConArcano", attr: "cog" },
  medicina: { label: "ANIMUS.SkillMedicina", attr: "cog" },
  percepcao: { label: "ANIMUS.SkillPercepcao", attr: "per" },
  compreensao: { label: "ANIMUS.SkillCompreensao", attr: "per" },
  sobrevivencia: { label: "ANIMUS.SkillSobrevivencia", attr: "per" },
  investigacao: { label: "ANIMUS.SkillInvestigacao", attr: "per" },
  persuasao: { label: "ANIMUS.SkillPersuasao", attr: "pre" },
  intimidacao: { label: "ANIMUS.SkillIntimidacao", attr: "pre" },
  enganacao: { label: "ANIMUS.SkillEnganacao", attr: "pre" },
  performance: { label: "ANIMUS.SkillPerformance", attr: "pre" },
  elemento: { label: "ANIMUS.SkillElemento", attr: "ani" },
  aura: { label: "ANIMUS.SkillAura", attr: "ani" },
  intuicao: { label: "ANIMUS.SkillIntuicao", attr: "ani" },
  controle: { label: "ANIMUS.SkillControle", attr: "ani" }
};

ANIMUS.ascendancies = [
  "Felino", "Lupino", "Falko", "Reptilia", "Roedor", "Primata", "Mestiço"
];

ANIMUS.elements = [
  "Trovão", "Fogo", "Vento", "Água", "Madeira", "Terra", "Metal", "Gelo", "Luz", "Trevas"
];

export default ANIMUS;
