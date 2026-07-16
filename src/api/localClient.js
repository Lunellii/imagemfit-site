import seedCatalog from "@/data/seedCatalog.json";
import { buildServerClient } from "@/api/serverClient";
import { withDisplayCategory } from "@/utils/categoryText";


const CATEGORY_KEY = "ifq_categories";

const IMAGE_KEY = "ifq_images";
const SEEDED_KEY = "ifq_seeded_v1";
const CATALOG_SEED_MIGRATION_KEY = "ifq_catalog_seed_migrated_v1";
const CATEGORY_MIGRATION_KEY = "ifq_categories_migrated_v6";
const CATALOG_TAXONOMY_MIGRATION_KEY = "ifq_catalog_taxonomy_migrated_v1";
const IMAGE_ASSET_MIGRATION_KEY = "ifq_image_assets_migrated_v1";
const ADMIN_SESSION_KEY = "ifq_admin_session";
const SITE_STATE_KEY = "ifq_site_state";
const DEFAULT_SITE_STATE = {
  paused: false,
  headline: "Portfólio em atualização",
  message: "Estamos atualizando algumas categorias do portfólio. Volte em instantes ou entre em contato por e-mail.",
  cta_label: "Enviar e-mail",
  cta_url: "mailto:atendimento.imagemfit@gmail.com"
};

const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 6;
const ADMIN_EMAIL = String(import.meta.env.VITE_ADMIN_EMAIL || "")
  .trim()
  .toLowerCase();
const ADMIN_PASSWORD = String(import.meta.env.VITE_ADMIN_PASSWORD || "").trim();
const ADMIN_FORCE_ENABLE = String(import.meta.env.VITE_ENABLE_ADMIN || "")
  .trim()
  .toLowerCase() === "true";
const ADMIN_LOGIN_RATE_LIMIT_KEY = "ifq_admin_login_rate_limit_v1";
const ADMIN_MAX_FAILED_ATTEMPTS = 5;
const ADMIN_ATTEMPT_WINDOW_MS = 1000 * 60 * 15;
const ADMIN_LOCKOUT_MS = 1000 * 60 * 15;
const ADMIN_DISABLED_ERROR = "ADMIN_DISABLED_PUBLIC";

const MAX_UPLOAD_DIMENSION = 1600;
const UPLOAD_DIMENSION_LARGE = 1440;
const UPLOAD_DIMENSION_XLARGE = 1280;
const UPLOAD_TARGET_BYTES = 850_000;
const UPLOAD_WEBP_QUALITY_STEPS = [0.82, 0.76, 0.7, 0.64];

const IMAGE_ASSET_PREFIX = "ifq-asset://";
const IMAGE_ASSET_DB_NAME = "ifq_assets";
const IMAGE_ASSET_DB_VERSION = 1;
const IMAGE_ASSET_STORE = "images";
const SAMPLE_IMAGE_PREFIX = "https://picsum.photos/seed/ifq-";

const REQUIRED_CATEGORIES = [
  { name: "Abstrato Arquitet\u00f4nico", description: "Composi\u00e7\u00f5es abstratas com linhas e formas inspiradas na arquitetura." },
  { name: "Abstrato Fluido e M\u00e1rmore", description: "Arte abstrata com movimento fluido e est\u00e9tica de m\u00e1rmore." },
  { name: "Abstrato Geom\u00e9trico", description: "Formas geom\u00e9tricas e equil\u00edbrio visual para ambientes modernos." },
  { name: "Abstrato Minimalista", description: "Pe\u00e7as com est\u00e9tica limpa, elegante e minimalista." },
  { name: "Abstrato Estilo Pintura", description: "Abstratos com estética de pintura, pinceladas expressivas e acabamento artístico." },
  { name: "Animais", description: "Temas de fauna para dar personalidade e vida \u00e0 decora\u00e7\u00e3o." },
  { name: "\u00c1rvores", description: "Obras com \u00e1rvores e elementos naturais para ambientes acolhedores." },
  { name: "Cozinha", description: "Quadros pensados para cozinhas e espa\u00e7os gourmet." },
  { name: "Diversos", description: "Sele\u00e7\u00e3o variada de estilos e temas para todos os gostos." },
  { name: "Espelhos", description: "Pe\u00e7as com espelhos para ampliar e valorizar o ambiente." },
  { name: "Espiritualidade", description: "Temas de f\u00e9, energia e espiritualidade para ambientes de paz." },
  { name: "Estilo 3D", description: "Obras com relevo, textura e profundidade para criar um efeito tridimensional na decoração." },
  { name: "Flores e Folhas", description: "Composi\u00e7\u00f5es bot\u00e2nicas com delicadeza e frescor natural." },
  { name: "Frases", description: "Quadros com frases inspiradoras e mensagens decorativas." },
  { name: "Infantil", description: "Arte l\u00fadica e delicada para quartos e espa\u00e7os infantis." },
  { name: "Mar e Praia", description: "Paisagens mar\u00edtimas e clima praiano para ambientes leves." },
  { name: "Natureza", description: "Paisagens e elementos naturais para ambientes leves." },
  { name: "Pinturas Manuais", description: "Obras autorais com toque artesanal e acabamento exclusivo." },
  { name: "Pontes", description: "Tem\u00e1tica de pontes e arquitetura urbana em diferentes estilos." },
  { name: "Tridimensional", description: "Pe\u00e7as com profundidade, relevo e textura para destaque visual." },
  { name: "Urbano", description: "Refer\u00eancias de cidade, arquitetura e estilo contempor\u00e2neo." },
  { name: "Vida", description: "Obras que celebram movimento, cotidiano e express\u00f5es da vida." }
];

let imageAssetDbPromise = null;
let imageAssetsMigrationPromise = null;
const imageAssetObjectUrlCache = new Map();
let imageAssetCleanupRegistered = false;

const nowIso = () => new Date().toISOString();
const isBrowser = () => typeof window !== "undefined" && typeof window.location !== "undefined";
const isLocalHost = () => {
  if (!isBrowser()) return false;
  const host = window.location.hostname;
  return host === "localhost" || host === "127.0.0.1";
};
const isAdminEnabled = () => ADMIN_FORCE_ENABLE || isLocalHost();
const assertAdminEnabled = () => {
  if (!isAdminEnabled()) {
    throw new Error(ADMIN_DISABLED_ERROR);
  }
};

const uid = () => {
  if (typeof crypto !== "undefined" && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
};

const readJson = (key, fallback) => {
  try {
    const raw = localStorage.getItem(key);
    return raw ? JSON.parse(raw) : fallback;
  } catch (_err) {
    return fallback;
  }
};

const isQuotaExceededError = (error) => {
  if (!error || typeof error !== "object") return false;
  const domExceptionName = String(error.name || "");
  const code = Number(error.code || 0);
  return domExceptionName === "QuotaExceededError" || domExceptionName === "NS_ERROR_DOM_QUOTA_REACHED" || code === 22 || code === 1014;
};

const writeJson = (key, value) => {
  try {
    localStorage.setItem(key, JSON.stringify(value));
  } catch (error) {
    if (isQuotaExceededError(error)) {
      throw new Error("STORAGE_QUOTA_EXCEEDED");
    }
    throw error;
  }
};

const decodeBase64Url = (value) => {
  const normalized = String(value || "")
    .replace(/-/g, "+")
    .replace(/_/g, "/")
    .padEnd(Math.ceil(String(value || "").length / 4) * 4, "=");
  return atob(normalized);
};

const parseGoogleCredential = (credential) => {
  const parts = String(credential || "").split(".");
  if (parts.length < 2) {
    throw new Error("INVALID_GOOGLE_CREDENTIAL");
  }
  try {
    return JSON.parse(decodeBase64Url(parts[1]));
  } catch (_err) {
    throw new Error("INVALID_GOOGLE_CREDENTIAL");
  }
};

const createLoginRateLimitError = (retryMs) => {
  const err = new Error("LOGIN_RATE_LIMITED");
  err.retry_after_seconds = Math.max(1, Math.ceil(Math.max(0, retryMs) / 1000));
  return err;
};

const readAdminLoginRateLimit = () => {
  const fallback = { failed_attempts: 0, first_failed_at: "", lock_until: "" };
  const raw = readJson(ADMIN_LOGIN_RATE_LIMIT_KEY, fallback);
  const failedAttempts = Math.max(0, Number(raw?.failed_attempts || 0));
  const firstFailedMs = Date.parse(raw?.first_failed_at || "");
  const lockUntilMs = Date.parse(raw?.lock_until || "");
  const now = Date.now();

  if (!Number.isFinite(firstFailedMs) || firstFailedMs <= 0 || now - firstFailedMs > ADMIN_ATTEMPT_WINDOW_MS) {
    return fallback;
  }

  if (Number.isFinite(lockUntilMs) && lockUntilMs > now) {
    return {
      failed_attempts: failedAttempts,
      first_failed_at: new Date(firstFailedMs).toISOString(),
      lock_until: new Date(lockUntilMs).toISOString()
    };
  }

  return {
    failed_attempts: failedAttempts,
    first_failed_at: new Date(firstFailedMs).toISOString(),
    lock_until: ""
  };
};

const clearAdminLoginRateLimit = () => {
  localStorage.removeItem(ADMIN_LOGIN_RATE_LIMIT_KEY);
};

const assertAdminLoginAllowed = () => {
  assertAdminEnabled();
};

const registerAdminLoginFailure = () => {
  clearAdminLoginRateLimit();
  return null;
};

const createSessionFingerprint = () => {
  if (typeof navigator === "undefined") return "";
  const host = typeof window !== "undefined" && window.location ? window.location.host : "";
  const source = `${navigator.userAgent || ""}|${navigator.language || ""}|${host}`;
  try {
    return btoa(source);
  } catch (_error) {
    try {
      const bytes = new TextEncoder().encode(source);
      const binary = Array.from(bytes, (byte) => String.fromCharCode(byte)).join("");
      return btoa(binary);
    } catch (_innerError) {
      return source;
    }
  }
};

const clearAdminSession = () => {
  localStorage.removeItem(ADMIN_SESSION_KEY);
};

const invalidateAdminSessionIfNeeded = () => {
  if (!isAdminEnabled()) {
    clearAdminSession();
    return null;
  }

  const session = readJson(ADMIN_SESSION_KEY, null);
  if (!session) return null;

  const expiresAtMs = Date.parse(session.expires_at || "");
  if (!Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now()) {
    clearAdminSession();
    return null;
  }

  const expectedFingerprint = createSessionFingerprint();
  if (session.fingerprint && expectedFingerprint && session.fingerprint !== expectedFingerprint) {
    clearAdminSession();
    return null;
  }

  return session;
};

const createAdminSession = ({ id, name, email, provider = "local" }) => ({
  id,
  role: "admin",
  name,
  email,
  provider,
  fingerprint: createSessionFingerprint(),
  created_date: nowIso(),
  expires_at: new Date(Date.now() + ADMIN_SESSION_TTL_MS).toISOString()
});

const normalizeCategoryName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeDescription = (value) => String(value || "").trim();
const hasBrokenEncoding = (value) => /Ã|Â|\uFFFD/.test(String(value || ""));
const normalizeImageCode = (value) => String(value || "").trim().replace(/^#+/, "").toUpperCase();

const CATEGORY_DESCRIPTION_ALIASES = {
  "abstrato fluido e marmora": "abstrato fluido e marmore",
  "abstrato gometrico": "abstrato geometrico",
  "abstrato arquitotonico": "abstrato arquitetonico",
  "abstrato arquitetonico": "abstrato arquitetônico",
  "abstrato fluido e marmore": "abstrato fluido e mármore",
  "abstrato geometrico": "abstrato geométrico",
  "abstrato pintura e aquarela": "abstrato estilo pintura",
  "abstrato relevo": "estilo 3d",
  relevo: "estilo 3d",
  arvores: "árvores",
  ponte: "pontes",
  pontes: "pontes",
  "pintura manual": "pinturas manuais",
  tridmensional: "tridimensional"
};

const requiredDescriptionByName = new Map(REQUIRED_CATEGORIES.map((category) => [normalizeCategoryName(category.name), category.description]));
const requiredNameByNormalized = new Map(REQUIRED_CATEGORIES.map((category) => [normalizeCategoryName(category.name), category.name]));

const resolveCategoryDescription = (categoryName) => {
  const normalizedName = normalizeCategoryName(categoryName);
  if (!normalizedName) return "";

  const canonical = CATEGORY_DESCRIPTION_ALIASES[normalizedName] || normalizedName;
  const description = requiredDescriptionByName.get(canonical);
  if (description) return description;

  return `Coleção ${String(categoryName || "").trim()} com curadoria para compor ambientes com estilo.`;
};

const buildCategory = (name, order, description = "") => ({
  id: uid(),
  name,
  description,
  cover_enabled: true,
  order,
  created_date: nowIso()
});

const normalizeCategories = (categories) => {
  let changed = false;
  const normalized = categories.map((cat) => {
    let next = cat;

    if (Object.prototype.hasOwnProperty.call(cat, "cover_image")) {
      changed = true;
      const { cover_image: _unused, ...rest } = next;
      next = rest;
    }

    if (typeof next.cover_enabled !== "boolean") {
      changed = true;
      next = { ...next, cover_enabled: true };
    }

    return next;
  });

  if (changed) {
    writeJson(CATEGORY_KEY, normalized);
  }

  return normalized;
};

const makeImageCodePrefix = (name) => {
  const base = normalizeCategoryName(name).replace(/[^a-z0-9]/g, "");
  return (base.slice(0, 3).toUpperCase() || "CAT").padEnd(3, "X");
};

const toStaticAssetUrl = (value) => {
  const raw = String(value || "").trim();
  if (!raw) return "";
  if (/^(https?:|data:|blob:|ifq-asset:\/\/)/i.test(raw)) return raw;
  return `${import.meta.env.BASE_URL}${raw.replace(/^\/+/, "")}`;
};

const seedImagesForCategories = (categories) => {
  const sampleCategories = categories.slice(0, 6);
  return sampleCategories.flatMap((cat, catIndex) =>
    Array.from({ length: 4 }, (_, i) => {
      const n = i + 1;
      return {
        id: uid(),
        title: `${cat.name} ${n}`,
        code: `${makeImageCodePrefix(cat.name)}-${String(n).padStart(3, "0")}`,
        image_url: `https://picsum.photos/seed/ifq-${catIndex}-${n}/1200/1200`,
        category_id: cat.id,
        is_new: i < 2,
        created_date: new Date(Date.now() - (catIndex * 10 + i) * 86400000).toISOString()
      };
    })
  );
};

const seedImagesFromCatalog = (categories) => {
  const entries = Array.isArray(seedCatalog?.images) ? seedCatalog.images : [];
  if (!entries.length) return [];

  const categoryIdByName = new Map(categories.map((category) => [normalizeCategoryName(category.name), category.id]));
  const seeded = [];
  const seen = new Set();

  entries.forEach((entry, index) => {
    const normalizedCategory = normalizeCategoryName(entry?.category);
    const canonicalCategory = CATEGORY_DESCRIPTION_ALIASES[normalizedCategory] || normalizedCategory;
    const categoryId = categoryIdByName.get(canonicalCategory) || categoryIdByName.get(normalizedCategory);
    if (!categoryId) return;

    const code = normalizeImageCode(entry?.code || entry?.title || "");
    if (!code) return;

    const imageUrl = toStaticAssetUrl(entry?.image);
    if (!imageUrl) return;

    const dedupeKey = `${categoryId}::${code}`;
    if (seen.has(dedupeKey)) return;
    seen.add(dedupeKey);

    seeded.push({
      id: uid(),
      title: String(entry?.title || code),
      code,
      image_url: imageUrl,
      category_id: categoryId,
      is_new: index < 20,
      created_date: new Date(Date.now() - index * 60000).toISOString()
    });
  });

  return seeded;
};

const buildInitialImages = (categories) => {
  const catalogImages = seedImagesFromCatalog(categories);
  if (!catalogImages.length) return seedImagesForCategories(categories);

  const categoriesWithImage = new Set(catalogImages.map((image) => image.category_id));
  const categoriesWithoutImage = categories.filter((category) => !categoriesWithImage.has(category.id));
  if (!categoriesWithoutImage.length) return catalogImages;

  const fallbackImages = seedImagesForCategories(categoriesWithoutImage).map((image, index) => ({
    ...image,
    is_new: false,
    created_date: new Date(Date.now() - (catalogImages.length + index) * 60000).toISOString()
  }));

  return [...catalogImages, ...fallbackImages];
};

const migrateRequiredCategoriesOnce = () => {
  if (localStorage.getItem(CATEGORY_MIGRATION_KEY) === "1") return;

  const categories = normalizeCategories(readJson(CATEGORY_KEY, []));
  const seen = new Set();
  let changed = false;
  const normalizedCategories = [];

  for (const category of categories) {
    const rawName = String(category?.name || "").trim();
    const normalizedName = normalizeCategoryName(rawName);
    if (!normalizedName) {
      changed = true;
      continue;
    }

    const canonicalKey = CATEGORY_DESCRIPTION_ALIASES[normalizedName] || normalizedName;
    const canonicalName = requiredNameByNormalized.get(canonicalKey) || rawName;
    if (seen.has(canonicalKey)) {
      changed = true;
      continue;
    }
    seen.add(canonicalKey);

    const currentDescription = normalizeDescription(category.description);
    const resolvedDescription = resolveCategoryDescription(canonicalName);
    const shouldUseResolvedDescription =
      canonicalName !== rawName ||
      !currentDescription ||
      hasBrokenEncoding(currentDescription) ||
      normalizeCategoryName(currentDescription) === normalizeCategoryName(resolvedDescription);
    const description = shouldUseResolvedDescription ? resolvedDescription : currentDescription;
    if (canonicalName !== rawName || description !== currentDescription) {
      changed = true;
    }

    normalizedCategories.push({
      ...category,
      name: canonicalName,
      description
    });
  }

  for (const required of REQUIRED_CATEGORIES) {
    const key = normalizeCategoryName(required.name);
    if (seen.has(key)) continue;
    seen.add(key);
    normalizedCategories.push(buildCategory(required.name, normalizedCategories.length, required.description));
    changed = true;
  }

  const reOrdered = normalizedCategories.map((category, index) => ({
    ...category,
    order: index
  }));

  if (changed) {
    writeJson(CATEGORY_KEY, reOrdered);
  }

  localStorage.setItem(CATEGORY_MIGRATION_KEY, "1");
};

const migrateCatalogSeedOnce = () => {
  if (localStorage.getItem(CATALOG_SEED_MIGRATION_KEY) === "1") return;

  const categories = normalizeCategories(readJson(CATEGORY_KEY, []));
  const catalogImages = seedImagesFromCatalog(categories);
  if (!catalogImages.length) {
    localStorage.setItem(CATALOG_SEED_MIGRATION_KEY, "1");
    return;
  }

  const currentImages = readJson(IMAGE_KEY, []);
  const hasCustomImages = currentImages.some((image) => {
    const url = String(image?.image_url || "");
    return url.length > 0 && !url.startsWith(SAMPLE_IMAGE_PREFIX);
  });

  if (!hasCustomImages) {
    writeJson(IMAGE_KEY, catalogImages);
  }

  localStorage.setItem(CATALOG_SEED_MIGRATION_KEY, "1");
};

const replaceCodePrefix = (value, legacyPrefixes, nextPrefix) => {
  const current = String(value || "");
  const upper = current.toUpperCase();
  const legacy = legacyPrefixes.find((prefix) => upper.startsWith(`${prefix}_`));
  return legacy ? `${nextPrefix}${current.slice(legacy.length)}` : current;
};

const migrateLocalImageUrl = (imageUrl, migration) => {
  const current = String(imageUrl || "");
  const movedFolder = current.replace(migration.legacyFolder, migration.nextFolder);
  const slashIndex = movedFolder.lastIndexOf("/");
  if (slashIndex < 0) {
    return replaceCodePrefix(movedFolder, migration.legacyPrefixes, migration.nextPrefix);
  }
  const folder = movedFolder.slice(0, slashIndex + 1);
  const filename = movedFolder.slice(slashIndex + 1);
  return `${folder}${replaceCodePrefix(filename, migration.legacyPrefixes, migration.nextPrefix)}`;
};

const migrateCatalogTaxonomyOnce = () => {
  if (localStorage.getItem(CATALOG_TAXONOMY_MIGRATION_KEY) === "1") return;

  const categories = normalizeCategories(readJson(CATEGORY_KEY, []));
  const categoryIdByName = new Map(categories.map((category) => [normalizeCategoryName(category.name), category.id]));
  const migrations = [
    {
      categoryId: categoryIdByName.get("abstrato estilo pintura"),
      legacyPrefixes: ["APA", "ABS"],
      nextPrefix: "AEP",
      legacyFolder: "catalog/abstrato-pintura-e-aquarela/",
      nextFolder: "catalog/abstrato-estilo-pintura/"
    },
    {
      categoryId: categoryIdByName.get("estilo 3d"),
      legacyPrefixes: ["ABR"],
      nextPrefix: "E3D",
      legacyFolder: "catalog/abstrato-relevo/",
      nextFolder: "catalog/estilo-3d/"
    }
  ];

  let changed = false;
  const nextImages = readJson(IMAGE_KEY, []).map((image) => {
    const migration = migrations.find((item) => item.categoryId && item.categoryId === image.category_id);
    if (!migration) return image;

    const code = replaceCodePrefix(image.code, migration.legacyPrefixes, migration.nextPrefix);
    const title = replaceCodePrefix(image.title, migration.legacyPrefixes, migration.nextPrefix);
    const currentUrl = String(image.image_url || "");
    const imageUrl = migrateLocalImageUrl(currentUrl, migration);

    if (code === image.code && title === image.title && imageUrl === currentUrl) return image;
    changed = true;
    return { ...image, code, title, image_url: imageUrl };
  });

  if (changed) {
    writeJson(IMAGE_KEY, nextImages);
  }
  localStorage.setItem(CATALOG_TAXONOMY_MIGRATION_KEY, "1");
};

const ensureSeed = () => {
  if (localStorage.getItem(SEEDED_KEY) !== "1") {
    const categories = REQUIRED_CATEGORIES.map((category, index) => buildCategory(category.name, index, category.description));
    const images = buildInitialImages(categories);

    writeJson(CATEGORY_KEY, categories);
    writeJson(IMAGE_KEY, images);

    localStorage.setItem(SEEDED_KEY, "1");
    localStorage.setItem(CATEGORY_MIGRATION_KEY, "1");
    localStorage.setItem(CATALOG_SEED_MIGRATION_KEY, "1");
    return;
  }

  migrateRequiredCategoriesOnce();
  migrateCatalogTaxonomyOnce();
  migrateCatalogSeedOnce();
};

const sortBy = (arr, sortExpr = "created_date") => {
  const isDesc = sortExpr.startsWith("-");
  const field = isDesc ? sortExpr.slice(1) : sortExpr;
  const sorted = [...arr].sort((a, b) => {
    const av = a[field];
    const bv = b[field];
    if (av === bv) return 0;
    if (av === undefined || av === null) return 1;
    if (bv === undefined || bv === null) return -1;
    if (typeof av === "number" && typeof bv === "number") return av - bv;
    return String(av).localeCompare(String(bv), "pt-BR");
  });
  return isDesc ? sorted.reverse() : sorted;
};

const toDataUrl = (file) =>
  new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });

const loadImageElement = (dataUrl) =>
  new Promise((resolve, reject) => {
    const image = new Image();
    image.onload = () => resolve(image);
    image.onerror = () => reject(new Error("IMAGE_DECODE_FAILED"));
    image.src = dataUrl;
  });

const estimateDataUrlBytes = (dataUrl) => {
  const data = String(dataUrl || "");
  const commaIndex = data.indexOf(",");
  if (commaIndex < 0) return data.length;
  return Math.ceil(((data.length - commaIndex - 1) * 3) / 4);
};

const optimizeImageDataUrl = async (file, originalDataUrl) => {
  const mimeType = String(file?.type || "").toLowerCase();
  if (!mimeType.startsWith("image/")) return originalDataUrl;
  if (mimeType.includes("svg") || mimeType.includes("gif")) return originalDataUrl;

  try {
    const image = await loadImageElement(originalDataUrl);
    const pixelArea = Math.max(1, image.width * image.height);
    const originalFileBytes = Number(file?.size || 0);
    let maxDimension = MAX_UPLOAD_DIMENSION;
    if (pixelArea >= 4_000_000 || originalFileBytes >= 4_000_000) {
      maxDimension = UPLOAD_DIMENSION_XLARGE;
    } else if (pixelArea >= 2_500_000 || originalFileBytes >= 2_000_000) {
      maxDimension = UPLOAD_DIMENSION_LARGE;
    }

    const ratio = Math.min(1, maxDimension / Math.max(image.width, 1), maxDimension / Math.max(image.height, 1));
    const targetWidth = Math.max(1, Math.round(image.width * ratio));
    const targetHeight = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) return originalDataUrl;
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    let bestCandidate = "";
    let bestCandidateBytes = Number.POSITIVE_INFINITY;

    for (const quality of UPLOAD_WEBP_QUALITY_STEPS) {
      const candidate = canvas.toDataURL("image/webp", quality);
      if (typeof candidate !== "string" || candidate.length === 0) continue;
      const candidateBytes = estimateDataUrlBytes(candidate);
      if (candidateBytes < bestCandidateBytes) {
        bestCandidate = candidate;
        bestCandidateBytes = candidateBytes;
      }
      if (candidateBytes <= UPLOAD_TARGET_BYTES) {
        bestCandidate = candidate;
        bestCandidateBytes = candidateBytes;
        break;
      }
    }

    if (!bestCandidate) return originalDataUrl;
    return bestCandidateBytes < estimateDataUrlBytes(originalDataUrl) ? bestCandidate : originalDataUrl;
  } catch (_error) {
    return originalDataUrl;
  }
};

const imageUrlToAssetId = (imageUrl) => {
  const value = String(imageUrl || "");
  return value.startsWith(IMAGE_ASSET_PREFIX) ? value.slice(IMAGE_ASSET_PREFIX.length) : "";
};

const isDataImageUrl = (value) => String(value || "").startsWith("data:image/");

const dataUrlToBlob = (dataUrl) => {
  const [header, content = ""] = String(dataUrl || "").split(",");
  const mime = (header.match(/data:([^;]+);/) || [])[1] || "application/octet-stream";
  const binary = atob(content);
  const length = binary.length;
  const bytes = new Uint8Array(length);
  for (let i = 0; i < length; i += 1) {
    bytes[i] = binary.charCodeAt(i);
  }
  return new Blob([bytes], { type: mime });
};

const openImageAssetDb = () => {
  if (typeof indexedDB === "undefined") return Promise.resolve(null);
  if (!imageAssetDbPromise) {
    imageAssetDbPromise = new Promise((resolve, reject) => {
      const request = indexedDB.open(IMAGE_ASSET_DB_NAME, IMAGE_ASSET_DB_VERSION);

      request.onupgradeneeded = () => {
        const db = request.result;
        if (!db.objectStoreNames.contains(IMAGE_ASSET_STORE)) {
          db.createObjectStore(IMAGE_ASSET_STORE, { keyPath: "id" });
        }
      };

      request.onsuccess = () => resolve(request.result);
      request.onerror = () => reject(request.error || new Error("INDEXEDDB_OPEN_FAILED"));
    }).catch(() => null);
  }
  return imageAssetDbPromise;
};

const putImageAsset = async (id, blob) => {
  const db = await openImageAssetDb();
  if (!db) return false;

  return new Promise((resolve, reject) => {
    const tx = db.transaction([IMAGE_ASSET_STORE], "readwrite");
    const store = tx.objectStore(IMAGE_ASSET_STORE);
    const req = store.put({ id, blob, created_date: nowIso() });
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error("INDEXEDDB_PUT_FAILED"));
  });
};

const getImageAssetBlob = async (id) => {
  const db = await openImageAssetDb();
  if (!db) return null;

  return new Promise((resolve, reject) => {
    const tx = db.transaction([IMAGE_ASSET_STORE], "readonly");
    const store = tx.objectStore(IMAGE_ASSET_STORE);
    const req = store.get(id);
    req.onsuccess = () => resolve(req.result?.blob || null);
    req.onerror = () => reject(req.error || new Error("INDEXEDDB_GET_FAILED"));
  });
};

const deleteImageAsset = async (id) => {
  const db = await openImageAssetDb();
  if (!db) return;

  await new Promise((resolve, reject) => {
    const tx = db.transaction([IMAGE_ASSET_STORE], "readwrite");
    const store = tx.objectStore(IMAGE_ASSET_STORE);
    const req = store.delete(id);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error || new Error("INDEXEDDB_DELETE_FAILED"));
  });
};

const revokeCachedObjectUrl = (assetId) => {
  const cached = imageAssetObjectUrlCache.get(assetId);
  if (cached && typeof URL !== "undefined" && URL.revokeObjectURL) {
    URL.revokeObjectURL(cached);
  }
  imageAssetObjectUrlCache.delete(assetId);
};

const registerObjectUrlCleanup = () => {
  if (imageAssetCleanupRegistered) return;
  if (typeof window === "undefined" || typeof window.addEventListener !== "function") return;

  imageAssetCleanupRegistered = true;
  window.addEventListener("beforeunload", () => {
    for (const objectUrl of imageAssetObjectUrlCache.values()) {
      if (typeof URL !== "undefined" && URL.revokeObjectURL) {
        URL.revokeObjectURL(objectUrl);
      }
    }
    imageAssetObjectUrlCache.clear();
  });
};

const persistImageAsAssetIfNeeded = async (imageUrl) => {
  if (!isDataImageUrl(imageUrl)) return imageUrl;
  const assetId = uid();
  const blob = dataUrlToBlob(imageUrl);
  const saved = await putImageAsset(assetId, blob);
  if (!saved) return imageUrl;
  return `${IMAGE_ASSET_PREFIX}${assetId}`;
};

const resolveImageUrlForView = async (imageUrl) => {
  const assetId = imageUrlToAssetId(imageUrl);
  if (!assetId) return imageUrl;
  registerObjectUrlCleanup();

  if (imageAssetObjectUrlCache.has(assetId)) {
    return imageAssetObjectUrlCache.get(assetId);
  }

  const blob = await getImageAssetBlob(assetId);
  if (!blob) return "";

  const objectUrl = URL.createObjectURL(blob);
  imageAssetObjectUrlCache.set(assetId, objectUrl);
  return objectUrl;
};

const hydrateImagesForView = async (images) => {
  const hydrated = await Promise.all(
    images.map(async (image) => ({
      ...image,
      image_url: await resolveImageUrlForView(image.image_url)
    }))
  );
  return hydrated;
};

const migrateImageAssetsOnce = async () => {
  if (localStorage.getItem(IMAGE_ASSET_MIGRATION_KEY) === "1") return;
  if (imageAssetsMigrationPromise) return imageAssetsMigrationPromise;

  imageAssetsMigrationPromise = (async () => {
    const currentImages = readJson(IMAGE_KEY, []);
    if (!Array.isArray(currentImages) || !currentImages.length) {
      localStorage.setItem(IMAGE_ASSET_MIGRATION_KEY, "1");
      return;
    }

    let changed = false;
    const nextImages = [];

    for (const image of currentImages) {
      let nextImageUrl = image.image_url;
      if (isDataImageUrl(image.image_url)) {
        try {
          nextImageUrl = await persistImageAsAssetIfNeeded(image.image_url);
          changed = changed || nextImageUrl !== image.image_url;
        } catch (_err) {
          nextImageUrl = image.image_url;
        }
      }
      nextImages.push({ ...image, image_url: nextImageUrl });
    }

    if (changed) {
      writeJson(IMAGE_KEY, nextImages);
    }

    localStorage.setItem(IMAGE_ASSET_MIGRATION_KEY, "1");
  })()
    .catch(() => {
      // Keep app working even if migration fails in this environment.
    })
    .finally(() => {
      imageAssetsMigrationPromise = null;
    });

  return imageAssetsMigrationPromise;
};

const ensureImagesReady = async () => {
  ensureSeed();
  await migrateImageAssetsOnce();
};

const readAdminSession = () => {
  return invalidateAdminSessionIfNeeded();
};

const requireAdmin = () => {
  assertAdminEnabled();
  const session = readAdminSession();
  if (!session || session.role !== "admin") {
    throw new Error("UNAUTHORIZED");
  }
  return session;
};

const CategoryEntity = {
  async list(sort = "order", limit = 100) {
    ensureSeed();
    const categories = normalizeCategories(readJson(CATEGORY_KEY, []));
    return sortBy(categories, sort)
      .slice(0, limit)
      .map((category) => withDisplayCategory(category));
  },
  async create(payload) {
    requireAdmin();
    ensureSeed();
    const categories = normalizeCategories(readJson(CATEGORY_KEY, []));
    const item = {
      id: uid(),
      name: payload.name,
      description: payload.description || "",
      cover_enabled: typeof payload.cover_enabled === "boolean" ? payload.cover_enabled : true,
      order: typeof payload.order === "number" ? payload.order : categories.length,
      created_date: nowIso()
    };
    categories.push(item);
    writeJson(CATEGORY_KEY, categories);
    return withDisplayCategory(item);
  },
  async update(id, payload) {
    requireAdmin();
    ensureSeed();
    const categories = normalizeCategories(readJson(CATEGORY_KEY, []));

    let updated = null;
    const nextCategories = categories.map((cat) => {
      if (cat.id !== id) return cat;

      updated = {
        ...cat,
        name: payload.name ?? cat.name,
        description: payload.description ?? cat.description ?? "",
        cover_enabled: typeof payload.cover_enabled === "boolean" ? payload.cover_enabled : cat.cover_enabled ?? true,
        order: typeof payload.order === "number" ? payload.order : cat.order
      };
      return updated;
    });

    if (!updated) {
      throw new Error("CATEGORY_NOT_FOUND");
    }

    writeJson(CATEGORY_KEY, nextCategories);
    return withDisplayCategory(updated);
  },
  async delete(id) {
    requireAdmin();
    await ensureImagesReady();

    const categories = normalizeCategories(readJson(CATEGORY_KEY, [])).filter((c) => c.id !== id);
    const images = readJson(IMAGE_KEY, []);
    const removedImages = images.filter((image) => image.category_id === id);
    const keptImages = images.filter((image) => image.category_id !== id);

    for (const image of removedImages) {
      const assetId = imageUrlToAssetId(image.image_url);
      if (assetId) {
        revokeCachedObjectUrl(assetId);
        await deleteImageAsset(assetId).catch(() => null);
      }
    }

    writeJson(CATEGORY_KEY, categories);
    writeJson(IMAGE_KEY, keptImages);
    return { success: true };
  }
};

const PortfolioImageEntity = {
  async list(sort = "-created_date", limit = 100) {
    await ensureImagesReady();
    const images = readJson(IMAGE_KEY, []);
    const sliced = sortBy(images, sort).slice(0, limit);
    return hydrateImagesForView(sliced);
  },
  async filter(filters = {}, sort = "-created_date", limit = 100) {
    await ensureImagesReady();
    const filtered = readJson(IMAGE_KEY, []).filter((img) => Object.entries(filters).every(([k, v]) => img[k] === v));
    const sliced = sortBy(filtered, sort).slice(0, limit);
    return hydrateImagesForView(sliced);
  },
  async filterPage(filters = {}, sort = "-created_date", page = 1, pageSize = 35) {
    await ensureImagesReady();

    const safePage = Math.max(1, Number(page) || 1);
    const safePageSize = Math.min(200, Math.max(1, Number(pageSize) || 35));

    const filtered = readJson(IMAGE_KEY, []).filter((img) => Object.entries(filters).every(([k, v]) => img[k] === v));
    const sorted = sortBy(filtered, sort);
    const total = sorted.length;
    const start = (safePage - 1) * safePageSize;
    const pageItems = sorted.slice(start, start + safePageSize);
    const items = await hydrateImagesForView(pageItems);

    return {
      items,
      total,
      page: safePage,
      page_size: safePageSize
    };
  },
  async groupedByCategory(sort = "-created_date", limitPerCategory = 8, categoryIds = []) {
    await ensureImagesReady();

    const safeLimit = Math.min(30, Math.max(1, Number(limitPerCategory) || 8));
    const idSet = Array.isArray(categoryIds) && categoryIds.length ? new Set(categoryIds) : null;
    const sorted = sortBy(readJson(IMAGE_KEY, []), sort);
    const groups = {};

    for (const image of sorted) {
      if (idSet && !idSet.has(image.category_id)) continue;
      if (!groups[image.category_id]) {
        groups[image.category_id] = [];
      }
      if (groups[image.category_id].length < safeLimit) {
        groups[image.category_id].push(image);
      }
    }

    const hydratedEntries = await Promise.all(
      Object.entries(groups).map(async ([categoryId, items]) => [categoryId, await hydrateImagesForView(items)])
    );

    return Object.fromEntries(hydratedEntries);
  },
  async create(payload) {
    requireAdmin();
    await ensureImagesReady();

    const images = readJson(IMAGE_KEY, []);
    const normalizedCode = normalizeImageCode(payload.code || payload.title);
    if (!normalizedCode) {
      throw new Error("INVALID_IMAGE_CODE");
    }

    const alreadyExists = images.some((image) => normalizeImageCode(image.code) === normalizedCode);
    if (alreadyExists) {
      const duplicateError = new Error("DUPLICATE_IMAGE_CODE");
      duplicateError.duplicate_code = normalizedCode;
      throw duplicateError;
    }

    const storedImageUrl = await persistImageAsAssetIfNeeded(payload.image_url);
    const item = {
      id: uid(),
      title: payload.title || normalizedCode,
      code: normalizedCode,
      image_url: storedImageUrl,
      image_hash: String(payload.image_hash || "").trim().toLowerCase() || undefined,
      category_id: payload.category_id,
      is_new: payload.is_new ?? true,
      created_date: nowIso()
    };

    images.push(item);
    writeJson(IMAGE_KEY, images);

    return {
      ...item,
      image_url: await resolveImageUrlForView(item.image_url)
    };
  },
  async delete(id) {
    requireAdmin();
    await ensureImagesReady();

    const images = readJson(IMAGE_KEY, []);
    const image = images.find((item) => item.id === id);
    const nextImages = images.filter((item) => item.id !== id);

    if (image) {
      const assetId = imageUrlToAssetId(image.image_url);
      if (assetId) {
        revokeCachedObjectUrl(assetId);
        await deleteImageAsset(assetId).catch(() => null);
      }
    }

    writeJson(IMAGE_KEY, nextImages);
    return { success: true };
  }
};

const browserLocalClient = {
  siteState: {
    async get() {
      return { ...DEFAULT_SITE_STATE, ...readJson(SITE_STATE_KEY, {}) };
    },
    async update(payload) {
      const nextState = { ...DEFAULT_SITE_STATE, ...readJson(SITE_STATE_KEY, {}), ...payload };
      writeJson(SITE_STATE_KEY, nextState);
      return nextState;
    }
  },
  entities: {
    Category: CategoryEntity,
    PortfolioImage: PortfolioImageEntity
  },
  integrations: {
    Core: {
      async UploadFile({ file }) {
        const originalDataUrl = await toDataUrl(file);
        const file_url = await optimizeImageDataUrl(file, originalDataUrl);
        return { file_url };
      },
      async ClassifyImageCategory({ image_data_url, focus_image_data_url, file_name, categories }) {
        const response = await fetch("/api/classify-category", {
          method: "POST",
          headers: {
            "Content-Type": "application/json"
          },
          body: JSON.stringify({
            image_data_url,
            focus_image_data_url,
            file_name,
            categories
          })
        });

        let payload = null;
        try {
          payload = await response.json();
        } catch (_err) {
          payload = null;
        }

        if (!response.ok) {
          throw new Error(payload?.error || "AI_CLASSIFICATION_FAILED");
        }

        return payload;
      },
      async SendEmail(_payload) {
        return { success: true };
      }
    }
  },
  auth: {
    async loginWithGoogleCredential({ credential }) {
      void credential;
      throw new Error("GOOGLE_LOGIN_DISABLED");
    },
    async login({ email, password }) {
      assertAdminLoginAllowed();

      if (!ADMIN_EMAIL || !ADMIN_PASSWORD) {
        throw new Error("ADMIN_CREDENTIALS_NOT_CONFIGURED");
      }

      const normalizedEmail = String(email || "")
        .trim()
        .toLowerCase();
      const normalizedPassword = String(password || "").trim();

      if (normalizedEmail !== ADMIN_EMAIL || normalizedPassword !== ADMIN_PASSWORD) {
        const lockError = registerAdminLoginFailure();
        if (lockError) throw lockError;
        throw new Error("INVALID_ADMIN_CREDENTIALS");
      }

      const session = createAdminSession({
        id: "local-admin",
        name: "Admin",
        email: ADMIN_EMAIL,
        provider: "local"
      });

      writeJson(ADMIN_SESSION_KEY, session);
      clearAdminLoginRateLimit();

      return {
        id: session.id,
        role: session.role,
        name: session.name,
        email: session.email
      };
    },
    async me() {
      if (!isAdminEnabled()) return null;
      const session = readAdminSession();
      if (!session) return null;
      return {
        id: session.id,
        role: session.role,
        name: session.name,
        email: session.email
      };
    },
    logout() {
      clearAdminSession();
    },
    isAdminEnabled() {
      return isAdminEnabled();
    },
    redirectToLogin() {
      if (typeof window !== "undefined") {
        window.location.assign("/#/admingustavoif/login");
      }
    }
  }
};
const storageModeEnv = String(import.meta.env.VITE_STORAGE_MODE || "").trim().toLowerCase();
const runtimeHost = typeof window !== "undefined" ? String(window.location.hostname || "").toLowerCase() : "";
const looksLikeHostinger = runtimeHost.endsWith(".hostingersite.com") || runtimeHost === "imagemfit.com.br" || runtimeHost.endsWith(".imagemfit.com.br");
const useServerStorage = storageModeEnv === "server" || (storageModeEnv !== "local" && looksLikeHostinger);

export const localClient = useServerStorage ? buildServerClient({ fallbackClient: browserLocalClient }) : browserLocalClient;


