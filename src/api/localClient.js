import seedCatalog from "@/data/seedCatalog.json";

const CATEGORY_KEY = "ifq_categories";

const IMAGE_KEY = "ifq_images";
const SEEDED_KEY = "ifq_seeded_v1";
const CATALOG_SEED_MIGRATION_KEY = "ifq_catalog_seed_migrated_v1";
const CATEGORY_MIGRATION_KEY = "ifq_categories_migrated_v4";
const IMAGE_ASSET_MIGRATION_KEY = "ifq_image_assets_migrated_v1";
const ADMIN_SESSION_KEY = "ifq_admin_session";

const ADMIN_SESSION_TTL_MS = 1000 * 60 * 60 * 12;
const ADMIN_EMAIL = (import.meta.env.VITE_ADMIN_EMAIL || "admin@imagemfit.local").trim().toLowerCase();
const ADMIN_PASSWORD = import.meta.env.VITE_ADMIN_PASSWORD || "";
const GOOGLE_CLIENT_ID = (import.meta.env.VITE_GOOGLE_CLIENT_ID || "").trim();
const ADMIN_GOOGLE_EMAIL = (import.meta.env.VITE_ADMIN_GOOGLE_EMAIL || ADMIN_EMAIL).trim().toLowerCase();

const MAX_UPLOAD_DIMENSION = 1600;
const UPLOAD_WEBP_QUALITY = 0.82;

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
  { name: "Abstrato Pintura e Aquarela", description: "Abstratos com pinceladas expressivas e leveza de aquarela." },
  { name: "Animais", description: "Temas de fauna para dar personalidade e vida \u00e0 decora\u00e7\u00e3o." },
  { name: "\u00c1rvores", description: "Obras com \u00e1rvores e elementos naturais para ambientes acolhedores." },
  { name: "Cozinha", description: "Quadros pensados para cozinhas e espa\u00e7os gourmet." },
  { name: "Diversos", description: "Sele\u00e7\u00e3o variada de estilos e temas para todos os gostos." },
  { name: "Espelhos", description: "Pe\u00e7as com espelhos para ampliar e valorizar o ambiente." },
  { name: "Espiritualidade", description: "Temas de f\u00e9, energia e espiritualidade para ambientes de paz." },
  { name: "Flores e Folhas", description: "Composi\u00e7\u00f5es bot\u00e2nicas com delicadeza e frescor natural." },
  { name: "Frases", description: "Quadros com frases inspiradoras e mensagens decorativas." },
  { name: "Infantil", description: "Arte l\u00fadica e delicada para quartos e espa\u00e7os infantis." },
  { name: "Mar e Praia", description: "Paisagens mar\u00edtimas e clima praiano para ambientes leves." },
  { name: "Natureza", description: "Paisagens e elementos naturais para ambientes leves." },
  { name: "Pinturas Manuais", description: "Obras autorais com toque artesanal e acabamento exclusivo." },
  { name: "Ponte", description: "Tem\u00e1tica de pontes e arquitetura urbana em diferentes estilos." },
  { name: "Tridimensional", description: "Pe\u00e7as com profundidade, relevo e textura para destaque visual." },
  { name: "Urbano", description: "Refer\u00eancias de cidade, arquitetura e estilo contempor\u00e2neo." },
  { name: "Vida", description: "Obras que celebram movimento, cotidiano e express\u00f5es da vida." }
];

let imageAssetDbPromise = null;
let imageAssetsMigrationPromise = null;
const imageAssetObjectUrlCache = new Map();
let imageAssetCleanupRegistered = false;

const nowIso = () => new Date().toISOString();

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

const normalizeCategoryName = (value) =>
  String(value || "")
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .toLowerCase()
    .trim();

const normalizeDescription = (value) => String(value || "").trim();
const hasBrokenEncoding = (value) => /Ã|Â|�/.test(String(value || ""));
const normalizeImageCode = (value) => String(value || "").trim().replace(/^#+/, "").toUpperCase();

const CATEGORY_DESCRIPTION_ALIASES = {
  "abstrato arquitetonico": "abstrato arquitetônico",
  "abstrato fluido e marmore": "abstrato fluido e mármore",
  "abstrato geometrico": "abstrato geométrico",
  arvores: "árvores",
  pontes: "ponte",
  "pintura manual": "pinturas manuais",
  tridmensional: "tridimensional"
};

const requiredDescriptionByName = new Map(REQUIRED_CATEGORIES.map((category) => [normalizeCategoryName(category.name), category.description]));

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
  const existingNormalizedNames = new Set(categories.map((cat) => normalizeCategoryName(cat.name)));

  let changed = false;
  const enrichedCategories = categories.map((category) => {
    const currentDescription = normalizeDescription(category.description);
    if (currentDescription && !hasBrokenEncoding(currentDescription)) return category;

    const resolvedDescription = resolveCategoryDescription(category.name);
    if (!resolvedDescription) return category;

    changed = true;
    return {
      ...category,
      description: resolvedDescription
    };
  });

  for (const required of REQUIRED_CATEGORIES) {
    const key = normalizeCategoryName(required.name);
    if (!existingNormalizedNames.has(key)) {
      enrichedCategories.push(buildCategory(required.name, enrichedCategories.length, required.description));
      existingNormalizedNames.add(key);
      changed = true;
    }
  }

  if (changed) {
    writeJson(CATEGORY_KEY, enrichedCategories);
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

const optimizeImageDataUrl = async (file, originalDataUrl) => {
  const mimeType = String(file?.type || "").toLowerCase();
  if (!mimeType.startsWith("image/")) return originalDataUrl;
  if (mimeType.includes("svg") || mimeType.includes("gif")) return originalDataUrl;

  try {
    const image = await loadImageElement(originalDataUrl);
    const ratio = Math.min(1, MAX_UPLOAD_DIMENSION / Math.max(image.width, 1), MAX_UPLOAD_DIMENSION / Math.max(image.height, 1));
    const targetWidth = Math.max(1, Math.round(image.width * ratio));
    const targetHeight = Math.max(1, Math.round(image.height * ratio));

    const canvas = document.createElement("canvas");
    canvas.width = targetWidth;
    canvas.height = targetHeight;

    const context = canvas.getContext("2d");
    if (!context) return originalDataUrl;
    context.drawImage(image, 0, 0, targetWidth, targetHeight);

    const compressedDataUrl = canvas.toDataURL("image/webp", UPLOAD_WEBP_QUALITY);
    if (typeof compressedDataUrl !== "string" || compressedDataUrl.length === 0) return originalDataUrl;
    return compressedDataUrl.length < originalDataUrl.length ? compressedDataUrl : originalDataUrl;
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
  const session = readJson(ADMIN_SESSION_KEY, null);
  if (!session) return null;

  const expiresAtMs = Date.parse(session.expires_at || "");
  if (!Number.isNaN(expiresAtMs) && expiresAtMs <= Date.now()) {
    localStorage.removeItem(ADMIN_SESSION_KEY);
    return null;
  }

  return session;
};

const requireAdmin = () => {
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
    return sortBy(categories, sort).slice(0, limit);
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
    return item;
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
    return updated;
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

export const localClient = {
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
      if (!GOOGLE_CLIENT_ID) {
        throw new Error("GOOGLE_NOT_CONFIGURED");
      }

      const payload = parseGoogleCredential(credential);
      const normalizedEmail = String(payload?.email || "").trim().toLowerCase();
      const emailVerified = payload?.email_verified === true;

      if (!normalizedEmail || !emailVerified) {
        throw new Error("INVALID_GOOGLE_CREDENTIAL");
      }

      if (payload?.aud && payload.aud !== GOOGLE_CLIENT_ID) {
        throw new Error("GOOGLE_CLIENT_ID_MISMATCH");
      }

      if (normalizedEmail !== ADMIN_GOOGLE_EMAIL) {
        throw new Error("UNAUTHORIZED_GOOGLE_EMAIL");
      }

      const session = {
        id: String(payload?.sub || "google-admin"),
        role: "admin",
        name: payload?.name || "Admin",
        email: normalizedEmail,
        provider: "google",
        created_date: nowIso(),
        expires_at: new Date(Date.now() + ADMIN_SESSION_TTL_MS).toISOString()
      };

      writeJson(ADMIN_SESSION_KEY, session);

      return {
        id: session.id,
        role: session.role,
        name: session.name,
        email: session.email
      };
    },
    async login({ email, password }) {
      const normalizedEmail = String(email || "").trim().toLowerCase();
      const normalizedPassword = String(password || "");

      if (!ADMIN_PASSWORD) {
        throw new Error("ADMIN_PASSWORD_NOT_CONFIGURED");
      }

      if (normalizedEmail !== ADMIN_EMAIL || normalizedPassword !== ADMIN_PASSWORD) {
        throw new Error("INVALID_CREDENTIALS");
      }

      const session = {
        id: "local-admin",
        role: "admin",
        name: "Admin Local",
        email: normalizedEmail,
        created_date: nowIso(),
        expires_at: new Date(Date.now() + ADMIN_SESSION_TTL_MS).toISOString()
      };

      writeJson(ADMIN_SESSION_KEY, session);

      return {
        id: session.id,
        role: session.role,
        name: session.name,
        email: session.email
      };
    },
    async me() {
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
      localStorage.removeItem(ADMIN_SESSION_KEY);
    },
    redirectToLogin() {
      if (typeof window !== "undefined") {
        window.location.assign("/admin/login");
      }
    }
  }
};



