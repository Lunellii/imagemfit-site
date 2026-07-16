const CATEGORY_CANONICAL = [
  {
    name: "Abstrato Arquitet\u00f4nico",
    description: "Composi\u00e7\u00f5es abstratas com linhas e formas inspiradas na arquitetura."
  },
  {
    name: "Abstrato Fluido e M\u00e1rmore",
    description: "Arte abstrata com movimento fluido e est\u00e9tica de m\u00e1rmore."
  },
  {
    name: "Abstrato Geom\u00e9trico",
    description: "Formas geom\u00e9tricas e equil\u00edbrio visual para ambientes modernos."
  },
  {
    name: "Abstrato Minimalista",
    description: "Pe\u00e7as com est\u00e9tica limpa, elegante e minimalista."
  },
  {
    name: "Abstrato Estilo Pintura",
    description: "Abstratos com estética de pintura, pinceladas expressivas e acabamento artístico."
  },
  {
    name: "Animais",
    description: "Temas de fauna para dar personalidade e vida \u00e0 decora\u00e7\u00e3o."
  },
  {
    name: "\u00c1rvores",
    description: "Obras com \u00e1rvores e elementos naturais para ambientes acolhedores."
  },
  {
    name: "Cozinha",
    description: "Quadros pensados para cozinhas e espa\u00e7os gourmet."
  },
  {
    name: "Diversos",
    description: "Sele\u00e7\u00e3o variada de estilos e temas para todos os gostos."
  },
  {
    name: "Espelhos",
    description: "Pe\u00e7as com espelhos para ampliar e valorizar o ambiente."
  },
  {
    name: "Espiritualidade",
    description: "Temas de f\u00e9, energia e espiritualidade para ambientes de paz."
  },
  {
    name: "Estilo 3D",
    description: "Obras com relevo, textura e profundidade para criar um efeito tridimensional na decoração."
  },
  {
    name: "Flores e Folhas",
    description: "Composi\u00e7\u00f5es bot\u00e2nicas com delicadeza e frescor natural."
  },
  {
    name: "Frases",
    description: "Quadros com frases inspiradoras e mensagens decorativas."
  },
  {
    name: "Infantil",
    description: "Arte l\u00fadica e delicada para quartos e espa\u00e7os infantis."
  },
  {
    name: "Mar e Praia",
    description: "Paisagens mar\u00edtimas e clima praiano para ambientes leves."
  },
  {
    name: "Natureza",
    description: "Paisagens e elementos naturais para ambientes leves."
  },
  {
    name: "Pinturas Manuais",
    description: "Obras autorais com toque artesanal e acabamento exclusivo."
  },
  {
    name: "Pontes",
    description: "Tem\u00e1tica de pontes e arquitetura urbana em diferentes estilos."
  },
  {
    name: "Tridimensional",
    description: "Pe\u00e7as com profundidade, relevo e textura para destaque visual."
  },
  {
    name: "Urbano",
    description: "Refer\u00eancias de cidade, arquitetura e estilo contempor\u00e2neo."
  },
  {
    name: "Vida",
    description: "Obras que celebram movimento, cotidiano e express\u00f5es da vida."
  }
];

const normalize = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim()
    .replace(/\s+/g, " ");

const hasBrokenEncoding = (value) => /\u00c3|\u00c2|\uFFFD/.test(String(value || ""));

const CATEGORY_NAME_ALIASES = {
  "abstrato fluido e marmora": "abstrato fluido e marmore",
  "abstrato gometrico": "abstrato geometrico",
  "abstrato arquitotonico": "abstrato arquitetonico",
  "abstrato arquitetonico": "abstrato arquitetonico",
  "abstrato fluido e marmore": "abstrato fluido e marmore",
  "abstrato geometrico": "abstrato geometrico",
  "abstrato pintura e aquarela": "abstrato estilo pintura",
  "abstrato relevo": "estilo 3d",
  relevo: "estilo 3d",
  ponte: "pontes",
  tridmensional: "tridimensional",
  "pintura manual": "pinturas manuais"
};

const byNormalizedName = new Map(CATEGORY_CANONICAL.map((item) => [normalize(item.name), item]));
const canonicalDescriptionsNormalized = new Set(CATEGORY_CANONICAL.map((item) => normalize(item.description)));

const resolveCanonicalByName = (name) => {
  const normalized = normalize(name);
  const alias = CATEGORY_NAME_ALIASES[normalized] || normalized;
  return byNormalizedName.get(alias) || null;
};

export const getDisplayCategoryName = (name) => {
  const canonical = resolveCanonicalByName(name);
  return canonical?.name || String(name || "");
};

export const getDisplayCategoryDescription = (name, description) => {
  const current = String(description || "").trim();
  const canonical = resolveCanonicalByName(name);
  if (!canonical) return current;
  const normalizedCurrent = normalize(current);

  if (!current) return canonical.description;
  if (hasBrokenEncoding(current)) return canonical.description;
  if (canonicalDescriptionsNormalized.has(normalizedCurrent)) return canonical.description;
  if (/marmora|gometrico|composicoes|estetica|decoracao/.test(normalizedCurrent)) return canonical.description;

  return current;
};

export const withDisplayCategory = (category) => {
  if (!category) return category;
  const name = getDisplayCategoryName(category.name);
  const description = getDisplayCategoryDescription(name, category.description);
  return { ...category, name, description };
};
