import { withDisplayCategory } from "@/utils/categoryText";

const ADMIN_BASE_PATH = "/admingustavoif";
const SITE_STATE_CATEGORY_NAME = "__ifq_site_state__";
const DEFAULT_SITE_STATE = Object.freeze({
  paused: false,
  headline: "Portfólio em atualização",
  message: "Estamos atualizando algumas categorias do portfólio. Volte em instantes ou fale conosco pelo WhatsApp.",
  cta_label: "Falar no WhatsApp",
  cta_url: "https://wa.me/5547999273809"
});

const MAX_UPLOAD_DIMENSION = 1600;
const UPLOAD_DIMENSION_LARGE = 1440;
const UPLOAD_DIMENSION_XLARGE = 1280;
const UPLOAD_TARGET_BYTES = 850_000;
const UPLOAD_WEBP_QUALITY_STEPS = [0.82, 0.76, 0.7, 0.64];

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

const withQuery = (path, params = {}) => {
  const search = new URLSearchParams();
  for (const [key, value] of Object.entries(params)) {
    if (value === undefined || value === null || value === "") continue;
    search.set(key, String(value));
  }
  const query = search.toString();
  return query ? `${path}?${query}` : path;
};

const parseJsonResponse = async (response) => {
  const text = await response.text();
  if (!text) return null;
  try {
    return JSON.parse(text);
  } catch (_err) {
    return null;
  }
};

const apiRequest = async (path, { method = "GET", body } = {}) => {
  const response = await fetch(path, {
    method,
    credentials: "include",
    headers: {
      "Content-Type": "application/json"
    },
    body: body !== undefined ? JSON.stringify(body) : undefined
  });

  const payload = await parseJsonResponse(response);
  if (!response.ok) {
    const error = new Error(payload?.error || `HTTP_${response.status}`);
    error.status = response.status;
    if (payload && typeof payload === "object") {
      Object.assign(error, payload);
    }
    throw error;
  }
  return payload;
};

const normalizeImageCode = (value) => String(value || "").trim().replace(/^#+/, "").toUpperCase();
const normalizeSiteText = (value, fallback, max = 220) => {
  const text = String(value || "").trim();
  if (!text) return fallback;
  return text.slice(0, max);
};
const normalizeSiteState = (value = {}) => ({
  paused: Boolean(value?.paused),
  headline: normalizeSiteText(value?.headline, DEFAULT_SITE_STATE.headline, 120),
  message: normalizeSiteText(value?.message, DEFAULT_SITE_STATE.message, 260),
  cta_label: normalizeSiteText(value?.cta_label, DEFAULT_SITE_STATE.cta_label, 40),
  cta_url: normalizeSiteText(value?.cta_url, DEFAULT_SITE_STATE.cta_url, 260)
});
const parseSiteStateDescription = (description) => {
  try {
    return normalizeSiteState(JSON.parse(String(description || "{}")));
  } catch (_error) {
    return { ...DEFAULT_SITE_STATE };
  }
};

export function buildServerClient({ fallbackClient }) {
  const listRawCategories = async () => {
    const categories = await apiRequest(withQuery("/api/categories", { sort: "order", limit: 500 }));
    return Array.isArray(categories) ? categories : [];
  };

  return {
    siteState: {
      async get() {
        const categories = await listRawCategories();
        const stateCategory = categories.find((category) => String(category?.name || "").trim() === SITE_STATE_CATEGORY_NAME);
        if (!stateCategory) return { ...DEFAULT_SITE_STATE };
        return parseSiteStateDescription(stateCategory.description);
      },
      async update(payload) {
        const categories = await listRawCategories();
        const stateCategory = categories.find((category) => String(category?.name || "").trim() === SITE_STATE_CATEGORY_NAME);
        const currentState = stateCategory ? parseSiteStateDescription(stateCategory.description) : { ...DEFAULT_SITE_STATE };
        const nextState = normalizeSiteState({ ...currentState, ...payload });

        if (stateCategory?.id) {
          await apiRequest(`/api/categories/${stateCategory.id}`, {
            method: "PATCH",
            body: {
              description: JSON.stringify(nextState),
              cover_enabled: false
            }
          });
        } else {
          await apiRequest("/api/categories", {
            method: "POST",
            body: {
              name: SITE_STATE_CATEGORY_NAME,
              description: JSON.stringify(nextState),
              cover_enabled: false,
              order: 9999
            }
          });
        }

        return nextState;
      }
    },
    entities: {
      Category: {
        async list(sort = "order", limit = 100) {
          const categories = await apiRequest(withQuery("/api/categories", { sort, limit }));
          if (!Array.isArray(categories)) return [];
          return categories
            .filter((category) => String(category?.name || "").trim() !== SITE_STATE_CATEGORY_NAME)
            .map((category) => withDisplayCategory(category));
        },
        async create(payload) {
          const created = await apiRequest("/api/categories", { method: "POST", body: payload });
          return withDisplayCategory(created);
        },
        async update(id, payload) {
          const updated = await apiRequest(`/api/categories/${id}`, { method: "PATCH", body: payload });
          return withDisplayCategory(updated);
        },
        async delete(id) {
          return apiRequest(`/api/categories/${id}`, { method: "DELETE" });
        }
      },
      PortfolioImage: {
        async list(sort = "-created_date", limit = 100) {
          return apiRequest(withQuery("/api/images", { sort, limit }));
        },
        async filter(filters = {}, sort = "-created_date", limit = 100) {
          return apiRequest(withQuery("/api/images", { ...filters, sort, limit }));
        },
        async filterPage(filters = {}, sort = "-created_date", page = 1, pageSize = 35) {
          return apiRequest(withQuery("/api/images", { ...filters, sort, page, page_size: pageSize }));
        },
        async groupedByCategory(sort = "-created_date", limitPerCategory = 8, categoryIds = []) {
          return apiRequest("/api/images/grouped", {
            method: "POST",
            body: {
              sort,
              limit_per_category: limitPerCategory,
              category_ids: categoryIds
            }
          });
        },
        async create(payload) {
          const normalizedCode = normalizeImageCode(payload.code || payload.title);
          if (!normalizedCode) throw new Error("INVALID_IMAGE_CODE");
          return apiRequest("/api/images", {
            method: "POST",
            body: {
              ...payload,
              code: normalizedCode,
              title: payload.title || normalizedCode
            }
          });
        },
        async delete(id) {
          return apiRequest(`/api/images/${id}`, { method: "DELETE" });
        }
      }
    },
    integrations: {
      Core: {
        async UploadFile({ file, code }) {
          const originalDataUrl = await toDataUrl(file);
          const optimized = await optimizeImageDataUrl(file, originalDataUrl);
          return apiRequest("/api/uploads/base64", {
            method: "POST",
            body: {
              data_url: optimized,
              file_name: file?.name || "imagem",
              code: normalizeImageCode(code || file?.name || "")
            }
          });
        },
        async ClassifyImageCategory({ image_data_url, focus_image_data_url, file_name, categories }) {
          return apiRequest("/api/classify-category", {
            method: "POST",
            body: {
              image_data_url,
              focus_image_data_url,
              file_name,
              categories
            }
          });
        },
        async SendEmail(payload) {
          return fallbackClient.integrations.Core.SendEmail(payload);
        }
      }
    },
    auth: {
      async loginWithGoogleCredential({ credential }) {
        void credential;
        throw new Error("GOOGLE_LOGIN_DISABLED");
      },
      async login({ email, password }) {
        return apiRequest("/api/admin/login", {
          method: "POST",
          body: { email, password }
        });
      },
      async me() {
        try {
          return await apiRequest("/api/admin/me");
        } catch (error) {
          if (error?.status === 401 || error?.status === 403) return null;
          throw error;
        }
      },
      async logout() {
        try {
          await apiRequest("/api/admin/logout", { method: "POST", body: {} });
        } catch (_err) {
          // ignore logout network errors
        }
      },
      isAdminEnabled() {
        const envValue = String(import.meta.env.VITE_ENABLE_ADMIN || "").trim().toLowerCase();
        if (envValue === "true") return true;
        if (envValue === "false") return false;
        return true;
      },
      redirectToLogin() {
        if (typeof window !== "undefined") {
          window.location.assign(`/#${ADMIN_BASE_PATH}/login`);
        }
      }
    }
  };
}
